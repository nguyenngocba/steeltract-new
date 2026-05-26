import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  queryKeys,
} from '../../../lib/query/query-keys'
import {
  createInventoryTransaction,
  createReturnRequest,
  advanceReturnRequest,
  getInventoryTransactions,
  getReturnRequests,
} from '../api/transactions.api'

export function useInventoryTransactionsQuery() {
  return useQuery({
    queryKey: queryKeys.inventory.transactions(),
    queryFn: getInventoryTransactions,
  })
}

export function useCreateInventoryTransactionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createInventoryTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.all,
      })
    },
  })
}

export function useReturnRequestsQuery() {
  return useQuery({
    queryKey: queryKeys.inventory.returns(),
    queryFn: getReturnRequests,
  })
}

export function useCreateReturnRequestMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createReturnRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.all,
      })
    },
  })
}

export function useAdvanceReturnRequestMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: advanceReturnRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.all,
      })
    },
  })
}
