import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRightLeft,
  ArrowUpFromLine,
  Boxes,
  Clock3,
  MapPinned,
  PackageCheck,
  RefreshCw,
  ShieldAlert,
  Warehouse,
} from 'lucide-react'

import { EnterpriseModulePage } from '@/shared/runtime-tabs/EnterpriseModulePage'
import {
  CockpitChartCard,
  CockpitKpiCard,
  CockpitTableShell,
} from '@/shared/ui/cockpit'
import {
  ModuleEmptyState,
  ModuleLoadingState,
} from '@/shared/ui/modules'
import {
  InventoryPanel,
  inventoryTableHead,
  inventoryTableRow,
} from '@/modules/inventory/components/InventoryVisuals'
import {
  formatCurrencyVnd,
  formatDateTime,
  formatQuantity,
} from '@/shared/utils/number-format'

import {
  transactionTimestamp,
  useWarehouseRealtime,
} from '../hooks/useWarehouseRealtime'
import type {
  WarehouseRealtimeMaterial,
  WarehouseRealtimeOverview,
  WarehouseRealtimeTransaction,
} from '../api/warehouse-realtime.api'

type ChartRow = {
  label: string
  value: number
  tone?: string
}

export function WarehouseRealtimeDashboardPage() {
  const {
    overviewQuery,
    materials,
    transactions,
    metrics,
    alerts,
    isLoading,
    isError,
    refetchAll,
  } = useWarehouseRealtime()

  const overview = overviewQuery.data
  const warehouses = warehouseRows(overview)
  const movementRows = movementTimelineRows(overview)
  const slotRows = slotUtilizationRows(materials)

  return (
    <EnterpriseModulePage>
      <div className="space-y-2">
        <section className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
              Realtime Warehouse Cockpit
            </p>
            <h1 className="mt-1 text-xl font-semibold text-white">
              Điều hành kho realtime
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Polling 5 giây từ Inventory read models. Không dùng Historical
              Dashboard hoặc Snapshot Engine.
            </p>
          </div>
          <button
            type="button"
            onClick={refetchAll}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-3 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/15"
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới realtime
          </button>
        </section>

        {isLoading ? (
          <ModuleLoadingState label="Đang tải cockpit kho realtime..." />
        ) : null}

        {isError ? (
          <section className="rounded-xl border border-red-400/20 bg-red-950/20 p-3 text-sm text-red-100">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold">Không thể tải dữ liệu kho</div>
                <div className="mt-1 text-xs text-red-200/80">
                  Kiểm tra kết nối API Inventory rồi thử lại.
                </div>
              </div>
              <button
                type="button"
                onClick={refetchAll}
                className="rounded-lg border border-red-300/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-100 transition hover:bg-red-500/20"
              >
                Thử lại
              </button>
            </div>
          </section>
        ) : null}

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
          <CockpitKpiCard
            title="Tổng tồn kho"
            value={formatQuantity(metrics.totalInventory, 0)}
            note={formatCurrencyVnd(metrics.totalValue)}
            tone="blue"
            icon={<Boxes className="h-4 w-4" />}
          />
          <CockpitKpiCard
            title="Đã giữ chỗ"
            value={formatQuantity(metrics.reserved, 0)}
            note="Từ dòng vật tư có reservedQuantity"
            tone="purple"
            icon={<ShieldAlert className="h-4 w-4" />}
          />
          <CockpitKpiCard
            title="Khả dụng"
            value={formatQuantity(metrics.available, 0)}
            note="Có thể cấp phát"
            tone="emerald"
            icon={<PackageCheck className="h-4 w-4" />}
          />
          <CockpitKpiCard
            title="Tồn thấp"
            value={formatQuantity(metrics.lowStock, 0)}
            note="Dưới định mức"
            tone={metrics.lowStock > 0 ? 'amber' : 'cyan'}
            icon={<AlertTriangle className="h-4 w-4" />}
          />
          <CockpitKpiCard
            title="Hết tồn"
            value={formatQuantity(metrics.outOfStock, 0)}
            note="Cần xử lý"
            tone={metrics.outOfStock > 0 ? 'red' : 'cyan'}
            icon={<Warehouse className="h-4 w-4" />}
          />
        </div>

        <div className="grid grid-cols-1 gap-2 xl:grid-cols-12">
          <InventoryPanel
            title={
              <PanelTitle
                title="Bản đồ kho realtime"
                subtitle="Occupancy theo warehouse/zone từ Inventory overview"
              />
            }
            className="xl:col-span-8"
          >
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              <WarehouseMap rows={warehouses} />
              <WarehouseMap
                rows={slotRows}
                title="Slot utilization"
                emptyTitle="Chưa có dữ liệu slot"
              />
            </div>
          </InventoryPanel>

          <div className="space-y-2 xl:col-span-4">
            <CockpitChartCard
              title="Realtime Alerts"
              subtitle="Cảnh báo từ tồn kho hiện tại"
              heightClass="min-h-[280px]"
            >
              <AlertList alerts={alerts} />
            </CockpitChartCard>

            <CockpitChartCard
              title="Movement Timeline"
              subtitle="Dòng vận động gần nhất"
              heightClass="min-h-[230px]"
            >
              <MovementBars rows={movementRows} />
            </CockpitChartCard>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 xl:grid-cols-12">
          <RecentTransactionsTable rows={transactions} />
          <InventoryHealthPanel rows={materials} />
        </div>
      </div>
    </EnterpriseModulePage>
  )
}

