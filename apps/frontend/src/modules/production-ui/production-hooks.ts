import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  invalidateProduction,
} from '../../lib/query/invalidation'
import { queryKeys } from '../../lib/query/query-keys'
import {
  completeProductionStage,
  getMachines,
  getProductionMetrics,
  getProductionOrder,
  getProductionOrders,
  getWorkCenters,
  startProductionOrder,
} from './production-api'

import type {
  ProductionListParams,
} from './production.types'

export function useProductionOrdersQuery(
  params?: ProductionListParams,
) {
  return useQuery({
    queryKey:
      queryKeys.production.orderList(params),
    queryFn: () => getProductionOrders(params),
  })
}

export function useProductionOrderQuery(
  id?: string,
) {
  return useQuery({
    queryKey: id
      ? queryKeys.production.order(id)
      : queryKeys.production.order('pending'),
    queryFn: () => getProductionOrder(id ?? ''),
    enabled: Boolean(id),
  })
}

export function useProductionMetricsQuery() {
  return useQuery({
    queryKey: queryKeys.production.metrics(),
    queryFn: getProductionMetrics,
  })
}

export function useWorkCentersQuery() {
  return useQuery({
    queryKey: queryKeys.production.workCenters(),
    queryFn: getWorkCenters,
  })
}

export function useMachinesQuery() {
  return useQuery({
    queryKey: queryKeys.production.machines(),
    queryFn: getMachines,
  })
}

export function useStartProductionOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: startProductionOrder,
    onSuccess: () =>
      invalidateProduction(queryClient),
  })
}

export function useCompleteProductionStageMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      stageId,
      payload,
    }: {
      stageId: string
      payload?: Parameters<
        typeof completeProductionStage
      >[1]
    }) =>
      completeProductionStage(
        stageId,
        payload,
      ),
    onSuccess: () =>
      invalidateProduction(queryClient),
  })
}
