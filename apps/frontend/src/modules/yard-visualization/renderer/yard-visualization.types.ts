import type {
  YardSnapshot,
} from '../../yard-ui'

export interface YardWorldSlot {
  id: string
  code: string
  zoneId: string
  x: number
  y: number
  width: number
  height: number
  stackLevel: number
  maxStackLevel: number
  occupancy: number
  status: string
}

export interface YardWorldZone {
  id: string
  code: string
  name: string
  x: number
  y: number
  width: number
  height: number
}

export interface YardWorldModel {
  snapshotId: string
  zones: YardWorldZone[]
  slots: YardWorldSlot[]
  congestion: NonNullable<
    YardSnapshot['congestion']
  >
  bounds: {
    minX: number
    minY: number
    maxX: number
    maxY: number
    width: number
    height: number
  }
}

export interface YardViewportState {
  scale: number
  offsetX: number
  offsetY: number
  width: number
  height: number
}

export interface YardSelectionState {
  selectedSlotId?: string
  hoveredSlotId?: string
  qrHighlightCode?: string
  rfidHighlightId?: string
}

export interface YardRendererLayerProps {
  world: YardWorldModel
  viewport: YardViewportState
  selection: YardSelectionState
  visibleSlots: YardWorldSlot[]
  onSelectSlot?: (slot: YardWorldSlot) => void
  onHoverSlot?: (slot?: YardWorldSlot) => void
}

export interface YardVisualizationSnapshot
  extends YardSnapshot {
  payload?: {
    zones?: Array<{
      id: string
      code: string
      name: string
      originX?: number
      originY?: number
      width?: number
      height?: number
      slots?: Array<{
        id: string
        code: string
        zoneId: string
        x: number
        y: number
        width?: number
        height?: number
        currentStackLevel?: number
        maxStackLevel?: number
        status?: string
      }>
    }>
  }
}
