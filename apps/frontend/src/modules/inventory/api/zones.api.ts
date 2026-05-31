import {
  inventoryApi,
} from './inventory.api'

export async function getZones() {

  const response =
    await inventoryApi.get(
      '/inventory/zones',
    )

  return response.data
}
