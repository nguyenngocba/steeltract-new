import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { yardApi } from '../../services/api/yard.api'

export const useYardSlotsRuntime = () => useQuery({ queryKey: ['yard', 'slots'], queryFn: yardApi.slots, refetchInterval: 5000 })
export const useYardZonesRuntime = () => useQuery({ queryKey: ['yard', 'zones'], queryFn: yardApi.zones, refetchInterval: 5000 })
export const useYardMetricsRuntime = () => useQuery({ queryKey: ['yard', 'metrics'], queryFn: yardApi.metrics, refetchInterval: 5000 })
export const useYardMovementsRuntime = () => useQuery({ queryKey: ['yard', 'movements'], queryFn: yardApi.movements, refetchInterval: 5000 })
export const useYardCranesRuntime = () => useQuery({ queryKey: ['yard', 'cranes'], queryFn: yardApi.cranes, refetchInterval: 5000 })

const useYardRuntimeMutation = <T,>(mutationFn: (payload: T) => Promise<unknown>) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yard'] })
      queryClient.invalidateQueries({ queryKey: ['components'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export const usePlaceYardItem = () => useYardRuntimeMutation(yardApi.place)
export const useMoveYardItem = () => useYardRuntimeMutation(yardApi.move)
export const useRemoveYardItem = () => useYardRuntimeMutation(yardApi.remove)
export const useCreateYardZone = () => useYardRuntimeMutation(yardApi.createZone)
export const useCreateYardSlot = () => useYardRuntimeMutation(yardApi.createSlot)
export const useUpdateYardZone = () => useYardRuntimeMutation(yardApi.updateZone)
export const useDeleteYardZone = () => useYardRuntimeMutation(yardApi.deleteZone)
