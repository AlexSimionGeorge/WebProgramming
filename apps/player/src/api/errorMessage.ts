import { ApiError } from './client'

const calmMessages: Record<string, string> = {
  NETWORK: 'Can’t reach the server right now. Check your connection and try again.',
  INVALID_CREDENTIALS: 'That email and password don’t match.',
  EMAIL_TAKEN: 'There’s already an account with this email. Log in instead.',
  SLOT_TAKEN: 'Someone just booked that court. Here is what’s still free.',
  SLOT_IN_PAST: 'That slot has already started. Pick a later one.',
  NOT_A_SLOT: 'That slot is no longer offered. Here is the current list.',
  NOT_A_PLAYER: 'This app is for players. Centre admins manage their centre on the admin site.',
}

export function describeError(error: unknown): string {
  if (error instanceof ApiError) return calmMessages[error.code] ?? error.message
  return 'Something went wrong. Try again in a moment.'
}
