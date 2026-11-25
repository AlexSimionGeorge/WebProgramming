export type Role = 'player' | 'centerAdmin'

export type Account = {
  id: string
  email: string
  displayName: string
  role: Role
}

export type AuthResponse = {
  token: string
  account: Account
}

export type Court = {
  id: string
  name: string
}

export type CenterSummary = {
  id: string
  name: string
  address: string
  city: string
  courtCount: number
}

export type OpeningInterval = {
  weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7
  opensAt: string
  closesAt: string
}

export type CenterDetails = CenterSummary & {
  slotMinutes: 60 | 90 | 120
  openingIntervals: OpeningInterval[]
  courts: Court[]
}

export type Slot = {
  startsAt: string
  endsAt: string
  freeCourtIds: string[]
}

export type DayAvailability = {
  date: string
  slotMinutes: number
  slots: Slot[]
}

export type BookingRequest = {
  courtId: string
  date: string
  startsAt: string
}

export type PlayerBooking = {
  id: string
  date: string
  startsAt: string
  endsAt: string
  court: Court
  center: Pick<CenterSummary, 'id' | 'name' | 'address' | 'city'>
}

/** One centre's day inside the city-wide answer: the same slots as `DayAvailability`, with the courts named. */
export type CenterDay = {
  center: CenterSummary
  slotMinutes: number
  courts: Court[]
  slots: Slot[]
}

/** Every centre's day at once, sorted by centre name; a closed centre comes back with `slots: []`. */
export type CityAvailability = {
  date: string
  centers: CenterDay[]
}
