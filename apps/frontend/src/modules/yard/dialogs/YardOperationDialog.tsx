import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Boxes, Construction, MapPinned, X } from 'lucide-react'

import type { ComponentRecord } from '@/modules/components/api/contracts/components.contract'
import { useMoveYardItem, usePlaceYardItem, useRemoveYardItem } from '../hooks/queries/useYardRuntime'
import type { YardCrane, YardPlacement, YardSlotRuntime } from '../services/api/yard.api'

export type YardOperationMode = 'inbound' | 'transfer' | 'outbound'

const labels = {
  inbound: ['Nhập bãi cấu kiện', 'Xưởng hoàn thành', 'Vị trí lưu bãi', 'Xác nhận nhập bãi'],
  transfer: ['Di chuyển nội bộ', 'Vị trí hiện tại', 'Vị trí đích', 'Xác nhận điều chuyển'],
  outbound: ['Xuất bãi cấu kiện', 'Vị trí lưu bãi', 'Công trình / xe nhận', 'Xác nhận xuất bãi'],
} as const

const input = 'w-full rounded border border-slate-700 bg-[#06111e] px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-500'
const fmt = (value = 0) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value)

type ActivePlacement = YardPlacement & { slot: YardSlotRuntime }

export function YardOperationDialog({
  mode,
  open,
  onClose,
  slots,
  cranes,
  components,
}: {
  mode: YardOperationMode
  open: boolean
  onClose: () => void
  slots: YardSlotRuntime[]
  cranes: YardCrane[]
  components: ComponentRecord[]
}) {
  const place = usePlaceYardItem()
  const move = useMoveYardItem()
  const remove = useRemoveYardItem()
  const [componentId, setComponentId] = useState('')
  const [placementId, setPlacementId] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [slotId, setSlotId] = useState('')
  const [craneId, setCraneId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [weight, setWeight] = useState('1')
  const [reason, setReason] = useState('')

  const placements = useMemo<ActivePlacement[]>(
    () => slots.flatMap((slot) => slot.placements.map((placement) => ({ ...placement, slot }))),
    [slots],
  )
  const completedComponents = useMemo(() => {
    const activeComponentIds = new Set(placements.map((placement) => placement.itemId).filter(Boolean))
    return components.filter((item) => item.status === 'READY' && !activeComponentIds.has(item.id))
  }, [components, placements])
  const zones = useMemo(() => Array.from(new Map(slots.map((slot) => [slot.zone.id, slot.zone])).values()), [slots])
  const placement = placements.find((item) => item.id === placementId)
  const availableSlots = slots.filter((slot) => slot.zone.id === zoneId && slot.status !== 'BLOCKED' && slot.id !== placement?.slot.id)
  const target = slots.find((slot) => slot.id === slotId)
  const component = components.find((item) => item.id === componentId)
  const pending = place.isPending || move.isPending || remove.isPending
  const error = place.error || move.error || remove.error

  useEffect(() => {
    if (!open) return
    setComponentId('')
    setPlacementId('')
    setZoneId('')
    setSlotId('')
    setCraneId('')
    setQuantity('1')
    setWeight('1')
    setReason('')
  }, [mode, open])

  if (!open) return null

  const submit = async () => {
    if (mode === 'inbound' && component && slotId) {
      await place.mutateAsync({
        slotId,
        itemType: 'COMPONENT',
        itemId: component.id,
        itemCode: component.code,
        itemName: component.name,
        quantity: Number(quantity) || 1,
        weight: Number(weight) || 0,
        craneId: craneId || undefined,
        reason: reason || 'Nhập bãi sau hoàn thành sản xuất',
      })
      onClose()
    }
    if (mode === 'transfer' && placement && slotId) {
      await move.mutateAsync({ id: placement.id, toSlotId: slotId, craneId: craneId || undefined, reason: reason || 'Điều chuyển nội bộ bãi' })
      onClose()
    }
    if (mode === 'outbound' && placement) {
      await remove.mutateAsync({ id: placement.id, craneId: craneId || undefined, reason: reason || 'Xuất bãi giao công trình' })
      onClose()
    }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
    <section className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded border border-cyan-900 bg-[#061321] shadow-2xl shadow-cyan-950/40">
      <header className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div><p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400">Yard operator workflow</p><h2 className="mt-1 text-lg font-semibold">{labels[mode][0]}</h2></div>
        <button onClick={onClose} className="rounded p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X size={18}/></button>
      </header>
      <div className="grid gap-0 overflow-y-auto lg:grid-cols-[1fr_300px]">
        <div className="p-5">
          <div className="mb-5 grid grid-cols-3 gap-2">{labels[mode].slice(1).map((label, index) => <div key={label} className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs text-slate-300"><span className={`flex h-6 w-6 items-center justify-center rounded-full ${index === 0 ? 'bg-blue-600 text-white' : 'border border-slate-700 text-slate-400'}`}>{index + 1}</span>{label}</div>)}</div>
          <div className="grid gap-4 md:grid-cols-2">
            {mode === 'inbound' ? <label className="text-xs text-slate-400">Cấu kiện hoàn thành
              <select value={componentId} onChange={(event) => setComponentId(event.target.value)} className={`${input} mt-2`}><option value="">Chọn cấu kiện đã hoàn thành</option>{completedComponents.map((item) => <option value={item.id} key={item.id}>{item.code} · {item.name}</option>)}</select>
              {!completedComponents.length ? <span className="mt-2 block text-[11px] text-amber-300">Chưa có cấu kiện READY chưa nhập bãi.</span> : null}
            </label> : <label className="text-xs text-slate-400">Cấu kiện đang lưu bãi
              <select value={placementId} onChange={(event) => { setPlacementId(event.target.value); setZoneId(''); setSlotId('') }} className={`${input} mt-2`}><option value="">Chọn cấu kiện và vị trí</option>{placements.map((item) => <option value={item.id} key={item.id}>{item.itemCode} · {item.slot.code} · L{item.stackLevel}</option>)}</select>
            </label>}
            <label className="text-xs text-slate-400">Cầu trục / thiết bị nâng
              <select value={craneId} onChange={(event) => setCraneId(event.target.value)} className={`${input} mt-2`}><option value="">Điều phối tự động</option>{cranes.map((item) => <option value={item.id} key={item.id}>{item.code} · {item.name}</option>)}</select>
            </label>
            {mode !== 'outbound' && <>
              <label className="text-xs text-slate-400">Zone đích
                <select value={zoneId} onChange={(event) => { setZoneId(event.target.value); setSlotId('') }} className={`${input} mt-2`}><option value="">Chọn zone</option>{zones.map((item) => <option value={item.id} key={item.id}>{item.code} · {item.name}</option>)}</select>
              </label>
              <label className="text-xs text-slate-400">Vị trí đích
                <select value={slotId} onChange={(event) => setSlotId(event.target.value)} className={`${input} mt-2`}><option value="">Chọn slot</option>{availableSlots.map((item) => <option value={item.id} key={item.id}>{item.code} · L{item.currentStackLevel}/{item.maxStackLevel}</option>)}</select>
              </label>
            </>}
            {mode === 'inbound' && <>
              <label className="text-xs text-slate-400">Số lượng cấu kiện<input value={quantity} onChange={(event) => setQuantity(event.target.value)} className={`${input} mt-2`} inputMode="decimal"/></label>
              <label className="text-xs text-slate-400">Khối lượng (tấn)<input value={weight} onChange={(event) => setWeight(event.target.value)} className={`${input} mt-2`} inputMode="decimal"/></label>
            </>}
            <label className="text-xs text-slate-400 md:col-span-2">Lý do / ghi chú vận hành<textarea value={reason} onChange={(event) => setReason(event.target.value)} className={`${input} mt-2 min-h-24 resize-none`} placeholder={mode === 'outbound' ? 'Công trình, xe nhận, mã shipment...' : 'Ghi chú điều phối...'}/></label>
          </div>
          {error && <p className="mt-4 rounded border border-red-900 bg-red-950/30 p-3 text-xs text-red-300">{error instanceof Error ? error.message : 'Không thể hoàn tất thao tác.'}</p>}
        </div>
        <aside className="border-l border-slate-800 bg-[#040d18] p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-400">Tóm tắt điều phối</h3>
          <div className="mt-4 space-y-3">
            <div className="rounded border border-slate-800 p-3"><Boxes size={16} className="text-cyan-400"/><p className="mt-2 text-[10px] uppercase text-slate-500">Cấu kiện</p><p className="mt-1 text-sm text-slate-200">{component?.code ?? placement?.itemCode ?? '--'}</p></div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded border border-slate-800 p-3 text-xs"><div><MapPinned size={15} className="text-emerald-400"/><p className="mt-2 text-slate-300">{placement?.slot.code ?? 'Xưởng'}</p></div><ArrowRight size={16} className="text-amber-400"/><div><MapPinned size={15} className="text-cyan-400"/><p className="mt-2 text-slate-300">{mode === 'outbound' ? 'Cổng xuất' : target?.code ?? '--'}</p></div></div>
            <div className="rounded border border-slate-800 p-3 text-xs text-slate-400"><Construction size={15} className="text-amber-400"/><p className="mt-2">Tầng đích: <b className="text-slate-200">L{target ? Math.min(target.currentStackLevel + 1, target.maxStackLevel) : '--'}</b></p><p className="mt-2">Occupancy: <b className="text-slate-200">{target ? `${target.currentStackLevel}/${target.maxStackLevel}` : '--'}</b></p><p className="mt-2">Khối lượng: <b className="text-slate-200">{fmt(Number(weight))} tấn</b></p></div>
          </div>
        </aside>
      </div>
      <footer className="flex justify-end gap-2 border-t border-slate-800 bg-[#040d18] px-5 py-4"><button onClick={onClose} className="rounded border border-slate-700 px-4 py-2 text-xs text-slate-300">Hủy</button><button disabled={pending} onClick={submit} className="rounded bg-blue-600 px-5 py-2 text-xs font-semibold text-white disabled:opacity-50">{pending ? 'Đang xử lý...' : labels[mode][3]}</button></footer>
    </section>
  </div>
}
