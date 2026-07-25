import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Activity,
  Boxes,
  ChevronRight,
  Construction,
  MapPinned,
  Radio,
  Search,
  Truck,
  Warehouse,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useComponents } from '@/modules/components/hooks/queries/useComponents'
import { EnterpriseWorkspace } from '@/shared/ui/enterprise'
import { EnterprisePanel } from '@/shared/ui/enterprise-components'
import {
  inventoryGridGap,
  inventoryTableHead,
  inventoryTableRow,
} from '@/modules/inventory/components/InventoryVisuals'
import {
  CockpitChartCard,
  CockpitEmptyState,
  DataTablePagination,
  EnterpriseKpiCard,
} from '@/shared/ui/cockpit'
import { ModuleDetailDrawer, ModuleEmptyState } from '@/shared/ui/modules'
import { formatQuantity } from '@/shared/utils/number-format'
import { YardTabWorkspace } from '../components/YardTabWorkspace'
import { YardZoneDetailDialog } from '../components/YardZoneDetailDialog'
import { yardTabs } from '../config/yard-tabs'
import { YardOperationDialog, type YardOperationMode } from '../dialogs/YardOperationDialog'
import {
  useCreateYardSlot,
  useCreateYardZone,
  useDeleteYardZone,
  useUpdateYardZone,
  useYardDashboard,
  useYardWorkspace,
} from '../hooks/queries/useYardRuntime'
import type { YardSlotRuntime, YardZoneRuntime } from '../services/api/yard.api'
import { useYardActions } from '../context/YardActionContext'

const fmt = (value = 0) => formatQuantity(value, 2)

