import { motion } from 'framer-motion'
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import type { DialScale, DialTick } from '../lib/dialTicks'
import { springSoft } from '../lib/motion'

/** Pixels per half-hour tick. */
const TICK_WIDTH = 30
const BAR_WIDTH = 10
/** Bar heights: flat for nothing free, a visible minimum for one centre, full for the whole city. */
const FLAT_BAR = 4
const SHORTEST_BAR = 10
const TALLEST_BAR = 44
const BAR_BAND = 50
const LABEL_STRIP = 22

const SNAP_ON = 'x mandatory'

type TunerProps = {
  scale: DialScale
  value: string
  onChange: (time: string) => void
  /** The day is still on its way: bars are drawn flat and grey, claiming nothing. */
  loading?: boolean
}

type MouseDrag = { startX: number; startScrollLeft: number }

const clampIndex = (index: number, count: number) => Math.max(0, Math.min(count - 1, index))

/**
 * The hour dial: a scale dragged under a fixed needle, the way a radio tuner works.
 * Each half hour is a tick; the bar above it is how many centres have a court free from that
 * start — tall is good, nothing free is flat. Touch and trackpad use native scroll with snap;
 * a mouse cannot scroll a container by dragging, so press-and-drag is wired by hand, with
 * snapping suspended while the button is down and a settle on the nearest tick on release.
 */
export function Tuner({ scale, value, onChange, loading = false }: TunerProps) {
  const { ticks, centerCount } = scale
  const scroller = useRef<HTMLDivElement>(null)
  const pendingFrame = useRef(0)
  const reportedValue = useRef(value)
  const mouseDrag = useRef<MouseDrag | null>(null)
  const spanKey = `${ticks[0]?.time}-${ticks.at(-1)?.time}`

  const centreOn = useCallback((time: string, smooth: boolean) => {
    const index = ticks.findIndex((tick) => tick.time === time)
    if (index < 0) return
    scroller.current?.scrollTo({ left: index * TICK_WIDTH, behavior: smooth ? 'smooth' : 'auto' })
  }, [ticks])

  // A new span moves every tick, so jump (not glide) back under the needle before paint.
  useLayoutEffect(() => {
    reportedValue.current = value
    centreOn(value, false)
  }, [spanKey])

  // A value set from outside (keyboard, a clamp onto a new day) glides to the needle.
  useEffect(() => {
    if (mouseDrag.current || value === reportedValue.current) return
    reportedValue.current = value
    centreOn(value, true)
  }, [value, centreOn])

  useEffect(() => () => cancelAnimationFrame(pendingFrame.current), [])

  const tickIndexUnderNeedle = () =>
    clampIndex(Math.round((scroller.current?.scrollLeft ?? 0) / TICK_WIDTH), ticks.length)

  const reportTickUnderNeedle = () => {
    cancelAnimationFrame(pendingFrame.current)
    pendingFrame.current = requestAnimationFrame(() => {
      const time = ticks[tickIndexUnderNeedle()]?.time
      if (!time || time === reportedValue.current) return
      reportedValue.current = time
      navigator.vibrate?.(6)
      onChange(time)
    })
  }

  const startMouseDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    const element = event.currentTarget
    mouseDrag.current = { startX: event.clientX, startScrollLeft: element.scrollLeft }
    element.style.scrollSnapType = 'none'
    element.setPointerCapture(event.pointerId)
  }

  const followMouseDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!mouseDrag.current) return
    event.currentTarget.scrollLeft = mouseDrag.current.startScrollLeft - (event.clientX - mouseDrag.current.startX)
  }

  const endMouseDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!mouseDrag.current) return
    mouseDrag.current = null
    const element = event.currentTarget
    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId)
    element.style.scrollSnapType = SNAP_ON
    element.scrollTo({ left: tickIndexUnderNeedle() * TICK_WIDTH, behavior: 'smooth' })
  }

  const stepWithKeys = (event: React.KeyboardEvent) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (step === 0) return
    event.preventDefault()
    const index = ticks.findIndex((tick) => tick.time === value)
    const next = ticks[clampIndex(index + step, ticks.length)]
    if (next) centreOn(next.time, true)
  }

  return (
    <div className="relative select-none pt-1 pb-2">
      <div className="flex justify-center pb-2" aria-hidden>
        <motion.span
          key={value}
          initial={{ opacity: 0.4, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.14 }}
          className="font-display text-[44px] leading-none text-primary-fg tnum"
        >
          {value}
        </motion.span>
      </div>

      <div className="relative" style={{ height: BAR_BAND + LABEL_STRIP }}>
        <div className="pointer-events-none absolute inset-x-0 h-px bg-elevated" style={{ top: BAR_BAND - FLAT_BAR }} />
        <Needle />
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-bg to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-bg to-transparent" />

        <div
          ref={scroller}
          onScroll={reportTickUnderNeedle}
          onPointerDown={startMouseDrag}
          onPointerMove={followMouseDrag}
          onPointerUp={endMouseDrag}
          onPointerCancel={endMouseDrag}
          onKeyDown={stepWithKeys}
          role="slider"
          tabIndex={0}
          aria-label="Start time"
          aria-valuetext={value}
          aria-valuemin={0}
          aria-valuemax={ticks.length - 1}
          aria-valuenow={Math.max(0, ticks.findIndex((tick) => tick.time === value))}
          className="rail flex h-full cursor-grab items-start active:cursor-grabbing"
          style={{ scrollSnapType: SNAP_ON, paddingInline: `calc(50% - ${TICK_WIDTH / 2}px)` }}
        >
          {ticks.map((tick) => (
            <TickColumn
              key={tick.time}
              tick={tick}
              centerCount={centerCount}
              selected={tick.time === value}
              loading={loading}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function Needle() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2">
      <div className="mx-auto h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-primary-fg" />
      <div className="mx-auto w-0 border-l border-dashed border-primary-fg/55" style={{ height: BAR_BAND - 4 }} />
    </div>
  )
}

function barHeight(freeCenters: number, centerCount: number): number {
  if (freeCenters === 0 || centerCount === 0) return FLAT_BAR
  return Math.round(SHORTEST_BAR + (freeCenters / centerCount) * (TALLEST_BAR - SHORTEST_BAR))
}

type TickColumnProps = { tick: DialTick; centerCount: number; selected: boolean; loading: boolean }

function TickColumn({ tick, centerCount, selected, loading }: TickColumnProps) {
  const onTheHour = tick.time.endsWith(':00')
  const nothingFree = tick.freeCenters === 0
  return (
    <div className="flex h-full shrink-0 flex-col items-center" style={{ width: TICK_WIDTH, scrollSnapAlign: 'center' }}>
      <div className="flex w-full items-end justify-center" style={{ height: BAR_BAND }}>
        <motion.span
          className={`rounded-full ${loading ? 'bg-elevated' : 'bg-accent-mark'}`}
          initial={false}
          animate={{
            height: loading ? FLAT_BAR : barHeight(tick.freeCenters, centerCount),
            opacity: loading || !nothingFree ? 1 : 0.4,
          }}
          transition={springSoft}
          style={{ width: BAR_WIDTH }}
        />
      </div>
      <span
        className={`mt-1.5 text-[10.5px] tnum ${
          onTheHour ? (selected ? 'text-primary-fg' : 'text-muted') : 'text-transparent'
        }`}
      >
        {onTheHour ? tick.time.slice(0, 2) : '·'}
      </span>
    </div>
  )
}
