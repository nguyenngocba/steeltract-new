import { useEffect, useMemo, useState } from 'react'
import { Activity, Boxes, Construction, MapPinned, Radio, Search, Truck, Warehouse } from 'lucide-react'

import { useComponents } from '@/modules/components/hooks/queries/useComponents'
import { OperationalShell } from '@/shared/layouts/OperationalShell'
import { YardTabWorkspace } from '../components/YardTabWorkspace'
import { YardZoneDetailDialog } from '../components/YardZoneDetailDialog'
import { yardTabs, type YardTab } from '../config/yard-tabs'
import { YardOperationDialog, type YardOperationMode } from '../dialogs/YardOperationDialog'
import { useCreateYardSlot, useCreateYardZone, useDeleteYardZone, useUpdateYardZone, useYardCranesRuntime, useYardMetricsRuntime, useYardMovementsRuntime, useYardSlotsRuntime, useYardZonesRuntime } from '../hooks/queries/useYardRuntime'
import type { YardZoneRuntime } from '../services/api/yard.api'

const fmt = (value = 0) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value)
const panel = 'rounded border border-slate-800 bg-[#071321]'
const input = 'h-10 rounded border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 outline-none focus:border-cyan-500'

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
  const [tab, setTab] = useState<YardTab>('overview')
  const [selectedSlotId, setSelectedSlotId] = useState<string>()
  const [selectedPlacementId, setSelectedPlacementId] = useState<string>()
  const [selectedZoneId, setSelectedZoneId] = useState<string>()
  const [zoneDetailId, setZoneDetailId] = useState<string>()
  const [operation, setOperation] = useState<YardOperationMode>()
  const [zoneForm, setZoneForm] = useState<ZoneForm | null>(null)
  const [slotForm, setSlotForm] = useState<SlotForm | null>(null)
  const { data: components = [] } = useComponents()
  const { data: zones = [] } = useYardZonesRuntime()
  const { data: slots = [] } = useYardSlotsRuntime()
  const { data: metrics } = useYardMetricsRuntime()
  const { data: movements = [] } = useYardMovementsRuntime()
  const { data: cranes = [] } = useYardCranesRuntime()
  const updateZone = useUpdateYardZone()
  const deleteZone = useDeleteYardZone()
  const createZone = useCreateYardZone()
  const createSlot = useCreateYardSlot()
  const selectedSlot = slots.find((item) => item.id === selectedSlotId) ?? slots[0]
  const selectedPlacement = selectedSlot?.placements.find((item) => item.id === selectedPlacementId) ?? selectedSlot?.placements[0]
  const totalWeight = useMemo(() => slots.flatMap((slot) => slot.placements).reduce((sum, item) => sum + (item.weight ?? 0), 0), [slots])
  useEffect(() => {
    const focusComponentId = window.sessionStorage.getItem('yard-focus-component-id')
    if (!focusComponentId || !slots.length) return

    for (const slot of slots) {
      const placement = slot.placements.find((item) => item.itemId === focusComponentId)
      if (!placement) continue

      setTab('map-2d')
      setSelectedZoneId(slot.zone.id)
      setSelectedSlotId(slot.id)
      setSelectedPlacementId(placement.id)
      window.location.hash = 'map-2d'
      window.sessionStorage.removeItem('yard-focus-component-id')
      break
    }
  }, [slots])
  useEffect(() => {
    const sync = () => setTab((window.location.hash.slice(1) || 'overview') as YardTab)
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const selectTab = (id: YardTab) => {
    window.location.hash = id
    setTab(id)
  }

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
    setTab('map-2d')
    window.location.hash = 'map-2d'
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
    setTab('map-2d')
    window.location.hash = 'map-2d'
  }

  const stat = [
    [Warehouse, 'Khu vực bãi', metrics?.zones ?? 0, 'zone vận hành'],
    [MapPinned, 'Tổng vị trí', metrics?.totalSlots ?? 0, 'slot cấu hình'],
    [Boxes, 'Cấu kiện lưu bãi', metrics?.placements ?? 0, 'thành phẩm'],
    [Activity, 'Tổng trọng lượng', `${fmt(totalWeight)} tấn`, 'realtime'],
    [Radio, 'Occupancy', `${metrics?.occupancyRate ?? 0}%`, 'LIVE 5s'],
  ] as const

  return <OperationalShell><main className="min-h-screen bg-[#020811] p-4 text-slate-100">
    <header className="flex items-end justify-between border-b border-slate-800 pb-3">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400">Yard management</p><h1 className="mt-1 text-xl font-semibold">Bãi tập kết - quản lý vị trí cấu kiện</h1><p className="mt-1 text-xs text-slate-400">QC hoàn thành → nhập bãi → lưu vị trí → điều chuyển → xuất bãi</p></div>
      <div className="flex flex-wrap justify-end gap-2"><button onClick={openCreateZone} className="rounded border border-cyan-700 bg-cyan-950/30 px-4 py-2 text-xs text-cyan-200">+ Zone</button><button onClick={() => openCreateSlot()} className="rounded border border-emerald-700 bg-emerald-950/30 px-4 py-2 text-xs text-emerald-200">+ Slot</button><button onClick={() => setOperation('inbound')} className="rounded bg-blue-600 px-4 py-2 text-xs">+ Nhập bãi</button><button onClick={() => setOperation('outbound')} className="rounded border border-amber-800 bg-amber-950/30 px-4 py-2 text-xs text-amber-300">Xuất bãi</button><button onClick={() => setOperation('transfer')} className="rounded border border-emerald-800 bg-emerald-950/30 px-4 py-2 text-xs text-emerald-300">+ Chuyển nội bộ</button></div>
    </header>
    <nav className="my-3 flex gap-1 overflow-x-auto rounded bg-[#06101b] p-1">{yardTabs.map(([id, label]) => <button key={id} onClick={() => selectTab(id)} className={`whitespace-nowrap rounded px-3 py-2 text-xs ${tab === id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>{label}</button>)}</nav>
    <section className="grid gap-2 md:grid-cols-5">{stat.map(([Icon, label, value, note]) => <div key={label} className={`${panel} p-3`}><div className="flex justify-between"><Icon size={16} className="text-cyan-400"/><span className="text-[9px] text-emerald-400">{note}</span></div><div className="mt-3 text-[10px] uppercase text-slate-500">{label}</div><div className="mt-1 text-xl font-semibold">{value}</div></div>)}</section>
    <section className={`${panel} my-3 flex flex-wrap items-center gap-2 p-3`}><Search size={15} className="text-cyan-400"/><input className="min-w-52 flex-1 bg-transparent text-xs outline-none" placeholder="Tìm vị trí, cấu kiện, zone..."/><span className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-300">Tất cả zone</span><span className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-300">Tất cả trạng thái</span></section>
    <div className="grid gap-3 xl:grid-cols-[1fr_330px]">
      <section className="space-y-3">
        <YardTabWorkspace tab={tab} zones={zones} slots={slots} metrics={metrics} movements={movements} cranes={cranes} selectedSlotId={selectedSlot?.id} selectedZoneId={selectedZoneId} selectedPlacementId={selectedPlacementId} onSelectZone={setSelectedZoneId} onOpenZoneDetail={setZoneDetailId} onEditZone={editZone} onDeleteZone={removeZone} onCreateZone={openCreateZone} onCreateSlot={openCreateSlot} onOpenOperation={setOperation} />
        <div className="grid gap-3 lg:grid-cols-2">
          <div className={`${panel} p-4`}><h2 className="text-sm font-semibold">Chi tiết tầng · {selectedSlot?.code ?? '--'}</h2><div className="mt-3 grid grid-cols-4 gap-2">{Array.from({ length: selectedSlot?.maxStackLevel ?? 4 }, (_, index) => <div key={index} className={`rounded border p-3 text-center text-xs ${index < (selectedSlot?.currentStackLevel ?? 0) ? 'border-cyan-600 bg-cyan-950/40 text-cyan-200' : 'border-slate-800 text-slate-600'}`}>L{index + 1}</div>)}</div><div className="mt-3 text-xs text-slate-500">Đang dùng {selectedSlot?.currentStackLevel ?? 0}/{selectedSlot?.maxStackLevel ?? 0} tầng</div></div>
          <div className={`${panel} p-4`}><h2 className="text-sm font-semibold">Cấu kiện trong vị trí</h2><div className="mt-3 space-y-2">{selectedSlot?.placements.map((item) => <button key={item.id} onClick={() => setSelectedPlacementId(item.id)} className={`flex w-full justify-between rounded border p-2 text-left text-xs ${selectedPlacement?.id === item.id ? 'border-cyan-500 bg-cyan-950/30' : 'border-slate-800'}`}><span className="text-cyan-300">{item.itemCode}</span><span>L{item.stackLevel} · {fmt(item.quantity)}</span></button>)}{!selectedSlot?.placements.length && <p className="text-xs text-slate-500">Vị trí đang trống.</p>}</div></div>
        </div>
      </section>
      <aside className="space-y-3">
        <div className={`${panel} p-4`}><h2 className="text-sm font-semibold">Thông tin vị trí</h2><div className="mt-3 space-y-2 text-xs text-slate-400"><div className="flex justify-between"><span>Zone</span><b className="text-slate-200">{selectedSlot?.zone.name ?? '--'}</b></div><div className="flex justify-between"><span>Vị trí</span><b className="text-cyan-300">{selectedSlot?.code ?? '--'}</b></div><div className="flex justify-between"><span>Trạng thái</span><b className="text-emerald-300">{selectedSlot?.status ?? '--'}</b></div><div className="flex justify-between"><span>Cấu kiện</span><b className="text-slate-200">{selectedSlot?.placements.length ?? 0}</b></div></div></div>
        <div className={`${panel} p-4`}><h2 className="text-sm font-semibold">Chi tiết cấu kiện</h2>{selectedPlacement ? <div className="mt-3 space-y-2 text-xs text-slate-400"><div className="text-sm font-semibold text-cyan-300">{selectedPlacement.itemCode}</div><div>{selectedPlacement.itemName ?? selectedPlacement.itemType}</div><div>Tầng L{selectedPlacement.stackLevel}</div><div>Khối lượng {fmt(selectedPlacement.weight)} tấn</div></div> : <p className="mt-3 text-xs text-slate-500">Chọn cấu kiện trên sơ đồ.</p>}</div>
        <div className={`${panel} p-4`}><h2 className="text-sm font-semibold">Cầu trục</h2><div className="mt-3 space-y-2">{cranes.slice(0, 4).map((crane) => <div key={crane.id} className="flex justify-between text-xs text-slate-400"><span className="flex gap-2"><Construction size={14}/>{crane.code}</span><span className="text-emerald-300">{crane.status}</span></div>)}{!cranes.length && <p className="text-xs text-slate-500">Chưa cấu hình cầu trục.</p>}</div></div>
        <div className={`${panel} p-4`}><h2 className="text-sm font-semibold">Hoạt động gần đây</h2><div className="mt-3 space-y-3">{movements.slice(0, 5).map((item) => <div key={item.id} className="border-l border-cyan-700 pl-2 text-[11px]"><div className="text-cyan-300">{item.itemCode} · {item.type}</div><div className="mt-1 text-slate-500">{item.fromSlot?.code ?? 'Xưởng'} → {item.toSlot?.code ?? 'Rời bãi'}</div></div>)}</div></div>
      </aside>
    </div>
    <footer className={`${panel} mt-3 flex flex-wrap gap-5 p-3 text-xs text-slate-400`}><span><Truck size={14} className="mr-1 inline text-cyan-400"/> Luồng bãi realtime</span><span>Occupied {metrics?.occupiedSlots ?? 0}/{metrics?.totalSlots ?? 0}</span><span className="text-emerald-400">Cập nhật 5 giây/lần</span></footer>
    <YardOperationDialog mode={operation ?? 'inbound'} open={Boolean(operation)} onClose={() => setOperation(undefined)} slots={slots} cranes={cranes} components={components}/>
    <YardZoneDetailDialog zoneId={zoneDetailId} slots={slots} selectedSlotId={selectedSlotId} onSelectSlot={(id) => setSelectedSlotId(id)} onClose={() => setZoneDetailId(undefined)} />
    {zoneForm ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded border border-slate-700 bg-[#071321] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div><h2 className="text-base font-semibold">Tạo zone bãi</h2><p className="mt-1 text-xs text-slate-500">Zone sẽ hiển thị ngay trên sơ đồ 2D và nhận slot mới.</p></div>
          <button type="button" onClick={() => setZoneForm(null)} className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-300">Đóng</button>
        </div>
        <div className="grid gap-3 p-5 md:grid-cols-2">
          <input value={zoneForm.code} onChange={(event) => setZoneForm({ ...zoneForm, code: event.target.value })} className={input} placeholder="Mã zone" />
          <input value={zoneForm.name} onChange={(event) => setZoneForm({ ...zoneForm, name: event.target.value })} className={input} placeholder="Tên zone" />
          <input value={zoneForm.width} onChange={(event) => setZoneForm({ ...zoneForm, width: event.target.value })} className={input} placeholder="Chiều rộng sơ đồ" type="number" />
          <input value={zoneForm.height} onChange={(event) => setZoneForm({ ...zoneForm, height: event.target.value })} className={input} placeholder="Chiều cao sơ đồ" type="number" />
          <input value={zoneForm.color} onChange={(event) => setZoneForm({ ...zoneForm, color: event.target.value })} className={input} placeholder="Màu zone" type="color" />
          <textarea value={zoneForm.description} onChange={(event) => setZoneForm({ ...zoneForm, description: event.target.value })} className={`${input} h-24 py-2 md:col-span-2`} placeholder="Ghi chú zone" />
        </div>
        <footer className="flex justify-end gap-2 border-t border-slate-800 px-5 py-4">
          <button type="button" onClick={() => setZoneForm(null)} className="rounded border border-slate-700 px-4 py-2 text-xs text-slate-300">Hủy</button>
          <button type="button" onClick={submitZoneForm} disabled={createZone.isPending} className="rounded bg-blue-600 px-5 py-2 text-xs font-semibold text-white disabled:opacity-50">{createZone.isPending ? 'Đang tạo...' : 'Tạo zone'}</button>
        </footer>
      </div>
    </div> : null}
    {slotForm ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded border border-slate-700 bg-[#071321] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div><h2 className="text-base font-semibold">Tạo slot trong bãi</h2><p className="mt-1 text-xs text-slate-500">Slot mới sẽ được dùng để chuyển thành phẩm từ sản xuất/QC ra bãi.</p></div>
          <button type="button" onClick={() => setSlotForm(null)} className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-300">Đóng</button>
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
        <footer className="flex justify-end gap-2 border-t border-slate-800 px-5 py-4">
          <button type="button" onClick={() => setSlotForm(null)} className="rounded border border-slate-700 px-4 py-2 text-xs text-slate-300">Hủy</button>
          <button type="button" onClick={submitSlotForm} disabled={createSlot.isPending || !slotForm.zoneId} className="rounded bg-blue-600 px-5 py-2 text-xs font-semibold text-white disabled:opacity-50">{createSlot.isPending ? 'Đang tạo...' : 'Tạo slot'}</button>
        </footer>
      </div>
    </div> : null}
  </main></OperationalShell>
}
