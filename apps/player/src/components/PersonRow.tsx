import { motion } from 'framer-motion'
import type { Person } from '../api/types'
import { riseIn } from '../lib/motion'

type PersonRowProps = {
  person: Person
  index: number
  /** Drawn quieter: the ball is in their court. */
  waiting?: boolean
  children?: React.ReactNode
}

/** A person the way a phone draws a contact: their initial, their name, and what you may do about them. */
export function PersonRow({ person, index, waiting = false, children }: PersonRowProps) {
  return (
    <motion.div
      layout="position"
      {...riseIn(index)}
      className="flex min-h-[64px] items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-2.5"
    >
      <PersonInitial name={person.displayName} />
      <span className={`min-w-0 flex-1 truncate text-[15px] ${waiting ? 'text-soft' : 'text-white'}`}>
        {person.displayName}
      </span>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </motion.div>
  )
}

export function PersonInitial({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-elevated text-[14px] text-soft"
    >
      {name.trim().slice(0, 1).toUpperCase() || '?'}
    </span>
  )
}
