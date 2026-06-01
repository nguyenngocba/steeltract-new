import { useQuery } from '@tanstack/react-query'

import { inventoryApi } from '../api/inventory.api'

type TransactionFilters = {
  fromDate?: string
  toDate?: string
  supplierId?: string
  projectId?: string
  type?: string
}

async function fetchTransactions(
  filters: TransactionFilters,
) {
  const response =
    await inventoryApi.get(
      '/inventory/transactions',
      {
        params: filters,
      },
    )

  return response.data
}

export function useInventoryTransactions(
  filters: TransactionFilters,
) {
  return useQuery({
    queryKey: [
      'inventory-transactions',
      filters,
    ],
    queryFn: () =>
      fetchTransactions(filters),
    refetchInterval: 4000,
  })
}
