import { http }
from '../../../shared/http/http-client'

export async function getMaterials() {

  const response =
    await http.get(
      '/inventory/materials'
    )

  return response.data
}
