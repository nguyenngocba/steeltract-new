import { api } from '../../lib/api'

import type {
  Machine,
  PaginatedProductionResponse,
  ProductionListParams,
  ProductionMetrics,
  ProductionOrder,
  WorkCenter,
} from './production.types'

type ProductionListResult =
  | ProductionOrder[]
  | PaginatedProductionResponse<ProductionOrder>

export async function getProductionOrders(
  params?: ProductionListParams,
) {
  const response =
    await api.get<ProductionListResult>(
      '/production',
      { params },
    )

  return response.data
}

export async function getProductionOrder(
  id: string,
) {
  const response =
    await api.get<ProductionOrder>(
      `/production/${id}`,
    )

  return response.data
}

export async function getProductionMetrics() {
  const response =
    await api.get<ProductionMetrics>(
      '/production/metrics',
    )

  return response.data
}

export async function getWorkCenters() {
  const response =
    await api.get<WorkCenter[]>(
      '/production/work-centers',
    )

  return response.data
}

export async function getMachines() {
  const response =
    await api.get<Machine[]>(
      '/production/machines',
    )

  return response.data
}

export async function startProductionOrder(
  id: string,
) {
  const response =
    await api.post<ProductionOrder>(
      `/production/${id}/start`,
      {},
    )

  return response.data
}

export async function completeProductionStage(
  stageId: string,
  payload: {
    message?: string
    qualityStatus?: string
    quantity?: number
    attachmentIds?: string[]
  } = {},
) {
  const response =
    await api.post<ProductionOrder>(
      `/production/stages/${stageId}/complete`,
      payload,
    )

  return response.data
}
