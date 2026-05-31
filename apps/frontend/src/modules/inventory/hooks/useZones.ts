import { useQuery }
  from '@tanstack/react-query'

import {
  getZones,
} from '../api/zones.api'

export function useZones() {

  return useQuery({

    queryKey: [
      'inventory-zones',
    ],

    queryFn:
      getZones,
  })
}
