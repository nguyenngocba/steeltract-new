import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { useCreateTransaction } from '../hooks/useCreateTransaction'
import { useInventoryItems } from '../hooks/useInventoryItems'
import { useMaterialDetail } from '../hooks/useMaterialDetail'
import { useProjects } from '../hooks/useProjects'
import { useSuppliers } from '../hooks/useSuppliers'
import { useZones } from '../hooks/useZones'
import { WarehouseMiniMap } from './material-table/MaterialDrawer'

type ModalProps = {
  open: boolean
  onClose: () => void
}

type CountLine = {
  inventoryItemId: string
  physicalQty: string
  zoneId: string
}

const INTERNAL_CELLS = ['A', 'B', 'C', 'D', 'E', 'F'].flatMap((row) =>
  ['01', '02', '03', '04', '05', '06'].map((column) => `${row}${column}`),
)

const INTERNAL_LEVELS = ['L1', 'L2', 'L3', 'L4']

function num(v: any) {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}

function formatCurrency(v: any) {
  return `${Math.round(num(v)).toLocaleString('vi-VN')} đ`
}

function isMainWarehouseZone(zone: any) {
  return zone?.active !== false && zone?.warehouse?.code === 'MAIN' && !String(zone?.code ?? '').startsWith('ST-WH-')
}

function isProductionWarehouseZone(zone: any) {
  return zone?.active !== false && zone?.warehouse?.code === 'PRODUCTION' && !String(zone?.code ?? '').startsWith('ST-WH-')
}

function isRealStorageZone(zone: any) {
  return zone?.active !== false && !String(zone?.code ?? '').startsWith('ST-WH-') && Boolean(zone?.row || zone?.column || zone?.level || /^[A-Z]\d{2}$/i.test(String(zone?.code ?? '')))
}

function isZoneFull(zone: any) {
  const capacity = Number(zone?.capacity ?? 0)
  if (capacity <= 0) return false
  return Number(zone?.materialCount ?? 0) >= capacity
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort()
}

function zoneSlot(zone: any) {
  return String(zone?.column ?? '').trim()
}

function zoneLevel(zone: any) {
  return String(zone?.level ?? '').trim()
}

function zoneCell(zone: any) {
  return `${String(zone?.row ?? '').trim()}${String(zone?.column ?? '').trim()}` || String(zone?.code ?? '')
}

function normalizeLevel(value?: string) {
  return String(value || 'L1').trim().toUpperCase()
}

function isCellOccupied(zone: any, cell: string, level: string, currentMaterialId?: string) {
  if (!zone || !cell) return false
  const normalizedCell = String(cell).trim().toUpperCase()
  const normalizedLevel = normalizeLevel(level)
  return (zone.cellOccupancy ?? []).some((entry: any) => {
    const occupiedByCurrent =
      currentMaterialId &&
      Array.isArray(entry.materialIds) &&
      entry.materialIds.map(String).includes(String(currentMaterialId))

    return (
      String(entry.slotId ?? '').toUpperCase() === normalizedCell &&
      normalizeLevel(entry.level) === normalizedLevel &&
      !occupiedByCurrent
    )
  })
}

function findEmptyCell(zone: any, currentMaterialId?: string) {
  if (!zone) return null
  for (const cell of INTERNAL_CELLS) {
    for (const level of INTERNAL_LEVELS) {
      if (!isCellOccupied(zone, cell, level, currentMaterialId)) return { cell, level }
    }
  }
  return null
}

function zoneDisplay(zone: any) {
  return `${zone?.code ?? 'ZONE'} · ${zone?.warehouse?.name ?? zone?.warehouseName ?? 'Kho'} · Ô ${zoneCell(zone) || '-'} · Tầng ${zone?.level ?? '-'}`
}

const primaryButtonClass =
  'rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none'
const secondaryButtonClass =
  'rounded-lg border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10'
const fieldClass =
  'h-11 rounded-lg border border-white/12 bg-white/[0.06] px-3 text-sm text-slate-100 placeholder:text-slate-500'
const textareaClass =
  'min-h-24 rounded-lg border border-white/12 bg-white/[0.06] px-3 py-3 text-sm text-slate-100 placeholder:text-slate-500'

function ModalShell({
  open,
  onClose,
  title,
  children,
  wide = false,
}: ModalProps & {
  title: string
  children: ReactNode
  wide?: boolean
}) {
  if (!open) return null

  return createPortal(
    <div className="inventory-transaction-modal fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8 backdrop-blur-sm">
      <style>{'.inventory-transaction-modal select option{background:#0f172a;color:#e2e8f0}.inventory-transaction-modal select:focus,.inventory-transaction-modal input:focus{outline:2px solid rgba(34,211,238,.55);outline-offset:1px}'}</style>
      <div className={`w-full ${wide ? 'max-w-6xl' : 'max-w-4xl'} overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/50`}>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="text-base font-semibold text-white">{title}</div>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10 hover:text-white"
          >
            Đóng
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

function MetricBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
      <div className="text-xs text-slate-400">{title}</div>
      <div className="mt-1 text-base font-semibold text-white">{value}</div>
    </div>
  )
}

