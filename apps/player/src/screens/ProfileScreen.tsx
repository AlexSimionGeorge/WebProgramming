import type { Account } from '../api/types'
import { useSession } from '../auth/SessionProvider'
import { AuthPanel } from '../components/AuthPanel'
import { Button } from '../components/Button'
import { ScreenHeader } from '../components/ScreenHeader'
import { SkeletonList } from '../components/SkeletonList'

export function ProfileScreen() {
  const session = useSession()

  if (session.status === 'signedIn') {
    return <AccountDetails account={session.account} onLogOut={session.logOut} />
  }

  return (
    <div className="h-full overflow-y-auto noscroll pb-10">
      <ScreenHeader
        kicker="Padel"
        title="Your account"
        subtitle="Looking around needs no account. Log in or create one to book a court."
      />
      <div className="px-6">
        {session.status === 'restoring' ? <SkeletonList count={3} rowHeight={52} /> : <AuthPanel />}
      </div>
    </div>
  )
}

function AccountDetails({ account, onLogOut }: { account: Account; onLogOut: () => void }) {
  return (
    <div className="h-full overflow-y-auto noscroll pb-10">
      <ScreenHeader kicker="Padel" title={account.displayName} subtitle={account.email} />
      <div className="px-6">
        <div className="rounded-2xl border border-line bg-surface px-5 py-4">
          <AccountRow label="Name" value={account.displayName} />
          <div className="my-2.5 h-px bg-line" />
          <AccountRow label="Email" value={account.email} />
          <div className="my-2.5 h-px bg-line" />
          <AccountRow label="Account" value="Player" />
        </div>
        <div className="mt-6">
          <Button variant="quiet" onClick={onLogOut}>Log out</Button>
        </div>
      </div>
    </div>
  )
}

function AccountRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[13.5px] text-muted">{label}</span>
      <span className="min-w-0 truncate text-[14.5px] text-white">{value}</span>
    </div>
  )
}
