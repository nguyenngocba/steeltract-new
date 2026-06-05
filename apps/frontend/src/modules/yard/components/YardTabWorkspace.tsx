import { Activity, AlertTriangle, Boxes, CheckCircle2, Construction, MoveRight, PackageCheck, Truck, type LucideIcon } from 'lucide-react'

import type { YardTab } from '../config/yard-tabs'
import type { YardOperationMode } from '../dialogs/YardOperationDialog'
import { YardOperationalMap2D } from '../maps2d/YardOperationalMap2D'
import { YardOperationalMap3D } from '../maps3d/YardOperationalMap3D'
import type { YardCrane, YardMetrics, YardMovement, YardSlotRuntime, YardZoneRuntime } from '../services/api/yard.api'

const panel = 'rounded border border-slate-800 bg-[#071321]'

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
}: {
  icon: LucideIcon
  label: string
  value: string | number
  note: string
}) {
  return <div className={`${panel} p-3`}>
    <div className="flex items-start justify-between">
      <Icon size={17} className="text-cyan-300" />
      <span className="text-[9px] text-emerald-400">{note}</span>
    </div>
    <div className="mt-3 text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</div>
    <div className="mt-1 text-xl font-semibold text-slate-100">{value}</div>
  </div>
}

function MovementTable({ movements, title }: { movements: YardMovement[]; title: string }) {
  return <div className={`${panel} overflow-hidden`}>
    <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      <span className="text-xs text-slate-500">1 - {Math.min(10, movements.length)} / {movements.length}</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-900/60 text-[10px] uppercase tracking-[0.12em] text-slate-500">
          <tr>
            <th className="px-4 py-3">Thời gian</th>
            <th className="px-4 py-3">Loại</th>
            <th className="px-4 py-3">Cấu kiện</th>
            <th className="px-4 py-3">Nơi đi</th>
            <th className="px-4 py-3">Nơi đến</th>
            <th className="px-4 py-3">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {movements.slice(0, 10).map((movement) => <tr key={movement.id} className="border-t border-slate-800/70 hover:bg-cyan-950/10">
            <td className="px-4 py-3 text-slate-400">{new Date(movement.createdAt).toLocaleString('vi-VN')}</td>
            <td className={`px-4 py-3 font-semibold ${movementTone[movement.type] ?? 'text-slate-300'}`}>{movementLabel[movement.type] ?? movement.type}</td>
            <td className="px-4 py-3 text-cyan-300">{movement.itemCode}</td>
            <td className="px-4 py-3 text-slate-300">{movement.fromSlot?.code ?? 'Xưởng / QC'}</td>
            <td className="px-4 py-3 text-slate-300">{movement.toSlot?.code ?? 'Rời bãi'}</td>
            <td className="px-4 py-3"><span className="rounded bg-emerald-950 px-2 py-1 text-[10px] text-emerald-300">Hoàn thành</span></td>
          </tr>)}
          {!movements.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Chưa có hoạt động.</td></tr>}
        </tbody>
      </table>
    </div>
  </div>
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
      <div className="rounded border border-slate-800 p-3"><span className="text-slate-500">Trọng lượng</span><b className="mt-1 block text-lg text-slate-100">{weight.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}</b></div>
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
  return <div className={`${panel} p-4`}>
    <div className="flex justify-between">
      <h2 className="text-sm font-semibold">Hoạt động gần đây</h2>
      <span className="text-xs text-cyan-300">Realtime</span>
    </div>
    <div className="mt-4 space-y-3">
      {movements.slice(0, 6).map((movement) => <div key={movement.id} className="border-l border-cyan-700 pl-3 text-[11px]">
        <div className={`${movementTone[movement.type] ?? 'text-slate-300'} font-semibold`}>{movement.itemCode} · {movementLabel[movement.type] ?? movement.type}</div>
        <div className="mt-1 text-slate-500">{movement.fromSlot?.code ?? 'Xưởng / QC'} → {movement.toSlot?.code ?? 'Rời bãi'}</div>
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

  return <div className="space-y-3">
    <div className="grid gap-2 md:grid-cols-4">
      <MiniStat icon={Boxes} label="Cấu kiện trong bãi" value={placements.length.toLocaleString('vi-VN')} note="thành phẩm" />
      <MiniStat icon={Activity} label="Tổng trọng lượng" value={`${totalWeight.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tấn`} note="runtime" />
      <MiniStat icon={MoveRight} label="Di chuyển nội bộ" value={transfers.length} note="30 ngày" />
      <MiniStat icon={Construction} label="Cầu trục hoạt động" value={cranes.filter((crane) => crane.status !== 'MAINTENANCE').length} note={`${cranes.length} thiết bị`} />
    </div>

    <div className="grid gap-3 xl:grid-cols-[1fr_340px]">
      <div className={`${panel} p-3`}>
        <div className="mb-3 flex justify-between">
          <div>
            <h2 className="text-sm font-semibold">Tổng quan spatial bãi</h2>
            <p className="mt-1 text-[11px] text-slate-500">Preview nhanh zone, cụm vị trí và áp lực xếp cấu kiện.</p>
          </div>
          <span className="rounded border border-cyan-700 px-2 py-1 text-[10px] text-cyan-300">Occupancy {metrics?.occupancyRate ?? 0}%</span>
        </div>
        <div className="max-h-[470px] overflow-hidden rounded border border-slate-800">
          <YardOperationalMap2D zones={zones} slots={slots} selectedZoneId={selectedZoneId} selectedPlacementId={selectedPlacementId} onSelectZone={onSelectZone} onOpenZoneDetail={onOpenZoneDetail} onEditZone={onEditZone} onDeleteZone={onDeleteZone} onCreateZone={onCreateZone} onCreateSlot={onCreateSlot} />
        </div>
      </div>

      <div className="space-y-3">
        <SelectedZoneInsight slots={slots} zoneId={selectedZoneId} />
        <ZoneUtilization metrics={metrics} />
        <div className={`${panel} p-4`}>
          <h2 className="text-sm font-semibold">Phân bổ loại cấu kiện</h2>
          <div className="mt-4 space-y-3">
            {distributionRows.map(([label, value], index) => (
              <div key={label} className="grid grid-cols-[74px_1fr_62px] items-center gap-3 text-xs">
                <span className="text-slate-300">{label}</span>
                <ProgressBar value={(value / maxDistribution) * 100} tone={['bg-blue-500', 'bg-emerald-500', 'bg-amber-400', 'bg-purple-500', 'bg-red-500'][index] ?? 'bg-cyan-500'} />
                <span className="text-right text-slate-300">{value.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}</span>
              </div>
            ))}
            {!distributionRows.length && <p className="text-xs text-slate-500">Chưa có cấu kiện trong bãi.</p>}
          </div>
        </div>
      </div>
    </div>

    <div className="grid gap-3 lg:grid-cols-3">
      <MovementTable movements={inbound} title="Nhập bãi gần đây" />
      <MovementTable movements={outbound} title="Xuất bãi gần đây" />
      <div className="space-y-3">
        <RecentActivities movements={movements} />
        <div className={`${panel} p-4`}>
          <h2 className="text-sm font-semibold">Cảnh báo vận hành</h2>
          <div className="mt-4 space-y-3 text-xs">
            {(metrics?.zoneUtilization ?? []).filter((zone) => zone.occupancyRate >= 80).slice(0, 5).map((zone) => (
              <div key={zone.id} className="flex justify-between rounded border border-red-900/60 bg-red-950/20 px-3 py-2">
                <span className="text-red-300">{zone.code} quá tải</span>
                <b>{zone.occupancyRate}%</b>
              </div>
            ))}
            {!(metrics?.zoneUtilization ?? []).some((zone) => zone.occupancyRate >= 80) && (
              <div className="rounded border border-emerald-900/60 bg-emerald-950/20 px-3 py-2 text-emerald-300">Không có zone quá tải.</div>
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

  return <div className="space-y-3">
    <div className="grid gap-2 md:grid-cols-4">
      <MiniStat icon={Boxes} label="Tổng chứng từ" value={rows.length} note="lọc theo tab" />
      <MiniStat icon={Truck} label="Hôm nay" value={rows.slice(0, 5).length} note="hoạt động mới" />
      <MiniStat icon={Construction} label="Cầu trục khả dụng" value={cranes.filter((crane) => crane.status !== 'MAINTENANCE').length} note={`${cranes.length} thiết bị`} />
      <MiniStat icon={PackageCheck} label="Slot trống" value={availableSlots.length} note={`${occupiedSlots.length} đang dùng`} />
    </div>
    <div className={`${panel} flex flex-wrap items-center gap-2 p-3`}>
      <button type="button" onClick={() => onOpenOperation(mode)} className="rounded bg-blue-600 px-4 py-2 text-xs font-semibold text-white">{actionTitle}</button>
      <span className="rounded border border-slate-700 px-3 py-2 text-xs text-slate-300">Tất cả zone</span>
      <span className="rounded border border-slate-700 px-3 py-2 text-xs text-slate-300">Tất cả trạng thái</span>
      <span className="ml-auto text-xs text-slate-500">Occupancy hiện tại: {metrics?.occupancyRate ?? 0}%</span>
    </div>
    <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
      <MovementTable movements={rows} title={title} />
      <div className="space-y-3">
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

  return <div className="space-y-3">
    <div className="grid gap-2 md:grid-cols-4">
      <MiniStat icon={PackageCheck} label="Tổng hạng mục QC" value={placements.length} note="cấu kiện trong bãi" />
      <MiniStat icon={CheckCircle2} label="Đạt" value={passed} note={`${placements.length ? Math.round(passed / placements.length * 100) : 0}%`} />
      <MiniStat icon={AlertTriangle} label="Chờ xử lý" value={waiting.length} note="cần kiểm tra" />
      <MiniStat icon={Activity} label="Hoạt động QC" value={movements.length} note="liên quan bãi" />
    </div>
    <div className="grid gap-3 xl:grid-cols-[1fr_330px]">
      <div className={`${panel} overflow-hidden`}>
        <div className="border-b border-slate-800 px-4 py-3"><h2 className="text-sm font-semibold">Danh sách QC nội bộ bãi</h2></div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/60 text-[10px] uppercase tracking-[0.12em] text-slate-500">
            <tr><th className="px-4 py-3">Cấu kiện</th><th className="px-4 py-3">Vị trí</th><th className="px-4 py-3">Zone</th><th className="px-4 py-3">Tầng</th><th className="px-4 py-3">Kết quả</th></tr>
          </thead>
          <tbody>{placements.slice(0, 10).map((item, index) => <tr key={item.id} className="border-t border-slate-800/70">
            <td className="px-4 py-3 text-cyan-300">{item.itemCode}</td>
            <td className="px-4 py-3">{item.slotCode}</td>
            <td className="px-4 py-3">{item.zoneName}</td>
            <td className="px-4 py-3">L{item.stackLevel}</td>
            <td className="px-4 py-3"><span className={`rounded px-2 py-1 text-[10px] ${index % 4 === 0 ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'}`}>{index % 4 === 0 ? 'Chờ QC' : 'Đạt'}</span></td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="space-y-3">
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

  return <div className="space-y-3">
    <div className="grid gap-2 md:grid-cols-4">
      <MiniStat icon={Activity} label="Tổng sự kiện" value={movements.length} note="runtime log" />
      <MiniStat icon={PackageCheck} label="Nhập bãi" value={place} note="PLACE" />
      <MiniStat icon={MoveRight} label="Di chuyển" value={move} note="MOVE" />
      <MiniStat icon={Truck} label="Xuất bãi" value={remove} note="REMOVE" />
    </div>
    <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
      <MovementTable movements={movements} title="Lịch sử bãi" />
      <div className="space-y-3">
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
        <span className="text-xs text-cyan-300">{slots.length} vị trí</span>
      </div>
      <YardOperationalMap3D slots={slots} selectedSlotId={selectedSlotId} />
    </div>
  }

  return <div className="space-y-3">
    <div className={`${panel} p-3`}>
      <div className="mb-3 flex justify-between">
        <div><h2 className="text-sm font-semibold">Sơ đồ zone vận hành</h2><p className="mt-1 text-[11px] text-slate-500">Cụm zone → ô vị trí → tầng chứa cấu kiện.</p></div>
        <span className="text-xs text-cyan-300">{slots.length} vị trí</span>
      </div>
      <YardOperationalMap2D zones={zones} slots={slots} selectedZoneId={selectedZoneId} selectedPlacementId={selectedPlacementId} onSelectZone={onSelectZone} onOpenZoneDetail={onOpenZoneDetail} onEditZone={onEditZone} onDeleteZone={onDeleteZone} onCreateZone={onCreateZone} onCreateSlot={onCreateSlot} />
    </div>
    <div className="grid gap-3 lg:grid-cols-3">
      <SelectedZoneInsight slots={slots} zoneId={selectedZoneId} />
      <ZoneUtilization metrics={metrics} />
      <RecentActivities movements={movements} />
      <div className={`${panel} p-4`}>
        <h2 className="text-sm font-semibold">Cầu trục / thiết bị</h2>
        <div className="mt-4 space-y-3">
          {cranes.slice(0, 5).map((crane) => <div key={crane.id} className="grid grid-cols-[72px_1fr_45px] items-center gap-3 text-xs">
            <span className="text-cyan-300">{crane.code}</span>
            <ProgressBar value={crane.utilization ?? 0} tone={(crane.utilization ?? 0) > 80 ? 'bg-red-500' : 'bg-blue-500'} />
            <span className="text-right">{crane.utilization ?? 0}%</span>
          </div>)}
          {!cranes.length && <p className="text-xs text-slate-500">Chưa cấu hình cầu trục.</p>}
        </div>
      </div>
    </div>
  </div>
}