function YardDonut({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: Array<{ label: string; value: number; color: string }>
  centerValue: string
  centerLabel: string
}) {
  const total = Math.max(1, segments.reduce((sum, item) => sum + item.value, 0))
  let cursor = 0
  const gradient = segments
    .map((item) => {
      const start = cursor
      const end = cursor + (item.value / total) * 100
      cursor = end
      return `${item.color} ${start}% ${end}%`
    })
    .join(', ')

  return (
    <div className="grid min-h-[150px] grid-cols-[126px_1fr] items-center gap-3">
      <div className="relative h-28 w-28 rounded-full shadow-[0_18px_45px_rgba(0,0,0,0.2)]" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="absolute inset-3 rounded-full bg-[#08111f]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-xl font-semibold text-white">{centerValue}</div>
          <div className="text-[10px] text-slate-500">{centerLabel}</div>
        </div>
      </div>
      <div className="space-y-1.5 overflow-hidden">
        {segments.slice(0, 6).map((item) => (
          <div key={item.label} className="grid grid-cols-[1fr_auto] items-center gap-2 text-[11px]">
            <span className="flex min-w-0 items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="whitespace-nowrap text-slate-300">{formatQuantity(item.value, 0)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function YardMiniTrend({ values, tone = 'blue' }: { values: number[]; tone?: 'blue' | 'emerald' | 'amber' }) {
  if (!values.length) {
    return <div className="flex h-32 items-center justify-center text-xs text-slate-500">Chưa có movement thật.</div>
  }
  const max = Math.max(1, ...values)
  const color = tone === 'emerald' ? 'from-emerald-500 to-teal-300' : tone === 'amber' ? 'from-amber-500 to-orange-300' : 'from-blue-500 to-cyan-300'
  return (
    <div className="flex h-32 items-end gap-2">
      {values.map((value, index) => (
        <div key={index} className={`flex-1 rounded-t-lg bg-gradient-to-t ${color}`} style={{ height: `${Math.max(8, (value / max) * 100)}%` }} />
      ))}
    </div>
  )
}

export function YardPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const actions = useYardActions()

  const [selectedSlotId, setSelectedSlotId] = useState<string>()
  const [selectedPlacementId, setSelectedPlacementId] = useState<string>()
  const [selectedZoneId, setSelectedZoneId] = useState<string>()
  const [zoneDetailId, setZoneDetailId] = useState<string>()
  const [operation, setOperation] = useState<YardOperationMode>()

  // Filter state for Toolbar
  const [search, setSearch] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('ALL')
  const [zoneFilter, setZoneFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [projectFilter, setProjectFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
  const [detailDrawerSlot, setDetailDrawerSlot] = useState<YardSlotRuntime | null>(null)

  const { data: components = [] } = useComponents()
  const { data: workspace } = useYardWorkspace()
  const { data: dashboard } = useYardDashboard()

  const zones = workspace?.zones ?? []
  const slots = workspace?.slots ?? []
  const movements = workspace?.movements ?? []
  const cranes = workspace?.cranes ?? []
  const dashboardData = dashboard?.data
  const dashboardMovementCounts = dashboardData?.payload?.movementCounts

  const normalizedMovementCounts = Array.isArray(dashboardMovementCounts)
    ? dashboardMovementCounts.reduce(
        (counts, row) => {
          const key = row.type.toLowerCase()
          if (key === 'place' || key === 'move' || key === 'remove' || key === 'adjust') counts[key] += row.count
          return counts
        },
        { place: 0, move: 0, remove: 0, adjust: 0 },
      )
    : dashboardMovementCounts

  const metrics = dashboardData
    ? {
        zones: dashboardData.totalZones,
        totalSlots: dashboardData.totalSlots,
        occupiedSlots: dashboardData.occupiedSlots,
        placements: dashboardData.activePlacementCount,
        occupancyRate: dashboardData.totalSlots
          ? Math.round((dashboardData.occupiedSlots / dashboardData.totalSlots) * 100)
          : 0,
        zoneUtilization: dashboardData.payload?.zoneUtilization ?? [],
        totalWeight: dashboardData.totalWeight,
        availableSlots: dashboardData.availableSlots,
        movementsToday: dashboardData.movementToday,
        movementCounts: normalizedMovementCounts,
        craneAvailableCount: dashboardData.availableCraneCount,
      }
    : undefined

  const updateZone = useUpdateYardZone()
  const deleteZone = useDeleteYardZone()

  const tab = yardTabs.find((item) => item[2] === location.pathname)?.[0] ?? 'overview'
  const selectedSlot = slots.find((item) => item.id === selectedSlotId) ?? slots[0]
  const selectedPlacement = selectedSlot?.placements.find((item) => item.id === selectedPlacementId) ?? selectedSlot?.placements[0]

  useEffect(() => {
    const focusComponentId = window.sessionStorage.getItem('yard-focus-component-id')
    if (!focusComponentId || !slots.length) return

    for (const slot of slots) {
      const placement = slot.placements.find((item) => item.itemId === focusComponentId)
      if (!placement) continue

      navigate('/yard/map-2d')
      setSelectedZoneId(slot.zone.id)
      setSelectedSlotId(slot.id)
      setSelectedPlacementId(placement.id)
      window.sessionStorage.removeItem('yard-focus-component-id')
      break
    }
  }, [navigate, slots])

  async function editZone(zone: { id: string; code: string; name: string }) {
    const name = window.prompt('Tên zone', zone.name)
    if (!name || name.trim() === zone.name) return
    await updateZone.mutateAsync({ id: zone.id, name: name.trim() })
  }

  async function removeZone(zone: { id: string; code: string; name: string }) {
    if (!window.confirm(`Xóa zone ${zone.code}? Chỉ xóa được zone chưa có slot.`)) return
    await deleteZone.mutateAsync(zone.id)
    if (selectedZoneId === zone.id) setSelectedZoneId(undefined)
  }

  // Dynamic filter option lists
  const warehouses = ['Bãi tập kết chính (Main Yard)', 'Bãi kết cấu phụ (Aux Yard)']
  const projectCodes = useMemo(() => {
    const set = new Set<string>()
    slots.forEach((s) => {
      s.placements.forEach((p) => {
        if (p.itemCode) set.add(p.itemCode.split('-')[0])
      })
    })
    return Array.from(set)
  }, [slots])

  // Contextual Slot filtering
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      const matchSearch =
        !search ||
        `${slot.code} ${slot.zone.name} ${slot.zone.code} ${slot.placements.map((p) => p.itemCode).join(' ')}`
          .toLowerCase()
          .includes(search.toLowerCase())

      const matchZone = zoneFilter === 'ALL' || slot.zone.code === zoneFilter || slot.zone.id === zoneFilter
      const matchStatus = statusFilter === 'ALL' || slot.status === statusFilter
      const matchProject =
        projectFilter === 'ALL' || slot.placements.some((p) => p.itemCode?.startsWith(projectFilter))

      return matchSearch && matchZone && matchStatus && matchProject
    })
  }, [slots, search, zoneFilter, statusFilter, projectFilter])

  const pageSize = 14
  const pagedSlots = filteredSlots.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    setPage(1)
  }, [filteredSlots.length, search, zoneFilter, statusFilter, projectFilter])

  const movementsToday = dashboardData?.movementToday ?? 0
  const overloadedZones = dashboardData?.overloadedZoneCount ?? 0
  const emptySlots = Math.max(0, (metrics?.totalSlots ?? 0) - (metrics?.occupiedSlots ?? 0))

  const movementSegments = [
    { label: 'Nhập bãi', value: normalizedMovementCounts?.place ?? 0, color: '#14c987' },
    { label: 'Di chuyển', value: normalizedMovementCounts?.move ?? 0, color: '#1d7cff' },
    { label: 'Xuất bãi', value: normalizedMovementCounts?.remove ?? 0, color: '#f59e0b' },
  ]
  const slotSegments = [
    { label: 'Đang dùng', value: metrics?.occupiedSlots ?? 0, color: '#1d7cff' },
    { label: 'Trống', value: emptySlots, color: '#14c987' },
    { label: 'Cảnh báo', value: overloadedZones, color: '#ef4444' },
  ]

  return (
    <EnterpriseWorkspace
      eyebrow="SteelTrack Yard"
      title="Bãi tập kết"
      description="QC hoàn thành → nhập bãi → lưu vị trí → điều chuyển → xuất bãi"
      breadcrumbs={['Vận hành', 'Bãi tập kết']}
      tabs={yardTabs.map(([id, label, path]) => ({ id, label, path }))}
      activeTab={tab}
    >
      <div className="space-y-2 text-xs -mt-2">
        {/* Phase 1: ENTERPRISE KPI CARDS */}
        <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
          <EnterpriseKpiCard
            title="Sức chứa bãi Tập kết"
            value={`${metrics?.occupiedSlots ?? 0}/${metrics?.totalSlots ?? 0}`}
            tone="blue"
            icon={<Warehouse size={15} />}
          />
          <EnterpriseKpiCard
            title="Sức chứa khả dụng"
            value={`${emptySlots} slot trống`}
            tone="cyan"
            icon={<MapPinned size={15} />}
          />
          <EnterpriseKpiCard
            title="Cấu kiện lưu bãi"
            value={formatQuantity(metrics?.placements ?? 0, 0)}
            tone="emerald"
            icon={<Boxes size={15} />}
          />
          <EnterpriseKpiCard
            title="Giao dịch bãi hôm nay"
            value={formatQuantity(movementsToday, 0)}
            tone="purple"
            icon={<Activity size={15} />}
          />
          <EnterpriseKpiCard
            title="Zone quá tải (>=90%)"
            value={formatQuantity(overloadedZones, 0)}
            tone={overloadedZones ? 'red' : 'amber'}
            icon={<Radio size={15} />}
          />
          <EnterpriseKpiCard
            title="Cầu trục vận hành"
            value={`${metrics?.craneAvailableCount ?? 0}/${cranes.length}`}
            tone="cyan"
            icon={<Construction size={15} />}
          />
        </div>

        {/* Phase 3: COMPACT TOOLBAR */}
        <EnterprisePanel className="rounded-xl -mt-1">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_160px_160px_160px_160px_110px_110px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setPage(1)
              }}
              placeholder="Tìm mã slot, tên zone, mã cấu kiện, dự án..."
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
            />

            <select
              value={warehouseFilter}
              onChange={(e) => {
                setWarehouseFilter(e.target.value)
                setPage(1)
              }}
              className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
            >
              <option value="ALL">Tất cả bãi tập kết</option>
              {warehouses.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>

            <select
              value={zoneFilter}
              onChange={(e) => {
                setZoneFilter(e.target.value)
                setPage(1)
              }}
              className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
            >
              <option value="ALL">Tất cả Zone</option>
              {zones.map((z) => (
                <option key={z.id} value={z.code}>{z.code} · {z.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="AVAILABLE">AVAILABLE (Sẵn sàng)</option>
              <option value="OCCUPIED">OCCUPIED (Đang dùng)</option>
              <option value="BLOCKED">BLOCKED (Tạm khóa)</option>
            </select>

            <select
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value)
                setPage(1)
              }}
              className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
            >
              <option value="ALL">Tất cả dự án</option>
              {projectCodes.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setPage(1)}
              className="h-9 self-end rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
            >
              Tìm kiếm
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setWarehouseFilter('ALL')
                setZoneFilter('ALL')
                setStatusFilter('ALL')
                setProjectFilter('ALL')
                setPage(1)
              }}
              className="h-9 self-end rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Làm mới
            </button>
          </div>
        </EnterprisePanel>

        {/* Phase 2: ANALYTICS DASHBOARD WIDGETS */}
        <section className="grid gap-1 grid-cols-1 md:grid-cols-3">
          <CockpitChartCard title="Sức chứa bãi" heightClass="h-[170px]" chartHeightClass="h-[74px]">
            <YardDonut centerValue={`${metrics?.occupancyRate ?? 0}%`} centerLabel="Occupancy" segments={slotSegments} />
          </CockpitChartCard>
          <CockpitChartCard title="Luồng vận hành" heightClass="h-[170px]" chartHeightClass="h-[74px]">
            <YardDonut centerValue={formatQuantity(dashboardData?.movementMonth ?? 0, 0)} centerLabel="giao dịch" segments={movementSegments} />
          </CockpitChartCard>
          <CockpitChartCard title="Biến động bãi" heightClass="h-[170px]" chartHeightClass="h-[74px]" action={<span className="text-[10px] text-slate-500">Tháng này</span>}>
            <YardMiniTrend values={[]} tone="emerald" />
          </CockpitChartCard>
        </section>

        {/* Phase 4: HERO TABLE & TAB WORKSPACE */}
        <div className={`grid ${inventoryGridGap} xl:grid-cols-12`}>
          <div className="xl:col-span-8 space-y-1">
            <EnterprisePanel className="rounded-xl">
              <div className="mb-1 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Danh sách vị trí Slot bãi tập kết (Yard Slots)</h3>
                  <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-400/20">
                    {filteredSlots.length} slot bãi
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedModalOpen(true)}
                  className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition"
                >
                  Xem tất cả
                </button>
              </div>

              <div className="h-[380px] overflow-auto scrollbar-none rounded-lg border border-white/10">
                <table className="w-full min-w-[900px] table-fixed text-sm border-collapse">
                  <thead
                    className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                    style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                  >
                    <tr>
                      {['Vị trí Slot', 'Zone', 'Tầng khả dụng', 'Cấu kiện lưu bãi', 'Khối lượng (tấn)', 'Trạng thái', 'Thao tác'].map(
                        (header, idx) => (
                          <th
                            key={header}
                            className={`px-2 py-2 text-xs font-semibold text-slate-300 ${idx === 6 ? 'text-right' : 'text-left'}`}
                          >
                            {header}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedSlots.map((slot) => (
                      <tr
                        key={slot.id}
                        onClick={() => {
                          setSelectedSlotId(slot.id)
                          setSelectedZoneId(slot.zone.id)
                        }}
                        className={`${inventoryTableRow} cursor-pointer`}
                      >
                        <td className="px-2 py-1.5 font-mono font-semibold text-cyan-300 text-xs">{slot.code}</td>
                        <td className="px-2 py-1.5 text-white truncate font-medium">{slot.zone.name}</td>
                        <td className="px-2 py-1.5 font-mono text-slate-300 text-xs">
                          {slot.currentStackLevel}/{slot.maxStackLevel} tầng
                        </td>
                        <td className="px-2 py-1.5 text-slate-300 text-xs truncate">
                          {slot.placements.map((p) => p.itemCode).join(', ') || '—'}
                        </td>
                        <td className="px-2 py-1.5 font-mono text-slate-200 text-xs">
                          {fmt(slot.placements.reduce((sum, p) => sum + Number(p.weight || 0), 0))}
                        </td>
                        <td className="px-2 py-1.5">
                          <span
                            className={`rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${
                              slot.status === 'AVAILABLE'
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                : slot.status === 'OCCUPIED'
                                  ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                                  : 'border-red-500/30 bg-red-500/10 text-red-300'
                            }`}
                          >
                            {slot.status}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDetailDrawerSlot(slot)
                            }}
                            className="inline-flex items-center gap-0.5 rounded bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
                          >
                            Chi tiết <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!pagedSlots.length ? (
                      <tr>
                        <td colSpan={7} className="px-2 py-10">
                          <ModuleEmptyState
                            icon={<Warehouse size={18} />}
                            title="Chưa có dữ liệu slot bãi"
                            description="Không tìm thấy slot nào thỏa mãn điều kiện lọc hiện tại."
                          />
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <DataTablePagination page={page} pageSize={pageSize} total={filteredSlots.length} onPageChange={setPage} />
            </EnterprisePanel>

            <YardTabWorkspace
              tab={tab}
              zones={zones}
              slots={slots}
              metrics={metrics}
              movements={movements}
              cranes={cranes}
              selectedSlotId={selectedSlot?.id}
              selectedZoneId={selectedZoneId}
              selectedPlacementId={selectedPlacementId}
              onSelectZone={setSelectedZoneId}
              onOpenZoneDetail={setZoneDetailId}
              onEditZone={editZone}
              onDeleteZone={removeZone}
              onCreateZone={actions.openCreateZone}
              onCreateSlot={actions.openCreateSlot}
              onOpenOperation={setOperation}
            />
          </div>

          <aside className="space-y-1 xl:col-span-4">
            <div className="rounded-xl border border-white/10 bg-[#08111f] p-3 flex flex-col gap-y-1">
              <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Thông tin vị trí Slot</h2>
              <div className="mt-1 space-y-1 text-xs text-slate-400">
                <div className="flex justify-between"><span>Zone</span><b className="text-slate-200">{selectedSlot?.zone.name ?? '--'}</b></div>
                <div className="flex justify-between"><span>Vị trí</span><b className="text-cyan-300 font-mono">{selectedSlot?.code ?? '--'}</b></div>
                <div className="flex justify-between"><span>Trạng thái</span><b className="text-emerald-300">{selectedSlot?.status ?? '--'}</b></div>
                <div className="flex justify-between"><span>Cấu kiện</span><b className="text-slate-200 font-mono">{selectedSlot?.placements.length ?? 0}</b></div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#08111f] p-3 flex flex-col gap-y-1">
              <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Chi tiết cấu kiện</h2>
              {selectedPlacement ? (
                <div className="mt-1 space-y-1 text-xs text-slate-400">
                  <div className="text-sm font-semibold text-cyan-300 font-mono">{selectedPlacement.itemCode}</div>
                  <div>{selectedPlacement.itemName ?? selectedPlacement.itemType}</div>
                  <div>Tầng L{selectedPlacement.stackLevel}</div>
                  <div>Khối lượng <span className="font-mono tabular-nums">{fmt(selectedPlacement.weight)}</span> tấn</div>
                </div>
              ) : (
                <p className="mt-1 text-xs text-slate-500 py-1">Chọn cấu kiện trên sơ đồ.</p>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-[#08111f] p-3 flex flex-col gap-y-1">
              <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Cầu trục vận hành</h2>
              <div className="mt-1 space-y-1">
                {cranes.slice(0, 4).map((crane) => (
                  <div key={crane.id} className="flex justify-between rounded-xl border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs text-slate-400">
                    <span className="flex gap-2"><Construction size={14} />{crane.code}</span>
                    <span className="text-emerald-300 font-semibold">{crane.status}</span>
                  </div>
                ))}
                {!cranes.length && <p className="text-xs text-slate-500 py-1">Chưa cấu hình cầu trục.</p>}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#08111f] p-3 flex flex-col gap-y-1">
              <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Hoạt động gần đây</h2>
              <div className="mt-1 space-y-2">
                {movements.slice(0, 5).map((item) => (
                  <div key={item.id} className="border-l border-cyan-700 pl-2 text-[11px]">
                    <div className="text-cyan-300 font-mono">{item.itemCode} · {item.type}</div>
                    <div className="mt-0.5 text-slate-500 font-mono">{item.fromSlot?.code ?? 'Xưởng'} → {item.toSlot?.code ?? 'Rời bãi'}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <footer className="rounded-xl border border-white/10 bg-[#08111f] mt-1 flex flex-wrap gap-5 p-3 text-xs text-slate-400">
          <span><Truck size={14} className="mr-1 inline text-cyan-400"/> Luồng bãi realtime</span>
          <span>Occupied {metrics?.occupiedSlots ?? 0}/{metrics?.totalSlots ?? 0}</span>
          <span className="text-emerald-400">Cập nhật 5 giây/lần</span>
        </footer>

        {/* Phase 5: EXPANDED TABLE MODAL */}
        {expandedModalOpen
          ? createPortal(
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <h2 className="text-base font-bold text-white">Toàn bộ vị trí Slot bãi tập kết (Yard Slots)</h2>
                      <p className="text-xs text-slate-400">Tổng cộng {filteredSlots.length} slot bãi trong hệ thống</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedModalOpen(false)}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                    >
                      Đóng
                    </button>
                  </div>

                  <div className="h-[640px] overflow-y-auto rounded-xl border border-white/10">
                    <table className="w-full min-w-[900px] text-xs table-fixed border-collapse">
                      <thead
                        className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                        style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                      >
                        <tr>
                          {['Vị trí Slot', 'Zone', 'Tầng khả dụng', 'Cấu kiện lưu bãi', 'Khối lượng (tấn)', 'Trạng thái', 'Thao tác'].map(
                            (header, idx) => (
                              <th
                                key={header}
                                className={`px-2 py-2 text-left font-semibold text-slate-300 ${idx === 6 ? 'text-right' : ''}`}
                              >
                                {header}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSlots.map((slot) => (
                          <tr
                            key={slot.id}
                            onClick={() => {
                              setSelectedSlotId(slot.id)
                              setSelectedZoneId(slot.zone.id)
                              setExpandedModalOpen(false)
                            }}
                            className={`${inventoryTableRow} cursor-pointer`}
                          >
                            <td className="px-2 py-2 font-mono font-semibold text-cyan-300">{slot.code}</td>
                            <td className="px-2 py-2 text-white font-medium truncate">{slot.zone.name}</td>
                            <td className="px-2 py-2 font-mono text-slate-300">
                              {slot.currentStackLevel}/{slot.maxStackLevel} tầng
                            </td>
                            <td className="px-2 py-2 text-slate-300 truncate">
                              {slot.placements.map((p) => p.itemCode).join(', ') || '—'}
                            </td>
                            <td className="px-2 py-2 font-mono text-slate-200">
                              {fmt(slot.placements.reduce((sum, p) => sum + Number(p.weight || 0), 0))}
                            </td>
                            <td className="px-2 py-2">
                              <span
                                className={`rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${
                                  slot.status === 'AVAILABLE'
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                    : slot.status === 'OCCUPIED'
                                      ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                                      : 'border-red-500/30 bg-red-500/10 text-red-300'
                                }`}
                              >
                                {slot.status}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDetailDrawerSlot(slot)
                                  setExpandedModalOpen(false)
                                }}
                                className="inline-flex items-center gap-0.5 rounded bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
                              >
                                Chi tiết <ChevronRight size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <DataTablePagination page={page} pageSize={pageSize} total={filteredSlots.length} onPageChange={setPage} />
                </div>
              </div>,
              document.body,
            )
          : null}

        {/* Phase 6: DETAIL DRAWER */}
        <YardDetailDrawer slot={detailDrawerSlot} onClose={() => setDetailDrawerSlot(null)} />

        <YardOperationDialog
          mode={operation ?? 'inbound'}
          open={Boolean(operation)}
          onClose={() => setOperation(undefined)}
          slots={slots}
          cranes={cranes}
          components={components}
        />
        <YardZoneDetailDialog
          zoneId={zoneDetailId}
          slots={slots}
          selectedSlotId={selectedSlotId}
          onSelectSlot={(id) => setSelectedSlotId(id)}
          onClose={() => setZoneDetailId(undefined)}
        />
      </div>
    </EnterpriseWorkspace>
  )
}

function YardDetailDrawer({ slot, onClose }: { slot: YardSlotRuntime | null; onClose: () => void }) {
  if (!slot) return null

  return (
    <ModuleDetailDrawer
      open={Boolean(slot)}
      onClose={onClose}
      title={`Vị trí Slot ${slot.code}`}
      subtitle={`Thuộc Zone: ${slot.zone.name} (${slot.zone.code})`}
      size="md"
    >
      <div className="space-y-3 text-sm text-slate-300">
        <section className="grid gap-2 md:grid-cols-2">
          <div className="rounded-lg border border-cyan-300/10 bg-slate-950/35 px-3 py-2">
            <p className="text-[11px] text-slate-500">Mã Slot</p>
            <p className="mt-1 text-sm text-white font-semibold font-mono">{slot.code}</p>
          </div>
          <div className="rounded-lg border border-cyan-300/10 bg-slate-950/35 px-3 py-2">
            <p className="text-[11px] text-slate-500">Zone tập kết</p>
            <p className="mt-1 text-sm text-white font-medium">{slot.zone.name}</p>
          </div>
          <div className="rounded-lg border border-cyan-300/10 bg-slate-950/35 px-3 py-2">
            <p className="text-[11px] text-slate-500">Sức chứa tầng</p>
            <p className="mt-1 text-sm text-white font-medium font-mono">{slot.currentStackLevel}/{slot.maxStackLevel} tầng</p>
          </div>
          <div className="rounded-lg border border-cyan-300/10 bg-slate-950/35 px-3 py-2">
            <p className="text-[11px] text-slate-500">Trạng thái Slot</p>
            <p className="mt-1 text-sm text-emerald-400 font-semibold">{slot.status}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-cyan-300/10 bg-slate-950/25 p-3 space-y-2">
          <h3 className="text-sm font-semibold text-white">Danh sách cấu kiện đang lưu giữ ({slot.placements.length})</h3>
          <div className="space-y-1.5">
            {slot.placements.map((item) => (
              <div key={item.id} className="flex justify-between items-center rounded-xl border border-white/10 bg-white/5 p-2 text-xs">
                <div>
                  <div className="text-cyan-300 font-mono font-semibold">{item.itemCode}</div>
                  <div className="text-slate-400 text-[10px]">{item.itemName || item.itemType}</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-white">Tầng L{item.stackLevel}</div>
                  <div className="text-slate-400 text-[10px]">{fmt(item.weight)} tấn</div>
                </div>
              </div>
            ))}
            {!slot.placements.length && <ModuleEmptyState title="Slot đang trống" description="Chưa có cấu kiện xếp chồng tại slot này." />}
          </div>
        </section>
      </div>
    </ModuleDetailDrawer>
  )
}
