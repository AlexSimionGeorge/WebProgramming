import { motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { isApiError } from '../api/client'
import { describeError } from '../api/errorMessage'
import { acceptInvitation, declineInvitation, freeSeat, getGame, invitePerson } from '../api/games'
import type { Game, GameSeat, Person } from '../api/types'
import { useLogOutWhenExpired } from '../auth/useLogOutWhenExpired'
import { Button } from '../components/Button'
import { cancelBookingConfirmation } from '../components/cancelBookingConfirmation'
import { ConfirmSheet, type Confirmation } from '../components/ConfirmSheet'
import { GameReservation } from '../components/GameReservation'
import { GameScore } from '../components/GameScore'
import { InviteFriends } from '../components/InviteFriends'
import { Notice } from '../components/Notice'
import { ScreenHeader } from '../components/ScreenHeader'
import { SkeletonList } from '../components/SkeletonList'
import { TeamSeats } from '../components/TeamSeats'
import { hasEnded, hasStarted } from '../lib/gameLists'
import { springSoft } from '../lib/motion'
import { isGameFull, seatName } from '../lib/seats'
import { useRemote } from '../lib/useRemote'

type GameScreenProps = {
  gameId: string
  onBack: () => void
  onFindFriends: () => void
}

export function GameScreen({ gameId, onBack, onFindFriends }: GameScreenProps) {
  const remote = useRemote((signal) => getGame(gameId, signal), [gameId])
  /** Every write answers with the whole game; the newest answer wins over the first read. */
  const [latest, setLatest] = useState<Game | null>(null)

  useLogOutWhenExpired(remote.status === 'failed' ? remote.error : null)

  if (remote.status === 'loading') {
    return (
      <div className="h-full">
        <ScreenHeader title="Game" onBack={onBack} backLabel="Games" />
        <div className="px-5"><SkeletonList count={3} rowHeight={60} /></div>
      </div>
    )
  }
  if (remote.status === 'failed') {
    const gone = isApiError(remote.error, 'GAME_NOT_FOUND')
    return (
      <div className="h-full">
        <ScreenHeader title="Game" onBack={onBack} backLabel="Games" />
        <div className="px-5">
          <Notice
            tone={gone ? 'calm' : 'warm'}
            message={describeError(remote.error)}
            action={gone ? { label: 'Back to games', onClick: onBack } : { label: 'Try again', onClick: remote.reload }}
          />
        </div>
      </div>
    )
  }

  return <GameDetails game={latest ?? remote.data} onChange={setLatest} onBack={onBack} onFindFriends={onFindFriends} />
}

type GameDetailsProps = {
  game: Game
  onChange: (game: Game) => void
  onBack: () => void
  onFindFriends: () => void
}

/** One screen for everybody in the game; `game.viewer` decides which controls are there. */
function GameDetails({ game, onChange, onBack, onFindFriends }: GameDetailsProps) {
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const { viewer } = game
  const ended = hasEnded(game)
  const newestWrite = useRef(0)

  /**
   * Sends one write and shows the game it answers with — unless a newer write went out meanwhile,
   * whose answer will carry this one's change too. Resolves to null when it was refused.
   */
  const send = async (request: () => Promise<Game>): Promise<Game | null> => {
    const writeNumber = ++newestWrite.current
    setProblem(null)
    try {
      const updated = await request()
      if (writeNumber === newestWrite.current) onChange(updated)
      return updated
    } catch (error) {
      setProblem(describeError(error))
      return null
    }
  }

  /** A seat write, one at a time; `leavesGame` writes take the game away from the viewer, so the screen goes back. */
  const write = async (request: () => Promise<Game>, leavesGame = false) => {
    setBusy(true)
    const updated = await send(request)
    setBusy(false)
    if (updated && leavesGame) onBack()
  }

  const withdraw = (seat: GameSeat) => void write(() => freeSeat(game.id, seat.index))

  const confirmRemoval = (seat: GameSeat) =>
    setConfirmation({
      title: `Take ${seatName(seat)} out?`,
      message: 'Their seat opens again. You can invite them back later.',
      confirmLabel: 'Remove from game',
      workingLabel: 'Removing…',
      keepLabel: 'Keep them',
      onConfirm: async () => onChange(await freeSeat(game.id, seat.index)),
    })

  const confirmLeaving = (seatIndex: number) =>
    setConfirmation({
      title: 'Leave this game?',
      message: `Your seat opens again for ${game.host.displayName} to fill.`,
      confirmLabel: 'Leave game',
      workingLabel: 'Leaving…',
      keepLabel: 'Stay in',
      onConfirm: async () => {
        await freeSeat(game.id, seatIndex)
        onBack()
      },
    })

  const invite = (person: Person) => void write(() => invitePerson(game.id, person.id))

  const canInvite = viewer.isHost && !ended && !isGameFull(game.seats)
  const leavingSeatIndex = !viewer.isHost && !viewer.isInvited ? viewer.seatIndex : null
  const canCancel = viewer.isHost && !hasStarted(game)

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto noscroll pb-6">
        <GameReservation game={game} onBack={onBack} />
        <div className="px-5">
          {problem && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springSoft}
              className="mb-4 px-1 text-[13.5px] leading-snug text-warm"
            >
              {problem}
            </motion.p>
          )}
          <TeamSeats
            game={game}
            busy={busy}
            onWithdraw={viewer.isHost ? withdraw : undefined}
            onRemove={viewer.isHost ? confirmRemoval : undefined}
          />
          <section className="mt-8">
            <h2 className="mb-3 px-1 text-[12px] uppercase tracking-[0.14em] text-muted">Score</h2>
            <GameScore game={game} send={send} />
          </section>
          {canInvite && (
            <section className="mt-8">
              <h2 className="mb-3 px-1 text-[12px] uppercase tracking-[0.14em] text-muted">Invite friends</h2>
              <InviteFriends game={game} busy={busy} onInvite={invite} onFindFriends={onFindFriends} />
            </section>
          )}
        </div>
      </div>

      <GameFooter>
        {viewer.isInvited && (
          <div className="flex gap-3">
            <Button variant="quiet" disabled={busy} onClick={() => void write(() => declineInvitation(game.id), true)}>
              Decline
            </Button>
            <Button disabled={busy} onClick={() => void write(() => acceptInvitation(game.id))}>
              Accept
            </Button>
          </div>
        )}
        {leavingSeatIndex !== null && (
          <Button variant="quiet" disabled={busy} onClick={() => confirmLeaving(leavingSeatIndex)}>Leave game</Button>
        )}
        {canCancel && (
          <Button variant="quiet" disabled={busy} onClick={() => setConfirmation(cancelBookingConfirmation(game, onBack))}>
            Cancel booking
          </Button>
        )}
      </GameFooter>

      <ConfirmSheet confirmation={confirmation} onClose={() => setConfirmation(null)} />
    </div>
  )
}

/** The role's own controls, pinned under the scroll; nothing is drawn when the viewer has none. */
function GameFooter({ children }: { children: React.ReactNode }) {
  const hasControls = (Array.isArray(children) ? children : [children]).some(Boolean)
  if (!hasControls) return null
  return <div className="shrink-0 space-y-3 border-t border-line/70 bg-bg/90 px-5 pt-3 pb-3 backdrop-blur-xl">{children}</div>
}
