import { useQuery } from '@tanstack/react-query'

import { getInventoryItems }
  from '../api/inventory.api'

export function useInventoryItems() {
  return useQuery({
    queryKey: [
      'inventory-items',
    ],

    queryFn:
      getInventoryItems,

    refetchInterval: 5000,
  })
}
