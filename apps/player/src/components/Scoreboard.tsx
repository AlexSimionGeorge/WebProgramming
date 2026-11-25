import { motion } from 'framer-motion'
import type { Game, GameSet } from '../api/types'
import { spring } from '../lib/motion'
import { isFinished, setOutcome, type SetOutcome } from '../lib/score'
import { teamLabel, teamSeats, type Team } from '../lib/seats'
import { Press } from './Press'

type ScoreboardProps = {
  game: Game
  /** The sets as they should read: the server's, with unsent taps already applied. */
  sets: GameSet[]
  selectedSetIndex: number | null
  /** Absent for somebody who may only read the score. */
  onSelectSet?: (setIndex: number) => void
}

const TEAMS: readonly Team[] = ['A', 'B']

/** Team A over team B, one column per set, sets won at the end. */
export function Scoreboard({ game, sets, selectedSetIndex, onSelectSet }: ScoreboardProps) {
  const finished = isFinished(game)
  return (
    <div className="flex items-stretch rounded-2xl border border-line bg-surface px-3 py-2.5" role="table" aria-label="Score">
      <div className="flex min-w-0 flex-1 flex-col" role="rowgroup">
        <HeaderCell label="" />
        {TEAMS.map((team) => <TeamCell key={team} game={game} team={team} />)}
      </div>
      {sets.map((set) => (
        <SetColumn
          key={set.index}
          set={set}
          outcome={setOutcome(set, set.index === sets.length, finished)}
          selected={set.index === selectedSetIndex}
          onSelect={onSelectSet ? () => onSelectSet(set.index) : undefined}
        />
      ))}
      <div className="ml-1.5 flex w-11 shrink-0 flex-col border-l border-line pl-1.5">
        <HeaderCell label="Sets" />
        {TEAMS.map((team) => {
          const mine = team === 'A' ? game.setsWon.teamA : game.setsWon.teamB
          const theirs = team === 'A' ? game.setsWon.teamB : game.setsWon.teamA
          const won = finished && mine > theirs
          return (
            <ScoreCell
              key={team}
              value={mine}
              tone={!finished ? 'neutral' : won ? 'found' : mine < theirs ? 'lost' : 'plain'}
              large
              label={`${teamLabel(team)}, sets won ${mine}`}
            />
          )
        })}
      </div>
    </div>
  )
}

const ROW_HEIGHT = 'h-[40px]'

function HeaderCell({ label }: { label: string }) {
  return <div className="flex h-[20px] items-center justify-center text-[10.5px] uppercase tracking-[0.12em] text-muted">{label}</div>
}

function TeamCell({ game, team }: { game: Game; team: Team }) {
  const names = teamSeats(game.seats, team)
    .filter((seat) => seat.status === 'filled')
    .map((seat) => seat.person?.displayName.split(' ')[0] ?? 'Player')
  return (
    <div className={`flex ${ROW_HEIGHT} min-w-0 flex-col justify-center`} role="rowheader">
      <span className="text-[11px] uppercase tracking-[0.12em] text-muted">{teamLabel(team)}</span>
      <span className="truncate text-[13px] text-soft">{names.length > 0 ? names.join(' · ') : 'Open'}</span>
    </div>
  )
}

type SetColumnProps = {
  set: GameSet
  outcome: SetOutcome
  selected: boolean
  onSelect?: () => void
}

function SetColumn({ set, outcome, selected, onSelect }: SetColumnProps) {
  const toneFor = (team: Team): CellTone => {
    if (outcome === 'open' || outcome === 'draw') return 'plain'
    return (outcome === 'teamA') === (team === 'A') ? 'won' : 'lost'
  }
  const cells = (
    <>
      <HeaderCell label={`S${set.index}`} />
      <ScoreCell value={set.teamA} tone={toneFor('A')} label={`Team A, set ${set.index}: ${set.teamA}`} />
      <ScoreCell value={set.teamB} tone={toneFor('B')} label={`Team B, set ${set.index}: ${set.teamB}`} />
    </>
  )
  const frame = `relative flex w-9 shrink-0 flex-col rounded-xl`
  return (
    <motion.div layout transition={spring} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="shrink-0">
      {onSelect ? (
        <Press soft onClick={onSelect} aria-pressed={selected} aria-label={`Edit set ${set.index}`} className={frame}>
          {selected && (
            <motion.span layoutId="selected-set" transition={spring} aria-hidden
              className="absolute inset-0 rounded-xl border border-primary bg-primary/12" />
          )}
          <span className="relative flex flex-col">{cells}</span>
        </Press>
      ) : (
        <div className={frame}>{cells}</div>
      )}
    </motion.div>
  )
}

type CellTone = 'won' | 'lost' | 'plain' | 'neutral' | 'found'

const toneClasses: Record<CellTone, string> = {
  won: 'text-white',
  lost: 'text-muted',
  plain: 'text-white',
  neutral: 'text-soft',
  found: 'text-accent-dark',
}

function ScoreCell({ value, tone, label, large = false }: { value: number; tone: CellTone; label: string; large?: boolean }) {
  return (
    <div className={`flex ${ROW_HEIGHT} items-center justify-center`} role="cell" aria-label={label}>
      <span className={`font-display leading-none tnum ${large ? 'text-[22px]' : 'text-[19px]'} ${toneClasses[tone]}`}>
        {value}
      </span>
    </div>
  )
}
