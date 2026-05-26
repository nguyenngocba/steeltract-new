import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  queryKeys,
} from '../../../lib/query/query-keys'
import {
  createMasterDataRecord,
  deactivateMasterDataRecord,
  getMasterDataRecords,
  updateMasterDataRecord,
} from '../api/master-data.api'

import type {
  MasterDataDomainId,
  MasterDataListParams,
} from '../types/master-data.types'

export function useMasterDataRecordsQuery(
  domain: MasterDataDomainId,
  params?: MasterDataListParams,
) {
  return useQuery({
    queryKey: queryKeys.masterData.dictionaryList(
      domain,
      params,
    ),
    queryFn: () => getMasterDataRecords(domain, params),
  })
}

export function useCreateMasterDataMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createMasterDataRecord,
    onSuccess: (_record, variables) =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.masterData.dictionary(
          variables.domain,
        ),
      }),
  })
}

export function useUpdateMasterDataMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateMasterDataRecord,
    onSuccess: (_record, variables) =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.masterData.dictionary(
          variables.domain,
        ),
      }),
  })
}

export function useDeactivateMasterDataMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deactivateMasterDataRecord,
    onSuccess: (_record, variables) =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.masterData.dictionary(
          variables.domain,
        ),
      }),
  })
}
