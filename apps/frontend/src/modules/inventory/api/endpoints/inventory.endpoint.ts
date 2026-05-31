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