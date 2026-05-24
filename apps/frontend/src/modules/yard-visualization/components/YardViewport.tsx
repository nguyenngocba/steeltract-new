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
} from '../../yard-ui'
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
    </div>
  )
}
