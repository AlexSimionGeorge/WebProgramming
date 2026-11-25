import { motion } from 'framer-motion'
import type { CenterSummary } from '../api/types'
import { riseIn } from '../lib/motion'
import { ChevronIcon } from './icons'
import { Press } from './Press'

const courtLabel = (count: number) => `${count} ${count === 1 ? 'court' : 'courts'}`

export function CenterCard({ center, index, onOpen }: { center: CenterSummary; index: number; onOpen: () => void }) {
  return (
    <motion.div {...riseIn(index)}>
      <Press
        soft
        onClick={onOpen}
        className="flex w-full items-center gap-4 rounded-2xl border border-line bg-surface px-5 text-left"
        style={{ paddingBlock: 'calc(var(--row-y) + 0.125rem)' }}
      >
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[20px] leading-tight">{center.name}</div>
          <div className="mt-1 truncate text-[13px] text-muted">
            {center.address} · {center.city}
          </div>
        </div>
        <div className="shrink-0 text-[13px] text-soft tnum">{courtLabel(center.courtCount)}</div>
        <ChevronIcon direction="right" className="h-4 w-4 shrink-0 text-faint" />
      </Press>
    </motion.div>
  )
}
