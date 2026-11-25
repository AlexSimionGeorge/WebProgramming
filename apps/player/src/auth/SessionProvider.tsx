import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { fetchCurrentAccount, logIn as requestLogIn, registerPlayer, type Credentials, type Registration } from '../api/auth'
import { ApiError, isApiError, sessionToken } from '../api/client'
import type { Account, AuthResponse } from '../api/types'

type Session =
  | { status: 'restoring'; account: null }
  | { status: 'anonymous'; account: null }
  | { status: 'signedIn'; account: Account }

type SessionContextValue = Session & {
  logIn: (credentials: Credentials) => Promise<void>
  register: (registration: Registration) => Promise<void>
  logOut: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

const anonymous: Session = { status: 'anonymous', account: null }

const notAPlayer = () =>
  new ApiError(403, 'NOT_A_PLAYER', 'This app is for players.')

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(() =>
    sessionToken.read() ? { status: 'restoring', account: null } : anonymous,
  )

  useEffect(() => {
    if (session.status !== 'restoring') return
    let active = true
    fetchCurrentAccount()
      .then((account) => {
        if (!active) return
        if (account.role !== 'player') {
          sessionToken.clear()
          setSession(anonymous)
          return
        }
        setSession({ status: 'signedIn', account })
      })
      .catch((error: unknown) => {
        if (!active) return
        if (isApiError(error) && error.status === 401) sessionToken.clear()
        setSession(anonymous)
      })
    return () => { active = false }
  }, [session.status])

  const startSession = useCallback(({ token, account }: AuthResponse) => {
    if (account.role !== 'player') throw notAPlayer()
    sessionToken.write(token)
    setSession({ status: 'signedIn', account })
  }, [])

  const logIn = useCallback(
    async (credentials: Credentials) => startSession(await requestLogIn(credentials)),
    [startSession],
  )

  const register = useCallback(
    async (registration: Registration) => startSession(await registerPlayer(registration)),
    [startSession],
  )

  const logOut = useCallback(() => {
    sessionToken.clear()
    setSession(anonymous)
  }, [])

  const value = useMemo(() => ({ ...session, logIn, register, logOut }), [session, logIn, register, logOut])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext)
  if (!value) throw new Error('useSession must be used inside SessionProvider')
  return value
}
