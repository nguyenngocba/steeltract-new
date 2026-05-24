import {
  Boxes,
  ClipboardList,
  PackageCheck,
  Route,
  Warehouse,
} from 'lucide-react'
import {
  useState,
} from 'react'

import {
  PageLayout,
  SectionCard,
  StatCard,
  StatusBadge,
  Timeline,
} from '../../components/ui-system'
import { useInventoryQuery } from '../../hooks/query/useInventoryQueries'
import {
  ContextualOperationDrawer,
  OperatorQuickActionsPanel,
} from '../../modules/operator-actions'
import {
  MovementTimeline,
  UtilizationWidgets,
  useYardMetricsQuery,
  useYardMovementsQuery,
} from '../../modules/yard-ui'
import {
  OpsLane,
  OperationalWorkspaceHero,
  OperationalActivityPanel,
  StickyOpsToolbar,
} from './operations-utils'
import { asList as asPaginatedList } from './operations-data'

function occupancyPercent(value: number) {
  return value <= 1 ? value * 100 : value
}

export function WarehouseOperationsPage() {
  const [drawerOpen, setDrawerOpen] =
    useState(false)
  const inventoryQuery = useInventoryQuery()
  const yardMetricsQuery = useYardMetricsQuery()
  const movementsQuery = useYardMovementsQuery({
    page: 1,
    limit: 20,
  })
  const inventory = inventoryQuery.data ?? []
  const inboundQueue = inventory.filter(
    (item) => Number(item.quantity) <= 0,
  )
  const dispatchQueue = asPaginatedList(
    movementsQuery.data,
  ).filter((movement) =>
    ['MOVE', 'REMOVE'].includes(movement.type),
  )
  const receivingQueue = asPaginatedList(
    movementsQuery.data,
  ).filter((movement) => movement.type === 'PLACE')
  const movements = asPaginatedList(movementsQuery.data)
  const activeMovement =
    dispatchQueue[0] ?? receivingQueue[0] ?? movements[0]
  const zoneUtilization =
    yardMetricsQuery.data?.zoneUtilization ?? []
  const constrainedZones = zoneUtilization.filter(
    (zone) => occupancyPercent(zone.occupancyRate) >= 75,
  )

  return (
    <PageLayout
      title="Warehouse Operations"
      description="Material availability, yard handoff, and logistics readiness across warehouse operations."
    >
      <OperationalWorkspaceHero
        eyebrow="warehouse ops / logistics control"
        title="Warehouse Operations Center"
        description="Receiving, dispatch, reservation health, zone utilization and yard handoff telemetry for industrial material flow."
        metrics={[
          {
            label: 'Receiving',
            value: receivingQueue.length,
            tone: 'success',
          },
          {
            label: 'Dispatch',
            value: dispatchQueue.length,
            tone: dispatchQueue.length > 0 ? 'warning' : 'neutral',
          },
          {
            label: 'Occupied slots',
            value: yardMetricsQuery.data?.occupiedSlots ?? 0,
            tone: 'info',
          },
          {
            label: 'Hot zones',
            value: constrainedZones.length,
            tone: constrainedZones.length > 0 ? 'danger' : 'success',
          },
        ]}
        actions={
          <>
            <StatusBadge tone="info">
              movement telemetry
            </StatusBadge>
            <StatusBadge tone="success">
              QR handoff
            </StatusBadge>
            <StatusBadge tone="neutral">
              allocation workflow
            </StatusBadge>
          </>
        }
      />
      <StickyOpsToolbar
        domain="warehouse"
        quickFilters={
          <>
            <StatusBadge tone="info">
              receiving {receivingQueue.length}
            </StatusBadge>
            <StatusBadge tone="warning">
              dispatch {dispatchQueue.length}
            </StatusBadge>
          </>
        }
        counters={
          <>
            <StatusBadge tone="neutral">
              SKUs {inventory.length}
            </StatusBadge>
            <StatusBadge tone="info">
              occupied{' '}
              {yardMetricsQuery.data?.occupiedSlots ?? 0}
            </StatusBadge>
          </>
        }
        actions={
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200"
          >
            Open movement context
          </button>
        }
        siteSelector={
          <select className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-300">
            <option>Main warehouse</option>
            <option>Outdoor yard</option>
          </select>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Inventory SKUs"
          value={inventory.length}
          icon={<Boxes className="h-5 w-5" />}
        />
        <StatCard
          label="Active slots"
          value={yardMetricsQuery.data?.occupiedSlots ?? 0}
          icon={<Warehouse className="h-5 w-5" />}
        />
        <StatCard
          label="Receiving"
          value={receivingQueue.length}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <StatCard
          label="Dispatch"
          value={dispatchQueue.length}
          icon={<PackageCheck className="h-5 w-5" />}
        />
      </div>
      <UtilizationWidgets metrics={yardMetricsQuery.data} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <OpsLane
          title="Receiving queue"
          value={receivingQueue.length}
          detail={receivingQueue[0]?.itemCode ?? 'clear'}
          tone="info"
        />
        <OpsLane
          title="Dispatch queue"
          value={dispatchQueue.length}
          detail={dispatchQueue[0]?.itemCode ?? 'clear'}
          tone="warning"
        />
        <OpsLane
          title="Reservation watch"
          value={inboundQueue.length}
          detail="zero or negative stock"
          tone={
            inboundQueue.length > 0 ? 'danger' : 'success'
          }
        />
        <OpsLane
          title="Allocation progress"
          value={`${Math.round(
            occupancyPercent(
              yardMetricsQuery.data?.occupancyRate ?? 0,
            ),
          )}%`}
          detail="yard occupancy signal"
          tone="neutral"
        />
      </div>
      <SectionCard
        title="Warehouse material flow"
        description="Inbound, staging, dispatch and yard handoff throughput by current realtime movement state."
      >
        <div className="grid gap-3 md:grid-cols-4">
          {[
            {
              label: 'Inbound receiving',
              value: receivingQueue.length,
              detail: receivingQueue[0]?.itemCode ?? 'clear',
              tone: 'success',
            },
            {
              label: 'Staging load',
              value: yardMetricsQuery.data?.placements ?? 0,
              detail: 'active placements',
              tone: 'info',
            },
            {
              label: 'Outbound dispatch',
              value: dispatchQueue.length,
              detail: dispatchQueue[0]?.itemCode ?? 'clear',
              tone: 'warning',
            },
            {
              label: 'Zone congestion',
              value: constrainedZones.length,
              detail: constrainedZones[0]?.code ?? 'no hotspot',
              tone: constrainedZones.length > 0 ? 'danger' : 'neutral',
            },
          ].map((lane) => (
            <div
              key={lane.label}
              className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <Route className="h-4 w-4 text-cyan-300" />
                <StatusBadge
                  tone={
                    lane.tone as
                      | 'neutral'
                      | 'info'
                      | 'success'
                      | 'warning'
                      | 'danger'
                  }
                >
                  {lane.value}
                </StatusBadge>
              </div>
              <p className="mt-2 text-xs uppercase tracking-wide text-zinc-500">
                {lane.label}
              </p>
              <p className="mt-1 truncate text-xs text-zinc-300">
                {lane.detail}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-900">
                <div
                  className="h-full rounded-full bg-cyan-300"
                  style={{
                    width: `${Math.min(Number(lane.value) * 10, 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <MovementTimeline movements={movements} />
        <OperationalActivityPanel
          title="Warehouse exceptions"
          items={inventory
            .filter((item) => Number(item.quantity) <= 0)
            .map((item) => ({
              id: item.id,
              label: item.name,
              detail: item.code,
              tone: 'warning',
            }))}
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[0.65fr_1.35fr]">
        <OperatorQuickActionsPanel
          title="Warehouse quick actions"
          domains={['inventory', 'yard', 'procurement']}
          context={{
            inventoryItemId: inboundQueue[0]?.id,
          }}
        />
        <SectionCard
          title="Zone summary"
          description="Warehouse and yard zone utilization for reservation, allocation and congestion watch."
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {zoneUtilization.slice(0, 9).map((zone) => {
              const occupancy = occupancyPercent(zone.occupancyRate)

              return (
                <div
                  key={zone.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white">
                      {zone.code}
                    </p>
                    <StatusBadge
                      tone={
                        occupancy >= 85
                          ? 'danger'
                          : occupancy >= 70
                            ? 'warning'
                            : 'info'
                      }
                    >
                      {Math.round(occupancy)}%
                    </StatusBadge>
                  </div>
                  <p className="mt-1 truncate text-xs text-zinc-500">
                    {zone.name}
                  </p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-900">
                    <div
                      className="h-full rounded-full bg-cyan-300"
                      style={{
                        width: `${Math.min(occupancy, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    {zone.occupiedSlots}/{zone.totalSlots} slots
                  </p>
                </div>
              )
            })}
          </div>
        </SectionCard>
      </div>
      <SectionCard title="Warehouse execution model">
        <div className="grid gap-3 md:grid-cols-4">
          {[
            ['Receiving', receivingQueue.length],
            ['Staging', yardMetricsQuery.data?.placements ?? 0],
            ['Dispatch', dispatchQueue.length],
            ['Yard handoff', yardMetricsQuery.data?.occupiedSlots ?? 0],
          ].map(([lane, count]) => (
            <div
              key={lane}
              className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-300"
            >
              <div className="flex items-center justify-between gap-2">
                <span>{lane}</span>
                <StatusBadge tone="info">
                  {count}
                </StatusBadge>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard
        title="Reservation and allocation workflow"
        description="Foundation for receiving, reserve, allocate, dispatch and QR handoff chains."
      >
        <Timeline
          items={[
            {
              id: 'receive',
              title: 'Receive material',
              description: `${receivingQueue.length} active receiving movements`,
              tone: 'success',
            },
            {
              id: 'reserve',
              title: 'Reserve for production',
              description: `${inboundQueue.length} stock exceptions require review`,
              tone: inboundQueue.length > 0 ? 'warning' : 'info',
            },
            {
              id: 'allocate',
              title: 'Allocate staging slot',
              description: `${yardMetricsQuery.data?.occupiedSlots ?? 0} occupied slots`,
              tone: 'info',
            },
            {
              id: 'dispatch',
              title: 'Dispatch / yard handoff',
              description: `${dispatchQueue.length} outbound movements`,
              tone: dispatchQueue.length > 0 ? 'warning' : 'neutral',
            },
          ]}
        />
      </SectionCard>
      <ContextualOperationDrawer
        open={drawerOpen}
        title={
          activeMovement
            ? `Movement ${activeMovement.itemCode}`
            : 'Warehouse movement context'
        }
        subtitle={
          activeMovement
            ? `${activeMovement.type} / ${
                activeMovement.fromSlot?.code ?? 'warehouse'
              } -> ${activeMovement.toSlot?.code ?? 'yard'}`
            : 'Select a movement to inspect logistics context.'
        }
        context={{
          yardPlacementId: activeMovement?.placementId ?? undefined,
          inventoryItemId: inboundQueue[0]?.id,
        }}
        domains={['inventory', 'yard', 'procurement']}
        onClose={() => setDrawerOpen(false)}
      />
    </PageLayout>
  )
}
