import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { useState } from 'react'
import type { PlayerBooking } from './api/types'
import { useSession } from './auth/SessionProvider'
import { TAB_ORDER, TabBar, type Tab } from './components/TabBar'
import { sheetSpring, spring } from './lib/motion'
import { FriendsScreen } from './screens/FriendsScreen'
import { GameScreen } from './screens/GameScreen'
import { HomeScreen } from './screens/HomeScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { ReceiptScreen } from './screens/ReceiptScreen'
import { ReserveScreen } from './screens/ReserveScreen'

type TabNavigation = { tab: Tab; direction: number }

/** The tabs a game can be opened from, each keeping its own pushed game. */
type GameTab = 'home' | 'profile'

const backLabels: Record<GameTab, string> = { home: 'Home', profile: 'Profile' }

const slide: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 18 }),
  shown: { opacity: 1, x: 0 },
  leave: (direction: number) => ({ opacity: 0, x: direction * -18 }),
}

export function App() {
  const session = useSession()
  // Signed in, the app opens on what is coming up; signed out, browsing the courts needs no account.
  const [navigation, setNavigation] = useState<TabNavigation>(() => ({
    tab: session.status === 'anonymous' ? 'reserve' : 'home',
    direction: 0,
  }))
  const [openGames, setOpenGames] = useState<Record<GameTab, string | null>>({ home: null, profile: null })
  const [receipt, setReceipt] = useState<PlayerBooking | null>(null)

  const openGame = (gameTab: GameTab, gameId: string | null) =>
    setOpenGames((current) => ({ ...current, [gameTab]: gameId }))

  const selectTab = (tab: Tab) => {
    if ((tab === 'home' || tab === 'profile') && navigation.tab === tab) openGame(tab, null)
    setNavigation((current) => ({
      tab,
      direction: Math.sign(TAB_ORDER.indexOf(tab) - TAB_ORDER.indexOf(current.tab)),
    }))
  }

  const inviteFromReceipt = (booking: PlayerBooking) => {
    setReceipt(null)
    selectTab('home')
    openGame('home', booking.gameId)
  }

  const gameStack = (gameTab: GameTab, list: React.ReactNode) => {
    const gameId = openGames[gameTab]
    return (
      <PushStack pageKey={gameId}>
        {gameId ? (
          <GameScreen
            gameId={gameId}
            onBack={() => openGame(gameTab, null)}
            backLabel={backLabels[gameTab]}
            onFindFriends={() => selectTab('friends')}
          />
        ) : list}
      </PushStack>
    )
  }

  const { tab, direction } = navigation

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
            {tab === 'home' && gameStack('home', (
              <HomeScreen
                onLogIn={() => selectTab('profile')}
                onReserve={() => selectTab('reserve')}
                onOpenGame={(gameId) => openGame('home', gameId)}
              />
            ))}
            {tab === 'reserve' && <ReserveScreen onBooked={setReceipt} />}
            {tab === 'friends' && <FriendsScreen onLogIn={() => selectTab('profile')} />}
            {tab === 'profile' && gameStack('profile', (
              <ProfileScreen onOpenGame={(gameId) => openGame('profile', gameId)} />
            ))}
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
