import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { EnterpriseTabBar } from '../../../../shared/runtime-tabs/EnterpriseTabBar'
import { inventoryTabs } from '../../config/inventory-tabs'
import { RuntimePanel, SectionHeader } from '../../../../shared/ui/enterprise'
import { useInventoryItems } from '../../hooks/useInventoryItems'
import { useCreateMaterial } from '../../hooks/useCreateMaterial'
import { useCreateTransaction } from '../../hooks/useCreateTransaction'
import { useSuppliers } from '../../hooks/useSuppliers'
import { useProjects } from '../../hooks/useProjects'
import { useMaterialDetail } from '../../hooks/useMaterialDetail'
import { useCategories } from '../../hooks/useCategories'
import { useUnits } from '../../hooks/useUnits'
import { useZones } from '../../hooks/useZones'
import { useInventoryAudit } from '../../hooks/useInventoryAudit'

type ModalType =
  | null
  | 'create-material'
  | 'inbound'
  | 'outbound'
  | 'transfer'
  | 'stock-take'
  | 'material-detail'

function parseLocaleNumber(v: any) {
  if (typeof v === 'number') return v
  const raw = String(v ?? '').trim()
  if (!raw) return 0
  // vi-VN input support: 12.500,75 / 12,5 / 10000
  const normalized = raw.replace(/\./g, '').replace(',', '.')
  const n = Number(normalized)
  return Number.isFinite(n) ? n : 0
}

function num(v: any) {
  return parseLocaleNumber(v)
}

function formatCurrencyVN(v: any) {
  return Math.round(num(v)).toLocaleString('vi-VN')
}

function formatNumberVN(v: any, maxFractionDigits = 3) {
  return num(v).toLocaleString('vi-VN', {
    maximumFractionDigits: maxFractionDigits,
  })
}

function formatInputNumberVN(v: any, isMoney = false) {
  if (v === '' || v === null || v === undefined) return ''
  const n = isMoney ? Math.round(num(v)) : num(v)
  return n.toLocaleString('vi-VN', { maximumFractionDigits: isMoney ? 0 : 3 })
}

function formatMoneyInputRealtime(v: string) {
  const digits = String(v ?? '').replace(/[^\d]/g, '')
  if (!digits) return ''
  return Number(digits).toLocaleString('vi-VN', { maximumFractionDigits: 0 })
}

function formatDecimalInputRealtime(v: string) {
  const clean = String(v ?? '').replace(/[^\d,]/g, '')
  if (!clean) return ''
  if (clean === ',') return '0,'
  if (clean.endsWith(',') && clean.indexOf(',') === clean.length - 1) {
    const intPart = clean.slice(0, -1)
    const intDigits = intPart.replace(/^0+(?=\d)/, '')
    const intFormatted = (intDigits ? Number(intDigits) : 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 })
    return `${intFormatted},`
  }
  const [intRaw = '', ...rest] = clean.split(',')
  const decRaw = rest.join('').slice(0, 3)
  const intDigits = intRaw.replace(/^0+(?=\d)/, '')
  const intFormatted = (intDigits ? Number(intDigits) : 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 })
  return decRaw ? `${intFormatted},${decRaw}` : intFormatted
}

