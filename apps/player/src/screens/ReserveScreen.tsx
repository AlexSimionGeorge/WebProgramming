import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getCityAvailability } from '../api/availability'
import { describeError } from '../api/errorMessage'
import { BookingSheet } from '../components/BookingSheet'
import { Notice } from '../components/Notice'
import { OptionRow } from '../components/OptionRow'
import { SkeletonList } from '../components/SkeletonList'
import { Tuner } from '../components/Tuner'
import { WeekStrip } from '../components/WeekStrip'
import { addDays, relativeDayLabel, todayIsoDate, weekMonthLabel, weekStartOf } from '../lib/dates'
import { buildDialScale, emptyDialScale, nearestTickTime, type DialScale } from '../lib/dialTicks'
import { springSoft } from '../lib/motion'
import { listOptions, rankOptions, type RankedOption, type ReserveOption } from '../lib/rankOptions'
import { useRemote } from '../lib/useRemote'

/** Where the needle starts: an evening game is the most common question. */
const DEFAULT_CURSOR = '18:00'

/** "today", "tomorrow", "on Tuesday 3 November" — the day as it reads inside a sentence. */
function dayInSentence(isoDate: string): string {
  const label = relativeDayLabel(isoDate)
  if (label === 'Today' || label === 'Tomorrow') return label.toLowerCase()
  return `on ${label}`
}

/** The option the booking sheet is about; kept while the sheet slides away so it never empties mid-exit. */
type BookingTarget = { date: string; option: ReserveOption; open: boolean }

/**
 * The city as one time axis. The whole day is fetched once; the dial then re-ranks the options
 * locally, so the list moves with the drag instead of waiting on a request per tick.
 */
export function ReserveScreen({ onShowBookings }: { onShowBookings: () => void }) {
  const [selectedDate, setSelectedDate] = useState(todayIsoDate)
  const [weekStart, setWeekStart] = useState(() => weekStartOf(todayIsoDate()))
  const [cursor, setCursor] = useState(DEFAULT_CURSOR)
  const city = useRemote((signal) => getCityAvailability(selectedDate, signal), [selectedDate])
  const listRef = useRef<HTMLDivElement>(null)
  const [bookingTarget, setBookingTarget] = useState<BookingTarget | null>(null)
  const [refusal, setRefusal] = useState<string | null>(null)

  const cityDay = city.status === 'ready' ? city.data : null
  const options = useMemo(() => (cityDay ? listOptions(cityDay) : null), [cityDay])
  const readyScale = useMemo(
    () => (cityDay && options ? buildDialScale(cityDay, options) : null),
    [cityDay, options],
  )
  const scale = useLastScale(readyScale)
  // The player's cursor is kept as they left it; on a day with a shorter span it sits on the nearest tick.
  const needle = nearestTickTime(scale.ticks, cursor)
  const ranked = useMemo(() => (options ? rankOptions(options, needle) : null), [options, needle])

  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 })
  }, [needle, selectedDate])

  const selectDate = (isoDate: string) => {
    setRefusal(null)
    setSelectedDate(isoDate)
  }

  const pageWeek = (direction: -1 | 1) => {
    const today = todayIsoDate()
    const sameWeekday = addDays(selectedDate, 7 * direction)
    setWeekStart(addDays(weekStart, 7 * direction))
    selectDate(sameWeekday < today ? today : sameWeekday)
  }

  const pickOption = (option: ReserveOption) => {
    if (!cityDay) return
    setRefusal(null)
    setBookingTarget({ date: cityDay.date, option, open: true })
  }

  const closeBooking = () => setBookingTarget((target) => target && { ...target, open: false })

  const showRefusal = (message: string) => {
    closeBooking()
    setRefusal(message)
    city.refresh()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0">
        <header className="flex items-baseline justify-between px-6 pb-3" style={{ paddingTop: 'var(--screen-top)' }}>
          <h1 className="font-display text-[30px] leading-none">Reserve</h1>
          <span className="text-[12px] uppercase tracking-[0.14em] text-muted">{weekMonthLabel(weekStart)}</span>
        </header>
        <WeekStrip
          weekStart={weekStart}
          selectedDate={selectedDate}
          onPageWeek={pageWeek}
          onSelect={selectDate}
        />
        <div className="mt-2 border-b border-elevated">
          <Tuner scale={scale} value={needle} onChange={setCursor} loading={readyScale === null} />
        </div>
      </div>

      <motion.div ref={listRef} layoutScroll className="min-h-0 flex-1 overflow-y-auto noscroll px-5 pt-4 pb-6">
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
          key={`${selectedDate}-${city.status}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={springSoft}
        >
          {city.status === 'loading' && <SkeletonList count={4} rowHeight={92} />}
          {city.status === 'failed' && (
            <Notice tone="warm" message={describeError(city.error)} action={{ label: 'Try again', onClick: city.reload }} />
          )}
          {city.status === 'ready' && ranked && (
            <DayOptions
              date={city.data.date}
              hasCenters={city.data.centers.length > 0}
              cursor={needle}
              ranked={ranked}
              onPick={pickOption}
            />
          )}
        </motion.div>
      </motion.div>

      {bookingTarget && (
        <BookingSheet
          pick={bookingTarget.open ? { date: bookingTarget.date, slot: bookingTarget.option.slot } : null}
          center={bookingTarget.option.center}
          courts={bookingTarget.option.courts}
          onClose={closeBooking}
          onAvailabilityChanged={city.refresh}
          onRefused={showRefusal}
          onShowBookings={onShowBookings}
        />
      )}
    </div>
  )
}

/** The dial keeps the last day's span while the next one loads, so the scale never jumps to a placeholder. */
function useLastScale(readyScale: DialScale | null): DialScale {
  const lastScale = useRef<DialScale>(emptyDialScale())
  if (readyScale) lastScale.current = readyScale
  return readyScale ?? lastScale.current
}

type DayOptionsProps = {
  date: string
  hasCenters: boolean
  cursor: string
  ranked: RankedOption[]
  onPick: (option: ReserveOption) => void
}

function DayOptions({ date, hasCenters, cursor, ranked, onPick }: DayOptionsProps) {
  if (!hasCenters) return <Notice message="No centres have opened their courts yet. Check back soon." />
  if (ranked.length === 0) return <Notice message={`Nothing left to book ${dayInSentence(date)}. Try another day.`} />

  const nothingAtCursor = ranked[0]?.offsetMinutes !== 0

  return (
    <>
      <p className="mb-3 px-1 text-[13px] text-muted">
        {nothingAtCursor ? (
          <>Nothing free at <span className="text-white tnum">{cursor}</span> {dayInSentence(date)}. Closest first:</>
        ) : (
          <>
            <span className="text-accent-dark tnum">{ranked.length}</span> {ranked.length === 1 ? 'option' : 'options'}{' '}
            {dayInSentence(date)}, nearest to <span className="text-white tnum">{cursor}</span> first
          </>
        )}
      </p>
      <div className="flex flex-col" style={{ gap: 'var(--row-gap)' }}>
        {ranked.map((option, index) => (
          <OptionRow
            key={`${option.center.id}-${option.slot.startsAt}`}
            option={option}
            index={index}
            onPick={() => onPick(option)}
          />
        ))}
      </div>
    </>
  )
}
