import { useMutation } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'

import {
  createTransaction,
} from '../../api/createTransaction'

type OutboundPayload = {
  materialId: string
  quantity: number
}

export function useCreateOutbound() {

  const queryClient =
    useQueryClient()

  return useMutation({

    mutationFn: (
      payload: OutboundPayload,
    ) =>
      createTransaction({

        type: 'OUTBOUND',

        materialId:
          payload.materialId,

        quantity:
          payload.quantity,
      }),

    onSuccess() {

      queryClient.invalidateQueries({
        queryKey: [
          'inventory-transactions',
        ],
      })

      queryClient.invalidateQueries({
        queryKey: [
          'materials',
        ],
      })
    },
  })
}