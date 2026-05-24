import clsx from 'clsx'
import {
  useMemo,
} from 'react'

import {
  EmptyState,
  LoadingState,
  SectionCard,
  StatusBadge,
} from '../../../components/ui-system'
import {
  useCranesQuery,
  useYardMovementsQuery,
  useYardSnapshotsQuery,
} from '../../yard-ui'
import {
  adaptSnapshotToWorld,
} from '../renderer/coordinate-adapter'
import { YardViewport } from './YardViewport'

import type {
  PaginatedYardResponse,
  YardMovement,
  YardSnapshot,
} from '../../yard-ui'
import type {
  YardVisualizationSnapshot,
} from '../renderer/yard-visualization.types'

interface YardPixiCanvasProps {
  snapshot?: YardVisualizationSnapshot
  movements?: YardMovement[]
  compact?: boolean
  className?: string
}

function getFirstSnapshot(
  response:
    | YardSnapshot[]
    | PaginatedYardResponse<YardSnapshot>
    | undefined,
) {
  if (!response) {
    return undefined
  }

  return Array.isArray(response)
    ? response[0]
    : response.data[0]
}

function getMovements(
  response:
    | YardMovement[]
    | PaginatedYardResponse<YardMovement>
    | undefined,
) {
  if (!response) {
    return []
  }

  return Array.isArray(response)
    ? response
    : response.data
}

export function YardPixiCanvas({
  snapshot,
  movements,
  compact,
  className,
}: YardPixiCanvasProps) {
  const snapshotsQuery =
    useYardSnapshotsQuery({
      limit: 1,
      page: 1,
    })
  const movementsQuery =
    useYardMovementsQuery({
      limit: 25,
      page: 1,
    })
  const cranesQuery = useCranesQuery()

  const activeSnapshot =
    snapshot ??
    (getFirstSnapshot(
      snapshotsQuery.data,
    ) as YardVisualizationSnapshot | undefined)
  const activeMovements =
    movements ?? getMovements(movementsQuery.data)

  const world = useMemo(
    () =>
      adaptSnapshotToWorld(activeSnapshot),
    [activeSnapshot],
  )

  const isLoading =
    !snapshot && snapshotsQuery.isLoading

  return (
    <SectionCard
      title="Yard visualization"
      description="PixiJS snapshot renderer for realtime logistics operations."
      className={clsx(
        'overflow-hidden',
        className,
      )}
      actions={
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="info">
            PixiJS
          </StatusBadge>
          <StatusBadge tone="success">
            snapshot-driven
          </StatusBadge>
        </div>
      }
    >
      {isLoading ? (
        <LoadingState label="Loading yard snapshot" />
      ) : null}

      {!isLoading && !activeSnapshot ? (
        <EmptyState
          title="No yard snapshot"
          description="Generate a yard snapshot to render the industrial logistics canvas."
        />
      ) : null}

      {!isLoading && activeSnapshot ? (
        <YardViewport
          world={world}
          cranes={cranesQuery.data}
          movements={activeMovements}
          compact={compact}
        />
      ) : null}

      <style>
        {`
          @keyframes yard-pulse {
            0% { transform: translate(-50%, -50%) scale(0.65); opacity: 0.9; }
            70% { transform: translate(-50%, -50%) scale(2.7); opacity: 0; }
            100% { transform: translate(-50%, -50%) scale(2.7); opacity: 0; }
          }
        `}
      </style>
    </SectionCard>
  )
}
