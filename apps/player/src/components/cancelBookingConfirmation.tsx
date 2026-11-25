import { cancelBooking } from '../api/bookings'
import type { Game } from '../api/types'
import { relativeDayLabel } from '../lib/dates'
import type { Confirmation } from './ConfirmSheet'

/** Cancelling the booking cancels the game behind it; everybody invited loses it too. */
export const cancelBookingConfirmation = (game: Game, onCancelled: () => void): Confirmation => ({
  title: 'Cancel this booking?',
  message: (
    <>
      {game.court.name} at {game.center.name}, {relativeDayLabel(game.date)}{' '}
      <span className="text-white tnum">{game.startsAt}–{game.endsAt}</span>.
      The court goes back to everyone else and the game is gone for everyone in it.
    </>
  ),
  confirmLabel: 'Yes, cancel it',
  workingLabel: 'Cancelling…',
  onConfirm: async () => {
    await cancelBooking(game.bookingId)
    onCancelled()
  },
})
