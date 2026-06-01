import { useQuery } from '@tanstack/react-query'

import { getMaterialDetail } from '../api/endpoints/inventory.endpoint'

export function useMaterialDetail(id?: string) {
  return useQuery({
    queryKey: ['material-detail', id],
    queryFn: () => getMaterialDetail(id as string),
    enabled: Boolean(id),
  })
}
