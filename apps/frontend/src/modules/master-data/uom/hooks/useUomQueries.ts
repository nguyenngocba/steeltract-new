import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  queryKeys,
} from '../../../../lib/query/query-keys'
import {
  createUnitOfMeasure,
  deactivateUnitOfMeasure,
  getUnitsOfMeasure,
  updateUnitOfMeasure,
} from '../api/uom.api'

import type {
  UomListParams,
} from '../types/uom.types'

export function useUomQuery(params?: UomListParams) {
  return useQuery({
    queryKey: queryKeys.masterData.uomList(params),
    queryFn: () => getUnitsOfMeasure(params),
  })
}

export function useActiveUomQuery() {
  return useUomQuery({
    active: true,
  })
}

export function useCreateUomMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createUnitOfMeasure,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.masterData.uom(),
      }),
  })
}

export function useUpdateUomMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateUnitOfMeasure,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.masterData.uom(),
      }),
  })
}

export function useDeactivateUomMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deactivateUnitOfMeasure,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.masterData.uom(),
      }),
  })
}
