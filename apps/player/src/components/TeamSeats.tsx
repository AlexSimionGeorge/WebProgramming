import { motion } from 'framer-motion'
import type { Game, GameSeat } from '../api/types'
import { spring } from '../lib/motion'
import { seatDescription, seatKey, seatName, teamLabel, teamSeats, type Team } from '../lib/seats'
import { PersonInitial } from './PersonRow'
import { Press } from './Press'

type TeamSeatsProps = {
  game: Game
  busy: boolean
  /** Host only: an invitation goes back in one tap, nothing to undo. */
  onWithdraw?: (seat: GameSeat) => void
  /** Host only: taking out somebody who said yes is asked first by the caller. */
  onRemove?: (seat: GameSeat) => void
}

/** Two teams, seats 1 + 2 against 3 + 4, each packed so people come first and open seats last. */
export function TeamSeats({ game, busy, onWithdraw, onRemove }: TeamSeatsProps) {
  return (
    <div className="space-y-4">
      {(['A', 'B'] as const).map((team) => (
        <TeamRow key={team} team={team} game={game} busy={busy} onWithdraw={onWithdraw} onRemove={onRemove} />
      ))}
    </div>
  )
}

function TeamRow({ team, game, busy, onWithdraw, onRemove }: TeamSeatsProps & { team: Team }) {
  return (
    <section aria-label={teamLabel(team)}>
      <h3 className="mb-2 px-1 text-[12px] uppercase tracking-[0.14em] text-muted">{teamLabel(team)}</h3>
      <div className="grid grid-cols-2 gap-2">
        {teamSeats(game.seats, team).map((seat) => (
          <SeatTile
            key={seatKey(seat)}
            seat={seat}
            isHostSeat={seat.person?.id === game.host.id}
            isMine={seat.index === game.viewer.seatIndex}
            busy={busy}
            onWithdraw={onWithdraw}
            onRemove={onRemove}
          />
        ))}
      </div>
    </section>
  )
}

type SeatTileProps = {
  seat: GameSeat
  isHostSeat: boolean
  isMine: boolean
  busy: boolean
  onWithdraw?: (seat: GameSeat) => void
  onRemove?: (seat: GameSeat) => void
}

const tileSkins: Record<GameSeat['status'], string> = {
  filled: 'border-[#2d363e] bg-elevated',
  invited: 'border-line bg-surface',
  empty: 'border-dashed border-line',
}

function SeatTile({ seat, isHostSeat, isMine, busy, onWithdraw, onRemove }: SeatTileProps) {
  const action = seatAction(seat, isHostSeat, onWithdraw, onRemove)
  const subline = seat.status === 'invited' ? 'Invited' : isMine ? 'You' : isHostSeat ? 'Host' : ''
  const body = (
    <>
      <SeatMark seat={seat} />
      <span className="min-w-0 flex-1 text-left">
        <span className={`block truncate text-[14px] leading-tight ${
          seat.status === 'empty' ? 'text-faint' : seat.status === 'invited' ? 'text-soft' : 'text-white'
        }`}>
          {seatName(seat)}
        </span>
        <span className="block h-[14px] truncate text-[11.5px] leading-[14px] text-muted">{subline}</span>
      </span>
      {action && <RemoveMark />}
    </>
  )
  const className = `flex h-[60px] w-full min-w-0 items-center gap-2.5 rounded-2xl border px-3 ${tileSkins[seat.status]}`

  return (
    <motion.div layout transition={spring} className="min-w-0">
      {action ? (
        <Press soft onClick={action.run} disabled={busy} aria-label={action.label} className={className}>
          {body}
        </Press>
      ) : (
        <div className={className} aria-label={seatDescription(seat)}>{body}</div>
      )}
    </motion.div>
  )
}

function seatAction(
  seat: GameSeat,
  isHostSeat: boolean,
  onWithdraw?: (seat: GameSeat) => void,
  onRemove?: (seat: GameSeat) => void,
) {
  const name = seatName(seat)
  if (seat.status === 'invited' && onWithdraw) {
    return { label: `${name}, invited. Withdraw the invitation`, run: () => onWithdraw(seat) }
  }
  if (seat.status === 'filled' && !isHostSeat && onRemove) {
    return { label: `Remove ${name} from the game`, run: () => onRemove(seat) }
  }
  return null
}

/** The initial in a circle; an open seat is a dashed circle with nothing in it. */
function SeatMark({ seat }: { seat: GameSeat }) {
  if (seat.status === 'empty') {
    return <span aria-hidden className="h-9 w-9 shrink-0 rounded-full border border-dashed border-line" />
  }
  return (
    <span className="relative shrink-0">
      <PersonInitial name={seatName(seat)} />
      {seat.status === 'invited' && (
        <span aria-hidden className="absolute -top-0.5 -right-0.5 h-[9px] w-[9px] rounded-full border-[1.5px] border-primary-fg bg-bg" />
      )}
    </span>
  )
}

function RemoveMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-3.5 w-3.5 shrink-0 text-muted" fill="none"
      stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}
