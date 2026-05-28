import { http }
from '../../../shared/api/http'

export async function getProductionOrders() {

  const response = await http.get(
    '/production/orders',
  )

  return response.data
}

export async function getMachineTelemetry() {

  const response = await http.get(
    '/production/machines',
  )

  return response.data
}
