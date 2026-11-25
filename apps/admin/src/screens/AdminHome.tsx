import { useState } from 'react'
import type { Account } from '../api/types'
import { useSession } from '../auth/useSession'
import { useCenter } from '../hooks/useCenter'
import { Button } from '../components/Button'
import { ErrorNotice } from '../components/ErrorNotice'
import { TabSwitch } from '../components/TabSwitch'
import { TopBar } from '../components/TopBar'
import { Bookings } from './Bookings'
import { CenterSetup } from './CenterSetup'

type AdminTab = 'centre' | 'bookings'

export function AdminHome({ account }: { account: Account }) {
  const { logOut } = useSession()
  const { state, retry, replaceData: replaceCenter } = useCenter()
  const [activeTab, setActiveTab] = useState<AdminTab>('centre')

  const center = state.status === 'ready' ? state.data : null
  const tabs = [
    { id: 'centre', label: 'Centre' },
    { id: 'bookings', label: 'Bookings', disabled: center === null },
  ] as const

  return (
    <div className="min-h-dvh">
      <TopBar centerName={center?.name ?? null} accountEmail={account.email} onLogOut={logOut} />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-6">
        {state.status === 'loading' && <p className="py-10 text-[14.5px] text-muted">Loading your centre…</p>}
        {state.status === 'failed' && (
          <div className="max-w-xl space-y-4 py-6">
            <ErrorNotice message={state.message} />
            <Button variant="secondary" onClick={retry}>
              Try again
            </Button>
          </div>
        )}
        {state.status === 'ready' && (
          <>
            <div className="mb-7">
              <TabSwitch tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} />
            </div>
            <div hidden={activeTab !== 'centre'}>
              <CenterSetup center={center} onSaved={replaceCenter} />
            </div>
            {activeTab === 'bookings' && center && <Bookings center={center} />}
          </>
        )}
      </main>
    </div>
  )
}
