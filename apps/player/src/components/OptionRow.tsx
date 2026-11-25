import { motion } from 'framer-motion'
import { describeOffset, type RankedOption } from '../lib/rankOptions'
import { riseIn, spring } from '../lib/motion'
import { Press } from './Press'

type OptionRowProps = { option: RankedOption; index: number; onPick: () => void }

/** One centre's slot with a court free. It slides to its new rank as the dial moves. */
export function OptionRow({ option, index, onPick }: OptionRowProps) {
  const { center, slot, offsetMinutes } = option
  const freeCourts = slot.freeCourtIds.length
  const offset = describeOffset(offsetMinutes)
  const rise = riseIn(index)

  return (
    <motion.div
      layout="position"
      initial={rise.initial}
      animate={rise.animate}
      transition={{ ...rise.transition, layout: spring }}
    >
      <Press
        soft
        onClick={onPick}
        aria-label={`${center.name}, ${slot.startsAt} to ${slot.endsAt}, ${freeCourts} free`}
        className="flex w-full items-center gap-4 rounded-2xl border border-line bg-surface px-5 text-left"
        style={{ paddingBlock: 'var(--row-y)' }}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[22px] leading-none tnum">{slot.startsAt}</span>
            <span className="text-[13px] text-muted tnum">– {slot.endsAt}</span>
            {offset && <span className="truncate text-[12px] text-faint">{offset}</span>}
          </div>
          <div className="mt-1.5 truncate text-[15px] leading-tight">{center.name}</div>
          <div className="mt-0.5 truncate text-[12.5px] text-muted">
            {center.address} · {center.city}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[17px] font-semibold leading-none text-accent-dark tnum">{freeCourts}</div>
          <div className="mt-1 text-[11px] text-muted">{freeCourts === 1 ? 'court free' : 'courts free'}</div>
        </div>
      </Press>
    </motion.div>
  )
}
