import { ApiError } from './client'

const calmMessages: Record<string, string> = {
  NETWORK: 'Can’t reach the server right now. Check your connection and try again.',
  INVALID_CREDENTIALS: 'That email and password don’t match.',
  EMAIL_TAKEN: 'There’s already an account with this email. Log in instead.',
  SLOT_TAKEN: 'Someone just booked that court. Here is what’s still free.',
  SLOT_IN_PAST: 'That slot has already started. Pick a later one.',
  NOT_A_SLOT: 'That slot is no longer offered. Here is the current list.',
  ALREADY_FRIENDS: 'You’re already friends.',
  REQUEST_PENDING: 'There’s already a request waiting between you two.',
  CANNOT_FRIEND_YOURSELF: 'That’s you.',
  NOT_A_FRIEND: 'You can only invite friends. Add them in Friends first.',
  GAME_FULL: 'All four seats are taken.',
  ALREADY_IN_GAME: 'They’re already in this game.',
  INVITATION_NOT_FOUND: 'That invitation is no longer open.',
  GAME_NOT_FOUND: 'This game is no longer there. It may have been cancelled.',
  HOST_CANNOT_LEAVE: 'The host keeps their seat. Cancel the booking instead.',
  SET_NOT_FOUND: 'That set is no longer there.',
  SET_OUT_OF_RANGE: 'Sets are added one at a time, up to five.',
  NOT_A_PLAYER: 'This app is for players. Centre admins manage their centre on the admin site.',
}

export function describeError(error: unknown): string {
  if (error instanceof ApiError) return calmMessages[error.code] ?? error.message
  return 'Something went wrong. Try again in a moment.'
}