export function InboundTransactionModal({ open, onClose }: ModalProps) {
  const { data: materials = [] } = useInventoryItems()
  const { data: suppliers = [] } = useSuppliers()
  const { data: zones = [] } = useZones()
  const mainZones = useMemo(() => zones.filter(isMainWarehouseZone), [zones])
  const createTransaction = useCreateTransaction()

  const [form, setForm] = useState({
    transactionDate: new Date().toISOString().slice(0, 16),
    inventoryItemId: '',
    supplierId: '',
    zoneId: '',
    slotId: '',
    level: '',
    quantity: '',
    unitPrice: '',
    vat: '10',
    remark: '',
  })

  const selectedMaterial = materials.find((x: any) => x.id === form.inventoryItemId) as any
  const currentStock = num(selectedMaterial?.quantity)
  const quantity = num(form.quantity)
  const unitPrice = num(form.unitPrice)
  const vat = num(form.vat)
  const subTotal = quantity * unitPrice
  const vatAmount = (subTotal * vat) / 100
  const total = subTotal + vatAmount
  const defaultInboundZone = useMemo(() => {
    if (selectedMaterial?.zoneId) {
      const materialZone = mainZones.find((zone: any) => String(zone.id) === String(selectedMaterial.zoneId))
      if (materialZone) return materialZone
    }
    return mainZones.find((zone: any) => !isZoneFull(zone)) ?? mainZones[0]
  }, [selectedMaterial?.zoneId, mainZones])
  const selectedInboundZone = mainZones.find((zone: any) => String(zone.id) === String(form.zoneId))
  const selectedInboundZoneFull = isZoneFull(selectedInboundZone)
  const selectedInboundCellOccupied = isCellOccupied(selectedInboundZone, form.slotId, form.level)
  const inboundEmptyCell = findEmptyCell(selectedInboundZone)
  
  useEffect(() => {
    if (!form.inventoryItemId) return

    const currentZoneIsValid =
      form.zoneId &&
      mainZones.some(
        (zone: any) =>
          String(zone.id) === String(form.zoneId),
      )

    if (currentZoneIsValid || !defaultInboundZone?.id)
      return

    setForm((prev) => ({
      ...prev,
      zoneId: defaultInboundZone.id,
    }))
  }, [
    form.inventoryItemId,
    form.zoneId,
    defaultInboundZone,
    mainZones,
  ])

  function suggestInboundLocation() {
    const zonesToScan = selectedInboundZone ? [selectedInboundZone] : mainZones
    const matchedZone = zonesToScan.find((zone: any) => findEmptyCell(zone))
    const matchedCell = findEmptyCell(matchedZone)
    if (!matchedZone || !matchedCell) return
    setForm((prev) => ({
      ...prev,
      zoneId: matchedZone.id,
      slotId: matchedCell.cell,
      level: matchedCell.level,
    }))
  }

  async function submit() {
    if (!form.inventoryItemId || quantity <= 0 || unitPrice <= 0) return
    if (selectedInboundZoneFull) return
    if (selectedInboundCellOccupied) return
    const no = `NK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`
    await createTransaction.mutateAsync({
      type: 'INBOUND',
      transactionNo: no,
      transactionDate: form.transactionDate ? new Date(form.transactionDate).toISOString() : new Date().toISOString(),
      supplierId: form.supplierId || undefined,
      supplierName: suppliers.find((x: any) => x.id === form.supplierId)?.name,
      warehouseId: selectedInboundZone?.warehouseId || undefined,
      remarks: form.remark || undefined,
      items: [
        {
          inventoryItemId: form.inventoryItemId,
          quantity,
          unitPrice,
          warehouseId: selectedInboundZone?.warehouseId || undefined,
          zoneId: form.zoneId || undefined,
          slotId: form.slotId,
          level: form.level,
        },
      ],
    })
    setForm({
      transactionDate: new Date().toISOString().slice(0, 16),
      inventoryItemId: '',
      supplierId: '',
      zoneId: '',
      slotId: '',
      level: '',
      quantity: '',
      unitPrice: '',
      vat: '10',
      remark: '',
    })
    onClose()
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Nhập kho vật tư" wide>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_420px]">
      <div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <input type="datetime-local" value={form.transactionDate} onChange={(e) => setForm((f) => ({ ...f, transactionDate: e.target.value }))} className={fieldClass} />
        <select value={form.supplierId} onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))} className={fieldClass}>
          <option value="">Nhà cung cấp</option>
          {suppliers.map((s: any) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select value={form.inventoryItemId} onChange={(e) => setForm((f) => ({ ...f, inventoryItemId: e.target.value }))} className={fieldClass}>
          <option value="">Vật tư</option>
          {materials.map((m: any) => (
            <option key={m.id} value={m.id}>
              {m.code} - {m.name}
            </option>
          ))}
        </select>
        <input value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} placeholder="Số lượng" className={fieldClass} />
        <input value={form.unitPrice} onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))} placeholder="Đơn giá nhập" className={fieldClass} />
        <div className="flex items-center rounded-lg border border-white/12 bg-white/[0.06] px-3 text-sm text-slate-300">
          Vị trí mặc định Kho chính: <span className="ml-1 text-cyan-300">{defaultInboundZone?.code ?? 'A01'} ({defaultInboundZone?.name ?? 'Warehouse Zone A01'})</span>
        </div>
        <select value={form.zoneId} onChange={(e) => setForm((f) => ({ ...f, zoneId: e.target.value }))} className={fieldClass}>
          <option value="">Vị trí nhận thuộc Kho chính</option>
          {mainZones.map((z: any) => (
            <option disabled={isZoneFull(z)} key={z.id} value={z.id}>
              {zoneDisplay(z)}{isZoneFull(z) ? ' · FULL' : ''}
            </option>
          ))}
        </select>
        <select value={form.slotId} onChange={(e) => setForm((f) => ({ ...f, slotId: e.target.value }))} className={fieldClass}>
          <option value="">Chọn ô trong vị trí</option>
          {INTERNAL_CELLS.map((cell) => {
            const occupiedOnAnyLevel = selectedInboundZone && INTERNAL_LEVELS.every((item) => isCellOccupied(selectedInboundZone, cell, item))
            return <option disabled={occupiedOnAnyLevel} key={cell} value={cell}>Ô {cell}{occupiedOnAnyLevel ? ' · đầy tầng' : ''}</option>
          })}
        </select>
        <select value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} className={fieldClass}>
          <option value="">Chọn tầng nhận</option>
          {INTERNAL_LEVELS.map((level) => {
            const occupied = selectedInboundZone && form.slotId && isCellOccupied(selectedInboundZone, form.slotId, level)
            return <option disabled={occupied} key={level} value={level}>Tầng {level}{occupied ? ' · đã có vật tư' : ''}</option>
          })}
        </select>
        <input value={form.vat} onChange={(e) => setForm((f) => ({ ...f, vat: e.target.value }))} placeholder="VAT (%)" className={fieldClass} />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
        <MetricBox title="Tồn hiện tại" value={currentStock.toLocaleString('vi-VN')} />
        <MetricBox title="Sau nhập" value={(currentStock + quantity).toLocaleString('vi-VN')} />
        <MetricBox title="Ô/Tầng" value={form.slotId ? `${form.slotId} / ${form.level || 'L1'}` : 'Chưa chọn'} />
        <MetricBox title="Sức chứa" value={selectedInboundZone ? `${num(selectedInboundZone.materialCount).toLocaleString('vi-VN')} / ${num(selectedInboundZone.capacity).toLocaleString('vi-VN')}` : 'Chưa chọn'} />
      </div>
      {selectedInboundZoneFull ? <div className="mt-3 rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-200">
        Slot/tầng này đã đầy. Vui lòng chọn vị trí hoặc tầng khác trước khi xác nhận nhập kho.
      </div> : null}
      {form.zoneId ? <div className={`mt-3 flex flex-col gap-3 rounded-xl border p-3 text-sm md:flex-row md:items-center md:justify-between ${
        selectedInboundCellOccupied
          ? 'border-red-400/40 bg-red-500/10 text-red-200'
          : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
      }`}>
        <span>
          {selectedInboundCellOccupied
            ? `Ô ${form.slotId || '-'} / ${form.level || 'L1'} đã có vật tư, không thể nhập thêm vào ô/tầng này.`
            : inboundEmptyCell
              ? `Ô trống gợi ý: ${inboundEmptyCell.cell} / ${inboundEmptyCell.level}.`
              : 'Vị trí này chưa còn ô/tầng trống khả dụng.'}
        </span>
        <button type="button" onClick={suggestInboundLocation} className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15">
          Gợi ý ô trống
        </button>
      </div> : null}
      <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm">
        <div className="text-slate-300">Thành tiền trước VAT: <span className="font-semibold text-cyan-300">{formatCurrency(subTotal)}</span></div>
        <div className="mt-1 text-slate-300">Tiền VAT: <span className="font-semibold text-cyan-300">{formatCurrency(vatAmount)}</span></div>
        <div className="mt-1 text-xl font-semibold text-white">Tổng thanh toán: <span className="text-cyan-300">{formatCurrency(total)}</span></div>
      </div>
      <div className="mt-3">
        <input type="file" className="w-full rounded-lg border border-white/12 bg-white/[0.06] px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-slate-700 file:px-3 file:py-1.5 file:text-slate-100" />
      </div>
      <textarea value={form.remark} onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))} placeholder="Ghi chú" className={`${textareaClass} mt-3 w-full`} />
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className={secondaryButtonClass}>Hủy</button>
        <button disabled={selectedInboundZoneFull || selectedInboundCellOccupied} onClick={submit} className={primaryButtonClass}>
          Xác nhận nhập kho
        </button>
      </div>
      </div>
      <WarehouseMiniMap
        compact
        zone={selectedInboundZone}
        slotId={form.slotId}
        level={form.level}
        onSelect={(cell: string, selectedLevel: string) => setForm((prev) => ({ ...prev, slotId: cell, level: selectedLevel }))}
      />
      </div>
    </ModalShell>
  )
}

