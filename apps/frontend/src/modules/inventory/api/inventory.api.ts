import { http } from '../../../shared/http/http-client'

export async function getMaterials() {
  const response =
    await http.get('/inventory/materials')

  return response.data
}

export async function getTransactions() {
  const response =
    await http.get('/inventory/transactions')

  return response.data
}

export async function getLowStock() {
  const response =
    await http.get('/inventory/low-stock')

  return response.data
}
