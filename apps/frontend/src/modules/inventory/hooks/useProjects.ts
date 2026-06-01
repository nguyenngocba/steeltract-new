import { useQuery } from '@tanstack/react-query'

import { getProjects } from '../api/endpoints/inventory.endpoint'

export function useProjects() {
  return useQuery({
    queryKey: ['inventory-projects'],
    queryFn: getProjects,
  })
}
