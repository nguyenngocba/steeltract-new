import { http } from '../../../shared/http/http-client'

export async function getYards() {
  const response =
    await http.get('/yard')

  return response.data
}

export async function getTruckQueue() {
  const response =
    await http.get('/yard/trucks')

  return response.data
}
