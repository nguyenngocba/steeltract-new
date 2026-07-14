import { Activity, AlertTriangle, Boxes, CheckCircle2, Construction, MoveRight, PackageCheck, Truck, type LucideIcon } from 'lucide-react'
import { lazy, Suspense, useMemo, useState } from 'react'

import type { YardTab } from '../config/yard-tabs'
import type { YardOperationMode } from '../dialogs/YardOperationDialog'
import type { YardCrane, YardMetrics, YardMovement, YardSlotRuntime, YardZoneRuntime } from '../services/api/yard.api'
import { useYardWorkspace } from '../hooks/queries/useYardRuntime'
import { ModuleEmptyState, ModuleLoadingState } from '@/shared/ui/modules'
import { formatDateTime, formatQuantity } from '@/shared/utils/number-format'
import {
  CockpitChartCard,
  CockpitEmptyState,
  CockpitKpiCard,
  CockpitRecentList,
  CockpitSidebarStats,
  CockpitStatusList,
  CockpitTableShell,
  DataTablePagination,
  COCKPIT_SHELL,
} from '@/shared/ui/cockpit'

const YardOperationalMap2D = lazy(() => import('../maps2d/YardOperationalMap2D').then((module) => ({ default: module.YardOperationalMap2D })))
const YardOperationalMap3D = lazy(() => import('../maps3d/YardOperationalMap3D').then((module) => ({ default: module.YardOperationalMap3D })))

const panel = COCKPIT_SHELL

const movementLabel: Record<string, string> = {
  PLACE: 'Nhập bãi',
  MOVE: 'Di chuyển',
  REMOVE: 'Xuất bãi',
}

const movementTone: Record<string, string> = {
  PLACE: 'text-emerald-300',
  MOVE: 'text-cyan-300',
  REMOVE: 'text-amber-300',
}

