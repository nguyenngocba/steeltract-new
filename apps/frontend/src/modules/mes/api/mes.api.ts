import { http } from '../../../shared/http/http-client'

export async function getWorkOrders() {
  const response =
    await http.get('/mes/orders')

  return response.data
}
