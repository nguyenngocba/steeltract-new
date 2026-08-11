import { useQuery } from '@tanstack/react-query'

import { getWarehouses } from '../api/zones.api'

export function useWarehouses(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['inventory-warehouses'],
    queryFn: getWarehouses,
    enabled: options?.enabled,
  })
}