export function InventoryOverviewPage() {
  const queryClient = useQueryClient()
  const { data: items = [] } = useInventoryItems()
  const { data: suppliers = [] } = useSuppliers()
  const { data: projects = [] } = useProjects()
  const { data: categories = [] } = useCategories()
  const { data: units = [] } = useUnits()
  const { data: zones = [] } = useZones()
  const { data: auditRows = [] } = useInventoryAudit()
  const createMaterialMutation = useCreateMaterial()
  const createTransactionMutation = useCreateTransaction()

  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [materialDetailTab, setMaterialDetailTab] = useState<
    'overview' | 'inout' | 'projects' | 'suppliers' | 'locations' | 'analytics' | 'files' | 'logs'
  >('overview')

  const [createMaterialForm, setCreateMaterialForm] = useState({
    code: '',
    name: '',
    categoryId: '',
    unit: '',
    firstInboundQty: '',
    unitPrice: '',
    minimumStock: '',
    note: '',
  })

  const [inboundForm, setInboundForm] = useState({
    transactionDate: new Date().toISOString().slice(0, 16),
    supplierId: '',
    inventoryItemId: '',
    zoneId: '',
    quantity: '',
    unitPrice: '',
    vat: '10',
    remark: '',
  })

  const [outboundForm, setOutboundForm] = useState({
    transactionDate: new Date().toISOString().slice(0, 16),
    projectId: '',
    target: 'PROJECT',
    inventoryItemId: '',
    quantity: '',
    remark: '',
  })

  const [transferForm, setTransferForm] = useState({
    transactionDate: new Date().toISOString().slice(0, 16),
    fromZoneId: '',
    toZoneId: '',
    inventoryItemId: '',
    quantity: '',
    remark: '',
  })

  const {
    data: selectedMaterialDetail,
  } = useMaterialDetail(activeModal === 'material-detail' ? selectedMaterialId : undefined)

  const resetCreateMaterialForm = () =>
    setCreateMaterialForm({
      code: '',
      name: '',
      categoryId: '',
      unit: '',
      firstInboundQty: '',
      unitPrice: '',
      minimumStock: '',
      note: '',
    })

  const resetInboundForm = () =>
    setInboundForm({
      transactionDate: new Date().toISOString().slice(0, 16),
      supplierId: '',
      inventoryItemId: '',
      zoneId: '',
      quantity: '',
      unitPrice: '',
      vat: '10',
      remark: '',
    })

  const resetOutboundForm = () =>
    setOutboundForm({
      transactionDate: new Date().toISOString().slice(0, 16),
      projectId: '',
      target: 'PROJECT',
      inventoryItemId: '',
      quantity: '',
      remark: '',
    })

  const resetTransferForm = () =>
    setTransferForm({
      transactionDate: new Date().toISOString().slice(0, 16),
      fromZoneId: '',
      toZoneId: '',
      inventoryItemId: '',
      quantity: '',
      remark: '',
    })

  const closeModal = () => {
    setActiveModal(null)
    resetCreateMaterialForm()
    resetInboundForm()
    resetOutboundForm()
    resetTransferForm()
  }

  const itemsWithAudit = useMemo(() => {
    const byId = new Map((auditRows as any[]).map((r: any) => [r.materialId, r]))
    const byCode = new Map((auditRows as any[]).map((r: any) => [r.materialCode, r]))
    return (items as any[]).map((item: any) => {
      const row = byId.get(item.id) ?? byCode.get(item.code)
      const quantity = num(item.quantity ?? row?.currentStock)
      const avgCost = num(item.averageCost ?? row?.averageCost ?? item.unitPrice)
      const baseUnitPrice = num(item.unitPrice ?? row?.averageCost ?? avgCost)
      return {
        ...item,
        quantity,
        averageCost: avgCost,
        baseUnitPrice,
        inventoryValue: num(row?.inventoryValue ?? quantity * avgCost),
      }
    })
  }, [items, auditRows])

  const selectedInboundMaterial = useMemo(
    () => itemsWithAudit.find((x: any) => x.id === inboundForm.inventoryItemId),
    [itemsWithAudit, inboundForm.inventoryItemId],
  )
  const selectedOutboundMaterial = useMemo(
    () => itemsWithAudit.find((x: any) => x.id === outboundForm.inventoryItemId),
    [itemsWithAudit, outboundForm.inventoryItemId],
  )
  const selectedTransferMaterial = useMemo(
    () => itemsWithAudit.find((x: any) => x.id === transferForm.inventoryItemId),
    [itemsWithAudit, transferForm.inventoryItemId],
  )

  const summary = useMemo(() => {
    const totalItems = itemsWithAudit.length
    const totalQty = itemsWithAudit.reduce((s: number, x: any) => s + num(x.quantity), 0)
    const low = itemsWithAudit.filter((x: any) => x.status === 'LOW_STOCK').length
    const critical = itemsWithAudit.filter((x: any) => x.status === 'CRITICAL').length
    const value = itemsWithAudit.reduce((s: number, x: any) => s + num(x.inventoryValue ?? num(x.quantity) * num(x.averageCost ?? x.unitPrice)), 0)
    return { totalItems, totalQty, low, critical, value }
  }, [itemsWithAudit])

  const filteredItems = useMemo(() => {
    if (!search.trim()) return itemsWithAudit
    const q = search.toLowerCase()
    return itemsWithAudit.filter(
      (x: any) => String(x.code ?? '').toLowerCase().includes(q) || String(x.name ?? '').toLowerCase().includes(q),
    )
  }, [itemsWithAudit, search])

  const inboundQty = num(inboundForm.quantity)
  const inboundPrice = num(inboundForm.unitPrice)
  const vatPercent = num(inboundForm.vat)
  const inboundSubTotal = Math.round(inboundQty * inboundPrice)
  const inboundVatAmount = (inboundSubTotal * vatPercent) / 100
  const inboundGrandTotal = Math.round(inboundSubTotal + inboundVatAmount)
  const inboundCurrentStock = num(selectedInboundMaterial?.quantity)
  const inboundAfterStock = inboundCurrentStock + inboundQty
  const inboundAvgCost = inboundAfterStock > 0
    ? ((inboundCurrentStock * num(selectedInboundMaterial?.averageCost ?? selectedInboundMaterial?.unitPrice)) + inboundSubTotal) / inboundAfterStock
    : inboundPrice

  const outboundQty = num(outboundForm.quantity)
  const outboundCurrentStock = num(selectedOutboundMaterial?.quantity)
  const outboundAfterStock = outboundCurrentStock - outboundQty
  const transferQty = num(transferForm.quantity)
  const transferCurrentStock = num(selectedTransferMaterial?.quantity)
  const transferAfterStock = transferCurrentStock - transferQty
  const defaultInboundZoneId = zones?.[0]?.id ?? ''
  const defaultInboundZoneLabel = zones?.[0] ? `${zones[0].code} (${zones[0].name})` : 'KHU MẶC ĐỊNH'

  async function handleCreateMaterial() {
    if (!createMaterialForm.code || !createMaterialForm.name || !createMaterialForm.categoryId || !createMaterialForm.unit) return
    const payload = {
      code: createMaterialForm.code,
      name: createMaterialForm.name,
      categoryId: createMaterialForm.categoryId,
      unit: createMaterialForm.unit,
      unitPrice: Math.round(num(createMaterialForm.unitPrice)),
      minimumStock: num(createMaterialForm.minimumStock),
      description: createMaterialForm.note,
    }

    const created = await createMaterialMutation.mutateAsync(payload)

    if (num(createMaterialForm.firstInboundQty) > 0) {
      await createTransactionMutation.mutateAsync({
        type: 'INBOUND',
        transactionDate: new Date().toISOString(),
        remarks: `Initial inbound for ${createMaterialForm.code}`,
        items: [
          {
            inventoryItemId: created?.id ?? created?.data?.id,
            quantity: num(createMaterialForm.firstInboundQty),
            unitPrice: Math.round(num(createMaterialForm.unitPrice)),
            totalAmount: Math.round(num(createMaterialForm.firstInboundQty) * num(createMaterialForm.unitPrice)),
            zoneId: defaultInboundZoneId || undefined,
          },
        ],
      })
    }

    await queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
    await queryClient.invalidateQueries({ queryKey: ['materials'] })
    closeModal()
  }

  async function handleInbound() {
    if (!inboundForm.inventoryItemId || inboundQty <= 0) return
    await createTransactionMutation.mutateAsync({
      type: 'INBOUND',
      supplierId: inboundForm.supplierId || undefined,
      transactionDate: inboundForm.transactionDate,
      remarks: inboundForm.remark,
      items: [
        {
          inventoryItemId: inboundForm.inventoryItemId,
          quantity: inboundQty,
          zoneId: inboundForm.zoneId || defaultInboundZoneId || undefined,
          unitPrice: Math.round(inboundPrice),
          totalAmount: inboundSubTotal,
        },
      ],
    })
    closeModal()
  }

  async function handleOutbound() {
    if (!outboundForm.inventoryItemId || outboundQty <= 0) return
    await createTransactionMutation.mutateAsync({
      type: 'OUTBOUND',
      projectId: outboundForm.projectId || undefined,
      transactionDate: outboundForm.transactionDate,
      remarks: `[${outboundForm.target}] ${outboundForm.remark}`,
      items: [
        {
          inventoryItemId: outboundForm.inventoryItemId,
          quantity: -Math.abs(outboundQty),
          unitPrice: Math.round(num(selectedOutboundMaterial?.averageCost ?? selectedOutboundMaterial?.unitPrice)),
          totalAmount: Math.round(Math.abs(outboundQty) * num(selectedOutboundMaterial?.averageCost ?? selectedOutboundMaterial?.unitPrice)),
        },
      ],
    })
    closeModal()
  }

  async function handleTransfer() {
    if (!transferForm.inventoryItemId || transferQty <= 0 || !transferForm.fromZoneId || !transferForm.toZoneId) return
    if (transferForm.fromZoneId === transferForm.toZoneId) return
    await createTransactionMutation.mutateAsync({
      type: 'TRANSFER',
      transactionDate: transferForm.transactionDate,
      remarks: transferForm.remark,
      items: [
        {
          inventoryItemId: transferForm.inventoryItemId,
          quantity: -Math.abs(transferQty),
          zoneId: transferForm.fromZoneId,
        },
        {
          inventoryItemId: transferForm.inventoryItemId,
          quantity: Math.abs(transferQty),
          zoneId: transferForm.toZoneId,
        },
      ],
    })
    closeModal()
  }

  return (
    <EnterpriseModulePage>
      <SectionHeader title="KHO VẬT TƯ" description="Quản lý tồn kho vật tư, thép tấm, thép hình, phụ kiện và vật tư tiêu hao" />
      <EnterpriseTabBar tabs={inventoryTabs} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5 xl:grid-cols-8">
        <RuntimePanel title="Tổng chủng loại"><div className="text-2xl font-black text-white">{summary.totalItems}</div></RuntimePanel>
        <RuntimePanel title="Giá trị tồn kho"><div className="text-2xl font-black text-cyan-300">{formatCurrencyVN(summary.value)}</div></RuntimePanel>
        <RuntimePanel title="Đang dự trữ"><div className="text-2xl font-black text-violet-300">{summary.totalQty.toLocaleString()}</div></RuntimePanel>
        <RuntimePanel title="Sắp hết hàng"><div className="text-2xl font-black text-amber-300">{summary.low}</div></RuntimePanel>
        <RuntimePanel title="Hết hàng"><div className="text-2xl font-black text-red-300">{summary.critical}</div></RuntimePanel>
      </div>

      <RuntimePanel title="Thao tác nhanh">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <button onClick={() => { resetInboundForm(); setActiveModal('inbound') }} className="rounded-xl border border-cyan-700 bg-zinc-900 px-3 py-3 text-cyan-300">Nhập kho</button>
          <button onClick={() => { resetOutboundForm(); setActiveModal('outbound') }} className="rounded-xl border border-emerald-700 bg-zinc-900 px-3 py-3 text-emerald-300">Xuất kho</button>
          <button onClick={() => { resetTransferForm(); setActiveModal('transfer') }} className="rounded-xl border border-violet-700 bg-zinc-900 px-3 py-3 text-violet-300">Điều chuyển</button>
          <button onClick={() => setActiveModal('stock-take')} className="rounded-xl border border-amber-700 bg-zinc-900 px-3 py-3 text-amber-300">Kiểm kê</button>
          <button onClick={() => { resetCreateMaterialForm(); setActiveModal('create-material') }} className="rounded-xl border border-blue-700 bg-zinc-900 px-3 py-3 text-blue-300">Thêm vật tư vào phiếu nhập</button>
        </div>
      </RuntimePanel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <RuntimePanel title="Tồn kho vật tư" className="xl:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-3">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã, tên, quy cách..." className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white" />
          </div>
          <div className="overflow-hidden rounded-2xl border border-zinc-800">
            <table className="w-full">
              <thead className="bg-zinc-950">
                <tr>
                  <th className="px-3 py-2 text-left text-xs text-zinc-500">Mã vật tư</th>
                  <th className="px-3 py-2 text-left text-xs text-zinc-500">Tên vật tư</th>
                  <th className="px-3 py-2 text-left text-xs text-zinc-500">Danh mục</th>
                  <th className="px-3 py-2 text-left text-xs text-zinc-500">ĐVT</th>
                  <th className="px-3 py-2 text-left text-xs text-zinc-500">Tồn khả dụng</th>
                  <th className="px-3 py-2 text-left text-xs text-zinc-500">Đơn giá gốc</th>
                  <th className="px-3 py-2 text-left text-xs text-zinc-500">Tổng giá trị</th>
                  <th className="px-3 py-2 text-left text-xs text-zinc-500">Vị trí</th>
                  <th className="px-3 py-2 text-left text-xs text-zinc-500">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.slice(0, 12).map((item: any) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer border-t border-zinc-800 hover:bg-zinc-900/50"
                    onClick={() => {
                      setSelectedMaterialId(item.id)
                      setMaterialDetailTab('overview')
                      setActiveModal('material-detail')
                    }}
                  >
                    <td className="px-3 py-2 text-cyan-300">{item.code}</td>
                    <td className="px-3 py-2 text-white">{item.name}</td>
                    <td className="px-3 py-2 text-zinc-300">{item.category ?? '-'}</td>
                    <td className="px-3 py-2 text-zinc-300">{item.unit}</td>
                    <td className="px-3 py-2 text-zinc-200">{formatNumberVN(item.quantity)}</td>
                    <td className="px-3 py-2 text-zinc-200">{formatCurrencyVN(item.baseUnitPrice ?? item.unitPrice ?? item.averageCost)}</td>
                    <td className="px-3 py-2 font-medium text-cyan-300">{formatCurrencyVN(item.inventoryValue ?? num(item.quantity) * num(item.averageCost ?? item.unitPrice))}</td>
                    <td className="px-3 py-2 text-zinc-300">{item.zoneName ?? item.location ?? defaultInboundZoneLabel}</td>
                    <td className="px-3 py-2">
                      <span className={item.status === 'CRITICAL' ? 'rounded-full bg-red-500/20 px-2 py-1 text-xs text-red-300' : item.status === 'LOW_STOCK' ? 'rounded-full bg-amber-500/20 px-2 py-1 text-xs text-amber-300' : 'rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300'}>
                        {item.status ?? 'NORMAL'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </RuntimePanel>

        <div className="space-y-6">
          <RuntimePanel title="Tổng quan tồn kho">
            <div className="space-y-2 text-sm text-zinc-300">
              <div className="flex justify-between"><span>Tổng số lượng</span><span className="text-cyan-300">{summary.totalQty.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Vật tư sắp hết</span><span className="text-amber-300">{summary.low}</span></div>
              <div className="flex justify-between"><span>Hết hàng</span><span className="text-red-300">{summary.critical}</span></div>
            </div>
          </RuntimePanel>
          <RuntimePanel title="Cảnh báo tồn kho">
            <div className="space-y-2 text-sm">
              {itemsWithAudit
                .filter((x: any) => x.status === 'LOW_STOCK' || x.status === 'CRITICAL')
                .slice(0, 8)
                .map((x: any) => (
                  <div key={x.id} className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2">
                    <span className="text-zinc-200">{x.code}</span>
                    <span className={x.status === 'CRITICAL' ? 'text-red-300' : 'text-amber-300'}>
                      {num(x.quantity)} {x.unit}
                    </span>
                  </div>
                ))}
            </div>
          </RuntimePanel>
        </div>
      </div>

      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">
                {activeModal === 'create-material' && 'Thêm vật tư mới'}
                {activeModal === 'inbound' && 'Nhập kho (Có VAT & Hóa đơn)'}
                {activeModal === 'outbound' && 'Xuất kho'}
                {activeModal === 'transfer' && 'Điều chuyển kho'}
                {activeModal === 'stock-take' && 'Kiểm kê nhanh'}
                {activeModal === 'material-detail' && 'Chi tiết vật tư'}
              </h3>
              <button onClick={closeModal} className="rounded-lg border border-zinc-700 px-3 py-2 text-zinc-300">Đóng</button>
            </div>

            {activeModal === 'create-material' && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input placeholder="Mã vật tư" value={createMaterialForm.code} onChange={(e) => setCreateMaterialForm((p) => ({ ...p, code: e.target.value }))} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white" />
                <input placeholder="Tên vật tư" value={createMaterialForm.name} onChange={(e) => setCreateMaterialForm((p) => ({ ...p, name: e.target.value }))} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white" />
                <select value={createMaterialForm.categoryId} onChange={(e) => setCreateMaterialForm((p) => ({ ...p, categoryId: e.target.value }))} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white">
                  <option value="">Danh mục</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={createMaterialForm.unit} onChange={(e) => setCreateMaterialForm((p) => ({ ...p, unit: e.target.value }))} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white">
                  <option value="">Đơn vị tính</option>
                  {units.map((u: any) => <option key={u.id} value={u.code}>{u.code}</option>)}
                </select>
                <input type="text" inputMode="decimal" placeholder="Số lượng nhập đầu" value={createMaterialForm.firstInboundQty} onChange={(e) => setCreateMaterialForm((p) => ({ ...p, firstInboundQty: formatDecimalInputRealtime(e.target.value) }))} onBlur={(e) => setCreateMaterialForm((p) => ({ ...p, firstInboundQty: formatInputNumberVN(e.target.value, false) }))} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white" />
                <input type="text" inputMode="numeric" placeholder="Đơn giá" value={createMaterialForm.unitPrice} onChange={(e) => setCreateMaterialForm((p) => ({ ...p, unitPrice: formatMoneyInputRealtime(e.target.value) }))} onBlur={(e) => setCreateMaterialForm((p) => ({ ...p, unitPrice: formatInputNumberVN(e.target.value, true) }))} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white" />
                <input type="number" placeholder="Ngưỡng cảnh báo tồn" value={createMaterialForm.minimumStock} onChange={(e) => setCreateMaterialForm((p) => ({ ...p, minimumStock: e.target.value }))} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white" />
                <textarea placeholder="Ghi chú" value={createMaterialForm.note} onChange={(e) => setCreateMaterialForm((p) => ({ ...p, note: e.target.value }))} rows={3} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white md:col-span-2" />
                <div className="md:col-span-2 flex justify-end gap-2">
                  <button onClick={closeModal} className="rounded-lg border border-zinc-700 px-4 py-2 text-zinc-300">Hủy</button>
                  <button onClick={handleCreateMaterial} className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-black">Lưu vật tư</button>
                </div>
              </div>
            )}

            {activeModal === 'inbound' && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="md:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-lg border border-cyan-700 bg-cyan-900/20 px-3 py-2 text-cyan-300">1. Thông tin nhập</div>
                    <div className="rounded-lg border border-zinc-700 px-3 py-2 text-zinc-300">2. Chọn vật tư & khu vực</div>
                    <div className="rounded-lg border border-zinc-700 px-3 py-2 text-zinc-300">3. Xác nhận & lưu</div>
                  </div>
                </div>
                <input type="datetime-local" value={inboundForm.transactionDate} onChange={(e) => setInboundForm((p) => ({ ...p, transactionDate: e.target.value }))} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white" />
                <select value={inboundForm.supplierId} onChange={(e) => setInboundForm((p) => ({ ...p, supplierId: e.target.value }))} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white">
                  <option value="">Nhà cung cấp</option>
                  {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select value={inboundForm.inventoryItemId} onChange={(e) => setInboundForm((p) => ({ ...p, inventoryItemId: e.target.value }))} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white">
                  <option value="">Vật tư</option>
                  {itemsWithAudit.map((i: any) => <option key={i.id} value={i.id}>{i.code} - {i.name}</option>)}
                </select>
                <input type="text" inputMode="decimal" placeholder="Số lượng" value={inboundForm.quantity} onChange={(e) => setInboundForm((p) => ({ ...p, quantity: formatDecimalInputRealtime(e.target.value) }))} onBlur={(e) => setInboundForm((p) => ({ ...p, quantity: formatInputNumberVN(e.target.value, false) }))} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white" />
                <input type="text" inputMode="numeric" placeholder="Đơn giá nhập" value={inboundForm.unitPrice} onChange={(e) => setInboundForm((p) => ({ ...p, unitPrice: formatMoneyInputRealtime(e.target.value) }))} onBlur={(e) => setInboundForm((p) => ({ ...p, unitPrice: formatInputNumberVN(e.target.value, true) }))} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white" />
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-300">
                  Vị trí mặc định lần nhập đầu: <span className="font-medium text-cyan-300">{defaultInboundZoneLabel}</span>
                </div>
                <select value={inboundForm.zoneId} onChange={(e) => setInboundForm((p) => ({ ...p, zoneId: e.target.value }))} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white">
                  <option value="">Khu vực nhập (sau nhập)</option>
                  {zones.map((z: any) => <option key={z.id} value={z.id}>{z.code} - {z.name}</option>)}
                </select>
                <input type="number" placeholder="Thuế VAT (%)" value={inboundForm.vat} onChange={(e) => setInboundForm((p) => ({ ...p, vat: e.target.value }))} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white" />
                <div className="md:col-span-2 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <RuntimePanel title="Tồn hiện tại"><div className="text-white">{formatNumberVN(inboundCurrentStock)}</div></RuntimePanel>
                  <RuntimePanel title="Sau nhập"><div className="text-cyan-300">{formatNumberVN(inboundAfterStock)}</div></RuntimePanel>
                  <RuntimePanel title="Đơn giá TB mới"><div className="text-emerald-300">{formatCurrencyVN(inboundAvgCost)}</div></RuntimePanel>
                  <RuntimePanel title="Giá nhập gần nhất"><div className="text-zinc-200">{formatCurrencyVN(selectedInboundMaterial?.unitPrice ?? selectedInboundMaterial?.averageCost)}</div></RuntimePanel>
                </div>
                <div className="md:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-200">
                  <div>Thành tiền trước VAT: <span className="text-cyan-300">{formatCurrencyVN(inboundSubTotal)}</span></div>
                  <div>Tiền VAT: <span className="text-amber-300">{formatCurrencyVN(inboundVatAmount)}</span></div>
                  <div className="text-xl font-bold">Tổng thanh toán: <span className="text-white">{formatCurrencyVN(inboundGrandTotal)}</span></div>
                </div>
                <input type="file" className="md:col-span-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-300" />
                <textarea placeholder="Ghi chú" value={inboundForm.remark} onChange={(e) => setInboundForm((p) => ({ ...p, remark: e.target.value }))} rows={3} className="md:col-span-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white" />
                <div className="md:col-span-2 flex justify-end gap-2">
                  <button onClick={closeModal} className="rounded-lg border border-zinc-700 px-4 py-2 text-zinc-300">Hủy</button>
                  <button onClick={handleInbound} className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-black">Xác nhận nhập kho</button>
                </div>
              </div>
            )}

            {activeModal === 'outbound' && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="md:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-lg border border-cyan-700 bg-cyan-900/20 px-3 py-2 text-cyan-300">1. Đối tượng xuất</div>
                    <div className="rounded-lg border border-zinc-700 px-3 py-2 text-zinc-300">2. Chọn vật tư & số lượng</div>
                    <div className="rounded-lg border border-zinc-700 px-3 py-2 text-zinc-300">3. Xác nhận xuất</div>
                  </div>
                </div>
                <input type="datetime-local" value={outboundForm.transactionDate} onChange={(e) => setOutboundForm((p) => ({ ...p, transactionDate: e.target.value }))} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white" />
                <select value={outboundForm.projectId} onChange={(e) => setOutboundForm((p) => ({ ...p, projectId: e.target.value }))} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white">
                  <option value="">Công trình / Bộ phận</option>
                  {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select value={outboundForm.target} onChange={(e) => setOutboundForm((p) => ({ ...p, target: e.target.value }))} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white">
                  <option value="PROJECT">Xuất công trình</option>
                  <option value="COMPONENT_PRODUCTION">Xuất sản xuất cấu kiện</option>
                </select>
                <select value={outboundForm.inventoryItemId} onChange={(e) => setOutboundForm((p) => ({ ...p, inventoryItemId: e.target.value }))} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white">
                  <option value="">Vật tư</option>
                  {itemsWithAudit.map((i: any) => <option key={i.id} value={i.id}>{i.code} - {i.name}</option>)}
                </select>
                <input type="text" inputMode="decimal" placeholder="Số lượng xuất" value={outboundForm.quantity} onChange={(e) => setOutboundForm((p) => ({ ...p, quantity: formatDecimalInputRealtime(e.target.value) }))} onBlur={(e) => setOutboundForm((p) => ({ ...p, quantity: formatInputNumberVN(e.target.value, false) }))} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white" />
                <div />
                <RuntimePanel title="Tồn hiện tại"><div className="text-white">{formatNumberVN(outboundCurrentStock)}</div></RuntimePanel>
                <RuntimePanel title="Tồn sau xuất"><div className={outboundAfterStock < 0 ? 'text-red-300' : 'text-cyan-300'}>{formatNumberVN(outboundAfterStock)}</div></RuntimePanel>
                <input type="file" className="md:col-span-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-300" />
                <textarea placeholder="Ghi chú" value={outboundForm.remark} onChange={(e) => setOutboundForm((p) => ({ ...p, remark: e.target.value }))} rows={3} className="md:col-span-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white" />
                <div className="md:col-span-2 flex justify-end gap-2">
                  <button onClick={closeModal} className="rounded-lg border border-zinc-700 px-4 py-2 text-zinc-300">Hủy</button>
                  <button onClick={handleOutbound} className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-black">Xác nhận xuất kho</button>
                </div>
              </div>
            )}

            {activeModal === 'transfer' && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="md:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-lg border border-cyan-700 bg-cyan-900/20 px-3 py-2 text-cyan-300">1. Chọn nguồn/đích</div>
                    <div className="rounded-lg border border-zinc-700 px-3 py-2 text-zinc-300">2. Số lượng & tuyến</div>
                    <div className="rounded-lg border border-zinc-700 px-3 py-2 text-zinc-300">3. Xác nhận điều chuyển</div>
                  </div>
                </div>
                <input type="datetime-local" value={transferForm.transactionDate} onChange={(e) => setTransferForm((p) => ({ ...p, transactionDate: e.target.value }))} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white" />
                <select value={transferForm.inventoryItemId} onChange={(e) => setTransferForm((p) => ({ ...p, inventoryItemId: e.target.value }))} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white">
                  <option value="">Vật tư</option>
                  {itemsWithAudit.map((i: any) => <option key={i.id} value={i.id}>{i.code} - {i.name}</option>)}
                </select>
                <select value={transferForm.fromZoneId} onChange={(e) => setTransferForm((p) => ({ ...p, fromZoneId: e.target.value }))} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white">
                  <option value="">Từ khu vực</option>
                  {zones.map((z: any) => <option key={z.id} value={z.id}>{z.code} - {z.name}</option>)}
                </select>
                <select value={transferForm.toZoneId} onChange={(e) => setTransferForm((p) => ({ ...p, toZoneId: e.target.value }))} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white">
                  <option value="">Đến khu vực</option>
                  {zones.map((z: any) => <option key={z.id} value={z.id}>{z.code} - {z.name}</option>)}
                </select>
                <input type="text" inputMode="decimal" placeholder="Số lượng điều chuyển" value={transferForm.quantity} onChange={(e) => setTransferForm((p) => ({ ...p, quantity: formatDecimalInputRealtime(e.target.value) }))} onBlur={(e) => setTransferForm((p) => ({ ...p, quantity: formatInputNumberVN(e.target.value, false) }))} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white" />
                <input type="file" className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-300" />
                <RuntimePanel title="Tồn hiện tại"><div className="text-white">{formatNumberVN(transferCurrentStock)}</div></RuntimePanel>
                <RuntimePanel title="Sau điều chuyển"><div className={transferAfterStock < 0 ? 'text-red-300' : 'text-cyan-300'}>{formatNumberVN(transferAfterStock)}</div></RuntimePanel>
                <textarea placeholder="Lý do điều chuyển" value={transferForm.remark} onChange={(e) => setTransferForm((p) => ({ ...p, remark: e.target.value }))} rows={3} className="md:col-span-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white" />
                <div className="md:col-span-2 flex justify-end gap-2">
                  <button onClick={closeModal} className="rounded-lg border border-zinc-700 px-4 py-2 text-zinc-300">Hủy</button>
                  <button onClick={handleTransfer} className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-black">Xác nhận điều chuyển</button>
                </div>
              </div>
            )}
            {activeModal === 'stock-take' && <div className="text-zinc-300">Dùng tab Kiểm kê để thao tác phiên kiểm kê chi tiết.</div>}

            {activeModal === 'material-detail' && selectedMaterialDetail && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
                <RuntimePanel title="Danh mục chi tiết">
                  <div className="space-y-2 text-sm text-zinc-300">
                    {[
                      ['overview', 'Tổng quan'],
                      ['inout', 'Nhập / Xuất'],
                      ['projects', 'Công trình'],
                      ['suppliers', 'Nhà cung cấp'],
                      ['locations', 'Vị trí'],
                      ['analytics', 'Phân tích'],
                      ['files', 'File đính kèm'],
                      ['logs', 'Lịch sử thay đổi'],
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setMaterialDetailTab(key as any)}
                        className={`w-full rounded-lg border px-3 py-2 text-left ${
                          materialDetailTab === key
                            ? 'border-cyan-700 bg-cyan-900/20 text-cyan-300'
                            : 'border-zinc-800'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </RuntimePanel>
                <div className="space-y-4">
                  <RuntimePanel title={`${selectedMaterialDetail.item?.code} - ${selectedMaterialDetail.item?.name}`}>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <RuntimePanel title="Số lượng hiện tại"><div className="text-white">{num(selectedMaterialDetail.currentStock).toLocaleString()} {selectedMaterialDetail.item?.unit}</div></RuntimePanel>
                      <RuntimePanel title="Lần nhập"><div className="text-cyan-300">{(selectedMaterialDetail.inboundHistory ?? []).length}</div></RuntimePanel>
                      <RuntimePanel title="Lần xuất"><div className="text-amber-300">{(selectedMaterialDetail.outboundHistory ?? []).length}</div></RuntimePanel>
                      <RuntimePanel title="Giá TB"><div className="text-emerald-300">{num(selectedMaterialDetail.averageCost).toLocaleString()}</div></RuntimePanel>
                    </div>
                  </RuntimePanel>
                  {materialDetailTab === 'overview' && (
                    <RuntimePanel title="Tổng quan vật tư">
                      <div className="mb-3 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-1 text-xs ${
                          num(selectedMaterialDetail.currentStock) <= num(selectedMaterialDetail.item?.minimumStock)
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {num(selectedMaterialDetail.currentStock) <= num(selectedMaterialDetail.item?.minimumStock) ? 'Sắp thiếu' : 'Tốt'}
                        </span>
                        <span className="rounded-full bg-cyan-500/20 px-2 py-1 text-xs text-cyan-300">
                          Đơn giá gốc: {num(selectedMaterialDetail.item?.unitPrice).toLocaleString()}
                        </span>
                      </div>
                      <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                        <div className="mb-2 text-xs text-zinc-400">Mini Stock Trend</div>
                        <div className="grid grid-cols-12 gap-1">
                          {Array.from({ length: 12 }).map((_, i) => {
                            const h = 20 + ((i * 13) % 65)
                            return <div key={i} className="rounded bg-cyan-500/60" style={{ height: `${h}px` }} />
                          })}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <RuntimePanel title="Dự báo"><div className="text-zinc-300">{num(selectedMaterialDetail.currentStock) <= num(selectedMaterialDetail.item?.minimumStock) ? 'Cần bổ sung' : 'Ổn định'}</div></RuntimePanel>
                        <RuntimePanel title="NCC gần nhất"><div className="text-zinc-300">{selectedMaterialDetail.supplierHistory?.[0]?.supplierName ?? '-'}</div></RuntimePanel>
                        <RuntimePanel title="Tốc độ luân chuyển"><div className="text-zinc-300">{(selectedMaterialDetail.outboundHistory ?? []).length}/tháng</div></RuntimePanel>
                      </div>
                    </RuntimePanel>
                  )}

                  {materialDetailTab === 'inout' && (
                    <RuntimePanel title="Lịch sử Nhập / Xuất">
                      <div className="overflow-hidden rounded-xl border border-zinc-800">
                        <table className="w-full text-sm">
                          <thead className="bg-zinc-900 text-zinc-400">
                            <tr>
                              <th className="px-3 py-2 text-left">Thời gian</th>
                              <th className="px-3 py-2 text-left">Loại</th>
                              <th className="px-3 py-2 text-left">Đối tượng</th>
                              <th className="px-3 py-2 text-left">Số lượng</th>
                              <th className="px-3 py-2 text-left">Đơn giá</th>
                              <th className="px-3 py-2 text-left">Thành tiền</th>
                              <th className="px-3 py-2 text-left">File đính kèm</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              ...(selectedMaterialDetail.inboundHistory ?? []).map((x: any) => ({ ...x, rowType: 'INBOUND' })),
                              ...(selectedMaterialDetail.outboundHistory ?? []).map((x: any) => ({ ...x, rowType: 'OUTBOUND' })),
                            ]
                              .sort((a: any, b: any) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
                              .slice(0, 16)
                              .map((x: any, i: number) => (
                                <tr key={`${x.transactionId}-${i}`} className="border-t border-zinc-800">
                                  <td className="px-3 py-2 text-zinc-300">{new Date(x.transactionDate).toLocaleString()}</td>
                                  <td className={`px-3 py-2 ${x.rowType === 'INBOUND' ? 'text-cyan-300' : 'text-amber-300'}`}>{x.rowType === 'INBOUND' ? 'Nhập kho' : 'Xuất kho'}</td>
                                  <td className="px-3 py-2 text-zinc-300">{x.supplierName ?? x.projectName ?? x.target ?? x.transactionNo ?? '-'}</td>
                                <td className="px-3 py-2 text-white">{formatNumberVN(x.quantity)}</td>
                                <td className="px-3 py-2 text-zinc-200">{formatCurrencyVN(x.unitPrice ?? selectedMaterialDetail.averageCost)}</td>
                                <td className="px-3 py-2 text-cyan-300">{formatCurrencyVN(x.totalAmount ?? x.amount ?? x.value ?? num(x.quantity) * num(x.unitPrice ?? selectedMaterialDetail.averageCost))}</td>
                                  <td className="px-3 py-2 text-zinc-400">{x.attachmentName ?? '—'}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </RuntimePanel>
                  )}

                  {materialDetailTab === 'projects' && (
                    <RuntimePanel title="Tiêu hao theo công trình">
                      <div className="overflow-hidden rounded-xl border border-zinc-800">
                        <table className="w-full text-sm">
                          <thead className="bg-zinc-900 text-zinc-400">
                            <tr>
                              <th className="px-3 py-2 text-left">Tên công trình</th>
                              <th className="px-3 py-2 text-left">Đã xuất</th>
                              <th className="px-3 py-2 text-left">Đã trả</th>
                              <th className="px-3 py-2 text-left">Giá trị xuất</th>
                              <th className="px-3 py-2 text-left">File đính kèm</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(selectedMaterialDetail.projectConsumptionHistory ?? []).slice(0, 12).map((x: any, i: number) => (
                              <tr key={`${x.projectName}-${i}`} className="border-t border-zinc-800">
                                <td className="px-3 py-2 text-zinc-300">{x.projectName ?? 'Không rõ'}</td>
                                <td className="px-3 py-2 text-amber-300">{num(x.issuedQty ?? x.quantity).toLocaleString()}</td>
                                <td className="px-3 py-2 text-emerald-300">{num(x.returnedQty).toLocaleString()}</td>
                                <td className="px-3 py-2 text-cyan-300">{num(x.issuedValue ?? num(x.quantity) * num(selectedMaterialDetail.averageCost)).toLocaleString()}</td>
                                <td className="px-3 py-2 text-zinc-400">{x.attachmentName ?? '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </RuntimePanel>
                  )}

                  {materialDetailTab === 'suppliers' && (
                    <RuntimePanel title="Lịch sử nhà cung cấp">
                      <div className="overflow-hidden rounded-xl border border-zinc-800">
                        <table className="w-full text-sm">
                          <thead className="bg-zinc-900 text-zinc-400">
                            <tr>
                              <th className="px-3 py-2 text-left">Tên nhà cung cấp</th>
                              <th className="px-3 py-2 text-left">Số lượng nhập</th>
                              <th className="px-3 py-2 text-left">Tổng nhập</th>
                              <th className="px-3 py-2 text-left">Giá trị nhập gần nhất</th>
                              <th className="px-3 py-2 text-left">Tổng giá trị</th>
                              <th className="px-3 py-2 text-left">File đính kèm</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(selectedMaterialDetail.supplierHistory ?? []).slice(0, 12).map((x: any, i: number) => (
                              <tr key={`${x.supplierName}-${i}`} className="border-t border-zinc-800">
                                <td className="px-3 py-2 text-zinc-300">{x.supplierName ?? 'Không rõ'}</td>
                                <td className="px-3 py-2 text-white">{num(x.quantity).toLocaleString()}</td>
                                <td className="px-3 py-2 text-cyan-300">{num(x.totalInboundQty ?? x.quantity).toLocaleString()}</td>
                                <td className="px-3 py-2 text-amber-300">{num(x.latestInboundValue ?? x.totalAmount).toLocaleString()}</td>
                                <td className="px-3 py-2 text-emerald-300">{num(x.totalValue ?? x.totalAmount ?? num(x.quantity) * num(x.unitPrice ?? selectedMaterialDetail.averageCost)).toLocaleString()}</td>
                                <td className="px-3 py-2 text-zinc-400">{x.attachmentName ?? '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </RuntimePanel>
                  )}

                  {materialDetailTab === 'locations' && (
                    <RuntimePanel title="Vị trí đặt vật tư">
                      <div className="overflow-hidden rounded-xl border border-zinc-800">
                        <table className="w-full text-sm">
                          <thead className="bg-zinc-900 text-zinc-400">
                            <tr>
                              <th className="px-3 py-2 text-left">Kho</th>
                              <th className="px-3 py-2 text-left">Khu vực</th>
                              <th className="px-3 py-2 text-left">Vị trí</th>
                              <th className="px-3 py-2 text-left">Số lượng</th>
                              <th className="px-3 py-2 text-left">Cập nhật</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const byZone = new Map<string, { zoneName: string; qty: number; updatedAt?: string }>()
                              const rows = [
                                ...(selectedMaterialDetail.inboundHistory ?? []),
                                ...(selectedMaterialDetail.outboundHistory ?? []),
                              ]
                              rows.forEach((r: any) => {
                                const zoneName = r.zone?.name ?? r.zoneName ?? r.location ?? defaultInboundZoneLabel
                                const key = String(zoneName)
                                const prev = byZone.get(key) ?? { zoneName, qty: 0, updatedAt: r.transactionDate }
                                prev.qty += num(r.quantity)
                                if (!prev.updatedAt || new Date(r.transactionDate).getTime() > new Date(prev.updatedAt).getTime()) {
                                  prev.updatedAt = r.transactionDate
                                }
                                byZone.set(key, prev)
                              })
                              const list = Array.from(byZone.values()).filter((x) => x.qty > 0)
                              if (list.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={5} className="px-3 py-6 text-center text-zinc-500">Chưa có dữ liệu vị trí chi tiết.</td>
                                  </tr>
                                )
                              }
                              return list.map((row, i) => (
                                <tr key={`${row.zoneName}-${i}`} className="border-t border-zinc-800">
                                  <td className="px-3 py-2 text-zinc-300">Kho chính</td>
                                  <td className="px-3 py-2 text-cyan-300">{row.zoneName}</td>
                                  <td className="px-3 py-2 text-zinc-300">{row.zoneName}</td>
                                  <td className="px-3 py-2 text-white">{formatNumberVN(row.qty)}</td>
                                  <td className="px-3 py-2 text-zinc-400">{row.updatedAt ? new Date(row.updatedAt).toLocaleString('vi-VN') : '-'}</td>
                                </tr>
                              ))
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </RuntimePanel>
                  )}

                  {materialDetailTab === 'analytics' && (
                    <RuntimePanel title="Phân tích">
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <RuntimePanel title="Giá trị tồn"><div className="text-emerald-300">{(num(selectedMaterialDetail.currentStock) * num(selectedMaterialDetail.averageCost)).toLocaleString()}</div></RuntimePanel>
                        <RuntimePanel title="Giá TB"><div className="text-cyan-300">{num(selectedMaterialDetail.averageCost).toLocaleString()}</div></RuntimePanel>
                        <RuntimePanel title="Tần suất nhập"><div className="text-zinc-300">{(selectedMaterialDetail.inboundHistory ?? []).length}</div></RuntimePanel>
                        <RuntimePanel title="Tần suất xuất"><div className="text-zinc-300">{(selectedMaterialDetail.outboundHistory ?? []).length}</div></RuntimePanel>
                      </div>
                    </RuntimePanel>
                  )}

                  {materialDetailTab === 'files' && (
                    <RuntimePanel title="File đính kèm">
                      <div className="text-zinc-400">Chưa có file đính kèm.</div>
                    </RuntimePanel>
                  )}

                  {materialDetailTab === 'logs' && (
                    <RuntimePanel title="Lịch sử thay đổi">
                      <div className="space-y-2 text-sm">
                        {(selectedMaterialDetail.inboundHistory ?? []).slice(0, 4).map((x: any, i: number) => (
                          <div key={`log-in-${i}`} className="rounded-lg border border-zinc-800 p-2 text-zinc-300">
                            Nhập kho {x.transactionNo} - {new Date(x.transactionDate).toLocaleString()}
                          </div>
                        ))}
                        {(selectedMaterialDetail.outboundHistory ?? []).slice(0, 4).map((x: any, i: number) => (
                          <div key={`log-out-${i}`} className="rounded-lg border border-zinc-800 p-2 text-zinc-300">
                            Xuất kho {x.transactionNo} - {new Date(x.transactionDate).toLocaleString()}
                          </div>
                        ))}
                      </div>
                    </RuntimePanel>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </EnterpriseModulePage>
  )
}
