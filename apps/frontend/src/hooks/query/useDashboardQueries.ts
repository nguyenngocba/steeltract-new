import {
  useQuery,
} from '@tanstack/react-query'

import { queryKeys } from '../../lib/query/query-keys'
import {
  getDashboardOverview,
} from '../../services/api/dashboard.api'

export function useDashboardOverviewQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.overview(),
    queryFn: getDashboardOverview,
  })
}
