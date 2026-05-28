export type AnalyticsDomain =
  | 'PRODUCTION'
  | 'QC'
  | 'INVENTORY'
  | 'YARD'
  | 'WORKFLOW'
  | 'MACHINE'
  | 'WORKER'
  | 'ERP'

export type AnalyticsAlertSeverity =
  | 'INFO'
  | 'WARNING'
  | 'CRITICAL'

export interface PaginatedAnalyticsResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AnalyticsMetric {
  id?: string
  domain: AnalyticsDomain
  key: string
  label: string
  type?: string
  value: number
  unit?: string | null
  target?: number | null
  threshold?: number | null
  trend?: number | null
  recordedAt?: string
}

export interface AnalyticsAlert {
  id: string
  domain: AnalyticsDomain
  key: string
  title: string
  message: string
  severity: AnalyticsAlertSeverity
  status: string
  threshold?: number | null
  actualValue?: number | null
  createdAt: string
}

export interface AnalyticsPrediction {
  id: string
  domain: AnalyticsDomain
  key: string
  title: string
  prediction: Record<string, unknown>
  confidence?: number | null
  horizon?: string | null
  status: string
  modelName?: string | null
  createdAt: string
}

export interface AnalyticsSnapshot {
  id: string
  domain: AnalyticsDomain
  snapshotType: string
  periodStart?: string | null
  periodEnd?: string | null
  metrics?: AnalyticsMetric[]
  trends?: Array<{
    key: string
    value: number
    trend: number
    direction: string
  }>
  bottlenecks?: Record<string, unknown>
  slaViolations?: Record<string, number>
  anomalies?: AnalyticsAlert[]
  createdAt: string
  metricRecords?: AnalyticsMetric[]
  alerts?: AnalyticsAlert[]
  predictions?: AnalyticsPrediction[]
}

export interface AnalyticsListParams {
  [key: string]: unknown
  domain?: AnalyticsDomain
  snapshotType?: string
  key?: string
  status?: string
  severity?: AnalyticsAlertSeverity
  page?: number
  limit?: number
}
