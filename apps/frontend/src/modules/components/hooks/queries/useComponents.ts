import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  createComponent,
  createProductionOrder,
  getComponents,
  getProductionOrders,
} from '../../services/api/components.api'

export function useComponents() {
  return useQuery({
    queryKey: ['components'],
    queryFn: getComponents,
    refetchInterval: 5000,
  })
}

export function useCreateComponent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createComponent,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['components'],
      })
    },
  })
}

export function useProductionOrders() {
  return useQuery({
    queryKey: ['component-production-orders'],
    queryFn: getProductionOrders,
    refetchInterval: 5000,
  })
}

export function useCreateProductionOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProductionOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['component-production-orders'],
      })
    },
  })
}
