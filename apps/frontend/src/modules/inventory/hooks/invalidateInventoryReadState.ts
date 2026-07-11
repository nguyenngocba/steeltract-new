import type { QueryClient } from '@tanstack/react-query'

const inventoryReadAfterWriteKeys = [
  ['inventory', 'overview'],
  ['inventory', 'materials'],
  ['inventory', 'material-transactions'],
  ['inventory-transactions'],
  ['inventory-items'],
  ['inventory-zones'],
  ['inventory-zone-detail'],
  ['inventory-audit'],
  ['inventory-return-requests'],
  ['inventory-return-requests-overview'],
  ['material-detail'],
  ['inventory-material-detail'],
  ['dashboard'],
] as const

async function refetchActiveInventoryReads(queryClient: QueryClient) {
  await Promise.all(
    inventoryReadAfterWriteKeys.map((queryKey) =>
      queryClient.refetchQueries({
        queryKey: [...queryKey],
        type: 'active',
      }),
    ),
  )
}

export async function invalidateInventoryReadState(queryClient: QueryClient) {
  await Promise.all(
    inventoryReadAfterWriteKeys.map((queryKey) =>
      queryClient.invalidateQueries({
        queryKey: [...queryKey],
      }),
    ),
  )

  await refetchActiveInventoryReads(queryClient)
}
