import { createContext } from 'react'
import type { Account, Credentials } from '../api/types'

export type SessionStatus = 'restoring' | 'signedOut' | 'signedIn'

export type NewCenterAccount = Credentials & { displayName: string }

export type Session = {
  status: SessionStatus
  account: Account | null
  logIn: (credentials: Credentials) => Promise<void>
  register: (newAccount: NewCenterAccount) => Promise<void>
  logOut: () => void
}

export const SessionContext = createContext<Session | null>(null)
