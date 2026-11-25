import { useState } from 'react'
import { describeError } from '../api/errorMessage'
import { Button } from './Button'
import { Sheet } from './Sheet'

export type Confirmation = {
  title: string
  message: React.ReactNode
  confirmLabel: string
  workingLabel: string
  keepLabel?: string
  /** Throws to keep the sheet open with the reason; resolves to close it. */
  onConfirm: () => Promise<void>
}

type ConfirmSheetProps = {
  confirmation: Confirmation | null
  onClose: () => void
}

/** The one shape for "are you sure": a question, what it means, one way forward and one way back. */
export function ConfirmSheet({ confirmation, onClose }: ConfirmSheetProps) {
  const [working, setWorking] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  const close = () => {
    setProblem(null)
    onClose()
  }

  const confirm = async (target: Confirmation) => {
    setWorking(true)
    setProblem(null)
    try {
      await target.onConfirm()
      onClose()
    } catch (error) {
      setProblem(describeError(error))
    } finally {
      setWorking(false)
    }
  }

  return (
    <Sheet open={confirmation !== null} onClose={close} dismissible={!working} label={confirmation?.title ?? 'Confirm'}>
      {confirmation && (
        <div className="pt-2">
          <h2 className="font-display text-[26px] leading-tight">{confirmation.title}</h2>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{confirmation.message}</p>
          <div className="flex min-h-[42px] items-center pt-2" aria-live="polite">
            {problem && <p className="text-[13.5px] leading-snug text-warm">{problem}</p>}
          </div>
          <div className="space-y-3">
            <Button onClick={() => void confirm(confirmation)} disabled={working}>
              {working ? confirmation.workingLabel : confirmation.confirmLabel}
            </Button>
            <Button variant="quiet" onClick={close} disabled={working}>
              {confirmation.keepLabel ?? 'Keep it'}
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  )
}
