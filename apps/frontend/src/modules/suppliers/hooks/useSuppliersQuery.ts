import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  createSupplier,
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
