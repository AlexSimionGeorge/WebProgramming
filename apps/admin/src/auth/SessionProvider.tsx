import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as authApi from '../api/auth'
import { onRejectedToken } from '../api/client'
import { clearToken, readToken, saveToken } from '../api/tokenStorage'
import type { Account, AuthSession, Credentials } from '../api/types'
import { SessionContext, type NewCenterAccount, type Session, type SessionStatus } from './SessionContext'

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>(() => (readToken() ? 'restoring' : 'signedOut'))
  const [account, setAccount] = useState<Account | null>(null)

  const signOut = useCallback(() => {
    clearToken()
    setAccount(null)
    setStatus('signedOut')
  }, [])

  useEffect(() => {
    onRejectedToken(signOut)
  }, [signOut])

  useEffect(() => {
    if (status !== 'restoring') return
    let cancelled = false
    authApi
      .fetchCurrentAccount()
      .then((restored) => {
        if (cancelled) return
        setAccount(restored)
        setStatus('signedIn')
      })
      .catch(() => {
        if (!cancelled) setStatus('signedOut')
      })
    return () => {
      cancelled = true
    }
  }, [status])

  const startSession = useCallback((session: AuthSession) => {
    saveToken(session.token)
    setAccount(session.account)
    setStatus('signedIn')
  }, [])

  const logIn = useCallback(
    async (credentials: Credentials) => startSession(await authApi.logIn(credentials)),
    [startSession],
  )

  const register = useCallback(
    async (newAccount: NewCenterAccount) =>
      startSession(await authApi.register({ ...newAccount, role: 'centerAdmin' })),
    [startSession],
  )

  const session = useMemo<Session>(
    () => ({ status, account, logIn, register, logOut: signOut }),
    [status, account, logIn, register, signOut],
  )

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
}
