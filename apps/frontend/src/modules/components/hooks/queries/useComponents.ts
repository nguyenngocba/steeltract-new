import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  createComponent,
  createProductionOrder,
  deleteComponent,
  getComponentCostingBreakdown,
  getComponentCosting,
  getComponents,
  getProductionOrders,
  recalculateComponentCosting,
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

export function useDeleteComponent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteComponent,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['components'],
      })
      queryClient.invalidateQueries({
        queryKey: ['production', 'components'],
      })
    },
  })
}

export function useComponentCosting(componentId?: string) {
  return useQuery({
    queryKey: ['components', 'costing', componentId],
    queryFn: () => getComponentCosting(componentId!),
    enabled: Boolean(componentId),
  })
}

export function useComponentCostingBreakdown(componentId?: string) {
  return useQuery({
    queryKey: ['components', 'costing-breakdown', componentId],
    queryFn: () => getComponentCostingBreakdown(componentId!),
    enabled: Boolean(componentId),
  })
}

export function useRecalculateComponentCosting() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: recalculateComponentCosting,
    onSuccess: (_data, componentId) => {
      queryClient.invalidateQueries({
        queryKey: ['components'],
      })
      queryClient.invalidateQueries({
        queryKey: ['components', 'costing', componentId],
      })
      queryClient.invalidateQueries({
        queryKey: ['components', 'costing-breakdown', componentId],
      })
      queryClient.invalidateQueries({
        queryKey: ['projects'],
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