function ProgressBar({ value, tone = 'bg-cyan-500' }: { value: number; tone?: string }) {
  return <div className="h-2 overflow-hidden rounded-full bg-slate-800">
    <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(4, Math.min(100, value))}%` }} />
  </div>
}

function MiniStat({
  icon: Icon,
  label,
  value,
  note,
  tone = 'blue',
  trend,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  note: string
  tone?: any
  trend?: number[]
}) {
  return (
    <CockpitKpiCard
      title={label}
      value={value}
      note={note}
      tone={tone}
      icon={<Icon size={15} />}
      trend={trend}
    />
  )
}

function MovementTable({ movements, title, page: controlledPage, total: controlledTotal, onPageChange }: { movements: YardMovement[]; title: string; page?: number; total?: number; onPageChange?: (page: number) => void }) {
  const [localPage, setLocalPage] = useState(1)
  const page = controlledPage ?? localPage
  const pageSize = 10
  const total = controlledTotal ?? movements.length
  const paginatedMovements = useMemo(() => {
    return controlledPage ? movements : movements.slice((page - 1) * pageSize, page * pageSize)
  }, [controlledPage, movements, page])

  return (
    <CockpitTableShell>
      <div className="flex items-center justify-between border-b border-cyan-400/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-250">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <thead className="bg-transparent text-slate-300 border-b border-cyan-400/10">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold">Thời gian</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold">Loại</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold">Cấu kiện</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold">Nơi đi</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold">Nơi đến</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {paginatedMovements.map((movement) => (
              <tr key={movement.id} className="hover:bg-cyan-400/[0.04] border-b border-white/[0.04] cursor-pointer">
                <td className="px-4 py-2.5 text-xs text-slate-400 font-mono tabular-nums">{formatDateTime(movement.createdAt)}</td>
                <td className={`px-4 py-2.5 text-xs font-semibold ${movementTone[movement.type] ?? 'text-slate-300'}`}>{movementLabel[movement.type] ?? movement.type}</td>
                <td className="px-4 py-2.5 text-xs text-cyan-300 font-mono">{movement.itemCode}</td>
                <td className="px-4 py-2.5 text-xs text-slate-300 font-mono">{movement.fromSlot?.code ?? 'Xưởng / QC'}</td>
                <td className="px-4 py-2.5 text-xs text-slate-300 font-mono">{movement.toSlot?.code ?? 'Rời bãi'}</td>
                <td className="px-4 py-2.5 text-xs"><span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] text-emerald-300">Hoàn thành</span></td>
              </tr>
            ))}
            {!movements.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Chưa có hoạt động.</td></tr>}
          </tbody>
        </table>
      </div>
      {total > pageSize && (
        <DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange ?? setLocalPage} />
      )}
    </CockpitTableShell>
  )
}

function ZoneUtilization({ metrics }: { metrics?: YardMetrics }) {
  return <div className={`${panel} p-4`}>
    <h2 className="text-sm font-semibold">Áp lực theo zone</h2>
    <div className="mt-4 space-y-3">
      {metrics?.zoneUtilization.slice(0, 8).map((zone) => <div key={zone.id} className="grid grid-cols-[72px_1fr_42px] items-center gap-3 text-xs">
        <span className="font-semibold text-cyan-300">{zone.code}</span>
        <ProgressBar value={zone.occupancyRate} tone={zone.occupancyRate > 80 ? 'bg-red-500' : zone.occupancyRate > 55 ? 'bg-amber-400' : 'bg-emerald-500'} />
        <span className="text-right text-slate-300">{zone.occupancyRate}%</span>
      </div>)}
      {!metrics?.zoneUtilization.length && <p className="text-xs text-slate-500">Chưa có zone.</p>}
    </div>
  </div>
}

function SelectedZoneInsight({ slots, zoneId }: { slots: YardSlotRuntime[]; zoneId?: string }) {
  const zoneSlots = zoneId
    ? slots.filter((slot) => slot.zone.id === zoneId)
    : []
  const zone = zoneSlots[0]?.zone
  const placements = zoneSlots.flatMap((slot) => slot.placements.map((placement) => ({ ...placement, slotCode: slot.code })))
  const occupied = zoneSlots.filter((slot) => slot.placements.length).length
  const maxStack = zoneSlots.reduce((sum, slot) => sum + slot.maxStackLevel, 0)
  const usedStack = zoneSlots.reduce((sum, slot) => sum + slot.currentStackLevel, 0)
  const weight = placements.reduce((sum, placement) => sum + Number(placement.weight ?? 0), 0)

  return <div className={`${panel} p-4`}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold">Thông số zone đang chọn</h2>
        <p className="mt-1 text-xs text-slate-500">{zone ? `${zone.code} · ${zone.name}` : 'Chọn một zone trên sơ đồ 2D'}</p>
      </div>
      {zone ? <span className="rounded border border-cyan-700 px-2 py-1 text-[10px] text-cyan-300">{occupied}/{zoneSlots.length} slot</span> : null}
    </div>
    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
      <div className="rounded border border-slate-800 p-3"><span className="text-slate-500">Cấu kiện</span><b className="mt-1 block text-lg text-slate-100">{placements.length}</b></div>
      <div className="rounded border border-slate-800 p-3"><span className="text-slate-500">Trọng lượng</span><b className="mt-1 block text-lg text-slate-100">{formatQuantity(weight, 1)}</b></div>
      <div className="col-span-2 rounded border border-slate-800 p-3">
        <div className="mb-2 flex justify-between"><span className="text-slate-500">Tầng sử dụng</span><b>{usedStack}/{maxStack}</b></div>
        <ProgressBar value={maxStack ? usedStack / maxStack * 100 : 0} tone="bg-cyan-500" />
      </div>
    </div>
    <div className="mt-3 max-h-40 space-y-2 overflow-auto">
      {placements.slice(0, 8).map((placement) => <div key={placement.id} className="flex justify-between rounded border border-slate-800 px-2 py-1.5 text-xs">
        <span className="text-cyan-300">{placement.itemCode}</span>
        <span className="text-slate-400">{placement.slotCode} / L{placement.stackLevel}</span>
      </div>)}
      {zone && !placements.length ? <p className="text-xs text-slate-500">Zone đang trống.</p> : null}
    </div>
  </div>
}

function RecentActivities({ movements }: { movements: YardMovement[] }) {
  return <div className={`${panel} p-3 flex flex-col gap-y-1`}>
    <div className="flex justify-between items-center">
      <h2 className="text-sm font-semibold text-slate-200">Hoạt động gần đây</h2>
      <span className="text-[10px] text-cyan-300 font-mono">Realtime</span>
    </div>
    <div className="mt-1 space-y-1">
      {movements.slice(0, 6).map((movement) => <div key={movement.id} className="border-l-2 border-cyan-700 pl-2 text-[11px]">
        <div className={`${movementTone[movement.type] ?? 'text-slate-300'} font-semibold font-mono`}>{movement.itemCode} · {movementLabel[movement.type] ?? movement.type}</div>
        <div className="mt-0.5 text-slate-500 font-mono">{movement.fromSlot?.code ?? 'Xưởng / QC'} → {movement.toSlot?.code ?? 'Rời bãi'}</div>
      </div>)}
    </div>
  </div>
}

function YardComponentsTab({ slots }: { slots: YardSlotRuntime[] }) {
  const placements = slots.flatMap((slot) => slot.placements.map((placement) => ({
    ...placement,
    slotCode: slot.code,
    zoneCode: slot.zone.code,
    zoneName: slot.zone.name,
  })))

  return <div className={`${panel} border-0 ring-0 bg-transparent shadow-none rounded-none overflow-auto scrollbar-none`}>
    <div className="flex items-center justify-between border-b border-cyan-400/10 px-4 py-3">
      <h2 className="text-sm font-semibold text-slate-250">Cấu kiện trong bãi</h2>
      <span className="text-xs text-cyan-300 font-mono">{formatQuantity(placements.length, 0)} cấu kiện</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] table-fixed text-sm">
        <thead className="border-b border-cyan-400/10 bg-transparent text-slate-300">
          <tr>
            {['Mã cấu kiện', 'Tên cấu kiện', 'Zone', 'Vị trí', 'Tầng', 'Số lượng', 'Khối lượng'].map((heading) => (
              <th key={heading} className="px-4 py-2.5 text-left text-xs font-semibold">{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {placements.map((placement) => (
            <tr key={placement.id} className="border-b border-white/[0.04] hover:bg-cyan-400/[0.04]">
              <td className="px-4 py-2.5 text-xs font-mono text-cyan-300">{placement.itemCode}</td>
              <td className="px-4 py-2.5 text-xs text-slate-200">{placement.itemName ?? placement.itemType ?? '-'}</td>
              <td className="px-4 py-2.5 text-xs text-slate-300">{placement.zoneCode} · {placement.zoneName}</td>
              <td className="px-4 py-2.5 text-xs font-mono text-slate-300">{placement.slotCode}</td>
              <td className="px-4 py-2.5 text-xs font-mono text-slate-300">L{placement.stackLevel}</td>
              <td className="px-4 py-2.5 text-xs font-mono text-slate-300">{formatQuantity(placement.quantity, 2)}</td>
              <td className="px-4 py-2.5 text-xs font-mono text-slate-300">{formatQuantity(placement.weight ?? 0, 2)} tấn</td>
            </tr>
          ))}
          {!placements.length ? <tr><td colSpan={7} className="px-4 py-8"><ModuleEmptyState title="Chưa có cấu kiện trong bãi" description="Dữ liệu sẽ xuất hiện khi phát sinh nhập bãi." /></td></tr> : null}
        </tbody>
      </table>
    </div>
  </div>
}

function YardTrackingTab({ zones, slots, movements }: { zones: YardZoneRuntime[]; slots: YardSlotRuntime[]; movements: YardMovement[] }) {
  return <div className="grid gap-1 xl:grid-cols-[minmax(0,1fr)_330px]">
    <div className={`${panel} p-3`}>
      <div className="mb-3 flex justify-between">
        <div>
          <h2 className="text-sm font-semibold">Live Tracking bãi</h2>
          <p className="mt-1 text-[11px] text-slate-500">Theo dõi vị trí cấu kiện và luồng di chuyển gần nhất từ dữ liệu runtime.</p>
        </div>
        <span className="text-xs text-cyan-300 font-mono">{formatQuantity(movements.length, 0)} movement</span>
      </div>
      <Suspense fallback={<ModuleLoadingState label="Đang tải sơ đồ live tracking..." variant="analytics" />}>
        <YardOperationalMap2D zones={zones} slots={slots} onSelectZone={() => undefined} />
      </Suspense>
    </div>
    <aside className="space-y-1">
      <RecentActivities movements={movements} />
      <MovementTable movements={movements.slice(0, 10)} title="Nhật ký live" />
    </aside>
  </div>
}

function getPlacementRows(slots: YardSlotRuntime[]) {
  return slots.flatMap((slot) => slot.placements.map((placement) => ({
    ...placement,
    slotId: slot.id,
    slotCode: slot.code,
    zoneCode: slot.zone.code,
    zoneName: slot.zone.name,
    currentStackLevel: slot.currentStackLevel,
    maxStackLevel: slot.maxStackLevel,
  })))
}

function groupSlotsByZone(slots: YardSlotRuntime[]) {
  return slots.reduce<Record<string, { zone: YardSlotRuntime['zone']; slots: YardSlotRuntime[] }>>((acc, slot) => {
    acc[slot.zone.id] ??= { zone: slot.zone, slots: [] }
    acc[slot.zone.id].slots.push(slot)
    return acc
  }, {})
}

function slotRate(slot: YardSlotRuntime) {
  return slot.maxStackLevel ? slot.currentStackLevel / slot.maxStackLevel * 100 : 0
}

function rateTone(rate: number) {
  if (rate >= 90) return 'red'
  if (rate >= 70) return 'amber'
  if (rate > 0) return 'cyan'
  return 'emerald'
}

function YardMap2DTab({
  zones,
  slots,
  selectedZoneId,
  selectedPlacementId,
  onSelectZone,
  onOpenZoneDetail,
  onEditZone,
  onDeleteZone,
  onCreateZone,
  onCreateSlot,
}: {
  zones: YardZoneRuntime[]
  slots: YardSlotRuntime[]
  selectedZoneId?: string
  selectedPlacementId?: string
  onSelectZone: (id: string) => void
  onOpenZoneDetail?: (id: string) => void
  onEditZone?: (zone: { id: string; code: string; name: string }) => void
  onDeleteZone?: (zone: { id: string; code: string; name: string }) => void
  onCreateZone?: () => void
  onCreateSlot?: (zoneId?: string) => void
}) {
  return <div className="space-y-1">
    <div className={`${panel} p-3`}>
      <div className="mb-3 flex justify-between">
        <div><h2 className="text-sm font-semibold">Bản đồ 2D vận hành</h2><p className="mt-1 text-[11px] text-slate-500">Zone, slot, màu occupancy và drill-down vị trí từ runtime bãi.</p></div>
        <span className="text-xs text-cyan-300 font-mono">{formatQuantity(slots.length, 0)} vị trí</span>
      </div>
      <Suspense fallback={<ModuleLoadingState label="Đang tải sơ đồ 2D..." variant="analytics" />}>
        <YardOperationalMap2D zones={zones} slots={slots} selectedZoneId={selectedZoneId} selectedPlacementId={selectedPlacementId} onSelectZone={onSelectZone} onOpenZoneDetail={onOpenZoneDetail} onEditZone={onEditZone} onDeleteZone={onDeleteZone} onCreateZone={onCreateZone} onCreateSlot={onCreateSlot} />
      </Suspense>
    </div>
  </div>
}

function YardLocationsTab({ slots, movements, metrics }: { slots: YardSlotRuntime[]; movements: YardMovement[]; metrics?: YardMetrics }) {
  const topOccupied = [...slots].sort((a, b) => slotRate(b) - slotRate(a)).slice(0, 6)
  const recentCodes = new Set(movements.flatMap((movement) => [movement.fromSlot?.code, movement.toSlot?.code]).filter(Boolean) as string[])
  return <div className="grid gap-1 xl:grid-cols-[minmax(0,1fr)_330px]">
    <CockpitTableShell>
      <div className="flex items-center justify-between border-b border-cyan-400/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-250">Vị trí bãi</h2>
        <span className="text-xs text-cyan-300 font-mono">{formatQuantity(slots.length, 0)} slot</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] table-fixed text-sm">
          <thead className="border-b border-cyan-400/10 bg-transparent text-slate-300">
            <tr>{['Zone', 'Slot', 'Trạng thái', 'Tầng', 'Cấu kiện', 'Occupancy'].map((heading) => <th key={heading} className="px-4 py-2.5 text-left text-xs font-semibold">{heading}</th>)}</tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot.id} className="border-b border-white/[0.04] hover:bg-cyan-400/[0.04]">
                <td className="px-4 py-2.5 text-xs text-slate-300">{slot.zone.code} · {slot.zone.name}</td>
                <td className="px-4 py-2.5 text-xs font-mono text-cyan-300">{slot.code}</td>
                <td className="px-4 py-2.5 text-xs text-slate-300">{slot.status}</td>
                <td className="px-4 py-2.5 text-xs font-mono text-slate-300">L{slot.currentStackLevel}/{slot.maxStackLevel}</td>
                <td className="px-4 py-2.5 text-xs font-mono text-slate-300">{formatQuantity(slot.placements.length, 0)}</td>
                <td className="px-4 py-2.5"><ProgressBar value={slotRate(slot)} tone={slotRate(slot) >= 90 ? 'bg-red-500' : slotRate(slot) >= 70 ? 'bg-amber-400' : 'bg-cyan-500'} /></td>
              </tr>
            ))}
            {!slots.length ? <tr><td colSpan={6} className="px-4 py-8"><CockpitEmptyState title="Chưa có vị trí bãi" description="Tạo zone và slot để bắt đầu quản lý bãi." /></td></tr> : null}
          </tbody>
        </table>
      </div>
    </CockpitTableShell>
    <aside className="space-y-1">
      <CockpitChartCard title="Top occupied locations" heightClass="h-[170px]" chartHeightClass="h-[74px]"><CockpitStatusList items={topOccupied.map((slot) => ({ id: slot.id, label: slot.code, value: `${formatQuantity(slotRate(slot), 0)}%`, statusTone: rateTone(slotRate(slot)) }))} /></CockpitChartCard>
      <CockpitChartCard title="Capacity efficiency" heightClass="h-[170px]" chartHeightClass="h-[74px]"><ZoneUtilization metrics={metrics} /></CockpitChartCard>
      <CockpitChartCard title="Recently updated" heightClass="h-[170px]" chartHeightClass="h-[74px]"><CockpitRecentList items={slots.filter((slot) => recentCodes.has(slot.code)).slice(0, 5).map((slot) => ({ id: slot.id, title: slot.code, subtitle: `${slot.zone.code} · ${slot.placements.length} cấu kiện`, statusDot: 'bg-cyan-400' }))} emptyMessage="Chưa có vị trí phát sinh movement." /></CockpitChartCard>
    </aside>
  </div>
}

function YardDispatchTab({ slots, movements, metrics }: { slots: YardSlotRuntime[]; movements: YardMovement[]; metrics?: YardMetrics }) {
  const available = slots.filter((slot) => slot.currentStackLevel < slot.maxStackLevel)
  const conflicts = (metrics?.zoneUtilization ?? []).filter((zone) => zone.occupancyRate >= 90)
  return <div className="grid gap-1 xl:grid-cols-[minmax(0,1fr)_330px]">
    <div className={`${panel} min-h-[420px] p-4`}>
      <div className="mb-4 flex items-center justify-between">
        <div><h2 className="text-sm font-semibold text-white">Điều phối bãi</h2><p className="mt-1 text-[11px] text-slate-500">Điều phối hiển thị khả năng tiếp nhận và xung đột từ dữ liệu runtime; chưa có workflow pending move riêng.</p></div>
      </div>
      <CockpitEmptyState title="Chưa có lệnh điều phối chờ xử lý" description="Khi backend có pending moves, danh sách sẽ hiển thị tại đây. Vị trí đề xuất bên phải đang lấy từ slot còn dung lượng thật." />
    </div>
    <aside className="space-y-1">
      <CockpitChartCard title="Suggested destinations" heightClass="h-[170px]" chartHeightClass="h-[74px]"><CockpitRecentList items={available.slice(0, 5).map((slot) => ({ id: slot.id, title: slot.code, subtitle: `${slot.zone.code} · còn ${slot.maxStackLevel - slot.currentStackLevel} tầng`, statusDot: 'bg-emerald-400' }))} emptyMessage="Không còn slot trống." /></CockpitChartCard>
      <CockpitChartCard title="Occupied conflicts" heightClass="h-[170px]" chartHeightClass="h-[74px]"><CockpitStatusList items={conflicts.map((zone) => ({ id: zone.id, label: zone.code, value: `${zone.occupancyRate}%`, statusTone: 'red' }))} emptyMessage="Không có zone quá tải." /></CockpitChartCard>
      <CockpitChartCard title="Available locations" heightClass="h-[170px]" chartHeightClass="h-[74px]"><CockpitSidebarStats stats={[{ label: 'Slot còn nhận', value: available.length, colorClass: 'text-emerald-300' }, { label: 'Slot đầy', value: slots.length - available.length, colorClass: 'text-amber-300' }]} /></CockpitChartCard>
    </aside>
  </div>
}

function YardHeatmapTab({ slots, metrics }: { slots: YardSlotRuntime[]; metrics?: YardMetrics }) {
  const groups = Object.values(groupSlotsByZone(slots)).sort((a, b) => a.zone.code.localeCompare(b.zone.code))
  return <div className="space-y-1">
    <div className="grid gap-1 md:grid-cols-3">
      <CockpitChartCard title="Zone utilization" heightClass="h-[170px]" chartHeightClass="h-[74px]"><CockpitStatusList items={(metrics?.zoneUtilization ?? []).slice(0, 5).map((zone) => ({ id: zone.id, label: zone.code, value: `${zone.occupancyRate}%`, statusTone: rateTone(zone.occupancyRate) }))} /></CockpitChartCard>
      <CockpitChartCard title="Slot utilization" heightClass="h-[170px]" chartHeightClass="h-[74px]"><CockpitSidebarStats stats={[{ label: 'Occupied', value: metrics?.occupiedSlots ?? 0, colorClass: 'text-cyan-300' }, { label: 'Available', value: Math.max(0, (metrics?.totalSlots ?? 0) - (metrics?.occupiedSlots ?? 0)), colorClass: 'text-emerald-300' }]} /></CockpitChartCard>
      <CockpitChartCard title="Overload indicators" heightClass="h-[170px]" chartHeightClass="h-[74px]"><CockpitStatusList items={(metrics?.zoneUtilization ?? []).filter((zone) => zone.occupancyRate >= 90).map((zone) => ({ id: zone.id, label: zone.code, value: `${zone.occupancyRate}%`, statusTone: 'red' }))} emptyMessage="Không có zone quá tải." /></CockpitChartCard>
    </div>
    <div className={`${panel} p-4`}>
      <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        {groups.map((group) => (
          <section key={group.zone.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <div className="mb-3 flex justify-between text-xs"><span className="font-semibold text-cyan-300">{group.zone.code}</span><span className="text-slate-500">{group.slots.length} slot</span></div>
            <div className="grid grid-cols-8 gap-1">
              {group.slots.map((slot) => {
                const rate = slotRate(slot)
                return <div key={slot.id} title={`${slot.code}: ${formatQuantity(rate, 0)}%`} className={`h-7 rounded border ${rate >= 90 ? 'border-red-400/30 bg-red-500/40' : rate >= 70 ? 'border-amber-400/30 bg-amber-400/35' : rate > 0 ? 'border-cyan-400/30 bg-cyan-400/30' : 'border-emerald-400/20 bg-emerald-400/12'}`} />
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  </div>
}

function YardTimelineTab({ movements }: { movements: YardMovement[] }) {
  return <div className="grid gap-1 xl:grid-cols-[minmax(0,1fr)_330px]">
    <MovementTable movements={movements} title="Timeline vận hành bãi" />
    <aside className="space-y-1">
      <CockpitChartCard title="Inbound" heightClass="h-[170px]" chartHeightClass="h-[74px]"><CockpitRecentList items={movements.filter((item) => item.type === 'PLACE').slice(0, 5).map((item) => ({ id: item.id, title: item.itemCode, subtitle: item.toSlot?.code ?? 'Nhập bãi', time: formatDateTime(item.createdAt), statusDot: 'bg-emerald-400' }))} /></CockpitChartCard>
      <CockpitChartCard title="Movements" heightClass="h-[170px]" chartHeightClass="h-[74px]"><CockpitRecentList items={movements.filter((item) => item.type === 'MOVE').slice(0, 5).map((item) => ({ id: item.id, title: item.itemCode, subtitle: `${item.fromSlot?.code ?? '-'} → ${item.toSlot?.code ?? '-'}`, time: formatDateTime(item.createdAt), statusDot: 'bg-cyan-400' }))} /></CockpitChartCard>
      <CockpitChartCard title="Outbound" heightClass="h-[170px]" chartHeightClass="h-[74px]"><CockpitRecentList items={movements.filter((item) => item.type === 'REMOVE').slice(0, 5).map((item) => ({ id: item.id, title: item.itemCode, subtitle: item.fromSlot?.code ?? 'Xuất bãi', time: formatDateTime(item.createdAt), statusDot: 'bg-amber-400' }))} /></CockpitChartCard>
    </aside>
  </div>
}

function YardOverviewTab({
  zones,
  slots,
  metrics,
  movements,
  cranes,
  selectedZoneId,
  selectedPlacementId,
  onSelectZone,
  onOpenZoneDetail,
  onEditZone,
  onDeleteZone,
  onCreateZone,
  onCreateSlot,
}: {
  zones: YardZoneRuntime[]
  slots: YardSlotRuntime[]
  metrics?: YardMetrics
  movements: YardMovement[]
  cranes: YardCrane[]
  selectedZoneId?: string
  selectedPlacementId?: string
  onSelectZone: (id: string) => void
  onOpenZoneDetail?: (id: string) => void
  onEditZone?: (zone: { id: string; code: string; name: string }) => void
  onDeleteZone?: (zone: { id: string; code: string; name: string }) => void
  onCreateZone?: () => void
  onCreateSlot?: (zoneId?: string) => void
}) {
  const inbound = movements.filter((movement) => movement.type === 'PLACE')
  const outbound = movements.filter((movement) => movement.type === 'REMOVE')
  const distributionRows = metrics?.componentDistribution ?? []
  const maxDistribution = Math.max(...distributionRows.map((row) => row.value), 1)

  return <div className="space-y-1">
    <div className="grid gap-1 md:grid-cols-4">
      <MiniStat icon={Boxes} label="Cấu kiện trong bãi" value={formatQuantity(metrics?.placements ?? 0, 0)} note="thành phẩm" tone="blue" />
      <MiniStat icon={Activity} label="Tổng trọng lượng" value={`${formatQuantity(metrics?.totalWeight ?? 0, 1)} tấn`} note="runtime" tone="cyan" />
      <MiniStat icon={MoveRight} label="Di chuyển nội bộ" value={metrics?.movementCounts?.move ?? 0} note="toàn bộ" tone="emerald" />
      <MiniStat icon={Construction} label="Cầu trục hoạt động" value={metrics?.craneAvailableCount ?? 0} note={`${cranes.length} thiết bị`} tone="purple" />
    </div>

    <div className="grid gap-1 xl:grid-cols-[1fr_340px]">
      <div className={`${panel} p-3 flex flex-col gap-y-1`}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Tổng quan spatial bãi</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">Preview nhanh zone, cụm vị trí và áp lực xếp cấu kiện.</p>
          </div>
          <span className="rounded border border-cyan-750 px-2 py-0.5 text-[10px] text-cyan-300 font-mono">Occupancy {metrics?.occupancyRate ?? 0}%</span>
        </div>
        <div className="max-h-[470px] overflow-hidden rounded-2xl border border-white/5 bg-slate-950/20">
          <Suspense fallback={<ModuleLoadingState label="Đang tải sơ đồ 2D..." variant="analytics" />}>
            <YardOperationalMap2D zones={zones} slots={slots} selectedZoneId={selectedZoneId} selectedPlacementId={selectedPlacementId} onSelectZone={onSelectZone} onOpenZoneDetail={onOpenZoneDetail} onEditZone={onEditZone} onDeleteZone={onDeleteZone} onCreateZone={onCreateZone} onCreateSlot={onCreateSlot} />
          </Suspense>
        </div>
      </div>

      <div className="space-y-1">
        <SelectedZoneInsight slots={slots} zoneId={selectedZoneId} />
        <ZoneUtilization metrics={metrics} />
        <div className={`${panel} p-3 flex flex-col gap-y-1`}>
          <h2 className="text-sm font-semibold text-slate-250">Phân bổ loại cấu kiện</h2>
          <div className="mt-1 space-y-1.5">
            {distributionRows.map((row, index) => (
              <div key={row.label} className="grid grid-cols-[74px_1fr_62px] items-center gap-1.5 text-xs">
                <span className="text-slate-350 truncate">{row.label}</span>
                <ProgressBar value={(row.value / maxDistribution) * 100} tone={['bg-blue-500', 'bg-emerald-500', 'bg-amber-400', 'bg-purple-500', 'bg-red-500'][index] ?? 'bg-cyan-500'} />
                <span className="text-right text-slate-300 font-mono tabular-nums">{formatQuantity(row.value, 1)}</span>
              </div>
            ))}
            {!distributionRows.length && <p className="text-xs text-slate-500 py-1">Chưa có cấu kiện trong bãi.</p>}
          </div>
        </div>
      </div>
    </div>

    <div className="grid gap-1 lg:grid-cols-3">
      <MovementTable movements={inbound} title="Nhập bãi gần đây" />
      <MovementTable movements={outbound} title="Xuất bãi gần đây" />
      <div className="space-y-1">
        <RecentActivities movements={movements} />
        <div className={`${panel} p-3 flex flex-col gap-y-1`}>
          <h2 className="text-sm font-semibold text-slate-250">Cảnh báo vận hành</h2>
          <div className="mt-1 space-y-1.5 text-xs">
            {(metrics?.zoneUtilization ?? []).filter((zone) => zone.occupancyRate >= 80).slice(0, 5).map((zone) => (
              <div key={zone.id} className="flex justify-between rounded border border-red-500/10 bg-red-500/[0.04] px-3 py-1.5">
                <span className="text-red-300">{zone.code} quá tải</span>
                <b className="font-mono tabular-nums text-red-300">{zone.occupancyRate}%</b>
              </div>
            ))}
            {!(metrics?.zoneUtilization ?? []).some((zone) => zone.occupancyRate >= 80) && (
              <div className="rounded border border-emerald-550/10 bg-emerald-950/10 px-3 py-1.5 text-emerald-300">Không có zone quá tải.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
}

function OperationTab({
  mode,
  slots,
  metrics,
  movements,
  cranes,
  onOpenOperation,
}: {
  mode: YardOperationMode
  slots: YardSlotRuntime[]
  metrics?: YardMetrics
  movements: YardMovement[]
  cranes: YardCrane[]
  onOpenOperation: (mode: YardOperationMode) => void
}) {
  const type = mode === 'inbound' ? 'PLACE' : mode === 'outbound' ? 'REMOVE' : 'MOVE'
  const rows = movements.filter((movement) => movement.type === type)
  const title = mode === 'inbound' ? 'Danh sách nhập bãi' : mode === 'outbound' ? 'Danh sách xuất bãi' : 'Danh sách di chuyển nội bộ'
  const actionTitle = mode === 'inbound' ? 'Tạo phiếu nhập bãi' : mode === 'outbound' ? 'Tạo phiếu xuất bãi' : 'Tạo lệnh chuyển nội bộ'
  const movementKey = mode === 'inbound' ? 'place' : mode === 'outbound' ? 'remove' : 'move'

  return <div className="space-y-1">
    <div className="grid gap-1 md:grid-cols-4">
      <MiniStat icon={Boxes} label="Tổng chứng từ" value={metrics?.movementCounts?.[movementKey] ?? 0} note="lọc theo tab" tone="blue" />
      <MiniStat icon={Truck} label="Hôm nay" value={metrics?.movementTodayCounts?.[movementKey] ?? 0} note="hoạt động mới" tone="cyan" />
      <MiniStat icon={Construction} label="Cầu trục khả dụng" value={metrics?.craneAvailableCount ?? 0} note={`${cranes.length} thiết bị`} tone="emerald" />
      <MiniStat icon={PackageCheck} label="Slot trống" value={metrics?.availableSlots ?? 0} note={`${metrics?.occupiedSlots ?? 0} đang dùng`} tone="amber" />
    </div>
    <div className={`${panel} flex flex-wrap items-center gap-1 p-2`}>
      <button type="button" onClick={() => onOpenOperation(mode)} className="rounded bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700">{actionTitle}</button>
      <span className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-350 bg-white/[0.02]">Tất cả zone</span>
      <span className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-350 bg-white/[0.02]">Tất cả trạng thái</span>
      <span className="ml-auto text-xs text-slate-500 font-mono">Occupancy hiện tại: {metrics?.occupancyRate ?? 0}%</span>
    </div>
    <div className="grid gap-1 xl:grid-cols-[1fr_320px]">
      <MovementTable movements={rows} title={title} />
      <div className="space-y-1">
        <ZoneUtilization metrics={metrics} />
        <RecentActivities movements={movements} />
      </div>
    </div>
  </div>
}

function QCTab({ slots, movements }: { slots: YardSlotRuntime[]; movements: YardMovement[] }) {
  const placements = slots.flatMap((slot) => slot.placements.map((placement) => ({ ...placement, slotCode: slot.code, zoneName: slot.zone.name })))
  const waiting: typeof placements = []
  const passed = 0

  const [page, setPage] = useState(1)
  const pageSize = 10
  const total = 0
  const paginatedPlacements = useMemo(() => {
    return placements.slice(0, 0)
  }, [placements, page])

  return <div className="space-y-1">
    <div className="grid gap-1 md:grid-cols-4">
      <MiniStat icon={PackageCheck} label="Tổng hạng mục QC" value={placements.length} note="cấu kiện trong bãi" tone="indigo" />
      <MiniStat icon={CheckCircle2} label="Đạt" value={passed} note={`${placements.length ? Math.round(passed / placements.length * 100) : 0}%`} tone="emerald" />
      <MiniStat icon={AlertTriangle} label="Chờ xử lý" value={waiting.length} note="cần kiểm tra" tone="amber" />
      <MiniStat icon={Activity} label="Hoạt động QC" value={movements.length} note="liên quan bãi" tone="blue" />
    </div>
    <div className="grid gap-1 xl:grid-cols-[1fr_330px]">
      <div className={`${panel} border-0 ring-0 bg-transparent shadow-none rounded-none overflow-auto scrollbar-none`}>
        <div className="border-b border-cyan-400/10 px-4 py-3"><h2 className="text-sm font-semibold text-slate-200">Danh sách QC nội bộ bãi</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-transparent text-slate-300 border-b border-cyan-400/10">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold">Cấu kiện</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold">Vị trí</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold">Zone</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold">Tầng</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold">Kết quả</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPlacements.map((item) => {
                return (
                  <tr key={item.id} className="hover:bg-cyan-400/[0.04] border-b border-white/[0.04] cursor-pointer">
                    <td className="px-4 py-2.5 text-xs text-cyan-300 font-mono">{item.itemCode}</td>
                    <td className="px-4 py-2.5 text-xs font-mono">{item.slotCode}</td>
                    <td className="px-4 py-2.5 text-xs">{item.zoneName}</td>
                    <td className="px-4 py-2.5 text-xs font-mono">L{item.stackLevel}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] text-slate-400">
                        Chưa có dữ liệu
                      </span>
                    </td>
                  </tr>
                )
              })}
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Chưa có dữ liệu QC.</td></tr>
            </tbody>
          </table>
        </div>
        {total > pageSize && (
          <DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
        )}
      </div>
      <div className="space-y-1">
        <div className={`${panel} p-4`}>
          <h2 className="text-sm font-semibold">Tỷ lệ QC</h2>
          <div className="mt-5 space-y-4 text-xs">
            <div><div className="mb-2 flex justify-between"><span>Đạt</span><b>{passed}</b></div><ProgressBar value={placements.length ? passed / placements.length * 100 : 0} tone="bg-emerald-500" /></div>
            <div><div className="mb-2 flex justify-between"><span>Chờ xử lý</span><b>{waiting.length}</b></div><ProgressBar value={placements.length ? waiting.length / placements.length * 100 : 0} tone="bg-amber-400" /></div>
          </div>
        </div>
        <RecentActivities movements={movements} />
      </div>
    </div>
  </div>
}

function HistoryTab({ movements, metrics }: { movements: YardMovement[]; metrics?: YardMetrics }) {
  const [componentQuery, setComponentQuery] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [dateQuery, setDateQuery] = useState('')
  const [typeQuery, setTypeQuery] = useState('')
  const [page, setPage] = useState(1)
  const { data: history } = useYardWorkspace({
    movementPage: page,
    movementLimit: 10,
    movementItem: componentQuery || undefined,
    movementLocation: locationQuery || undefined,
    movementDate: dateQuery || undefined,
    movementType: typeQuery || undefined,
  })
  const historyMovements = history?.movements ?? movements
  const place = history?.analytics.movementCounts.place ?? 0
  const move = history?.analytics.movementCounts.move ?? 0
  const remove = history?.analytics.movementCounts.remove ?? 0
  const historyTotal = history?.meta.movements.total ?? historyMovements.length

  return <div className="space-y-1">
    <div className="grid gap-1 md:grid-cols-4">
      <MiniStat icon={Activity} label="Tổng sự kiện" value={historyTotal} note="runtime log" tone="blue" />
      <MiniStat icon={PackageCheck} label="Nhập bãi" value={place} note="PLACE" tone="emerald" />
      <MiniStat icon={MoveRight} label="Di chuyển" value={move} note="MOVE" tone="cyan" />
      <MiniStat icon={Truck} label="Xuất bãi" value={remove} note="REMOVE" tone="amber" />
    </div>
    <div className={`${panel} grid gap-1 p-2 md:grid-cols-4`}>
      <input value={componentQuery} onChange={(event) => setComponentQuery(event.target.value)} className="h-9 rounded-lg border border-white/10 bg-slate-950/45 px-3 text-xs text-slate-100 outline-none placeholder:text-slate-500" placeholder="Lọc cấu kiện" />
      <input value={locationQuery} onChange={(event) => setLocationQuery(event.target.value)} className="h-9 rounded-lg border border-white/10 bg-slate-950/45 px-3 text-xs text-slate-100 outline-none placeholder:text-slate-500" placeholder="Lọc vị trí / zone" />
      <select value={typeQuery} onChange={(event) => setTypeQuery(event.target.value)} className="h-9 rounded-lg border border-white/10 bg-slate-950/45 px-3 text-xs text-slate-100 outline-none">
        <option value="">Tất cả loại</option>
        <option value="PLACE">Nhập bãi</option>
        <option value="MOVE">Di chuyển</option>
        <option value="REMOVE">Xuất bãi</option>
      </select>
      <input value={dateQuery} onChange={(event) => setDateQuery(event.target.value)} type="date" className="h-9 rounded-lg border border-white/10 bg-slate-950/45 px-3 text-xs text-slate-100 outline-none" />
    </div>
    <div className="grid gap-1 xl:grid-cols-[1fr_320px]">
      <MovementTable movements={historyMovements} title="Lịch sử bãi" page={page} total={historyTotal} onPageChange={setPage} />
      <div className="space-y-1">
        <div className={`${panel} p-4`}>
          <h2 className="text-sm font-semibold">Phân bổ sự kiện</h2>
          <div className="mt-4 space-y-3 text-xs">
            <div><div className="mb-2 flex justify-between"><span>Nhập bãi</span><b>{place}</b></div><ProgressBar value={historyTotal ? place / historyTotal * 100 : 0} tone="bg-emerald-500" /></div>
            <div><div className="mb-2 flex justify-between"><span>Di chuyển</span><b>{move}</b></div><ProgressBar value={historyTotal ? move / historyTotal * 100 : 0} tone="bg-cyan-500" /></div>
            <div><div className="mb-2 flex justify-between"><span>Xuất bãi</span><b>{remove}</b></div><ProgressBar value={historyTotal ? remove / historyTotal * 100 : 0} tone="bg-amber-400" /></div>
          </div>
        </div>
        <ZoneUtilization metrics={metrics} />
      </div>
    </div>
  </div>
}

export function YardTabWorkspace({
  tab,
  zones,
  slots,
  metrics,
  movements,
  cranes,
  selectedSlotId,
  selectedZoneId,
  selectedPlacementId,
  onSelectZone,
  onOpenZoneDetail,
  onEditZone,
  onDeleteZone,
  onCreateZone,
  onCreateSlot,
  onOpenOperation,
}: {
  tab: YardTab
  zones: YardZoneRuntime[]
  slots: YardSlotRuntime[]
  metrics?: YardMetrics
  movements: YardMovement[]
  cranes: YardCrane[]
  selectedSlotId?: string
  selectedZoneId?: string
  selectedPlacementId?: string
  onSelectZone: (id: string) => void
  onOpenZoneDetail?: (id: string) => void
  onEditZone?: (zone: { id: string; code: string; name: string }) => void
  onDeleteZone?: (zone: { id: string; code: string; name: string }) => void
  onCreateZone?: () => void
  onCreateSlot?: (zoneId?: string) => void
  onOpenOperation: (mode: YardOperationMode) => void
}) {
  if (tab === 'overview') {
    return <YardOverviewTab
      slots={slots}
      zones={zones}
      metrics={metrics}
      movements={movements}
      cranes={cranes}
      selectedZoneId={selectedZoneId}
      selectedPlacementId={selectedPlacementId}
      onSelectZone={onSelectZone}
      onOpenZoneDetail={onOpenZoneDetail}
      onEditZone={onEditZone}
      onDeleteZone={onDeleteZone}
      onCreateZone={onCreateZone}
      onCreateSlot={onCreateSlot}
    />
  }

  if (tab === 'map-2d') {
    return <YardMap2DTab
      zones={zones}
      slots={slots}
      selectedZoneId={selectedZoneId}
      selectedPlacementId={selectedPlacementId}
      onSelectZone={onSelectZone}
      onOpenZoneDetail={onOpenZoneDetail}
      onEditZone={onEditZone}
      onDeleteZone={onDeleteZone}
      onCreateZone={onCreateZone}
      onCreateSlot={onCreateSlot}
    />
  }

  if (tab === 'map-3d') {
    return <div className={`${panel} p-3`}>
      <div className="mb-3 flex justify-between">
        <div>
          <h2 className="text-sm font-semibold">Bản đồ 3D bãi</h2>
          <p className="mt-1 text-[11px] text-slate-500">Khôi phục YardOperationalMap3D: zone → slot → stack level → cấu kiện 3D.</p>
        </div>
        <span className="text-xs text-cyan-300 font-mono">{formatQuantity(slots.length, 0)} runtime slots</span>
      </div>
      {slots.length ? (
        <Suspense fallback={<ModuleLoadingState label="Đang tải bản đồ 3D..." variant="analytics" />}>
          <YardOperationalMap3D slots={slots} selectedSlotId={selectedSlotId} />
        </Suspense>
      ) : <ModuleEmptyState title="Chưa có dữ liệu bãi 3D" description="Dữ liệu sẽ xuất hiện khi có zone và slot thực tế." />}
    </div>
  }

  if (tab === 'locations') return <YardLocationsTab slots={slots} movements={movements} metrics={metrics} />
  if (tab === 'components') return <YardComponentsTab slots={slots} />
  if (tab === 'dispatch') return <YardDispatchTab slots={slots} movements={movements} metrics={metrics} />
  if (tab === 'tracking') return <YardTrackingTab zones={zones} slots={slots} movements={movements} />
  if (tab === 'heatmap') return <YardHeatmapTab slots={slots} metrics={metrics} />
  if (tab === 'timeline') return <YardTimelineTab movements={movements} />
  if (tab === 'history') return <HistoryTab movements={movements} metrics={metrics} />

  return <YardMap2DTab zones={zones} slots={slots} selectedZoneId={selectedZoneId} selectedPlacementId={selectedPlacementId} onSelectZone={onSelectZone} />
}
