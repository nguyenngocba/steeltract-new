import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  invalidateYard,
} from '../../lib/query/invalidation'
import { queryKeys } from '../../lib/query/query-keys'
import {
  generateYardSnapshot,
  getCranes,
  getYardMetrics,
  getYardMovements,
  getYardSlots,
  getYardSnapshots,
  getYardZone,
  getYardZones,
  moveYardItem,
  placeYardItem,
  removeYardItem,
  searchYard,
} from './yard-api'

import type {
  YardListParams,
} from './yard.types'

export function useYardZonesQuery(
  params?: YardListParams,
) {
  return useQuery({
    queryKey:
      queryKeys.yard.zoneList(params),
    queryFn: () => getYardZones(params),
  })
}

export function useYardZoneQuery(
  id?: string,
) {
  return useQuery({
    queryKey: id
      ? queryKeys.yard.zone(id)
      : queryKeys.yard.zone('pending'),
    queryFn: () => getYardZone(id ?? ''),
    enabled: Boolean(id),
  })
}

export function useYardSlotsQuery(
  params?: YardListParams,
) {
  return useQuery({
    queryKey:
      queryKeys.yard.slotList(params),
    queryFn: () => getYardSlots(params),
  })
}

export function useYardSearchQuery(
  params?: YardListParams,
) {
  return useQuery({
    queryKey:
      queryKeys.yard.search(params),
    queryFn: () => searchYard(params),
  })
}

export function useYardMovementsQuery(
  params?: YardListParams,
) {
  return useQuery({
    queryKey:
      queryKeys.yard.movements(params),
    queryFn: () => getYardMovements(params),
  })
}

export function useYardMetricsQuery() {
  return useQuery({
    queryKey: queryKeys.yard.metrics(),
    queryFn: getYardMetrics,
  })
}

export function useCranesQuery() {
  return useQuery({
    queryKey: queryKeys.yard.cranes(),
    queryFn: getCranes,
  })
}

export function useYardSnapshotsQuery(
  params?: YardListParams,
) {
  return useQuery({
    queryKey:
      queryKeys.yard.snapshots(params),
    queryFn: () =>
      getYardSnapshots(params),
  })
}

export function usePlaceYardItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: placeYardItem,
    onSuccess: () =>
      invalidateYard(queryClient),
  })
}

export function useMoveYardItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: moveYardItem,
    onSuccess: () =>
      invalidateYard(queryClient),
  })
}

export function useRemoveYardItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removeYardItem,
    onSuccess: () =>
      invalidateYard(queryClient),
  })
}

export function useGenerateYardSnapshotMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generateYardSnapshot,
    onSuccess: () =>
      invalidateYard(queryClient),
  })
}
