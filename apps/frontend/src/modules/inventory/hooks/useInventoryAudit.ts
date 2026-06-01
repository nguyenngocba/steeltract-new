import { useQuery } from '@tanstack/react-query'

import { getInventoryAudit } from '../api/endpoints/inventory.endpoint'

export function useInventoryAudit() {
  return useQuery({
    queryKey: ['inventory-audit'],
    queryFn: getInventoryAudit,
    refetchInterval: 5000,
  })
}
