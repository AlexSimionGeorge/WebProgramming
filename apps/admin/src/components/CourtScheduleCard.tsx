import { bookingCountLabel, type CourtSchedule } from '../lib/bookingSchedule'

export function CourtScheduleCard({ schedule }: { schedule: CourtSchedule }) {
  const { court, bookings } = schedule
  return (
    <section className="rounded-2xl border border-line bg-surface/60 p-4">
      <header className="flex items-baseline justify-between gap-3 pb-2">
        <h3 className="font-display text-[18px] font-semibold">{court.name}</h3>
        {bookings.length > 0 && <span className="tnum text-[13px] text-accent-dark">{bookingCountLabel(bookings.length)}</span>}
      </header>
      {bookings.length === 0 ? (
        <p className="py-2 text-[14px] text-muted">No bookings</p>
      ) : (
        <ul className="divide-y divide-line">
          {bookings.map((booking) => (
            <li key={booking.id} className="grid grid-cols-[6.5rem_1fr] gap-3 py-2.5">
              <span className="tnum pt-px text-[14.5px] font-semibold">
                {booking.startsAt}–{booking.endsAt}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[14.5px]">{booking.player.displayName}</span>
                <a href={`mailto:${booking.player.email}`} className="block truncate text-[13px] text-muted hover:text-primary-fg">
                  {booking.player.email}
                </a>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
