import { useState, type FormEvent } from 'react'
import { errorMessage } from '../api/client'
import { useSession } from '../auth/useSession'
import { Button } from '../components/Button'
import { CenteredPanel } from '../components/CenteredPanel'
import { ErrorNotice } from '../components/ErrorNotice'
import { TextField } from '../components/TextField'

type AuthMode = 'logIn' | 'register'

const MIN_PASSWORD_LENGTH = 8

export function AuthScreen() {
  const { logIn, register } = useSession()
  const [mode, setMode] = useState<AuthMode>('logIn')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [showFieldErrors, setShowFieldErrors] = useState(false)

  const isRegistering = mode === 'register'
  const fieldErrors = {
    displayName: isRegistering && !displayName.trim() ? 'Tell players who runs the centre.' : undefined,
    email: !email.includes('@') ? 'Enter your email address.' : undefined,
    password:
      isRegistering && password.length < MIN_PASSWORD_LENGTH
        ? `At least ${MIN_PASSWORD_LENGTH} characters.`
        : !password
          ? 'Enter your password.'
          : undefined,
  }
  const hasFieldErrors = Object.values(fieldErrors).some(Boolean)
  const visibleError = (field: keyof typeof fieldErrors) => (showFieldErrors ? fieldErrors[field] : undefined)

  function switchMode() {
    setMode(isRegistering ? 'logIn' : 'register')
    setServerError(null)
    setShowFieldErrors(false)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setShowFieldErrors(true)
    if (hasFieldErrors) return
    setSubmitting(true)
    setServerError(null)
    try {
      const credentials = { email: email.trim(), password }
      if (isRegistering) await register({ ...credentials, displayName: displayName.trim() })
      else await logIn(credentials)
    } catch (error) {
      setServerError(errorMessage(error))
      setSubmitting(false)
    }
  }

  return (
    <CenteredPanel>
      <h1 className="font-display text-[28px] font-semibold leading-tight">
        {isRegistering ? 'Register your centre' : 'Welcome back'}
      </h1>
      <p className="mt-1.5 text-[14.5px] text-muted">
        {isRegistering ? 'Put your courts in front of players.' : 'Log in to manage your courts.'}
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
        {isRegistering && (
          <TextField
            label="Your name"
            value={displayName}
            onChange={setDisplayName}
            autoComplete="name"
            error={visibleError('displayName')}
          />
        )}
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          autoCapitalize="none"
          error={visibleError('email')}
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete={isRegistering ? 'new-password' : 'current-password'}
          error={visibleError('password')}
        />
        <ErrorNotice message={serverError} />
        <Button type="submit" busy={submitting} className="w-full">
          {submitting ? 'One moment…' : isRegistering ? 'Create account' : 'Log in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-[14px] text-muted">
        {isRegistering ? 'Already registered?' : 'New here?'}{' '}
        <Button variant="quiet" onClick={switchMode} className="h-auto px-0">
          {isRegistering ? 'Log in' : 'Register a centre'}
        </Button>
      </p>
    </CenteredPanel>
  )
}
