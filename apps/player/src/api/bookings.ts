import { apiRequest } from './client'
import type { BookingRequest, PlayerBooking } from './types'

export const createBooking = (request: BookingRequest) =>
  apiRequest<PlayerBooking>('/bookings', { method: 'POST', body: request })

export const cancelBooking = (bookingId: string) =>
  apiRequest<void>(`/bookings/${encodeURIComponent(bookingId)}`, { method: 'DELETE' })
