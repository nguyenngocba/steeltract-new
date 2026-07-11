import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  queryKeys,
} from '../../../lib/query/query-keys'
import { invalidateInventoryReadState } from './invalidateInventoryReadState'
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
    onSuccess: () =>
      invalidateInventoryReadState(queryClient),
  })
}

export function useReturnRequestsQuery() {
  return useQuery({
    queryKey: queryKeys.inventory.returns(),
    queryFn: () => getReturnRequests(),
  })
}

export function useCreateReturnRequestMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createReturnRequest,
    onSuccess: () =>
      invalidateInventoryReadState(queryClient),
  })
}

export function useAdvanceReturnRequestMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: advanceReturnRequest,
    onSuccess: () =>
      invalidateInventoryReadState(queryClient),
  })
}
