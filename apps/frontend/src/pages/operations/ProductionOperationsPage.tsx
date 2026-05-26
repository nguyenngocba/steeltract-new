import {
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'
import {
  ContextInsightPanel,
  OperationalWorkspaceShell,
  SplitWorkspaceLayout,
  TelemetryStrip,
  WorkspaceEventSurface,
} from '../../modules/operations'
import {
  ContextualOperationDrawer,
  OperatorQuickActionsPanel,
} from '../../modules/operator-actions'
import {
  MachineStatusWidgets,
  ProductionBoard,
  ProductionKpiCards,
  ProductionProgressVisualization,
  ProductionTaskTable,
  StageTimeline,
  WorkCenterCards,
} from '../../modules/production-ui'
import {
  useProductionWorkspace,
} from '../../modules/production'
import {
  OpsLane,
  OperationalWorkspaceHero,
  StickyOpsToolbar,
} from './operations-utils'

export function ProductionOperationsPage() {
  const workspace = useProductionWorkspace()
  const {
    contextOpen,
    setContextOpen,
    selectEntity,
    clearSelection,
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
  } = workspace

  return (
    <OperationalWorkspaceShell
      title="Production Operations"
      description="Fabrication execution lanes, machine load, stage progression, and production tasks."
    >
      <OperationalWorkspaceHero
        eyebrow="fabrication ops / MES control"
        title="Production Operations Center"
        description="Throughput, delayed stages, machine utilization, operator load and active fabrication lanes for steel production control."
        metrics={[
          {
            label: 'Orders',
            value: metricsQuery.data?.totalOrders ?? orders.length,
            tone: 'info',
          },
          {
            label: 'In progress',
            value: metricsQuery.data?.inProgress ?? 0,
            tone: 'success',
          },
          {
            label: 'Delayed',
            value: delayedOrders.length,
            tone: delayedOrders.length > 0 ? 'warning' : 'success',
          },
          {
            label: 'Machines down',
            value: constrainedMachines.length,
            tone: constrainedMachines.length > 0 ? 'danger' : 'success',
          },
        ]}
        actions={
          <>
            <StatusBadge tone="info">
              active fabrication lane
            </StatusBadge>
            <StatusBadge tone="neutral">
              work center routing
            </StatusBadge>
            <StatusBadge tone="success">
              operator dispatch
            </StatusBadge>
          </>
        }
      />
      <TelemetryStrip
        dense
        items={[
          {
            label: 'Active order',
            value: activeOrder?.orderNo ?? 'none',
            tone: activeOrder ? 'success' : 'neutral',
            detail: activeStage?.code ?? 'stage waiting',
          },
          {
            label: 'Delayed lane',
            value: delayedOrders.length,
            tone: delayedOrders.length > 0 ? 'warning' : 'success',
            progress: delayedOrders.length * 20,
          },
          {
            label: 'Blocked tasks',
            value: blockedTasks.length,
            tone: blockedTasks.length > 0 ? 'danger' : 'success',
            detail: 'operator intervention',
          },
          {
            label: 'Machine constraints',
            value: constrainedMachines.length,
            tone:
              constrainedMachines.length > 0
                ? 'danger'
                : 'success',
            detail: 'maintenance/offline',
          },
          {
            label: 'Last event',
            value: workspaceEvents.lastEvent?.event ?? 'waiting',
            tone: workspaceEvents.lastEvent ? 'info' : 'neutral',
            detail:
              workspaceEvents.lastEvent?.entityId ??
              'domain stream idle',
          },
        ]}
      />
      <StickyOpsToolbar
        domain="production"
        quickFilters={
          <>
            <StatusBadge tone="warning">
              delayed {delayedOrders.length}
            </StatusBadge>
            <StatusBadge tone="danger">
              blocked {blockedTasks.length}
            </StatusBadge>
          </>
        }
        counters={
          <>
            <StatusBadge tone="info">
              throughput {metricsQuery.data?.throughput ?? 0}
            </StatusBadge>
            <StatusBadge tone="neutral">
              operators {operatorLoad}
            </StatusBadge>
          </>
        }
        actions={
          <button
            type="button"
            onClick={() => {
              if (activeOrder) {
                selectEntity(activeOrder)
              } else {
                setContextOpen(true)
              }
            }}
            className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200"
          >
            Open context
          </button>
        }
        shiftSelector={
          <select className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-300">
            <option>Shift A</option>
            <option>Shift B</option>
            <option>Shift C</option>
          </select>
        }
        workCenterSelector={
          <select className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-300">
            <option>All work centers</option>
            {(workCentersQuery.data ?? []).map((center) => (
              <option key={center.id}>
                {center.code}
              </option>
            ))}
          </select>
        }
      />
      <ProductionKpiCards metrics={metricsQuery.data} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <OpsLane
          title="Released lane"
          value={
            orders.filter(
              (order) => order.status === 'RELEASED',
            ).length
          }
          detail="ready for execution"
          tone="info"
        />
        <OpsLane
          title="Active lane"
          value={metricsQuery.data?.inProgress ?? 0}
          detail={activeOrder?.orderNo ?? 'no active order'}
          tone="success"
        />
        <OpsLane
          title="Delayed lane"
          value={delayedOrders.length}
          detail={delayedOrders[0]?.delayReason ?? 'watch SLA'}
          tone={
            delayedOrders.length > 0 ? 'warning' : 'neutral'
          }
        />
        <OpsLane
          title="Machine constraints"
          value={constrainedMachines.length}
          detail="maintenance/offline"
          tone={
            constrainedMachines.length > 0
              ? 'danger'
              : 'success'
          }
        />
        <OpsLane
          title="Operator load"
          value={operatorLoad}
          detail={`${activeTasks.length} active tasks`}
          tone="neutral"
        />
      </div>
      <SplitWorkspaceLayout
        ratio="main-heavy"
        main={
          <>
            <ProductionBoard orders={ordersQuery.data} />
            <SectionCard
              title="Machine utilization strip"
              description="Live work-center load and downtime awareness from production metrics."
            >
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                {machines.slice(0, 8).map((machine) => (
                  <div
                    key={machine.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-white">
                        {machine.code}
                      </span>
                      <StatusBadge
                        tone={
                          machine.status === 'RUNNING'
                            ? 'success'
                            : machine.status === 'MAINTENANCE'
                              ? 'warning'
                              : machine.status === 'OFFLINE'
                                ? 'danger'
                                : 'neutral'
                        }
                      >
                        {machine.status}
                      </StatusBadge>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-900">
                      <div
                        className="h-full rounded-full bg-cyan-400"
                        style={{
                          width: `${Math.min(machine.utilization, 100)}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">
                      {machine.name} - {machine.utilization}% load
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </>
        }
        side={
          <>
            <OperatorQuickActionsPanel
              domains={['production']}
              context={productionContext}
              title="Production operator actions"
            />
            <ContextInsightPanel
              title="Production context"
              subtitle="Selection-aware production side workspace."
              selectedLabel={
                activeOrder
                  ? `${activeOrder.orderNo} / ${activeOrder.status}`
                  : undefined
              }
              metrics={[
                {
                  label: 'active stage',
                  value: activeStage?.code ?? '-',
                  tone: activeStage ? 'info' : 'neutral',
                },
                {
                  label: 'tasks',
                  value: activeOrder?.tasks?.length ?? 0,
                  tone: 'success',
                },
              ]}
              timeline={(activeOrder?.stages ?? [])
                .slice(0, 5)
                .map((stage) => ({
                  id: stage.id,
                  title: stage.code,
                  description: stage.status,
                  tone:
                    stage.status === 'BLOCKED'
                      ? 'danger'
                      : stage.status === 'COMPLETED'
                        ? 'success'
                        : 'info',
                }))}
            />
            <WorkspaceEventSurface
              title="Production event surface"
              events={workspaceEvents.events}
            />
          </>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <StageTimeline order={activeOrder} />
        <ProductionProgressVisualization metrics={metricsQuery.data} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <WorkCenterCards workCenters={workCentersQuery.data} />
        <MachineStatusWidgets machines={machinesQuery.data} />
      </div>
      <ProductionTaskTable
        tasks={activeTasks}
      />
      <ContextualOperationDrawer
        open={contextOpen}
        title={
          activeOrder
            ? `Production ${activeOrder.orderNo}`
            : 'Production context'
        }
        subtitle={
          activeStage
            ? `Active stage ${activeStage.code} / ${activeStage.status}`
            : 'Select an active production order to enable contextual actions.'
        }
        context={productionContext}
        domains={['production']}
        onClose={() => {
          setContextOpen(false)
          clearSelection()
        }}
      />
    </OperationalWorkspaceShell>
  )
}
