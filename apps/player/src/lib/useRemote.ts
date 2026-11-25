import { useCallback, useEffect, useState, type DependencyList } from 'react'

export type Remote<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'failed'; error: unknown }

/**
 * Loads data whenever `dependencies` change or `reload` is called. A reload drops the old
 * data first, so nothing stale stays on screen while the fresh answer is on its way.
 */
export function useRemote<T>(
  load: (signal: AbortSignal) => Promise<T>,
  dependencies: DependencyList,
): Remote<T> & { reload: () => void } {
  const [remote, setRemote] = useState<Remote<T>>({ status: 'loading' })
  const [generation, setGeneration] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setRemote({ status: 'loading' })
    load(controller.signal)
      .then((data) => { if (!controller.signal.aborted) setRemote({ status: 'ready', data }) })
      .catch((error: unknown) => { if (!controller.signal.aborted) setRemote({ status: 'failed', error }) })
    return () => controller.abort()
  }, [...dependencies, generation])

  const reload = useCallback(() => setGeneration((value) => value + 1), [])

  return { ...remote, reload }
}
