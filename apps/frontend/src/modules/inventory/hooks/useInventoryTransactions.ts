import { useQuery } from '@tanstack/react-query'

import { api } from '../../../lib/api'

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
    await api.get(
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
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [
      'inventory-transactions',
      filters,
    ],
    queryFn: ({ signal }) =>
      fetchTransactions(filters, signal),
    enabled: options.enabled ?? true,
    refetchInterval: (options.enabled ?? true) ? 4000 : false,
  })
}
