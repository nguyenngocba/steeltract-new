import { http }
from '../../../shared/api/http'

export async function getComponentsRuntime() {

  const response = await http.get(
    '/components',
  )

  return response.data
}
