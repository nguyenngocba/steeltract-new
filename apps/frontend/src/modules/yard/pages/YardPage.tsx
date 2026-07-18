import { useEffect, useState } from 'react'
import { Activity, Boxes, Construction, MapPinned, Radio, Search, Truck, Warehouse, type LucideIcon } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useComponents } from '@/modules/components/hooks/queries/useComponents'
import { EnterpriseWorkspace } from '@/shared/ui/enterprise'
import { ModuleFilterBar, moduleInput, moduleMutedButton, modulePanel, modulePrimaryButton } from '@/shared/ui/modules'
import { CockpitChartCard, CockpitKpiCard } from '@/shared/ui/cockpit'
import { YardTabWorkspace } from '../components/YardTabWorkspace'
import { YardZoneDetailDialog } from '../components/YardZoneDetailDialog'
import { yardTabs, type YardTab } from '../config/yard-tabs'
import { YardOperationDialog, type YardOperationMode } from '../dialogs/YardOperationDialog'
import { useCreateYardSlot, useCreateYardZone, useDeleteYardZone, useUpdateYardZone, useYardDashboard, useYardWorkspace } from '../hooks/queries/useYardRuntime'
import type { YardZoneRuntime } from '../services/api/yard.api'
import { formatQuantity } from '@/shared/utils/number-format'

const fmt = (value = 0) => formatQuantity(value, 2)
const panel = modulePanel
const input = moduleInput
const mutedButton = moduleMutedButton
const primaryButton = modulePrimaryButton

function YardKpiCard({
  icon: Icon,
  label,
  value,
  note,
  tone = 'cyan',
}: {
  icon: LucideIcon
  label: string
  value: string | number
  note: string
  tone?: 'cyan' | 'emerald' | 'amber' | 'red' | 'purple' | 'blue'
}) {
  return (
    <CockpitKpiCard
      title={label}
      value={value}
      note={note}
      tone={tone as any}
      icon={<Icon size={15} />}
    />
  )
}

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
  const gradient = segments.map((item) => {
    const start = cursor
    const end = cursor + item.value / total * 100
    cursor = end
    return `${item.color} ${start}% ${end}%`
  }).join(', ')

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
        <div key={index} className={`flex-1 rounded-t-lg bg-gradient-to-t ${color}`} style={{ height: `${Math.max(8, value / max * 100)}%` }} />
      ))}
    </div>
  )
}

type ZoneForm = {
  code: string
  name: string
  description: string
  width: string
  height: string
  color: string
}

type SlotForm = {
  zoneId: string
  code: string
  maxStackLevel: string
  x: string
  y: string
}

const defaultZoneForm = (index: number): ZoneForm => ({
  code: `ST-YARD-${String(index + 1).padStart(2, '0')}`,
  name: `Zone ${index + 1}`,
  description: '',
  width: '24',
  height: '18',
  color: '#06b6d4',
})

const makeSlotCode = (zone?: YardZoneRuntime, next = 1) => {
  const shortZone = zone?.code.replace(/^ST-YARD-/, '').replace(/^ZONE-/, '') || 'ZONE'
  return `${shortZone}-${String(next).padStart(2, '0')}`
}

