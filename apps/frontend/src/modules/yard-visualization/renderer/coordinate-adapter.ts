import type {
  YardVisualizationSnapshot,
  YardWorldModel,
  YardWorldSlot,
} from './yard-visualization.types'

const fallbackSlotSize = 24

export function adaptSnapshotToWorld(
  snapshot?: YardVisualizationSnapshot,
): YardWorldModel {
  const payloadZones =
    snapshot?.payload?.zones ?? []
  const heatmap = snapshot?.heatmap ?? []

  const zones = payloadZones.map((zone) => ({
    id: zone.id,
    code: zone.code,
    name: zone.name,
    x: zone.originX ?? 0,
    y: zone.originY ?? 0,
    width: zone.width ?? 200,
    height: zone.height ?? 160,
  }))

  const payloadSlots = payloadZones.flatMap(
    (zone) =>
      (zone.slots ?? []).map((slot) => {
        const heat = heatmap.find(
          (item) => item.slotId === slot.id,
        )

        return {
          id: slot.id,
          code: slot.code,
          zoneId: slot.zoneId,
          x: slot.x,
          y: slot.y,
          width:
            (slot.width ?? 1) *
            fallbackSlotSize,
          height:
            (slot.height ?? 1) *
            fallbackSlotSize,
          stackLevel:
            slot.currentStackLevel ?? 0,
          maxStackLevel:
            slot.maxStackLevel ?? 1,
          occupancy:
            heat?.occupancy ??
            ((slot.currentStackLevel ?? 0) /
              Math.max(
                slot.maxStackLevel ?? 1,
                1,
              )),
          status: slot.status ?? 'AVAILABLE',
        }
      }),
  )

  const heatmapSlots: YardWorldSlot[] =
    payloadSlots.length > 0
      ? []
      : heatmap.map((slot) => ({
          id: slot.slotId,
          code: slot.code,
          zoneId: slot.zoneId,
          x: slot.x * fallbackSlotSize,
          y: slot.y * fallbackSlotSize,
          width: fallbackSlotSize,
          height: fallbackSlotSize,
          stackLevel: Math.round(
            slot.occupancy,
          ),
          maxStackLevel: 1,
          occupancy: slot.occupancy,
          status:
            slot.occupancy > 0
              ? 'OCCUPIED'
              : 'AVAILABLE',
        }))

  const slots = [
    ...payloadSlots,
    ...heatmapSlots,
  ]
  const bounds = calculateBounds(slots)

  return {
    snapshotId: snapshot?.id ?? 'pending',
    zones,
    slots,
    congestion: snapshot?.congestion ?? [],
    bounds,
  }
}

function calculateBounds(slots: YardWorldSlot[]) {
  if (slots.length === 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: 1000,
      maxY: 700,
      width: 1000,
      height: 700,
    }
  }

  const minX = Math.min(
    ...slots.map((slot) => slot.x),
  )
  const minY = Math.min(
    ...slots.map((slot) => slot.y),
  )
  const maxX = Math.max(
    ...slots.map(
      (slot) => slot.x + slot.width,
    ),
  )
  const maxY = Math.max(
    ...slots.map(
      (slot) => slot.y + slot.height,
    ),
  )

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
  }
}
