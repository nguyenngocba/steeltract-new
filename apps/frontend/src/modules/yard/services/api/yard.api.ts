import { api } from '@/lib/api'

export type YardPlacement = {
  id: string
  itemType: string
  itemId: string
  itemCode: string
  itemName?: string
  quantity: number
  stackLevel: number
  weight?: number
}

export type YardZoneRuntime = {
  id: string
  code: string
  name: string
  description?: string
  status: string
  originX?: number
  originY?: number
  width?: number
  height?: number
  color?: string
  slots?: Array<{ id: string; code: string }>
}

export type YardSlotRuntime = {
  id: string
  code: string
  status: string
  currentStackLevel: number
  maxStackLevel: number
  zone: { id: string; code: string; name: string }
  placements: YardPlacement[]
}

export type YardMetrics = {
  zones: number
  totalSlots: number
  occupiedSlots: number
  placements: number
  occupancyRate: number
  zoneUtilization: Array<{ id: string; code: string; name: string; totalSlots: number; occupiedSlots: number; occupancyRate: number }>
  totalWeight?: number
  availableSlots?: number
  movementsToday?: number
  movementCounts?: { place: number; move: number; remove: number; adjust: number }
  movementTodayCounts?: { place: number; move: number; remove: number; adjust: number }
  craneAvailableCount?: number
  componentDistribution?: Array<{ label: string; value: number }>
}

export type YardMovement = {
  id: string
  type: string
  itemCode: string
  createdAt: string
  reason?: string
  fromSlot?: { code: string; zone?: { code: string; name: string } }
  toSlot?: { code: string; zone?: { code: string; name: string } }
}

export type YardCrane = {
  id: string
  code: string
  name: string
  status: string
  utilization?: number
}

export type YardWorkspaceRead = {
  zones: YardZoneRuntime[]
  slots: YardSlotRuntime[]
  movements: YardMovement[]
  cranes: YardCrane[]
  qcQueue: Array<{ id: string; itemCode: string; status: string; inspectionId: string }>
  meta: {
    slots: { page: number; limit: number; total: number; totalPages: number }
    movements: { page: number; limit: number; total: number; totalPages: number }
    zones: { total: number; returned: number }
  }
  summary: {
    zones: number
    totalSlots: number
    occupiedSlots: number
    availableSlots: number
    placements: number
    totalWeight: number
    movementsToday: number
    overloadedZones: number
  }
  analytics: {
    movementCounts: { place: number; move: number; remove: number; adjust: number }
    movementMonth: number
    movementTodayCounts: { place: number; move: number; remove: number; adjust: number }
    craneAvailableCount: number
    componentDistribution: Array<{ label: string; value: number }>
    movementTrend: Array<{ date: string; count: number }>
    zoneUtilization: YardMetrics['zoneUtilization']
    warningZoneCount: number
  }
}

export type YardDashboardRead = {
  data: {
    scopeKey: string
    snapshotDate: string
    totalZones: number
    totalSlots: number
    occupiedSlots: number
    availableSlots: number
    activePlacementCount: number
    totalWeight: number
    movementToday: number
    movementMonth: number
    overloadedZoneCount: number
    craneCount: number
    availableCraneCount: number
    payload?: {
      movementCounts?: YardMetrics['movementCounts'] | Array<{ type: string; count: number }>
      zoneUtilization?: YardMetrics['zoneUtilization']
    } | null
  }
  source: 'snapshot' | 'runtime'
  meta: {
    ageSeconds: number
    confidence: number
    isStale: boolean
    snapshotType: string
    fallbackReason?: 'disabled' | 'missing' | 'stale' | 'mismatch'
  }
}

export type YardPlacePayload = {
  slotId: string
  itemType: 'COMPONENT'
  itemId: string
  itemCode: string
  itemName?: string
  quantity: number
  stackLevel?: number
  weight?: number
  craneId?: string
  reason?: string
}

export type YardMovePayload = {
  id: string
  toSlotId: string
  craneId?: string
  reason?: string
}

export type YardRemovePayload = {
  id: string
  craneId?: string
  reason?: string
}

export type YardUpdateZonePayload = {
  id: string
  code?: string
  name?: string
}

export type YardCreateZonePayload = {
  code: string
  name: string
  description?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
  originX?: number
  originY?: number
  width?: number
  height?: number
  color?: string
}

export type YardCreateSlotPayload = {
  zoneId: string
  code: string
  status?: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'BLOCKED'
  x: number
  y: number
  width?: number
  height?: number
  maxStackLevel?: number
}

const unwrap = <T,>(value: T[] | { data: T[] }) => Array.isArray(value) ? value : value.data

export const yardApi = {
  workspace: (params?: Record<string, unknown>) => api.get<YardWorkspaceRead>('/yard/read-model/workspace', { params }).then((res) => res.data),
  dashboard: () => api.get<YardDashboardRead>('/yard/dashboard').then((res) => res.data),
  zones: () => api.get<YardZoneRuntime[] | { data: YardZoneRuntime[] }>('/yard/zones').then((res) => unwrap(res.data)),
  slots: () => api.get<YardSlotRuntime[] | { data: YardSlotRuntime[] }>('/yard/slots').then((res) => unwrap(res.data)),
  metrics: () => api.get<YardMetrics>('/yard/metrics').then((res) => res.data),
  movements: () => api.get<YardMovement[] | { data: YardMovement[] }>('/yard/movements', { params: { limit: 12 } }).then((res) => unwrap(res.data)),
  cranes: () => api.get<YardCrane[]>('/yard/cranes').then((res) => res.data),
  place: (payload: YardPlacePayload) => api.post<YardPlacement>('/yard/placements', payload).then((res) => res.data),
  move: ({ id, ...payload }: YardMovePayload) => api.post<YardPlacement>(`/yard/placements/${id}/move`, payload).then((res) => res.data),
  remove: ({ id, ...payload }: YardRemovePayload) => api.post<YardPlacement>(`/yard/placements/${id}/remove`, payload).then((res) => res.data),
  createZone: (payload: YardCreateZonePayload) => api.post<YardZoneRuntime>('/yard/zones', payload).then((res) => res.data),
  createSlot: ({ zoneId, ...payload }: YardCreateSlotPayload) => api.post<YardSlotRuntime>(`/yard/zones/${zoneId}/slots`, payload).then((res) => res.data),
  updateZone: ({ id, ...payload }: YardUpdateZonePayload) => api.patch(`/yard/zones/${id}`, payload).then((res) => res.data),
  deleteZone: (id: string) => api.delete(`/yard/zones/${id}`).then((res) => res.data),
}
