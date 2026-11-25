import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { useState } from 'react'
import type { CenterSummary } from './api/types'
import { TAB_ORDER, TabBar, type Tab } from './components/TabBar'
import { spring } from './lib/motion'
import { BookingsScreen } from './screens/BookingsScreen'
import { CenterScreen } from './screens/CenterScreen'
import { CentersScreen } from './screens/CentersScreen'
import { ProfileScreen } from './screens/ProfileScreen'

type TabNavigation = { tab: Tab; direction: number }

const slide: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 18 }),
  shown: { opacity: 1, x: 0 },
  leave: (direction: number) => ({ opacity: 0, x: direction * -18 }),
}

export function App() {
  const [navigation, setNavigation] = useState<TabNavigation>({ tab: 'centers', direction: 0 })
  const [openCenter, setOpenCenter] = useState<CenterSummary | null>(null)

  const selectTab = (tab: Tab) => {
    if (tab === 'centers' && navigation.tab === 'centers') setOpenCenter(null)
    setNavigation((current) => ({
      tab,
      direction: Math.sign(TAB_ORDER.indexOf(tab) - TAB_ORDER.indexOf(current.tab)),
    }))
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
            {tab === 'centers' && (
              <CentresStack
                openCenter={openCenter}
                onOpen={setOpenCenter}
                onBack={() => setOpenCenter(null)}
                onShowBookings={() => selectTab('bookings')}
              />
            )}
            {tab === 'bookings' && (
              <BookingsScreen onLogIn={() => selectTab('profile')} onFindCourt={() => selectTab('centers')} />
            )}
            {tab === 'profile' && <ProfileScreen />}
          </motion.main>
        </AnimatePresence>
      </div>
      <TabBar activeTab={tab} onSelect={selectTab} />
    </div>
  )
}

type CentresStackProps = {
  openCenter: CenterSummary | null
  onOpen: (center: CenterSummary) => void
  onBack: () => void
  onShowBookings: () => void
}

function CentresStack({ openCenter, onOpen, onBack, onShowBookings }: CentresStackProps) {
  const direction = openCenter ? 1 : -1
  return (
    <AnimatePresence mode="popLayout" initial={false} custom={direction}>
      <motion.div
        key={openCenter?.id ?? 'list'}
        custom={direction}
        variants={slide}
        initial="enter"
        animate="shown"
        exit="leave"
        transition={spring}
        className="absolute inset-0"
      >
        {openCenter ? (
          <CenterScreen center={openCenter} onBack={onBack} onShowBookings={onShowBookings} />
        ) : (
          <CentersScreen onOpenCenter={onOpen} />
        )}
      </motion.div>
    </AnimatePresence>
  )
}
