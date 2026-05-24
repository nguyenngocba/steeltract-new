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
