import { http } from '../../../../shared/http/http-client'

export async function getMaterials() {
  const response =
    await http.get(
      '/inventory/items',
    )

  return response.data
}

export async function createMaterial(
  payload: any,
) {
  const response =
    await http.post(
      '/inventory/items',
      payload,
    )

  return response.data
}

export async function updateMaterial(
  id: string,
  payload: any,
) {
  const response =
    await http.put(
      `/inventory/items/${id}`,
      payload,
    )

  return response.data
}

export async function deleteMaterial(
  id: string,
) {
  const response =
    await http.delete(
      `/inventory/items/${id}`,
    )

  return response.data
}

export async function getSuppliers() {
  const response =
    await http.get(
      '/suppliers',
    )

  return response.data
}

export async function getProjects() {
  const response =
    await http.get(
      '/projects',
    )

  if (Array.isArray(response.data)) {
    return response.data
  }

  return response.data?.data ?? []
}

export async function getMaterialDetail(
  id: string,
) {
  const response =
    await http.get(
      `/inventory/items/${id}/detail`,
    )

  return response.data
}

export async function getInventoryAudit() {
  const response =
    await http.get(
      '/inventory/audit',
    )

  return response.data
}

export async function getTransactionDetail(
  id: string,
) {
  const response =
    await http.get(
      `/inventory/transactions/${id}`,
    )

  return response.data
}
