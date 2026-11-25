import { ApiError, apiRequest } from './client'
import type { AdminBooking, CenterConfiguration, CenterDetails } from './types'

export async function fetchCenter(): Promise<CenterDetails | null> {
  try {
    return await apiRequest<CenterDetails>('GET', '/admin/center')
  } catch (error) {
    if (error instanceof ApiError && error.code === 'CENTER_NOT_CONFIGURED') return null
    throw error
  }
}

export function saveCenter(configuration: CenterConfiguration) {
  return apiRequest<CenterDetails>('PUT', '/admin/center', configuration)
}

export function fetchBookings(date: string) {
  return apiRequest<AdminBooking[]>('GET', `/admin/bookings?date=${encodeURIComponent(date)}`)
}
