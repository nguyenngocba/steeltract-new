import { inventoryApi } from './inventory.api'

export async function createTransaction(
  payload: any,
) {
  const response =
    await inventoryApi.post(
      '/transactions',
      payload,
    )

  return response.data
}
