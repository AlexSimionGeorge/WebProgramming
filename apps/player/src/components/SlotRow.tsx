import { motion } from 'framer-motion'
import type { Slot } from '../api/types'
import { riseIn } from '../lib/motion'
import { Press } from './Press'

export function SlotRow({ slot, index, onPick }: { slot: Slot; index: number; onPick: () => void }) {
  const freeCourts = slot.freeCourtIds.length
  const full = freeCourts === 0

  return (
    <motion.div {...riseIn(index)}>
      <Press
        soft
        disabled={full}
        onClick={onPick}
        aria-label={full ? `${slot.startsAt}, full` : `${slot.startsAt} to ${slot.endsAt}, ${freeCourts} free`}
        className={`flex w-full items-center gap-4 rounded-2xl border px-5 text-left ${
          full ? 'cursor-default border-line/60 bg-surface/40' : 'border-line bg-surface'
        }`}
        style={{ paddingBlock: 'var(--row-y)' }}
      >
        <div className="flex min-w-0 flex-1 items-baseline gap-2">
          <span className={`font-display text-[25px] leading-none tnum ${full ? 'text-faint' : 'text-white'}`}>
            {slot.startsAt}
          </span>
          <span className={`text-[13px] tnum ${full ? 'text-faint' : 'text-muted'}`}>– {slot.endsAt}</span>
        </div>
        {full ? (
          <span className="text-[13px] text-faint">Full</span>
        ) : (
          <div className="shrink-0 text-right">
            <div className="text-[17px] font-semibold leading-none text-accent-dark tnum">{freeCourts}</div>
            <div className="mt-1 text-[11px] text-muted">{freeCourts === 1 ? 'court free' : 'courts free'}</div>
          </div>
        )}
      </Press>
    </motion.div>
  )
}
