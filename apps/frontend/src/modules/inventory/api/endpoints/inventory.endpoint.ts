import { http } from '../../../../shared/http/http-client'

export async function getMaterials() {
  const response =
    await http.get('/inventory')

  return response.data
}
