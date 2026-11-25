import type { Game } from '../api/types'
import { hasPassed } from './dates'

export type GameLists = {
  /** Asked, not yet answered, and still ahead. */
  invitations: Game[]
  upcoming: Game[]
  past: Game[]
}

const startOrder = (game: Game) => `${game.date}T${game.startsAt}`

export const hasEnded = (game: Game) => hasPassed(game.date, game.endsAt)
export const hasStarted = (game: Game) => hasPassed(game.date, game.startsAt)

export function splitGames(games: readonly Game[]): GameLists {
  const ahead = games
    .filter((game) => !hasEnded(game))
    .sort((first, second) => startOrder(first).localeCompare(startOrder(second)))
  const past = games
    .filter(hasEnded)
    .sort((first, second) => startOrder(second).localeCompare(startOrder(first)))
  return {
    invitations: ahead.filter((game) => game.viewer.isInvited),
    upcoming: ahead.filter((game) => !game.viewer.isInvited),
    past: past.filter((game) => !game.viewer.isInvited),
  }
}
