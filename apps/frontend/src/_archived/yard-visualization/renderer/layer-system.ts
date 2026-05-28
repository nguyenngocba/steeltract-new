import type {
  YardRendererLayerProps,
} from './yard-visualization.types'

export const YardLayerId = {
  Grid: 'grid',
  Heatmap: 'heatmap',
  Slots: 'slots',
  Movement: 'movement',
  Crane: 'crane',
  Selection: 'selection',
} as const

export type YardLayerId =
  (typeof YardLayerId)[keyof typeof YardLayerId]

export interface YardLayerDefinition {
  id: YardLayerId
  zIndex: number
  visible: boolean
  renderWhenEmpty?: boolean
}

export const defaultYardLayers: YardLayerDefinition[] =
  [
    {
      id: YardLayerId.Grid,
      zIndex: 10,
      visible: true,
      renderWhenEmpty: true,
    },
    {
      id: YardLayerId.Heatmap,
      zIndex: 20,
      visible: true,
    },
    {
      id: YardLayerId.Slots,
      zIndex: 30,
      visible: true,
    },
    {
      id: YardLayerId.Movement,
      zIndex: 40,
      visible: true,
    },
    {
      id: YardLayerId.Crane,
      zIndex: 50,
      visible: true,
    },
    {
      id: YardLayerId.Selection,
      zIndex: 60,
      visible: true,
    },
  ]

export function sortYardLayers(
  layers: YardLayerDefinition[] =
    defaultYardLayers,
) {
  return [...layers].sort(
    (left, right) => left.zIndex - right.zIndex,
  )
}

export function shouldRenderLayer(
  layer: YardLayerDefinition,
  props: YardRendererLayerProps,
) {
  return (
    layer.visible &&
    (layer.renderWhenEmpty ||
      props.world.slots.length > 0)
  )
}
