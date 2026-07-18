import { api } from '../../../lib/api'

export async function getRuntimeOverview() {
  const { data } = await api.get(
    '/runtime/overview'
  )

  return data
}
