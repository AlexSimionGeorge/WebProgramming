import type { Friendship } from '../api/types'

export type FriendshipGroups = {
  /** Somebody is waiting on my answer. */
  requestsForMe: Friendship[]
  friends: Friendship[]
  /** I am waiting on theirs. */
  sentRequests: Friendship[]
}

const byName = (first: Friendship, second: Friendship) =>
  first.person.displayName.localeCompare(second.person.displayName)

export function groupFriendships(friendships: Friendship[]): FriendshipGroups {
  const pending = friendships.filter((friendship) => friendship.status === 'pending')
  return {
    requestsForMe: pending.filter((friendship) => friendship.direction === 'incoming').sort(byName),
    friends: friendships.filter((friendship) => friendship.status === 'accepted').sort(byName),
    sentRequests: pending.filter((friendship) => friendship.direction === 'outgoing').sort(byName),
  }
}

/** What a person found by search lets me do, read off where our friendship stands. */
export type PersonAction =
  | { kind: 'add' }
  | { kind: 'withdraw'; friendshipId: string }
  | { kind: 'accept'; friendshipId: string }
  | { kind: 'friends' }

export function personAction(friendship: Friendship | null): PersonAction {
  if (!friendship) return { kind: 'add' }
  if (friendship.status === 'accepted') return { kind: 'friends' }
  return friendship.direction === 'incoming'
    ? { kind: 'accept', friendshipId: friendship.id }
    : { kind: 'withdraw', friendshipId: friendship.id }
}

export const MIN_SEARCH_LENGTH = 2

/** My accepted friends whose name holds `query`, ignoring case; everybody when the query is empty. */
export function friendsMatching(friendships: readonly Friendship[], query: string) {
  const needle = query.trim().toLocaleLowerCase()
  return groupFriendships([...friendships]).friends
    .map((friendship) => friendship.person)
    .filter((person) => person.displayName.toLocaleLowerCase().includes(needle))
}
