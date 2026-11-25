import { motion } from 'framer-motion'
import type { GameSeat } from '../api/types'
import { spring } from '../lib/motion'
import { packLeft, seatDescription, seatKey, seatName } from '../lib/seats'

/**
 * The four seats as four cells, packed left, at card size. Empty seats are always drawn and say
 * "Open"; an invited seat carries the person's name, a small ring and the word "Invited".
 */
export function SeatCells({ seats }: { seats: readonly GameSeat[] }) {
  return (
    <div className="grid grid-cols-4 gap-1.5" role="list" aria-label="Seats">
      {packLeft(seats).map((seat) => (
        <SeatCell key={seatKey(seat)} seat={seat} />
      ))}
    </div>
  )
}

const cellSkins: Record<GameSeat['status'], string> = {
  filled: 'border-[#2d363e] bg-elevated text-[#d4dae0]',
  invited: 'border-line text-soft',
  empty: 'border-dashed border-line text-faint',
}

function SeatCell({ seat }: { seat: GameSeat }) {
  const invited = seat.status === 'invited'
  return (
    <motion.div
      layout
      transition={spring}
      role="listitem"
      aria-label={seatDescription(seat)}
      className={`relative flex h-[38px] min-w-0 flex-col items-center justify-center rounded-lg border px-1.5 ${cellSkins[seat.status]}`}
    >
      <span className="w-full truncate text-center text-[11.5px] leading-tight">{seatName(seat)}</span>
      {invited && <span className="text-[9.5px] leading-tight text-muted">Invited</span>}
      {invited && <InvitedRing className="absolute top-[4px] right-[4px]" />}
    </motion.div>
  )
}

/** The pending mark: an outlined ring, never a filled dot, so it reads as "not yet". */
export function InvitedRing({ className = '' }: { className?: string }) {
  return <span aria-hidden className={`h-[6px] w-[6px] rounded-full border border-primary-fg ${className}`} />
}
