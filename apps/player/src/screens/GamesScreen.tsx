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

type GamesScreenProps = {
  onLogIn: () => void
  onFindCourt: () => void
  onOpenGame?: (gameId: string) => void
}

export function GamesScreen({ onLogIn, onFindCourt, onOpenGame }: GamesScreenProps) {
  const session = useSession()

  return (
    <div className="h-full overflow-y-auto noscroll pb-8">
      <ScreenHeader kicker="Padel" title="Games" />
      <div className="px-5">
        {session.status === 'restoring' && <SkeletonList count={3} rowHeight={128} />}
        {session.status === 'anonymous' && (
          <Notice message="Log in to see your games and invitations." action={{ label: 'Log in', onClick: onLogIn }} />
        )}
        {session.status === 'signedIn' && (
          <MyGames account={session.account} onFindCourt={onFindCourt} onOpenGame={onOpenGame} />
        )}
      </div>
    </div>
  )
}

type MyGamesProps = {
  account: Account
  onFindCourt: () => void
  onOpenGame?: (gameId: string) => void
}

function MyGames({ account, onFindCourt, onOpenGame }: MyGamesProps) {
  const games = useRemote(listMyGames, [account.id])
  const [answeringGameId, setAnsweringGameId] = useState<string | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)

  useLogOutWhenExpired(games.status === 'failed' ? games.error : null)

  if (games.status === 'loading') return <SkeletonList count={3} rowHeight={128} />
  if (games.status === 'failed') {
    return <Notice tone="warm" message={describeError(games.error)} action={{ label: 'Try again', onClick: games.reload }} />
  }
  if (games.data.length === 0) {
    return <Notice message="No games yet. Book a court, then invite your friends." action={{ label: 'Find a court', onClick: onFindCourt }} />
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

  const open = (game: Game) => (onOpenGame ? () => onOpenGame(game.id) : undefined)
  const { invitations, upcoming, past } = splitGames(games.data)

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
            onOpen={open(game)}
            onAccept={() => void answer(game, acceptInvitation)}
            onDecline={() => void answer(game, declineInvitation)}
          />
        ))}
      </ListSection>
      <ListSection title="Upcoming" emptyMessage="Nothing coming up.">
        {upcoming.map((game, index) => {
          const started = hasStarted(game)
          return (
            <GameCard
              key={game.id}
              game={game}
              index={invitations.length + index}
              inProgress={started}
              onOpen={open(game)}
              onCancel={game.viewer.isHost && !started
                ? () => setConfirmation(cancelBookingConfirmation(game, games.refresh))
                : undefined}
            />
          )
        })}
      </ListSection>
      <ListSection title="Past">
        {past.map((game, index) => (
          <GameCard key={game.id} game={game} index={invitations.length + upcoming.length + index} past onOpen={open(game)} />
        ))}
      </ListSection>
      <ConfirmSheet confirmation={confirmation} onClose={() => setConfirmation(null)} />
    </>
  )
}
