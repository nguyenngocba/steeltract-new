import {
  useMemo,
} from 'react'

import type {
  YardViewportState,
  YardWorldModel,
} from '../renderer/yard-visualization.types'

interface YardMinimapProps {
  world: YardWorldModel
  viewport: YardViewportState
}

export function YardMinimap({
  world,
  viewport,
}: YardMinimapProps) {
  const metrics = useMemo(() => {
    const width = 160
    const height = 92
    const scale = Math.min(
      width / Math.max(world.bounds.width, 1),
      height / Math.max(world.bounds.height, 1),
    )

    return {
      width,
      height,
      scale,
      left:
        (-viewport.offsetX /
          viewport.scale -
          world.bounds.minX) *
        scale,
      top:
        (-viewport.offsetY /
          viewport.scale -
          world.bounds.minY) *
        scale,
      viewWidth:
        (viewport.width / viewport.scale) *
        scale,
      viewHeight:
        (viewport.height / viewport.scale) *
        scale,
    }
  }, [viewport, world.bounds])

  return (
    <div
      className="pointer-events-none absolute bottom-4 right-4 z-20 rounded-lg border border-zinc-700 bg-zinc-950/85 p-2 shadow-lg backdrop-blur"
      style={{
        width: metrics.width + 18,
      }}
    >
      <div
        className="relative overflow-hidden rounded bg-zinc-900"
        style={{
          width: metrics.width,
          height: metrics.height,
        }}
      >
        {world.slots.slice(0, 1200).map((slot) => (
          <span
            key={slot.id}
            className={
              slot.occupancy > 0
                ? 'absolute bg-emerald-400/70'
                : 'absolute bg-zinc-700/70'
            }
            style={{
              left:
                (slot.x - world.bounds.minX) *
                metrics.scale,
              top:
                (slot.y - world.bounds.minY) *
                metrics.scale,
              width: Math.max(
                slot.width * metrics.scale,
                1,
              ),
              height: Math.max(
                slot.height * metrics.scale,
                1,
              ),
            }}
          />
        ))}
        <span
          className="absolute border border-cyan-300/80 bg-cyan-300/10"
          style={{
            left: metrics.left,
            top: metrics.top,
            width: metrics.viewWidth,
            height: metrics.viewHeight,
          }}
        />
      </div>
    </div>
  )
}
