const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

const MINUTES_PER_DAY = 24 * 60

/** A time input cannot show 24:00, so a range closing at 00:00 closes at midnight. */
const MIDNIGHT_IN_FORM = '00:00'
const MIDNIGHT_IN_API = '24:00'

export function isTimeOfDay(value: string): boolean {
  return TIME_PATTERN.test(value)
}

export function minutesSinceMidnight(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function closingMinutes(closesAt: string): number {
  return closesAt === MIDNIGHT_IN_FORM ? MINUTES_PER_DAY : minutesSinceMidnight(closesAt)
}

export function closingTimeForApi(closesAt: string): string {
  return closesAt === MIDNIGHT_IN_FORM ? MIDNIGHT_IN_API : closesAt
}

export function closingTimeFromApi(closesAt: string): string {
  return closesAt === MIDNIGHT_IN_API ? MIDNIGHT_IN_FORM : closesAt
}

export function timeFromMinutes(totalMinutes: number): string {
  const clamped = Math.min(Math.max(totalMinutes, 0), MINUTES_PER_DAY) % MINUTES_PER_DAY
  const hours = Math.floor(clamped / 60)
  const minutes = clamped % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}
