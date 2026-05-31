import { useQuery } from '@tanstack/react-query'

import {
  inventoryApi,
} from '../api/inventory.api'

async function fetchMaterialTypes() {

  const response =
    await inventoryApi.get(
      '/inventory/material-types',
    )

  return response.data
}

export function useMaterialTypes() {

  return useQuery({

    queryKey: [
      'inventory-material-types',
    ],

    queryFn:
      fetchMaterialTypes,
  })
}