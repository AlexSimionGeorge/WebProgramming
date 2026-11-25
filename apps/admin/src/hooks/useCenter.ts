import { fetchCenter } from '../api/admin'
import { useRemoteData } from './useRemoteData'

export function useCenter() {
  return useRemoteData(fetchCenter)
}
