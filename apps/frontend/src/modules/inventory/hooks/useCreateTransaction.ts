import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

import { createTransaction } from '../api/createTransaction'

export function useCreateTransaction() {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: createTransaction,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['inventory-transactions'],
      })

      queryClient.invalidateQueries({
        queryKey: ['inventory-items'],
      })

      queryClient.invalidateQueries({
        queryKey: ['material-detail'],
      })

      queryClient.invalidateQueries({
        queryKey: ['zones'],
      })

      queryClient.invalidateQueries({
        queryKey: ['inventory-audit'],
      })
    },
  })
}
