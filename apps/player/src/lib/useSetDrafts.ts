import { useCallback, useEffect, useRef, useState } from 'react'
import type { SetScore } from '../api/types'

const SAVE_DELAY_MS = 450

type SaveSet = (setIndex: number, score: SetScore) => Promise<unknown>

/**
 * Set scores the player is still tapping: shown at once, written once the taps settle. A draft
 * leaves when its own write has answered, so the digit never jumps back while a newer tap is waiting.
 */
export function useSetDrafts(save: SaveSet) {
  const [drafts, setDrafts] = useState<Record<number, SetScore>>({})
  const timers = useRef(new Map<number, number>())
  const pending = useRef(new Map<number, SetScore>())
  const latestSave = useRef(save)
  latestSave.current = save

  const send = useCallback((setIndex: number, score: SetScore) => {
    timers.current.delete(setIndex)
    pending.current.delete(setIndex)
    void latestSave.current(setIndex, score).finally(() => {
      setDrafts((current) => {
        if (current[setIndex] !== score) return current
        const { [setIndex]: _settled, ...rest } = current
        return rest
      })
    })
  }, [])

  const change = useCallback((setIndex: number, score: SetScore) => {
    setDrafts((current) => ({ ...current, [setIndex]: score }))
    pending.current.set(setIndex, score)
    window.clearTimeout(timers.current.get(setIndex))
    timers.current.set(setIndex, window.setTimeout(() => send(setIndex, score), SAVE_DELAY_MS))
  }, [send])

  /** Drops every unsent tap, for a change that renumbers the sets underneath them. */
  const discard = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current.clear()
    pending.current.clear()
    setDrafts({})
  }, [])

  // Leaving the screen mid-tap still writes what was tapped.
  useEffect(() => () => {
    timers.current.forEach((timer) => window.clearTimeout(timer))
    pending.current.forEach((score, setIndex) => void latestSave.current(setIndex, score))
  }, [])

  return { drafts, change, discard, hasDrafts: Object.keys(drafts).length > 0 }
}
