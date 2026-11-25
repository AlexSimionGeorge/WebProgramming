import type { AdminBooking, Court } from '../api/types'
import { minutesSinceMidnight } from './time'

export type CourtSchedule = { court: Court; bookings: AdminBooking[] }

export function groupBookingsByCourt(courts: readonly Court[], bookings: readonly AdminBooking[]): CourtSchedule[] {
  const byStartTime = [...bookings].sort(
    (first, second) => minutesSinceMidnight(first.startsAt) - minutesSinceMidnight(second.startsAt),
  )
  const knownCourtIds = new Set(courts.map((court) => court.id))
  const formerCourts = uniqueCourts(byStartTime.map((booking) => booking.court).filter((court) => !knownCourtIds.has(court.id)))

  return [...courts, ...formerCourts].map((court) => ({
    court,
    bookings: byStartTime.filter((booking) => booking.court.id === court.id),
  }))
}

function uniqueCourts(courts: readonly Court[]): Court[] {
  return [...new Map(courts.map((court) => [court.id, court])).values()]
}

export function bookingCountLabel(count: number): string {
  return count === 1 ? '1 booking' : `${count} bookings`
}

export const SEATS_PER_GAME = 4

export function playerNames(booking: AdminBooking): string[] {
  const seatedPlayers = booking.players ?? []
  return seatedPlayers.length > 0 ? seatedPlayers.map((person) => person.displayName) : [booking.player.displayName]
}

export function openSeatsLabel(filledSeatCount: number): string | null {
  const openSeatCount = SEATS_PER_GAME - filledSeatCount
  return openSeatCount > 0 ? `+ ${openSeatCount} open` : null
}
