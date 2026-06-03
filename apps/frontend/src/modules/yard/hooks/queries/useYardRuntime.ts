import { useQuery } from '@tanstack/react-query'

import { yardApi } from '../../services/api/yard.api'

export const useYardSlotsRuntime = () => useQuery({ queryKey: ['yard', 'slots'], queryFn: yardApi.slots, refetchInterval: 5000 })
export const useYardMetricsRuntime = () => useQuery({ queryKey: ['yard', 'metrics'], queryFn: yardApi.metrics, refetchInterval: 5000 })
export const useYardMovementsRuntime = () => useQuery({ queryKey: ['yard', 'movements'], queryFn: yardApi.movements, refetchInterval: 5000 })
