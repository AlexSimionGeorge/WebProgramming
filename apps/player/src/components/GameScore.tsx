import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { finishGame, removeSet, reopenGame, saveSet } from '../api/games'
import type { Game, GameSet, SetScore } from '../api/types'
import { spring } from '../lib/motion'
import { clampGames, isFinished, MAX_GAMES, MAX_SETS, MIN_GAMES } from '../lib/score'
import { teamLabel } from '../lib/seats'
import { useSetDrafts } from '../lib/useSetDrafts'
import { RowAction } from './RowAction'
import { Scoreboard } from './Scoreboard'
import { Stepper } from './Stepper'

type GameScoreProps = {
  game: Game
  /** Sends a write that answers with the whole game; rejects with the reason. */
  send: (request: () => Promise<Game>) => Promise<Game | null>
}

/** The score, set by set. Anybody seated may keep it; everybody else reads it. */
export function GameScore({ game, send }: GameScoreProps) {
  const canScore = game.viewer.canScore
  const finished = isFinished(game)
  const [selectedSetIndex, setSelectedSetIndex] = useState<number | null>(() =>
    canScore && !finished && game.sets.length > 0 ? game.sets.length : null,
  )
  const drafts = useSetDrafts((setIndex, score) => send(() => saveSet(game.id, setIndex, score)))

  const sets: GameSet[] = game.sets.map((set) => ({ ...set, ...drafts.drafts[set.index] }))
  const selectedSet = sets.find((set) => set.index === selectedSetIndex) ?? null

  if (!canScore && sets.length === 0) {
    return <p className="px-1 text-[14px] text-muted">No score yet.</p>
  }

  const addSet = async () => {
    const nextIndex = sets.length + 1
    const updated = await send(() => saveSet(game.id, nextIndex, { teamA: 0, teamB: 0 }))
    if (updated) setSelectedSetIndex(nextIndex)
  }

  const dropSet = async (setIndex: number) => {
    drafts.discard()
    const updated = await send(() => removeSet(game.id, setIndex))
    if (updated) setSelectedSetIndex(null)
  }

  const toggleFinished = async () => {
    const updated = await send(() => (finished ? reopenGame(game.id) : finishGame(game.id)))
    if (updated && !finished) setSelectedSetIndex(null)
  }

  const changeSelected = (set: GameSet, score: SetScore) =>
    drafts.change(set.index, { teamA: clampGames(score.teamA), teamB: clampGames(score.teamB) })

  return (
    <div>
      {sets.length > 0 ? (
        <Scoreboard
          game={game}
          sets={sets}
          selectedSetIndex={canScore ? selectedSetIndex : null}
          onSelectSet={canScore ? (index) => setSelectedSetIndex((current) => (current === index ? null : index)) : undefined}
        />
      ) : (
        <p className="px-1 text-[14px] text-muted">No score yet.</p>
      )}

      {canScore && (
        <>
          <AnimatePresence initial={false}>
            {selectedSet && (
              <motion.div
                key="editor"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={spring}
                className="overflow-hidden"
              >
                <SetEditor
                  set={selectedSet}
                  onChange={(score) => changeSelected(selectedSet, score)}
                  onRemove={() => void dropSet(selectedSet.index)}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="mt-3 flex flex-wrap gap-2">
            {sets.length < MAX_SETS && (
              <RowAction label="Add set" onClick={() => void addSet()} disabled={drafts.hasDrafts} />
            )}
            {sets.length > 0 && (
              <RowAction
                label={finished ? 'Reopen' : 'Finish'}
                variant={finished ? 'quiet' : 'primary'}
                onClick={() => void toggleFinished()}
                disabled={drafts.hasDrafts}
                ariaLabel={finished ? 'Reopen the game to change the score' : 'Finish the game'}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}

type SetEditorProps = {
  set: GameSet
  onChange: (score: SetScore) => void
  onRemove: () => void
}

function SetEditor({ set, onChange, onRemove }: SetEditorProps) {
  return (
    <div className="mt-3 rounded-2xl border border-line bg-surface px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-[12px] uppercase tracking-[0.14em] text-muted">Set {set.index}</span>
        <RowAction label="Remove set" onClick={onRemove} ariaLabel={`Remove set ${set.index}`} />
      </div>
      {(['A', 'B'] as const).map((team) => (
        <div key={team} className="mt-2 flex items-center justify-between">
          <span className="text-[14.5px] text-soft">{teamLabel(team)}</span>
          <Stepper
            label={`${teamLabel(team)}, set ${set.index}`}
            value={team === 'A' ? set.teamA : set.teamB}
            min={MIN_GAMES}
            max={MAX_GAMES}
            onChange={(games) => onChange(team === 'A' ? { ...set, teamA: games } : { ...set, teamB: games })}
          />
        </div>
      ))}
    </div>
  )
}
