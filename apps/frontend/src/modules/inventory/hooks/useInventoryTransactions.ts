import { useQuery } from '@tanstack/react-query'

import { inventoryApi } from '../api/inventory.api'

async function fetchTransactions() {
  const response =
    await inventoryApi.get(
      '/transactions',
    )

  return response.data
}

export function useInventoryTransactions() {
  return useQuery({
    queryKey: ['inventory-transactions'],
    queryFn: fetchTransactions,
    refetchInterval: 4000,
  })
}
