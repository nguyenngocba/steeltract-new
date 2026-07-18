import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/api'

async function fetchCategories() {

  const response =
    await api.get(
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
