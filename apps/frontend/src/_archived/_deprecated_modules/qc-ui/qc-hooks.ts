import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  invalidateQc,
} from '../../lib/query/invalidation'
import { queryKeys } from '../../lib/query/query-keys'
import {
  completeQcInspection,
  createNcr,
  createQcIssue,
  getNcrs,
  getQcChecklists,
  getQcInspection,
  getQcInspections,
  getQcMetrics,
  recordQcResult,
  startQcInspection,
} from './qc-api'

import type {
  QcListParams,
} from './qc.types'

export function useQcChecklistsQuery(
  params?: QcListParams,
) {
  return useQuery({
    queryKey:
      queryKeys.qc.checklistList(params),
    queryFn: () =>
      getQcChecklists(params),
  })
}

export function useQcInspectionsQuery(
  params?: QcListParams,
) {
  return useQuery({
    queryKey:
      queryKeys.qc.inspectionList(params),
    queryFn: () =>
      getQcInspections(params),
  })
}

export function useQcInspectionQuery(
  id?: string,
) {
  return useQuery({
    queryKey: id
      ? queryKeys.qc.inspection(id)
      : queryKeys.qc.inspection('pending'),
    queryFn: () =>
      getQcInspection(id ?? ''),
    enabled: Boolean(id),
  })
}

export function useNcrsQuery(
  params?: QcListParams,
) {
  return useQuery({
    queryKey: queryKeys.qc.ncrList(params),
    queryFn: () => getNcrs(params),
  })
}

export function useQcMetricsQuery() {
  return useQuery({
    queryKey: queryKeys.qc.metrics(),
    queryFn: getQcMetrics,
  })
}

export function useStartQcInspectionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: startQcInspection,
    onSuccess: () => invalidateQc(queryClient),
  })
}

export function useCompleteQcInspectionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: completeQcInspection,
    onSuccess: () => invalidateQc(queryClient),
  })
}

export function useRecordQcResultMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: recordQcResult,
    onSuccess: () => invalidateQc(queryClient),
  })
}

export function useCreateQcIssueMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createQcIssue,
    onSuccess: () => invalidateQc(queryClient),
  })
}

export function useCreateNcrMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createNcr,
    onSuccess: () => invalidateQc(queryClient),
  })
}
