import type { CenterSummary, CityAvailability, Court, Slot } from '../api/types'
import { hasPassed, minutesOfDay } from './dates'

/** One thing the player can book: a centre's slot with at least one court free. */
export type ReserveOption = {
  center: CenterSummary
  courts: Court[]
  slot: Slot
}

export type RankedOption = ReserveOption & {
  /** Minutes from the cursor to the slot's start; negative means earlier. */
  offsetMinutes: number
}

/** How far either side of the cursor still counts as "around" it before plain distance takes over. */
const NEAR_MINUTES = 60

/** Every bookable option of the day across the city. Full and already-started slots are not options. */
export function listOptions(city: CityAvailability, now = new Date()): ReserveOption[] {
  return city.centers.flatMap(({ center, courts, slots }) =>
    slots
      .filter((slot) => slot.freeCourtIds.length > 0 && !hasPassed(city.date, slot.startsAt, now))
      .map((slot) => ({ center, courts, slot })),
  )
}

/**
 * The cursor is a best-fit centre, never a cut-off: nothing is dropped, only ordered.
 *  1. the exact start
 *  2. starts after the cursor, climbing away (within the hour)
 *  3. starts before it, stepping back down (within the hour)
 *  4. everything else, by plain distance
 * Later before earlier, because a half-planned game moves later more easily than earlier.
 * Pure and synchronous — it runs on every tick of a drag.
 */
export function rankOptions(options: ReserveOption[], cursor: string): RankedOption[] {
  const cursorMinutes = minutesOfDay(cursor)
  return options
    .map((option) => ({ ...option, offsetMinutes: minutesOfDay(option.slot.startsAt) - cursorMinutes }))
    .sort(
      (first, second) =>
        rankGroup(first.offsetMinutes) - rankGroup(second.offsetMinutes) ||
        orderWithinGroup(first.offsetMinutes, second.offsetMinutes) ||
        second.slot.freeCourtIds.length - first.slot.freeCourtIds.length ||
        first.center.name.localeCompare(second.center.name),
    )
}

function rankGroup(offsetMinutes: number): number {
  if (offsetMinutes === 0) return 0
  if (offsetMinutes > 0 && offsetMinutes <= NEAR_MINUTES) return 1
  if (offsetMinutes < 0 && offsetMinutes >= -NEAR_MINUTES) return 2
  return 3
}

/** Closer first; at an equal distance the later start wins, as it does between the groups. */
function orderWithinGroup(first: number, second: number): number {
  return Math.abs(first) - Math.abs(second) || second - first
}

/** "30 min later", "1h 30m earlier" — said only when an option does not start at the cursor. */
export function describeOffset(offsetMinutes: number): string | null {
  if (offsetMinutes === 0) return null
  const distance = Math.abs(offsetMinutes)
  const hours = Math.floor(distance / 60)
  const minutes = distance % 60
  const amount = hours === 0 ? `${minutes} min` : minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
  return `${amount} ${offsetMinutes > 0 ? 'later' : 'earlier'}`
}
