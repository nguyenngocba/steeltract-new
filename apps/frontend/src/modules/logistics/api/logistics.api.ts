import { api } from '@/lib/api'

export type DispatchOrderStatus =
  | 'DRAFT'
  | 'PLANNED'
  | 'LOADING'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'RECEIVED'
  | 'COMPLETED'
  | 'CANCELLED'

export type DispatchItemType = 'MATERIAL' | 'COMPONENT'

export type DispatchItem = {
  id: string
  type: DispatchItemType
  inventoryItemId?: string | null
  componentId?: string | null
  quantity: number
  inventoryItem?: {
    id: string
    code: string
    name: string
    unit?: string | null
  } | null
  component?: {
    id: string
    code: string
    name: string
    status?: string
  } | null
}

export type DispatchEvent = {
  id: string
  type: string
  message?: string | null
  createdBy?: string | null
  createdAt: string
}

export type DispatchOrder = {
  id: string
  code: string
  projectId: string
  projectTaskId?: string | null
  status: DispatchOrderStatus
  plannedAt?: string | null
  departedAt?: string | null
  arrivedAt?: string | null
  receivedAt?: string | null
  vehicle?: string | null
  driver?: string | null
  notes?: string | null
  loadingChecklist?: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  project?: {
    id: string
    code: string
    name: string
  } | null
  projectTask?: {
    id: string
    name: string
  } | null
  items: DispatchItem[]
  events: DispatchEvent[]
}

export type DispatchDashboard = {
  kpis: {
    waiting: number
    inTransit: number
    delivered: number
    completed: number
    movementsToday: number
  }
  statusCounts: Record<string, number>
  trend: Array<{
    date: string
    total: number
    completed: number
  }>
  vehicleUtilization: Array<{
    vehicle: string
    total: number
    active: number
  }>
  recent: DispatchOrder[]
}

export type DispatchSuggestion = {
  projectId: string
  tasks: Array<{
    id: string
    name: string
    plannedStartAt?: string | null
    scheduledStartAt?: string | null
  }>
  items: Array<{
    type: DispatchItemType
    projectTaskId?: string
    projectTaskName?: string
    inventoryItemId?: string
    componentId?: string
    materialCode?: string
    materialName?: string
    componentCode?: string
    componentName?: string
    quantity: number
    unit?: string | null
    reason?: string
  }>
}

export type CreateDispatchOrderPayload = {
  projectId: string
  projectTaskId?: string
  plannedAt?: string
  vehicle?: string
  driver?: string
  notes?: string
  items: Array<{
    type: DispatchItemType
    inventoryItemId?: string
    componentId?: string
    quantity: number
  }>
}

export async function getDispatchDashboard() {
  const response = await api.get<DispatchDashboard>(
    '/logistics/dispatch-dashboard',
  )

  return response.data
}

export async function getDispatchOrders() {
  const response = await api.get<DispatchOrder[]>(
    '/logistics/dispatch-orders',
  )

  return response.data
}

export async function getDispatchOrder(id: string) {
  const response = await api.get<DispatchOrder>(
    `/logistics/dispatch-orders/${id}`,
  )

  return response.data
}

export async function createDispatchOrder(
  payload: CreateDispatchOrderPayload,
) {
  const response = await api.post<DispatchOrder>(
    '/logistics/dispatch-orders',
    payload,
  )

  return response.data
}

export async function suggestDispatchItems(payload: {
  projectId: string
  projectTaskId?: string
}) {
  const response = await api.post<DispatchSuggestion>(
    '/logistics/dispatch-orders/suggest',
    payload,
  )

  return response.data
}

export async function advanceDispatchOrder({
  id,
  action,
  payload = {},
}: {
  id: string
  action: 'loading' | 'depart' | 'arrive' | 'receive' | 'complete' | 'cancel'
  payload?: Record<string, unknown>
}) {
  const response = await api.patch<DispatchOrder>(
    `/logistics/dispatch-orders/${id}/${action}`,
    payload,
  )

  return response.data
}
