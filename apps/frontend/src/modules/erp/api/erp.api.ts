import { http } from '../../../shared/http/http-client'

export async function getSuppliers() {
  const response =
    await http.get('/erp/suppliers')

  return response.data
}

export async function getPurchaseOrders() {
  const response =
    await http.get('/erp/purchase-orders')

  return response.data
}

export async function getCosting() {
  const response =
    await http.get('/erp/costing')

  return response.data
}

export async function getExpenses() {
  const response =
    await http.get('/erp/expenses')

  return response.data
}
