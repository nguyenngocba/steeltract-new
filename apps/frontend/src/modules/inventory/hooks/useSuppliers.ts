import { useQuery } from '@tanstack/react-query'

import { getSuppliers } from '../api/endpoints/inventory.endpoint'

export function useSuppliers() {
  return useQuery({
    queryKey: ['inventory-suppliers'],
    queryFn: getSuppliers,
  })
}
