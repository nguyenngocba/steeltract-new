import { api } from '../../../lib/api'

export async function getInventoryItems() {
  const { data } =
    await api.get(
      '/inventory/items',
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
