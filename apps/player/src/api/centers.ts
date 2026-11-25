import { apiRequest } from './client'
import type { CenterDetails, CenterSummary, DayAvailability } from './types'

export const listCenters = (signal?: AbortSignal) =>
  apiRequest<CenterSummary[]>('/centers', { signal })

export const getCenter = (centerId: string, signal?: AbortSignal) =>
  apiRequest<CenterDetails>(`/centers/${encodeURIComponent(centerId)}`, { signal })

export const getAvailability = (centerId: string, date: string, signal?: AbortSignal) =>
  apiRequest<DayAvailability>(
    `/centers/${encodeURIComponent(centerId)}/availability?date=${encodeURIComponent(date)}`,
    { signal },
  )
