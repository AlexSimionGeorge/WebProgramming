import type { Game, GameSet, SetScore } from '../api/types'

export const MIN_GAMES = 0
export const MAX_GAMES = 15
export const MAX_SETS = 5

/** "6–4 3–6": team A's games first in every set. */
export const setScoresLabel = (sets: readonly GameSet[]) =>
  sets.map((set) => `${set.teamA}–${set.teamB}`).join(' ')

/** "1 – 1" */
export const setsWonLabel = (setsWon: SetScore) => `${setsWon.teamA} – ${setsWon.teamB}`

export const clampGames = (games: number) => Math.min(MAX_GAMES, Math.max(MIN_GAMES, games))

export type SetOutcome = 'teamA' | 'teamB' | 'draw' | 'open'

/**
 * Who took a set, the way the server counts it: a draw counts for nobody, and the last set is still
 * open until the game is finished.
 */
export function setOutcome(set: SetScore, isLastSet: boolean, finished: boolean): SetOutcome {
  if (isLastSet && !finished) return 'open'
  if (set.teamA === set.teamB) return 'draw'
  return set.teamA > set.teamB ? 'teamA' : 'teamB'
}

export const isFinished = (game: Pick<Game, 'finishedAt'>) => game.finishedAt !== null
