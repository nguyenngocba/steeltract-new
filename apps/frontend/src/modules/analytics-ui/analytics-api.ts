import { api } from '../../lib/api'

import type {
  AnalyticsAlert,
  AnalyticsListParams,
  AnalyticsMetric,
  AnalyticsPrediction,
  AnalyticsSnapshot,
  PaginatedAnalyticsResponse,
} from './analytics.types'

export async function getAnalyticsOverview() {
  const response =
    await api.get<AnalyticsSnapshot>(
      '/analytics-engine/overview',
    )

  return response.data
}

export async function generateAnalyticsSnapshot(
  payload: Record<string, unknown> = {},
) {
  const response =
    await api.post<AnalyticsSnapshot>(
      '/analytics-engine/snapshots',
      payload,
    )

  return response.data
}

export async function getAnalyticsSnapshots(
  params?: AnalyticsListParams,
) {
  const response = await api.get<
    PaginatedAnalyticsResponse<AnalyticsSnapshot>
  >('/analytics-engine/snapshots', { params })

  return response.data
}

export async function getAnalyticsMetrics(
  params?: AnalyticsListParams,
) {
  const response = await api.get<
    PaginatedAnalyticsResponse<AnalyticsMetric>
  >('/analytics-engine/metrics', { params })

  return response.data
}

export async function getAnalyticsAlerts(
  params?: AnalyticsListParams,
) {
  const response = await api.get<
    PaginatedAnalyticsResponse<AnalyticsAlert>
  >('/analytics-engine/alerts', { params })

  return response.data
}

export async function getAnalyticsPredictions(
  params?: AnalyticsListParams,
) {
  const response = await api.get<
    AnalyticsPrediction[]
  >('/analytics-engine/predictions', { params })

  return response.data
}
