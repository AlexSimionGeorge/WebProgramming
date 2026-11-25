import type { Weekday } from '../api/types'
import { closingMinutes, isTimeOfDay, minutesSinceMidnight } from './time'
import type { TimeRange, WeeklySchedule } from './weeklySchedule'
import { WEEKDAYS } from './weekdays'

export type RangeError = string | undefined

export type ScheduleErrors = Record<Weekday, RangeError[]>

export function validateDayRanges(ranges: readonly TimeRange[]): RangeError[] {
  return ranges.map((range, index) => {
    if (!isTimeOfDay(range.opensAt) || !isTimeOfDay(range.closesAt)) return 'Enter both times.'
    if (!isWellFormed(range)) return 'Opening time must be before closing time.'
    const overlapping = ranges.find((other, otherIndex) => otherIndex !== index && rangesOverlap(range, other))
    return overlapping ? `Overlaps ${overlapping.opensAt}–${overlapping.closesAt}.` : undefined
  })
}

export function validateSchedule(schedule: WeeklySchedule): ScheduleErrors {
  const errors = {} as ScheduleErrors
  for (const { weekday } of WEEKDAYS) errors[weekday] = validateDayRanges(schedule[weekday])
  return errors
}

export function hasScheduleErrors(errors: ScheduleErrors): boolean {
  return Object.values(errors).some((dayErrors) => dayErrors.some(Boolean))
}

function isWellFormed(range: TimeRange): boolean {
  return (
    isTimeOfDay(range.opensAt) &&
    isTimeOfDay(range.closesAt) &&
    minutesSinceMidnight(range.opensAt) < closingMinutes(range.closesAt)
  )
}

function rangesOverlap(first: TimeRange, second: TimeRange): boolean {
  if (!isWellFormed(first) || !isWellFormed(second)) return false
  return (
    minutesSinceMidnight(first.opensAt) < closingMinutes(second.closesAt) &&
    minutesSinceMidnight(second.opensAt) < closingMinutes(first.closesAt)
  )
}
