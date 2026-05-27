import { useQuery } from '@tanstack/react-query'

import { getMaintenanceOrders } from '../api/cmms.api'

export function useMaintenanceOrders() {
  return useQuery({
    queryKey: ['maintenance-orders'],
    queryFn: getMaintenanceOrders,
  })
}
