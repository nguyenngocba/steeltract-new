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
  fromSlot?: { code: string }
  toSlot?: { code: string }
}

const unwrap = <T,>(value: T[] | { data: T[] }) => Array.isArray(value) ? value : value.data

export const yardApi = {
  slots: () => api.get<YardSlotRuntime[] | { data: YardSlotRuntime[] }>('/yard/slots').then((res) => unwrap(res.data)),
  metrics: () => api.get<YardMetrics>('/yard/metrics').then((res) => res.data),
  movements: () => api.get<YardMovement[] | { data: YardMovement[] }>('/yard/movements', { params: { limit: 12 } }).then((res) => unwrap(res.data)),
}
