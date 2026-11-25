import { addDays, dayOfMonth, formatMonthRange, mondayOfWeek, todayIso } from '../lib/dates'
import { WEEKDAYS } from '../lib/weekdays'

type DayStripProps = {
  selectedDate: string
  onSelect: (date: string) => void
}

export function DayStrip({ selectedDate, onSelect }: DayStripProps) {
  const weekStart = mondayOfWeek(selectedDate)
  const days = WEEKDAYS.map(({ shortName }, index) => ({ shortName, date: addDays(weekStart, index) }))
  const today = todayIso()

  return (
    <div className="rounded-2xl border border-line bg-surface/60 p-3">
      <div className="flex items-center justify-between px-1 pb-2">
        <span className="text-[11px] uppercase tracking-[0.12em] text-faint">
          {formatMonthRange(weekStart, addDays(weekStart, 6))}
        </span>
        {selectedDate !== today && (
          <button type="button" onClick={() => onSelect(today)} className="pressable text-[13px] font-semibold text-primary-fg hover:text-white">
            Today
          </button>
        )}
      </div>
      <div className="flex items-center gap-1">
        <WeekArrow direction="previous" onClick={() => onSelect(addDays(selectedDate, -7))} />
        <div className="grid min-w-0 flex-1 grid-cols-7 gap-1">
          {days.map(({ shortName, date }) => {
            const selected = date === selectedDate
            return (
              <button
                key={date}
                type="button"
                aria-pressed={selected}
                aria-label={date}
                onClick={() => onSelect(date)}
                className={`pressable rounded-xl py-2 ${selected ? 'bg-primary text-on-primary' : 'hover:bg-elevated'}`}
              >
                <span className={`block text-[10.5px] ${selected ? 'text-white/70' : 'text-muted'}`}>{shortName}</span>
                <span className="tnum block text-[16px] font-semibold leading-tight">{dayOfMonth(date)}</span>
                <span
                  aria-hidden
                  className={`mx-auto mt-1 block h-1 w-1 rounded-full ${date === today && !selected ? 'bg-primary-fg' : 'bg-transparent'}`}
                />
              </button>
            )
          })}
        </div>
        <WeekArrow direction="next" onClick={() => onSelect(addDays(selectedDate, 7))} />
      </div>
    </div>
  )
}

function WeekArrow({ direction, onClick }: { direction: 'previous' | 'next'; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={direction === 'previous' ? 'Previous week' : 'Next week'}
      onClick={onClick}
      className="pressable flex h-10 w-8 shrink-0 items-center justify-center rounded-xl text-[#a3aeb8] hover:text-white"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d={direction === 'previous' ? 'M15 5 8 12l7 7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  )
}
