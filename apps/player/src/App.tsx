import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { useState } from 'react'
import type { CenterSummary, PlayerBooking } from './api/types'
import { TAB_ORDER, TabBar, type Tab } from './components/TabBar'
import { sheetSpring, spring } from './lib/motion'
import { CenterScreen } from './screens/CenterScreen'
import { CentersScreen } from './screens/CentersScreen'
import { FriendsScreen } from './screens/FriendsScreen'
import { GameScreen } from './screens/GameScreen'
import { GamesScreen } from './screens/GamesScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { ReceiptScreen } from './screens/ReceiptScreen'
import { ReserveScreen } from './screens/ReserveScreen'

type TabNavigation = { tab: Tab; direction: number }

const slide: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 18 }),
  shown: { opacity: 1, x: 0 },
  leave: (direction: number) => ({ opacity: 0, x: direction * -18 }),
}

export function App() {
  const [navigation, setNavigation] = useState<TabNavigation>({ tab: 'reserve', direction: 0 })
  const [openCenter, setOpenCenter] = useState<CenterSummary | null>(null)
  const [openGameId, setOpenGameId] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<PlayerBooking | null>(null)

  const selectTab = (tab: Tab) => {
    if (tab === 'centers' && navigation.tab === 'centers') setOpenCenter(null)
    if (tab === 'games' && navigation.tab === 'games') setOpenGameId(null)
    setNavigation((current) => ({
      tab,
      direction: Math.sign(TAB_ORDER.indexOf(tab) - TAB_ORDER.indexOf(current.tab)),
    }))
  }

  const { tab, direction } = navigation
  const inviteFromReceipt = (booking: PlayerBooking) => {
    setReceipt(null)
    selectTab('games')
    setOpenGameId(booking.gameId)
  }
  const logIn = () => selectTab('profile')
  const findCourt = () => selectTab('reserve')

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.main
            key={tab}
            custom={direction}
            variants={slide}
            initial="enter"
            animate="shown"
            exit="leave"
            transition={spring}
            className="absolute inset-0"
          >
            {tab === 'reserve' && <ReserveScreen onBooked={setReceipt} />}
            {tab === 'centers' && (
              <PushStack pageKey={openCenter?.id ?? null}>
                {openCenter ? (
                  <CenterScreen center={openCenter} onBack={() => setOpenCenter(null)} onBooked={setReceipt} />
                ) : (
                  <CentersScreen onOpenCenter={setOpenCenter} />
                )}
              </PushStack>
            )}
            {tab === 'games' && (
              <PushStack pageKey={openGameId}>
                {openGameId ? (
                  <GameScreen
                    gameId={openGameId}
                    onBack={() => setOpenGameId(null)}
                    onFindFriends={() => selectTab('friends')}
                  />
                ) : (
                  <GamesScreen onLogIn={logIn} onFindCourt={findCourt} onOpenGame={setOpenGameId} />
                )}
              </PushStack>
            )}
            {tab === 'friends' && <FriendsScreen onLogIn={logIn} />}
            {tab === 'profile' && <ProfileScreen />}
          </motion.main>
        </AnimatePresence>
      </div>
      <TabBar activeTab={tab} onSelect={selectTab} />
      <AnimatePresence>
        {receipt && (
          <motion.div
            key={receipt.id}
            className="fixed inset-0 z-30"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={sheetSpring}
          >
            <ReceiptScreen booking={receipt} onInvite={() => inviteFromReceipt(receipt)} onDone={() => setReceipt(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** A list with one page pushed over it: `pageKey` is the pushed page, or null for the list. */
function PushStack({ pageKey, children }: { pageKey: string | null; children: React.ReactNode }) {
  const direction = pageKey ? 1 : -1
  return (
    <AnimatePresence mode="popLayout" initial={false} custom={direction}>
      <motion.div
        key={pageKey ?? 'list'}
        custom={direction}
        variants={slide}
        initial="enter"
        animate="shown"
        exit="leave"
        transition={spring}
        className="absolute inset-0"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
