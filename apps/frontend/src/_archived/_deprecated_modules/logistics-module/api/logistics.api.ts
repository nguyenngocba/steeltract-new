import { http }
from '../../../shared/api/http'

export async function getShipmentsRuntime() {

  const response = await http.get(
    '/logistics/shipments',
  )

  return response.data
}

export async function getFleetRuntime() {

  const response = await http.get(
    '/logistics/fleet',
  )

  return response.data
}
