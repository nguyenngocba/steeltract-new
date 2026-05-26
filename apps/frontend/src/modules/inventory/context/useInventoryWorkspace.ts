import {
  useMemo,
} from 'react'

import {
  useOperationalWorkspaceState,
  useWorkspaceTelemetryEvents,
} from '../../operations'
import {
  useCreateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useInventoryQuery,
  useUpdateInventoryItemMutation,
} from '../../../hooks/query/useInventoryQueries'
import {
  useYardMovementsQuery,
  useYardMetricsQuery,
  useYardSlotsQuery,
  useYardZonesQuery,
} from '../../yard-ui'

import type {
  PaginatedYardResponse,
} from '../../yard-ui/yard.types'
import type {
  InventoryItem,
} from '../../../services/api/types'

export interface OperationalInventoryItem
  extends InventoryItem {
  minimumStock?: number
  unit?: string
  description?: string
  zone?: {
    id?: string
    code?: string
    name?: string
  } | null
  reservedQuantity?: number
  allocatedQuantity?: number
}

function asList<T>(
  value:
    | T[]
    | {
        data: T[]
      }
    | PaginatedYardResponse<T>
    | undefined,
) {
  if (!value) {
    return []
  }

  return Array.isArray(value) ? value : value.data
}

export function stockTone(item: OperationalInventoryItem) {
  const quantity = Number(item.quantity ?? 0)
  const minimum = Number(item.minimumStock ?? 0)

  if (quantity <= 0) {
    return 'danger' as const
  }

  if (minimum > 0 && quantity <= minimum) {
    return 'warning' as const
  }

  return 'success' as const
}

export function useInventoryWorkspace() {
  const workspace = useOperationalWorkspaceState<OperationalInventoryItem>({
    workspaceId: 'inventory-control',
    selectionKey: (item) => item.id,
  })
  const workspaceEvents = useWorkspaceTelemetryEvents(
    'inventory-control',
    {
      domains: ['inventory', 'yard', 'component'],
      entityIds: workspace.selectedEntity
        ? [workspace.selectedEntity.id]
        : undefined,
    },
  )
  const inventoryQuery = useInventoryQuery()
  const movementsQuery = useYardMovementsQuery({
    page: 1,
    limit: 20,
  })
  const yardMetricsQuery = useYardMetricsQuery()
  const yardZonesQuery = useYardZonesQuery({
    page: 1,
    limit: 12,
  })
  const yardSlotsQuery = useYardSlotsQuery({
    page: 1,
    limit: 160,
  })
  const createInventoryItemMutation =
    useCreateInventoryItemMutation()
  const updateInventoryItemMutation =
    useUpdateInventoryItemMutation()
  const deleteInventoryItemMutation =
    useDeleteInventoryItemMutation()

  const items = useMemo(
    () =>
      (inventoryQuery.data ?? []) as OperationalInventoryItem[],
    [inventoryQuery.data],
  )
  const movements = asList(movementsQuery.data)
  const yardZones = asList(yardZonesQuery.data)
  const yardSlots = asList(yardSlotsQuery.data)
  const filteredItems = useMemo(
    () =>
      items.filter((item) =>
        `${item.name} ${item.code} ${item.category?.name ?? ''}`
          .toLowerCase()
          .includes(workspace.filters.search.toLowerCase()),
      ),
    [items, workspace.filters.search],
  )
  const lowStock = items.filter(
    (item) => stockTone(item) === 'warning',
  )
  const criticalStock = items.filter(
    (item) => stockTone(item) === 'danger',
  )
  const reservedCount = items.filter(
    (item) => Number(item.reservedQuantity ?? 0) > 0,
  ).length
  const allocatedCount = items.filter(
    (item) => Number(item.allocatedQuantity ?? 0) > 0,
  ).length
  const inboundMovements = movements.filter(
    (movement) => movement.type === 'PLACE',
  )
  const outboundMovements = movements.filter((movement) =>
    ['MOVE', 'REMOVE'].includes(movement.type),
  )

  return {
    ...workspace,
    inventoryQuery,
    movementsQuery,
    yardMetricsQuery,
    yardZonesQuery,
    yardSlotsQuery,
    createInventoryItemMutation,
    updateInventoryItemMutation,
    deleteInventoryItemMutation,
    items,
    filteredItems,
    movements,
    yardZones,
    yardSlots,
    lowStock,
    criticalStock,
    reservedCount,
    allocatedCount,
    inboundMovements,
    outboundMovements,
    workspaceEvents,
  }
}
