import { api } from '../../lib/api'

import type {
  Crane,
  PaginatedYardResponse,
  YardItemPlacement,
  YardListParams,
  YardMetrics,
  YardMovement,
  YardSlot,
  YardSnapshot,
  YardZone,
} from './yard.types'

type ListResult<T> =
  | T[]
  | PaginatedYardResponse<T>

export async function getYardZones(
  params?: YardListParams,
) {
  const response = await api.get<
    ListResult<YardZone>
  >('/yard/zones', { params })

  return response.data
}

export async function getYardZone(id: string) {
  const response = await api.get<YardZone>(
    `/yard/zones/${id}`,
  )

  return response.data
}

export async function getYardSlots(
  params?: YardListParams,
) {
  const response = await api.get<
    ListResult<YardSlot>
  >('/yard/slots', { params })

  return response.data
}

export async function searchYard(
  params?: YardListParams,
) {
  const response = await api.get<
    PaginatedYardResponse<YardItemPlacement>
  >('/yard/search', { params })

  return response.data
}

export async function getYardMovements(
  params?: YardListParams,
) {
  const response = await api.get<
    PaginatedYardResponse<YardMovement>
  >('/yard/movements', { params })

  return response.data
}

export async function getYardMetrics() {
  const response =
    await api.get<YardMetrics>(
      '/yard/metrics',
    )

  return response.data
}

export async function getCranes() {
  const response =
    await api.get<Crane[]>(
      '/yard/cranes',
    )

  return response.data
}

export async function getYardSnapshots(
  params?: YardListParams,
) {
  const response = await api.get<
    PaginatedYardResponse<YardSnapshot>
  >('/yard/snapshots', { params })

  return response.data
}

export async function placeYardItem(
  payload: Record<string, unknown>,
) {
  const response =
    await api.post<YardItemPlacement>(
      '/yard/placements',
      payload,
    )

  return response.data
}

export async function moveYardItem({
  id,
  payload,
}: {
  id: string
  payload: Record<string, unknown>
}) {
  const response =
    await api.post<YardItemPlacement>(
      `/yard/placements/${id}/move`,
      payload,
    )

  return response.data
}

export async function removeYardItem({
  id,
  payload,
}: {
  id: string
  payload?: Record<string, unknown>
}) {
  const response =
    await api.post<YardItemPlacement>(
      `/yard/placements/${id}/remove`,
      payload ?? {},
    )

  return response.data
}

export async function generateYardSnapshot(
  payload: Record<string, unknown> = {},
) {
  const response =
    await api.post<YardSnapshot>(
      '/yard/snapshots',
      payload,
    )

  return response.data
}
