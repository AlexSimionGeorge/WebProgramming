import { apiRequest } from './client'
import type { BookingRequest, PlayerBooking } from './types'

export const createBooking = (request: BookingRequest) =>
  apiRequest<PlayerBooking>('/bookings', { method: 'POST', body: request })

export const listMyBookings = (signal?: AbortSignal) =>
  apiRequest<PlayerBooking[]>('/bookings/mine', { signal })

export const cancelBooking = (bookingId: string) =>
  apiRequest<void>(`/bookings/${encodeURIComponent(bookingId)}`, { method: 'DELETE' })
