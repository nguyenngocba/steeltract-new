import { useQuery } from '@tanstack/react-query'

import { inventoryApi } from '../api/inventory.api'

type TransactionFilters = {
  fromDate?: string
  toDate?: string
  supplierId?: string
  projectId?: string
  materialId?: string
  type?: string
  page?: number
  pageSize?: number
}

async function fetchTransactions(
  filters: TransactionFilters,
  signal?: AbortSignal,
) {
  const response =
    await inventoryApi.get(
      '/inventory/transactions',
      {
        params: filters,
        signal,
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
    queryFn: ({ signal }) =>
      fetchTransactions(filters, signal),
    refetchInterval: 4000,
  })
}
