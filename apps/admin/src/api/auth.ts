import { apiRequest } from './client'
import type { Account, AuthSession, Credentials, Registration } from './types'

export function register(registration: Registration) {
  return apiRequest<AuthSession>('POST', '/auth/register', registration)
}

export function logIn(credentials: Credentials) {
  return apiRequest<AuthSession>('POST', '/auth/login', credentials)
}

export async function fetchCurrentAccount() {
  const { account } = await apiRequest<{ account: Account }>('GET', '/auth/me')
  return account
}
