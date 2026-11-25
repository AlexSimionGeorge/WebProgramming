import { useState } from 'react'
import { describeError } from '../api/errorMessage'
import { acceptInvitation, declineInvitation, listMyGames } from '../api/games'
import type { Account, Game } from '../api/types'
import { useLogOutWhenExpired } from '../auth/useLogOutWhenExpired'
import { useSession } from '../auth/SessionProvider'
import { cancelBookingConfirmation } from '../components/cancelBookingConfirmation'
import { ConfirmSheet, type Confirmation } from '../components/ConfirmSheet'
import { GameCard } from '../components/GameCard'
import { ListSection } from '../components/ListSection'
import { Notice } from '../components/Notice'
import { ScreenHeader } from '../components/ScreenHeader'
import { SkeletonList } from '../components/SkeletonList'
import { hasStarted, splitGames } from '../lib/gameLists'
import { useRemote } from '../lib/useRemote'

type HomeScreenProps = {
  onLogIn: () => void
  onReserve: () => void
  onOpenGame: (gameId: string) => void
}

/** What is waiting on me and what is coming up. */
export function HomeScreen({ onLogIn, onReserve, onOpenGame }: HomeScreenProps) {
  const session = useSession()

  return (
    <div className="h-full overflow-y-auto noscroll pb-8">
      <ScreenHeader
        kicker="Padel"
        title={session.status === 'signedIn' ? `Hi, ${session.account.displayName.split(' ')[0]}` : 'Home'}
      />
      <div className="px-5">
        {session.status === 'restoring' && <SkeletonList count={3} rowHeight={128} />}
        {session.status === 'anonymous' && (
          <Notice message="Log in to see your games and invitations." action={{ label: 'Log in', onClick: onLogIn }} />
        )}
        {session.status === 'signedIn' && (
          <ComingUp account={session.account} onReserve={onReserve} onOpenGame={onOpenGame} />
        )}
      </div>
    </div>
  )
}

type ComingUpProps = {
  account: Account
  onReserve: () => void
  onOpenGame: (gameId: string) => void
}

function ComingUp({ account, onReserve, onOpenGame }: ComingUpProps) {
  const games = useRemote(listMyGames, [account.id])
  const [answeringGameId, setAnsweringGameId] = useState<string | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)

  useLogOutWhenExpired(games.status === 'failed' ? games.error : null)

  if (games.status === 'loading') return <SkeletonList count={3} rowHeight={128} />
  if (games.status === 'failed') {
    return <Notice tone="warm" message={describeError(games.error)} action={{ label: 'Try again', onClick: games.reload }} />
  }

  const answer = async (game: Game, respond: (gameId: string) => Promise<Game>) => {
    setAnsweringGameId(game.id)
    setProblem(null)
    try {
      await respond(game.id)
    } catch (error) {
      setProblem(describeError(error))
    } finally {
      setAnsweringGameId(null)
      games.refresh()
    }
  }

  const { invitations, upcoming } = splitGames(games.data)

  return (
    <>
      {problem && <p role="alert" className="mb-4 px-1 text-[13.5px] leading-snug text-warm">{problem}</p>}
      <ListSection title="Invitations">
        {invitations.map((game, index) => (
          <GameCard
            key={game.id}
            game={game}
            index={index}
            busy={answeringGameId === game.id}
            onOpen={() => onOpenGame(game.id)}
            onAccept={() => void answer(game, acceptInvitation)}
            onDecline={() => void answer(game, declineInvitation)}
          />
        ))}
      </ListSection>
      {upcoming.length === 0 ? (
        <Notice message="No upcoming reservation." action={{ label: 'Reserve a court', onClick: onReserve, primary: true }} />
      ) : (
        <ListSection title="Upcoming">
          {upcoming.map((game, index) => {
            const started = hasStarted(game)
            return (
              <GameCard
                key={game.id}
                game={game}
                index={invitations.length + index}
                inProgress={started}
                onOpen={() => onOpenGame(game.id)}
                onCancel={game.viewer.isHost && !started
                  ? () => setConfirmation(cancelBookingConfirmation(game, games.refresh))
                  : undefined}
              />
            )
          })}
        </ListSection>
      )}
      <ConfirmSheet confirmation={confirmation} onClose={() => setConfirmation(null)} />
    </>
  )
}
