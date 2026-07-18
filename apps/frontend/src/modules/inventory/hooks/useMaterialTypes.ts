import { useQuery } from '@tanstack/react-query'

import { api } from '../../../lib/api'

async function fetchMaterialTypes() {

  const response =
    await api.get(
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
