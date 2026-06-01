import { useMutation } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'

import {
  createTransaction,
} from '../../api/createTransaction'

type OutboundPayload = {
  inventoryItemId: string
  quantity: number
  projectId?: string
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
        projectId:
          payload.projectId,
        items: [
          {
            inventoryItemId:
              payload.inventoryItemId,
            quantity:
              payload.quantity,
          },
        ],
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
