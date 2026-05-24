import {
  useMemo,
} from 'react'

import {
  worldToScreen,
} from '../renderer/viewport-manager'

import type {
  YardMovement,
} from '../../yard-ui'
import type {
  YardViewportState,
  YardWorldSlot,
} from '../renderer/yard-visualization.types'

interface RealtimeMovementPulseProps {
  movements?: YardMovement[]
  slots: YardWorldSlot[]
  viewport: YardViewportState
}

export function RealtimeMovementPulse({
  movements = [],
  slots,
  viewport,
}: RealtimeMovementPulseProps) {
  const pulses = useMemo(() => {
    const byId = new Map(
      slots.map((slot) => [slot.id, slot]),
    )

    return movements
      .slice(0, 8)
      .map((movement) => {
        const slot = movement.toSlotId
          ? byId.get(movement.toSlotId)
          : undefined

        if (!slot) {
          return undefined
        }

        const point = worldToScreen(
          slot.x + slot.width / 2,
          slot.y + slot.height / 2,
          viewport,
        )

        return {
          id: movement.id,
          x: point.x,
          y: point.y,
        }
      })
      .filter(Boolean)
      .filter(
        (
          pulse,
        ): pulse is {
          id: string
          x: number
          y: number
        } => Boolean(pulse),
      )
  }, [movements, slots, viewport])

  return (
    <>
      {pulses.map((pulse) => (
        <span
          key={pulse.id}
          className="pointer-events-none absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300 bg-cyan-300/20 shadow-[0_0_22px_rgba(103,232,249,0.65)]"
          style={{
            left: pulse.x,
            top: pulse.y,
            animation:
              'yard-pulse 1.6s ease-out infinite',
          }}
        />
      ))}
    </>
  )
}
