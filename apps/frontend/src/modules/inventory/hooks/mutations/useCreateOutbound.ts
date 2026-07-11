import { useMutation } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'

import {
  createTransaction,
} from '../../api/createTransaction'
import { invalidateInventoryReadState } from '../invalidateInventoryReadState'

type OutboundPayload = {
  inventoryItemId: string
  quantity: number
  projectId?: string
}

export function useCreateOutbound() {

  const queryClient =
    useQueryClient()

  return useMutation({
    mutationKey: ['inventory', 'transaction', 'create', 'outbound'],

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

    onSuccess: () =>
      invalidateInventoryReadState(queryClient),
  })
}
