import { motion } from 'framer-motion'
import { springSoft } from '../lib/motion'
import { Button } from './Button'

type NoticeProps = {
  message: React.ReactNode
  tone?: 'calm' | 'warm'
  action?: { label: string; onClick: () => void; primary?: boolean }
}

export function Notice({ message, tone = 'calm', action }: NoticeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springSoft}
      className="px-2 pt-8 text-center"
      role={tone === 'warm' ? 'alert' : undefined}
    >
      <p className={`text-[14.5px] leading-relaxed ${tone === 'warm' ? 'text-warm' : 'text-muted'}`}>{message}</p>
      {action && (
        <div className="mx-auto mt-5 max-w-[240px]">
          <Button variant={action.primary ? 'primary' : 'quiet'} onClick={action.onClick}>{action.label}</Button>
        </div>
      )}
    </motion.div>
  )
}
