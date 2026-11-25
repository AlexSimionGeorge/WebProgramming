import { useCallback, useEffect, useState } from 'react'
import { fetchCenter } from '../api/admin'
import { errorMessage } from '../api/client'
import type { CenterDetails } from '../api/types'

export type CenterState =
  | { status: 'loading' }
  | { status: 'failed'; message: string }
  | { status: 'ready'; center: CenterDetails | null }

export function useCenter() {
  const [state, setState] = useState<CenterState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    fetchCenter()
      .then((center) => !cancelled && setState({ status: 'ready', center }))
      .catch((error: unknown) => !cancelled && setState({ status: 'failed', message: errorMessage(error) }))
    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => setAttempt((count) => count + 1), [])
  const replaceCenter = useCallback((center: CenterDetails) => setState({ status: 'ready', center }), [])

  return { state, retry, replaceCenter }
}
