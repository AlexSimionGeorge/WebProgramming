import type { CityAvailability } from '../api/types'
import type { ReserveOption } from './rankOptions'
import { clockTime, minutesOfDay } from './dates'

export const TICK_MINUTES = 30

/** Used when nobody sells the day at all, so the dial still has a familiar shape. */
const FALLBACK_SPAN = { firstMinutes: 7 * 60, lastMinutes: 23 * 60 }

export type DialTick = {
  time: string
  /** Centres with a court free starting in this half hour. Freedom, not occupancy. */
  freeCenters: number
}

export type DialScale = {
  ticks: DialTick[]
  /** The bar height's denominator: every centre in the city. */
  centerCount: number
}

const floorToTick = (minutes: number) => Math.floor(minutes / TICK_MINUTES) * TICK_MINUTES

/**
 * One tick every half hour from the city's earliest start to its latest start that day, whether or
 * not anyone sells it — a gap you can feel is more honest than a scale that skips what is missing.
 * A start off the half-hour grid (08:15) counts at the tick it falls in (08:00).
 */
export function buildDialScale(city: CityAvailability, options: ReserveOption[]): DialScale {
  const starts = city.centers.flatMap(({ slots }) => slots.map((slot) => minutesOfDay(slot.startsAt)))
  const firstMinutes = starts.length ? floorToTick(Math.min(...starts)) : FALLBACK_SPAN.firstMinutes
  const lastMinutes = starts.length ? floorToTick(Math.max(...starts)) : FALLBACK_SPAN.lastMinutes

  const centersByTick = new Map<number, Set<string>>()
  for (const option of options) {
    const tick = floorToTick(minutesOfDay(option.slot.startsAt))
    const centers = centersByTick.get(tick) ?? new Set<string>()
    centers.add(option.center.id)
    centersByTick.set(tick, centers)
  }

  const ticks: DialTick[] = []
  for (let minutes = firstMinutes; minutes <= lastMinutes; minutes += TICK_MINUTES) {
    ticks.push({ time: clockTime(minutes), freeCenters: centersByTick.get(minutes)?.size ?? 0 })
  }
  return { ticks, centerCount: city.centers.length }
}

/** The dial while a day is still on its way: the familiar span, nothing claimed about it. */
export function emptyDialScale(): DialScale {
  const ticks: DialTick[] = []
  for (let minutes = FALLBACK_SPAN.firstMinutes; minutes <= FALLBACK_SPAN.lastMinutes; minutes += TICK_MINUTES) {
    ticks.push({ time: clockTime(minutes), freeCenters: 0 })
  }
  return { ticks, centerCount: 0 }
}

/** The tick nearest to `time`, so a cursor carried over from another day always sits on the scale. */
export function nearestTickTime(ticks: DialTick[], time: string): string {
  const target = minutesOfDay(time)
  let nearest = ticks[0]?.time ?? time
  for (const tick of ticks) {
    if (Math.abs(minutesOfDay(tick.time) - target) < Math.abs(minutesOfDay(nearest) - target)) nearest = tick.time
  }
  return nearest
}
