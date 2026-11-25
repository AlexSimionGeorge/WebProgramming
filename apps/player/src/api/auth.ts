import { apiRequest } from './client'
import type { Account, AuthResponse } from './types'

export type Credentials = { email: string; password: string }
export type Registration = Credentials & { displayName: string }

export const logIn = (credentials: Credentials) =>
  apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: credentials })

export const registerPlayer = (registration: Registration) =>
  apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: { ...registration, role: 'player' } })

export const fetchCurrentAccount = () =>
  apiRequest<{ account: Account }>('/auth/me').then(({ account }) => account)
