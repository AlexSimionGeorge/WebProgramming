import { describeError } from '../api/errorMessage'
import { listMyGames } from '../api/games'
import type { Account } from '../api/types'
import { useSession } from '../auth/SessionProvider'
import { AuthPanel } from '../components/AuthPanel'
import { Button } from '../components/Button'
import { GameCard } from '../components/GameCard'
import { ListSection } from '../components/ListSection'
import { ScreenHeader } from '../components/ScreenHeader'
import { SkeletonList } from '../components/SkeletonList'
import { splitGames } from '../lib/gameLists'
import { useRemote } from '../lib/useRemote'

export function ProfileScreen({ onOpenGame }: { onOpenGame: (gameId: string) => void }) {
  const session = useSession()

  if (session.status === 'signedIn') {
    return <AccountDetails account={session.account} onLogOut={session.logOut} onOpenGame={onOpenGame} />
  }

  return (
    <div className="h-full overflow-y-auto noscroll pb-10">
      <ScreenHeader
        kicker="Padel"
        title="Your account"
        subtitle="Looking around needs no account. Log in or create one to book a court."
      />
      <div className="px-6">
        {session.status === 'restoring' ? <SkeletonList count={3} rowHeight={52} /> : <AuthPanel />}
      </div>
    </div>
  )
}

type AccountDetailsProps = {
  account: Account
  onLogOut: () => void
  onOpenGame: (gameId: string) => void
}

function AccountDetails({ account, onLogOut, onOpenGame }: AccountDetailsProps) {
  return (
    <div className="h-full overflow-y-auto noscroll pb-10">
      <ScreenHeader kicker="Padel" title={account.displayName} subtitle={account.email} />
      <div className="px-6">
        <div className="rounded-2xl border border-line bg-surface px-5 py-4">
          <AccountRow label="Name" value={account.displayName} />
          <div className="my-2.5 h-px bg-line" />
          <AccountRow label="Email" value={account.email} />
          <div className="my-2.5 h-px bg-line" />
          <AccountRow label="Account" value="Player" />
        </div>
        <div className="mt-8">
          <PastGames account={account} onOpenGame={onOpenGame} />
        </div>
        <div className="mt-2">
          <Button variant="quiet" onClick={onLogOut}>Log out</Button>
        </div>
      </div>
    </div>
  )
}

function AccountRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[13.5px] text-muted">{label}</span>
      <span className="min-w-0 truncate text-[14.5px] text-white">{value}</span>
    </div>
  )
}

function PastGames({ account, onOpenGame }: { account: Account; onOpenGame: (gameId: string) => void }) {
  const games = useRemote(listMyGames, [account.id])

  if (games.status === 'loading') return <SkeletonList count={2} rowHeight={128} />
  if (games.status === 'failed') {
    return <p className="mb-7 px-1 text-[13.5px] text-warm">{describeError(games.error)}</p>
  }
  return (
    <ListSection title="Past games" emptyMessage="No games played yet.">
      {splitGames(games.data).past.map((game, index) => (
        <GameCard key={game.id} game={game} index={index} past onOpen={() => onOpenGame(game.id)} />
      ))}
    </ListSection>
  )
}
