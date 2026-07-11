import { useMutation } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'

import {
  createTransaction,
} from '../../api/createTransaction'
import { invalidateInventoryReadState } from '../invalidateInventoryReadState'

type InboundPayload = {
  inventoryItemId: string
  quantity: number
  unitPrice?: number
  supplierId?: string
  invoiceNo?: string
  warehouseId?: string
  zoneId?: string
  slotId?: string
  level?: string
}

export function useCreateInbound() {

  const queryClient =
    useQueryClient()

  return useMutation({
    mutationKey: ['inventory', 'transaction', 'create', 'inbound'],

    mutationFn: (
      payload: InboundPayload,
    ) =>
      createTransaction({

        type: 'INBOUND',
        supplierId:
          payload.supplierId,
        invoiceNo:
          payload.invoiceNo,
        items: [
          {
            inventoryItemId:
              payload.inventoryItemId,
            quantity:
              payload.quantity,
            unitPrice:
              payload.unitPrice,
            warehouseId:
              payload.warehouseId,
            zoneId:
              payload.zoneId,
            slotId:
              payload.slotId,
            level:
              payload.level,
          },
        ],
      }),

    onSuccess: () =>
      invalidateInventoryReadState(queryClient),
  })
}
