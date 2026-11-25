import type { AdminBooking } from '../api/types'
import { openSeatsLabel, playerNames } from '../lib/bookingSchedule'

export function BookingPlayers({ booking }: { booking: AdminBooking }) {
  const names = playerNames(booking)
  const openSeats = openSeatsLabel(names.length)
  return (
    <span className="block truncate text-[14.5px]">
      {names.join(', ')}
      {openSeats && <span className="text-[13px] text-muted"> {openSeats}</span>}
    </span>
  )
}
