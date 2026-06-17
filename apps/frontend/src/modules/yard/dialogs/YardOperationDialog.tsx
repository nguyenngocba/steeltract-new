import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Boxes, Construction, MapPinned, X } from 'lucide-react'

import type { ComponentRecord } from '@/modules/components/api/contracts/components.contract'
import { useProductionOrders, useStageProductionToYard } from '@/modules/production/hooks/useProductionCockpit'
import { formatQuantity, formatQuantityInput, parseLocaleNumber } from '@/shared/utils/number-format'
import { useMoveYardItem, useRemoveYardItem } from '../hooks/queries/useYardRuntime'
import type { YardCrane, YardPlacement, YardSlotRuntime } from '../services/api/yard.api'

export type YardOperationMode = 'inbound' | 'transfer' | 'outbound'

const labels = {
  inbound: ['Nhập bãi cấu kiện', 'Xưởng hoàn thành', 'Vị trí lưu bãi', 'Xác nhận nhập bãi'],
  transfer: ['Di chuyển nội bộ', 'Vị trí hiện tại', 'Vị trí đích', 'Xác nhận điều chuyển'],
  outbound: ['Xuất bãi cấu kiện', 'Vị trí lưu bãi', 'Công trình / xe nhận', 'Xác nhận xuất bãi'],
} as const

