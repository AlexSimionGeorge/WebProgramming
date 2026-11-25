import { motion, useReducedMotion } from 'framer-motion'
import { spring } from '../lib/motion'
import { CalendarIcon, CourtIcon, PersonIcon } from './icons'
import { Press } from './Press'

export type Tab = 'centers' | 'bookings' | 'profile'

export const TAB_ORDER: Tab[] = ['centers', 'bookings', 'profile']

const tabLabels: Record<Tab, string> = { centers: 'Centres', bookings: 'Bookings', profile: 'Profile' }
const tabIcons: Record<Tab, typeof CourtIcon> = { centers: CourtIcon, bookings: CalendarIcon, profile: PersonIcon }

export function TabBar({ activeTab, onSelect }: { activeTab: Tab; onSelect: (tab: Tab) => void }) {
  const reduceMotion = useReducedMotion()

  return (
    <nav
      className="relative shrink-0 border-t border-line bg-[#0c1013]/95 backdrop-blur-xl"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), var(--tab-floor))' }}
    >
      <div className="flex px-2">
        {TAB_ORDER.map((tab) => {
          const active = tab === activeTab
          const Icon = tabIcons[tab]
          return (
            <Press
              key={tab}
              onClick={() => onSelect(tab)}
              aria-current={active ? 'page' : undefined}
              className="relative flex min-h-[52px] flex-1 flex-col items-center gap-1 pt-2.5 pb-2"
            >
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  aria-hidden
                  transition={reduceMotion ? { duration: 0 } : spring}
                  className="absolute inset-x-[3px] inset-y-[2px] rounded-[14px] bg-primary/16"
                />
              )}
              <span className={`relative ${active ? 'text-primary-fg' : 'text-muted'}`}>
                <Icon bold={active} />
              </span>
              <span className={`relative text-[10.5px] leading-none ${active ? 'text-primary-fg' : 'text-muted'}`}>
                {tabLabels[tab]}
              </span>
            </Press>
          )
        })}
      </div>
    </nav>
  )
}
