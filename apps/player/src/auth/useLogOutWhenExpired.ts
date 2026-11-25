import { useEffect } from 'react'
import { isApiError } from '../api/client'
import { useSession } from './SessionProvider'

/** A 401 from any load means the token is gone: drop the session so the screen asks to log in again. */
export function useLogOutWhenExpired(error: unknown) {
  const { logOut } = useSession()
  const expired = isApiError(error) && error.status === 401
  useEffect(() => {
    if (expired) logOut()
  }, [expired, logOut])
}
