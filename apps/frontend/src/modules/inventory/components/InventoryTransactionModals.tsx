import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { useCreateTransaction } from '../hooks/useCreateTransaction'
import { useInventoryItems } from '../hooks/useInventoryItems'
import { useMaterialDetail } from '../hooks/useMaterialDetail'
import { useProjects } from '../hooks/useProjects'
import { useSuppliers } from '../hooks/useSuppliers'
import { useZones } from '../hooks/useZones'

type ModalProps = {
  open: boolean
  onClose: () => void
}

type CountLine = {
  inventoryItemId: string
  physicalQty: string
  zoneId: string
}

function num(v: any) {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}

function formatCurrency(v: any) {
  return `${Math.round(num(v)).toLocaleString('vi-VN')} đ`
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
  const createTransaction = useCreateTransaction()

  const [form, setForm] = useState({
    transactionDate: new Date().toISOString().slice(0, 16),
    inventoryItemId: '',
    supplierId: '',
    zoneId: '',
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
      const materialZone = zones.find((zone: any) => String(zone.id) === String(selectedMaterial.zoneId))
      if (materialZone) return materialZone
    }
    return zones[0]
  }, [selectedMaterial?.zoneId, zones])

  useEffect(() => {
    if (!form.inventoryItemId) return
    const currentZoneIsValid = form.zoneId && zones.some((zone: any) => String(zone.id) === String(form.zoneId))
    if (currentZoneIsValid || !defaultInboundZone?.id) return
    setForm((prev) => ({ ...prev, zoneId: defaultInboundZone.id }))
  }, [form.inventoryItemId, form.zoneId, defaultInboundZone, zones])

  async function submit() {
    if (!form.inventoryItemId || quantity <= 0 || unitPrice <= 0) return
    const no = `NK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`
    await createTransaction.mutateAsync({
      type: 'INBOUND',
      transactionNo: no,
      transactionDate: form.transactionDate ? new Date(form.transactionDate).toISOString() : new Date().toISOString(),
      supplierId: form.supplierId || undefined,
      supplierName: suppliers.find((x: any) => x.id === form.supplierId)?.name,
      remarks: form.remark || undefined,
      items: [
        {
          inventoryItemId: form.inventoryItemId,
          quantity,
          unitPrice,
          zoneId: form.zoneId || undefined,
        },
      ],
    })
    setForm({
      transactionDate: new Date().toISOString().slice(0, 16),
      inventoryItemId: '',
      supplierId: '',
      zoneId: '',
      quantity: '',
      unitPrice: '',
      vat: '10',
      remark: '',
    })
    onClose()
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Nhập kho vật tư">
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
          Vị trí mặc định lần nhập đầu: <span className="ml-1 text-cyan-300">{defaultInboundZone?.code ?? 'A01'} ({defaultInboundZone?.name ?? 'Warehouse Zone A01'})</span>
        </div>
        <select value={form.zoneId} onChange={(e) => setForm((f) => ({ ...f, zoneId: e.target.value }))} className={fieldClass}>
          <option value="">Khu vực nhận (sau nhập)</option>
          {zones.map((z: any) => (
            <option key={z.id} value={z.id}>
              {z.code}
            </option>
          ))}
        </select>
        <input value={form.vat} onChange={(e) => setForm((f) => ({ ...f, vat: e.target.value }))} placeholder="VAT (%)" className={fieldClass} />
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
        <MetricBox title="Tồn hiện tại" value={currentStock.toLocaleString('vi-VN')} />
        <MetricBox title="Sau nhập" value={(currentStock + quantity).toLocaleString('vi-VN')} />
        <MetricBox title="Đơn giá TB mới" value={formatCurrency(unitPrice)} />
        <MetricBox title="Giá nhập gần nhất" value={formatCurrency(unitPrice)} />
      </div>
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
        <button onClick={submit} className={primaryButtonClass}>
          Xác nhận nhập kho
        </button>
      </div>
    </ModalShell>
  )
}

