import {
  inventoryApi,
} from './inventory.api'

export async function getCategories() {

  const response =
    await inventoryApi.get(
      '/inventory/categories',
    )

  return response.data
}

export async function createCategory(
  payload: any,
) {

  const response =
    await inventoryApi.post(
      '/inventory/categories',
      payload,
    )

  return response.data
}
