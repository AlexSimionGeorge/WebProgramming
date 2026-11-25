const TOKEN_STORAGE_KEY = 'padel.sessionToken'

export const sessionToken = {
  read: (): string | null => {
    try { return localStorage.getItem(TOKEN_STORAGE_KEY) } catch { return null }
  },
  write: (token: string) => {
    try { localStorage.setItem(TOKEN_STORAGE_KEY, token) } catch { /* private mode: session lasts this tab */ }
  },
  clear: () => {
    try { localStorage.removeItem(TOKEN_STORAGE_KEY) } catch { /* nothing stored */ }
  },
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type ErrorBody = { error?: { code?: string; message?: string } }

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

export async function apiRequest<T>(path: string, { method = 'GET', body, signal }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = sessionToken.read()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (cause) {
    if (signal?.aborted) throw cause
    throw new ApiError(0, 'NETWORK', 'Can’t reach the server right now.')
  }

  if (response.status === 204) return undefined as T

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const error = (payload as ErrorBody | null)?.error
    throw new ApiError(
      response.status,
      error?.code ?? 'UNKNOWN',
      error?.message ?? 'Something went wrong. Try again in a moment.',
    )
  }
  return payload as T
}

export const isApiError = (error: unknown, code?: string): error is ApiError =>
  error instanceof ApiError && (code === undefined || error.code === code)
