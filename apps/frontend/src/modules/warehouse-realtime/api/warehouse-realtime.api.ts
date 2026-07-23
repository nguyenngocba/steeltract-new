import { api } from '@/lib/api'

export type WarehouseRealtimeOverview = {
  summary?: {
    totalItems?: number
    totalStock?: number
    totalValue?: number
    lowStock?: number
    outOfStock?: number
    mainStock?: number
    productionStock?: number
    primaryStock?: number
    secondaryStock?: number
    consumableStock?: number
  }
  facets?: {
    warehouses?: Array<{
      id?: string
      code?: string
      name?: string
      count?: number
      totalStock?: number
      totalValue?: number
    }>
    categories?: Array<{
      id?: string
      name?: string
      count?: number
      totalStock?: number
      totalValue?: number
    }>
  }
  today?: {
    inboundCount?: number
    outboundCount?: number
    transferCount?: number
    adjustmentCount?: number
    inboundValue?: number
    outboundValue?: number
  }
  month?: {
    inboundCount?: number
    outboundCount?: number
    transferCount?: number
    adjustmentCount?: number
  }
  movementTrend?: Array<{
    date?: string
    inboundValue?: number
    outboundValue?: number
  }>
  stockTrend?: Array<{
    date?: string
    totalStock?: number
    totalValue?: number
  }>
}

export type WarehouseRealtimeMaterial = {
  id?: string
  code?: string
  name?: string
  materialTypeName?: string
  categoryName?: string
  warehouseCode?: string
  currentStock?: number
  quantity?: number
  availableQuantity?: number
  reservedQuantity?: number
  minimumStock?: number
  inventoryValue?: number
  stockStatus?: string
  updatedAt?: string
}

export type WarehouseRealtimeMaterialsResponse = {
  items?: WarehouseRealtimeMaterial[]
  total?: number
  page?: number
  pageSize?: number
  totalPages?: number
}

export type WarehouseRealtimeTransaction = {
  id?: string
  transactionNo?: string
  type?: string
  direction?: string
  status?: string
  transactionDate?: string
  createdAt?: string
  materialCode?: string
  materialName?: string
  warehouseCode?: string
  totalQuantity?: number
  totalValue?: number
  items?: Array<{
    materialCode?: string
    materialName?: string
    quantity?: number
    warehouseCode?: string
    totalValue?: number
  }>
}

export type WarehouseRealtimeTransactionsResponse = {
  items?: WarehouseRealtimeTransaction[]
  data?: WarehouseRealtimeTransaction[]
  total?: number
}

export async function getWarehouseRealtimeOverview(signal?: AbortSignal) {
  const response = await api.get<WarehouseRealtimeOverview>(
    '/inventory/overview',
    { signal },
  )

  return response.data
}

export async function getWarehouseRealtimeMaterials(signal?: AbortSignal) {
  const response = await api.get<WarehouseRealtimeMaterialsResponse>(
    '/inventory/materials',
    {
      params: {
        page: 1,
        pageSize: 12,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      },
      signal,
    },
  )

  return response.data
}

export async function getWarehouseRealtimeTransactions(signal?: AbortSignal) {
  const response = await api.get<WarehouseRealtimeTransactionsResponse>(
    '/inventory/transactions',
    {
      params: {
        page: 1,
        pageSize: 12,
      },
      signal,
    },
  )

  return response.data
}
