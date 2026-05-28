import { api } from '../../lib/api'

import type {
  NonConformanceReport,
  PaginatedQcResponse,
  QcChecklist,
  QcInspection,
  QcIssue,
  QcListParams,
  QcMetrics,
  QcResult,
} from './qc.types'

type ListResult<T> =
  | T[]
  | PaginatedQcResponse<T>

export async function getQcChecklists(
  params?: QcListParams,
) {
  const response = await api.get<
    ListResult<QcChecklist>
  >('/qc/checklists', { params })

  return response.data
}

export async function getQcInspections(
  params?: QcListParams,
) {
  const response = await api.get<
    ListResult<QcInspection>
  >('/qc/inspections', { params })

  return response.data
}

export async function getQcInspection(
  id: string,
) {
  const response =
    await api.get<QcInspection>(
      `/qc/inspections/${id}`,
    )

  return response.data
}

export async function getNcrs(
  params?: QcListParams,
) {
  const response = await api.get<
    PaginatedQcResponse<NonConformanceReport>
  >('/qc/ncr', { params })

  return response.data
}

export async function getQcMetrics() {
  const response =
    await api.get<QcMetrics>(
      '/qc/metrics',
    )

  return response.data
}

export async function startQcInspection({
  id,
  payload,
}: {
  id: string
  payload?: Record<string, unknown>
}) {
  const response =
    await api.post<QcInspection>(
      `/qc/inspections/${id}/start`,
      payload ?? {},
    )

  return response.data
}

export async function completeQcInspection({
  id,
  payload,
}: {
  id: string
  payload: Record<string, unknown>
}) {
  const response =
    await api.post<QcInspection>(
      `/qc/inspections/${id}/complete`,
      payload,
    )

  return response.data
}

export async function recordQcResult({
  inspectionId,
  payload,
}: {
  inspectionId: string
  payload: Record<string, unknown>
}) {
  const response =
    await api.post<QcResult>(
      `/qc/inspections/${inspectionId}/results`,
      payload,
    )

  return response.data
}

export async function createQcIssue({
  inspectionId,
  payload,
}: {
  inspectionId: string
  payload: Record<string, unknown>
}) {
  const response =
    await api.post<QcIssue>(
      `/qc/inspections/${inspectionId}/issues`,
      payload,
    )

  return response.data
}

export async function createNcr({
  inspectionId,
  payload,
}: {
  inspectionId: string
  payload: Record<string, unknown>
}) {
  const response =
    await api.post<NonConformanceReport>(
      `/qc/inspections/${inspectionId}/ncr`,
      payload,
    )

  return response.data
}
