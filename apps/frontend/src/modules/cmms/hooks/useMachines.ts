import { useQuery } from '@tanstack/react-query'

import { getMachines } from '../api/cmms.api'

export function useMachines() {
  return useQuery({
    queryKey: ['machines'],
    queryFn: getMachines,
  })
}