export function OutboundTransactionModal({ open, onClose }: ModalProps) {
  const { data: materials = [] } = useInventoryItems()
  const { data: projects = [] } = useProjects()
  const { data: zones = [] } = useZones()
  const productionZones = useMemo(() => zones.filter(isProductionWarehouseZone), [zones])
  const createTransaction = useCreateTransaction()

  const [form, setForm] = useState({
    transactionDate: new Date().toISOString().slice(0, 16),
    target: 'PROJECT',
    projectId: '',
    inventoryItemId: '',
    zoneId: '',
    sourceSlotId: '',
    sourceLevel: '',
    productionZoneId: '',
    productionSlotId: '',
    productionLevel: '',
    quantity: '',
    remark: '',
  })
  const { data: selectedMaterialDetail } = useMaterialDetail(form.inventoryItemId || undefined)
  console.log(
    'DETAIL',
    selectedMaterialDetail,
  )
  const selectedMaterial = materials.find((x: any) => x.id === form.inventoryItemId) as any
  const currentStock = num(selectedMaterial?.quantity)
  const quantity = num(form.quantity)
  const estimatedUnitPrice = num(
    (selectedMaterialDetail as any)?.averageCost ??
      selectedMaterial?.averageCost ??
      selectedMaterial?.unitPrice,
  )
  const locationBalances = useMemo(() => {
    return Array.isArray((selectedMaterialDetail as any)?.locationBalances)
      ? ((selectedMaterialDetail as any).locationBalances as any[])
          .filter((balance) => num(balance.quantity) > 0)
      : []
  }, [selectedMaterialDetail])

  const selectedInboundZone = useMemo(() => {
    if (!form.zoneId) return null
    return zones.find((zone: any) => String(zone.id) === String(form.zoneId) && isRealStorageZone(zone)) || null
  }, [form.zoneId, zones])
  const qtyByZoneId = useMemo(() => {
    const map = new Map<string, number>()

    locationBalances.forEach((balance) => {
      if (!balance.zoneId) return

      const key = String(balance.zoneId)

      map.set(
        key,
        (map.get(key) ?? 0) +
          num(balance.quantity),
      )
    })

    return map
  }, [locationBalances])
  const availableZones = useMemo(() => {
    const zoneMap = new Map<string, any>()

    locationBalances.forEach((balance: any) => {
      if (!balance.zoneId) return

      if (!zoneMap.has(String(balance.zoneId))) {
        const zone = zones.find(
          (z: any) =>
            String(z.id) === String(balance.zoneId),
        )

        zoneMap.set(String(balance.zoneId), {
          id: String(balance.zoneId),
          code:
            zone?.code ??
            balance.zoneCode ??
            'ZONE',
          name:
            zone?.name ??
            balance.zoneName ??
            'Vị trí vật tư',
        })
      }
    })

    return Array.from(zoneMap.values())
  }, [locationBalances, zones])
  useEffect(() => {
    if (!form.inventoryItemId) return
    if (form.zoneId && availableZones.some((zone) => zone.id === String(form.zoneId))) return
    const firstZone = availableZones[0]
    if (!firstZone?.id) return
    setForm((prev) => ({ ...prev, zoneId: firstZone.id }))
  }, [form.inventoryItemId, form.zoneId, availableZones])
  
  const selectedZoneStock = form.zoneId ? qtyByZoneId.get(String(form.zoneId)) ?? 0 : 0
    const sourceLocations = useMemo(() => {
    return locationBalances
      .filter(
        (x: any) =>
          String(x.zoneId) === String(form.zoneId),
      )
      .sort((a: any, b: any) => {
        const slotCompare =
          String(a.slotId).localeCompare(
            String(b.slotId),
          )

        if (slotCompare !== 0)
          return slotCompare

        return String(a.level).localeCompare(
          String(b.level),
        )
      })
  }, [locationBalances, form.zoneId])

  useEffect(() => {
    console.log(
      JSON.stringify(
        sourceLocations,
        null,
        2,
      ),
    )
  }, [sourceLocations])

  useEffect(() => {
  if (!sourceLocations.length) return

  const currentExists = sourceLocations.some(
    (x: any) =>
      x.slotId === form.sourceSlotId &&
      x.level === form.sourceLevel,
  )

  if (currentExists) return

  const first = sourceLocations[0]

  setForm((prev) => ({
    ...prev,
    sourceSlotId: first.slotId ?? '',
    sourceLevel: first.level ?? '',
  }))
}, [
  sourceLocations,
  form.sourceSlotId,
  form.sourceLevel,
])

  const selectedSourceLocation =
    sourceLocations.find(
      (x: any) =>
        x.slotId === form.sourceSlotId &&
        x.level === form.sourceLevel,
    )

  const sourceLocationQty =
    num(selectedSourceLocation?.quantity)
  const selectedZoneAfterStock = selectedZoneStock - quantity
  const selectedSourceFullZone = zones.find((zone: any) => String(zone.id) === String(form.zoneId))
  const selectedProductionZone = productionZones.find((zone: any) => String(zone.id) === String(form.productionZoneId))
  const productionCellOccupied = form.target === 'COMPONENT_PRODUCTION'
    ? isCellOccupied(selectedProductionZone, form.productionSlotId, form.productionLevel)
    : false
  const productionEmptyCell = findEmptyCell(selectedProductionZone)
  const needsProductionLocation = form.target === 'COMPONENT_PRODUCTION'
  const canSubmit =
    Boolean(form.inventoryItemId) &&
    Boolean(form.zoneId) &&
    quantity > 0 &&
    quantity <= sourceLocationQty &&
    (!needsProductionLocation || (Boolean(form.productionZoneId) && Boolean(form.productionSlotId) && !productionCellOccupied))

  function suggestProductionDestination() {
    const zonesToScan = selectedProductionZone ? [selectedProductionZone] : productionZones
    const matchedZone = zonesToScan.find((zone: any) => findEmptyCell(zone))
    const matchedCell = findEmptyCell(matchedZone)
    if (!matchedZone || !matchedCell) return
    setForm((prev) => ({
      ...prev,
      productionZoneId: matchedZone.id,
      productionSlotId: matchedCell.cell,
      productionLevel: matchedCell.level,
    }))
  }

  async function submit() {
    if (!canSubmit) return
    const no = `XK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`
    const isProductionTarget = form.target === 'COMPONENT_PRODUCTION'
    const targetTag = isProductionTarget ? '[COMPONENT_PRODUCTION]' : '[PROJECT]'
    await createTransaction.mutateAsync({
      type: isProductionTarget ? 'TRANSFER' : 'OUTBOUND',
      transactionNo: no,
      transactionDate: form.transactionDate ? new Date(form.transactionDate).toISOString() : new Date().toISOString(),
      projectId: form.projectId || undefined,
      projectName: projects.find((x: any) => x.id === form.projectId)?.name,
      zoneId: form.zoneId,
      warehouseId: isProductionTarget ? selectedProductionZone?.warehouseId : undefined,
      remarks: `${targetTag} ${form.remark}`.trim(),
      items: isProductionTarget ? [
        {
          inventoryItemId: form.inventoryItemId,
          quantity: -Math.abs(quantity),
          zoneId: form.zoneId || undefined,
          slotId: form.sourceSlotId,
          level: form.sourceLevel,
        },
        {
          inventoryItemId: form.inventoryItemId,
          quantity: Math.abs(quantity),
          warehouseId: selectedProductionZone?.warehouseId || undefined,
          zoneId: form.productionZoneId || undefined,
          slotId: form.productionSlotId,
          level: form.productionLevel,
          unitPrice: estimatedUnitPrice || undefined,
        },
      ] : [
        {
          inventoryItemId: form.inventoryItemId,
          quantity: -Math.abs(quantity),
          zoneId: form.zoneId || undefined,
          slotId: form.sourceSlotId,
          level: form.sourceLevel,
        },
      ],
    })
    setForm({
      transactionDate: new Date().toISOString().slice(0, 16),
      target: 'PROJECT',
      projectId: '',
      inventoryItemId: '',
      zoneId: '',
      sourceSlotId: '',
      sourceLevel: '',
      productionZoneId: '',
      productionSlotId: '',
      productionLevel: '',
      quantity: '',
      remark: '',
    })
    onClose()
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Xuất kho vật tư" wide>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_420px]">
      <div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <input type="datetime-local" value={form.transactionDate} onChange={(e) => setForm((f) => ({ ...f, transactionDate: e.target.value }))} className={fieldClass} />
        <select value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value, projectId: e.target.value === 'COMPONENT_PRODUCTION' ? '' : f.projectId }))} className={fieldClass}>
          <option value="PROJECT">Xuất cho công trình</option>
          <option value="COMPONENT_PRODUCTION">Xuất cho sản xuất cấu kiện</option>
        </select>
        <select disabled={form.target === 'COMPONENT_PRODUCTION'} value={form.projectId} onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))} className={`${fieldClass} disabled:cursor-not-allowed disabled:opacity-50`}>
          <option value="">Đơn vị nhận</option>
          {projects.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select value={form.inventoryItemId} onChange={(e) => setForm((f) => ({ ...f, inventoryItemId: e.target.value, zoneId: '' }))} className={fieldClass}>
          <option value="">Vật tư</option>
          {materials.map((m: any) => (
            <option key={m.id} value={m.id}>
              {m.code} - {m.name}
            </option>
          ))}
        </select>
        <input value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} placeholder="Số lượng" className={fieldClass} />
        <select
          value={`${form.zoneId}|${form.sourceSlotId}|${form.sourceLevel}`}
          onChange={(e) => {
            const [zoneId, slotId, level] =
              e.target.value.split('|')

            setForm((prev) => ({
              ...prev,
              zoneId,
              sourceSlotId: slotId,
              sourceLevel: level,
            }))
          }}
          className={fieldClass}
        >
          <option value="">
            Chọn vị trí vật tư
          </option>

          {locationBalances.map((loc: any) => (
            <option
              key={`${loc.zoneId}-${loc.slotId}-${loc.level}`}
              value={`${loc.zoneId}|${loc.slotId}|${loc.level}`}
            >
              {loc.zoneCode}
              {' / '}
              {loc.slotId}
              {' / '}
              {loc.level}
              {' - '}
              {num(loc.quantity).toLocaleString('vi-VN')}
            </option>
          ))}
        </select>
        
        <div className="flex items-center rounded-lg border border-white/12 bg-white/[0.06] px-3 text-sm text-slate-300">
          Tồn ô/tầng đã chọn:
          <span className="ml-1 text-cyan-300">
            {sourceLocationQty.toLocaleString('vi-VN')}
          </span>
        </div>
      </div>
      {form.target === 'COMPONENT_PRODUCTION' ? <div className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3">
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">Vị trí nhận Kho vật tư SX</div>
            <div className="mt-1 text-xs text-slate-400">Chọn nơi đặt vật tư sau khi xuất khỏi kho chính.</div>
          </div>
          <button type="button" onClick={suggestProductionDestination} className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15">
            Gợi ý ô trống
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select value={form.productionZoneId} onChange={(e) => setForm((f) => ({ ...f, productionZoneId: e.target.value, productionSlotId: '', productionLevel: '' }))} className={fieldClass}>
            <option value="">Vị trí kho SX nhận</option>
            {productionZones.map((zone: any) => <option key={zone.id} value={zone.id}>{zone.code} - {zone.name}</option>)}
          </select>
          <select value={form.productionSlotId} onChange={(e) => setForm((f) => ({ ...f, productionSlotId: e.target.value }))} className={fieldClass}>
            <option value="">Ô nhận</option>
            {INTERNAL_CELLS.map((cell) => {
              const occupiedOnAnyLevel = selectedProductionZone && INTERNAL_LEVELS.every((level) => isCellOccupied(selectedProductionZone, cell, level))
              return <option disabled={occupiedOnAnyLevel} key={cell} value={cell}>Ô {cell}{occupiedOnAnyLevel ? ' · đầy tầng' : ''}</option>
            })}
          </select>
          <select value={form.productionLevel} onChange={(e) => setForm((f) => ({ ...f, productionLevel: e.target.value }))} className={fieldClass}>
            <option value="">Tầng nhận</option>
            {INTERNAL_LEVELS.map((level) => {
              const occupied = selectedProductionZone && form.productionSlotId && isCellOccupied(selectedProductionZone, form.productionSlotId, level)
              return <option disabled={occupied} key={level} value={level}>Tầng {level}{occupied ? ' · đã có vật tư' : ''}</option>
            })}
          </select>
        </div>
        <div className={`mt-3 rounded-lg border px-3 py-2 text-sm ${productionCellOccupied ? 'border-red-400/40 bg-red-500/10 text-red-200' : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'}`}>
          {productionCellOccupied
            ? `Ô ${form.productionSlotId || '-'} / ${form.productionLevel || 'L1'} ở Kho vật tư SX đã có vật tư.`
            : productionEmptyCell
              ? `Ô trống gợi ý: ${productionEmptyCell.cell} / ${productionEmptyCell.level}.`
              : form.productionZoneId ? 'Vị trí này chưa còn ô/tầng trống khả dụng.' : 'Chọn vị trí kho SX hoặc dùng gợi ý ô trống.'}
        </div>
      </div> : null}
      <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
        <MetricBox title="Tồn hiện tại" value={currentStock.toLocaleString('vi-VN')} />
        <MetricBox title="Tồn sau xuất" value={Math.max(0, currentStock - quantity).toLocaleString('vi-VN')} />
        <MetricBox
            title="Tồn ô/tầng"
            value={sourceLocationQty.toLocaleString('vi-VN')}
          />

        <MetricBox
            title="Sau xuất ô/tầng"
            value={Math.max(
              0,
              sourceLocationQty - quantity,
            ).toLocaleString('vi-VN')}
          />
      </div>
      <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm">
        <div className="text-slate-300">Giá trị xuất dự kiến: <span className="font-semibold text-cyan-300">{formatCurrency(quantity * estimatedUnitPrice)}</span></div>
        <div className="mt-1 text-slate-300">Đối tượng xuất: <span className="font-semibold text-white">{form.target === 'COMPONENT_PRODUCTION' ? 'Sản xuất cấu kiện' : 'Công trình'}</span></div>
        {form.target === 'COMPONENT_PRODUCTION' ? <div className="mt-1 text-slate-300">Vị trí nhận: <span className="font-semibold text-white">{selectedProductionZone ? `${selectedProductionZone.code} / ${form.productionSlotId || '-'} / ${form.productionLevel || 'L1'}` : 'Chưa chọn'}</span></div> : null}
      </div>
      {form.inventoryItemId && availableZones.length === 0 && (
        <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
          Vật tư này chưa có vị trí tồn khả dụng. Hãy nhập kho hoặc gán vị trí tồn trước khi xuất.
        </div>
      )}
      {form.zoneId && quantity > sourceLocationQty && (
        <div className="mt-3 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-100">
          Số lượng xuất lớn hơn tồn của ô/tầng đã chọn.
        </div>
      )}
      <div className="mt-3">
        <input type="file" className="w-full rounded-lg border border-white/12 bg-white/[0.06] px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-slate-700 file:px-3 file:py-1.5 file:text-slate-100" />
      </div>
      <textarea value={form.remark} onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))} placeholder="Ghi chú" className={`${textareaClass} mt-3 w-full`} />
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className={secondaryButtonClass}>Hủy</button>
        <button disabled={!canSubmit} onClick={submit} className={primaryButtonClass}>
          Xác nhận xuất kho
        </button>
      </div>
      </div>
      <div className="space-y-3">
        <WarehouseMiniMap
          compact
          zone={selectedSourceFullZone}
          slotId={form.sourceSlotId}
          level={form.sourceLevel}
          onSelect={(cell: string, selectedLevel: string) => setForm((prev) => ({ ...prev, sourceSlotId: cell, sourceLevel: selectedLevel }))}
        />
        {form.target === 'COMPONENT_PRODUCTION' ? (
          <WarehouseMiniMap
            compact
            zone={selectedProductionZone}
            slotId={form.productionSlotId}
            level={form.productionLevel}
            onSelect={(cell: string, selectedLevel: string) => setForm((prev) => ({ ...prev, productionSlotId: cell, productionLevel: selectedLevel }))}
          />
        ) : null}
      </div>
      </div>
    </ModalShell>
  )
}

