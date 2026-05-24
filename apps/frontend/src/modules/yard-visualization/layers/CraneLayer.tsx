import {
  useCallback,
} from 'react'
import type {
  Graphics,
} from 'pixi.js'

import type {
  Crane,
} from '../../yard-ui'
import type {
  YardRendererLayerProps,
} from '../renderer/yard-visualization.types'

interface CraneLayerProps
  extends YardRendererLayerProps {
  cranes?: Crane[]
}

function craneColor(status: Crane['status']) {
  if (status === 'OFFLINE') {
    return 0x64748b
  }

  if (status === 'MAINTENANCE') {
    return 0xf97316
  }

  if (status === 'ASSIGNED') {
    return 0x38bdf8
  }

  return 0x22c55e
}

export function CraneLayer({
  cranes = [],
  visibleSlots,
}: CraneLayerProps) {
  const draw = useCallback(
    (graphics: Graphics) => {
      graphics.clear()
      const congestedSlots = visibleSlots
        .filter((slot) => slot.occupancy >= 0.75)
        .slice(0, 8)

      for (const crane of cranes) {
        graphics.setFillStyle({
          color: craneColor(crane.status),
          alpha: 0.9,
        })
        graphics.circle(
          crane.currentX,
          crane.currentY,
          8,
        )
        graphics.fill()

        graphics.setStrokeStyle({
          color: 0xe2e8f0,
          alpha: 0.52,
          width: 2,
        })
        graphics.circle(
          crane.currentX,
          crane.currentY,
          14,
        )
        graphics.stroke()

        if (
          crane.status === 'ASSIGNED' &&
          congestedSlots.length > 0
        ) {
          const nearest =
            congestedSlots.reduce(
              (closest, slot) => {
                const distance =
                  Math.abs(slot.x - crane.currentX) +
                  Math.abs(slot.y - crane.currentY)

                return distance <
                  closest.distance
                  ? { slot, distance }
                  : closest
              },
              {
                slot: congestedSlots[0],
                distance: Number.POSITIVE_INFINITY,
              },
            ).slot

          graphics.setStrokeStyle({
            color: 0x22d3ee,
            alpha: 0.28,
            width: 1,
          })
          graphics.moveTo(
            crane.currentX,
            crane.currentY,
          )
          graphics.lineTo(
            nearest.x + nearest.width / 2,
            nearest.y + nearest.height / 2,
          )
          graphics.stroke()
        }
      }
    },
    [cranes, visibleSlots],
  )

  return <pixiGraphics draw={draw} />
}
