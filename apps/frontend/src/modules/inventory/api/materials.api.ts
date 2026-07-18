import { api as http }
from '../../../lib/api'

export async function getMaterials() {

  const response =
    await http.get(
      '/inventory/items'
    )

  return response.data
}
