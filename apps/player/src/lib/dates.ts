/**
 * Dates are wall-clock strings in the centre's local time: `YYYY-MM-DD` and `HH:MM`.
 * Parsing at noon keeps a date on the same day whatever the device's time zone offset is.
 */
const atNoon = (isoDate: string) => new Date(`${isoDate}T12:00:00`)

const twoDigits = (value: number) => String(value).padStart(2, '0')

export const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`

const toIsoTime = (date: Date) => `${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`

export const todayIsoDate = () => toIsoDate(new Date())

export function addDays(isoDate: string, days: number): string {
  const date = atNoon(isoDate)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

export const upcomingDates = (count: number, from = todayIsoDate()) =>
  Array.from({ length: count }, (_, offset) => addDays(from, offset))

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export const isoWeekday = (isoDate: string) => ((atNoon(isoDate).getDay() + 6) % 7) + 1

export const weekdayShort = (isoDate: string) =>
  atNoon(isoDate).toLocaleDateString('en-GB', { weekday: 'short' })

export const dayOfMonth = (isoDate: string) => atNoon(isoDate).getDate()

export function relativeDayLabel(isoDate: string): string {
  const today = todayIsoDate()
  if (isoDate === today) return 'Today'
  if (isoDate === addDays(today, 1)) return 'Tomorrow'
  return atNoon(isoDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

export const shortDateLabel = (isoDate: string) =>
  atNoon(isoDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

export function hasPassed(isoDate: string, time: string, now = new Date()): boolean {
  return `${isoDate}T${time}` <= `${toIsoDate(now)}T${toIsoTime(now)}`
}

/** `HH:MM` → minutes since midnight. */
export const minutesOfDay = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))

/** Minutes since midnight → `HH:MM`. */
export const clockTime = (minutes: number) => `${twoDigits(Math.floor(minutes / 60))}:${twoDigits(minutes % 60)}`

/** The Monday of the week `isoDate` falls in. */
export const weekStartOf = (isoDate: string) => addDays(isoDate, 1 - isoWeekday(isoDate))

export const weekDates = (weekStart: string) => upcomingDates(7, weekStart)

const monthShort = (isoDate: string) => atNoon(isoDate).toLocaleDateString('en-GB', { month: 'long' })

/** "November", or "October – November" for a week that straddles two months. */
export function weekMonthLabel(weekStart: string): string {
  const first = monthShort(weekStart)
  const last = monthShort(addDays(weekStart, 6))
  return first === last ? first : `${first} – ${last}`
}
