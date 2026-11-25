import { useState } from 'react'
import { describeError } from '../api/errorMessage'
import { listFriendships } from '../api/friends'
import type { Game, Person } from '../api/types'
import { friendsMatching } from '../lib/friendships'
import { isInGame } from '../lib/seats'
import { useRemote } from '../lib/useRemote'
import { PersonRow } from './PersonRow'
import { RowAction } from './RowAction'
import { SkeletonList } from './SkeletonList'
import { TextField } from './TextField'

type InviteFriendsProps = {
  game: Game
  busy: boolean
  onInvite: (person: Person) => void
  onFindFriends: () => void
}

const seatStatusWord = (game: Game, personId: string) =>
  game.seats.find((seat) => seat.person?.id === personId)?.status === 'invited' ? 'Invited' : 'In the game'

/** The host's accepted friends, filtered on the phone; only friends can be invited. */
export function InviteFriends({ game, busy, onInvite, onFindFriends }: InviteFriendsProps) {
  const friendships = useRemote(listFriendships, [])
  const [query, setQuery] = useState('')

  if (friendships.status === 'loading') return <SkeletonList count={2} rowHeight={64} />
  if (friendships.status === 'failed') {
    return <p className="px-1 text-[13.5px] text-warm">{describeError(friendships.error)}</p>
  }

  const friends = friendsMatching(friendships.data, query)
  const hasFriends = friendships.data.some((friendship) => friendship.status === 'accepted')

  if (!hasFriends) {
    return (
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="text-[14px] text-muted">Only friends can be invited.</p>
        <RowAction label="Find friends" onClick={onFindFriends} />
      </div>
    )
  }

  return (
    <div>
      <TextField label="Search your friends" type="search" value={query} onChange={setQuery} autoComplete="off" />
      <div className="mt-3 flex flex-col" style={{ gap: 'var(--row-gap)' }}>
        {friends.length === 0 && <p className="px-1 text-[13.5px] text-muted">No friend by that name.</p>}
        {friends.map((person, index) => (
          <PersonRow key={person.id} person={person} index={index}>
            {isInGame(game.seats, person.id) ? (
              <span className="px-2 text-[13px] text-muted">{seatStatusWord(game, person.id)}</span>
            ) : (
              <RowAction label="Invite" variant="primary" disabled={busy} onClick={() => onInvite(person)}
                ariaLabel={`Invite ${person.displayName}`} />
            )}
          </PersonRow>
        ))}
      </div>
    </div>
  )
}
