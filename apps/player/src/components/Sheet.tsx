import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { sheetSpring } from '../lib/motion'

type SheetProps = {
  open: boolean
  onClose: () => void
  label: string
  dismissible?: boolean
  children: React.ReactNode
}

export function Sheet({ open, onClose, label, dismissible = true, children }: SheetProps) {
  useEffect(() => {
    if (!open || !dismissible) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open, dismissible, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => dismissible && onClose()}
        />
      )}
      {open && (
        <motion.div
          key="sheet"
          role="dialog"
          aria-modal="true"
          aria-label={label}
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88%] flex-col overflow-hidden rounded-t-[26px]
                     border-x border-t border-line bg-surface shadow-[0_-24px_60px_-20px_rgba(0,0,0,.9)]"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={sheetSpring}
          drag={dismissible ? 'y' : false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.55 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 110 || info.velocity.y > 700) onClose()
          }}
        >
          <div className="flex shrink-0 justify-center pt-2.5 pb-1">
            <div className="h-1 w-9 rounded-full bg-faint" />
          </div>
          <div className="overflow-y-auto overscroll-contain noscroll px-6 pb-[max(env(safe-area-inset-bottom),22px)]">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
