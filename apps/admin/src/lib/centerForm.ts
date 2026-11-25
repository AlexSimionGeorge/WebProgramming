import type { CenterConfiguration, CenterDetails, SlotMinutes } from '../api/types'
import {
  defaultSchedule,
  intervalsFromSchedule,
  scheduleFromIntervals,
  sortedByOpening,
  type WeeklySchedule,
} from './weeklySchedule'

export const MIN_COURTS = 1
export const MAX_COURTS = 20

export const SLOT_LENGTH_OPTIONS: readonly { value: SlotMinutes; label: string }[] = [
  { value: 60, label: '60 min' },
  { value: 90, label: '90 min' },
  { value: 120, label: '120 min' },
]

export type CenterForm = Omit<CenterConfiguration, 'openingIntervals'> & { schedule: WeeklySchedule }

export type CenterFieldErrors = Partial<Record<'name' | 'address' | 'city', string>>

export function initialCenterForm(center: CenterDetails | null): CenterForm {
  if (!center) {
    return { name: '', address: '', city: '', courtCount: 4, slotMinutes: 90, schedule: defaultSchedule() }
  }
  const { name, address, city, courtCount, slotMinutes, openingIntervals } = center
  return { name, address, city, courtCount, slotMinutes, schedule: scheduleFromIntervals(sortedByOpening(openingIntervals)) }
}

export function validateCenterFields(form: CenterForm): CenterFieldErrors {
  const errors: CenterFieldErrors = {}
  if (!form.name.trim()) errors.name = 'Give the centre a name.'
  if (!form.address.trim()) errors.address = 'Players need an address to find you.'
  if (!form.city.trim()) errors.city = 'Add the city.'
  return errors
}

export function configurationFromForm({ schedule, ...form }: CenterForm): CenterConfiguration {
  return {
    ...form,
    name: form.name.trim(),
    address: form.address.trim(),
    city: form.city.trim(),
    openingIntervals: sortedByOpening(intervalsFromSchedule(schedule)),
  }
}
