const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export const LAST_MINUTE_OF_DAY = 23 * 60 + 59

export function isTimeOfDay(value: string): boolean {
  return TIME_PATTERN.test(value)
}

export function minutesSinceMidnight(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function timeFromMinutes(totalMinutes: number): string {
  const clamped = Math.min(Math.max(totalMinutes, 0), LAST_MINUTE_OF_DAY)
  const hours = Math.floor(clamped / 60)
  const minutes = clamped % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}
