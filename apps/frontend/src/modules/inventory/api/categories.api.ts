import { api } from '../../../lib/api'

export async function getCategories() {

  const response =
    await api.get(
      '/inventory/categories',
    )

  return response.data
}

export async function createCategory(
  payload: any,
) {

  const response =
    await api.post(
      '/inventory/categories',
      payload,
    )

  return response.data
}
