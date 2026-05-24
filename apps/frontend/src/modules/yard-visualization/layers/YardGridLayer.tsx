import {
  useCallback,
} from 'react'
import type {
  Graphics,
} from 'pixi.js'

import type {
  YardRendererLayerProps,
} from '../renderer/yard-visualization.types'

export function YardGridLayer({
  world,
  viewport,
}: YardRendererLayerProps) {
  const draw = useCallback(
    (graphics: Graphics) => {
      graphics.clear()

      const gridSize = 48
      const left = world.bounds.minX - 200
      const top = world.bounds.minY - 200
      const right = world.bounds.maxX + 200
      const bottom = world.bounds.maxY + 200

      graphics.setStrokeStyle({
        color: 0x334155,
        alpha: viewport.scale > 0.45 ? 0.28 : 0.12,
        width: 1,
      })

      for (
        let x =
          Math.floor(left / gridSize) *
          gridSize;
        x <= right;
        x += gridSize
      ) {
        graphics.moveTo(x, top)
        graphics.lineTo(x, bottom)
      }

      for (
        let y =
          Math.floor(top / gridSize) *
          gridSize;
        y <= bottom;
        y += gridSize
      ) {
        graphics.moveTo(left, y)
        graphics.lineTo(right, y)
      }

      graphics.stroke()

      graphics.setStrokeStyle({
        color: 0x64748b,
        alpha: 0.35,
        width: 2,
      })

      for (const zone of world.zones) {
        graphics.rect(
          zone.x,
          zone.y,
          zone.width,
          zone.height,
        )
      }

      graphics.stroke()
    },
    [viewport.scale, world],
  )

  return <pixiGraphics draw={draw} />
}
