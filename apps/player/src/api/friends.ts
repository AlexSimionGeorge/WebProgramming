import { apiRequest } from './client'
import type { Friendship, PersonSearchResult } from './types'

/** Display name anywhere (case-insensitive) or a whole email; at least two characters, at most 20 results. */
export const searchPeople = (query: string, signal?: AbortSignal) =>
  apiRequest<PersonSearchResult[]>(`/people?query=${encodeURIComponent(query)}`, { signal })

/** Accepted and pending, both directions. */
export const listFriendships = (signal?: AbortSignal) =>
  apiRequest<Friendship[]>('/friends', { signal })

/** A request; when they had already asked you, it is accepted instead. */
export const requestFriendship = (personId: string) =>
  apiRequest<Friendship>('/friends', { method: 'POST', body: { personId } })

export const acceptFriendship = (friendshipId: string) =>
  apiRequest<Friendship>(`/friends/${encodeURIComponent(friendshipId)}/accept`, { method: 'POST' })

/** Declines, withdraws or unfriends, depending on where the friendship stands. */
export const removeFriendship = (friendshipId: string) =>
  apiRequest<void>(`/friends/${encodeURIComponent(friendshipId)}`, { method: 'DELETE' })
