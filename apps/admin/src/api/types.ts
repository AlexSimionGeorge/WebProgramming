export type Role = 'centerAdmin' | 'player'

export type Account = {
  id: string
  email: string
  displayName: string
  role: Role
}

export type AuthSession = {
  token: string
  account: Account
}

export type Credentials = {
  email: string
  password: string
}

export type Registration = Credentials & {
  displayName: string
  role: Role
}

export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type SlotMinutes = 60 | 90 | 120

export type OpeningInterval = {
  weekday: Weekday
  opensAt: string
  closesAt: string
}

export type CenterConfiguration = {
  name: string
  address: string
  city: string
  courtCount: number
  slotMinutes: SlotMinutes
  openingIntervals: OpeningInterval[]
}

export type Court = {
  id: string
  name: string
}

export type CenterDetails = CenterConfiguration & {
  id: string
  courts: Court[]
}

export type AdminBooking = {
  id: string
  date: string
  startsAt: string
  endsAt: string
  court: Court
  player: { displayName: string; email: string }
}

export type ApiErrorBody = {
  error: { code: string; message: string }
}
