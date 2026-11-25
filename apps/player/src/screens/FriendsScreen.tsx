import { motion } from 'framer-motion'
import { useState } from 'react'
import { describeError } from '../api/errorMessage'
import {
  acceptFriendship, listFriendships, removeFriendship, requestFriendship, searchPeople,
} from '../api/friends'
import type { Account, Friendship, PersonSearchResult } from '../api/types'
import { useLogOutWhenExpired } from '../auth/useLogOutWhenExpired'
import { useSession } from '../auth/SessionProvider'
import { ConfirmSheet, type Confirmation } from '../components/ConfirmSheet'
import { ListSection } from '../components/ListSection'
import { Notice } from '../components/Notice'
import { PersonRow } from '../components/PersonRow'
import { RowAction } from '../components/RowAction'
import { ScreenHeader } from '../components/ScreenHeader'
import { SkeletonList } from '../components/SkeletonList'
import { TextField } from '../components/TextField'
import { groupFriendships, MIN_SEARCH_LENGTH, personAction, type FriendshipGroups } from '../lib/friendships'
import { springSoft } from '../lib/motion'
import { useDebouncedValue } from '../lib/useDebouncedValue'
import { useRemote, type RemoteResource } from '../lib/useRemote'

const SEARCH_DELAY_MS = 300

export function FriendsScreen({ onLogIn }: { onLogIn: () => void }) {
  const session = useSession()

  return (
    <div className="h-full overflow-y-auto noscroll pb-8">
      <ScreenHeader kicker="Padel" title="Friends" />
      <div className="px-5">
        {session.status === 'restoring' && <SkeletonList count={3} rowHeight={64} />}
        {session.status === 'anonymous' && (
          <Notice message="Log in to find the people you play with." action={{ label: 'Log in', onClick: onLogIn }} />
        )}
        {session.status === 'signedIn' && <MyFriends account={session.account} />}
      </div>
    </div>
  )
}

/** One tap at a time per person, so a row never sends two answers. */
type Busy = string | null

function MyFriends({ account }: { account: Account }) {
  const [query, setQuery] = useState('')
  const searchedQuery = useDebouncedValue(query.trim(), SEARCH_DELAY_MS)
  const friendships = useRemote(listFriendships, [account.id])
  const results = useRemote<PersonSearchResult[] | null>(
    (signal) => (searchedQuery.length >= MIN_SEARCH_LENGTH ? searchPeople(searchedQuery, signal) : Promise.resolve(null)),
    [account.id, searchedQuery],
  )
  const [busyPersonId, setBusyPersonId] = useState<Busy>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)

  useLogOutWhenExpired(friendships.status === 'failed' ? friendships.error : null)

  const refreshAll = () => {
    friendships.refresh()
    results.refresh()
  }

  const act = async (personId: string, action: () => Promise<unknown>) => {
    setBusyPersonId(personId)
    setProblem(null)
    try {
      await action()
    } catch (error) {
      setProblem(describeError(error))
    } finally {
      setBusyPersonId(null)
      refreshAll()
    }
  }

  const confirmRemoval = (friendship: Friendship) =>
    setConfirmation({
      title: `Remove ${friendship.person.displayName}?`,
      message: 'You can add each other again later. Games you share stay as they are.',
      confirmLabel: 'Remove friend',
      workingLabel: 'Removing…',
      onConfirm: async () => {
        await removeFriendship(friendship.id)
        refreshAll()
      },
    })

  return (
    <>
      <TextField
        label="Find players"
        type="search"
        value={query}
        onChange={setQuery}
        autoComplete="off"
        placeholder="Name or email"
      />
      <div className="pt-3 pb-4" aria-live="polite">
        {problem && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springSoft}
            className="mb-3 px-1 text-[13.5px] leading-snug text-warm"
          >
            {problem}
          </motion.p>
        )}
        <SearchResults
          query={query.trim()}
          results={results}
          busyPersonId={busyPersonId}
          onAdd={(person) => void act(person.id, () => requestFriendship(person.id))}
          onAccept={(person, friendshipId) => void act(person.id, () => acceptFriendship(friendshipId))}
          onWithdraw={(person, friendshipId) => void act(person.id, () => removeFriendship(friendshipId))}
        />
      </div>

      {friendships.status === 'loading' && <SkeletonList count={3} rowHeight={64} />}
      {friendships.status === 'failed' && (
        <Notice tone="warm" message={describeError(friendships.error)} action={{ label: 'Try again', onClick: friendships.reload }} />
      )}
      {friendships.status === 'ready' && (
        <FriendshipSections
          groups={groupFriendships(friendships.data)}
          busyPersonId={busyPersonId}
          onAccept={(friendship) => void act(friendship.person.id, () => acceptFriendship(friendship.id))}
          onDismiss={(friendship) => void act(friendship.person.id, () => removeFriendship(friendship.id))}
          onRemove={confirmRemoval}
        />
      )}

      <ConfirmSheet confirmation={confirmation} onClose={() => setConfirmation(null)} />
    </>
  )
}

