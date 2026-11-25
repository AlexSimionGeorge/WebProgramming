import { motion } from 'framer-motion'
import { useState } from 'react'
import { getAvailability, getCenter } from '../api/centers'
import { describeError } from '../api/errorMessage'
import type { CenterDetails, CenterSummary, DayAvailability, Slot } from '../api/types'
import { BookingSheet, type SlotPick } from '../components/BookingSheet'
import { DayStrip } from '../components/DayStrip'
import { Notice } from '../components/Notice'
import { ScreenHeader } from '../components/ScreenHeader'
import { SkeletonList } from '../components/SkeletonList'
import { SlotRow } from '../components/SlotRow'
import { hasPassed, isoWeekday, relativeDayLabel, todayIsoDate, upcomingDates, weekdayLong } from '../lib/dates'
import { springSoft } from '../lib/motion'
import { useRemote } from '../lib/useRemote'

const BOOKABLE_DAYS = 14

type CenterScreenProps = {
  center: CenterSummary
  onBack: () => void
  onShowBookings: () => void
}

export function CenterScreen({ center, onBack, onShowBookings }: CenterScreenProps) {
  const [dates] = useState(() => upcomingDates(BOOKABLE_DAYS))
  const [selectedDate, setSelectedDate] = useState(todayIsoDate)
  const details = useRemote((signal) => getCenter(center.id, signal), [center.id])
  const availability = useRemote((signal) => getAvailability(center.id, selectedDate, signal), [center.id, selectedDate])
  const [pick, setPick] = useState<SlotPick | null>(null)
  const [refusal, setRefusal] = useState<string | null>(null)

  const selectDate = (isoDate: string) => {
    setRefusal(null)
    setSelectedDate(isoDate)
  }

  const pickSlot = (slot: Slot) => {
    setRefusal(null)
    setPick({ date: selectedDate, slot })
  }

  const showRefusal = (message: string) => {
    setPick(null)
    setRefusal(message)
    availability.reload()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0">
        <ScreenHeader onBack={onBack} title={center.name} subtitle={`${center.address} · ${center.city}`} />
        <div className="border-b border-elevated pb-3">
          <DayStrip dates={dates} selectedDate={selectedDate} onSelect={selectDate} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto noscroll px-5 pt-4 pb-6">
        {refusal && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springSoft}
            className="mb-3 px-1 text-[13.5px] leading-snug text-warm"
          >
            {refusal}
          </motion.p>
        )}
        <motion.div
          key={`${selectedDate}-${availability.status}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={springSoft}
        >
          {availability.status === 'loading' && <SkeletonList count={5} rowHeight={66} />}
          {availability.status === 'failed' && (
            <Notice
              tone="warm"
              message={describeError(availability.error)}
              action={{ label: 'Try again', onClick: availability.reload }}
            />
          )}
          {availability.status === 'ready' && (
            <DaySlots
              availability={availability.data}
              details={details.status === 'ready' ? details.data : null}
              onPick={pickSlot}
            />
          )}
        </motion.div>
      </div>

      <BookingSheet
        pick={pick}
        center={center}
        courts={details.status === 'ready' ? details.data.courts : null}
        onClose={() => setPick(null)}
        onAvailabilityChanged={availability.reload}
        onRefused={showRefusal}
        onShowBookings={onShowBookings}
      />
    </div>
  )
}

type DaySlotsProps = {
  availability: DayAvailability
  details: CenterDetails | null
  onPick: (slot: Slot) => void
}

function DaySlots({ availability, details, onPick }: DaySlotsProps) {
  const { date } = availability
  const slots = availability.slots.filter((slot) => !hasPassed(date, slot.startsAt))

  if (slots.length === 0) {
    const closed = details?.openingIntervals.every((interval) => interval.weekday !== isoWeekday(date))
    return (
      <Notice
        message={closed ? `Closed on ${weekdayLong(date)}s. Try another day.` : 'Nothing left to book on this day. Try another one.'}
      />
    )
  }

  const openSlots = slots.filter((slot) => slot.freeCourtIds.length > 0).length

  return (
    <>
      <p className="mb-3 px-1 text-[13px] text-muted">
        {relativeDayLabel(date)} ·{' '}
        {openSlots === 0 ? 'every slot is taken' : (
          <>
            <span className="text-accent-dark tnum">{openSlots}</span> of {slots.length} slots have a free court
          </>
        )}
      </p>
      <div className="flex flex-col" style={{ gap: 'var(--row-gap)' }}>
        {slots.map((slot, index) => (
          <SlotRow key={slot.startsAt} slot={slot} index={index} onPick={() => onPick(slot)} />
        ))}
      </div>
    </>
  )
}
