import { useState } from 'react'
import type { CenterDetails } from '../api/types'
import { Button } from '../components/Button'
import { CourtScheduleCard } from '../components/CourtScheduleCard'
import { DayStrip } from '../components/DayStrip'
import { ErrorNotice } from '../components/ErrorNotice'
import { useDayBookings } from '../hooks/useDayBookings'
import { bookingCountLabel, groupBookingsByCourt } from '../lib/bookingSchedule'
import { formatLongDate, isoWeekday, todayIso } from '../lib/dates'

export function Bookings({ center }: { center: CenterDetails }) {
  const [selectedDate, setSelectedDate] = useState(todayIso)
  const { state, retry } = useDayBookings(selectedDate)
  const isClosed = !center.openingIntervals.some((interval) => interval.weekday === isoWeekday(selectedDate))

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h1 className="font-display text-[30px] font-semibold leading-tight">Bookings</h1>
          <p className="mt-1.5 text-[14.5px] text-muted">
            {formatLongDate(selectedDate)}
            {isClosed && ' · closed this day'}
          </p>
        </div>
        {state.status === 'ready' && (
          <span className="tnum font-display text-[22px] font-semibold text-accent-dark">
            {bookingCountLabel(state.data.length)}
          </span>
        )}
      </header>

      <DayStrip selectedDate={selectedDate} onSelect={setSelectedDate} />

      {state.status === 'loading' && <p className="py-6 text-[14.5px] text-muted">Loading bookings…</p>}
      {state.status === 'failed' && (
        <div className="max-w-xl space-y-4">
          <ErrorNotice message={state.message} />
          <Button variant="secondary" onClick={retry}>
            Try again
          </Button>
        </div>
      )}
      {state.status === 'ready' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groupBookingsByCourt(center.courts, state.data).map((courtSchedule) => (
            <CourtScheduleCard key={courtSchedule.court.id} schedule={courtSchedule} />
          ))}
        </div>
      )}
    </div>
  )
}
