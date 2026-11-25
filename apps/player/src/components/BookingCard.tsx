import { motion } from 'framer-motion'
import type { PlayerBooking } from '../api/types'
import { shortDateLabel } from '../lib/dates'
import { riseIn } from '../lib/motion'
import { Press } from './Press'

type BookingCardProps = {
  booking: PlayerBooking
  index: number
  past?: boolean
  inProgress?: boolean
  onCancel?: () => void
}

export function BookingCard({ booking, index, past = false, inProgress = false, onCancel }: BookingCardProps) {
  return (
    <motion.div
      {...riseIn(index)}
      className={`flex items-center gap-4 rounded-2xl border px-5 ${
        past ? 'border-line/60 bg-surface/40' : 'border-line bg-surface'
      }`}
      style={{ paddingBlock: 'var(--row-y)' }}
    >
      <div className="w-[64px] shrink-0">
        <div className={`font-display text-[25px] leading-none tnum ${past ? 'text-soft' : 'text-white'}`}>
          {booking.startsAt}
        </div>
        <div className="mt-1 text-[11px] text-muted tnum">– {booking.endsAt}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] text-muted">{shortDateLabel(booking.date)}</div>
        <div className={`truncate text-[15px] leading-tight ${past ? 'text-soft' : 'text-white'}`}>{booking.center.name}</div>
        <div className="mt-0.5 truncate text-[12px] text-muted">
          {booking.court.name} · {booking.center.city}
        </div>
      </div>
      {inProgress && <span className="shrink-0 text-[12.5px] text-primary-fg">Playing now</span>}
      {onCancel && (
        <Press
          onClick={onCancel}
          className="h-10 shrink-0 rounded-full border border-line px-3.5 text-[13px] text-soft"
        >
          Cancel
        </Press>
      )}
    </motion.div>
  )
}
