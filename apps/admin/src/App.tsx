import { SessionProvider } from './auth/SessionProvider'
import { useSession } from './auth/useSession'
import { AdminHome } from './screens/AdminHome'
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
  return <AdminHome account={account} />
}
