import { http } from '../../../shared/http/http-client'

export async function getComponents() {
  const response =
    await http.get('/components')

  return response.data
}

export async function getFabrication() {
  const response =
    await http.get('/fabrication')

  return response.data
}
