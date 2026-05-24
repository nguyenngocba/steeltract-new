import {
  useCallback,
} from 'react'
import type {
  Graphics,
} from 'pixi.js'

import type {
  YardRendererLayerProps,
  YardWorldSlot,
} from '../renderer/yard-visualization.types'

function slotFill(slot: YardWorldSlot) {
  if (slot.status === 'BLOCKED') {
    return 0x475569
  }

  if (slot.status === 'RESERVED') {
    return 0x8b5cf6
  }

  if (slot.occupancy >= 0.9) {
    return 0xdc2626
  }

  if (slot.occupancy >= 0.55) {
    return 0xf59e0b
  }

  if (slot.occupancy > 0) {
    return 0x10b981
  }

  return 0x0f172a
}

export function YardSlotLayer({
  visibleSlots,
  selection,
  viewport,
}: YardRendererLayerProps) {
  const draw = useCallback(
    (graphics: Graphics) => {
      graphics.clear()

      for (const slot of visibleSlots) {
        const highlighted =
          slot.id === selection.hoveredSlotId ||
          slot.id === selection.selectedSlotId ||
          slot.code ===
            selection.qrHighlightCode ||
          slot.id ===
            selection.rfidHighlightId

        graphics.setFillStyle({
          color: slotFill(slot),
          alpha: slot.occupancy > 0 ? 0.82 : 0.44,
        })
        graphics.roundRect(
          slot.x,
          slot.y,
          slot.width,
          slot.height,
          2,
        )
        graphics.fill()

        graphics.setStrokeStyle({
          color: highlighted
            ? 0x67e8f9
            : 0x1e293b,
          alpha: highlighted ? 0.95 : 0.75,
          width:
            highlighted || viewport.scale > 1.2
              ? 2
              : 1,
        })
        graphics.roundRect(
          slot.x,
          slot.y,
          slot.width,
          slot.height,
          2,
        )
        graphics.stroke()

        if (slot.stackLevel > 1) {
          const stackHeight = Math.min(
            slot.stackLevel,
            slot.maxStackLevel,
          )

          graphics.setFillStyle({
            color: 0xe2e8f0,
            alpha: 0.22,
          })

          for (
            let index = 1;
            index < stackHeight;
            index += 1
          ) {
            graphics.rect(
              slot.x + index * 2,
              slot.y + index * 2,
              Math.max(
                slot.width - index * 4,
                3,
              ),
              2,
            )
            graphics.fill()
          }
        }
      }
    },
    [selection, viewport.scale, visibleSlots],
  )

  return <pixiGraphics draw={draw} />
}
