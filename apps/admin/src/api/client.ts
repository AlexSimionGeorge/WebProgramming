import type { ApiErrorBody } from './types'
import { readToken } from './tokenStorage'

export class ApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

let handleRejectedToken: () => void = () => {}

export function onRejectedToken(handler: () => void) {
  handleRejectedToken = handler
}

export async function apiRequest<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = readToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'The server cannot be reached. Check your connection and try again.')
  }

  if (response.status === 204) return undefined as T

  const payload: unknown = await response.json().catch(() => null)
  if (response.ok) return payload as T
  if (response.status === 401 && token) handleRejectedToken()
  throw toApiError(response.status, payload)
}

function toApiError(status: number, payload: unknown): ApiError {
  if (isApiErrorBody(payload)) {
    return new ApiError(status, payload.error.code, payload.error.message)
  }
  return new ApiError(status, 'UNEXPECTED_RESPONSE', 'The server gave an unexpected answer. Try again in a moment.')
}

function isApiErrorBody(payload: unknown): payload is ApiErrorBody {
  if (typeof payload !== 'object' || payload === null || !('error' in payload)) return false
  const { error } = payload as { error: unknown }
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return 'Something went wrong. Try again.'
}
