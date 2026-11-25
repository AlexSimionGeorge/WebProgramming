import { apiRequest } from './client'
import type { CityAvailability } from './types'

export const getCityAvailability = (date: string, signal?: AbortSignal) =>
  apiRequest<CityAvailability>(`/availability?date=${encodeURIComponent(date)}`, { signal })
