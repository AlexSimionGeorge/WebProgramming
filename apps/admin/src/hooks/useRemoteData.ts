import { useCallback, useEffect, useState } from 'react'
import { errorMessage } from '../api/client'

export type RemoteData<T> =
  | { status: 'loading' }
  | { status: 'failed'; message: string }
  | { status: 'ready'; data: T }

export function useRemoteData<T>(load: () => Promise<T>) {
  const [state, setState] = useState<RemoteData<T>>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    load()
      .then((data) => !cancelled && setState({ status: 'ready', data }))
      .catch((error: unknown) => !cancelled && setState({ status: 'failed', message: errorMessage(error) }))
    return () => {
      cancelled = true
    }
  }, [load, attempt])

  const retry = useCallback(() => setAttempt((count) => count + 1), [])
  const replaceData = useCallback((data: T) => setState({ status: 'ready', data }), [])

  return { state, retry, replaceData }
}
