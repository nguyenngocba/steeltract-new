import { http } from '../../../shared/http/http-client'

export async function getMachines() {
  const response =
    await http.get('/cmms/machines')

  return response.data
}

export async function getMaintenanceOrders() {
  const response =
    await http.get('/cmms/work-orders')

  return response.data
}
