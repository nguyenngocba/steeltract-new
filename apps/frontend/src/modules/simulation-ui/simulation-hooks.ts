import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  bootstrapSimulation,
  getSimulationStatus,
  resetSimulation,
  runSimulationScenario,
  startSimulation,
  stopSimulation,
} from './simulation-api'

import type {
  SimulationScenarioId,
  StartSimulationPayload,
} from './simulation.types'

const simulationKeys = {
  all: ['simulation'] as const,
  status: () =>
    [...simulationKeys.all, 'status'] as const,
}

export function useSimulationStatusQuery() {
  return useQuery({
    queryKey: simulationKeys.status(),
    queryFn: getSimulationStatus,
    refetchInterval: 5000,
  })
}

export function useBootstrapSimulationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: bootstrapSimulation,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: simulationKeys.all,
      }),
  })
}

export function useStartSimulationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: startSimulation,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: simulationKeys.all,
      }),
  })
}

export function useStopSimulationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: stopSimulation,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: simulationKeys.all,
      }),
  })
}

export function useResetSimulationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: resetSimulation,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: simulationKeys.all,
      }),
  })
}

export function useRunSimulationScenarioMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      scenarioId,
      payload,
    }: {
      scenarioId: SimulationScenarioId
      payload: Pick<
        StartSimulationPayload,
        'speed' | 'mode'
      >
    }) =>
      runSimulationScenario(
        scenarioId,
        payload,
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: simulationKeys.all,
      }),
  })
}
