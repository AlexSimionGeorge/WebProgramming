import { motion } from 'framer-motion'
import { getGame } from '../api/games'
import type { PlayerBooking } from '../api/types'
import { Button } from '../components/Button'
import { SeatCells } from '../components/SeatCells'
import { relativeDayLabel } from '../lib/dates'
import { spring } from '../lib/motion'
import { useRemote } from '../lib/useRemote'

type ReceiptScreenProps = {
  booking: PlayerBooking
  onInvite: () => void
  onDone: () => void
}

/**
 * What was just booked, on the whole screen: the hour, the day, the centre, the court and the four
 * seats. Data only, and exactly two ways out — invite the players, or be done.
 */
export function ReceiptScreen({ booking, onInvite, onDone }: ReceiptScreenProps) {
  const game = useRemote((signal) => getGame(booking.gameId, signal), [booking.gameId])

  return (
    <div className="flex h-full flex-col bg-bg" role="dialog" aria-modal="true" aria-label="Booked">
      <div className="min-h-0 flex-1 overflow-y-auto noscroll px-6" style={{ paddingTop: 'var(--screen-top)' }}>
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...spring, delay: 0.05 }}
          className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary"
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="#fff" strokeWidth={3}
            strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </motion.div>

        <div className="mt-5 text-center">
          <div className="font-display text-[52px] leading-none tnum">{booking.startsAt}</div>
          <div className="mt-1.5 text-[14px] text-muted tnum">until {booking.endsAt}</div>
          <div className="mt-4 text-[16px]">{relativeDayLabel(booking.date)}</div>
          <div className="mt-1 text-[15px] text-white">{booking.center.name}</div>
          <div className="mt-0.5 text-[13px] text-muted">{booking.court.name} · {booking.center.city}</div>
        </div>

        <div className="mt-8 rounded-2xl border border-line bg-surface p-3">
          {game.status === 'ready' ? (
            <SeatCells seats={game.data.seats} />
          ) : (
            <div className="grid grid-cols-4 gap-1.5" aria-hidden>
              {[1, 2, 3, 4].map((seat) => (
                <div key={seat} className={`h-[38px] rounded-lg bg-elevated ${game.status === 'loading' ? 'animate-pulse' : ''}`} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 space-y-3 px-6 pt-4" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 22px)' }}>
        <Button onClick={onInvite}>Invite your players</Button>
        <Button variant="quiet" onClick={onDone}>Done</Button>
      </div>
    </div>
  )
}
