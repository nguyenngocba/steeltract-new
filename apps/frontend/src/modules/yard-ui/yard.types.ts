export type YardZoneStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'BLOCKED'

export type YardSlotStatus =
  | 'AVAILABLE'
  | 'OCCUPIED'
  | 'RESERVED'
  | 'BLOCKED'

export type YardItemType =
  | 'COMPONENT'
  | 'MATERIAL'
  | 'INVENTORY'
  | 'PRODUCTION'
  | 'OTHER'

export type YardMovementType =
  | 'PLACE'
  | 'MOVE'
  | 'REMOVE'
  | 'ADJUST'

export type CraneStatus =
  | 'AVAILABLE'
  | 'ASSIGNED'
  | 'MAINTENANCE'
  | 'OFFLINE'

export interface PaginatedYardResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface YardZone {
  id: string
  code: string
  name: string
  description?: string | null
  status: YardZoneStatus
  originX: number
  originY: number
  width: number
  height: number
  color: string
  rows?: YardRow[]
  slots?: YardSlot[]
}

export interface YardRow {
  id: string
  zoneId: string
  code: string
  name?: string | null
  index: number
  originX: number
  originY: number
}

export interface YardSlot {
  id: string
  zoneId: string
  rowId?: string | null
  code: string
  status: YardSlotStatus
  x: number
  y: number
  width: number
  height: number
  maxStackLevel: number
  currentStackLevel: number
  zone?: YardZone
  row?: YardRow | null
  placements?: YardItemPlacement[]
}

export interface YardItemPlacement {
  id: string
  slotId: string
  itemType: YardItemType
  itemId: string
  itemCode: string
  itemName?: string | null
  quantity: number
  stackLevel: number
  weight?: number | null
  length?: number | null
  width?: number | null
  height?: number | null
  placedById?: string | null
  placedAt: string
  removedAt?: string | null
  slot?: YardSlot
}

export interface YardMovement {
  id: string
  placementId?: string | null
  type: YardMovementType
  itemType: YardItemType
  itemId: string
  itemCode: string
  fromSlotId?: string | null
  toSlotId?: string | null
  craneId?: string | null
  reason?: string | null
  createdAt: string
  fromSlot?: YardSlot | null
  toSlot?: YardSlot | null
  crane?: Crane | null
}

export interface Crane {
  id: string
  code: string
  name: string
  status: CraneStatus
  currentX: number
  currentY: number
  utilization: number
}

export interface YardSnapshot {
  id: string
  zoneId?: string | null
  name: string
  occupancyRate: number
  totalSlots: number
  occupiedSlots: number
  heatmap?: Array<{
    zoneId: string
    slotId: string
    code: string
    x: number
    y: number
    occupancy: number
  }>
  congestion?: Array<{
    zoneId: string
    code: string
    occupancyRate: number
    status: string
  }>
  createdAt: string
}

export interface YardMetrics {
  zones: number
  totalSlots: number
  occupiedSlots: number
  placements: number
  occupancyRate: number
  cranes: Crane[]
  zoneUtilization: Array<{
    id: string
    code: string
    name: string
    totalSlots: number
    occupiedSlots: number
    occupancyRate: number
  }>
}

export interface YardListParams {
  [key: string]: unknown
  page?: number
  limit?: number
  search?: string
  q?: string
  status?: string
  zoneId?: string
  rowId?: string
  itemType?: YardItemType
  includeRemoved?: boolean
}
