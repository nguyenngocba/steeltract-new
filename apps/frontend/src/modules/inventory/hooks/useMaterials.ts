import { useQuery } from '@tanstack/react-query'

import { getMaterials } from '../api/endpoints/inventory.endpoint'

export function useMaterials() {
  return useQuery({
    queryKey: ['materials'],
    queryFn: getMaterials,
  })
}
