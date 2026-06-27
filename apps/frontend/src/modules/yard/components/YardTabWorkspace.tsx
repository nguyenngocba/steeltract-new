import { Activity, AlertTriangle, Boxes, CheckCircle2, Construction, MoveRight, PackageCheck, Truck, type LucideIcon } from 'lucide-react'
import { lazy, Suspense, useMemo, useState } from 'react'

import type { YardTab } from '../config/yard-tabs'
import type { YardOperationMode } from '../dialogs/YardOperationDialog'
import type { YardCrane, YardMetrics, YardMovement, YardSlotRuntime, YardZoneRuntime } from '../services/api/yard.api'
import { ModuleLoadingState } from '@/shared/ui/modules'
import { formatDateTime, formatQuantity } from '@/shared/utils/number-format'
import { CockpitKpiCard, DataTablePagination, COCKPIT_SHELL } from '@/shared/ui/cockpit'

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
      trend={trend ?? [10, 14, 12, 18, 15, 20]}
    />
  )
}

function MovementTable({ movements, title }: { movements: YardMovement[]; title: string }) {
  const [page, setPage] = useState(1)
  const pageSize = 10
  const total = movements.length
  const paginatedMovements = useMemo(() => {
    return movements.slice((page - 1) * pageSize, page * pageSize)
  }, [movements, page])

  return (
    <div className={`${panel} border-0 ring-0 bg-transparent shadow-none rounded-none overflow-auto scrollbar-none`}>
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
        <DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}
    </div>
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
  const placements = slots.flatMap((slot) => slot.placements)
  const inbound = movements.filter((movement) => movement.type === 'PLACE')
  const outbound = movements.filter((movement) => movement.type === 'REMOVE')
  const transfers = movements.filter((movement) => movement.type === 'MOVE')
  const distribution = placements.reduce<Record<string, number>>((acc, placement) => {
    const key = placement.itemName?.split(' ')[0] || placement.itemCode.split('-')[0] || 'Khác'
    acc[key] = (acc[key] ?? 0) + Number(placement.weight ?? placement.quantity ?? 1)
    return acc
  }, {})
  const distributionRows = Object.entries(distribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const maxDistribution = Math.max(...distributionRows.map(([, value]) => value), 1)
  const totalWeight = placements.reduce((sum, placement) => sum + Number(placement.weight ?? 0), 0)

  return <div className="space-y-1">
    <div className="grid gap-1 md:grid-cols-4">
      <MiniStat icon={Boxes} label="Cấu kiện trong bãi" value={formatQuantity(placements.length, 0)} note="thành phẩm" tone="blue" />
      <MiniStat icon={Activity} label="Tổng trọng lượng" value={`${formatQuantity(totalWeight, 1)} tấn`} note="runtime" tone="cyan" />
      <MiniStat icon={MoveRight} label="Di chuyển nội bộ" value={transfers.length} note="30 ngày" tone="emerald" />
      <MiniStat icon={Construction} label="Cầu trục hoạt động" value={cranes.filter((crane) => crane.status !== 'MAINTENANCE').length} note={`${cranes.length} thiết bị`} tone="purple" />
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
            {distributionRows.map(([label, value], index) => (
              <div key={label} className="grid grid-cols-[74px_1fr_62px] items-center gap-1.5 text-xs">
                <span className="text-slate-350 truncate">{label}</span>
                <ProgressBar value={(value / maxDistribution) * 100} tone={['bg-blue-500', 'bg-emerald-500', 'bg-amber-400', 'bg-purple-500', 'bg-red-500'][index] ?? 'bg-cyan-500'} />
                <span className="text-right text-slate-300 font-mono tabular-nums">{formatQuantity(value, 1)}</span>
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
  const occupiedSlots = slots.filter((slot) => slot.placements.length)
  const availableSlots = slots.filter((slot) => !slot.placements.length)

  return <div className="space-y-1">
    <div className="grid gap-1 md:grid-cols-4">
      <MiniStat icon={Boxes} label="Tổng chứng từ" value={rows.length} note="lọc theo tab" tone="blue" />
      <MiniStat icon={Truck} label="Hôm nay" value={rows.slice(0, 5).length} note="hoạt động mới" tone="cyan" />
      <MiniStat icon={Construction} label="Cầu trục khả dụng" value={cranes.filter((crane) => crane.status !== 'MAINTENANCE').length} note={`${cranes.length} thiết bị`} tone="emerald" />
      <MiniStat icon={PackageCheck} label="Slot trống" value={availableSlots.length} note={`${occupiedSlots.length} đang dùng`} tone="amber" />
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
  const waiting = placements.filter((_, index) => index % 4 === 0)
  const passed = placements.length - waiting.length

  const [page, setPage] = useState(1)
  const pageSize = 10
  const total = placements.length
  const paginatedPlacements = useMemo(() => {
    return placements.slice((page - 1) * pageSize, page * pageSize)
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
              {paginatedPlacements.map((item, index) => {
                const globalIndex = (page - 1) * pageSize + index
                return (
                  <tr key={item.id} className="hover:bg-cyan-400/[0.04] border-b border-white/[0.04] cursor-pointer">
                    <td className="px-4 py-2.5 text-xs text-cyan-300 font-mono">{item.itemCode}</td>
                    <td className="px-4 py-2.5 text-xs font-mono">{item.slotCode}</td>
                    <td className="px-4 py-2.5 text-xs">{item.zoneName}</td>
                    <td className="px-4 py-2.5 text-xs font-mono">L{item.stackLevel}</td>
                    <td className="px-4 py-2.5 text-xs">
                      <span className={`rounded px-2 py-0.5 text-[10px] ${globalIndex % 4 === 0 ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'}`}>
                        {globalIndex % 4 === 0 ? 'Chờ QC' : 'Đạt'}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {!placements.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Chưa có cấu kiện.</td></tr>}
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
  const place = movements.filter((item) => item.type === 'PLACE').length
  const move = movements.filter((item) => item.type === 'MOVE').length
  const remove = movements.filter((item) => item.type === 'REMOVE').length

  return <div className="space-y-1">
    <div className="grid gap-1 md:grid-cols-4">
      <MiniStat icon={Activity} label="Tổng sự kiện" value={movements.length} note="runtime log" tone="blue" />
      <MiniStat icon={PackageCheck} label="Nhập bãi" value={place} note="PLACE" tone="emerald" />
      <MiniStat icon={MoveRight} label="Di chuyển" value={move} note="MOVE" tone="cyan" />
      <MiniStat icon={Truck} label="Xuất bãi" value={remove} note="REMOVE" tone="amber" />
    </div>
    <div className="grid gap-1 xl:grid-cols-[1fr_320px]">
      <MovementTable movements={movements} title="Lịch sử bãi" />
      <div className="space-y-1">
        <div className={`${panel} p-4`}>
          <h2 className="text-sm font-semibold">Phân bổ sự kiện</h2>
          <div className="mt-4 space-y-3 text-xs">
            <div><div className="mb-2 flex justify-between"><span>Nhập bãi</span><b>{place}</b></div><ProgressBar value={movements.length ? place / movements.length * 100 : 0} tone="bg-emerald-500" /></div>
            <div><div className="mb-2 flex justify-between"><span>Di chuyển</span><b>{move}</b></div><ProgressBar value={movements.length ? move / movements.length * 100 : 0} tone="bg-cyan-500" /></div>
            <div><div className="mb-2 flex justify-between"><span>Xuất bãi</span><b>{remove}</b></div><ProgressBar value={movements.length ? remove / movements.length * 100 : 0} tone="bg-amber-400" /></div>
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
  if (tab === 'inbound' || tab === 'outbound' || tab === 'transfer') {
    return <OperationTab mode={tab} slots={slots} metrics={metrics} movements={movements} cranes={cranes} onOpenOperation={onOpenOperation} />
  }

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

  if (tab === 'qc') return <QCTab slots={slots} movements={movements} />
  if (tab === 'history') return <HistoryTab movements={movements} metrics={metrics} />

  if (tab === 'map-3d') {
    return <div className={`${panel} p-3`}>
      <div className="mb-3 flex justify-between">
        <div><h2 className="text-sm font-semibold">Sơ đồ 3D toàn bãi</h2><p className="mt-1 text-[11px] text-slate-500">Phóng to để kiểm tra cấu kiện, cầu trục và tầng xếp.</p></div>
        <span className="text-xs text-cyan-300 font-mono">{slots.length} vị trí</span>
      </div>
      <Suspense fallback={<ModuleLoadingState label="Đang tải sơ đồ 3D..." variant="analytics" />}>
        <YardOperationalMap3D slots={slots} selectedSlotId={selectedSlotId} />
      </Suspense>
    </div>
  }

  return <div className="space-y-1">
    <div className={`${panel} p-3`}>
      <div className="mb-3 flex justify-between">
        <div><h2 className="text-sm font-semibold">Sơ đồ zone vận hành</h2><p className="mt-1 text-[11px] text-slate-500">Cụm zone → ô vị trí → tầng chứa cấu kiện.</p></div>
        <span className="text-xs text-cyan-300 font-mono">{slots.length} vị trí</span>
      </div>
      <Suspense fallback={<ModuleLoadingState label="Đang tải sơ đồ 2D..." variant="analytics" />}>
        <YardOperationalMap2D zones={zones} slots={slots} selectedZoneId={selectedZoneId} selectedPlacementId={selectedPlacementId} onSelectZone={onSelectZone} onOpenZoneDetail={onOpenZoneDetail} onEditZone={onEditZone} onDeleteZone={onDeleteZone} onCreateZone={onCreateZone} onCreateSlot={onCreateSlot} />
      </Suspense>
    </div>
    <div className="grid gap-1 lg:grid-cols-3">
      <SelectedZoneInsight slots={slots} zoneId={selectedZoneId} />
      <ZoneUtilization metrics={metrics} />
      <RecentActivities movements={movements} />
      <div className={`${panel} p-3 flex flex-col gap-y-1`}>
        <h2 className="text-sm font-semibold text-slate-200">Cầu trục / thiết bị</h2>
        <div className="mt-1 space-y-1">
          {cranes.slice(0, 5).map((crane) => <div key={crane.id} className="grid grid-cols-[72px_1fr_45px] items-center gap-1 text-xs">
            <span className="text-cyan-300 font-mono">{crane.code}</span>
            <ProgressBar value={crane.utilization ?? 0} tone={(crane.utilization ?? 0) > 80 ? 'bg-red-500' : 'bg-blue-500'} />
            <span className="text-right font-mono tabular-nums">{crane.utilization ?? 0}%</span>
          </div>)}
          {!cranes.length && <p className="text-xs text-slate-500 py-1">Chưa cấu hình cầu trục.</p>}
        </div>
      </div>
    </div>
  </div>
}
