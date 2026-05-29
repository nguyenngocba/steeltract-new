import { useQuery } from '@tanstack/react-query'
import { getRuntimeOverview } from '../api/runtime.api'

export function useRuntimeOverview() {
  return useQuery({
    queryKey: ['runtime-overview'],
    queryFn: getRuntimeOverview,
    refetchInterval: 5000,
  })
}