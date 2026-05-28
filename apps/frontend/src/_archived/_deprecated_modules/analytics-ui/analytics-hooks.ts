import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  invalidateAnalytics,
} from '../../lib/query/invalidation'
import { queryKeys } from '../../lib/query/query-keys'
import {
  generateAnalyticsSnapshot,
  getAnalyticsAlerts,
  getAnalyticsMetrics,
  getAnalyticsOverview,
  getAnalyticsPredictions,
  getAnalyticsSnapshots,
} from './analytics-api'

import type {
  AnalyticsListParams,
} from './analytics.types'

export function useAnalyticsOverviewQuery() {
  return useQuery({
    queryKey:
      queryKeys.analyticsEngine.overview(),
    queryFn: getAnalyticsOverview,
  })
}

export function useAnalyticsSnapshotsQuery(
  params?: AnalyticsListParams,
) {
  return useQuery({
    queryKey:
      queryKeys.analyticsEngine.snapshots(params),
    queryFn: () =>
      getAnalyticsSnapshots(params),
  })
}

export function useAnalyticsMetricsQuery(
  params?: AnalyticsListParams,
) {
  return useQuery({
    queryKey:
      queryKeys.analyticsEngine.metrics(params),
    queryFn: () =>
      getAnalyticsMetrics(params),
  })
}

export function useAnalyticsAlertsQuery(
  params?: AnalyticsListParams,
) {
  return useQuery({
    queryKey:
      queryKeys.analyticsEngine.alerts(params),
    queryFn: () =>
      getAnalyticsAlerts(params),
  })
}

export function useAnalyticsPredictionsQuery(
  params?: AnalyticsListParams,
) {
  return useQuery({
    queryKey:
      queryKeys.analyticsEngine.predictions(params),
    queryFn: () =>
      getAnalyticsPredictions(params),
  })
}

export function useGenerateAnalyticsSnapshotMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generateAnalyticsSnapshot,
    onSuccess: () =>
      invalidateAnalytics(queryClient),
  })
}
