import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Notice } from './components/Notice'
import { TAB_ORDER, TabBar, type Tab } from './components/TabBar'
import { spring } from './lib/motion'
import { CentersScreen } from './screens/CentersScreen'

type TabNavigation = { tab: Tab; direction: number }

export function App() {
  const [navigation, setNavigation] = useState<TabNavigation>({ tab: 'centers', direction: 0 })

  const selectTab = (tab: Tab) =>
    setNavigation((current) => ({
      tab,
      direction: Math.sign(TAB_ORDER.indexOf(tab) - TAB_ORDER.indexOf(current.tab)),
    }))

  const { tab, direction } = navigation

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.main
            key={tab}
            initial={{ opacity: 0, x: direction * 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -18 }}
            transition={spring}
            className="absolute inset-0"
          >
            {tab === 'centers' ? <CentersScreen onOpenCenter={() => undefined} /> : <Notice message="Coming soon." />}
          </motion.main>
        </AnimatePresence>
      </div>
      <TabBar activeTab={tab} onSelect={selectTab} />
    </div>
  )
}
