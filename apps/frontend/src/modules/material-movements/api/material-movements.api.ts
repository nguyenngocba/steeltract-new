import { api } from '@/lib/api'

export async function getMaterialMovements() {
  const response =
    await api.get(
      '/material-movements',
    )

  return response.data
}
