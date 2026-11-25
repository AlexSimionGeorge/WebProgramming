import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'

export type Remote<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'failed'; error: unknown }

type RemoteControls = {
  /** Load again, dropping the old data first so nothing stale stays on screen meanwhile. */
  reload: () => void
  /** Load again behind the current data, swapping it in when the fresh answer lands. */
  refresh: () => void
}

/**
 * Loads data whenever `dependencies` change, or on `reload` / `refresh`. A change of dependencies
 * always drops the old data: it answered a different question.
 */
export function useRemote<T>(
  load: (signal: AbortSignal) => Promise<T>,
  dependencies: DependencyList,
): Remote<T> & RemoteControls {
  const [remote, setRemote] = useState<Remote<T>>({ status: 'loading' })
  const [generation, setGeneration] = useState(0)
  const keepCurrentData = useRef(false)

  useEffect(() => {
    const controller = new AbortController()
    if (!keepCurrentData.current) setRemote({ status: 'loading' })
    keepCurrentData.current = false
    load(controller.signal)
      .then((data) => { if (!controller.signal.aborted) setRemote({ status: 'ready', data }) })
      .catch((error: unknown) => { if (!controller.signal.aborted) setRemote({ status: 'failed', error }) })
    return () => controller.abort()
  }, [...dependencies, generation])

  const reload = useCallback(() => setGeneration((value) => value + 1), [])
  const refresh = useCallback(() => {
    keepCurrentData.current = true
    setGeneration((value) => value + 1)
  }, [])

  return { ...remote, reload, refresh }
}
