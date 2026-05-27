import {
  Suspense,
  lazy,
  useState,
} from 'react'

import {
  LoadingState,
  PageLayout,
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'
import {
  ContextualOperationDrawer,
  OperatorQuickActionsPanel,
} from '../../modules/operator-actions'
import {
  CraneStatusPanel,
  MovementTimeline,
  UtilizationWidgets,
  YardSearchPanel,
  YardMap,
  YardSnapshotViewer,
  ZoneGrid,
  useCranesQuery,
  useYardMetricsQuery,
  useYardMovementsQuery,
  useYardSearchQuery,
  useYardSlotsQuery,
  useYardSnapshotsQuery,
  useYardZonesQuery,
} from '../../modules/yard-ui'
import { asList } from './operations-data'
import {
  OpsLane,
  OperationalModuleTabs,
  OperationalSurface,
  OperationalWorkspaceHero,
  StickyOpsToolbar,
  WorkspaceSplit,
} from './operations-utils'

const YardPixiCanvas = lazy(() =>
  import('../../modules/yard-visualization').then((module) => ({
    default: module.YardPixiCanvas,
  })),
)

function occupancyPercent(value: number) {
  return value <= 1 ? value * 100 : value
}

type YardViewMode = '2d' | '3d'

export function YardOperationsPage() {
  const [detailOpen, setDetailOpen] =
    useState(false)
  const [viewMode, setViewMode] =
    useState<YardViewMode>('2d')
  const metricsQuery = useYardMetricsQuery()
  const movementsQuery = useYardMovementsQuery({
    page: 1,
    limit: 30,
  })
  const cranesQuery = useCranesQuery()
  const zonesQuery = useYardZonesQuery({
    page: 1,
    limit: 24,
  })
  const slotsQuery = useYardSlotsQuery({
    page: 1,
    limit: 400,
  })
  const snapshotsQuery = useYardSnapshotsQuery({
    page: 1,
    limit: 8,
  })
  const searchQuery = useYardSearchQuery({
    page: 1,
    limit: 20,
  })
  const movements = asList(movementsQuery.data)
  const zones = asList(zonesQuery.data)
  const slots = asList(slotsQuery.data)
  const congestionZones =
    metricsQuery.data?.zoneUtilization.filter(
      (zone) => occupancyPercent(zone.occupancyRate) >= 75,
    ) ?? []
  const craneIssues = (cranesQuery.data ?? []).filter((crane) =>
    ['MAINTENANCE', 'OFFLINE'].includes(crane.status),
  )
  const yardResults = asList(searchQuery.data)
  const activePlacement =
    yardResults.find((placement) => !placement.removedAt) ??
    yardResults[0]
  const yardContext = {
    yardPlacementId: activePlacement?.id,
  }

  return (
    <PageLayout
      title="Yard Operations"
      description="Coordinate-based logistics, slot utilization, crane state, movements, and PixiJS snapshot rendering."
    >
      <OperationalWorkspaceHero
        eyebrow="bãi tập kết / digital twin"
        title="Bãi tập kết cấu kiện"
        description="Điều phối vị trí, mức xếp chồng, luồng cẩu, điểm nghẽn và trực quan logistics theo snapshot."
        metrics={[
          {
            label: 'Slots',
            value: metricsQuery.data?.totalSlots ?? 0,
            tone: 'info',
          },
          {
            label: 'Occupancy',
            value: `${Math.round(occupancyPercent(metricsQuery.data?.occupancyRate ?? 0))}%`,
            tone: 'info',
          },
          {
            label: 'Hotspots',
            value: congestionZones.length,
            tone: congestionZones.length > 0 ? 'warning' : 'success',
          },
          {
            label: 'Crane issues',
            value: craneIssues.length,
            tone: craneIssues.length > 0 ? 'danger' : 'success',
          },
        ]}
        actions={
          <>
            <StatusBadge tone="info">
              {viewMode.toUpperCase()} view
            </StatusBadge>
            <StatusBadge tone="warning">
              congestion watch
            </StatusBadge>
            <StatusBadge tone="success">
              crane telemetry
            </StatusBadge>
          </>
        }
      />
      <OperationalSurface>
        <OperationalModuleTabs
          items={[
            'Sơ đồ bãi',
            'Khu vực',
            'Di chuyển',
            'Cẩu trục',
            'Snapshot',
          ]}
        />
        <StickyOpsToolbar
          domain="bãi tập kết"
          quickFilters={
            <>
              <StatusBadge tone="warning">
                hotspots {congestionZones.length}
              </StatusBadge>
              <StatusBadge tone="info">
                moves {movements.length}
              </StatusBadge>
            </>
          }
          counters={
            <>
              <StatusBadge tone="neutral">
                slots {metricsQuery.data?.totalSlots ?? 0}
              </StatusBadge>
              <StatusBadge tone="success">
                cranes {cranesQuery.data?.length ?? 0}
              </StatusBadge>
            </>
          }
          actions={
            <>
              <div className="inline-flex overflow-hidden rounded-lg border border-cyan-500/20 bg-zinc-950/80 p-1">
                {(['2d', '3d'] as YardViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    className={
                      viewMode === mode
                        ? 'rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold uppercase text-white shadow-[0_0_18px_rgba(37,99,235,0.35)]'
                        : 'rounded-md px-3 py-1.5 text-xs font-semibold uppercase text-zinc-400 hover:text-white'
                    }
                  >
                    {mode === '2d' ? '2D' : '3D'}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setDetailOpen(true)}
                className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200"
              >
                Mở ngữ cảnh
              </button>
            </>
          }
          siteSelector={
            <select className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-300">
              <option>Tất cả bãi</option>
              {metricsQuery.data?.zoneUtilization.map((zone) => (
                <option key={zone.id}>
                  {zone.code}
                </option>
              ))}
            </select>
          }
        />
        <UtilizationWidgets metrics={metricsQuery.data} />
        <WorkspaceSplit
          main={
            <>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <OpsLane title="Congestion hotspots" value={congestionZones.length} detail={congestionZones[0]?.code ?? 'clear'} tone={congestionZones.length > 0 ? 'warning' : 'success'} />
                <OpsLane title="Movement pulse" value={movements.length} detail={movements[0]?.itemCode ?? 'no recent moves'} tone="info" />
                <OpsLane title="Crane constraints" value={craneIssues.length} detail={craneIssues[0]?.code ?? 'available'} tone={craneIssues.length > 0 ? 'danger' : 'neutral'} />
                <OpsLane title="Stacked slots" value={metricsQuery.data?.zoneUtilization.filter((zone) => zone.occupiedSlots > 0).length ?? 0} detail="active zones" tone="neutral" />
                <OpsLane title="Occupancy" value={`${Math.round(occupancyPercent(metricsQuery.data?.occupancyRate ?? 0))}%`} detail="snapshot-driven" tone="info" />
              </div>
              <SectionCard
                title={
                  viewMode === '2d'
                    ? 'Sơ đồ bãi 2D'
                    : 'Digital twin 3D'
                }
                description={
                  viewMode === '2d'
                    ? 'Bản đồ zone/slot lấy từ backend spatial truth, dùng cho điều phối nhanh và kiểm tra sức chứa.'
                    : 'PixiJS renderer đọc snapshot đã chuẩn bị, dùng cho mô phỏng logistics realtime và movement pulse.'
                }
                actions={
                  <div className="inline-flex overflow-hidden rounded-lg border border-cyan-500/20 bg-zinc-950/80 p-1">
                    {(['2d', '3d'] as YardViewMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setViewMode(mode)}
                        className={
                          viewMode === mode
                            ? 'rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold uppercase text-white shadow-[0_0_18px_rgba(37,99,235,0.35)]'
                            : 'rounded-md px-3 py-1.5 text-xs font-semibold uppercase text-zinc-400 hover:text-white'
                        }
                      >
                        {mode === '2d' ? '2D' : '3D'}
                      </button>
                    ))}
                  </div>
                }
              >
                {viewMode === '2d' ? (
                  <div className="grid gap-3 xl:grid-cols-[1.3fr_0.9fr]">
                    <YardMap
                      zones={zones}
                      slots={slots}
                    />
                    <div className="min-h-0">
                      <ZoneGrid zones={zones.slice(0, 4)} />
                    </div>
                  </div>
                ) : (
                  <Suspense fallback={<LoadingState label="Loading yard 3D renderer" />}>
                    <YardPixiCanvas compact />
                  </Suspense>
                )}
              </SectionCard>
              <YardSearchPanel results={yardResults} />
            </>
          }
          side={
            <>
              <CraneStatusPanel cranes={cranesQuery.data ?? []} />
              <MovementTimeline movements={movements} />
              <OperatorQuickActionsPanel domains={['yard']} context={yardContext} title="Yard operator actions" />
            </>
          }
          bottom={
            <>
              <SectionCard
                title="Congestion and crane lane"
                description="Heatmap overlays, crane activity, movement pulses, and minimap context remain snapshot-driven."
              >
                <div className="grid gap-3 md:grid-cols-3">
                  {congestionZones.slice(0, 6).map((zone) => (
                    <div key={zone.id} className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-white">{zone.code}</span>
                        <StatusBadge tone="warning">{Math.round(occupancyPercent(zone.occupancyRate))}%</StatusBadge>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        {zone.occupiedSlots}/{zone.totalSlots} slots occupied
                      </p>
                    </div>
                  ))}
                  {congestionZones.length === 0 ? (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3 text-sm text-zinc-400">
                      No congestion hotspots above threshold.
                    </div>
                  ) : null}
                </div>
              </SectionCard>
              <YardSnapshotViewer snapshots={asList(snapshotsQuery.data)} />
            </>
          }
        />
      </OperationalSurface>
      <ContextualOperationDrawer
        open={detailOpen}
        title={
          activePlacement
            ? `Yard item ${activePlacement.itemCode}`
            : 'Yard context'
        }
        subtitle={
          activePlacement
            ? `${activePlacement.slot?.code ?? activePlacement.slotId} / stack ${activePlacement.stackLevel}`
            : 'Select a placement to enable yard actions.'
        }
        context={yardContext}
        domains={['yard']}
        onClose={() => setDetailOpen(false)}
      />
    </PageLayout>
  )
}