type SearchResultsProps = {
  query: string
  results: RemoteResource<PersonSearchResult[] | null>
  busyPersonId: Busy
  onAdd: (person: PersonSearchResult) => void
  onAccept: (person: PersonSearchResult, friendshipId: string) => void
  onWithdraw: (person: PersonSearchResult, friendshipId: string) => void
}

function SearchResults({ query, results, busyPersonId, onAdd, onAccept, onWithdraw }: SearchResultsProps) {
  if (query.length === 0) return null
  if (query.length < MIN_SEARCH_LENGTH) {
    return <p className="px-1 text-[13.5px] text-muted">Keep typing — two letters at least.</p>
  }
  if (results.status === 'loading') return <SkeletonList count={1} rowHeight={64} />
  if (results.status === 'failed') {
    return <p className="px-1 text-[13.5px] text-warm">{describeError(results.error)}</p>
  }
  if (!results.data) return null
  if (results.data.length === 0) {
    return <p className="px-1 text-[13.5px] text-muted">Nobody by that name or email.</p>
  }

  return (
    <div className="flex flex-col" style={{ gap: 'var(--row-gap)' }}>
      {results.data.map((person, index) => {
        const action = personAction(person.friendship)
        const busy = busyPersonId === person.id
        return (
          <PersonRow key={person.id} person={person} index={index}>
            {action.kind === 'add' && (
              <RowAction label="Add" variant="primary" disabled={busy} onClick={() => onAdd(person)}
                ariaLabel={`Add ${person.displayName} as a friend`} />
            )}
            {action.kind === 'accept' && (
              <RowAction label="Accept" variant="primary" disabled={busy}
                onClick={() => onAccept(person, action.friendshipId)}
                ariaLabel={`Accept ${person.displayName}’s request`} />
            )}
            {action.kind === 'withdraw' && (
              <RowAction label="Requested" disabled={busy}
                onClick={() => onWithdraw(person, action.friendshipId)}
                ariaLabel={`Requested. Withdraw the request to ${person.displayName}`} />
            )}
            {action.kind === 'friends' && <span className="px-2 text-[13px] text-muted">Friends</span>}
          </PersonRow>
        )
      })}
    </div>
  )
}

type FriendshipSectionsProps = {
  groups: FriendshipGroups
  busyPersonId: Busy
  onAccept: (friendship: Friendship) => void
  /** Declines an incoming request or withdraws an outgoing one. */
  onDismiss: (friendship: Friendship) => void
  onRemove: (friendship: Friendship) => void
}

function FriendshipSections({ groups, busyPersonId, onAccept, onDismiss, onRemove }: FriendshipSectionsProps) {
  const isBusy = (friendship: Friendship) => busyPersonId === friendship.person.id
  return (
    <>
      <ListSection title="Requests for you">
        {groups.requestsForMe.map((friendship, index) => (
          <PersonRow key={friendship.id} person={friendship.person} index={index}>
            <RowAction label="Decline" disabled={isBusy(friendship)} onClick={() => onDismiss(friendship)}
              ariaLabel={`Decline ${friendship.person.displayName}`} />
            <RowAction label="Accept" variant="primary" disabled={isBusy(friendship)} onClick={() => onAccept(friendship)}
              ariaLabel={`Accept ${friendship.person.displayName}`} />
          </PersonRow>
        ))}
      </ListSection>
      <ListSection title="Friends" emptyMessage="No friends yet. Find the people you play with above.">
        {groups.friends.map((friendship, index) => (
          <PersonRow key={friendship.id} person={friendship.person} index={index}>
            <RowAction label="Remove" disabled={isBusy(friendship)} onClick={() => onRemove(friendship)}
              ariaLabel={`Remove ${friendship.person.displayName}`} />
          </PersonRow>
        ))}
      </ListSection>
      <ListSection title="Sent requests">
        {groups.sentRequests.map((friendship, index) => (
          <PersonRow key={friendship.id} person={friendship.person} index={index} waiting>
            <RowAction label="Withdraw" disabled={isBusy(friendship)} onClick={() => onDismiss(friendship)}
              ariaLabel={`Withdraw the request to ${friendship.person.displayName}`} />
          </PersonRow>
        ))}
      </ListSection>
    </>
  )
}
