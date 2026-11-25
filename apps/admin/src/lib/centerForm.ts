import type { CenterConfiguration, CenterDetails, SlotMinutes } from '../api/types'

export const MIN_COURTS = 1
export const MAX_COURTS = 20

export const SLOT_LENGTH_OPTIONS: readonly { value: SlotMinutes; label: string }[] = [
  { value: 60, label: '60 min' },
  { value: 90, label: '90 min' },
  { value: 120, label: '120 min' },
]

export type CenterFieldErrors = Partial<Record<'name' | 'address' | 'city', string>>

export function initialConfiguration(center: CenterDetails | null): CenterConfiguration {
  if (center) {
    const { name, address, city, courtCount, slotMinutes, openingIntervals } = center
    return { name, address, city, courtCount, slotMinutes, openingIntervals }
  }
  return { name: '', address: '', city: '', courtCount: 4, slotMinutes: 90, openingIntervals: [] }
}

export function validateCenterFields(configuration: CenterConfiguration): CenterFieldErrors {
  const errors: CenterFieldErrors = {}
  if (!configuration.name.trim()) errors.name = 'Give the centre a name.'
  if (!configuration.address.trim()) errors.address = 'Players need an address to find you.'
  if (!configuration.city.trim()) errors.city = 'Add the city.'
  return errors
}

export function trimConfiguration(configuration: CenterConfiguration): CenterConfiguration {
  return {
    ...configuration,
    name: configuration.name.trim(),
    address: configuration.address.trim(),
    city: configuration.city.trim(),
  }
}
