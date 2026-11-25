import type { OpeningInterval, Weekday } from '../api/types'
import { minutesSinceMidnight, timeFromMinutes } from './time'
import { WEEKDAYS } from './weekdays'

export type TimeRange = { opensAt: string; closesAt: string }

export type WeeklySchedule = Record<Weekday, TimeRange[]>

const DEFAULT_RANGE: TimeRange = { opensAt: '08:00', closesAt: '22:00' }
const SUGGESTED_RANGE_MINUTES = 120

export function emptySchedule(): WeeklySchedule {
  return { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] }
}

export function defaultSchedule(): WeeklySchedule {
  const schedule = emptySchedule()
  for (const { weekday } of WEEKDAYS) schedule[weekday] = [{ ...DEFAULT_RANGE }]
  return schedule
}

export function scheduleFromIntervals(intervals: readonly OpeningInterval[]): WeeklySchedule {
  const schedule = emptySchedule()
  for (const { weekday, opensAt, closesAt } of intervals) schedule[weekday].push({ opensAt, closesAt })
  return schedule
}

export function intervalsFromSchedule(schedule: WeeklySchedule): OpeningInterval[] {
  return WEEKDAYS.flatMap(({ weekday }) => schedule[weekday].map((range) => ({ weekday, ...range })))
}

export function sortedByOpening(intervals: readonly OpeningInterval[]): OpeningInterval[] {
  return [...intervals].sort(
    (first, second) => first.weekday - second.weekday || minutesSinceMidnight(first.opensAt) - minutesSinceMidnight(second.opensAt),
  )
}

export function copyDayToAllDays(schedule: WeeklySchedule, source: Weekday): WeeklySchedule {
  const copied = emptySchedule()
  for (const { weekday } of WEEKDAYS) copied[weekday] = schedule[source].map((range) => ({ ...range }))
  return copied
}

export function suggestNextRange(existingRanges: readonly TimeRange[]): TimeRange {
  const lastRange = existingRanges.at(-1)
  if (!lastRange) return { ...DEFAULT_RANGE }
  const opensAt = minutesSinceMidnight(lastRange.closesAt)
  return { opensAt: timeFromMinutes(opensAt), closesAt: timeFromMinutes(opensAt + SUGGESTED_RANGE_MINUTES) }
}
