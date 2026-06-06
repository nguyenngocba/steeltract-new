import { useQuery } from '@tanstack/react-query'

import { getWarehouses } from '../api/zones.api'

export function useWarehouses() {
  return useQuery({
    queryKey: ['inventory-warehouses'],
    queryFn: getWarehouses,
  })
}
