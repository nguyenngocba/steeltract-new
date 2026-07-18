import { api } from '../../../lib/api'

export async function createTransaction(
  payload: any,
) {
  const response =
    await api.post(
      '/inventory/transactions',
      payload,
    )

  return response.data
}
