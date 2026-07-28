import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/query/query-keys'
import {
  createCanonicalNcr,
  failFinalInspection,
  getInspection,
  getQcComponentInstances,
  getQcDashboard,
  getQcWorkspace,
  markNcrRework,
  markNcrScrap,
  markNcrUseAsIs,
  passFinalInspection,
  type QcWorkspaceParams,
} from '../api/qc.api'

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

export function useQcComponentInstances(params: Record<string, unknown>, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.qc.all, 'component-instances', params],
    queryFn: () => getQcComponentInstances(params),
    placeholderData: keepPreviousData,
    enabled,
    refetchInterval: 5000,
  })
}

export function useQcInspectionDetail(id?: string) {
  return useQuery({
    queryKey: [...queryKeys.qc.all, 'inspection', id],
    queryFn: () => getInspection(id!),
    enabled: Boolean(id),
  })
}

function useQcCommandMutation<TArgs>(mutationFn: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.qc.all })
      queryClient.invalidateQueries({ queryKey: ['components'] })
      queryClient.invalidateQueries({ queryKey: ['production'] })
    },
  })
}

export const usePassFinalInspection = () =>
  useQcCommandMutation(({ id, expectedVersion = 0 }: { id: string; expectedVersion?: number }) =>
    passFinalInspection(id, expectedVersion))

export const useFailFinalInspection = () =>
  useQcCommandMutation(({ id, expectedVersion = 0 }: { id: string; expectedVersion?: number }) =>
    failFinalInspection(id, expectedVersion))

export const useCreateCanonicalNcr = () =>
  useQcCommandMutation(({ inspectionId, payload }: { inspectionId: string; payload: Parameters<typeof createCanonicalNcr>[1] }) =>
    createCanonicalNcr(inspectionId, payload))

export const useMarkNcrRework = () =>
  useQcCommandMutation(({ ncrId, expectedVersion = 0, reason }: { ncrId: string; expectedVersion?: number; reason?: string }) =>
    markNcrRework(ncrId, expectedVersion, reason))

export const useMarkNcrScrap = () =>
  useQcCommandMutation(({ ncrId, expectedVersion = 0, reason }: { ncrId: string; expectedVersion?: number; reason?: string }) =>
    markNcrScrap(ncrId, expectedVersion, reason))

export const useMarkNcrUseAsIs = () =>
  useQcCommandMutation(({ ncrId, expectedVersion = 0, reason }: { ncrId: string; expectedVersion?: number; reason?: string }) =>
    markNcrUseAsIs(ncrId, expectedVersion, reason))