export function OutboundTransactionModal({ open, onClose }: ModalProps) {
  const { data: materials = [] } = useInventoryItems()
  const { data: projects = [] } = useProjects()
  const { data: zones = [] } = useZones()
  const createTransaction = useCreateTransaction()

  const [form, setForm] = useState({
    transactionDate: new Date().toISOString().slice(0, 16),
    target: 'PROJECT',
    projectId: '',
    inventoryItemId: '',
    zoneId: '',
    quantity: '',
    remark: '',
  })
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
    const balances = Array.isArray((selectedMaterialDetail as any)?.locationBalances)
      ? ((selectedMaterialDetail as any).locationBalances as any[]).filter((balance) => num(balance.quantity) > 0)
      : []
    if (balances.length > 0) return balances
    const fallbackZone = selectedMaterial?.zoneId
      ? zones.find((zone: any) => String(zone.id) === String(selectedMaterial.zoneId))
      : zones[0]
    const fallbackZoneId = selectedMaterial?.zoneId ?? fallbackZone?.id
    if (fallbackZoneId && currentStock > 0) {
      return [
        {
          zoneId: fallbackZoneId,
          zoneCode: selectedMaterial?.zoneCode ?? fallbackZone?.code ?? 'ZONE',
          zoneName: selectedMaterial?.zone ?? fallbackZone?.name ?? 'Vị trí vật tư',
          quantity: currentStock,
        },
      ]
    }
    return []
  }, [selectedMaterialDetail, selectedMaterial, currentStock, zones])
  const qtyByZoneId = useMemo(() => {
    const map = new Map<string, number>()
    locationBalances.forEach((balance) => {
      if (balance.zoneId) map.set(String(balance.zoneId), num(balance.quantity))
    })
    return map
  }, [locationBalances])
  const availableZones = useMemo(() => {
    const zoneMap = new Map<string, any>(zones.map((zone: any) => [String(zone.id), zone]))
    return locationBalances
      .filter((balance) => balance.zoneId)
      .map((balance) => {
        const zone = zoneMap.get(String(balance.zoneId))
        return {
          id: String(balance.zoneId),
          code: zone?.code ?? balance.zoneCode ?? 'ZONE',
          name: zone?.name ?? balance.zoneName ?? 'Vị trí vật tư',
        }
      })
  }, [locationBalances, zones])
  useEffect(() => {
    if (!form.inventoryItemId) return
    if (form.zoneId && availableZones.some((zone) => zone.id === String(form.zoneId))) return
    const firstZone = availableZones[0]
    if (!firstZone?.id) return
    setForm((prev) => ({ ...prev, zoneId: firstZone.id }))
  }, [form.inventoryItemId, form.zoneId, availableZones])
  const selectedZoneStock = form.zoneId ? qtyByZoneId.get(String(form.zoneId)) ?? 0 : 0
  const selectedZoneAfterStock = selectedZoneStock - quantity
  const canSubmit =
    Boolean(form.inventoryItemId) &&
    Boolean(form.zoneId) &&
    quantity > 0 &&
    selectedZoneAfterStock >= 0

  async function submit() {
    if (!canSubmit) return
    const no = `XK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`
    const targetTag = form.target === 'COMPONENT_PRODUCTION'
      ? '[COMPONENT_PRODUCTION]'
      : '[PROJECT]'
    await createTransaction.mutateAsync({
      type: 'OUTBOUND',
      transactionNo: no,
      transactionDate: form.transactionDate ? new Date(form.transactionDate).toISOString() : new Date().toISOString(),
      projectId: form.projectId || undefined,
      projectName: projects.find((x: any) => x.id === form.projectId)?.name,
      zoneId: form.zoneId,
      remarks: `${targetTag} ${form.remark}`.trim(),
      items: [
        {
          inventoryItemId: form.inventoryItemId,
          quantity: -Math.abs(quantity),
          zoneId: form.zoneId || undefined,
        },
      ],
    })
    setForm({
      transactionDate: new Date().toISOString().slice(0, 16),
      target: 'PROJECT',
      projectId: '',
      inventoryItemId: '',
      zoneId: '',
      quantity: '',
      remark: '',
    })
    onClose()
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Xuất kho vật tư">
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
        <select value={form.zoneId} onChange={(e) => setForm((f) => ({ ...f, zoneId: e.target.value }))} className={fieldClass}>
          <option value="">Vị trí lấy vật tư</option>
          {availableZones.map((z: any) => (
            <option key={z.id} value={z.id}>
              {z.code} - {z.name} · tồn {(qtyByZoneId.get(String(z.id)) ?? 0).toLocaleString('vi-VN')}
            </option>
          ))}
        </select>
        <div className="flex items-center rounded-lg border border-white/12 bg-white/[0.06] px-3 text-sm text-slate-300">
          Tồn vị trí đã chọn: <span className="ml-1 text-cyan-300">{selectedZoneStock.toLocaleString('vi-VN')}</span>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
        <MetricBox title="Tồn hiện tại" value={currentStock.toLocaleString('vi-VN')} />
        <MetricBox title="Tồn sau xuất" value={Math.max(0, currentStock - quantity).toLocaleString('vi-VN')} />
        <MetricBox title="Tồn tại vị trí" value={selectedZoneStock.toLocaleString('vi-VN')} />
        <MetricBox title="Vị trí sau xuất" value={Math.max(0, selectedZoneAfterStock).toLocaleString('vi-VN')} />
      </div>
      <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm">
        <div className="text-slate-300">Giá trị xuất dự kiến: <span className="font-semibold text-cyan-300">{formatCurrency(quantity * estimatedUnitPrice)}</span></div>
        <div className="mt-1 text-slate-300">Đối tượng xuất: <span className="font-semibold text-white">{form.target === 'COMPONENT_PRODUCTION' ? 'Sản xuất cấu kiện' : 'Công trình'}</span></div>
      </div>
      {form.inventoryItemId && availableZones.length === 0 && (
        <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
          Vật tư này chưa có vị trí tồn khả dụng. Hãy nhập kho hoặc gán vị trí tồn trước khi xuất.
        </div>
      )}
      {form.zoneId && quantity > selectedZoneStock && (
        <div className="mt-3 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-100">
          Số lượng xuất lớn hơn tồn tại vị trí đã chọn.
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
    </ModalShell>
  )
}

export function TransferTransactionModal({ open, onClose }: ModalProps) {
  const { data: materials = [] } = useInventoryItems()
  const { data: zones = [] } = useZones()
  const createTx = useCreateTransaction()
  const [form, setForm] = useState({
    transactionDate: new Date().toISOString().slice(0, 16),
    materialId: '',
    fromZoneId: '',
    toZoneId: '',
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
    const byId = new Map<string, any>(zones.map((z: any) => [String(z.id), z]))
    if (balances.length === 0) {
      const fallbackZone = selectedMaterial?.zoneId
        ? zones.find((zone: any) => String(zone.id) === String(selectedMaterial.zoneId))
        : zones[0]
      const fallbackZoneId = selectedMaterial?.zoneId ?? fallbackZone?.id
      if (!fallbackZoneId || currentStock <= 0) return []
      return [
        {
          id: String(fallbackZoneId),
          label: `${selectedMaterial?.zoneCode ?? fallbackZone?.code ?? 'ZONE'} - ${selectedMaterial?.zone ?? fallbackZone?.name ?? ''}`,
          qty: currentStock,
          zoneCode: selectedMaterial?.zoneCode ?? fallbackZone?.code ?? 'ZONE',
        },
      ]
    }
    return balances
      .filter((b: any) => num(b.quantity) > 0)
      .map((b: any) => {
        const zone = byId.get(String(b.zoneId))
        const zoneCode = zone?.code ?? b.zoneCode ?? 'NA'
        const zoneName = zone?.name ?? ''
        return { id: String(b.zoneId), label: `${zoneCode} - ${zoneName}`, qty: num(b.quantity), zoneCode }
      })
  }, [selectedMaterialDetail, zones, selectedMaterial, currentStock])

  const destinationZoneOptions = useMemo(() => {
    return zones
      .filter((z: any) => String(z.id) !== form.fromZoneId)
      .map((z: any) => {
        const matched = sourceZoneOptions.find((s) => s.id === String(z.id))
        return {
          id: String(z.id),
          label: `${z.code} - ${z.name}`,
          qty: matched?.qty ?? 0,
          zoneCode: z.code,
        }
      })
  }, [zones, form.fromZoneId, sourceZoneOptions])

  const sourceQty = useMemo(() => {
    const selected = sourceZoneOptions.find((s) => s.id === form.fromZoneId)
    return num(selected?.qty)
  }, [sourceZoneOptions, form.fromZoneId])
  const transferQty = num(form.quantity)
  const canTransfer =
    Boolean(form.materialId) &&
    Boolean(form.fromZoneId) &&
    Boolean(form.toZoneId) &&
    form.fromZoneId !== form.toZoneId &&
    transferQty > 0 &&
    transferQty <= sourceQty

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
          quantity: -Math.abs(qty),
        },
        {
          inventoryItemId: form.materialId,
          zoneId: form.toZoneId,
          quantity: Math.abs(qty),
        },
      ],
    })

    setForm({
      transactionDate: new Date().toISOString().slice(0, 16),
      materialId: '',
      fromZoneId: '',
      toZoneId: '',
      quantity: '',
      reason: '',
    })
    onClose()
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
            <select value={form.fromZoneId} onChange={(e) => setForm((f) => ({ ...f, fromZoneId: e.target.value }))} className={fieldClass}>
              <option value="">Từ khu vực</option>
              {sourceZoneOptions.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.zoneCode} ({z.qty.toLocaleString('vi-VN')})
                </option>
              ))}
            </select>
            <select value={form.toZoneId} onChange={(e) => setForm((f) => ({ ...f, toZoneId: e.target.value }))} className={fieldClass}>
              <option value="">Đến khu vực</option>
              {destinationZoneOptions.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.zoneCode} ({z.qty.toLocaleString('vi-VN')})
                </option>
              ))}
            </select>
            <input value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} placeholder="Số lượng" className={fieldClass} />
            <input value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Lý do điều chuyển" className={fieldClass} />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 text-sm xl:grid-cols-2">
            <MetricBox title="Tồn tại nguồn" value={sourceQty.toLocaleString('vi-VN')} />
            <MetricBox title="Sau điều chuyển" value={Math.max(0, sourceQty - num(form.quantity)).toLocaleString('vi-VN')} />
          </div>
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
