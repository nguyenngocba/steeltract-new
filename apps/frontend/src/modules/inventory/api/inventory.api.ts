import { api } from '../../../lib/api'

export async function getInventoryItems() {
  const { data } =
    await api.get(
      '/inventory/items',
    )

  return data
}

export type SaveInventoryItemPayload = {
  code: string
  name: string
  description?: string
  unit?: string
  unitId?: string
  categoryId?: string
  materialTypeId?: string
  materialUsageTypeId?: string
  materialUsageType?: 'PRIMARY' | 'SECONDARY' | 'CONSUMABLE'
  minimumStock?: number
}

export async function createInventoryItem(
  payload: SaveInventoryItemPayload,
) {
  const { data } =
    await api.post(
      '/inventory/items',
      payload,
    )

  return data
}

export async function updateInventoryItem({
  id,
  payload,
}: {
  id: string
  payload: Partial<SaveInventoryItemPayload>
}) {
  const { data } =
    await api.put(
      `/inventory/items/${id}`,
      payload,
    )

  return data
}

export async function deleteInventoryItem(
  id: string,
) {
  const { data } =
    await api.delete(
      `/inventory/items/${id}`,
    )

  return data
}

export async function getInboundSuggestions(
  id: string,
) {
  const { data } =
    await api.get(
      `/inventory/items/${id}/inbound-suggestions`,
    )

  return data
}
