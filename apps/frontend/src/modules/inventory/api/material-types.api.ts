import {
  inventoryApi,
} from './inventory.api'

export async function getMaterialTypes() {

  const response =
    await inventoryApi.get(
      '/inventory/material-types',
    )

  return response.data
}

export async function createMaterialType(
  payload: any,
) {

  const response =
    await inventoryApi.post(
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
    await inventoryApi.put(
      `/inventory/material-types/${id}`,
      payload,
    )

  return response.data
}

export async function deleteMaterialType(
  id: string,
) {

  const response =
    await inventoryApi.delete(
      `/inventory/material-types/${id}`,
    )

  return response.data
}
