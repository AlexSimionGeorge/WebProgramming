import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { dayOfMonth, todayIsoDate, weekDates, weekdayShort } from '../lib/dates'
import { spring } from '../lib/motion'
import { ChevronIcon } from './icons'
import { Press } from './Press'

type WeekStripProps = {
  weekStart: string
  selectedDate: string
  onPageWeek: (direction: -1 | 1) => void
  onSelect: (isoDate: string) => void
}

/**
 * Seven days at a time, paged by a whole week. Always seven cells with the same geometry — the
 * strip never grows and never scrolls, so "next Tuesday" is one arrow and one tap.
 * Past days stay visible but dead, and the back arrow stops at the current week.
 */
export function WeekStrip({ weekStart, selectedDate, onPageWeek, onSelect }: WeekStripProps) {
  const reduceMotion = useReducedMotion()
  const today = todayIsoDate()
  const days = weekDates(weekStart)
  const canGoBack = (days[0] ?? today) > today
  const selectedColumn = days.indexOf(selectedDate)

  return (
    <div className="flex items-center gap-1 px-3">
      <WeekArrow direction="left" enabled={canGoBack} onPress={() => onPageWeek(-1)} />

      <div className="relative min-w-0 flex-1 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={weekStart}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.13 }}
            className="relative flex"
            role="tablist"
            aria-label="Day"
          >
            {/*
              One pill moved by a transform over equal columns, not a per-day layoutId: a live
              shared-layout projection can keep the tab transition above from ever finishing.
            */}
            {selectedColumn >= 0 && (
              <motion.span
                aria-hidden
                initial={false}
                animate={{ x: `${selectedColumn * 100}%` }}
                transition={reduceMotion ? { duration: 0 } : spring}
                className="pointer-events-none absolute inset-y-0 left-0 w-[calc(100%/7)] px-[3px]"
              >
                <span className="block h-full w-full rounded-xl bg-primary" />
              </motion.span>
            )}
            {days.map((isoDate) => (
              <DayCell
                key={isoDate}
                isoDate={isoDate}
                isToday={isoDate === today}
                past={isoDate < today}
                selected={isoDate === selectedDate}
                onSelect={() => onSelect(isoDate)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <WeekArrow direction="right" enabled onPress={() => onPageWeek(1)} />
    </div>
  )
}

type DayCellProps = {
  isoDate: string
  isToday: boolean
  past: boolean
  selected: boolean
  onSelect: () => void
}

function DayCell({ isoDate, isToday, past, selected, onSelect }: DayCellProps) {
  const labelTone = selected ? 'text-white/70' : past ? 'text-faint' : 'text-muted'
  return (
    <Press
      soft
      role="tab"
      aria-selected={selected}
      disabled={past}
      onClick={onSelect}
      className={`relative min-w-0 flex-1 px-[3px] py-2 ${past ? 'cursor-default' : ''}`}
    >
      <span className="relative block">
        <span className={`block text-[10px] ${labelTone}`}>{isToday ? 'Today' : weekdayShort(isoDate)}</span>
        <span className={`block text-[16px] font-semibold leading-tight tnum ${past ? 'text-faint' : 'text-white'}`}>
          {dayOfMonth(isoDate)}
        </span>
      </span>
    </Press>
  )
}

type WeekArrowProps = { direction: 'left' | 'right'; enabled: boolean; onPress: () => void }

function WeekArrow({ direction, enabled, onPress }: WeekArrowProps) {
  return (
    <Press
      onClick={onPress}
      disabled={!enabled}
      aria-label={direction === 'left' ? 'Previous week' : 'Next week'}
      className={`flex h-11 w-8 shrink-0 items-center justify-center ${enabled ? 'text-soft' : 'text-faint/60'}`}
    >
      <ChevronIcon direction={direction} />
    </Press>
  )
}
