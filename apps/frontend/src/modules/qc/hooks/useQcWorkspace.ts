import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query/query-keys'
import { getQcDashboard, getQcWorkspace, type QcWorkspaceParams } from '../api/qc.api'

export function useQcWorkspace(params: QcWorkspaceParams) {
  return useQuery({
    queryKey: queryKeys.qc.workspace(params),
    queryFn: () => getQcWorkspace(params),
    placeholderData: keepPreviousData,
    refetchInterval: 5000,
  })
}

export function useQcDashboard(enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.qc.all, 'dashboard'],
    queryFn: getQcDashboard,
    enabled,
  })
}
