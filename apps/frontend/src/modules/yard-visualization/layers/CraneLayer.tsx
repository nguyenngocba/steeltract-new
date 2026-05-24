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
}: CraneLayerProps) {
  const draw = useCallback(
    (graphics: Graphics) => {
      graphics.clear()

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
      }
    },
    [cranes],
  )

  return <pixiGraphics draw={draw} />
}