const input = 'w-full rounded border border-slate-700 bg-[#06111e] px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-500'
const fmt = (value = 0) => formatQuantity(value, 3)

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
  const move = useMoveYardItem()
  const remove = useRemoveYardItem()
  const stageToYard = useStageProductionToYard()
  const { data: productionOrders = [] } = useProductionOrders()
  const [productionOrderId, setProductionOrderId] = useState('')
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
  const stagedQuantityByComponentId = useMemo(() => {
    const map = new Map<string, number>()
    placements.forEach((placement) => {
      if (!placement.itemId) return
      map.set(placement.itemId, (map.get(placement.itemId) ?? 0) + Number(placement.quantity ?? 0))
    })
    return map
  }, [placements])
  const completedOrders = useMemo(() => productionOrders
    .filter((order) => order.status === 'COMPLETED' && order.component?.id)
    .map((order) => {
      const componentId = order.component!.id
      const stagedQuantity = stagedQuantityByComponentId.get(componentId) ?? 0
      return {
        ...order,
        stagedQuantity,
        remainingQuantity: Math.max(0, Number(order.quantity ?? 0) - stagedQuantity),
      }
    })
    .filter((order) => order.remainingQuantity > 0), [productionOrders, stagedQuantityByComponentId])
  const zones = useMemo(() => Array.from(new Map(slots.map((slot) => [slot.zone.id, slot.zone])).values()), [slots])
  const placement = placements.find((item) => item.id === placementId)
  const availableSlots = slots.filter((slot) =>
    slot.zone.id === zoneId &&
    slot.status !== 'BLOCKED' &&
    slot.currentStackLevel < slot.maxStackLevel &&
    slot.id !== placement?.slot.id)
  const target = slots.find((slot) => slot.id === slotId)
  const selectedOrder = completedOrders.find((item) => item.id === productionOrderId)
  const component = selectedOrder?.component ?? components.find((item) => item.id === componentId)
  const inboundQuantity = parseLocaleNumber(quantity) || 0
  const inboundRemaining = selectedOrder?.remainingQuantity ?? 0
  const inboundQuantityInvalid = mode === 'inbound' && (!selectedOrder || inboundQuantity <= 0 || inboundQuantity > inboundRemaining)
  const pending = move.isPending || remove.isPending || stageToYard.isPending
  const error = move.error || remove.error || stageToYard.error

  useEffect(() => {
    if (!open) return
    setProductionOrderId('')
    setComponentId('')
    setPlacementId('')
    setZoneId('')
    setSlotId('')
    setCraneId('')
    setQuantity('1')
    setWeight('1')
    setReason('')
  }, [mode, open])

  useEffect(() => {
    if (!selectedOrder) return
    setComponentId(selectedOrder.component?.id ?? '')
    setQuantity(fmt(Math.min(1, selectedOrder.remainingQuantity)))
  }, [selectedOrder])

  if (!open) return null

  const submit = async () => {
    if (mode === 'inbound' && selectedOrder && slotId && !inboundQuantityInvalid) {
      await stageToYard.mutateAsync({
        id: selectedOrder.id,
        payload: {
        slotId,
          quantity: inboundQuantity,
        weight: parseLocaleNumber(weight) || 0,
        craneId: craneId || undefined,
        reason: reason || 'Nhập bãi sau hoàn thành sản xuất',
        },
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
            {mode === 'inbound' ? <label className="text-xs text-slate-400">Lệnh sản xuất hoàn thành còn số lượng
              <select value={productionOrderId} onChange={(event) => setProductionOrderId(event.target.value)} className={`${input} mt-2`}><option value="">Chọn MO đã hoàn thành</option>{completedOrders.map((item) => <option value={item.id} key={item.id}>{item.orderNo} · {item.component?.code} · còn {fmt(item.remainingQuantity)}/{fmt(item.quantity)}</option>)}</select>
              {!completedOrders.length ? <span className="mt-2 block text-[11px] text-amber-300">Chưa có MO COMPLETED còn số lượng để nhập bãi.</span> : null}
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
                <select value={slotId} onChange={(event) => setSlotId(event.target.value)} className={`${input} mt-2`}><option value="">Chọn slot còn tầng trống</option>{availableSlots.map((item) => <option value={item.id} key={item.id}>{item.code} · tầng kế tiếp L{item.currentStackLevel + 1}/{item.maxStackLevel}</option>)}</select>
                {zoneId && !availableSlots.length ? <span className="mt-2 block text-[11px] text-amber-300">Zone này không còn slot có tầng trống.</span> : null}
              </label>
            </>}
            {mode === 'inbound' && <>
              <label className="text-xs text-slate-400">Số lượng cấu kiện<input value={quantity} onChange={(event) => setQuantity(formatQuantityInput(event.target.value))} className={`${input} mt-2`} inputMode="decimal"/>{selectedOrder ? <span className={`mt-2 block text-[11px] ${inboundQuantityInvalid ? 'text-red-300' : 'text-emerald-300'}`}>Còn được nhập bãi: {fmt(inboundRemaining)} cấu kiện. Đã nhập: {fmt(selectedOrder.stagedQuantity)} / MO: {fmt(selectedOrder.quantity)}</span> : null}</label>
              <label className="text-xs text-slate-400">Khối lượng (tấn)<input value={weight} onChange={(event) => setWeight(formatQuantityInput(event.target.value))} className={`${input} mt-2`} inputMode="decimal"/></label>
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
            <div className="rounded border border-slate-800 p-3 text-xs text-slate-400"><Construction size={15} className="text-amber-400"/><p className="mt-2">Tầng đích: <b className="text-slate-200">L{target ? target.currentStackLevel + 1 : '--'}</b></p><p className="mt-2">Occupancy: <b className="text-slate-200">{target ? `${target.currentStackLevel}/${target.maxStackLevel}` : '--'}</b></p><p className="mt-2">Số lượng nhập: <b className="text-slate-200">{mode === 'inbound' ? fmt(inboundQuantity) : fmt(parseLocaleNumber(quantity))}</b></p><p className="mt-2">Khối lượng: <b className="text-slate-200">{fmt(parseLocaleNumber(weight))} tấn</b></p></div>
          </div>
        </aside>
      </div>
      <footer className="flex justify-end gap-2 border-t border-slate-800 bg-[#040d18] px-5 py-4"><button onClick={onClose} className="rounded border border-slate-700 px-4 py-2 text-xs text-slate-300">Hủy</button><button disabled={pending || inboundQuantityInvalid || (mode !== 'outbound' && !slotId) || (mode === 'outbound' && !placementId)} onClick={submit} className="rounded bg-blue-600 px-5 py-2 text-xs font-semibold text-white disabled:opacity-50">{pending ? 'Đang xử lý...' : labels[mode][3]}</button></footer>
    </section>
  </div>
}
