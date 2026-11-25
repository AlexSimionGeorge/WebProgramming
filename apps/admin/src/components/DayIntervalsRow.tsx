import type { RangeError } from '../lib/openingHoursValidation'
import type { TimeRange } from '../lib/weeklySchedule'
import { Button } from './Button'
import { TimeInput } from './TimeInput'

type DayIntervalsRowProps = {
  dayName: string
  ranges: readonly TimeRange[]
  errors: readonly RangeError[]
  onChange: (ranges: TimeRange[]) => void
  onAdd: () => void
}

export function DayIntervalsRow({ dayName, ranges, errors, onChange, onAdd }: DayIntervalsRowProps) {
  function updateRange(index: number, change: Partial<TimeRange>) {
    onChange(ranges.map((range, rangeIndex) => (rangeIndex === index ? { ...range, ...change } : range)))
  }

  function removeRange(index: number) {
    onChange(ranges.filter((_, rangeIndex) => rangeIndex !== index))
  }

  return (
    <li className="grid gap-2 py-4 sm:grid-cols-[8.5rem_1fr] sm:gap-4">
      <span className="pt-2.5 text-[15px] font-semibold">{dayName}</span>
      <div className="space-y-2">
        {ranges.length === 0 && <p className="pt-2.5 text-[14.5px] text-muted">Closed</p>}
        {ranges.map((range, index) => (
          <div key={index}>
            <div className="flex items-center gap-2">
              <TimeInput
                label={`${dayName} interval ${index + 1} opens at`}
                value={range.opensAt}
                onChange={(opensAt) => updateRange(index, { opensAt })}
                invalid={Boolean(errors[index])}
              />
              <span className="text-muted">–</span>
              <TimeInput
                label={`${dayName} interval ${index + 1} closes at`}
                value={range.closesAt}
                onChange={(closesAt) => updateRange(index, { closesAt })}
                invalid={Boolean(errors[index])}
              />
              <button
                type="button"
                aria-label={`Remove ${dayName} interval ${range.opensAt}–${range.closesAt}`}
                onClick={() => removeRange(index)}
                className="pressable flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-elevated hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            {errors[index] && <p className="pt-1 text-[12.5px] text-warm">{errors[index]}</p>}
          </div>
        ))}
        <Button variant="quiet" onClick={onAdd} className="px-0">
          + Add interval
        </Button>
      </div>
    </li>
  )
}
