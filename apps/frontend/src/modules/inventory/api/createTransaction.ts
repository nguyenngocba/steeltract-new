import { inventoryApi } from './inventory.api'

export async function createTransaction(
  payload: any,
) {
  const response =
    await inventoryApi.post(
      '/inventory/transactions',
      payload,
    )

  return response.data
}