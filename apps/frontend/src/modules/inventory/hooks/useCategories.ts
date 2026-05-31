import { useQuery } from '@tanstack/react-query'
import { inventoryApi } from '../api/inventory.api'

async function fetchCategories() {

  const response =
    await inventoryApi.get(
      '/inventory/categories',
    )

  return response.data
}

export function useCategories() {

  return useQuery({

    queryKey: [
      'inventory-categories',
    ],

    queryFn:
      fetchCategories,
  })
}
