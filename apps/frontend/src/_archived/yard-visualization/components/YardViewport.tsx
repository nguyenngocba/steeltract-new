import {
  Application,
  extend,
} from '@pixi/react'
import {
  Container,
  Graphics,
  Text,
} from 'pixi.js'
import clsx from 'clsx'
import {
  useMemo,
} from 'react'

import { CraneLayer } from '../layers/CraneLayer'
import { YardGridLayer } from '../layers/YardGridLayer'
import { YardHeatmapLayer } from '../layers/YardHeatmapLayer'
import { YardMovementLayer } from '../layers/YardMovementLayer'
import { YardSlotLayer } from '../layers/YardSlotLayer'
import {
  useYardPixiViewport,
} from '../hooks/useYardPixiViewport'
import {
  usePerformanceMonitor,
} from '../../../lib/performance'
import {
  defaultYardLayers,
  shouldRenderLayer,
  sortYardLayers,
  YardLayerId,
} from '../renderer/layer-system'
import { SelectionOverlay } from './SelectionOverlay'
import { RealtimeMovementPulse } from './RealtimeMovementPulse'
import { YardMinimap } from './YardMinimap'

import type {
  Crane,
  YardMovement,
} from '../../yard'
import type {
  YardWorldModel,
} from '../renderer/yard-visualization.types'

extend({
  Container,
  Graphics,
  Text,
})

interface YardViewportProps {
  world: YardWorldModel
  cranes?: Crane[]
  movements?: YardMovement[]
  compact?: boolean
  className?: string
}

export function YardViewport({
  world,
  cranes,
  movements,
  compact,
  className,
}: YardViewportProps) {
  const {
    containerRef,
    viewport,
    selection,
    visibleSlots,
    setSelectedSlot,
    updateHoveredSlot,
    handlers,
  } = useYardPixiViewport(world)
  const pixiPerformance =
    usePerformanceMonitor()
  const congestionHotspots = useMemo(
    () =>
      world.congestion
        .map((item) => ({
          ...item,
          percent:
            item.occupancyRate <= 1
              ? item.occupancyRate * 100
              : item.occupancyRate,
        }))
        .filter((item) => item.percent >= 70)
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 4),
    [world.congestion],
  )
  const activeCranes = (cranes ?? []).filter((crane) =>
    ['AVAILABLE', 'ASSIGNED'].includes(crane.status),
  )
  const stackedSlots = visibleSlots.filter(
    (slot) => slot.stackLevel > 1,
  ).length
  const saturatedSlots = visibleSlots.filter(
    (slot) => slot.occupancy >= 0.85,
  ).length

  const layerProps = useMemo(
    () => ({
      world,
      viewport,
      selection,
      visibleSlots,
      onSelectSlot: setSelectedSlot,
      onHoverSlot: updateHoveredSlot,
    }),
    [
      selection,
      setSelectedSlot,
      updateHoveredSlot,
      viewport,
      visibleSlots,
      world,
    ],
  )

  const layers = sortYardLayers(
    defaultYardLayers,
  ).filter((layer) =>
    shouldRenderLayer(layer, layerProps),
  )

  return (
    <div
      ref={containerRef}
      className={clsx(
        'relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950',
        compact ? 'h-[360px]' : 'h-[560px]',
        className,
      )}
      {...handlers}
    >
      <Application
        width={viewport.width}
        height={viewport.height}
        antialias
        autoDensity
        backgroundAlpha={0}
        resolution={
          window.devicePixelRatio || 1
        }
      >
        <pixiContainer
          x={viewport.offsetX}
          y={viewport.offsetY}
          scale={viewport.scale}
          sortableChildren
        >
          {layers.map((layer) => {
            if (layer.id === YardLayerId.Grid) {
              return (
                <pixiContainer
                  key={layer.id}
                  zIndex={layer.zIndex}
                >
                  <YardGridLayer {...layerProps} />
                </pixiContainer>
              )
            }

            if (layer.id === YardLayerId.Heatmap) {
              return (
                <pixiContainer
                  key={layer.id}
                  zIndex={layer.zIndex}
                >
                  <YardHeatmapLayer
                    {...layerProps}
                  />
                </pixiContainer>
              )
            }

            if (layer.id === YardLayerId.Slots) {
              return (
                <pixiContainer
                  key={layer.id}
                  zIndex={layer.zIndex}
                >
                  <YardSlotLayer
                    {...layerProps}
                  />
                </pixiContainer>
              )
            }

            if (
              layer.id === YardLayerId.Movement
            ) {
              return (
                <pixiContainer
                  key={layer.id}
                  zIndex={layer.zIndex}
                >
                  <YardMovementLayer
                    {...layerProps}
                    movements={movements}
                  />
                </pixiContainer>
              )
            }

            if (layer.id === YardLayerId.Crane) {
              return (
                <pixiContainer
                  key={layer.id}
                  zIndex={layer.zIndex}
                >
                  <CraneLayer
                    {...layerProps}
                    cranes={cranes}
                  />
                </pixiContainer>
              )
            }

            return null
          })}
        </pixiContainer>
      </Application>

      <SelectionOverlay
        selection={selection}
        slots={visibleSlots}
        viewport={viewport}
      />
      <RealtimeMovementPulse
        movements={movements}
        slots={world.slots}
        viewport={viewport}
      />
      <YardMinimap
        world={world}
        viewport={viewport}
      />

      <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-xs text-zinc-300 backdrop-blur">
        <span className="font-medium text-white">
          {visibleSlots.length.toLocaleString()}
        </span>{' '}
        visible /{' '}
        {world.slots.length.toLocaleString()} slots
        <span className="ml-2 text-zinc-500">
          {pixiPerformance.fps || 0} fps
        </span>
      </div>

      <div className="pointer-events-none absolute right-4 top-4 z-20 w-64 rounded-lg border border-zinc-800 bg-zinc-950/85 p-3 text-xs text-zinc-300 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-white">
            congestion overlay
          </span>
          <span className="rounded bg-amber-500/15 px-2 py-0.5 text-amber-300">
            {congestionHotspots.length}
          </span>
        </div>
        <div className="mt-2 space-y-2">
          {congestionHotspots.length === 0 ? (
            <div className="rounded border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-zinc-500">
              no hotspots
            </div>
          ) : (
            congestionHotspots.map((item) => (
              <div
                key={`${item.zoneId}-${item.code}`}
                className="rounded border border-amber-500/25 bg-amber-500/10 px-2 py-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-white">
                    {item.code}
                  </span>
                  <span className="text-amber-300">
                    {Math.round(item.percent)}%
                  </span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-zinc-900">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{
                      width: `${Math.min(item.percent, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 z-20 rounded-lg border border-zinc-800 bg-zinc-950/85 px-3 py-2 text-xs text-zinc-300 backdrop-blur">
        <span className="font-medium text-white">
          cranes
        </span>
        <span className="ml-2 text-emerald-300">
          {activeCranes.length} active
        </span>
        <span className="ml-2 text-zinc-500">
          {(movements ?? []).length} moves
        </span>
      </div>

      <div className="pointer-events-none absolute bottom-16 left-4 z-20 rounded-lg border border-cyan-500/25 bg-zinc-950/85 px-3 py-2 text-xs text-zinc-300 shadow-[0_0_24px_rgba(34,211,238,0.08)] backdrop-blur">
        <span className="font-medium text-white">
          telemetry
        </span>
        <span className="ml-2 text-cyan-300">
          stack {stackedSlots}
        </span>
        <span className="ml-2 text-amber-300">
          hot {saturatedSlots}
        </span>
      </div>
    </div>
  )
}
