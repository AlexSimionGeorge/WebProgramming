import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { describeError } from '../api/errorMessage'
import { useSession } from '../auth/SessionProvider'
import { spring, springSoft } from '../lib/motion'
import { Button } from './Button'
import { Press } from './Press'
import { TextField } from './TextField'

type AuthMode = 'logIn' | 'register'

const MIN_PASSWORD_LENGTH = 8

const modeLabels: Record<AuthMode, string> = { logIn: 'I have an account', register: 'New account' }
const submitLabels: Record<AuthMode, { idle: string; busy: string }> = {
  logIn: { idle: 'Log in', busy: 'Checking…' },
  register: { idle: 'Create account', busy: 'Creating your account…' },
}

function validationProblem(mode: AuthMode, email: string, password: string, displayName: string): string | null {
  if (mode === 'register' && !displayName.trim()) return 'Tell us your name.'
  if (!email.includes('@')) return 'That doesn’t look like an email address.'
  if (mode === 'register' && password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters for the password.`
  }
  if (!password) return 'Enter your password.'
  return null
}

export function AuthPanel() {
  const { logIn, register } = useSession()
  const [mode, setMode] = useState<AuthMode>('logIn')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  const switchMode = (next: AuthMode) => {
    setMode(next)
    setProblem(null)
  }

  const submit = async () => {
    if (busy) return
    const localProblem = validationProblem(mode, email, password, displayName)
    setProblem(localProblem)
    if (localProblem) return

    setBusy(true)
    try {
      if (mode === 'logIn') await logIn({ email: email.trim(), password })
      else await register({ email: email.trim(), password, displayName: displayName.trim() })
    } catch (error) {
      setProblem(describeError(error))
      setBusy(false)
    }
  }

  return (
    <form className="w-full" onSubmit={(event) => { event.preventDefault(); void submit() }}>
      <div className="relative flex rounded-2xl border border-line bg-surface p-1">
        <motion.span
          aria-hidden
          animate={{ x: mode === 'register' ? '100%' : '0%' }}
          transition={spring}
          className="pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-[14px] bg-primary"
        />
        {(['logIn', 'register'] as const).map((option) => (
          <Press
            key={option}
            soft
            onClick={() => switchMode(option)}
            aria-pressed={mode === option}
            className="relative h-[42px] flex-1 rounded-[14px] text-[14.5px]"
          >
            <span className={mode === option ? 'font-medium text-white' : 'text-muted'}>{modeLabels[option]}</span>
          </Press>
        ))}
      </div>

      <div className="mt-5 space-y-3.5">
        <AnimatePresence initial={false}>
          {mode === 'register' && (
            <motion.div
              key="displayName"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={springSoft}
            >
              <TextField label="Your name" value={displayName} onChange={setDisplayName} autoComplete="name" />
            </motion.div>
          )}
        </AnimatePresence>
        <TextField label="Email" value={email} onChange={setEmail} type="email" autoComplete="email" />
        <TextField
          label="Password"
          value={password}
          onChange={setPassword}
          type="password"
          autoComplete={mode === 'logIn' ? 'current-password' : 'new-password'}
        />
      </div>

      <div className="flex min-h-[42px] items-center pt-3" aria-live="polite">
        <AnimatePresence initial={false} mode="wait">
          {problem && (
            <motion.p
              key={problem}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={springSoft}
              className="text-[13.5px] leading-snug text-warm"
            >
              {problem}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <Button type="submit" disabled={busy}>
        {busy ? submitLabels[mode].busy : submitLabels[mode].idle}
      </Button>
    </form>
  )
}
