import type { GameSeat, SeatIndex } from '../api/types'

export type Team = 'A' | 'B'

export const TEAM_SEAT_INDEXES: Record<Team, readonly SeatIndex[]> = { A: [1, 2], B: [3, 4] }

export const teamLabel = (team: Team) => `Team ${team}`

/** People and invitations first by seat index, empty seats last: never a hole between two people. */
export function packLeft(seats: readonly GameSeat[]): GameSeat[] {
  const taken = seats.filter((seat) => seat.status !== 'empty')
  const open = seats.filter((seat) => seat.status === 'empty')
  const byIndex = (first: GameSeat, second: GameSeat) => first.index - second.index
  return [...taken.sort(byIndex), ...open.sort(byIndex)]
}

/**
 * A team's two seats, packed within the team. Packing across all four would move a person to the
 * other side of the net, and the seat index is what decides the team the score belongs to.
 */
export const teamSeats = (seats: readonly GameSeat[], team: Team) =>
  packLeft(seats.filter((seat) => TEAM_SEAT_INDEXES[team].includes(seat.index)))

/** Keyed by the person, so a seat emptying slides the next person over instead of rewriting four cells. */
export const seatKey = (seat: GameSeat) => (seat.person ? `person-${seat.person.id}` : `open-${seat.index}`)

export const seatName = (seat: GameSeat) =>
  seat.status === 'empty' ? 'Open' : seat.person?.displayName ?? 'Player'

/** What a screen reader hears: the state is said in words, never left to colour or a ring. */
export function seatDescription(seat: GameSeat): string {
  if (seat.status === 'empty') return 'Open seat'
  if (seat.status === 'invited') return `${seatName(seat)}, invited`
  return seatName(seat)
}

export const isGameFull = (seats: readonly GameSeat[]) => seats.every((seat) => seat.status !== 'empty')

export const isInGame = (seats: readonly GameSeat[], personId: string) =>
  seats.some((seat) => seat.status !== 'empty' && seat.person?.id === personId)
