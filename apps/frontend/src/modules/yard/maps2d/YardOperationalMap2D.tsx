import { Edit2, MapPinned, Minus, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import type { YardSlotRuntime, YardZoneRuntime } from '../services/api/yard.api'

const zoneTone = (rate: number) => {
  if (rate >= 80) return 'border-red-500 bg-red-950/60 text-red-200 shadow-red-950'
  if (rate >= 55) return 'border-amber-400 bg-amber-950/55 text-amber-100 shadow-amber-950'
  if (rate > 0) return 'border-emerald-500 bg-emerald-950/55 text-emerald-100 shadow-emerald-950'
  return 'border-slate-600 bg-slate-950/70 text-slate-300 shadow-slate-950'
}

const slotTone = (slot: YardSlotRuntime) => {
  const rate = slot.maxStackLevel ? slot.currentStackLevel / slot.maxStackLevel : 0
  if (rate >= 1) return 'border-red-400 bg-red-500/25 text-red-100'
  if (rate >= .75) return 'border-orange-300 bg-orange-400/25 text-orange-100'
  if (rate > 0) return 'border-emerald-400 bg-emerald-500/25 text-emerald-100'
  return 'border-slate-500 bg-slate-700/20 text-slate-400'
}

export function YardOperationalMap2D({
  zones: configuredZones = [],
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
  zones?: YardZoneRuntime[]
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
  const [zoom, setZoom] = useState(1)
  const zoneMap = new Map<string, YardZoneRuntime | YardSlotRuntime['zone']>()
  configuredZones.forEach((zone) => zoneMap.set(zone.id, zone))
  slots.forEach((slot) => zoneMap.set(slot.zone.id, slot.zone))
  const zones = Array.from(zoneMap.values()).sort((a, b) => a.code.localeCompare(b.code))
  const selectedZone = zones.find((zone) => zone.id === selectedZoneId)

  return <div className="min-h-[455px] overflow-hidden rounded border border-slate-800 bg-[#040c15]">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-[#06101b] px-3 py-2">
      <div className="flex items-center gap-2 text-xs">
        <MapPinned size={15} className="text-cyan-300" />
        <span className="text-slate-500">Vị trí</span>
        <b className="text-cyan-200">{selectedZone ? `${selectedZone.code} · ${selectedZone.name}` : `${zones.length} zone · ${slots.length} slot`}</b>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={onCreateZone} className="rounded border border-cyan-700/70 bg-cyan-950/30 px-3 py-1.5 text-[11px] font-semibold text-cyan-200 hover:bg-cyan-900" title="Tạo zone">
          + Zone
        </button>
        <button type="button" onClick={() => onCreateSlot?.(selectedZoneId)} className="rounded border border-emerald-700/70 bg-emerald-950/30 px-3 py-1.5 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-900" title="Tạo slot trong zone">
          + Slot
        </button>
        <div className="ml-1 flex items-center gap-1 rounded border border-slate-700 bg-slate-950/70 p-1">
          <button type="button" onClick={() => setZoom((value) => Math.max(0.75, Number((value - 0.1).toFixed(1))))} className="rounded bg-slate-800 p-1.5 text-cyan-200 hover:bg-cyan-900" title="Thu nhỏ">
            <Minus size={13} />
          </button>
          <span className="min-w-10 text-center text-[10px] font-semibold text-cyan-300">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom((value) => Math.min(1.7, Number((value + 0.1).toFixed(1))))} className="rounded bg-slate-800 p-1.5 text-cyan-200 hover:bg-cyan-900" title="Phóng to">
            <Plus size={13} />
          </button>
        </div>
      </div>
    </div>
    <div className="overflow-auto">
      <div className="relative grid min-h-[455px] origin-top-left grid-cols-2 gap-5 p-6 transition-transform lg:grid-cols-3" style={{ transform: `scale(${zoom})`, width: `${100 / zoom}%` }}>
      {zones.map((zone) => {
        const zoneSlots = slots.filter((slot) => slot.zone.id === zone.id)
        const occupied = zoneSlots.filter((slot) => slot.placements.length).length
        const components = zoneSlots.reduce((sum, slot) => sum + slot.placements.length, 0)
        const rate = zoneSlots.length ? Math.round(occupied / zoneSlots.length * 100) : 0

        const isSelected = selectedZoneId === zone.id

        return <div key={zone.id} onClick={() => onSelectZone(zone.id)} className={`group relative cursor-pointer overflow-hidden rounded border p-3 text-left shadow-xl transition hover:-translate-y-0.5 hover:border-cyan-300 ${zoneTone(rate)} ${isSelected ? 'scale-[1.01] ring-2 ring-cyan-300 brightness-125 shadow-cyan-950/70' : 'brightness-75 hover:brightness-100'}`}>
          <div className={`absolute inset-x-0 top-0 h-1 ${isSelected ? 'bg-cyan-300' : 'bg-cyan-400/60'}`}/>
          <div className="flex items-start justify-between">
            <div><p className="text-[10px] uppercase tracking-[0.14em] text-cyan-300">{zone.code}</p><h3 className="mt-1 text-sm font-semibold">{zone.name}</h3></div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={(event) => { event.stopPropagation(); onEditZone?.(zone) }} className="rounded border border-cyan-700/50 p-1 text-cyan-300 hover:bg-cyan-950" title="Sửa zone">
                <Edit2 size={13} />
              </button>
              <button type="button" onClick={(event) => { event.stopPropagation(); onDeleteZone?.(zone) }} className="rounded border border-red-700/50 p-1 text-red-300 hover:bg-red-950" title="Xóa zone">
                <Trash2 size={13} />
              </button>
              <button type="button" onClick={(event) => { event.stopPropagation(); onOpenZoneDetail?.(zone.id) }} className="rounded border border-emerald-700/50 px-2 py-1 text-[10px] text-emerald-300 hover:bg-emerald-950" title="Popup chi tiết zone">
                Popup
              </button>
              <button type="button" onClick={(event) => { event.stopPropagation(); onCreateSlot?.(zone.id) }} className="rounded border border-blue-700/50 px-2 py-1 text-[10px] text-blue-200 hover:bg-blue-950" title="Thêm slot">
                + Slot
              </button>
              <MapPinned size={17} className="text-cyan-300"/>
            </div>
          </div>
          <div className="my-4 grid grid-cols-4 gap-2 rounded-xl border border-white/10 bg-black/25 p-2 backdrop-blur-sm">
            {zoneSlots.map((slot) => {
              const hasFocus = slot.placements.some((placement) => placement.id === selectedPlacementId)
              return <span key={slot.id} title={slot.code} className={`relative min-h-10 rounded border p-1 text-[9px] shadow-inner ${slotTone(slot)} ${hasFocus ? 'ring-2 ring-white brightness-150' : selectedPlacementId ? 'opacity-35' : ''}`}>
              <span className="absolute left-1 top-1 font-semibold">{slot.code.split('-').slice(-1)[0]}</span>
              <span className="absolute bottom-1 right-1 text-[8px] text-white/70">L{slot.currentStackLevel}/{slot.maxStackLevel}</span>
              <span className="mt-4 flex gap-0.5">
                {slot.placements.slice(0, 4).map((placement, index) => <i key={`${placement.id}-${index}`} className="h-1.5 flex-1 rounded bg-cyan-300/80 shadow-[0_0_8px_rgba(34,211,238,.45)]" />)}
              </span>
            </span>
            })}
          </div>
          <div className="flex justify-between text-[10px]"><span>{components} cấu kiện</span><span>{occupied}/{zoneSlots.length} vị trí</span><b>{rate}%</b></div>
        </div>
      })}
      {!zones.length && <div className="col-span-full flex min-h-64 items-center justify-center text-sm text-slate-500">Chưa cấu hình zone bãi.</div>}
      </div>
    </div>
  </div>
}
