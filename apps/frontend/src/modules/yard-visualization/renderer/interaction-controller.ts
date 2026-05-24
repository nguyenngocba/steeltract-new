import type {
  YardViewportState,
  YardWorldSlot,
} from './yard-visualization.types'
import {
  clampScale,
  screenToWorld,
} from './viewport-manager'

export function hitTestSlot(
  slots: YardWorldSlot[],
  worldX: number,
  worldY: number,
) {
  return slots.find(
    (slot) =>
      worldX >= slot.x &&
      worldX <= slot.x + slot.width &&
      worldY >= slot.y &&
      worldY <= slot.y + slot.height,
  )
}

export function zoomViewportAtPoint(
  viewport: YardViewportState,
  screenX: number,
  screenY: number,
  deltaY: number,
) {
  const worldPoint = screenToWorld(
    screenX,
    screenY,
    viewport,
  )
  const zoomFactor =
    deltaY > 0 ? 0.88 : 1.12
  const nextScale = clampScale(
    viewport.scale * zoomFactor,
  )

  return {
    ...viewport,
    scale: nextScale,
    offsetX:
      screenX - worldPoint.x * nextScale,
    offsetY:
      screenY - worldPoint.y * nextScale,
  }
}

export function panViewport(
  viewport: YardViewportState,
  movementX: number,
  movementY: number,
) {
  return {
    ...viewport,
    offsetX: viewport.offsetX + movementX,
    offsetY: viewport.offsetY + movementY,
  }
}
