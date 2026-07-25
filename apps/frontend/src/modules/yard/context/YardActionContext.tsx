import React, { createContext, useContext, useState, type ReactNode } from 'react'
import { useComponents } from '@/modules/components/hooks/queries/useComponents'
import { YardOperationDialog, type YardOperationMode } from '../dialogs/YardOperationDialog'
import { useCreateYardSlot, useCreateYardZone, useYardWorkspace } from '../hooks/queries/useYardRuntime'
import type { YardZoneRuntime } from '../services/api/yard.api'
import { moduleInput, moduleMutedButton, modulePanel, modulePrimaryButton } from '@/shared/ui/modules'

export interface YardActionContextType {
  openInbound: () => void
  openOutbound: () => void
  openTransfer: () => void
  openCreateZone: () => void
  openCreateSlot: () => void
  closeAll: () => void
}

const YardActionContext = createContext<YardActionContextType | null>(null)

export function useYardActions(): YardActionContextType {
  const ctx = useContext(YardActionContext)
  if (!ctx) {
    return {
      openInbound: () => {},
      openOutbound: () => {},
      openTransfer: () => {},
      openCreateZone: () => {},
      openCreateSlot: () => {},
      closeAll: () => {},
    }
  }
  return ctx
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

export function YardActionProvider({ children }: { children: ReactNode }) {
  const [operation, setOperation] = useState<YardOperationMode | null>(null)
  const [zoneForm, setZoneForm] = useState<ZoneForm | null>(null)
  const [slotForm, setSlotForm] = useState<SlotForm | null>(null)

  const { data: components = [] } = useComponents()
  const { data: workspace } = useYardWorkspace()
  const createZone = useCreateYardZone()
  const createSlot = useCreateYardSlot()

  const zones = workspace?.zones ?? []
  const slots = workspace?.slots ?? []
  const cranes = workspace?.cranes ?? []

  function openInbound() {
    setOperation('inbound')
  }

  function openOutbound() {
    setOperation('outbound')
  }

  function openTransfer() {
    setOperation('transfer')
  }

  function openCreateZone() {
    setZoneForm(defaultZoneForm(zones.length))
  }

  function openCreateSlot(zoneId?: string) {
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

  function closeAll() {
    setOperation(null)
    setZoneForm(null)
    setSlotForm(null)
  }

  async function submitZoneForm() {
    if (!zoneForm?.code.trim() || !zoneForm.name.trim()) return
    await createZone.mutateAsync({
      code: zoneForm.code.trim(),
      name: zoneForm.name.trim(),
      description: zoneForm.description.trim() || undefined,
      status: 'ACTIVE',
      originX: 0,
      originY: 0,
      width: Number(zoneForm.width) || 24,
      height: Number(zoneForm.height) || 18,
      color: zoneForm.color || '#06b6d4',
    })
    setZoneForm(null)
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
    setSlotForm(null)
  }

  return (
    <YardActionContext.Provider
      value={{
        openInbound,
        openOutbound,
        openTransfer,
        openCreateZone,
        openCreateSlot,
        closeAll,
      }}
    >
      {children}

      <YardOperationDialog
        mode={operation ?? 'inbound'}
        open={Boolean(operation)}
        onClose={() => setOperation(null)}
        slots={slots}
        cranes={cranes}
        components={components}
      />

      {zoneForm ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-2xl overflow-hidden ${modulePanel}`}>
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-white">Tạo zone bãi mới (Create Zone)</h2>
                <p className="mt-1 text-xs text-slate-400">Zone sẽ hiển thị ngay trên sơ đồ 2D và nhận slot mới.</p>
              </div>
              <button type="button" onClick={() => setZoneForm(null)} className={moduleMutedButton}>
                Đóng
              </button>
            </div>
            <div className="grid gap-3 p-5 md:grid-cols-2 text-xs">
              <input
                value={zoneForm.code}
                onChange={(event) => setZoneForm({ ...zoneForm, code: event.target.value })}
                className={moduleInput}
                placeholder="Mã zone"
              />
              <input
                value={zoneForm.name}
                onChange={(event) => setZoneForm({ ...zoneForm, name: event.target.value })}
                className={moduleInput}
                placeholder="Tên zone"
              />
              <input
                value={zoneForm.width}
                onChange={(event) => setZoneForm({ ...zoneForm, width: event.target.value })}
                className={moduleInput}
                placeholder="Chiều rộng sơ đồ"
                type="number"
              />
              <input
                value={zoneForm.height}
                onChange={(event) => setZoneForm({ ...zoneForm, height: event.target.value })}
                className={moduleInput}
                placeholder="Chiều cao sơ đồ"
                type="number"
              />
              <input
                value={zoneForm.color}
                onChange={(event) => setZoneForm({ ...zoneForm, color: event.target.value })}
                className={moduleInput}
                placeholder="Màu zone"
                type="color"
              />
              <textarea
                value={zoneForm.description}
                onChange={(event) => setZoneForm({ ...zoneForm, description: event.target.value })}
                className={`${moduleInput} h-24 py-2 md:col-span-2`}
                placeholder="Ghi chú zone"
              />
            </div>
            <footer className="flex justify-end gap-2 border-t border-white/10 px-5 py-4">
              <button type="button" onClick={() => setZoneForm(null)} className={moduleMutedButton}>
                Hủy
              </button>
              <button
                type="button"
                onClick={submitZoneForm}
                disabled={createZone.isPending}
                className={modulePrimaryButton}
              >
                {createZone.isPending ? 'Đang tạo...' : 'Tạo zone'}
              </button>
            </footer>
          </div>
        </div>
      ) : null}

      {slotForm ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-2xl overflow-hidden ${modulePanel}`}>
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-white">Tạo slot trong bãi (Create Slot)</h2>
                <p className="mt-1 text-xs text-slate-400">Slot mới sẽ được dùng để chuyển thành phẩm từ sản xuất/QC ra bãi.</p>
              </div>
              <button type="button" onClick={() => setSlotForm(null)} className={moduleMutedButton}>
                Đóng
              </button>
            </div>
            <div className="grid gap-3 p-5 md:grid-cols-2 text-xs">
              <select
                value={slotForm.zoneId}
                onChange={(event) => {
                  const zone = zones.find((item) => item.id === event.target.value)
                  const next = slots.filter((slot) => slot.zone.id === event.target.value).length + 1
                  setSlotForm({ ...slotForm, zoneId: event.target.value, code: makeSlotCode(zone, next) })
                }}
                className={moduleInput}
              >
                <option value="">Chọn zone</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.code} · {zone.name}
                  </option>
                ))}
              </select>
              <input
                value={slotForm.code}
                onChange={(event) => setSlotForm({ ...slotForm, code: event.target.value })}
                className={moduleInput}
                placeholder="Mã slot"
              />
              <input
                value={slotForm.maxStackLevel}
                onChange={(event) => setSlotForm({ ...slotForm, maxStackLevel: event.target.value })}
                className={moduleInput}
                placeholder="Số tầng tối đa"
                type="number"
                min={1}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={slotForm.x}
                  onChange={(event) => setSlotForm({ ...slotForm, x: event.target.value })}
                  className={moduleInput}
                  placeholder="Tọa độ X"
                  type="number"
                />
                <input
                  value={slotForm.y}
                  onChange={(event) => setSlotForm({ ...slotForm, y: event.target.value })}
                  className={moduleInput}
                  placeholder="Tọa độ Y"
                  type="number"
                />
              </div>
              <div className="rounded border border-slate-800 bg-[#050d18] p-3 text-xs text-slate-400 md:col-span-2">
                Slot trạng thái mặc định là <b className="text-emerald-300">AVAILABLE</b>; khi sản xuất chuyển thành phẩm ra bãi, dropdown sẽ thấy slot này nếu còn tầng trống.
              </div>
            </div>
            <footer className="flex justify-end gap-2 border-t border-white/10 px-5 py-4">
              <button type="button" onClick={() => setSlotForm(null)} className={moduleMutedButton}>
                Hủy
              </button>
              <button
                type="button"
                onClick={submitSlotForm}
                disabled={createSlot.isPending || !slotForm.zoneId}
                className={modulePrimaryButton}
              >
                {createSlot.isPending ? 'Đang tạo...' : 'Tạo slot'}
              </button>
            </footer>
          </div>
        </div>
      ) : null}
    </YardActionContext.Provider>
  )
}
