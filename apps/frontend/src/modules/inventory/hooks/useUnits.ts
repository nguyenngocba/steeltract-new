import { useQuery } from '@tanstack/react-query'
import { inventoryApi } from '../api/inventory.api'

async function fetchUnits() {

  const response =
    await inventoryApi.get(
      '/inventory/units',
    )

  return response.data
}

export function useUnits() {

  return useQuery({

    queryKey: [
      'inventory-units',
    ],

    queryFn:
      fetchUnits,
  })
}
