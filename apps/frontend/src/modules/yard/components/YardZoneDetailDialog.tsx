import { useMemo, useState } from 'react'
import { Boxes, Truck, X } from 'lucide-react'

import { useRemoveYardItem } from '../hooks/queries/useYardRuntime'
import type { YardSlotRuntime } from '../services/api/yard.api'
import { formatQuantity } from '@/shared/utils/number-format'

const fmt = (value = 0) => formatQuantity(value, 2)
const tone = (slot: YardSlotRuntime) => {
  const rate = slot.maxStackLevel ? slot.currentStackLevel / slot.maxStackLevel : 0
  if (rate >= 1) return 'border-red-500 bg-red-950/55 text-red-200'
  if (rate >= .75) return 'border-orange-400 bg-orange-950/55 text-orange-100'
  if (rate > 0) return 'border-emerald-500 bg-emerald-950/55 text-emerald-100'
  return 'border-slate-700 bg-slate-950/60 text-slate-400'
}

export function YardZoneDetailDialog({
  zoneId,
  slots,
  selectedSlotId,
  onSelectSlot,
  onClose,
}: {
  zoneId?: string
  slots: YardSlotRuntime[]
  selectedSlotId?: string
  onSelectSlot: (id: string) => void
  onClose: () => void
}) {
  const remove = useRemoveYardItem()
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null)
  const zoneSlots = zoneId ? slots.filter((slot) => slot.zone.id === zoneId) : []
  const placementSlots = useMemo(() => new Map(
    zoneSlots.flatMap((slot) => slot.placements.map((placement) => [placement.id, slot] as const)),
  ), [zoneSlots])

  if (!zoneId) return null
  const selected = zoneSlots.find((slot) => slot.id === selectedSlotId) ?? zoneSlots[0]
  const placements = selected?.placements ?? []
  const selectedPlacement = placements.find((item) => item.id === selectedPlacementId) ?? placements[0]
  const selectedPlacementSlot = selectedPlacement ? placementSlots.get(selectedPlacement.id) : undefined
  const occupied = zoneSlots.filter((slot) => slot.placements.length).length
  const occupancy = zoneSlots.length ? Math.round(occupied / zoneSlots.length * 100) : 0
  const pending = remove.isPending

  const outboundSelectedPlacement = async () => {
    if (!selectedPlacement) return
    await remove.mutateAsync({
      id: selectedPlacement.id,
      reason: `Xuất bãi từ chi tiết zone ${selected?.zone.code ?? ''} - ${selected?.code ?? ''}`.trim(),
    })
    setSelectedPlacementId(null)
  }

  return <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
    <section className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded border border-cyan-900 bg-[#061321] shadow-2xl shadow-cyan-950/50">
      <header className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <div><p className="text-[10px] uppercase tracking-[0.16em] text-amber-400">Level 2 · chi tiết zone</p><h2 className="mt-1 text-lg font-semibold">{selected?.zone.code} · {selected?.zone.name}</h2></div>
        <button onClick={onClose} className="rounded p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X size={18}/></button>
      </header>
      <div className="grid gap-4 p-5 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <div className="mb-3 flex gap-5 text-xs text-slate-400"><span>Vị trí dùng <b className="text-slate-100">{occupied}/{zoneSlots.length}</b></span><span>Occupancy <b className="text-cyan-300">{occupancy}%</b></span></div>
          <div className="grid grid-cols-3 gap-3 rounded border border-slate-800 bg-[#030b14] p-4 lg:grid-cols-4">{zoneSlots.map((slot) => <button key={slot.id} onClick={() => onSelectSlot(slot.id)} className={`min-h-20 rounded border p-3 text-left transition hover:border-cyan-300 ${tone(slot)} ${selected?.id === slot.id ? 'ring-2 ring-cyan-300' : ''}`}><div className="text-xs font-semibold">{slot.code}</div><div className="mt-4 flex justify-between text-[10px]"><span>{slot.placements.length} CK</span><span>L{slot.currentStackLevel}/{slot.maxStackLevel}</span></div></button>)}</div>
        </div>
        <div className="space-y-4">
          <div className="rounded border border-slate-800 bg-[#030b14] p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-amber-400">Level 3 · mặt cắt ngang</p>
            <h3 className="mt-1 text-sm font-semibold">Vị trí {selected?.code ?? '--'}</h3>
            <div className="mt-4 space-y-2">{Array.from({ length: selected?.maxStackLevel ?? 4 }, (_, index) => {
              const level = (selected?.maxStackLevel ?? 4) - index
              const placement = placements.find((item) => item.stackLevel === level)
              return <div key={level} className={`grid grid-cols-[42px_1fr_90px] items-center gap-2 rounded border p-2 text-xs ${placement ? 'border-cyan-600 bg-cyan-950/35' : 'border-slate-800 bg-slate-950/30'}`}><b className="text-cyan-300">L{level}</b><span className="text-slate-300">{placement?.itemCode ?? 'Còn trống'}</span><span className={placement ? 'text-amber-300' : 'text-emerald-300'}>{placement ? `${fmt(placement.weight)} tấn` : 'Sẵn sàng'}</span></div>
            })}</div>
          </div>
          <div className="rounded border border-slate-800 bg-[#030b14] p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-amber-400">Level 4 · chi tiết cấu kiện</p>
            <div className="mt-3 space-y-2">{placements.map((item) => <button key={item.id} onClick={() => setSelectedPlacementId(item.id)} className={`grid w-full grid-cols-[1fr_42px_75px] items-center gap-2 rounded border p-2 text-left text-xs transition hover:border-cyan-300 hover:bg-cyan-950/25 ${selectedPlacement?.id === item.id ? 'border-cyan-400 bg-cyan-950/35' : 'border-slate-800'}`}><span><Boxes size={13} className="mr-2 inline text-cyan-400"/><b className="text-cyan-300">{item.itemCode}</b><small className="mt-1 block pl-5 text-slate-500">{item.itemName}</small></span><span>L{item.stackLevel}</span><span>{fmt(item.weight)} tấn</span></button>)}{!placements.length && <p className="text-xs text-slate-500">Vị trí đang trống, sẵn sàng nhận cấu kiện.</p>}</div>
            {selectedPlacement ? (
              <div className="mt-4 rounded border border-cyan-900 bg-cyan-950/20 p-3 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-cyan-300">Popup cấu kiện trong zone</p>
                    <h4 className="mt-1 text-sm font-semibold text-white">{selectedPlacement.itemCode}</h4>
                    <p className="mt-1 text-slate-400">{selectedPlacement.itemName ?? 'Chưa có tên cấu kiện'}</p>
                  </div>
                  <button disabled={pending} onClick={outboundSelectedPlacement} className="inline-flex items-center gap-2 rounded bg-amber-500 px-3 py-2 font-semibold text-slate-950 disabled:opacity-50">
                    <Truck size={14} />
                    {pending ? 'Đang xuất...' : 'Xuất bãi'}
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-slate-300">
                  <span>Zone: <b className="text-white">{selectedPlacementSlot?.zone.code ?? selected?.zone.code}</b></span>
                  <span>Vị trí: <b className="text-white">{selectedPlacementSlot?.code ?? selected?.code} / L{selectedPlacement.stackLevel}</b></span>
                  <span>Số lượng: <b className="text-white">{fmt(selectedPlacement.quantity)}</b></span>
                  <span>Khối lượng: <b className="text-white">{fmt(selectedPlacement.weight)} tấn</b></span>
                </div>
                {remove.error ? <p className="mt-3 rounded border border-red-900 bg-red-950/30 p-2 text-red-300">{remove.error instanceof Error ? remove.error.message : 'Không thể xuất bãi cấu kiện.'}</p> : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  </div>
}
