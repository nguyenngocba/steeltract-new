import { api } from '@/lib/api'

export type HistoricalModule =
  | 'ERP'
  | 'INVENTORY'
  | 'COMPONENTS'
  | 'PRODUCTION'
  | 'PROJECTS'
  | 'SUPPLIERS'
  | 'QC'
  | 'DISPATCH'
  | 'LOGISTICS'
  | 'YARD'

export type SnapshotJobStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'

export type HistoricalJson = Record<string, unknown>

export type HistoricalDashboardSnapshot = {
  id: string
  snapshotDate: string
  module: HistoricalModule
  scopeKey: string
  scopeType?: string
  granularity?: string
  source?: string
  authoritative: boolean
  stale?: boolean
  kpis: HistoricalJson
  charts: HistoricalJson
  tables: HistoricalJson
  warnings: unknown[]
  metadata: HistoricalJson
  sourceWatermark?: string | null
  sourceMinAt?: string | null
  sourceMaxAt?: string | null
  rowCount: number
  warningCount: number
  generatedAt: string
}

export type HistoricalDashboardMonthlyRollup = {
  id: string
  monthStart: string
  module: HistoricalModule
  scopeKey: string
  kpiOpen: HistoricalJson
  kpiClose: HistoricalJson
  kpiMin: HistoricalJson
  kpiMax: HistoricalJson
  kpiAvg: HistoricalJson
  charts: HistoricalJson
  warnings: unknown[]
  daysCovered: number
  authoritative: boolean
  sourceWatermark?: string | null
  generatedAt: string
}

export type HistoricalInventorySnapshot = {
  id: string
  snapshotDate: string
  materialId: string
  materialCode: string
  materialName: string
  materialTypeName?: string | null
  categoryName?: string | null
  warehouseId?: string | null
  warehouseCode?: string | null
  zoneCode?: string | null
  slotId?: string | null
  level?: string | null
  unit?: string | null
  quantityOnHand: string
  availableQuantity: string
  reservedQuantity: string
  minimumStock: string
  inventoryValue: string
  stockStatus: string
  locationBucketKey: string
  metadata: HistoricalJson
  generatedAt: string
}

export type HistoricalInventoryMonthlyRollup = {
  id: string
  monthStart: string
  materialId: string
  materialCode: string
  materialName: string
  materialTypeName?: string | null
  categoryName?: string | null
  warehouseId?: string | null
  warehouseCode?: string | null
  warehouseKey: string
  openingQuantity: string
  closingQuantity: string
  minQuantity: string
  maxQuantity: string
  avgQuantity: string
  openingValue: string
  closingValue: string
  minValue: string
  maxValue: string
  avgValue: string
  lowStockDays: number
  outStockDays: number
  negativeStockDays: number
  daysCovered: number
  generatedAt: string
}

export type HistoricalSnapshotJob = {
  id: string
  jobType: string
  module?: HistoricalModule | null
  scopeKey: string
  snapshotDate?: string | null
  fromDate?: string | null
  toDate?: string | null
  status: SnapshotJobStatus
  priority: number
  attempt: number
  maxAttempts: number
  rowsRead: string
  rowsWritten: string
  sourceWatermarkStart?: string | null
  sourceWatermarkEnd?: string | null
  errorMessage?: string | null
  createdAt: string
  updatedAt: string
  startedAt?: string | null
  completedAt?: string | null
  failedAt?: string | null
}

export type HistoricalPaginated<T> = {
  data: T[]
  meta: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export type DashboardSnapshotParams = {
  date: string
  module?: HistoricalModule
  warehouse?: string
  authoritative?: boolean
}

export type LatestDashboardSnapshotParams = {
  module?: HistoricalModule
  warehouse?: string
}

export type MonthlyParams = {
  from?: string
  to?: string
  module?: HistoricalModule
  warehouse?: string
  authoritative?: boolean
  page?: number
  pageSize?: number
}

export type InventoryParams = {
  date: string
  warehouse?: string
  authoritative?: boolean
  page?: number
  pageSize?: number
}

export type InventoryMonthlyParams = {
  from?: string
  to?: string
  warehouse?: string
  authoritative?: boolean
  page?: number
  pageSize?: number
}

export type JobsParams = {
  status?: SnapshotJobStatus
  module?: HistoricalModule
  date?: string
  page?: number
  pageSize?: number
}

export async function getHistoricalDashboardSnapshot(
  params: DashboardSnapshotParams,
) {
  const response = await api.get<HistoricalDashboardSnapshot>(
    '/history/dashboard',
    { params: cleanParams(params) },
  )

  return response.data
}

export async function getLatestHistoricalDashboardSnapshot(
  params: LatestDashboardSnapshotParams,
) {
  const response = await api.get<HistoricalDashboardSnapshot>(
    '/history/dashboard/latest',
    { params: cleanParams(params) },
  )

  return response.data
}

export async function getHistoricalDashboardMonthly(params: MonthlyParams) {
  const response = await api.get<
    HistoricalPaginated<HistoricalDashboardMonthlyRollup>
  >('/history/dashboard/monthly', { params: cleanParams(params) })

  return response.data
}

export async function getHistoricalInventory(params: InventoryParams) {
  const response = await api.get<
    HistoricalPaginated<HistoricalInventorySnapshot>
  >('/history/inventory', { params: cleanParams(params) })

  return response.data
}

export async function getHistoricalInventoryMonthly(
  params: InventoryMonthlyParams,
) {
  const response = await api.get<
    HistoricalPaginated<HistoricalInventoryMonthlyRollup>
  >('/history/inventory/monthly', { params: cleanParams(params) })

  return response.data
}

export async function getHistoricalSnapshotJobs(params: JobsParams) {
  const response = await api.get<HistoricalPaginated<HistoricalSnapshotJob>>(
    '/history/jobs',
    { params: cleanParams(params) },
  )

  return response.data
}

function cleanParams<T extends Record<string, unknown>>(params: T) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      if (value === undefined || value === null) return false
      if (typeof value === 'string' && value.trim() === '') return false
      return true
    }),
  )
}
