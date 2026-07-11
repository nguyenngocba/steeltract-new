import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import { createTransaction } from '../api/createTransaction'
import { invalidateInventoryReadState } from './invalidateInventoryReadState'

export function useCreateTransaction() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationKey: ['inventory', 'transaction', 'create'],
    mutationFn: createTransaction,

    onSuccess: () =>
      invalidateInventoryReadState(queryClient),
  })
}
