import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  createSupplier,
  getSupplierEvaluationCockpit,
  getSupplierCockpitDetail,
  getSupplierCockpitSummary,
  getSuppliers,
  updateSupplier,
  type SupplierPayload,
} from '../api/suppliers.api'

export function useSuppliersQuery(
  search: string,
) {
  return useQuery({
    queryKey: ['suppliers', search],
    queryFn: () => getSuppliers(search),
  })
}

export function useSupplierEvaluationCockpitQuery() {
  return useQuery({
    queryKey: ['suppliers', 'evaluation-cockpit'],
    queryFn: getSupplierEvaluationCockpit,
    refetchInterval: 5000,
  })
}

export function useSupplierCockpitSummaryQuery() {
  return useQuery({
    queryKey: ['suppliers', 'cockpit-summary'],
    queryFn: getSupplierCockpitSummary,
    refetchInterval: 5000,
  })
}

export function useSupplierCockpitDetailQuery(id?: string) {
  return useQuery({
    queryKey: ['suppliers', 'cockpit-detail', id],
    queryFn: () => getSupplierCockpitDetail(id!),
    enabled: Boolean(id),
    refetchInterval: 5000,
  })
}

export function useCreateSupplierMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SupplierPayload) =>
      createSupplier(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['suppliers'],
      })
      queryClient.invalidateQueries({
        queryKey: ['inventory-suppliers'],
      })
    },
  })
}

export function useUpdateSupplierMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: Partial<SupplierPayload>
    }) => updateSupplier(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['suppliers'],
      })
      queryClient.invalidateQueries({
        queryKey: ['inventory-suppliers'],
      })
    },
  })
}
