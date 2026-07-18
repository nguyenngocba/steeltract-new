import { api } from '../../../lib/api'

export async function getMaterialTypes() {

  const response =
    await api.get(
      '/inventory/material-types',
    )

  return response.data
}

export async function createMaterialType(
  payload: any,
) {

  const response =
    await api.post(
      '/inventory/material-types',
      payload,
    )

  return response.data
}

export async function updateMaterialType(
  id: string,
  payload: any,
) {

  const response =
    await api.put(
      `/inventory/material-types/${id}`,
      payload,
    )

  return response.data
}

export async function deleteMaterialType(
  id: string,
) {

  const response =
    await api.delete(
      `/inventory/material-types/${id}`,
    )

  return response.data
}
