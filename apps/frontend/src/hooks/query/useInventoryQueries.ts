import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  invalidateInventory,
} from '../../lib/query/invalidation'
import { queryKeys } from '../../lib/query/query-keys'
import {
  createInventoryItem,
  deleteInventoryItem,
  getInventory,
  updateInventoryItem,
} from '../../services/api/inventory.api'

import type {
  SaveInventoryItemPayload,
} from '../../services/api/inventory.api'

export function useInventoryQuery() {
  return useQuery({
    queryKey: queryKeys.inventory.list(),
    queryFn: () => getInventory(),
  })
}

export function useCreateInventoryItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createInventoryItem,
    onSuccess: () =>
      invalidateInventory(queryClient),
  })
}

export function useUpdateInventoryItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: SaveInventoryItemPayload
    }) => updateInventoryItem(id, payload),
    onSuccess: () =>
      invalidateInventory(queryClient),
  })
}

export function useDeleteInventoryItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteInventoryItem,
    onSuccess: () =>
      invalidateInventory(queryClient),
  })
}
