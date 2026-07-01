import { api } from '../../lib/api'

export interface DashboardStats {
  inventoryCount: number
  projectCount: number
  componentCount: number
  transactionCount: number
  lowStockCount: number
}

export interface DashboardTransaction {
  id: string
  code: string
  type: string
  items?: {
    quantity?: number
    inventoryItem?: {
      name?: string
    }
  }[]
}

export interface DashboardLowStockItem {
  id: string
  name: string
  code: string
  quantity: number
  minimumStock: number
}

export interface DashboardActivity {
  id: string
  action: string
  entity: string
  createdAt: string
}

export interface ConstructionProgress {
  progress: number
  total: number
  installed: number
  delivered: number
  stock: number
}

export interface DashboardOverview {
  stats: DashboardStats
  recentTransactions: DashboardTransaction[]
  lowStockItems: DashboardLowStockItem[]
  activities: DashboardActivity[]
  construction: ConstructionProgress | null
}

export interface DashboardCockpit {
  generatedAt: string
  kpis: {
    projects: number
    activeProjects: number
    productionOrders: number
    productionActive: number
    components: number
    completedComponents: number
    componentCompletionRate: number
    logisticsActive: number
    inventoryTotal: number
    inboundTransactions: number
    outboundTransactions: number
    qcOpen: number
    yardActive: number
  }
  productionStatus: Array<{ status: string; count: number }>
  inventoryDistribution: Array<{ label: string; value: number }>
  movementTrend: Array<{ label: string; value: number }>
  projects: Array<{ id: string; code: string; name: string; status: string; progress: number }>
  productionSummary: { active: number; waiting: number; completed: number; delayed: number }
  alerts: Array<{ code: string; title: string; count: number }>
  recentActivities: DashboardActivity[]
  recentNotifications: Array<{
    id: string
    title: string
    message: string
    type?: string | null
    severity?: string | null
    isRead: boolean
    createdAt: string
  }>
}

export interface ExecutiveMaterialForecast {
  inventoryItemId: string
  materialCode: string
  materialName: string
  unit?: string
  categoryName?: string
  currentStock: number
  minimumStock: number
  consumption30d: number
  consumption90d: number
  averageDailyUsage: number
  daysUntilStockout: number | null
  recommendedReorderQty: number
  severity: 'critical' | 'warning' | 'information'
}

export interface ExecutiveProductionRisk {
  productionOrderId: string
  productionOrderNo: string
  title: string
  componentCode: string | null
  componentName: string | null
  plannedEndAt: string | null
  missingMaterials: Array<{
    materialId: string
    materialCode: string
    materialName: string
    unit?: string
    requiredQty: number
    issuedQty: number
    availableQty: number
    shortageQty: number
  }>
  delayRiskDays: number
  severity: 'critical' | 'warning' | 'information'
}

export interface ExecutiveConsumptionTrend {
  materialId: string
  materialCode: string
  materialName: string
  unit?: string
  current30d: number
  previous30d: number
  changeQty: number
  changePercent: number
}

export interface ExecutiveForecastPoint {
  label: string
  day: number
  projectedStock: number
}

export interface ExecutiveRecommendation {
  materialId: string
  materialCode: string
  materialName: string
  unit?: string
  recommendedQty: number
  reason: string
  priority: 'critical' | 'warning' | 'information'
}

export interface ExecutiveActivityItem {
  id: string
  module: 'Inventory' | 'Production' | 'Yard' | 'QC' | 'Purchasing' | 'Projects'
  type: string
  title: string
  description: string
  entityCode: string | null
  occurredAt: string
  relativeTime: string
  severity: 'info' | 'warning' | 'critical'
}

export interface ExecutiveNotificationItem {
  id: string
  priority: 'Critical' | 'Warning' | 'Information'
  module: string
  title: string
  description: string
  entityCode: string | null
  createdAt: string
  actionLabel: string | null
}

export interface ExecutiveHealthModule {
  module: 'Inventory' | 'Production' | 'Yard' | 'QC' | 'Suppliers' | 'Projects'
  label: string
  status: 'normal' | 'warning' | 'critical'
  score: number
  summary: string
  metrics: Record<string, number>
}

export interface ExecutiveHealth {
  title: string
  score: number
  status: 'normal' | 'warning' | 'critical'
  modules: ExecutiveHealthModule[]
  counters: {
    critical: number
    warning: number
    information: number
  }
}

export interface ExecutiveSummaryItem {
  id: string
  priority: 'critical' | 'warning' | 'information'
  module: string
  title: string
  description: string
  value: number
  unit?: string
}

export interface ExecutiveSuggestedAction {
  id: string
  priority: 'critical' | 'warning' | 'information'
  module: string
  actionType: string
  title: string
  description: string
  entityCode: string | null
  suggestedAction: string
}

export interface DashboardExecutiveCockpit {
  generatedAt: string
  health: ExecutiveHealth
  executiveSummary: {
    title: string
    items: ExecutiveSummaryItem[]
  }
  recommendations: {
    title: string
    items: ExecutiveSuggestedAction[]
  }
  trends: {
    materialShortageForecast: ExecutiveMaterialForecast[]
    productionStopRisks: ExecutiveProductionRisk[]
    consumptionTrends: {
      increasing: ExecutiveConsumptionTrend[]
      decreasing: ExecutiveConsumptionTrend[]
      abnormal: ExecutiveConsumptionTrend[]
    }
    inventoryForecast: {
      currentStock: number
      dailyInbound: number
      dailyOutbound: number
      averageDailyNet: number
      averageDailyConsumption: number
      trend: 'UP' | 'STABLE' | 'DOWN_STRONG'
      horizon7d: ExecutiveForecastPoint[]
      horizon30d: ExecutiveForecastPoint[]
      horizon90d: ExecutiveForecastPoint[]
    }
    recommendations: ExecutiveRecommendation[]
  }
  activities: {
    filters: ExecutiveActivityItem['module'][]
    items: ExecutiveActivityItem[]
  }
  notifications: {
    counts: {
      critical: number
      warning: number
      information: number
    }
    items: ExecutiveNotificationItem[]
  }
}

export async function getDashboardCockpit(): Promise<DashboardCockpit> {
  const response = await api.get<DashboardCockpit>('/dashboard/cockpit')

  return response.data
}

export async function getDashboardExecutiveCockpit(): Promise<DashboardExecutiveCockpit> {
  const response = await api.get<DashboardExecutiveCockpit>('/dashboard/executive-cockpit')

  return response.data
}

async function getOptional<T>(
  url: string,
  fallback: T,
) {
  try {
    const response = await api.get<T>(url)

    return response.data
  } catch {
    return fallback
  }
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const [
    statsResponse,
    transactionsResponse,
    lowStockResponse,
  ] = await Promise.all([
    api.get<DashboardStats>('/dashboard/stats'),
    api.get<DashboardTransaction[]>(
      '/dashboard/recent-transactions',
    ),
    api.get<DashboardLowStockItem[]>(
      '/dashboard/low-stock',
    ),
  ])

  const [
    activities,
    construction,
  ] = await Promise.all([
    getOptional<DashboardActivity[]>(
      '/dashboard/activities',
      [],
    ),
    getOptional<ConstructionProgress | null>(
      '/dashboard/construction-progress',
      null,
    ),
  ])

  return {
    stats: statsResponse.data,
    recentTransactions:
      transactionsResponse.data,
    lowStockItems: lowStockResponse.data,
    activities,
    construction,
  }
}
