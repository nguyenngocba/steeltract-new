import { useQuery } from '@tanstack/react-query'

import { getWorkOrders } from '../api/mes.api'

export function useWorkOrders() {
  return useQuery({
    queryKey: ['work-orders'],
    queryFn: getWorkOrders,
  })
}
