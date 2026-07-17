import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getInboundSuggestions } from '../api/inventory.api'
import { useCreateTransaction } from '../hooks/useCreateTransaction'
import { useInventoryItems } from '../hooks/useInventoryItems'
import { useMaterialDetail } from '../hooks/useMaterialDetail'
import { useProjects } from '../hooks/useProjects'
import { useSuppliers } from '../hooks/useSuppliers'
import { useZones } from '../hooks/useZones'
import { WarehouseMiniMap } from './material-table/MaterialDrawer'
import {
  InventoryAttachmentPicker,
  uploadInventoryTransactionAttachments,
  type InventoryAttachmentDraft,
} from './InventoryAttachmentPanel'
import { nextLocalCode } from '@/shared/utils/code-format'
import { formatLocalDateTimeInput } from '@/shared/utils/date-time'
import { formatCurrencyInput, formatCurrencyVnd, formatQuantity, formatQuantityInput, parseLocaleNumber } from '@/shared/utils/number-format'

type ModalProps = {
  open: boolean
  onClose: () => void
}

type CountLine = {
  inventoryItemId: string
  physicalQty: string
  zoneId: string
}

const ADJUSTMENT_REASONS = [
  'Kiểm kê định kỳ',
  'Sai lệch nhập liệu',
  'Hư hỏng',
  'Thất thoát',
  'Hoàn trả',
  'Điều chỉnh đầu kỳ',
  'Khác',
]

const INTERNAL_CELLS = ['A', 'B', 'C', 'D', 'E', 'F'].flatMap((row) =>
  ['01', '02', '03', '04', '05', '06'].map((column) => `${row}${column}`),
)

const INTERNAL_LEVELS = ['L1', 'L2', 'L3', 'L4']

function num(v: any) {
  const n = parseLocaleNumber(v)
  return Number.isFinite(n) ? n : 0
}

function formatCurrency(v: any) {
  return formatCurrencyVnd(v)
}

