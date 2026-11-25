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

export type Slot = {
  startsAt: string
  endsAt: string
  freeCourtIds: string[]
}

export type BookingRequest = {
  courtId: string
  date: string
  startsAt: string
}

export type BookingCenter = Pick<CenterSummary, 'id' | 'name' | 'address' | 'city'>

export type PlayerBooking = {
  id: string
  date: string
  startsAt: string
  endsAt: string
  court: Court
  center: BookingCenter
  /** Every booking is a game; this is the one it created. */
  gameId: string
}

/** One centre's day inside the city-wide answer: a centre's slots for the day, with the courts named. */
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

/** Another player as anyone may see them: never their email. */
export type Person = {
  id: string
  displayName: string
}

export type Friendship = {
  id: string
  /** Always the other side. */
  person: Person
  status: 'pending' | 'accepted'
  /** Who asked; kept after acceptance. */
  direction: 'incoming' | 'outgoing'
}

export type PersonSearchResult = Person & { friendship: Friendship | null }

export type SeatIndex = 1 | 2 | 3 | 4

export type GameSeat = {
  index: SeatIndex
  status: 'empty' | 'invited' | 'filled'
  person: Person | null
}

/** One set's games per team: index 1..5, games 0..15. */
export type GameSet = {
  index: number
  teamA: number
  teamB: number
}

export type SetScore = Pick<GameSet, 'teamA' | 'teamB'>

export type GameViewer = {
  isHost: boolean
  seatIndex: number | null
  isInvited: boolean
  canScore: boolean
}

/** Seats 1 + 2 are team A, 3 + 4 team B. */
export type Game = {
  id: string
  bookingId: string
  date: string
  startsAt: string
  endsAt: string
  center: BookingCenter
  court: Court
  host: Person
  /** Always four, ordered by index. */
  seats: GameSeat[]
  /** Ordered by index, contiguous from 1. */
  sets: GameSet[]
  /** A drawn set counts for nobody; the last set counts only once the game is finished. */
  setsWon: SetScore
  finishedAt: string | null
  viewer: GameViewer
}
