import { apiRequest } from './client'
import type { Game, SetScore } from './types'

const gamePath = (gameId: string) => `/games/${encodeURIComponent(gameId)}`

/** Hosting, seated or invited: upcoming first (soonest), then past (newest). */
export const listMyGames = (signal?: AbortSignal) =>
  apiRequest<Game[]>('/games/mine', { signal })

export const getGame = (gameId: string, signal?: AbortSignal) =>
  apiRequest<Game>(gamePath(gameId), { signal })

/** Host only: an accepted friend takes the lowest empty seat. */
export const invitePerson = (gameId: string, personId: string) =>
  apiRequest<Game>(`${gamePath(gameId)}/invitations`, { method: 'POST', body: { personId } })

export const acceptInvitation = (gameId: string) =>
  apiRequest<Game>(`${gamePath(gameId)}/invitation/accept`, { method: 'POST' })

export const declineInvitation = (gameId: string) =>
  apiRequest<Game>(`${gamePath(gameId)}/invitation/decline`, { method: 'POST' })

/** The host withdraws an invitation or removes a player; a seated player frees their own seat. */
export const freeSeat = (gameId: string, seatIndex: number) =>
  apiRequest<Game>(`${gamePath(gameId)}/seats/${seatIndex}`, { method: 'DELETE' })

/** Upsert; the index may be at most one past the last set. */
export const saveSet = (gameId: string, setIndex: number, score: SetScore) =>
  apiRequest<Game>(`${gamePath(gameId)}/sets/${setIndex}`, { method: 'PUT', body: score })

/** The higher sets move down one. */
export const removeSet = (gameId: string, setIndex: number) =>
  apiRequest<Game>(`${gamePath(gameId)}/sets/${setIndex}`, { method: 'DELETE' })

export const finishGame = (gameId: string) =>
  apiRequest<Game>(`${gamePath(gameId)}/finish`, { method: 'POST' })

export const reopenGame = (gameId: string) =>
  apiRequest<Game>(`${gamePath(gameId)}/reopen`, { method: 'POST' })
