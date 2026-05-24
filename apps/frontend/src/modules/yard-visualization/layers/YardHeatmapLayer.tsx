import {
  useCallback,
} from 'react'
import type {
  Graphics,
} from 'pixi.js'

import type {
  YardRendererLayerProps,
} from '../renderer/yard-visualization.types'

function heatColor(occupancy: number) {
  if (occupancy >= 0.9) {
    return 0xef4444
  }

  if (occupancy >= 0.7) {
    return 0xf97316
  }

  if (occupancy >= 0.45) {
    return 0xfacc15
  }

  return 0x22c55e
}

export function YardHeatmapLayer({
  visibleSlots,
}: YardRendererLayerProps) {
  const draw = useCallback(
    (graphics: Graphics) => {
      graphics.clear()

      for (const slot of visibleSlots) {
        if (slot.occupancy <= 0) {
          continue
        }

        graphics.setFillStyle({
          color: heatColor(slot.occupancy),
          alpha: Math.min(
            0.12 + slot.occupancy * 0.34,
            0.46,
          ),
        })
        graphics.rect(
          slot.x - 2,
          slot.y - 2,
          slot.width + 4,
          slot.height + 4,
        )
        graphics.fill()

        if (slot.occupancy >= 0.75) {
          graphics.setStrokeStyle({
            color: 0xf97316,
            width: 1.5,
            alpha: 0.65,
          })
          graphics.rect(
            slot.x - 4,
            slot.y - 4,
            slot.width + 8,
            slot.height + 8,
          )
          graphics.stroke()
        }
      }
    },
    [visibleSlots],
  )

  return <pixiGraphics draw={draw} />
}
