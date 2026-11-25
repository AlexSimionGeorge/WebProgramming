import { useState } from 'react'
import { cancelBooking } from '../api/bookings'
import { describeError } from '../api/errorMessage'
import type { PlayerBooking } from '../api/types'
import { relativeDayLabel } from '../lib/dates'
import { Button } from './Button'
import { Sheet } from './Sheet'

type CancelBookingSheetProps = {
  booking: PlayerBooking | null
  onClose: () => void
  onCancelled: () => void
}

export function CancelBookingSheet({ booking, onClose, onCancelled }: CancelBookingSheetProps) {
  const [cancelling, setCancelling] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  const close = () => {
    setProblem(null)
    onClose()
  }

  const confirm = async (target: PlayerBooking) => {
    setCancelling(true)
    setProblem(null)
    try {
      await cancelBooking(target.id)
      onCancelled()
    } catch (error) {
      setProblem(describeError(error))
    } finally {
      setCancelling(false)
    }
  }

  return (
    <Sheet open={booking !== null} onClose={close} dismissible={!cancelling} label="Cancel booking">
      {booking && (
        <div className="pt-2">
          <h2 className="font-display text-[26px] leading-tight">Cancel this booking?</h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
            {booking.court.name} at {booking.center.name}, {relativeDayLabel(booking.date)}{' '}
            <span className="text-white tnum">{booking.startsAt}–{booking.endsAt}</span>.
            The court goes back to everyone else.
          </p>
          <div className="flex min-h-[42px] items-center pt-2" aria-live="polite">
            {problem && <p className="text-[13.5px] leading-snug text-warm">{problem}</p>}
          </div>
          <div className="space-y-3">
            <Button onClick={() => void confirm(booking)} disabled={cancelling}>
              {cancelling ? 'Cancelling…' : 'Yes, cancel it'}
            </Button>
            <Button variant="quiet" onClick={close} disabled={cancelling}>Keep it</Button>
          </div>
        </div>
      )}
    </Sheet>
  )
}
