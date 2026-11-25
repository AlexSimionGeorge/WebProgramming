import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { dayOfMonth, todayIsoDate, weekdayShort } from '../lib/dates'
import { spring } from '../lib/motion'
import { Press } from './Press'

type DayStripProps = {
  dates: string[]
  selectedDate: string
  onSelect: (isoDate: string) => void
}

export function DayStrip({ dates, selectedDate, onSelect }: DayStripProps) {
  const reduceMotion = useReducedMotion()
  const selectedRef = useRef<HTMLButtonElement>(null)
  const today = todayIsoDate()

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', inline: 'center', block: 'nearest' })
  }, [selectedDate, reduceMotion])

  return (
    <motion.div layoutScroll className="rail flex gap-1 px-4" role="tablist" aria-label="Day">
      {dates.map((isoDate) => {
        const selected = isoDate === selectedDate
        return (
          <Press
            key={isoDate}
            ref={selected ? selectedRef : undefined}
            soft
            role="tab"
            aria-selected={selected}
            onClick={() => onSelect(isoDate)}
            className="relative w-[52px] shrink-0 snap-center rounded-xl py-2"
          >
            {selected && (
              <motion.span
                layoutId="selected-day"
                aria-hidden
                transition={reduceMotion ? { duration: 0 } : spring}
                className="absolute inset-0 rounded-xl bg-primary"
              />
            )}
            <span className="relative block">
              <span className={`block text-[10px] ${selected ? 'text-white/70' : 'text-muted'}`}>
                {isoDate === today ? 'Today' : weekdayShort(isoDate)}
              </span>
              <span className="block text-[16px] font-semibold leading-tight text-white tnum">{dayOfMonth(isoDate)}</span>
            </span>
          </Press>
        )
      })}
    </motion.div>
  )
}
