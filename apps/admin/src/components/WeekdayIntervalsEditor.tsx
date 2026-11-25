import type { Weekday } from '../api/types'
import type { ScheduleErrors } from '../lib/openingHoursValidation'
import { copyDayToAllDays, suggestNextRange, type TimeRange, type WeeklySchedule } from '../lib/weeklySchedule'
import { WEEKDAYS } from '../lib/weekdays'
import { Button } from './Button'
import { DayIntervalsRow } from './DayIntervalsRow'

type WeekdayIntervalsEditorProps = {
  schedule: WeeklySchedule
  errors: ScheduleErrors
  onChange: (schedule: WeeklySchedule) => void
}

const MONDAY: Weekday = 1

export function WeekdayIntervalsEditor({ schedule, errors, onChange }: WeekdayIntervalsEditorProps) {
  function replaceDay(weekday: Weekday, ranges: TimeRange[]) {
    onChange({ ...schedule, [weekday]: ranges })
  }

  return (
    <div>
      <div className="flex justify-end">
        <Button variant="quiet" onClick={() => onChange(copyDayToAllDays(schedule, MONDAY))} className="px-0">
          Copy Monday to all days
        </Button>
      </div>
      <ul className="divide-y divide-line">
        {WEEKDAYS.map(({ weekday, name }) => (
          <DayIntervalsRow
            key={weekday}
            dayName={name}
            ranges={schedule[weekday]}
            errors={errors[weekday]}
            onChange={(ranges) => replaceDay(weekday, ranges)}
            onAdd={() => replaceDay(weekday, [...schedule[weekday], suggestNextRange(schedule[weekday])])}
          />
        ))}
      </ul>
    </div>
  )
}
