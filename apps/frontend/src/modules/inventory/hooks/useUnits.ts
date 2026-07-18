import { useQuery } from '@tanstack/react-query'
import { api } from '../../../lib/api'

async function fetchUnits() {

  const response =
    await api.get(
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
