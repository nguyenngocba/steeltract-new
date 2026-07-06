import { useMutation } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'

import {
  createTransaction,
} from '../../api/createTransaction'

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
