import { api as http } from '../../../lib/api'

export async function getWorkOrders() {
  const response =
    await http.get('/mes/orders')

  return response.data
}
