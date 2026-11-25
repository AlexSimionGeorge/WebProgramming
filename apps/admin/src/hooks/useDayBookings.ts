import { useCallback } from 'react'
import { fetchBookings } from '../api/admin'
import { useRemoteData } from './useRemoteData'

export function useDayBookings(date: string) {
  const loadBookings = useCallback(() => fetchBookings(date), [date])
  return useRemoteData(loadBookings)
}
