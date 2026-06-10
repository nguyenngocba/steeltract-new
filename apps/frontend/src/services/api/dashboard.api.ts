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

export async function getDashboardCockpit(): Promise<DashboardCockpit> {
  const response = await api.get<DashboardCockpit>('/dashboard/cockpit')

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