export function TransferTransactionModal({ open, onClose }: ModalProps) {
  const { data: materials = [] } = useInventoryItems()
  const { data: zones = [] } = useZones()
  const realZones = useMemo(() => zones.filter(isRealStorageZone), [zones])
  const createTx = useCreateTransaction()
  const [form, setForm] = useState({
    transactionDate: new Date().toISOString().slice(0, 16),
    materialId: '',
    fromZoneId: '',
    toZoneId: '',
    fromSlotId: '',
    fromLevel: '',
    toSlotId: '',
    toLevel: '',
    quantity: '',
    reason: '',
  })

  const { data: selectedMaterialDetail } = useMaterialDetail(form.materialId || undefined)
  const selectedMaterial = materials.find((x: any) => x.id === form.materialId) as any
  const currentStock = num(selectedMaterial?.quantity)

  const sourceZoneOptions = useMemo(() => {
    const balances = Array.isArray((selectedMaterialDetail as any)?.locationBalances)
      ? ((selectedMaterialDetail as any).locationBalances as any[]).filter((b: any) => num(b.quantity) > 0)
      : []
    const byId = new Map<string, any>(realZones.map((z: any) => [String(z.id), z]))
    if (balances.length === 0) {
      const fallbackZone = selectedMaterial?.zoneId
        ? realZones.find((zone: any) => String(zone.id) === String(selectedMaterial.zoneId))
        : realZones[0]
      const fallbackZoneId = selectedMaterial?.zoneId ?? fallbackZone?.id
      if (!fallbackZoneId || currentStock <= 0) return []
      return [
        {
          id: String(fallbackZoneId),
          label: `${selectedMaterial?.zoneCode ?? fallbackZone?.code ?? 'ZONE'} - ${selectedMaterial?.zone ?? fallbackZone?.name ?? ''}`,
          qty: currentStock,
          zoneCode: selectedMaterial?.zoneCode ?? fallbackZone?.code ?? 'ZONE',
          warehouseName: fallbackZone?.warehouse?.name ?? '',
          row: fallbackZone?.row ?? '',
          column: fallbackZone?.column ?? '',
          level: fallbackZone?.level ?? '',
        },
      ]
    }
    return balances
      .filter((b: any) => num(b.quantity) > 0)
      .map((b: any) => {
        const zone = byId.get(String(b.zoneId))
        const zoneCode = zone?.code ?? b.zoneCode ?? 'NA'
        const zoneName = zone?.name ?? ''
        return {
          id: [b.zoneId, b.slotId ?? '', b.level ?? ''].join('|'),
          zoneId: String(b.zoneId),
          slotId: b.slotId ?? '',
          level: b.level ?? '',
          label: `${zoneCode} - ${zoneName}`,
          qty: num(b.quantity),
          zoneCode,
          warehouseName: zone?.warehouse?.name ?? b.warehouseName ?? '',
          row: zone?.row ?? b.row ?? '',
          column: zone?.column ?? b.column ?? '',
          level: zone?.level ?? b.level ?? '',
        }
      })
  }, [selectedMaterialDetail, realZones, selectedMaterial, currentStock])

  const destinationZoneOptions = useMemo(() => {
    return realZones
      .filter((z: any) => String(z.id) !== form.fromZoneId)
      .map((z: any) => {
        const matched = sourceZoneOptions.find((s) => s.id === String(z.id))
        return {
          id: String(z.id),
          label: `${z.code} - ${z.name}`,
          qty: matched?.qty ?? 0,
          zoneCode: z.code,
          warehouseName: z.warehouse?.name ?? '',
          row: z.row ?? '',
          column: z.column ?? '',
          level: z.level ?? '',
        }
      })
  }, [realZones, form.fromZoneId, sourceZoneOptions])

  const sourceQty = useMemo(() => {
    const selected = sourceZoneOptions.find((s) => s.id === form.fromZoneId)
    return num(selected?.qty)
  }, [sourceZoneOptions, form.fromZoneId])
  const selectedSourceZone = sourceZoneOptions.find((zone) => zone.id === form.fromZoneId)
  const selectedDestinationZone = destinationZoneOptions.find((zone) => zone.id === form.toZoneId)
  const selectedSourceFullZone = realZones.find((zone: any) => String(zone.id) === String(form.fromZoneId))
  const selectedDestinationFullZone = realZones.find((zone: any) => String(zone.id) === String(form.toZoneId))
  const destinationCellOccupied = isCellOccupied(selectedDestinationFullZone, form.toSlotId, form.toLevel)
  const destinationEmptyCell = findEmptyCell(selectedDestinationFullZone)
  const transferQty = num(form.quantity)
  const canTransfer =
    Boolean(form.materialId) &&
    Boolean(form.fromZoneId) &&
    Boolean(form.toZoneId) &&
    form.fromZoneId !== form.toZoneId &&
    transferQty > 0 &&
    transferQty <= sourceQty &&
    !destinationCellOccupied
  
  useEffect(() => {
    if (!form.materialId) return
    const nextFromZoneId = sourceZoneOptions.some((zone) => zone.id === form.fromZoneId)
      ? form.fromZoneId
      : sourceZoneOptions[0]?.id ?? ''
    const nextToZoneId = destinationZoneOptions.some((zone) => zone.id === form.toZoneId)
      ? form.toZoneId
      : destinationZoneOptions.find((zone) => zone.id !== nextFromZoneId)?.id ?? ''

    if (nextFromZoneId === form.fromZoneId && nextToZoneId === form.toZoneId) return
    setForm((prev) => ({
      ...prev,
      fromZoneId: nextFromZoneId,
      toZoneId: nextToZoneId,
    }))
  }, [form.materialId, form.fromZoneId, form.toZoneId, sourceZoneOptions, destinationZoneOptions])

  async function submitTransfer() {
    const qty = num(form.quantity)
    if (!canTransfer) return

    const no = `DC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`
    await createTx.mutateAsync({
      type: 'TRANSFER',
      transactionNo: no,
      transactionDate: form.transactionDate ? new Date(form.transactionDate).toISOString() : new Date().toISOString(),
      remarks: form.reason || undefined,
      items: [
        {
          inventoryItemId: form.materialId,
          zoneId: form.fromZoneId,
          slotId: form.fromSlotId,
          level: form.fromLevel,
          quantity: -Math.abs(qty),
        },
        {
          inventoryItemId: form.materialId,
          zoneId: form.toZoneId,
          slotId: form.toSlotId,
          level: form.toLevel,
          quantity: Math.abs(qty),
        },
      ],
    })

    setForm({
      transactionDate: new Date().toISOString().slice(0, 16),
      materialId: '',
      fromZoneId: '',
      toZoneId: '',
      fromSlotId: '',
      fromLevel: '',
      toSlotId: '',
      toLevel: '',
      quantity: '',
      reason: '',
    })
    onClose()
  }

  function suggestTransferDestination() {
    const zonesToScan = selectedDestinationFullZone
      ? [selectedDestinationFullZone]
      : realZones.filter((zone: any) => String(zone.id) !== String(form.fromZoneId))
    const matchedZone = zonesToScan.find((zone: any) => findEmptyCell(zone))
    const matchedCell = findEmptyCell(matchedZone)
    if (!matchedZone || !matchedCell) return

    setForm((prev) => ({
      ...prev,
      toZoneId: matchedZone.id,
      toSlotId: matchedCell.cell,
      toLevel: matchedCell.level,
    }))
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Tạo điều chuyển mới" wide>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <input type="datetime-local" value={form.transactionDate} onChange={(e) => setForm((f) => ({ ...f, transactionDate: e.target.value }))} className={fieldClass} />
            <select value={form.materialId} onChange={(e) => setForm((f) => ({ ...f, materialId: e.target.value, fromZoneId: '', toZoneId: '' }))} className={fieldClass}>
              <option value="">Vật tư</option>
              {materials.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.code} - {m.name}
                </option>
              ))}
            </select>
            <select value={form.fromZoneId} onChange={(e) => {
  const selected = sourceZoneOptions.find(
    (s) => s.id === e.target.value
  )

  setForm((f) => ({
    ...f,
    fromZoneId: selected?.zoneId ?? '',
    fromSlotId: selected?.slotId ?? '',
    fromLevel: selected?.level ?? '',
  }))
}} className={fieldClass}>
              <option value="">Từ vị trí kho</option>
              {sourceZoneOptions.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.zoneCode} · {z.warehouseName || 'Kho'} · Ô {zoneCell(z) || '-'} · Tầng {z.level || '-'} · tồn {z.qty.toLocaleString('vi-VN')}
                </option>
              ))}
            </select>
            <select value={form.toZoneId} onChange={(e) => setForm((f) => ({ ...f, toZoneId: e.target.value }))} className={fieldClass}>
              <option value="">Đến vị trí kho</option>
              {destinationZoneOptions.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.zoneCode} · {z.warehouseName || 'Kho'} · Ô {zoneCell(z) || '-'} · Tầng {z.level || '-'}
                </option>
              ))}
            </select>
            <select value={form.fromSlotId} onChange={(e) => setForm((f) => ({ ...f, fromSlotId: e.target.value }))} className={fieldClass}>
              <option value="">Ô nguồn</option>
              {INTERNAL_CELLS.map((cell) => <option key={cell} value={cell}>Ô {cell}</option>)}
            </select>
            <select value={form.fromLevel} onChange={(e) => setForm((f) => ({ ...f, fromLevel: e.target.value }))} className={fieldClass}>
              <option value="">Tầng nguồn</option>
              {INTERNAL_LEVELS.map((level) => <option key={level} value={level}>Tầng {level}</option>)}
            </select>
            <select value={form.toSlotId} onChange={(e) => setForm((f) => ({ ...f, toSlotId: e.target.value }))} className={fieldClass}>
              <option value="">Ô đích</option>
              {INTERNAL_CELLS.map((cell) => {
                const occupiedOnAnyLevel = selectedDestinationFullZone && INTERNAL_LEVELS.every((level) => isCellOccupied(selectedDestinationFullZone, cell, level))
                return <option disabled={occupiedOnAnyLevel} key={cell} value={cell}>Ô {cell}{occupiedOnAnyLevel ? ' · đầy tầng' : ''}</option>
              })}
            </select>
            <select value={form.toLevel} onChange={(e) => setForm((f) => ({ ...f, toLevel: e.target.value }))} className={fieldClass}>
              <option value="">Tầng đích</option>
              {INTERNAL_LEVELS.map((level) => {
                const occupied = selectedDestinationFullZone && form.toSlotId && isCellOccupied(selectedDestinationFullZone, form.toSlotId, level)
                return <option disabled={occupied} key={level} value={level}>Tầng {level}{occupied ? ' · đã có vật tư' : ''}</option>
              })}
            </select>
            <input value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} placeholder="Số lượng" className={fieldClass} />
            <input value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Lý do điều chuyển" className={fieldClass} />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 text-sm xl:grid-cols-2">
            <MetricBox title="Tồn tại nguồn" value={sourceQty.toLocaleString('vi-VN')} />
            <MetricBox title="Sau điều chuyển" value={Math.max(0, sourceQty - num(form.quantity)).toLocaleString('vi-VN')} />
            <MetricBox title="Nguồn" value={selectedSourceZone ? `${selectedSourceZone.warehouseName || 'Kho'} / ${form.fromSlotId || '-'} / ${form.fromLevel || 'L1'}` : 'Chưa chọn'} />
            <MetricBox title="Đích" value={selectedDestinationZone ? `${selectedDestinationZone.warehouseName || 'Kho'} / ${form.toSlotId || '-'} / ${form.toLevel || 'L1'}` : 'Chưa chọn'} />
          </div>
          {form.toZoneId ? <div className={`mt-3 flex flex-col gap-3 rounded-xl border p-3 text-sm md:flex-row md:items-center md:justify-between ${
            destinationCellOccupied
              ? 'border-red-400/40 bg-red-500/10 text-red-200'
              : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
          }`}>
            <span>
              {destinationCellOccupied
                ? `Ô đích ${form.toSlotId || '-'} / ${form.toLevel || 'L1'} đã có vật tư.`
                : destinationEmptyCell
                  ? `Ô đích trống gợi ý: ${destinationEmptyCell.cell} / ${destinationEmptyCell.level}.`
                  : 'Vị trí đích chưa còn ô/tầng trống khả dụng.'}
            </span>
            <button type="button" onClick={suggestTransferDestination} className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15">
              Gợi ý ô đích trống
            </button>
          </div> : null}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.055] p-4">
          <div className="mb-3 text-sm font-semibold text-white">Sơ đồ điều chuyển hàng hóa</div>
          <div className="grid grid-cols-3 items-center gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3 text-center text-sm text-slate-200">
              <div className="text-xs text-slate-400">KHO XUẤT</div>
              <div className="mt-1 font-semibold">{sourceZoneOptions.find((x) => x.id === form.fromZoneId)?.zoneCode ?? '--'}</div>
            </div>
            <div className="text-center text-2xl text-cyan-400">→</div>
            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3 text-center text-sm text-slate-200">
              <div className="text-xs text-slate-400">KHO NHẬP</div>
              <div className="mt-1 font-semibold">{destinationZoneOptions.find((x) => x.id === form.toZoneId)?.zoneCode ?? '--'}</div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-5 gap-2 text-center text-xs">
            {['Tạo phiếu', 'Duyệt phiếu', 'Đang vận chuyển', 'Nhận hàng', 'Hoàn thành'].map((step, idx) => (
              <div key={step} className="text-slate-300">
                <div className={`mx-auto mb-2 h-2 w-full rounded ${idx < 3 ? 'bg-cyan-500' : 'bg-slate-700'}`} />
                {step}
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3">
            <WarehouseMiniMap
              compact
              zone={selectedSourceFullZone}
              slotId={form.fromSlotId}
              level={form.fromLevel}
              onSelect={(cell: string, selectedLevel: string) => setForm((prev) => ({ ...prev, fromSlotId: cell, fromLevel: selectedLevel }))}
            />
            <WarehouseMiniMap
              compact
              zone={selectedDestinationFullZone}
              slotId={form.toSlotId}
              level={form.toLevel}
              onSelect={(cell: string, selectedLevel: string) => setForm((prev) => ({ ...prev, toSlotId: cell, toLevel: selectedLevel }))}
            />
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button disabled={!canTransfer} onClick={submitTransfer} className={primaryButtonClass}>
          Tạo phiếu điều chuyển
        </button>
      </div>
    </ModalShell>
  )
}

export function StockTakeTransactionModal({ open, onClose }: ModalProps) {
  const { data: materials = [] } = useInventoryItems()
  const { data: zones = [] } = useZones()
  const createTx = useCreateTransaction()
  const [methodFilter, setMethodFilter] = useState('')
  const [sessionNo, setSessionNo] = useState(`KK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`)
  const [countRows, setCountRows] = useState<CountLine[]>([])

  const countSheet = useMemo(() => {
    return countRows.map((row) => {
      const item = materials.find((x: any) => x.id === row.inventoryItemId) as any
      const systemQty = num(item?.quantity)
      const physical = num(row.physicalQty)
      return {
        ...row,
        item,
        systemQty,
        difference: physical - systemQty,
      }
    })
  }, [countRows, materials])

  async function submitCount() {
    const items = countSheet
      .filter((x) => x.item && x.difference !== 0)
      .map((x) => ({
        inventoryItemId: x.inventoryItemId,
        zoneId: x.zoneId || undefined,
        quantity: x.difference,
      }))
    if (items.length === 0) return
    await createTx.mutateAsync({
      type: 'ADJUSTMENT',
      transactionNo: sessionNo,
      referenceType: methodFilter || 'Định kỳ',
      items,
    })
    setCountRows([])
    setSessionNo(`KK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`)
    onClose()
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Chi tiết chênh lệch kiểm kê" wide>
      <div className="mb-3 flex items-center justify-between gap-3">
        <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100">
          <option value="">Phương pháp</option>
          <option value="Định kỳ">Định kỳ</option>
          <option value="Bất thường">Bất thường</option>
          <option value="Kiểm kê theo khu vực">Kiểm kê theo khu vực</option>
        </select>
        <button
          onClick={() => setCountRows((prev) => [...prev, { inventoryItemId: '', physicalQty: '', zoneId: '' }])}
          className="rounded border border-white/10 px-3 py-1.5 text-xs text-slate-200"
        >
          + Thêm dòng
        </button>
      </div>

      <div className="overflow-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-white/[0.06] text-xs uppercase text-slate-400">
            <tr>
              {['Vật tư', 'Kho', 'Tồn hệ thống', 'Tồn thực tế', 'Chênh lệch', 'Hành động'].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {countSheet.map((line, idx) => (
              <tr key={`${idx}-${line.inventoryItemId}`} className="border-t border-white/10/80">
                <td className="px-3 py-2">
                  <select value={line.inventoryItemId} onChange={(e) => setCountRows((prev) => prev.map((r, i) => (i === idx ? { ...r, inventoryItemId: e.target.value } : r)))} className="h-9 w-full rounded border border-white/10 bg-white/[0.06] px-2 text-slate-100">
                    <option value="">Chọn vật tư</option>
                    {materials.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.code} - {m.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select value={line.zoneId} onChange={(e) => setCountRows((prev) => prev.map((r, i) => (i === idx ? { ...r, zoneId: e.target.value } : r)))} className="h-9 w-full rounded border border-white/10 bg-white/[0.06] px-2 text-slate-100">
                    <option value="">Chọn kho</option>
                    {zones.map((z: any) => (
                      <option key={z.id} value={z.id}>
                        {z.code}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-slate-200">{line.systemQty.toLocaleString('vi-VN')}</td>
                <td className="px-3 py-2">
                  <input value={line.physicalQty} onChange={(e) => setCountRows((prev) => prev.map((r, i) => (i === idx ? { ...r, physicalQty: e.target.value } : r)))} className="h-9 w-32 rounded border border-white/10 bg-white/[0.06] px-2 text-slate-100" />
                </td>
                <td className={`px-3 py-2 ${line.difference >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{line.difference.toLocaleString('vi-VN')}</td>
                <td className="px-3 py-2">
                  <button onClick={() => setCountRows((prev) => prev.filter((_r, i) => i !== idx))} className="rounded border border-red-700/60 px-2 py-1 text-xs text-red-300">
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-slate-400">Phiếu: {sessionNo}</div>
        <button onClick={submitCount} className={primaryButtonClass}>
          Tạo phiếu kiểm kê
        </button>
      </div>
    </ModalShell>
  )
}
