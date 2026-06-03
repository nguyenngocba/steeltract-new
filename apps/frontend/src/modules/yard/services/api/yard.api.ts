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

export type YardZonePayload = {
  id: string
  code?: string
  name?: string
}

const unwrap = <T,>(value: T[] | { data: T[] }) => Array.isArray(value) ? value : value.data

export const yardApi = {
  slots: () => api.get<YardSlotRuntime[] | { data: YardSlotRuntime[] }>('/yard/slots').then((res) => unwrap(res.data)),
  metrics: () => api.get<YardMetrics>('/yard/metrics').then((res) => res.data),
  movements: () => api.get<YardMovement[] | { data: YardMovement[] }>('/yard/movements', { params: { limit: 12 } }).then((res) => unwrap(res.data)),
  cranes: () => api.get<YardCrane[]>('/yard/cranes').then((res) => res.data),
  place: (payload: YardPlacePayload) => api.post<YardPlacement>('/yard/placements', payload).then((res) => res.data),
  move: ({ id, ...payload }: YardMovePayload) => api.post<YardPlacement>(`/yard/placements/${id}/move`, payload).then((res) => res.data),
  remove: ({ id, ...payload }: YardRemovePayload) => api.post<YardPlacement>(`/yard/placements/${id}/remove`, payload).then((res) => res.data),
  updateZone: ({ id, ...payload }: YardZonePayload) => api.patch(`/yard/zones/${id}`, payload).then((res) => res.data),
  deleteZone: (id: string) => api.delete(`/yard/zones/${id}`).then((res) => res.data),
}