function WarehouseMap({
  rows,
  title = 'Warehouse occupancy',
  emptyTitle = 'Chưa có dữ liệu kho',
}: {
  rows: ChartRow[]
  title?: string
  emptyTitle?: string
}) {
  if (rows.length === 0) {
    return (
      <ModuleEmptyState
        title={emptyTitle}
        description="Inventory read model chưa trả về phân bổ vị trí."
      />
    )
  }

  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-white">{title}</div>
        <MapPinned className="h-4 w-4 text-cyan-300" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {rows.map((row) => {
          const percent = Math.max(3, Math.min(100, row.value))
          return (
            <div
              key={row.label}
              className="min-h-[84px] rounded-lg border border-cyan-300/10 bg-slate-900/50 p-2"
            >
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="truncate font-semibold text-slate-100">
                  {row.label}
                </span>
                <span className="text-cyan-200">{Math.round(percent)}%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-cyan-400"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="mt-3 text-[10px] text-slate-500">
                Capacity contract chưa cấu hình; tỷ lệ chuẩn hóa theo dữ liệu
                hiện có.
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AlertList({
  alerts,
}: {
  alerts: Array<{ severity: 'critical' | 'warning'; title: string; detail: string }>
}) {
  if (alerts.length === 0) {
    return (
      <ModuleEmptyState
        title="Không có cảnh báo"
        description="Không phát hiện tồn âm, hết tồn, tồn thấp hoặc vật tư chưa gán kho."
      />
    )
  }

  return (
    <div className="space-y-2">
      {alerts.slice(0, 6).map((alert) => (
        <div
          key={`${alert.title}-${alert.detail}`}
          className={`rounded-lg border p-2 ${
            alert.severity === 'critical'
              ? 'border-red-400/20 bg-red-950/20'
              : 'border-amber-300/20 bg-amber-950/20'
          }`}
        >
          <div className="text-xs font-semibold text-white">{alert.title}</div>
          <div className="mt-1 text-[11px] text-slate-300">{alert.detail}</div>
        </div>
      ))}
    </div>
  )
}

function MovementBars({ rows }: { rows: ChartRow[] }) {
  if (rows.length === 0) {
    return (
      <ModuleEmptyState
        title="Chưa có movement trend"
        description="Inventory overview chưa trả về dữ liệu vận động."
      />
    )
  }

  const max = Math.max(...rows.map((row) => row.value), 1)

  return (
    <div className="flex h-full items-end gap-2 px-1 pt-4">
      {rows.slice(-12).map((row) => (
        <div key={row.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-32 w-full items-end rounded-t bg-slate-900/45">
            <div
              className="w-full rounded-t bg-gradient-to-t from-cyan-500 to-emerald-300"
              style={{ height: `${Math.max(8, (row.value / max) * 100)}%` }}
            />
          </div>
          <div className="max-w-14 truncate text-[10px] text-slate-500">
            {row.label}
          </div>
        </div>
      ))}
    </div>
  )
}

function RecentTransactionsTable({
  rows,
}: {
  rows: WarehouseRealtimeTransaction[]
}) {
  return (
    <InventoryPanel
      title={
        <PanelTitle
          title="Giao dịch gần đây"
          subtitle="Receipt / Issue / Transfer / Adjustment, làm mới realtime"
        />
      }
      className="xl:col-span-8"
    >
      <CockpitTableShell className="max-h-[360px]">
        <table className="min-w-full text-left text-sm">
          <thead className={inventoryTableHead}>
            <tr>
              <th className="px-3 py-2">Phiếu</th>
              <th className="px-3 py-2">Loại</th>
              <th className="px-3 py-2">Vật tư</th>
              <th className="px-3 py-2">Kho</th>
              <th className="px-3 py-2 text-right">SL</th>
              <th className="px-3 py-2">Thời gian</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10">
                  <ModuleEmptyState
                    title="Chưa có giao dịch gần đây"
                    description="Các phiếu nhập, xuất, điều chuyển và điều chỉnh sẽ hiển thị tại đây."
                  />
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.id ?? row.transactionNo ?? index} className={inventoryTableRow}>
                  <td className="px-3 py-2 font-semibold text-white">
                    {row.transactionNo ?? row.id ?? '—'}
                  </td>
                  <td className="px-3 py-2">
                    <TransactionTypeBadge row={row} />
                  </td>
                  <td className="px-3 py-2 text-slate-300">
                    {row.materialName ?? row.items?.[0]?.materialName ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-slate-300">
                    {row.warehouseCode ?? row.items?.[0]?.warehouseCode ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-100">
                    {formatQuantity(
                      Number(row.totalQuantity ?? row.items?.[0]?.quantity ?? 0),
                      0,
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-400">
                    {transactionTimestamp(row)
                      ? formatDateTime(transactionTimestamp(row))
                      : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CockpitTableShell>
    </InventoryPanel>
  )
}

function TransactionTypeBadge({ row }: { row: WarehouseRealtimeTransaction }) {
  const type = String(row.type ?? row.direction ?? '').toUpperCase()
  const config = transactionTypeConfig(type)
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}

function InventoryHealthPanel({ rows }: { rows: WarehouseRealtimeMaterial[] }) {
  const lowRows = rows.filter((row) => {
    const current = Number(row.currentStock ?? row.quantity ?? 0)
    const min = Number(row.minimumStock ?? 0)
    return min > 0 && current <= min
  })

  return (
    <CockpitChartCard
      title="Material Health"
      subtitle="Vật tư cần chú ý"
      heightClass="xl:col-span-4 min-h-[420px]"
    >
      {lowRows.length === 0 ? (
        <ModuleEmptyState
          title="Không có vật tư dưới định mức"
          description="Các vật tư tồn thấp sẽ xuất hiện trong danh sách này."
        />
      ) : (
        <div className="space-y-2">
          {lowRows.slice(0, 8).map((row) => {
            const current = Number(row.currentStock ?? row.quantity ?? 0)
            const min = Number(row.minimumStock ?? 0)
            const percent = min > 0 ? Math.max(0, Math.min(100, (current / min) * 100)) : 0
            return (
              <div key={row.id ?? row.code} className="rounded-lg border border-white/10 bg-slate-950/35 p-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-white">
                      {row.code ?? '—'} · {row.name ?? 'Vật tư'}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      Min {formatQuantity(min, 0)}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-amber-200">
                    {formatQuantity(current, 0)}
                  </div>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </CockpitChartCard>
  )
}

function PanelTitle({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) {
  return (
    <div>
      <div className="text-sm font-bold uppercase tracking-[0.12em] text-white">
        {title}
      </div>
      <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
    </div>
  )
}

function warehouseRows(overview: WarehouseRealtimeOverview | undefined): ChartRow[] {
  const warehouses = overview?.facets?.warehouses ?? []
  const max = Math.max(
    ...warehouses.map((row) => Number(row.totalStock ?? row.count ?? 0)),
    1,
  )

  return warehouses.slice(0, 8).map((row) => {
    const value = Number(row.totalStock ?? row.count ?? 0)
    return {
      label: row.code ?? row.name ?? 'Kho',
      value: (value / max) * 100,
    }
  })
}

function slotUtilizationRows(rows: WarehouseRealtimeMaterial[]): ChartRow[] {
  const buckets = new Map<string, number>()
  for (const row of rows) {
    const key = row.warehouseCode ?? 'Chưa gán'
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }

  const max = Math.max(...buckets.values(), 1)
  return Array.from(buckets.entries()).map(([label, value]) => ({
    label,
    value: (value / max) * 100,
  }))
}

function movementTimelineRows(overview: WarehouseRealtimeOverview | undefined) {
  const trend = overview?.movementTrend ?? []
  return trend.map((row) => ({
    label: row.date ?? '—',
    value: Number(row.inboundValue ?? 0) + Number(row.outboundValue ?? 0),
  }))
}

function transactionTypeConfig(type: string) {
  if (type.includes('IN') || type.includes('RECEIVE')) {
    return {
      label: 'Nhập',
      icon: ArrowDownToLine,
      className: 'bg-emerald-400/10 text-emerald-200',
    }
  }

  if (type.includes('OUT') || type.includes('ISSUE')) {
    return {
      label: 'Xuất',
      icon: ArrowUpFromLine,
      className: 'bg-amber-400/10 text-amber-200',
    }
  }

  if (type.includes('TRANSFER')) {
    return {
      label: 'Điều chuyển',
      icon: ArrowRightLeft,
      className: 'bg-cyan-400/10 text-cyan-200',
    }
  }

  return {
    label: type || 'Điều chỉnh',
    icon: Clock3,
    className: 'bg-slate-400/10 text-slate-200',
  }
}