export function YardPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [selectedSlotId, setSelectedSlotId] = useState<string>()
  const [selectedPlacementId, setSelectedPlacementId] = useState<string>()
  const [selectedZoneId, setSelectedZoneId] = useState<string>()
  const [zoneDetailId, setZoneDetailId] = useState<string>()
  const [operation, setOperation] = useState<YardOperationMode>()
  const [zoneForm, setZoneForm] = useState<ZoneForm | null>(null)
  const [slotForm, setSlotForm] = useState<SlotForm | null>(null)
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
    ? dashboardMovementCounts.reduce((counts, row) => {
        const key = row.type.toLowerCase()
        if (key === 'place' || key === 'move' || key === 'remove' || key === 'adjust') counts[key] += row.count
        return counts
      }, { place: 0, move: 0, remove: 0, adjust: 0 })
    : dashboardMovementCounts
  const metrics = dashboardData ? {
    zones: dashboardData.totalZones,
    totalSlots: dashboardData.totalSlots,
    occupiedSlots: dashboardData.occupiedSlots,
    placements: dashboardData.activePlacementCount,
    occupancyRate: dashboardData.totalSlots
      ? Math.round(dashboardData.occupiedSlots / dashboardData.totalSlots * 100)
      : 0,
    zoneUtilization: dashboardData.payload?.zoneUtilization ?? [],
    totalWeight: dashboardData.totalWeight,
    availableSlots: dashboardData.availableSlots,
    movementsToday: dashboardData.movementToday,
    movementCounts: normalizedMovementCounts,
    craneAvailableCount: dashboardData.availableCraneCount,
  } : undefined
  const updateZone = useUpdateYardZone()
  const deleteZone = useDeleteYardZone()
  const createZone = useCreateYardZone()
  const createSlot = useCreateYardSlot()
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

  function openCreateZone() {
    setZoneForm(defaultZoneForm(zones.length))
  }

  function openCreateSlot(zoneId = selectedZoneId) {
    const zone = zones.find((item) => item.id === zoneId) ?? zones[0]
    const zoneSlots = slots.filter((slot) => slot.zone.id === zone?.id)
    const next = zoneSlots.length + 1
    setSlotForm({
      zoneId: zone?.id ?? '',
      code: makeSlotCode(zone, next),
      maxStackLevel: '4',
      x: String((next - 1) % 8),
      y: String(Math.floor((next - 1) / 8)),
    })
  }

  async function submitZoneForm() {
    if (!zoneForm?.code.trim() || !zoneForm.name.trim()) return
    const zone = await createZone.mutateAsync({
      code: zoneForm.code.trim(),
      name: zoneForm.name.trim(),
      description: zoneForm.description.trim() || undefined,
      status: 'ACTIVE',
      originX: 0,
      originY: 0,
      width: Number(zoneForm.width) || 24,
      height: Number(zoneForm.height) || 18,
      color: zoneForm.color || '#06b6d4',
    }) as YardZoneRuntime
    setZoneForm(null)
    setSelectedZoneId(zone.id)
    navigate('/yard/map-2d')
  }

  async function submitSlotForm() {
    if (!slotForm?.zoneId || !slotForm.code.trim()) return
    await createSlot.mutateAsync({
      zoneId: slotForm.zoneId,
      code: slotForm.code.trim(),
      status: 'AVAILABLE',
      x: Number(slotForm.x) || 0,
      y: Number(slotForm.y) || 0,
      width: 1,
      height: 1,
      maxStackLevel: Number(slotForm.maxStackLevel) || 4,
    })
    setSelectedZoneId(slotForm.zoneId)
    setSlotForm(null)
    navigate('/yard/map-2d')
  }

  const movementsToday = dashboardData?.movementToday ?? 0
  const overloadedZones = dashboardData?.overloadedZoneCount ?? 0
  const movementTrend: number[] = []
  const stat = [
    [Warehouse, 'Occupied Slots', metrics?.occupiedSlots ?? 0, `${metrics?.totalSlots ?? 0} slot`, 'blue'],
    [MapPinned, 'Available Capacity', Math.max(0, (metrics?.totalSlots ?? 0) - (metrics?.occupiedSlots ?? 0)), 'slot trống', 'cyan'],
    [Boxes, 'Components In Yard', metrics?.placements ?? 0, 'cấu kiện', 'emerald'],
    [Activity, 'Movements Today', movementsToday, 'yard_movements', 'purple'],
    [Radio, 'Overloaded Zones', overloadedZones, '>= 90% capacity', overloadedZones ? 'red' : 'amber'],
  ] as const
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
      actions={<>
              <button onClick={openCreateZone} className={mutedButton}>+ Zone</button>
              <button onClick={() => openCreateSlot()} className={mutedButton}>+ Slot</button>
              <button onClick={() => setOperation('inbound')} className={primaryButton}>+ Nhập bãi</button>
              <button onClick={() => setOperation('outbound')} className={mutedButton}>Xuất bãi</button>
              <button onClick={() => setOperation('transfer')} className={mutedButton}>+ Chuyển nội bộ</button>
            </>}
    >

        {/* Unified 5-column grid KPI Strip with h-[108px] cards */}
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 md:grid-cols-5">
          {stat.map(([Icon, label, value, note, tone]) => (
            <YardKpiCard key={label} icon={Icon} label={label} value={value} note={note} tone={tone} />
          ))}
        </div>

        <ModuleFilterBar className="my-1">
          <div className="flex min-w-72 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/45 px-2 xl:col-span-5">
            <Search size={15} className="text-cyan-400" />
            <input className="h-8 w-full bg-transparent text-xs outline-none placeholder:text-slate-500" placeholder="Tìm vị trí, cấu kiện, zone..." />
          </div>
          <button className={`${mutedButton} xl:col-span-1`}>Tất cả zone</button>
          <button className={`${mutedButton} xl:col-span-1`}>Tất cả trạng thái</button>
          <button className={`${mutedButton} xl:col-span-1`}>Lớp hiển thị</button>
          <button className={`${mutedButton} xl:col-span-1`}>Làm mới</button>
        </ModuleFilterBar>

        {/* Unified Analytics Widget Grid using gap-1, h-[170px] cards, and h-[74px] charts */}
        <section className="mb-1 grid gap-1 grid-cols-1 md:grid-cols-3">
          <CockpitChartCard title="Sức chứa bãi" heightClass="h-[170px]" chartHeightClass="h-[74px]">
            <YardDonut centerValue={`${metrics?.occupancyRate ?? 0}%`} centerLabel="Occupancy" segments={slotSegments} />
          </CockpitChartCard>
          <CockpitChartCard title="Luồng vận hành" heightClass="h-[170px]" chartHeightClass="h-[74px]">
            <YardDonut centerValue={formatQuantity(dashboardData?.movementMonth ?? 0, 0)} centerLabel="giao dịch" segments={movementSegments} />
          </CockpitChartCard>
          <CockpitChartCard title="Biến động bãi" heightClass="h-[170px]" chartHeightClass="h-[74px]" action={<span className="text-[10px] text-slate-500">Tháng này</span>}>
            <YardMiniTrend values={movementTrend} tone="emerald" />
          </CockpitChartCard>
        </section>

        {/* Main content grid using gap-1 */}
        <div className="grid gap-1 xl:grid-cols-[1fr_330px]">
          <section className="space-y-1">
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
              onCreateZone={openCreateZone}
              onCreateSlot={openCreateSlot}
              onOpenOperation={setOperation}
            />
            {/* Drawers standard spacing: gap-1, space-y-1 */}
            <div className="grid gap-1 lg:grid-cols-2">
              <div className={`${panel} p-3 flex flex-col gap-y-1`}>
                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Chi tiết tầng · {selectedSlot?.code ?? '--'}</h2>
                <div className="mt-1 grid grid-cols-4 gap-1">
                  {Array.from({ length: selectedSlot?.maxStackLevel ?? 4 }, (_, index) => (
                    <div
                      key={index}
                      className={`rounded-xl border p-2 text-center text-xs font-mono ${
                        index < (selectedSlot?.currentStackLevel ?? 0)
                          ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200 shadow-[0_0_22px_rgba(34,211,238,0.12)]'
                          : 'border-white/10 bg-white/[0.035] text-slate-500'
                      }`}
                    >
                      L{index + 1}
                    </div>
                  ))}
                </div>
                <div className="mt-1 text-[11px] text-slate-500 font-mono">Đang dùng {selectedSlot?.currentStackLevel ?? 0}/{selectedSlot?.maxStackLevel ?? 0} tầng</div>
              </div>
              <div className={`${panel} p-3 flex flex-col gap-y-1`}>
                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Cấu kiện trong vị trí</h2>
                <div className="mt-1 space-y-1">
                  {selectedSlot?.placements.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedPlacementId(item.id)}
                      className={`flex w-full justify-between rounded-xl border px-3 py-1.5 text-left text-xs transition ${
                        selectedPlacement?.id === item.id
                          ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-100'
                          : 'border-white/10 bg-white/[0.035] text-slate-300 hover:border-cyan-400/40'
                      }`}
                    >
                      <span className="text-cyan-300 font-mono">{item.itemCode}</span>
                      <span className="font-mono tabular-nums">L{item.stackLevel} · {fmt(item.quantity)}</span>
                    </button>
                  ))}
                  {!selectedSlot?.placements.length && <p className="text-xs text-slate-500 py-1">Vị trí đang trống.</p>}
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-1">
            <div className={`${panel} p-3 flex flex-col gap-y-1`}>
              <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Thông tin vị trí</h2>
              <div className="mt-1 space-y-1 text-xs text-slate-400">
                <div className="flex justify-between"><span>Zone</span><b className="text-slate-200">{selectedSlot?.zone.name ?? '--'}</b></div>
                <div className="flex justify-between"><span>Vị trí</span><b className="text-cyan-300 font-mono">{selectedSlot?.code ?? '--'}</b></div>
                <div className="flex justify-between"><span>Trạng thái</span><b className="text-emerald-300">{selectedSlot?.status ?? '--'}</b></div>
                <div className="flex justify-between"><span>Cấu kiện</span><b className="text-slate-200 font-mono">{selectedSlot?.placements.length ?? 0}</b></div>
              </div>
            </div>
            <div className={`${panel} p-3 flex flex-col gap-y-1`}>
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
            <div className={`${panel} p-3 flex flex-col gap-y-1`}>
              <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Cầu trục</h2>
              <div className="mt-1 space-y-1">
                {cranes.slice(0, 4).map((crane) => (
                  <div key={crane.id} className="flex justify-between rounded-xl border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs text-slate-400">
                    <span className="flex gap-2"><Construction size={14} />{crane.code}</span>
                    <span className="text-emerald-300">{crane.status}</span>
                  </div>
                ))}
                {!cranes.length && <p className="text-xs text-slate-500 py-1">Chưa cấu hình cầu trục.</p>}
              </div>
            </div>
            <div className={`${panel} p-3 flex flex-col gap-y-1`}>
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
        <footer className={`${panel} mt-1 flex flex-wrap gap-5 p-3 text-xs text-slate-400`}>
          <span><Truck size={14} className="mr-1 inline text-cyan-400"/> Luồng bãi realtime</span>
          <span>Occupied {metrics?.occupiedSlots ?? 0}/{metrics?.totalSlots ?? 0}</span>
          <span className="text-emerald-400">Cập nhật 5 giây/lần</span>
        </footer>
        <YardOperationDialog mode={operation ?? 'inbound'} open={Boolean(operation)} onClose={() => setOperation(undefined)} slots={slots} cranes={cranes} components={components}/>
        <YardZoneDetailDialog zoneId={zoneDetailId} slots={slots} selectedSlotId={selectedSlotId} onSelectSlot={(id) => setSelectedSlotId(id)} onClose={() => setZoneDetailId(undefined)} />
        {zoneForm ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className={`w-full max-w-2xl overflow-hidden ${panel}`}>
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div><h2 className="text-base font-semibold">Tạo zone bãi</h2><p className="mt-1 text-xs text-slate-500">Zone sẽ hiển thị ngay trên sơ đồ 2D và nhận slot mới.</p></div>
              <button type="button" onClick={() => setZoneForm(null)} className={mutedButton}>Đóng</button>
            </div>
            <div className="grid gap-3 p-5 md:grid-cols-2">
              <input value={zoneForm.code} onChange={(event) => setZoneForm({ ...zoneForm, code: event.target.value })} className={input} placeholder="Mã zone" />
              <input value={zoneForm.name} onChange={(event) => setZoneForm({ ...zoneForm, name: event.target.value })} className={input} placeholder="Tên zone" />
              <input value={zoneForm.width} onChange={(event) => setZoneForm({ ...zoneForm, width: event.target.value })} className={input} placeholder="Chiều rộng sơ đồ" type="number" />
              <input value={zoneForm.height} onChange={(event) => setZoneForm({ ...zoneForm, height: event.target.value })} className={input} placeholder="Chiều cao sơ đồ" type="number" />
              <input value={zoneForm.color} onChange={(event) => setZoneForm({ ...zoneForm, color: event.target.value })} className={input} placeholder="Màu zone" type="color" />
              <textarea value={zoneForm.description} onChange={(event) => setZoneForm({ ...zoneForm, description: event.target.value })} className={`${input} h-24 py-2 md:col-span-2`} placeholder="Ghi chú zone" />
            </div>
            <footer className="flex justify-end gap-2 border-t border-white/10 px-5 py-4">
              <button type="button" onClick={() => setZoneForm(null)} className={mutedButton}>Hủy</button>
              <button type="button" onClick={submitZoneForm} disabled={createZone.isPending} className={primaryButton}>{createZone.isPending ? 'Đang tạo...' : 'Tạo zone'}</button>
            </footer>
          </div>
        </div> : null}
        {slotForm ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className={`w-full max-w-2xl overflow-hidden ${panel}`}>
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div><h2 className="text-base font-semibold">Tạo slot trong bãi</h2><p className="mt-1 text-xs text-slate-500">Slot mới sẽ được dùng để chuyển thành phẩm từ sản xuất/QC ra bãi.</p></div>
              <button type="button" onClick={() => setSlotForm(null)} className={mutedButton}>Đóng</button>
            </div>
            <div className="grid gap-3 p-5 md:grid-cols-2">
              <select value={slotForm.zoneId} onChange={(event) => {
                const zone = zones.find((item) => item.id === event.target.value)
                const next = slots.filter((slot) => slot.zone.id === event.target.value).length + 1
                setSlotForm({ ...slotForm, zoneId: event.target.value, code: makeSlotCode(zone, next) })
              }} className={input}>
                <option value="">Chọn zone</option>
                {zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.code} · {zone.name}</option>)}
              </select>
              <input value={slotForm.code} onChange={(event) => setSlotForm({ ...slotForm, code: event.target.value })} className={input} placeholder="Mã slot" />
              <input value={slotForm.maxStackLevel} onChange={(event) => setSlotForm({ ...slotForm, maxStackLevel: event.target.value })} className={input} placeholder="Số tầng tối đa" type="number" min={1} />
              <div className="grid grid-cols-2 gap-3">
                <input value={slotForm.x} onChange={(event) => setSlotForm({ ...slotForm, x: event.target.value })} className={input} placeholder="Tọa độ X" type="number" />
                <input value={slotForm.y} onChange={(event) => setSlotForm({ ...slotForm, y: event.target.value })} className={input} placeholder="Tọa độ Y" type="number" />
              </div>
              <div className="rounded border border-slate-800 bg-[#050d18] p-3 text-xs text-slate-400 md:col-span-2">
                Slot trạng thái mặc định là <b className="text-emerald-300">AVAILABLE</b>; khi sản xuất chuyển thành phẩm ra bãi, dropdown sẽ thấy slot này nếu còn tầng trống.
              </div>
            </div>
            <footer className="flex justify-end gap-2 border-t border-white/10 px-5 py-4">
              <button type="button" onClick={() => setSlotForm(null)} className={mutedButton}>Hủy</button>
              <button type="button" onClick={submitSlotForm} disabled={createSlot.isPending || !slotForm.zoneId} className={primaryButton}>{createSlot.isPending ? 'Đang tạo...' : 'Tạo slot'}</button>
            </footer>
          </div>
        </div> : null}
    </EnterpriseWorkspace>
  )
}
