import { SessionProvider } from './auth/SessionProvider'
import { useSession } from './auth/useSession'
import { AuthScreen } from './screens/AuthScreen'
import { PlayerAccountNotice } from './screens/PlayerAccountNotice'

export function App() {
  return (
    <SessionProvider>
      <SessionGate />
    </SessionProvider>
  )
}

function SessionGate() {
  const { status, account } = useSession()
  if (status === 'restoring') return null
  if (!account) return <AuthScreen />
  if (account.role !== 'centerAdmin') return <PlayerAccountNotice />
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold">Signed in as {account.displayName}</h1>
    </main>
  )
}
