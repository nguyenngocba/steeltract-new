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
      className="pointer-events-none absolute bottom-4 right-4 z-20 rounded-lg border border-cyan-500/25 bg-zinc-950/90 p-2 shadow-[0_0_26px_rgba(34,211,238,0.08)] backdrop-blur"
      style={{
        width: metrics.width + 18,
      }}
    >
      <div className="mb-1 flex items-center justify-between px-0.5 text-[10px] uppercase tracking-wide text-zinc-500">
        <span>yard twin</span>
        <span>{world.slots.length} slots</span>
      </div>
      <div
        className="relative overflow-hidden rounded border border-zinc-800 bg-[radial-gradient(circle_at_center,rgba(8,145,178,0.16),rgba(24,24,27,0.95))]"
        style={{
          width: metrics.width,
          height: metrics.height,
        }}
      >
        {world.slots.slice(0, 1200).map((slot) => (
          <span
            key={slot.id}
            className={
              slot.occupancy >= 0.85
                ? 'absolute bg-red-400/80 shadow-[0_0_4px_rgba(248,113,113,0.8)]'
                : slot.occupancy >= 0.55
                  ? 'absolute bg-amber-400/75'
                  : slot.occupancy > 0
                    ? 'absolute bg-emerald-400/70'
                    : 'absolute bg-zinc-700/60'
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
