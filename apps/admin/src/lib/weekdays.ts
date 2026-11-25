import type { Weekday } from '../api/types'

export const WEEKDAYS: readonly { weekday: Weekday; name: string; shortName: string }[] = [
  { weekday: 1, name: 'Monday', shortName: 'Mon' },
  { weekday: 2, name: 'Tuesday', shortName: 'Tue' },
  { weekday: 3, name: 'Wednesday', shortName: 'Wed' },
  { weekday: 4, name: 'Thursday', shortName: 'Thu' },
  { weekday: 5, name: 'Friday', shortName: 'Fri' },
  { weekday: 6, name: 'Saturday', shortName: 'Sat' },
  { weekday: 7, name: 'Sunday', shortName: 'Sun' },
]
