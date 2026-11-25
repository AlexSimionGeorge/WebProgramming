import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { createBooking } from '../api/bookings'
import { isApiError } from '../api/client'
import { describeError } from '../api/errorMessage'
import type { CenterSummary, Court, PlayerBooking, Slot } from '../api/types'
import { useSession } from '../auth/SessionProvider'
import { relativeDayLabel } from '../lib/dates'
import { fadeSwap, springSoft } from '../lib/motion'
import { AuthPanel } from './AuthPanel'
import { Button } from './Button'
import { ChoiceChip } from './ChoiceChip'
import { Sheet } from './Sheet'

export type SlotPick = { date: string; slot: Slot }

const REFUSAL_CODES = ['SLOT_TAKEN', 'NOT_A_SLOT', 'SLOT_IN_PAST']

type BookingSheetProps = {
  pick: SlotPick | null
  center: CenterSummary
  courts: Court[] | null
  onClose: () => void
  onBooked: () => void
  onRefused: (message: string) => void
  onShowBookings: () => void
}

export function BookingSheet({ pick, onClose, ...panelProps }: BookingSheetProps) {
  const [sending, setSending] = useState(false)
  return (
    <Sheet open={pick !== null} onClose={onClose} dismissible={!sending} label="Book a court">
      {pick && (
        <BookingPanel
          key={`${pick.date}-${pick.slot.startsAt}`}
          pick={pick}
          onClose={onClose}
          onSendingChange={setSending}
          {...panelProps}
        />
      )}
    </Sheet>
  )
}

type BookingPanelProps = Omit<BookingSheetProps, 'pick'> & {
  pick: SlotPick
  onSendingChange: (sending: boolean) => void
}

type BookingPhase =
  | { kind: 'choosing'; problem: string | null }
  | { kind: 'sending' }
  | { kind: 'booked'; booking: PlayerBooking }

function BookingPanel({ pick, center, courts, onClose, onBooked, onRefused, onShowBookings, onSendingChange }: BookingPanelProps) {
  const { status, logOut } = useSession()
  const [courtId, setCourtId] = useState(pick.slot.freeCourtIds[0] ?? '')
  const [phase, setPhase] = useState<BookingPhase>({ kind: 'choosing', problem: null })

  const courtName = (id: string) => {
    const index = pick.slot.freeCourtIds.indexOf(id)
    return courts?.find((court) => court.id === id)?.name ?? `Court option ${index + 1}`
  }

  const book = async () => {
    setPhase({ kind: 'sending' })
    onSendingChange(true)
    try {
      const booking = await createBooking({ courtId, date: pick.date, startsAt: pick.slot.startsAt })
      setPhase({ kind: 'booked', booking })
      onBooked()
    } catch (error) {
      if (isApiError(error) && REFUSAL_CODES.includes(error.code)) {
        onRefused(describeError(error))
        return
      }
      if (isApiError(error) && error.status === 401) logOut()
      setPhase({ kind: 'choosing', problem: describeError(error) })
    } finally {
      onSendingChange(false)
    }
  }

  return (
    <div>
      <SlotSummary center={center} pick={pick} />
      <AnimatePresence mode="wait" initial={false}>
        {phase.kind === 'booked' ? (
          <motion.div key="booked" {...fadeSwap}>
            <BookedConfirmation booking={phase.booking} onShowBookings={onShowBookings} onDone={onClose} />
          </motion.div>
        ) : status !== 'signedIn' ? (
          <motion.div key="auth" {...fadeSwap}>
            <p className="mb-4 text-[14px] leading-relaxed text-muted">
              Log in or create an account to book. Looking around stays open to everyone.
            </p>
            <AuthPanel />
          </motion.div>
        ) : (
          <motion.div key="choose" {...fadeSwap}>
            <div className="mb-2.5 text-[12.5px] text-muted">Court</div>
            <div className="rail -mx-6 flex gap-2 px-6">
              {pick.slot.freeCourtIds.map((id) => (
                <ChoiceChip key={id} label={courtName(id)} selected={id === courtId} onSelect={() => setCourtId(id)} />
              ))}
            </div>
            <div className="flex min-h-[42px] items-center pt-3" aria-live="polite">
              {phase.kind === 'choosing' && phase.problem && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springSoft}
                  className="text-[13.5px] leading-snug text-warm"
                >
                  {phase.problem}
                </motion.p>
              )}
            </div>
            <Button onClick={() => void book()} disabled={phase.kind === 'sending' || !courtId}>
              {phase.kind === 'sending' ? 'Booking…' : `Book ${courtName(courtId)}`}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SlotSummary({ center, pick }: { center: CenterSummary; pick: SlotPick }) {
  return (
    <div className="pt-2 pb-5">
      <div className="text-[13px] text-muted">{center.name} · {center.city}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-display text-[46px] leading-none tnum">{pick.slot.startsAt}</span>
        <span className="text-[15px] text-muted tnum">– {pick.slot.endsAt}</span>
      </div>
      <div className="mt-2 text-[14px] text-muted">{relativeDayLabel(pick.date)}</div>
    </div>
  )
}

type BookedConfirmationProps = {
  booking: PlayerBooking
  onShowBookings: () => void
  onDone: () => void
}

function BookedConfirmation({ booking, onShowBookings, onDone }: BookedConfirmationProps) {
  return (
    <div>
      <div className="rounded-2xl border border-primary/45 bg-[#0d1a26] px-5 py-4">
        <div className="text-[13px] text-primary-fg">Booked</div>
        <div className="mt-1 text-[16px]">{booking.court.name} is yours.</div>
        <div className="mt-0.5 text-[13px] text-muted">You can cancel it from Bookings until it starts.</div>
      </div>
      <div className="mt-5 space-y-3">
        <Button onClick={onDone}>Done</Button>
        <Button variant="quiet" onClick={onShowBookings}>See my bookings</Button>
      </div>
    </div>
  )
}
