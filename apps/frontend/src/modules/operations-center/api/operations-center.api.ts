import { api } from '@/lib/api'

export type OperationsHealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown'

export type OperationsHealthItem = {
  id: string
  label: string
  status: OperationsHealthStatus
  value: string
  detail?: string
}

export type OperationsAlert = {
  id: string
  severity: 'Critical' | 'Warning' | 'Information'
  title: string
  description: string
  source: string
}

export type OperationsOverview = {
  generatedAt: string
  systemHealth: OperationsHealthItem[]
  runtime: {
    uptimeSeconds: number
    requestCount: number
    averageResponseMs: number
    slowRequestCount: number
    slowQueryCount: number
    memory: {
      heapUsedBytes: number
      heapTotalBytes: number
      rssBytes: number
      peakHeapUsedBytes: number
    }
  }
  performanceScore: Record<string, number>
  architectureScore: Record<string, number>
  apiRanking: {
    byAverage: Array<Record<string, unknown>>
    byP95: Array<Record<string, unknown>>
    byRequestCount: Array<Record<string, unknown>>
  }
  queryRanking: {
    byAverage: Array<Record<string, unknown>>
    byExecutionCount: Array<Record<string, unknown>>
  }
  jobs: {
    counts: Record<string, number>
    recent: Array<Record<string, unknown>>
  }
  snapshots: {
    runtime: Record<string, number>
    modules: Array<{
      id: string
      label: string
      count: number
      updatedAt: string | null
      ageSeconds: number | null
      status: OperationsHealthStatus
    }>
  }
  cache: {
    entries: number
    expired: number
    adapter: string
    hitRate: number
    hits: number
    readModelHits: number
    snapshotHits: number
    snapshotMisses: number
    fallbackQueries: number
  }
  database: {
    sizeBytes: number
    tables: Array<{
      table: string
      rows: number
    }>
  }
  storage: {
    databaseBytes: number
    attachmentBytes: number | null
    storageRoot: string
    filesystem: Record<string, unknown>
  }
  events: {
    counts: Record<string, number>
    recent: Array<Record<string, unknown>>
  }
  alerts: OperationsAlert[]
}

export async function getOperationsOverview() {
  const response = await api.get<OperationsOverview>(
    '/operations-center/overview',
  )

  return response.data
}
