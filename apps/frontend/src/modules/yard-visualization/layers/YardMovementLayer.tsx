import {
  useCallback,
} from 'react'
import type {
  Graphics,
} from 'pixi.js'

import type {
  YardMovement,
} from '../../yard-ui'
import type {
  YardRendererLayerProps,
  YardWorldSlot,
} from '../renderer/yard-visualization.types'

interface YardMovementLayerProps
  extends YardRendererLayerProps {
  movements?: YardMovement[]
}

function center(slot: YardWorldSlot) {
  return {
    x: slot.x + slot.width / 2,
    y: slot.y + slot.height / 2,
  }
}

export function YardMovementLayer({
  movements = [],
  world,
}: YardMovementLayerProps) {
  const draw = useCallback(
    (graphics: Graphics) => {
      graphics.clear()

      const byId = new Map(
        world.slots.map((slot) => [
          slot.id,
          slot,
        ]),
      )

      for (const movement of movements.slice(0, 40)) {
        const from = movement.fromSlotId
          ? byId.get(movement.fromSlotId)
          : undefined
        const to = movement.toSlotId
          ? byId.get(movement.toSlotId)
          : undefined

        if (!from || !to) {
          continue
        }

        const start = center(from)
        const end = center(to)

        graphics.setStrokeStyle({
          color: 0x38bdf8,
          alpha: 0.46,
          width: 2,
        })
        graphics.moveTo(start.x, start.y)
        graphics.lineTo(end.x, end.y)
        graphics.stroke()

        graphics.setFillStyle({
          color: 0x67e8f9,
          alpha: 0.78,
        })
        graphics.circle(end.x, end.y, 4)
        graphics.fill()
      }
    },
    [movements, world.slots],
  )

  return <pixiGraphics draw={draw} />
}