function formatShortDate(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

function formatPercent(value?: number | null) {
  if (value == null || !Number.isFinite(Number(value))) return null
  return `${Math.round(Number(value))}%`
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

function generateTransactionNo(prefix: string) {
  return nextLocalCode(prefix)
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
async function refreshInventoryCache(
  queryClient: any,
) {
  await queryClient.invalidateQueries({
    predicate: (query) =>
      Array.isArray(query.queryKey) &&
      query.queryKey.some(
        (k) =>
          typeof k === 'string' &&
          (
            k.includes('inventory') ||
            k.includes('material') ||
            k.includes('zone') ||
            k.includes('warehouse')
          ),
      ),
  })

  await queryClient.refetchQueries({
    predicate: (query) =>
      Array.isArray(query.queryKey) &&
      query.queryKey.some(
        (k) =>
          typeof k === 'string' &&
          (
            k.includes('inventory') ||
            k.includes('material') ||
            k.includes('zone') ||
            k.includes('warehouse')
          ),
      ),
  })
}
function ModalShell({
  open,
  onClose,
  title,
  children,
  wide = false,
  maxWidthClass,
}: ModalProps & {
  title: string
  children: ReactNode
  wide?: boolean
  maxWidthClass?: string
}) {
  if (!open) return null
  const modalWidthClass = maxWidthClass ?? (wide ? 'max-w-7xl' : 'max-w-4xl')

  return createPortal(
    <div className="inventory-transaction-modal fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8 backdrop-blur-sm">
      <style>{'.inventory-transaction-modal select option{background:#0f172a;color:#e2e8f0}.inventory-transaction-modal select:focus,.inventory-transaction-modal input:focus{outline:2px solid rgba(34,211,238,.55);outline-offset:1px}'}</style>
      <div className={`w-full ${modalWidthClass} overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/50`}>
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
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    transactionDate: formatLocalDateTimeInput(),
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
  const [attachmentFiles, setAttachmentFiles] = useState<InventoryAttachmentDraft[]>([])
  const [unitPriceEdited, setUnitPriceEdited] = useState(false)

  // Local state for pending items list
  const [pendingItems, setPendingItems] = useState<any[]>([])
  const [showPendingList, setShowPendingList] = useState(false)

  const selectedMaterial = materials.find((x: any) => x.id === form.inventoryItemId) as any
  const { data: inboundSuggestion } = useQuery({
    queryKey: ['inventory-inbound-suggestions', form.inventoryItemId],
    queryFn: () => getInboundSuggestions(form.inventoryItemId),
    enabled: open && Boolean(form.inventoryItemId),
  })
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

  const validInboundLocations = useMemo(() => {
    return mainZones.flatMap((zone: any) =>
      INTERNAL_CELLS.flatMap((cell) =>
        INTERNAL_LEVELS
          .filter((level) => !isCellOccupied(zone, cell, level))
          .map((level) => ({
            zone,
            cell,
            level,
          })),
      ),
    )
  }, [mainZones])

  const missingInboundLocation =
    quantity > 0 && (!form.zoneId || !form.slotId || !form.level)
  const missingInboundLocationCount = missingInboundLocation ? 1 : 0
  const priceDeltaPercent =
    inboundSuggestion?.lastPrice?.unitPrice && unitPrice > 0
      ? Math.abs(unitPrice - Number(inboundSuggestion.lastPrice.unitPrice)) /
        Number(inboundSuggestion.lastPrice.unitPrice)
      : 0
  const hasLargePriceDelta = priceDeltaPercent > 0.3

  // Verification helper for single line item adding to Pending
  const canAddPending =
    Boolean(form.inventoryItemId) &&
    quantity > 0 &&
    unitPrice > 0 &&
    !missingInboundLocation &&
    !selectedInboundZoneFull &&
    !selectedInboundCellOccupied

  useEffect(() => {
    if (!open) return

    setForm((prev) => ({
      ...prev,
      transactionDate: formatLocalDateTimeInput(),
    }))
  }, [open])

  useEffect(() => {
    if (!form.inventoryItemId || unitPriceEdited) return
    const suggestedPrice = Number(
      inboundSuggestion?.lastPrice?.unitPrice ?? 0,
    )
    if (suggestedPrice <= 0 || form.unitPrice) return

    setForm((prev) => ({
      ...prev,
      unitPrice: formatCurrencyInput(String(suggestedPrice)),
    }))
  }, [
    form.inventoryItemId,
    form.unitPrice,
    inboundSuggestion?.lastPrice?.unitPrice,
    unitPriceEdited,
  ])

  useEffect(() => {
    if (
      !form.inventoryItemId ||
      form.zoneId ||
      form.slotId ||
      form.level ||
      validInboundLocations.length !== 1
    ) {
      return
    }

    const [onlyLocation] = validInboundLocations
    setForm((prev) => ({
      ...prev,
      zoneId: onlyLocation.zone.id,
      slotId: onlyLocation.cell,
      level: onlyLocation.level,
    }))
  }, [
    form.inventoryItemId,
    form.zoneId,
    form.slotId,
    form.level,
    validInboundLocations,
  ])

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

  // --- Multi-material local workflows ---
  function handleAddPending() {
    if (!canAddPending) return

    const newItem = {
      id: Date.now() + Math.random().toString(),
      inventoryItemId: form.inventoryItemId,
      materialCode: selectedMaterial?.code || 'NA',
      materialName: selectedMaterial?.name || '-',
      unit: selectedMaterial?.unit || 'tấn',
      quantity,
      unitPrice,
      vat,
      zoneId: form.zoneId,
      zoneCode: selectedInboundZone?.code || 'ZONE',
      warehouseId: selectedInboundZone?.warehouseId,
      warehouseName: selectedInboundZone?.name || '-',
      slotId: form.slotId,
      level: form.level,
    }

    setPendingItems((prev) => {
      // Merging Rule: Exact duplicate -> Merge. Khác location/UOM -> Không merge.
      const idx = prev.findIndex(
        (x) =>
          String(x.inventoryItemId) === String(newItem.inventoryItemId) &&
          String(x.zoneId) === String(newItem.zoneId) &&
          String(x.slotId) === String(newItem.slotId) &&
          String(x.level) === String(newItem.level) &&
          x.unit === newItem.unit
      )
      if (idx > -1) {
        const updated = [...prev]
        updated[idx] = {
          ...updated[idx],
          quantity: updated[idx].quantity + newItem.quantity,
        }
        return updated
      }
      return [...prev, newItem]
    })

    // Reset line items in form
    setForm((prev) => ({
      ...prev,
      inventoryItemId: '',
      zoneId: '',
      slotId: '',
      level: '',
      quantity: '',
      unitPrice: '',
      vat: '10',
    }))
    setUnitPriceEdited(false)
    toast.success('Đã thêm vật tư vào danh sách chờ')
  }

  function handleRemovePending(id: string) {
    setPendingItems((prev) => prev.filter((x) => x.id !== id))
    toast.success('Đã xóa vật tư khỏi danh sách chờ')
  }

  function handleEditPending(item: any) {
    const formIsDirty = form.inventoryItemId || form.quantity || form.unitPrice
    if (formIsDirty) {
      if (!window.confirm('Vật tư đang nhập trong form sẽ bị ghi đè. Bạn có muốn tiếp tục?')) {
        return
      }
    }

    setForm((prev) => ({
      ...prev,
      inventoryItemId: item.inventoryItemId,
      zoneId: item.zoneId,
      slotId: item.slotId,
      level: item.level,
      quantity: formatQuantityInput(String(item.quantity)),
      unitPrice: formatCurrencyInput(String(item.unitPrice)),
      vat: String(item.vat),
    }))
    setUnitPriceEdited(true)

    setPendingItems((prev) => prev.filter((x) => x.id !== item.id))
  }

  function formatQuantitySummary(items: any[]) {
    const uoms = new Map<string, number>()
    items.forEach((item) => {
      const unit = item.unit || 'tấn'
      uoms.set(unit, (uoms.get(unit) || 0) + item.quantity)
    })
    return Array.from(uoms.entries())
      .map(([unit, qty]) => `${formatQuantity(qty)} ${unit}`)
      .join(', ')
  }

  function calculatePendingTotal(items: any[]) {
    return items.reduce((sum, item) => {
      const sub = item.quantity * item.unitPrice
      const vatVal = (sub * item.vat) / 100
      return sum + sub + vatVal
    }, 0)
  }

  // --- Confirm submission ---
  async function submit() {
    if (pendingItems.length === 0) return

    const no = generateTransactionNo('NK')
    const payloadItems = pendingItems.map((item) => ({
      inventoryItemId: item.inventoryItemId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      warehouseId: item.warehouseId || undefined,
      zoneId: item.zoneId || undefined,
      slotId: item.slotId,
      level: item.level,
    }))

    try {
      const transaction = await createTransaction.mutateAsync({
        type: 'INBOUND',
        transactionNo: no,
        transactionDate: form.transactionDate ? new Date(form.transactionDate).toISOString() : new Date().toISOString(),
        supplierId: form.supplierId || undefined,
        supplierName: suppliers.find((x: any) => x.id === form.supplierId)?.name,
        warehouseId: pendingItems[0]?.warehouseId || undefined,
        remarks: form.remark || undefined,
        items: payloadItems,
      })

      await refreshInventoryCache(queryClient)

      try {
        await uploadInventoryTransactionAttachments({
          transaction,
          files: attachmentFiles,
        })
      } catch {
        toast.error('Phiếu đã lưu nhưng upload tài liệu nhập kho thất bại')
      }

      toast.success('Nhập kho thành công!')

      // Clear pending list and close modal only on SUCCESS
      setPendingItems([])
      setForm({
        transactionDate: formatLocalDateTimeInput(),
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
      setAttachmentFiles([])
      setUnitPriceEdited(false)
      onClose()
    } catch {
      // If one item fails, transaction rollbacks entirely, and we KEEP pending list intact
      toast.error('Có lỗi xảy ra khi xác nhận nhập kho. Danh sách chờ được giữ nguyên.')
    }
  }

  function handleClose() {
    const isDirty = pendingItems.length > 0 || form.inventoryItemId || form.quantity || form.remark
    if (isDirty) {
      if (!window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn thoát?')) {
        return
      }
    }
    onClose()
  }

  return (
    <ModalShell open={open} onClose={handleClose} title="Nhập kho vật tư" wide>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_520px]">
        <div>
          {/* Pending Header */}
          {pendingItems.length > 0 && (
            <div className="mb-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-cyan-300 uppercase tracking-wider">Danh sách chờ nhập</span>
                  <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">
                    {pendingItems.length} loại vật tư
                  </span>
                </div>
                <div className="text-slate-300 flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    Tổng khối lượng: <span className="font-semibold text-white">{formatQuantitySummary(pendingItems)}</span>
                  </span>
                  <span>
                    Tổng giá trị (sau thuế): <span className="font-semibold text-emerald-400">{formatCurrency(calculatePendingTotal(pendingItems))}</span>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPendingList(!showPendingList)}
                className="shrink-0 rounded-lg border border-cyan-300/20 bg-cyan-500/10 px-3 py-1.5 font-semibold text-cyan-100 hover:bg-cyan-500/20 transition-colors"
              >
                {showPendingList ? 'Ẩn danh sách' : 'Xem danh sách'}
              </button>
            </div>
          )}

          {/* Pending Panel */}
          {showPendingList && pendingItems.length > 0 && (
            <div className="mb-3 overflow-hidden rounded-xl border border-white/10 bg-slate-950/45 text-xs">
              <div className="bg-white/[0.04] px-3 py-2 font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                Chi tiết danh sách chờ nhập
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-white/5">
                {pendingItems.map((item) => (
                  <div key={item.id} className="p-2.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-cyan-300">{item.materialCode}</span>
                        <span className="truncate text-slate-400">{item.materialName}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500 flex flex-wrap gap-x-3">
                        <span>Vị trí: <span className="text-slate-300">{item.zoneCode} / {item.slotId} / {item.level}</span></span>
                        <span>Đơn giá: <span className="text-slate-300">{formatCurrency(item.unitPrice)}</span></span>
                        <span>Thuế: <span className="text-slate-300">{item.vat}%</span></span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-4 text-right">
                      <div>
                        <div className="font-bold text-white">{formatQuantity(item.quantity)} {item.unit}</div>
                        <div className="mt-0.5 text-[11px] text-emerald-400 font-medium">
                          {formatCurrency(item.quantity * item.unitPrice * (1 + item.vat / 100))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditPending(item)}
                          className="rounded p-1 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                          title="Sửa dòng này"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePending(item.id)}
                          className="rounded p-1 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          title="Xóa dòng này"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <input type="datetime-local" value={form.transactionDate} onFocus={() => setForm((f) => ({ ...f, transactionDate: formatLocalDateTimeInput() }))} onChange={(e) => setForm((f) => ({ ...f, transactionDate: e.target.value }))} className={fieldClass} />
            <select value={form.supplierId} onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))} className={fieldClass}>
              <option value="">Nhà cung cấp</option>
              {suppliers.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select value={form.inventoryItemId} onChange={(e) => {
              setUnitPriceEdited(false)
              setForm((f) => ({ ...f, inventoryItemId: e.target.value }))
            }} className={fieldClass}>
              <option value="">Vật tư</option>
              {materials.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.code} - {m.name}
                </option>
              ))}
            </select>
            <input value={form.quantity} onFocus={(e) => setForm((f) => ({ ...f, quantity: formatQuantityInput(e.target.value) }))} onBlur={(e) => setForm((f) => ({ ...f, quantity: formatQuantity(e.target.value) }))} onChange={(e) => setForm((f) => ({ ...f, quantity: formatQuantityInput(e.target.value) }))} inputMode="decimal" placeholder="Số lượng" className={fieldClass} />
            <input value={form.unitPrice} onChange={(e) => {
              setUnitPriceEdited(true)
              setForm((f) => ({ ...f, unitPrice: formatCurrencyInput(e.target.value) }))
            }} inputMode="numeric" placeholder="Đơn giá nhập" className={fieldClass} />
            <div className="flex items-center rounded-lg border border-white/12 bg-white/[0.06] px-3 text-sm text-slate-300">
              Vị trí mặc định Kho chính: <span className="ml-1 text-cyan-300">{defaultInboundZone?.code ?? 'A01'} ({defaultInboundZone?.name ?? 'Warehouse Zone A01'})</span>
            </div>
            <select value={form.zoneId} onChange={(e) => setForm((f) => ({ ...f, zoneId: e.target.value }))} className={`${fieldClass} ${missingInboundLocation ? 'border-red-400/60 ring-1 ring-red-400/30' : ''}`}>
              <option value="">Vị trí nhận thuộc Kho chính</option>
              {mainZones.map((z: any) => (
                <option disabled={isZoneFull(z)} key={z.id} value={z.id}>
                  {zoneDisplay(z)}{isZoneFull(z) ? ' · FULL' : ''}
                </option>
              ))}
            </select>
            <select value={form.slotId} onChange={(e) => setForm((f) => ({ ...f, slotId: e.target.value }))} className={`${fieldClass} ${missingInboundLocation ? 'border-red-400/60 ring-1 ring-red-400/30' : ''}`}>
              <option value="">Chọn ô trong vị trí</option>
              {INTERNAL_CELLS.map((cell) => {
                const occupiedOnAnyLevel = selectedInboundZone && INTERNAL_LEVELS.every((item) => isCellOccupied(selectedInboundZone, cell, item))
                return <option disabled={occupiedOnAnyLevel} key={cell} value={cell}>Ô {cell}{occupiedOnAnyLevel ? ' · đầy tầng' : ''}</option>
              })}
            </select>
            <select value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} className={`${fieldClass} ${missingInboundLocation ? 'border-red-400/60 ring-1 ring-red-400/30' : ''}`}>
              <option value="">Chọn tầng nhận</option>
              {INTERNAL_LEVELS.map((level) => {
                const occupied = selectedInboundZone && form.slotId && isCellOccupied(selectedInboundZone, form.slotId, level)
                return <option disabled={occupied} key={level} value={level}>Tầng {level}{occupied ? ' · đã có vật tư' : ''}</option>
              })}
            </select>
            <input value={form.vat} onChange={(e) => setForm((f) => ({ ...f, vat: e.target.value }))} placeholder="VAT (%)" className={fieldClass} />
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 text-xs md:grid-cols-4">
            <MetricBox title="Tồn hiện tại" value={formatQuantity(currentStock)} />
            <MetricBox title="Sau nhập" value={formatQuantity(currentStock + quantity)} />
            <MetricBox title="Ô/Tầng" value={form.slotId ? `${form.slotId} / ${form.level || 'L1'}` : 'Chưa chọn'} />
            <MetricBox title="Sức chứa" value={selectedInboundZone ? `${formatQuantity(selectedInboundZone.materialCount)} / ${formatQuantity(selectedInboundZone.capacity)}` : 'Chưa chọn'} />
          </div>
          {selectedInboundZoneFull ? (
            <div className="mt-3 rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-xs text-amber-200">
              Slot/tầng này đã đầy. Vui lòng chọn vị trí hoặc tầng khác trước khi xác nhận nhập kho.
            </div>
          ) : null}
          {missingInboundLocation ? (
            <div className="mt-3 rounded-xl border border-red-400/40 bg-red-500/10 p-3 text-xs text-red-200">
              <div className="font-semibold">Vui lòng chọn vị trí lưu kho.</div>
              <div className="mt-1 text-red-100/90">{missingInboundLocationCount} vật tư chưa chọn vị trí lưu kho.</div>
            </div>
          ) : null}
          {form.zoneId ? (
            <div className={`mt-2 flex flex-col gap-3 rounded-xl border p-2 text-xs md:flex-row md:items-center md:justify-between ${
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
              <button type="button" onClick={suggestInboundLocation} className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/15">
                Gợi ý ô trống
              </button>
            </div>
          ) : null}
          {form.inventoryItemId ? (
            <div className="mt-2 rounded-xl border border-cyan-300/20 bg-cyan-500/10 p-2 text-xs text-slate-200">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-cyan-200">Vị trí gợi ý</div>
                  {inboundSuggestion?.lastLocation ? (
                    <div className="mt-1 text-white">
                      {[
                        inboundSuggestion.lastLocation.zoneCode,
                        inboundSuggestion.lastLocation.slotId,
                        inboundSuggestion.lastLocation.level,
                      ].filter(Boolean).join('-')}
                      {formatPercent(inboundSuggestion.lastLocation.freePercent) ? (
                        <span className="ml-2 text-cyan-200">
                          (còn trống {formatPercent(inboundSuggestion.lastLocation.freePercent)})
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-1 text-slate-400">Chưa có lịch sử vị trí cho vật tư này.</div>
                  )}
                </div>
                {inboundSuggestion?.lastLocation ? (
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({
                      ...prev,
                      zoneId: inboundSuggestion.lastLocation.zoneId ?? prev.zoneId,
                      slotId: inboundSuggestion.lastLocation.slotId ?? prev.slotId,
                      level: inboundSuggestion.lastLocation.level ?? prev.level,
                    }))}
                    className="rounded-lg border border-cyan-300/25 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/20"
                  >
                    Dùng vị trí gợi ý
                  </button>
                ) : null}
              </div>
              <div className="mt-1 border-t border-cyan-300/10 pt-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-emerald-200">Đơn giá gần nhất</div>
                {inboundSuggestion?.lastPrice ? (
                  <div className="mt-1 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-white">
                        {formatCurrency(inboundSuggestion.lastPrice.unitPrice)}
                        {selectedMaterial?.unit ? <span className="text-slate-400">/{selectedMaterial.unit}</span> : null}
                      </div>
                      <div className="text-xs text-slate-400">
                        {[
                          formatShortDate(inboundSuggestion.lastPrice.transactionDate),
                          inboundSuggestion.lastPrice.supplierName,
                          inboundSuggestion.lastPrice.transactionNo,
                        ].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUnitPriceEdited(true)
                        setForm((prev) => ({
                          ...prev,
                          unitPrice: formatCurrencyInput(String(inboundSuggestion.lastPrice.unitPrice)),
                        }))
                      }}
                      className="rounded-lg border border-emerald-300/25 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/20"
                    >
                      Dùng đơn giá gần nhất
                    </button>
                  </div>
                ) : (
                  <div className="mt-1 text-slate-400">Chưa có lịch sử đơn giá nhập.</div>
                )}
                <div className="mt-1 text-xs text-slate-300">
                  Giá trung bình 30 ngày:{' '}
                  <span className="font-semibold text-cyan-200">
                    {inboundSuggestion?.averagePrice30Days
                      ? formatCurrency(inboundSuggestion.averagePrice30Days)
                      : 'Chưa có dữ liệu'}
                  </span>
                </div>
                {hasLargePriceDelta ? (
                  <div className="mt-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    Đơn giá chênh lệch lớn so với lịch sử.
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-xs">
            <div className="text-slate-300">Thành tiền trước VAT: <span className="font-semibold text-cyan-300">{formatCurrency(subTotal)}</span></div>
            <div className="mt-1 text-slate-300">Tiền VAT: <span className="font-semibold text-cyan-300">{formatCurrency(vatAmount)}</span></div>
            <div className="mt-1 text-base font-semibold text-white">Tổng thanh toán vật tư hiện tại: <span className="text-cyan-300">{formatCurrency(total)}</span></div>
          </div>

          {/* Add to Pending Button */}
          <button
            type="button"
            disabled={!canAddPending}
            onClick={handleAddPending}
            className="w-full mt-3 rounded-lg border border-cyan-400/30 bg-cyan-400/10 py-2.5 font-semibold text-cyan-200 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50 text-xs"
          >
            + Thêm vào danh sách chờ nhập
          </button>

          <div className="mt-3">
            <InventoryAttachmentPicker files={attachmentFiles} onChange={setAttachmentFiles} />
          </div>
          <textarea value={form.remark} onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))} placeholder="Ghi chú chung phiếu nhập" className={`${textareaClass} mt-3 w-full text-xs`} />
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={handleClose} className={secondaryButtonClass}>Hủy</button>
            <button disabled={pendingItems.length === 0 || createTransaction.isPending} onClick={submit} className={primaryButtonClass}>
              {createTransaction.isPending ? 'Đang thực hiện...' : `Xác nhận nhập kho (${pendingItems.length})`}
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
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    transactionDate: formatLocalDateTimeInput(),
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
  const [attachmentFiles, setAttachmentFiles] = useState<InventoryAttachmentDraft[]>([])

  // Local state for pending items list
  const [pendingItems, setPendingItems] = useState<any[]>([])
  const [showPendingList, setShowPendingList] = useState(false)

  const { data: selectedMaterialDetail } = useMaterialDetail(form.inventoryItemId || undefined)
  const selectedMaterial = materials.find((x: any) => x.id === form.inventoryItemId) as any
  const currentStock = num(selectedMaterial?.quantity)
  const quantity = num(form.quantity)
  const estimatedUnitPrice = num(
    (selectedMaterialDetail as any)?.averageCost ??
      selectedMaterial?.averageCost ??
      selectedMaterial?.unitPrice,
  )

  const locationBalances = useMemo(() => {
    return Array.isArray(
      (selectedMaterialDetail as any)?.locationBalances,
    )
      ? (
          (selectedMaterialDetail as any)
            .locationBalances as any[]
        )
          .filter(
            (balance) =>
              num(balance.quantity) > 0 &&
              balance.warehouseCode !==
                'PRODUCTION',
          )
      : []
  }, [selectedMaterialDetail])

  useEffect(() => {
    if (!open) return

    setForm((prev) => ({
      ...prev,
      transactionDate: formatLocalDateTimeInput(),
    }))
  }, [open])

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

      if (
        String(balance.warehouseCode) ===
        'PRODUCTION'
      ) {
        return
      }

      const zone = zones.find(
        (z: any) =>
          String(z.id) === String(balance.zoneId),
      )

      if (!zoneMap.has(String(balance.zoneId))) {
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
  const selectedSourceFullZone = zones.find((zone: any) => String(zone.id) === String(form.zoneId))
  const selectedProductionZone = productionZones.find((zone: any) => String(zone.id) === String(form.productionZoneId))

  const productionCellOccupied = form.target === 'COMPONENT_PRODUCTION'
    ? isCellOccupied(selectedProductionZone, form.productionSlotId, form.productionLevel)
    : false
  const productionEmptyCell = findEmptyCell(selectedProductionZone)
  const needsProductionLocation = form.target === 'COMPONENT_PRODUCTION'

  // --- Outbound visual warning & validation metrics ---
  const pendingQtyAtLoc = useMemo(() => {
    return pendingItems
      .filter((item) =>
        String(item.inventoryItemId) === String(form.inventoryItemId) &&
        String(item.zoneId) === String(form.zoneId) &&
        String(item.sourceSlotId) === String(form.sourceSlotId) &&
        String(item.sourceLevel) === String(form.sourceLevel)
      )
      .reduce((sum, x) => sum + x.quantity, 0)
  }, [pendingItems, form.inventoryItemId, form.zoneId, form.sourceSlotId, form.sourceLevel])

  const availableLocationQty = Math.max(0, sourceLocationQty - pendingQtyAtLoc)
  const isStockExceeded = form.zoneId && (quantity > availableLocationQty)

  const canAddPending =
    Boolean(form.inventoryItemId) &&
    Boolean(form.zoneId) &&
    quantity > 0 &&
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

  // --- Local pending handlers ---
  function handleAddPending() {
    if (!canAddPending) return

    const newItem = {
      id: Date.now() + Math.random().toString(),
      inventoryItemId: form.inventoryItemId,
      materialCode: selectedMaterial?.code || 'NA',
      materialName: selectedMaterial?.name || '-',
      unit: selectedMaterial?.unit || 'tấn',
      quantity,
      estimatedUnitPrice,
      zoneId: form.zoneId,
      zoneCode: selectedSourceFullZone?.code || 'ZONE',
      warehouseId: selectedSourceLocation?.warehouseId || selectedSourceFullZone?.warehouseId,
      warehouseName: selectedSourceFullZone?.name || '-',
      sourceSlotId: form.sourceSlotId,
      sourceLevel: form.sourceLevel,
      // Target & Production details if target is COMPONENT_PRODUCTION
      target: form.target,
      productionZoneId: form.productionZoneId,
      productionZoneCode: selectedProductionZone?.code || '',
      productionWarehouseId: selectedProductionZone?.warehouseId,
      productionSlotId: form.productionSlotId,
      productionLevel: form.productionLevel,
      sourceLocationQty,
    }

    setPendingItems((prev) => {
      // Merging Rule: Exact duplicate -> Merge. Khác location/UOM -> Không merge.
      const idx = prev.findIndex(
        (x) =>
          String(x.inventoryItemId) === String(newItem.inventoryItemId) &&
          String(x.zoneId) === String(newItem.zoneId) &&
          String(x.sourceSlotId) === String(newItem.sourceSlotId) &&
          String(x.sourceLevel) === String(newItem.sourceLevel) &&
          x.unit === newItem.unit &&
          x.target === newItem.target &&
          String(x.productionZoneId) === String(newItem.productionZoneId) &&
          String(x.productionSlotId) === String(newItem.productionSlotId) &&
          String(x.productionLevel) === String(newItem.productionLevel)
      )
      if (idx > -1) {
        const updated = [...prev]
        updated[idx] = {
          ...updated[idx],
          quantity: updated[idx].quantity + newItem.quantity,
        }
        return updated
      }
      return [...prev, newItem]
    })

    // Reset line items in form
    setForm((prev) => ({
      ...prev,
      inventoryItemId: '',
      zoneId: '',
      sourceSlotId: '',
      sourceLevel: '',
      productionZoneId: '',
      productionSlotId: '',
      productionLevel: '',
      quantity: '',
    }))
    toast.success('Đã thêm vật tư xuất vào danh sách chờ')
  }

  function handleRemovePending(id: string) {
    setPendingItems((prev) => prev.filter((x) => x.id !== id))
    toast.success('Đã xóa vật tư khỏi danh sách chờ')
  }

  function handleEditPending(item: any) {
    const formIsDirty = form.inventoryItemId || form.quantity
    if (formIsDirty) {
      if (!window.confirm('Vật tư đang nhập trong form sẽ bị ghi đè. Bạn có muốn tiếp tục?')) {
        return
      }
    }

    setForm((prev) => ({
      ...prev,
      inventoryItemId: item.inventoryItemId,
      zoneId: item.zoneId,
      sourceSlotId: item.sourceSlotId,
      sourceLevel: item.sourceLevel,
      target: item.target,
      productionZoneId: item.productionZoneId || '',
      productionSlotId: item.productionSlotId || '',
      productionLevel: item.productionLevel || '',
      quantity: formatQuantityInput(String(item.quantity)),
    }))

    setPendingItems((prev) => prev.filter((x) => x.id !== item.id))
  }

  function formatQuantitySummary(items: any[]) {
    const uoms = new Map<string, number>()
    items.forEach((item) => {
      const unit = item.unit || 'tấn'
      uoms.set(unit, (uoms.get(unit) || 0) + item.quantity)
    })
    return Array.from(uoms.entries())
      .map(([unit, qty]) => `${formatQuantity(qty)} ${unit}`)
      .join(', ')
  }

  function calculatePendingTotal(items: any[]) {
    return items.reduce((sum, item) => sum + item.quantity * item.estimatedUnitPrice, 0)
  }

  // --- Confirm batch submission ---
  async function submit() {
    if (pendingItems.length === 0) return

    const no = generateTransactionNo('XK')
    const payloadItems: any[] = []

    pendingItems.forEach((item) => {
      const isProductionTarget = item.target === 'COMPONENT_PRODUCTION'
      if (isProductionTarget) {
        // Negative source line
        payloadItems.push({
          inventoryItemId: item.inventoryItemId,
          quantity: -Math.abs(item.quantity),
          warehouseId: item.warehouseId || undefined,
          zoneId: item.zoneId || undefined,
          slotId: item.sourceSlotId,
          level: item.sourceLevel,
        })
        // Positive destination line
        payloadItems.push({
          inventoryItemId: item.inventoryItemId,
          quantity: Math.abs(item.quantity),
          warehouseId: item.productionWarehouseId || undefined,
          zoneId: item.productionZoneId || undefined,
          slotId: item.productionSlotId,
          level: item.productionLevel,
          unitPrice: item.estimatedUnitPrice || undefined,
        })
      } else {
        // Negative source line
        payloadItems.push({
          inventoryItemId: item.inventoryItemId,
          quantity: -Math.abs(item.quantity),
          warehouseId: item.warehouseId || undefined,
          zoneId: item.zoneId || undefined,
          slotId: item.sourceSlotId,
          level: item.sourceLevel,
        })
      }
    })

    const firstItem = pendingItems[0]
    const isProductionTarget = firstItem?.target === 'COMPONENT_PRODUCTION'
    const targetTag = isProductionTarget ? '[COMPONENT_PRODUCTION]' : '[PROJECT]'

    try {
      const transaction = await createTransaction.mutateAsync({
        type: isProductionTarget ? 'TRANSFER' : 'OUTBOUND',
        transactionNo: no,
        transactionDate: form.transactionDate ? new Date(form.transactionDate).toISOString() : new Date().toISOString(),
        projectId: form.projectId || undefined,
        projectName: projects.find((x: any) => x.id === form.projectId)?.name,
        zoneId: firstItem?.zoneId,
        warehouseId: isProductionTarget ? firstItem?.productionWarehouseId : undefined,
        remarks: `${targetTag} ${form.remark}`.trim(),
        items: payloadItems,
      })

      await refreshInventoryCache(queryClient)

      try {
        await uploadInventoryTransactionAttachments({
          transaction,
          files: attachmentFiles,
        })
      } catch {
        toast.error('Phiếu đã lưu nhưng upload tài liệu xuất kho thất bại')
      }

      toast.success('Xuất kho thành công!')

      // Clear pending list and close modal only on SUCCESS
      setPendingItems([])
      setForm({
        transactionDate: formatLocalDateTimeInput(),
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
      setAttachmentFiles([])
      onClose()
    } catch {
      // Non-destructive: API error -> keep pendingItems intact!
      toast.error('Có lỗi xảy ra khi xác nhận xuất kho. Danh sách chờ được giữ nguyên.')
    }
  }

  function handleClose() {
    const isDirty = pendingItems.length > 0 || form.inventoryItemId || form.quantity || form.remark
    if (isDirty) {
      if (!window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn thoát?')) {
        return
      }
    }
    onClose()
  }

  return (
    <ModalShell open={open} onClose={handleClose} title="Xuất kho vật tư" wide maxWidthClass="max-w-[96vw] 2xl:max-w-[1800px]">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(390px,0.8fr)_minmax(720px,1.2fr)]">
        <div>
          {/* Pending Header */}
          {pendingItems.length > 0 && (
            <div className="mb-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-cyan-300 uppercase tracking-wider">Danh sách chờ xuất</span>
                  <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">
                    {pendingItems.length} loại vật tư
                  </span>
                </div>
                <div className="text-slate-300 flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    Tổng khối lượng: <span className="font-semibold text-white">{formatQuantitySummary(pendingItems)}</span>
                  </span>
                  <span>
                    Tổng giá trị dự kiến: <span className="font-semibold text-emerald-400">{formatCurrency(calculatePendingTotal(pendingItems))}</span>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPendingList(!showPendingList)}
                className="shrink-0 rounded-lg border border-cyan-300/20 bg-cyan-500/10 px-3 py-1.5 font-semibold text-cyan-100 hover:bg-cyan-500/20 transition-colors"
              >
                {showPendingList ? 'Ẩn danh sách' : 'Xem danh sách'}
              </button>
            </div>
          )}

          {/* Pending Panel */}
          {showPendingList && pendingItems.length > 0 && (
            <div className="mb-3 overflow-hidden rounded-xl border border-white/10 bg-slate-950/45 text-xs">
              <div className="bg-white/[0.04] px-3 py-2 font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                Chi tiết danh sách chờ xuất
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-white/5">
                {pendingItems.map((item) => (
                  <div key={item.id} className="p-2.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-cyan-300">{item.materialCode}</span>
                        <span className="truncate text-slate-400">{item.materialName}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500 flex flex-wrap gap-x-3">
                        <span>Vị trí xuất: <span className="text-slate-300">{item.zoneCode} / {item.sourceSlotId} / {item.sourceLevel}</span></span>
                        <span>Đơn giá ước tính: <span className="text-slate-300">{formatCurrency(item.estimatedUnitPrice)}</span></span>
                        {item.target === 'COMPONENT_PRODUCTION' && (
                          <span className="text-cyan-200">
                            → Kho SX: {item.productionZoneCode} / {item.productionSlotId} / {item.productionLevel}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-4 text-right">
                      <div>
                        <div className="font-bold text-white">{formatQuantity(item.quantity)} {item.unit}</div>
                        <div className="mt-0.5 text-[11px] text-emerald-400 font-medium">
                          {formatCurrency(item.quantity * item.estimatedUnitPrice)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditPending(item)}
                          className="rounded p-1 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                          title="Sửa dòng này"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePending(item.id)}
                          className="rounded p-1 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          title="Xóa dòng này"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input type="datetime-local" value={form.transactionDate} onFocus={() => setForm((f) => ({ ...f, transactionDate: formatLocalDateTimeInput() }))} onChange={(e) => setForm((f) => ({ ...f, transactionDate: e.target.value }))} className={fieldClass} />
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
            <input value={form.quantity} onFocus={(e) => setForm((f) => ({ ...f, quantity: formatQuantityInput(e.target.value) }))} onBlur={(e) => setForm((f) => ({ ...f, quantity: formatQuantity(e.target.value) }))} onChange={(e) => setForm((f) => ({ ...f, quantity: formatQuantityInput(e.target.value) }))} inputMode="decimal" placeholder="Số lượng" className={fieldClass} />
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
                  {formatQuantity(loc.quantity)}
                </option>
              ))}
            </select>

            <div className="flex items-center rounded-lg border border-white/12 bg-white/[0.06] px-3 text-sm text-slate-300">
              Tồn ô/tầng đã chọn:
              <span className="ml-1 text-cyan-300">
                {formatQuantity(sourceLocationQty)}
              </span>
            </div>
            {form.zoneId ? (
              <div className="flex items-center rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 text-sm text-slate-300">
                Tồn khả dụng (trừ Pending):
                <span className="ml-1 text-emerald-300 font-bold">
                  {formatQuantity(availableLocationQty)}
                </span>
              </div>
            ) : null}
          </div>

          {form.target === 'COMPONENT_PRODUCTION' ? (
            <div className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3">
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
              <div className={`mt-3 rounded-lg border px-3 py-2 text-xs ${productionCellOccupied ? 'border-red-400/40 bg-red-500/10 text-red-200' : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'}`}>
                {productionCellOccupied
                  ? `Ô ${form.productionSlotId || '-'} / ${form.productionLevel || 'L1'} ở Kho vật tư SX đã có vật tư.`
                  : productionEmptyCell
                    ? `Ô trống gợi ý: ${productionEmptyCell.cell} / ${productionEmptyCell.level}.`
                    : form.productionZoneId ? 'Vị trí này chưa còn ô/tầng trống khả dụng.' : 'Chọn vị trí kho SX hoặc dùng gợi ý ô trống.'}
              </div>
            </div>
          ) : null}

          <div className="mt-3 grid grid-cols-1 gap-3 text-xs md:grid-cols-4">
            <MetricBox title="Tồn hiện tại" value={formatQuantity(currentStock)} />
            <MetricBox title="Tồn sau xuất" value={formatQuantity(Math.max(0, currentStock - quantity))} />
            <MetricBox title="Tồn ô/tầng" value={formatQuantity(sourceLocationQty)} />
            <MetricBox title="Sau xuất ô/tầng" value={formatQuantity(Math.max(0, sourceLocationQty - quantity))} />
          </div>

          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-xs">
            <div className="text-slate-300">Giá trị xuất dự kiến: <span className="font-semibold text-cyan-300">{formatCurrency(quantity * estimatedUnitPrice)}</span></div>
            <div className="mt-1 text-slate-300">Đối tượng xuất: <span className="font-semibold text-white">{form.target === 'COMPONENT_PRODUCTION' ? 'Sản xuất cấu kiện' : 'Công trình'}</span></div>
            {form.target === 'COMPONENT_PRODUCTION' ? <div className="mt-1 text-slate-300">Vị trí nhận: <span className="font-semibold text-white">{selectedProductionZone ? `${selectedProductionZone.code} / ${form.productionSlotId || '-'} / ${form.productionLevel || 'L1'}` : 'Chưa chọn'}</span></div> : null}
          </div>

          {form.inventoryItemId && availableZones.length === 0 && (
            <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
              Vật tư này chưa có vị trí tồn khả dụng. Hãy nhập kho hoặc gán vị trí tồn trước khi xuất.
            </div>
          )}

          {isStockExceeded && (
            <div className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              ⚠️ Cảnh báo: Tổng số lượng chờ xuất ({formatQuantity(quantity + pendingQtyAtLoc)} {selectedMaterial?.unit || 'tấn'}) vượt quá lượng tồn kho khả dụng tại ô/tầng này ({formatQuantity(sourceLocationQty)} {selectedMaterial?.unit || 'tấn'}).
            </div>
          )}

          {/* Add to Pending Button */}
          <button
            type="button"
            disabled={!canAddPending}
            onClick={handleAddPending}
            className="w-full mt-3 rounded-lg border border-cyan-400/30 bg-cyan-400/10 py-2.5 font-semibold text-cyan-200 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50 text-xs"
          >
            + Thêm vào danh sách chờ xuất
          </button>

          <div className="mt-3">
            <InventoryAttachmentPicker files={attachmentFiles} onChange={setAttachmentFiles} />
          </div>
          <textarea value={form.remark} onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))} placeholder="Ghi chú chung phiếu xuất" className={`${textareaClass} mt-3 w-full text-xs`} />
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={handleClose} className={secondaryButtonClass}>Hủy</button>
            <button disabled={pendingItems.length === 0 || createTransaction.isPending} onClick={submit} className={primaryButtonClass}>
              {createTransaction.isPending ? 'Đang thực hiện...' : `Xác nhận xuất kho (${pendingItems.length})`}
            </button>
          </div>
        </div>

        <div
          className={`grid gap-3 ${
            form.target === 'COMPONENT_PRODUCTION'
              ? 'grid-cols-2'
              : 'grid-cols-1'
          }`}
        >
          <WarehouseMiniMap
            compact
            zone={selectedSourceFullZone}
            slotId={form.sourceSlotId}
            level={form.sourceLevel}
            onSelect={(cell: string, selectedLevel: string) =>
              setForm((prev) => ({
                ...prev,
                sourceSlotId: cell,
                sourceLevel: selectedLevel,
              }))
            }
          />

          {form.target === 'COMPONENT_PRODUCTION' ? (
            <WarehouseMiniMap
              compact
              zone={selectedProductionZone}
              slotId={form.productionSlotId}
              level={form.productionLevel}
              onSelect={(cell: string, selectedLevel: string) =>
                setForm((prev) => ({
                  ...prev,
                  productionSlotId: cell,
                  productionLevel: selectedLevel,
                }))
              }
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
  const realZones = useMemo(() => zones.filter((zone: any) => isRealStorageZone(zone) && isMainWarehouseZone(zone)), [zones])
  const createTx = useCreateTransaction()
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    transactionDate: formatLocalDateTimeInput(),
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
  const [attachmentFiles, setAttachmentFiles] = useState<InventoryAttachmentDraft[]>([])

  // Local state for pending transfers list
  const [pendingItems, setPendingItems] = useState<any[]>([])
  const [showPendingList, setShowPendingList] = useState(false)

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
      const slotId = selectedMaterial?.slotId ?? ''
      const level = selectedMaterial?.level ?? ''
      return [
        {
          id: [fallbackZoneId, slotId, level].join('|'),
          zoneId: String(fallbackZoneId),
          slotId,
          level,
          label: `${selectedMaterial?.zoneCode ?? fallbackZone?.code ?? 'ZONE'} - ${selectedMaterial?.zone ?? fallbackZone?.name ?? ''}`,
          qty: currentStock,
          zoneCode: selectedMaterial?.zoneCode ?? fallbackZone?.code ?? 'ZONE',
          warehouseName: fallbackZone?.warehouse?.name ?? '',
          row: fallbackZone?.row ?? '',
          column: fallbackZone?.column ?? '',
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

  const sourceLocationKey = form.fromZoneId ? [form.fromZoneId, form.fromSlotId, form.fromLevel].join('|') : ''
  const sourceQty = useMemo(() => {
    const selected = sourceZoneOptions.find((s) => s.id === sourceLocationKey)
    return num(selected?.qty)
  }, [sourceZoneOptions, sourceLocationKey])

  const selectedSourceZone = sourceZoneOptions.find((zone) => zone.id === sourceLocationKey)
  const selectedDestinationZone = destinationZoneOptions.find((zone) => zone.id === form.toZoneId)
  const selectedSourceFullZone = realZones.find((zone: any) => String(zone.id) === String(form.fromZoneId))
  const selectedDestinationFullZone = realZones.find((zone: any) => String(zone.id) === String(form.toZoneId))
  const destinationCellOccupied = isCellOccupied(selectedDestinationFullZone, form.toSlotId, form.toLevel)
  const destinationEmptyCell = findEmptyCell(selectedDestinationFullZone)
  const transferQty = num(form.quantity)

  // --- Transfer-specific Pending calculations & validation ---
  const pendingQtyAtLoc = useMemo(() => {
    return pendingItems
      .filter((item) =>
        String(item.materialId) === String(form.materialId) &&
        String(item.fromZoneId) === String(form.fromZoneId) &&
        String(item.fromSlotId) === String(form.fromSlotId) &&
        String(item.fromLevel) === String(form.fromLevel)
      )
      .reduce((sum, x) => sum + x.quantity, 0)
  }, [pendingItems, form.materialId, form.fromZoneId, form.fromSlotId, form.fromLevel])

  const availableSourceQty = Math.max(0, sourceQty - pendingQtyAtLoc)
  const isStockExceeded = form.materialId && form.fromZoneId && (transferQty > availableSourceQty)

  const canAddPending =
    Boolean(form.materialId) &&
    Boolean(form.fromZoneId) &&
    Boolean(form.toZoneId) &&
    form.fromZoneId !== form.toZoneId &&
    Boolean(form.toSlotId) &&
    Boolean(form.toLevel) &&
    transferQty > 0 &&
    !isStockExceeded &&
    !destinationCellOccupied

  useEffect(() => {
    if (!open) return

    setForm((prev) => ({
      ...prev,
      transactionDate: formatLocalDateTimeInput(),
    }))
  }, [open])
  
  useEffect(() => {
    if (!form.materialId) return
    const currentSource = sourceZoneOptions.find((zone) => zone.id === sourceLocationKey)
    const nextSource = currentSource ?? sourceZoneOptions[0]
    const nextFromZoneId = nextSource?.zoneId ?? ''
    const nextFromSlotId = nextSource?.slotId ?? ''
    const nextFromLevel = nextSource?.level ?? ''
    const nextToZoneId = destinationZoneOptions.some((zone) => zone.id === form.toZoneId)
      ? form.toZoneId
      : destinationZoneOptions.find((zone) => zone.id !== nextFromZoneId)?.id ?? ''
    const shouldRefreshDestinationCell = nextToZoneId !== form.toZoneId || !form.toSlotId || !form.toLevel
    const nextDestinationZone = shouldRefreshDestinationCell
      ? realZones.find((zone: any) => String(zone.id) === String(nextToZoneId))
      : null
    const nextDestinationCell = shouldRefreshDestinationCell
      ? findEmptyCell(nextDestinationZone, form.materialId)
      : null
    const nextToSlotId = shouldRefreshDestinationCell ? nextDestinationCell?.cell ?? '' : form.toSlotId
    const nextToLevel = shouldRefreshDestinationCell ? nextDestinationCell?.level ?? '' : form.toLevel

    if (
      nextFromZoneId === form.fromZoneId &&
      nextFromSlotId === form.fromSlotId &&
      nextFromLevel === form.fromLevel &&
      nextToZoneId === form.toZoneId &&
      nextToSlotId === form.toSlotId &&
      nextToLevel === form.toLevel
    ) return
    setForm((prev) => ({
      ...prev,
      fromZoneId: nextFromZoneId,
      fromSlotId: nextFromSlotId,
      fromLevel: nextFromLevel,
      toZoneId: nextToZoneId,
      toSlotId: nextToSlotId,
      toLevel: nextToLevel,
    }))
  }, [form.materialId, form.fromZoneId, form.fromSlotId, form.fromLevel, form.toZoneId, form.toSlotId, form.toLevel, sourceZoneOptions, sourceLocationKey, destinationZoneOptions, realZones])

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

  // --- Local pending handlers ---
  function handleAddPending() {
    if (!canAddPending) return

    const newItem = {
      id: Date.now() + Math.random().toString(),
      materialId: form.materialId,
      materialCode: selectedMaterial?.code || 'NA',
      materialName: selectedMaterial?.name || '-',
      unit: selectedMaterial?.unit || 'tấn',
      quantity: transferQty,
      fromZoneId: form.fromZoneId,
      fromZoneCode: selectedSourceFullZone?.code || 'ZONE',
      fromWarehouseName: selectedSourceFullZone?.name || '-',
      fromSlotId: form.fromSlotId,
      fromLevel: form.fromLevel,
      toZoneId: form.toZoneId,
      toZoneCode: selectedDestinationFullZone?.code || 'ZONE',
      toWarehouseName: selectedDestinationFullZone?.name || '-',
      toSlotId: form.toSlotId,
      toLevel: form.toLevel,
      sourceQty,
    }

    setPendingItems((prev) => {
      // Merging Rule: Exact duplicate -> Merge. Khác source/destination -> Không merge.
      const idx = prev.findIndex(
        (x) =>
          String(x.materialId) === String(newItem.materialId) &&
          String(x.fromZoneId) === String(newItem.fromZoneId) &&
          String(x.fromSlotId) === String(newItem.fromSlotId) &&
          String(x.fromLevel) === String(newItem.fromLevel) &&
          String(x.toZoneId) === String(newItem.toZoneId) &&
          String(x.toSlotId) === String(newItem.toSlotId) &&
          String(x.toLevel) === String(newItem.toLevel) &&
          x.unit === newItem.unit
      )
      if (idx > -1) {
        const updated = [...prev]
        updated[idx] = {
          ...updated[idx],
          quantity: updated[idx].quantity + newItem.quantity,
        }
        return updated
      }
      return [...prev, newItem]
    })

    // Reset line items in form
    setForm((prev) => ({
      ...prev,
      materialId: '',
      fromZoneId: '',
      fromSlotId: '',
      fromLevel: '',
      toZoneId: '',
      toSlotId: '',
      toLevel: '',
      quantity: '',
    }))
    toast.success('Đã thêm điều chuyển vào danh sách chờ')
  }

  function handleRemovePending(id: string) {
    setPendingItems((prev) => prev.filter((x) => x.id !== id))
    toast.success('Đã xóa khỏi danh sách chờ')
  }

  function handleEditPending(item: any) {
    const formIsDirty = form.materialId || form.quantity
    if (formIsDirty) {
      if (!window.confirm('Vật tư đang nhập trong form sẽ bị ghi đè. Bạn có muốn tiếp tục?')) {
        return
      }
    }

    setForm((prev) => ({
      ...prev,
      materialId: item.materialId,
      fromZoneId: item.fromZoneId,
      fromSlotId: item.fromSlotId,
      fromLevel: item.fromLevel,
      toZoneId: item.toZoneId,
      toSlotId: item.toSlotId,
      toLevel: item.toLevel,
      quantity: formatQuantityInput(String(item.quantity)),
    }))

    setPendingItems((prev) => prev.filter((x) => x.id !== item.id))
  }

  function formatQuantitySummary(items: any[]) {
    const uoms = new Map<string, number>()
    items.forEach((item) => {
      const unit = item.unit || 'tấn'
      uoms.set(unit, (uoms.get(unit) || 0) + item.quantity)
    })
    return Array.from(uoms.entries())
      .map(([unit, qty]) => `${formatQuantity(qty)} ${unit}`)
      .join(', ')
  }

  // --- Confirm batch submission ---
  async function submitTransfer() {
    if (pendingItems.length === 0) return

    const no = generateTransactionNo('DC')
    const payloadItems: any[] = []

    pendingItems.forEach((item) => {
      // Negative source line
      payloadItems.push({
        inventoryItemId: item.materialId,
        zoneId: item.fromZoneId,
        slotId: item.fromSlotId,
        level: item.fromLevel,
        quantity: -Math.abs(item.quantity),
      })
      // Positive destination line
      payloadItems.push({
        inventoryItemId: item.materialId,
        zoneId: item.toZoneId,
        slotId: item.toSlotId,
        level: item.toLevel,
        quantity: Math.abs(item.quantity),
      })
    })

    try {
      const transaction = await createTx.mutateAsync({
        type: 'TRANSFER',
        transactionNo: no,
        transactionDate: form.transactionDate ? new Date(form.transactionDate).toISOString() : new Date().toISOString(),
        remarks: `[TRANSFER] ${form.reason}`.trim(),
        items: payloadItems,
      })

      await refreshInventoryCache(queryClient)

      try {
        await uploadInventoryTransactionAttachments({
          transaction,
          files: attachmentFiles,
        })
      } catch {
        toast.error('Phiếu đã lưu nhưng upload tài liệu điều chuyển thất bại')
      }

      toast.success('Điều chuyển thành công!')

      // Clear pending list and close modal only on SUCCESS
      setPendingItems([])
      setForm({
        transactionDate: formatLocalDateTimeInput(),
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
      setAttachmentFiles([])
      onClose()
    } catch {
      // Non-destructive: API error -> keep pendingItems intact!
      toast.error('Có lỗi xảy ra khi xác nhận điều chuyển. Danh sách chờ được giữ nguyên.')
    }
  }

  function handleClose() {
    const isDirty = pendingItems.length > 0 || form.materialId || form.quantity || form.reason
    if (isDirty) {
      if (!window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn thoát?')) {
        return
      }
    }
    onClose()
  }

  return (
    <ModalShell open={open} onClose={handleClose} title="Tạo điều chuyển mới" wide maxWidthClass="max-w-[96vw] 2xl:max-w-[1800px]">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(390px,0.8fr)_minmax(720px,1.2fr)]">
        <div>
          {/* Pending Header */}
          {pendingItems.length > 0 && (
            <div className="mb-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-cyan-300 uppercase tracking-wider">Danh sách chờ điều chuyển</span>
                  <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">
                    {pendingItems.length} dòng
                  </span>
                </div>
                <div className="text-slate-300 flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    Tổng khối lượng: <span className="font-semibold text-white">{formatQuantitySummary(pendingItems)}</span>
                  </span>
                  <span>
                    Số lần điều chuyển: <span className="font-semibold text-cyan-300">{pendingItems.length}</span>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPendingList(!showPendingList)}
                className="shrink-0 rounded-lg border border-cyan-300/20 bg-cyan-500/10 px-3 py-1.5 font-semibold text-cyan-100 hover:bg-cyan-500/20 transition-colors"
              >
                {showPendingList ? 'Ẩn danh sách' : 'Xem danh sách'}
              </button>
            </div>
          )}

          {/* Pending Panel */}
          {showPendingList && pendingItems.length > 0 && (
            <div className="mb-3 overflow-hidden rounded-xl border border-white/10 bg-slate-950/45 text-xs">
              <div className="bg-white/[0.04] px-3 py-2 font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                Chi tiết danh sách chờ điều chuyển
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-white/5">
                {pendingItems.map((item) => (
                  <div key={item.id} className="p-2.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-cyan-300">{item.materialCode}</span>
                        <span className="truncate text-slate-400">{item.materialName}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500 flex flex-col gap-0.5">
                        <div>Nguồn: <span className="text-slate-300">{item.fromZoneCode} / {item.fromSlotId} / {item.fromLevel}</span></div>
                        <div>Đích: <span className="text-cyan-200">{item.toZoneCode} / {item.toSlotId} / {item.toLevel}</span></div>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-4 text-right">
                      <div className="font-bold text-white">{formatQuantity(item.quantity)} {item.unit}</div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditPending(item)}
                          className="rounded p-1 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                          title="Sửa dòng này"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePending(item.id)}
                          className="rounded p-1 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          title="Xóa dòng này"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <input type="datetime-local" value={form.transactionDate} onFocus={() => setForm((f) => ({ ...f, transactionDate: formatLocalDateTimeInput() }))} onChange={(e) => setForm((f) => ({ ...f, transactionDate: e.target.value }))} className={fieldClass} />
            <select value={form.materialId} onChange={(e) => setForm((f) => ({ ...f, materialId: e.target.value, fromZoneId: '', fromSlotId: '', fromLevel: '', toZoneId: '', toSlotId: '', toLevel: '' }))} className={fieldClass}>
              <option value="">Vật tư</option>
              {materials.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.code} - {m.name}
                </option>
              ))}
            </select>
            <select value={sourceLocationKey} onChange={(e) => {
              const selected = sourceZoneOptions.find((s) => s.id === e.target.value)

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
                  {z.zoneCode} · {z.warehouseName || 'Kho'} · Ô {z.slotId || zoneCell(z) || '-'} · Tầng {z.level || '-'} · tồn {formatQuantity(z.qty)}
                </option>
              ))}
            </select>
            <select value={form.toZoneId} onChange={(e) => {
              const zone = realZones.find((z: any) => String(z.id) === e.target.value)
              const emptyCell = findEmptyCell(zone, form.materialId)
              setForm((f) => ({
                ...f,
                toZoneId: e.target.value,
                toSlotId: emptyCell?.cell ?? '',
                toLevel: emptyCell?.level ?? '',
              }))
            }} className={fieldClass}>
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
            <input value={form.quantity} onFocus={(e) => setForm((f) => ({ ...f, quantity: formatQuantityInput(e.target.value) }))} onBlur={(e) => setForm((f) => ({ ...f, quantity: formatQuantity(e.target.value) }))} onChange={(e) => setForm((f) => ({ ...f, quantity: formatQuantityInput(e.target.value) }))} inputMode="decimal" placeholder="Số lượng" className={fieldClass} />
            <input value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Lý do điều chuyển" className={fieldClass} />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 text-xs xl:grid-cols-2">
            <MetricBox title="Tồn tại nguồn" value={formatQuantity(sourceQty)} />
            <MetricBox title="Tồn khả dụng nguồn" value={formatQuantity(availableSourceQty)} />
            <MetricBox title="Nguồn" value={selectedSourceZone ? `${selectedSourceZone.warehouseName || 'Kho'} / ${form.fromSlotId || '-'} / ${form.fromLevel || 'L1'}` : 'Chưa chọn'} />
            <MetricBox title="Đích" value={selectedDestinationZone ? `${selectedDestinationZone.warehouseName || 'Kho'} / ${form.toSlotId || '-'} / ${form.toLevel || 'L1'}` : 'Chưa chọn'} />
          </div>

          {form.toZoneId ? (
            <div className={`mt-3 flex flex-col gap-3 rounded-xl border p-3 text-xs md:flex-row md:items-center md:justify-between ${
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
            </div>
          ) : null}

          {isStockExceeded && (
            <div className="mt-3 rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              ⚠️ Số lượng điều chuyển vượt quá tồn khả dụng tại vị trí nguồn.
            </div>
          )}

          {/* Add to Pending Button */}
          <button
            type="button"
            disabled={!canAddPending}
            onClick={handleAddPending}
            className="w-full mt-3 rounded-lg border border-cyan-400/30 bg-cyan-400/10 py-2.5 font-semibold text-cyan-200 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50 text-xs"
          >
            + Thêm vào danh sách chờ điều chuyển
          </button>

          <div className="mt-3">
            <InventoryAttachmentPicker files={attachmentFiles} onChange={setAttachmentFiles} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.055] p-4">
            <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-300">Vị trí nguồn</div>
            <WarehouseMiniMap
              compact
              zone={selectedSourceFullZone}
              slotId={form.fromSlotId}
              level={form.fromLevel}
              onSelect={(cell: string, selectedLevel: string) => setForm((prev) => ({ ...prev, fromSlotId: cell, fromLevel: selectedLevel }))}
            />
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.055] p-4">
            <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-300">Vị trí đích</div>
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
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={handleClose} className={secondaryButtonClass}>Hủy</button>
        <button disabled={pendingItems.length === 0 || createTx.isPending} onClick={submitTransfer} className={primaryButtonClass}>
          {createTx.isPending ? 'Đang thực hiện...' : `Xác nhận điều chuyển (${pendingItems.length})`}
        </button>
      </div>
    </ModalShell>
  )
}

export function AdjustmentTransactionModal({ open, onClose }: ModalProps) {
  const { data: materials = [] } = useInventoryItems()
  const { data: zones = [] } = useZones()
  const createTx = useCreateTransaction()
  const queryClient = useQueryClient()
  const [sessionNo, setSessionNo] = useState(generateTransactionNo('KK'))
  const [attachmentFiles, setAttachmentFiles] = useState<InventoryAttachmentDraft[]>([])
  const [form, setForm] = useState({
    transactionDate: formatLocalDateTimeInput(),
    materialId: '',
    zoneId: '',
    slotId: '',
    level: 'L1',
    actualQty: '',
    reason: ADJUSTMENT_REASONS[0],
    customReason: '',
  })

  const selectedMaterial = materials.find((item: any) => String(item.id) === String(form.materialId)) as any
  const { data: selectedMaterialDetail } = useMaterialDetail(form.materialId || undefined)
  const materialDetail = (selectedMaterialDetail as any) ?? selectedMaterial
  const locationRows = useMemo(() => {
    const rows = Array.isArray(materialDetail?.locationBalances)
      ? materialDetail.locationBalances
      : []
    return rows
      .filter((row: any) => num(row.quantity) > 0)
      .sort((a: any, b: any) => {
        const warehouseCompare = String(a.warehouseCode ?? a.warehouseName ?? '').localeCompare(String(b.warehouseCode ?? b.warehouseName ?? ''))
        if (warehouseCompare !== 0) return warehouseCompare
        const zoneCompare = String(a.zoneCode ?? a.zoneName ?? '').localeCompare(String(b.zoneCode ?? b.zoneName ?? ''))
        if (zoneCompare !== 0) return zoneCompare
        const slotCompare = String(a.slotId ?? '').localeCompare(String(b.slotId ?? ''))
        if (slotCompare !== 0) return slotCompare
        return normalizeLevel(a.level).localeCompare(normalizeLevel(b.level))
      })
  }, [materialDetail])
  const zoneOptions = useMemo(() => {
    const zoneIds = uniqueStrings(locationRows.map((row: any) => String(row.zoneId ?? '')))
    return zoneIds
      .map((zoneId) => {
        const row = locationRows.find((location: any) => String(location.zoneId) === zoneId)
        const zone = zones.find((item: any) => String(item.id) === zoneId)
        return {
          id: zoneId,
          label: `${row?.warehouseCode ?? zone?.warehouse?.code ?? row?.warehouseName ?? 'Kho'} · ${row?.zoneCode ?? zone?.code ?? 'ZONE'}${row?.zoneName || zone?.name ? ` - ${row?.zoneName ?? zone?.name}` : ''}`,
        }
      })
  }, [locationRows, zones])

  const selectedLocation = locationRows.find((row: any) =>
    String(row.zoneId ?? '') === String(form.zoneId) &&
    String(row.slotId ?? '') === String(form.slotId) &&
    normalizeLevel(row.level) === normalizeLevel(form.level),
  )
  const selectedFullZone = zones.find((zone: any) => String(zone.id) === String(form.zoneId))
  const systemQty = selectedLocation ? num(selectedLocation.quantity) : 0
  const actualQty = parseLocaleNumber(form.actualQty)
  const hasActualQty = Number.isFinite(actualQty)
  const difference = hasActualQty ? actualQty - systemQty : 0
  const averageCost = num(materialDetail?.averageCost ?? selectedMaterial?.averageCost ?? materialDetail?.unitPrice ?? selectedMaterial?.unitPrice)
  const varianceValue = difference * averageCost
  const unitLabel = materialDetail?.unitMaster?.symbol ?? materialDetail?.unit ?? selectedMaterial?.unit ?? ''
  const reasonText = form.reason === 'Khác' ? form.customReason.trim() : form.reason
  const canSubmit =
    Boolean(form.materialId) &&
    Boolean(form.zoneId) &&
    Boolean(form.slotId) &&
    Boolean(form.level) &&
    Boolean(reasonText) &&
    hasActualQty &&
    Math.abs(difference) > 0.000001

  useEffect(() => {
    if (!open) return

    setForm((prev) => ({
      ...prev,
      transactionDate: formatLocalDateTimeInput(),
    }))
    setSessionNo(generateTransactionNo('KK'))
  }, [open])

  useEffect(() => {
    if (!form.materialId || !locationRows.length) return
    const stillExists = locationRows.some((row: any) =>
      String(row.zoneId ?? '') === String(form.zoneId) &&
      String(row.slotId ?? '') === String(form.slotId) &&
      normalizeLevel(row.level) === normalizeLevel(form.level),
    )
    if (stillExists) return
    const first = locationRows[0]
    setForm((prev) => ({
      ...prev,
      zoneId: String(first.zoneId ?? ''),
      slotId: String(first.slotId ?? ''),
      level: normalizeLevel(first.level),
    }))
  }, [form.materialId, form.zoneId, form.slotId, form.level, locationRows])

  function selectLocation(row: any) {
    setForm((prev) => ({
      ...prev,
      zoneId: String(row.zoneId ?? ''),
      slotId: String(row.slotId ?? ''),
      level: normalizeLevel(row.level),
    }))
  }

  async function submitAdjustment() {
    if (!canSubmit) return
    const auditNote = JSON.stringify({
      kind: 'INVENTORY_ADJUSTMENT_AUDIT',
      systemQty,
      actualQty,
      difference,
      varianceValue,
      reason: reasonText,
      warehouseId: selectedLocation?.warehouseId,
      warehouseCode: selectedLocation?.warehouseCode,
      zoneId: form.zoneId,
      zoneCode: selectedLocation?.zoneCode,
      slotId: form.slotId,
      level: form.level,
    })

    const transaction = await createTx.mutateAsync({
      type: 'ADJUSTMENT',
      transactionNo: sessionNo,
      transactionDate: form.transactionDate ? new Date(form.transactionDate).toISOString() : new Date().toISOString(),
      warehouseId: selectedLocation?.warehouseId || selectedFullZone?.warehouseId || undefined,
      zoneId: form.zoneId,
      remarks: reasonText,
      note: auditNote,
      items: [
        {
          inventoryItemId: form.materialId,
          warehouseId: selectedLocation?.warehouseId || selectedFullZone?.warehouseId || undefined,
          zoneId: form.zoneId,
          slotId: form.slotId,
          level: form.level,
          quantity: difference,
          unitPrice: averageCost || undefined,
          totalAmount: averageCost ? Math.abs(difference) * averageCost : undefined,
        },
      ],
    })
    await refreshInventoryCache(queryClient)

    try {
      await uploadInventoryTransactionAttachments({
        transaction,
        files: attachmentFiles,
      })
    } catch {
      toast.error('Phiếu đã lưu nhưng upload tài liệu điều chỉnh thất bại')
    }

    toast.success('Đã tạo phiếu điều chỉnh tồn kho')
    setSessionNo(generateTransactionNo('KK'))
    setAttachmentFiles([])
    setForm({
      transactionDate: formatLocalDateTimeInput(),
      materialId: '',
      zoneId: '',
      slotId: '',
      level: 'L1',
      actualQty: '',
      reason: ADJUSTMENT_REASONS[0],
      customReason: '',
    })
    onClose()
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Điều chỉnh tồn kho" wide maxWidthClass="max-w-[96vw] 2xl:max-w-[1800px]">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(430px,0.78fr)_minmax(740px,1.22fr)]">
        <div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input type="datetime-local" value={form.transactionDate} onFocus={() => setForm((prev) => ({ ...prev, transactionDate: formatLocalDateTimeInput() }))} onChange={(event) => setForm((prev) => ({ ...prev, transactionDate: event.target.value }))} className={fieldClass} />
            <div className="flex items-center rounded-lg border border-white/12 bg-white/[0.06] px-3 text-sm text-slate-300">
              Phiếu: <span className="ml-1 font-semibold text-cyan-200">{sessionNo}</span>
            </div>
            <select value={form.materialId} onChange={(event) => setForm((prev) => ({ ...prev, materialId: event.target.value, zoneId: '', slotId: '', level: 'L1', actualQty: '' }))} className={`${fieldClass} md:col-span-2`}>
              <option value="">Chọn vật tư</option>
              {materials.map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
            <select value={form.zoneId} onChange={(event) => setForm((prev) => ({ ...prev, zoneId: event.target.value, slotId: '', level: 'L1' }))} className={fieldClass}>
              <option value="">Chọn zone từ tồn vị trí</option>
              {zoneOptions.map((zone) => (
                <option key={zone.id} value={zone.id}>{zone.label}</option>
              ))}
            </select>
            <select
              value={`${form.zoneId}|${form.slotId}|${form.level}`}
              onChange={(event) => {
                const row = locationRows.find((location: any) => [location.zoneId, location.slotId, normalizeLevel(location.level)].join('|') === event.target.value)
                if (row) selectLocation(row)
              }}
              className={fieldClass}
            >
              <option value="">Chọn ô / tầng</option>
              {locationRows.filter((row: any) => !form.zoneId || String(row.zoneId) === String(form.zoneId)).map((row: any) => (
                <option key={`${row.zoneId}-${row.slotId}-${row.level}`} value={[row.zoneId, row.slotId, normalizeLevel(row.level)].join('|')}>
                  {row.zoneCode ?? row.zoneName ?? 'ZONE'} / {row.slotId ?? '-'} / {normalizeLevel(row.level)} - tồn {formatQuantity(row.quantity)}
                </option>
              ))}
            </select>
            <input readOnly value={`${formatQuantity(systemQty)} ${unitLabel}`.trim()} className={`${fieldClass} cursor-not-allowed text-slate-300`} placeholder="System Qty" />
            <input
              value={form.actualQty}
              onFocus={(event) => setForm((prev) => ({ ...prev, actualQty: formatQuantityInput(event.target.value) }))}
              onBlur={(event) => setForm((prev) => ({ ...prev, actualQty: formatQuantity(event.target.value) }))}
              onChange={(event) => setForm((prev) => ({ ...prev, actualQty: formatQuantityInput(event.target.value) }))}
              inputMode="decimal"
              placeholder="Actual Qty"
              className={fieldClass}
            />
            <input readOnly value={`${difference > 0 ? '+' : ''}${formatQuantity(difference)} ${unitLabel}`.trim()} className={`${fieldClass} cursor-not-allowed ${difference >= 0 ? 'text-emerald-300' : 'text-red-300'}`} placeholder="Difference" />
            <input readOnly value={formatCurrencyVnd(varianceValue)} className={`${fieldClass} cursor-not-allowed text-cyan-200`} placeholder="Variance Value" />
            <select value={form.reason} onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))} className={fieldClass}>
              {ADJUSTMENT_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
            </select>
            {form.reason === 'Khác' ? (
              <input value={form.customReason} onChange={(event) => setForm((prev) => ({ ...prev, customReason: event.target.value }))} placeholder="Ghi rõ lý do khác" className={fieldClass} />
            ) : (
              <div className="flex items-center rounded-lg border border-white/12 bg-white/[0.04] px-3 text-sm text-slate-400">
                Lý do sẽ lưu vào phiếu điều chỉnh.
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
            <MetricBox title="System Qty" value={`${formatQuantity(systemQty)} ${unitLabel}`.trim()} />
            <MetricBox title="Actual Qty" value={hasActualQty ? `${formatQuantity(actualQty)} ${unitLabel}`.trim() : '-'} />
            <MetricBox title="Variance Value" value={formatCurrencyVnd(varianceValue)} />
          </div>

          {form.materialId && locationRows.length === 0 ? (
            <div className="mt-3 rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
              Vật tư này chưa có tồn vị trí khả dụng để điều chỉnh.
            </div>
          ) : null}

          <div className="mt-3">
            <InventoryAttachmentPicker files={attachmentFiles} onChange={setAttachmentFiles} />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button onClick={onClose} className={secondaryButtonClass}>Hủy</button>
            <button disabled={!canSubmit || createTx.isPending} onClick={submitAdjustment} className={primaryButtonClass}>
              {createTx.isPending ? 'Đang lưu...' : 'Tạo phiếu điều chỉnh'}
            </button>
          </div>
        </div>

        <div className="grid gap-3 2xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-xl border border-white/10 bg-white/[0.055] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">Vị trí vật tư</div>
                <div className="mt-0.5 text-xs text-slate-400">Click dòng để lấy đúng System Qty theo bucket.</div>
              </div>
              <div className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-200">
                {formatQuantity(locationRows.length, 0)} vị trí
              </div>
            </div>
            <div className="max-h-[520px] overflow-auto rounded-lg border border-white/10">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="sticky top-0 bg-slate-950/95 text-xs uppercase tracking-[0.08em] text-slate-400">
                  <tr>
                    {['Kho', 'Zone', 'Slot', 'Level', 'Qty'].map((header) => (
                      <th key={header} className="px-3 py-2 text-left font-medium">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {locationRows.length ? locationRows.map((row: any) => {
                    const active =
                      String(row.zoneId ?? '') === String(form.zoneId) &&
                      String(row.slotId ?? '') === String(form.slotId) &&
                      normalizeLevel(row.level) === normalizeLevel(form.level)
                    return (
                      <tr
                        key={`${row.zoneId}-${row.slotId}-${row.level}`}
                        onClick={() => selectLocation(row)}
                        className={`cursor-pointer border-t border-white/10 transition hover:bg-white/[0.07] ${active ? 'bg-cyan-400/12 text-cyan-100' : 'text-slate-300'}`}
                      >
                        <td className="px-3 py-2">{row.warehouseCode ?? row.warehouseName ?? '-'}</td>
                        <td className="px-3 py-2">{row.zoneCode ?? row.zoneName ?? '-'}</td>
                        <td className="px-3 py-2">{row.slotId ?? '-'}</td>
                        <td className="px-3 py-2">{normalizeLevel(row.level)}</td>
                        <td className="px-3 py-2 font-semibold text-white">{formatQuantity(row.quantity)} {unitLabel}</td>
                      </tr>
                    )
                  }) : (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-sm text-slate-500">Chọn vật tư để xem tồn theo vị trí.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.055] p-4">
            <div className="mb-3 text-sm font-semibold text-white">Sơ đồ vị trí</div>
            <WarehouseMiniMap
              compact
              zone={selectedFullZone}
              slotId={form.slotId}
              level={form.level}
              onSelect={(cell: string, selectedLevel: string) =>
                setForm((prev) => ({
                  ...prev,
                  slotId: cell,
                  level: selectedLevel,
                }))
              }
            />
          </div>
        </div>
      </div>
    </ModalShell>
  )
}

export function StockTakeTransactionModal({ open, onClose }: ModalProps) {
  const { data: materials = [] } = useInventoryItems()
  const { data: zones = [] } = useZones()
  const createTx = useCreateTransaction()
  const queryClient = useQueryClient()
  const [methodFilter, setMethodFilter] = useState('')
  const [sessionNo, setSessionNo] = useState(generateTransactionNo('KK'))
  const [countRows, setCountRows] = useState<CountLine[]>([])
  const [attachmentFiles, setAttachmentFiles] = useState<InventoryAttachmentDraft[]>([])

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
    const transaction = await createTx.mutateAsync({
      type: 'ADJUSTMENT',
      transactionNo: sessionNo,
      referenceType: methodFilter || 'Định kỳ',
      items,
    })
    await refreshInventoryCache(queryClient)
    try {
      await uploadInventoryTransactionAttachments({
        transaction,
        files: attachmentFiles,
      })
    } catch {
      toast.error('Phiếu đã lưu nhưng upload tài liệu kiểm kê thất bại')
    }
    setCountRows([])
    setAttachmentFiles([])
    setSessionNo(generateTransactionNo('KK'))
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
                <td className="px-3 py-2 text-slate-200">{formatQuantity(line.systemQty)}</td>
                <td className="px-3 py-2">
                  <input value={line.physicalQty} onFocus={(e) => setCountRows((prev) => prev.map((r, i) => (i === idx ? { ...r, physicalQty: formatQuantityInput(e.target.value) } : r)))} onBlur={(e) => setCountRows((prev) => prev.map((r, i) => (i === idx ? { ...r, physicalQty: formatQuantity(e.target.value) } : r)))} onChange={(e) => setCountRows((prev) => prev.map((r, i) => (i === idx ? { ...r, physicalQty: formatQuantityInput(e.target.value) } : r)))} inputMode="decimal" className="h-9 w-32 rounded border border-white/10 bg-white/[0.06] px-2 text-slate-100" />
                </td>
                <td className={`px-3 py-2 ${line.difference >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{formatQuantity(line.difference)}</td>
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

      <div className="mt-3">
        <InventoryAttachmentPicker files={attachmentFiles} onChange={setAttachmentFiles} />
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
