import type { Weekday } from '../api/types'

const DAY_MS = 24 * 60 * 60 * 1000

function dateFromIso(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00`)
}

export function isoFromDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function todayIso(): string {
  return isoFromDate(new Date())
}

export function addDays(isoDate: string, days: number): string {
  return isoFromDate(new Date(dateFromIso(isoDate).getTime() + days * DAY_MS))
}

export function isoWeekday(isoDate: string): Weekday {
  return (((dateFromIso(isoDate).getDay() + 6) % 7) + 1) as Weekday
}

export function mondayOfWeek(isoDate: string): string {
  return addDays(isoDate, 1 - isoWeekday(isoDate))
}

export function dayOfMonth(isoDate: string): number {
  return dateFromIso(isoDate).getDate()
}

export function formatLongDate(isoDate: string): string {
  return dateFromIso(isoDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function formatMonthRange(firstIso: string, lastIso: string): string {
  const month = (isoDate: string) => dateFromIso(isoDate).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const first = month(firstIso)
  const last = month(lastIso)
  return first === last ? first : `${first} – ${last}`
}
