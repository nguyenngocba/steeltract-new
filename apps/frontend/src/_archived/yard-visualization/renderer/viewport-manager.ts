import type {
  YardViewportState,
  YardWorldModel,
  YardWorldSlot,
} from './yard-visualization.types'

export function createInitialViewport(
  width: number,
  height: number,
  world: YardWorldModel,
): YardViewportState {
  const scale = Math.min(
    width / Math.max(world.bounds.width, 1),
    height / Math.max(world.bounds.height, 1),
    1,
  )

  return {
    scale: Math.max(scale * 0.9, 0.2),
    offsetX: 32 - world.bounds.minX * scale,
    offsetY: 32 - world.bounds.minY * scale,
    width,
    height,
  }
}

export function worldToScreen(
  x: number,
  y: number,
  viewport: YardViewportState,
) {
  return {
    x: x * viewport.scale + viewport.offsetX,
    y: y * viewport.scale + viewport.offsetY,
  }
}

export function screenToWorld(
  x: number,
  y: number,
  viewport: YardViewportState,
) {
  return {
    x: (x - viewport.offsetX) / viewport.scale,
    y: (y - viewport.offsetY) / viewport.scale,
  }
}

export function getVisibleSlots(
  slots: YardWorldSlot[],
  viewport: YardViewportState,
) {
  const padding = 160 / viewport.scale
  const left =
    -viewport.offsetX / viewport.scale -
    padding
  const top =
    -viewport.offsetY / viewport.scale -
    padding
  const right =
    left + viewport.width / viewport.scale +
    padding * 2
  const bottom =
    top + viewport.height / viewport.scale +
    padding * 2

  return slots.filter((slot) => {
    const slotRight = slot.x + slot.width
    const slotBottom = slot.y + slot.height

    return (
      slotRight >= left &&
      slot.x <= right &&
      slotBottom >= top &&
      slot.y <= bottom
    )
  })
}

export function clampScale(scale: number) {
  return Math.min(Math.max(scale, 0.18), 4)
}
