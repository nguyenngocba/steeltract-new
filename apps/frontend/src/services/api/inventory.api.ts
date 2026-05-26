import { api } from '../../lib/api'

import type {
  InventoryItem,
  ListParams,
} from './types'

export interface SaveInventoryItemPayload {
  name: string
  code: string
  quantity?: string
  category?: string
  unitId?: string
}

export async function getInventory(
  params?: ListParams,
) {
  const response =
    await api.get<InventoryItem[]>(
      '/inventory',
      {
        params,
      },
    )

  return response.data
}

export async function createInventoryItem(
  payload: SaveInventoryItemPayload,
) {
  const response =
    await api.post<InventoryItem>(
      '/inventory',
      payload,
    )

  return response.data
}

export async function updateInventoryItem(
  id: string,
  payload: SaveInventoryItemPayload,
) {
  const response =
    await api.patch<InventoryItem>(
      `/inventory/${id}`,
      payload,
    )

  return response.data
}

export async function deleteInventoryItem(
  id: string,
) {
  const response =
    await api.delete<InventoryItem>(
      `/inventory/${id}`,
    )

  return response.data
}
