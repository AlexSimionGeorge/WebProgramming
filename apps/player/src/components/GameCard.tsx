import { motion } from 'framer-motion'
import type { Game } from '../api/types'
import { shortDateLabel } from '../lib/dates'
import { riseIn } from '../lib/motion'
import { setScoresLabel, setsWonLabel } from '../lib/score'
import { Press } from './Press'
import { RowAction } from './RowAction'
import { SeatCells } from './SeatCells'

type GameCardProps = {
  game: Game
  index: number
  past?: boolean
  inProgress?: boolean
  busy?: boolean
  onOpen?: () => void
  /** Only for an invitation waiting on my answer. */
  onAccept?: () => void
  onDecline?: () => void
  /** Only for the host, before it starts. */
  onCancel?: () => void
}

export function GameCard({
  game, index, past = false, inProgress = false, busy = false, onOpen, onAccept, onDecline, onCancel,
}: GameCardProps) {
  const hasActions = Boolean(onAccept || onDecline || onCancel)
  return (
    <motion.div
      layout="position"
      {...riseIn(index)}
      className={`rounded-2xl border ${past ? 'border-line/60 bg-surface/40' : 'border-line bg-surface'}`}
    >
      <Press soft onClick={onOpen} disabled={!onOpen} className="block w-full px-5 text-left" style={{ paddingBlock: 'var(--row-y)' }}>
        <div className="flex items-center gap-4">
          <div className="w-[64px] shrink-0">
            <div className={`font-display text-[25px] leading-none tnum ${past ? 'text-soft' : 'text-white'}`}>
              {game.startsAt}
            </div>
            <div className="mt-1 text-[11px] text-muted tnum">– {game.endsAt}</div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[12px] text-muted">{shortDateLabel(game.date)}</div>
            <div className={`truncate text-[15px] leading-tight ${past ? 'text-soft' : 'text-white'}`}>{game.center.name}</div>
            <div className="mt-0.5 truncate text-[12px] text-muted">
              {game.court.name} · {game.center.city}
            </div>
          </div>
          {inProgress && <span className="shrink-0 text-[12.5px] text-primary-fg">Playing now</span>}
        </div>
        <div className="mt-3">
          <SeatCells seats={game.seats} />
        </div>
        {game.sets.length > 0 && <ScoreSummary game={game} />}
      </Press>
      {hasActions && (
        <div className="flex items-center justify-end gap-2 border-t border-line/70 px-4 py-2.5">
          {onAccept && (
            <span className="mr-auto min-w-0 truncate pl-1 text-[13px] text-muted">{game.host.displayName} invited you</span>
          )}
          {onDecline && <RowAction label="Decline" disabled={busy} onClick={onDecline} />}
          {onAccept && <RowAction label="Accept" variant="primary" disabled={busy} onClick={onAccept} />}
          {onCancel && <RowAction label="Cancel booking" disabled={busy} onClick={onCancel} />}
        </div>
      )}
    </motion.div>
  )
}

function ScoreSummary({ game }: { game: Game }) {
  return (
    <div className="mt-2.5 flex items-baseline justify-between gap-3 text-[13px] tnum">
      <span className="truncate text-soft">{setScoresLabel(game.sets)}</span>
      <span className="shrink-0 text-accent-dark" aria-label={`Sets won ${setsWonLabel(game.setsWon)}`}>
        {setsWonLabel(game.setsWon)}
      </span>
    </div>
  )
}
