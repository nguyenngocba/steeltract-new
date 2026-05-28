import { api } from '../../lib/api'

import type {
  BootstrapSimulationPayload,
  SimulationScenarioId,
  SimulationStatus,
  StartSimulationPayload,
} from './simulation.types'

export async function getSimulationStatus() {
  const response =
    await api.get<SimulationStatus>(
      '/simulation/status',
    )

  return response.data
}

export async function bootstrapSimulation(
  payload: BootstrapSimulationPayload,
) {
  const response = await api.post<{
    status: SimulationStatus
    result: Record<string, number>
  }>('/simulation/bootstrap', payload)

  return response.data
}

export async function startSimulation(
  payload: StartSimulationPayload,
) {
  const response =
    await api.post<SimulationStatus>(
      '/simulation/start',
      payload,
    )

  return response.data
}

export async function stopSimulation() {
  const response =
    await api.post<SimulationStatus>(
      '/simulation/stop',
    )

  return response.data
}

export async function resetSimulation() {
  const response =
    await api.post<SimulationStatus>(
      '/simulation/reset',
    )

  return response.data
}

export async function runSimulationScenario(
  scenarioId: SimulationScenarioId,
  payload: Pick<
    StartSimulationPayload,
    'speed' | 'mode'
  >,
) {
  const response = await api.post<{
    status: SimulationStatus
    eventName: string
  }>(
    `/simulation/scenarios/${scenarioId}/run`,
    payload,
  )

  return response.data
}
