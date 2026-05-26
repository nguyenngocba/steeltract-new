import {
  useMemo,
} from 'react'

import {
  useOperationalWorkspaceState,
  useWorkspaceTelemetryEvents,
} from '../../operations'
import {
  useMachinesQuery,
  useProductionMetricsQuery,
  useProductionOrdersQuery,
  useWorkCentersQuery,
} from '../../production-ui'

import type {
  PaginatedProductionResponse,
  ProductionOrder,
} from '../../production-ui/production.types'

function asProductionList(
  value:
    | ProductionOrder[]
    | PaginatedProductionResponse<ProductionOrder>
    | undefined,
) {
  if (!value) {
    return []
  }

  return Array.isArray(value) ? value : value.data
}

export function useProductionWorkspace() {
  const workspace =
    useOperationalWorkspaceState<ProductionOrder>({
      workspaceId: 'production-operations',
      selectionKey: (order) => order.id,
    })
  const workspaceEvents = useWorkspaceTelemetryEvents(
    'production-operations',
    {
      domains: [
        'production',
        'machine',
        'qc',
        'workflow',
      ],
      entityIds: workspace.selectedEntity
        ? [workspace.selectedEntity.id]
        : undefined,
    },
  )
  const metricsQuery = useProductionMetricsQuery()
  const ordersQuery = useProductionOrdersQuery({
    page: 1,
    limit: 50,
    q: workspace.filters.search || undefined,
  })
  const workCentersQuery = useWorkCentersQuery()
  const machinesQuery = useMachinesQuery()
  const orders = asProductionList(ordersQuery.data)
  const activeOrder =
    workspace.selectedEntity ??
    orders.find((order) => order.status === 'IN_PROGRESS') ??
    orders[0]
  const delayedOrders = orders.filter(
    (order) => order.status === 'DELAYED',
  )
  const activeTasks = useMemo(
    () => orders.flatMap((order) => order.tasks ?? []),
    [orders],
  )
  const blockedTasks = activeTasks.filter(
    (task) => task.status === 'BLOCKED',
  )
  const operatorLoad = new Set(
    activeTasks
      .map((task) => task.assignedWorkerId)
      .filter(Boolean),
  ).size
  const machines = machinesQuery.data ?? []
  const constrainedMachines = machines.filter((machine) =>
    ['MAINTENANCE', 'OFFLINE'].includes(machine.status),
  )
  const activeStage =
    activeOrder?.stages?.find((stage) =>
      ['READY', 'IN_PROGRESS'].includes(stage.status),
    ) ?? activeOrder?.stages?.[0]
  const productionContext = {
    productionOrderId: activeOrder?.id,
    productionStageId: activeStage?.id,
  }

  return {
    ...workspace,
    metricsQuery,
    ordersQuery,
    workCentersQuery,
    machinesQuery,
    orders,
    activeOrder,
    delayedOrders,
    activeTasks,
    blockedTasks,
    operatorLoad,
    machines,
    constrainedMachines,
    activeStage,
    productionContext,
    workspaceEvents,
  }
}
