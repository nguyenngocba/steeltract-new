import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, Layers, Package, Wrench } from 'lucide-react'

import { EnterpriseModulePage } from '@/shared/runtime-tabs/EnterpriseModulePage'
import { EnterpriseKpiCard } from '../../../../shared/ui/cockpit'
import { ModuleDetailDrawer, ModuleEmptyState, ModuleLoadingState } from '../../../../shared/ui/modules'
import {
  InventoryChartCard,
  InventoryPagination,
  InventoryPanel,
  inventoryTableHead,
  inventoryTableRow,
} from '../../../inventory/components/InventoryVisuals'
import { useCreateTransaction } from '../../../inventory/hooks/useCreateTransaction'
import { useInventoryAudit } from '../../../inventory/hooks/useInventoryAudit'
import { useInventoryItems } from '../../../inventory/hooks/useInventoryItems'
import { useInventoryTransactions } from '../../../inventory/hooks/useInventoryTransactions'
import { useProductionIssues } from '../../../production/hooks/useProductionCockpit'
import { componentsInput, componentsMutedButton, componentsPrimaryButton } from './ComponentsCockpitShared'
import { formatLocalDateTimeInput } from '@/shared/utils/date-time'
import { formatCurrencyVnd, formatDateTime, formatQuantity, formatQuantityInput, parseLocaleNumber } from '@/shared/utils/number-format'

type MaterialStockRow = {
  id: string
  inventoryItemId: string
  code: string
  name: string
  materialUsageType: string
  unit: string
  warehouseId?: string
  zoneId?: string
  slotId?: string
  returnWarehouseId?: string
  returnZoneId?: string
  warehouse: string
  location: string
  currentStock: number
  reserved: number
  available: number
  averageCost: number
  inventoryValue: number
  status: 'Sẵn sàng' | 'Cảnh báo' | 'Thiếu'
}

type ProductionStockBucket = {
  inventoryItemId: string
  warehouseId?: string
  zoneId?: string
  slotId?: string
  warehouse?: string
  location?: string
  quantity: number
}

const money = (value: number) => formatCurrencyVnd(value)

function materialUsageLabel(value: string | undefined) {
  const map: Record<string, string> = {
    PRIMARY: 'Vật tư chính',
    SECONDARY: 'Vật tư phụ',
    CONSUMABLE: 'Vật tư tiêu hao',
  }
  return map[String(value ?? 'PRIMARY')] ?? 'Vật tư chính'
}

function productionLocationLabel(line: any, transaction: any) {
  const zone = line.zone ?? transaction.zone
  const slot = String(line.slotId ?? '').trim()
  const zoneLabel = zone
    ? `${zone.code ?? 'ZONE'} - ${zone.name ?? 'Vị trí'}`
    : 'Vị trí SX chưa gán'
  return slot ? `${zoneLabel} / ${slot}` : zoneLabel
}

function isProductionWarehouseLine(line: any, transaction: any) {
  const warehouseCode = String(line.warehouse?.code ?? transaction.warehouse?.code ?? '').toUpperCase()
  const warehouseName = String(line.warehouse?.name ?? transaction.warehouse?.name ?? '').toLowerCase()
  return warehouseCode === 'PRODUCTION' || warehouseName.includes('sản xuất')
}

function productionBucketKey(inventoryItemId: string, zoneId?: string | null, slotId?: string | null) {
  return `${inventoryItemId}:${zoneId ?? 'NO_ZONE'}:${String(slotId ?? '').trim() || 'NO_SLOT'}`
}

export function ComponentsMaterialStockPage() {
  const { data: inventoryItems = [], isLoading } = useInventoryItems()
  const { data: auditRows = [] } = useInventoryAudit()
  const { data: materialIssues = [] } = useProductionIssues()
  const { data: transactionsData = [], isLoading: isTransactionsLoading } = useInventoryTransactions({})
  const createTransaction = useCreateTransaction()
  const [query, setQuery] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selectedRow, setSelectedRow] = useState<MaterialStockRow | null>(null)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
  const [returnForm, setReturnForm] = useState({ returnedAt: formatLocalDateTimeInput(), quantity: '', note: '' })

  function applySearch() {
    setQuery(searchDraft)
    setPage(1)
  }

  function resetFilters() {
    setSearchDraft('')
    setQuery('')
    setStatus('')
    setPage(1)
  }

  useEffect(() => {
    if (!selectedRow) return
    setReturnForm((prev) => ({
      ...prev,
      quantity: '',
      note: '',
      returnedAt: formatLocalDateTimeInput(),
    }))
  }, [selectedRow])

  const rows = useMemo<MaterialStockRow[]>(() => {
    const auditById = new Map(
      (auditRows as any[]).map((row) => [String(row.materialId ?? row.inventoryItemId), row]),
    )
    const itemById = new Map((inventoryItems as any[]).map((item) => [String(item.id), item]))
    const buckets = new Map<string, ProductionStockBucket>()
    const issueByItem = new Map<string, number>()
    const transactionRows = Array.isArray(transactionsData)
      ? transactionsData
      : (transactionsData as any)?.data ?? []

    ;(materialIssues as any[]).forEach((issue) => {
      const key = String(issue.inventoryItemId)
      if (!key || issue.status !== 'ISSUED') return
      issueByItem.set(key, (issueByItem.get(key) ?? 0) + Number(issue.issuedQty ?? 0))
    })

    ;(transactionRows as any[]).forEach((transaction) => {
      const remarks = String(transaction.remarks ?? transaction.note ?? '')
      const isProductionReceipt = remarks.includes('[COMPONENT_PRODUCTION]')
      const isReturnToMain = remarks.includes('[COMPONENT_PRODUCTION_RETURN]')
      if (!isProductionReceipt && !isReturnToMain) return

      ;(transaction.items ?? []).forEach((line: any) => {
        const key = String(line.inventoryItemId ?? line.inventoryItem?.id ?? '')
        const rawQty = Number(line.quantity ?? 0)
        if (!key || !Number.isFinite(rawQty) || rawQty === 0) return
        if (!isProductionWarehouseLine(line, transaction)) return
        if (isProductionReceipt && !isReturnToMain && rawQty <= 0) return
        if (isReturnToMain && rawQty >= 0) return

        const zoneId = line.zoneId ?? transaction.zoneId
        const slotId = String(line.slotId ?? '').trim()
        const bucketKey = productionBucketKey(key, zoneId, slotId)
        const current = buckets.get(bucketKey) ?? {
          inventoryItemId: key,
          warehouseId: line.warehouseId ?? transaction.warehouseId,
          zoneId,
          slotId,
          warehouse: line.warehouse?.name ?? transaction.warehouse?.name,
          location: productionLocationLabel(line, transaction),
          quantity: 0,
        }
        current.quantity += rawQty
        buckets.set(bucketKey, current)
      })
    })

    issueByItem.forEach((issuedQty, inventoryItemId) => {
      let remaining = Math.max(0, issuedQty)
      const itemBuckets = Array.from(buckets.values())
        .filter((bucket) => bucket.inventoryItemId === inventoryItemId && bucket.quantity > 0)
        .sort((a, b) => `${a.zoneId ?? ''}${a.slotId ?? ''}`.localeCompare(`${b.zoneId ?? ''}${b.slotId ?? ''}`))

      for (const bucket of itemBuckets) {
        if (remaining <= 0) break
        const deducted = Math.min(bucket.quantity, remaining)
        bucket.quantity -= deducted
        remaining -= deducted
      }

      if (remaining > 0 && !itemBuckets.length) {
        buckets.set(productionBucketKey(inventoryItemId), {
          inventoryItemId,
          quantity: -remaining,
          warehouse: 'Kho vật tư SX',
          location: 'Chưa xác định vị trí SX',
        })
      }
    })

    return Array.from(buckets.values()).flatMap((bucket) => {
      const inventoryItemId = bucket.inventoryItemId
      const item = itemById.get(inventoryItemId) ?? (materialIssues as any[]).find((issue) => String(issue.inventoryItemId) === inventoryItemId)?.inventoryItem
      if (!item) return []
      const audit = auditById.get(String(item.id))
      const currentStock = Number(bucket.quantity)
      const minimumStock = Number(item.minimumStock ?? 0)
      const averageCost = Number(audit?.averageCost ?? item.unitPrice ?? 0)
      const reserved = 0
      const available = Math.max(currentStock - reserved, 0)

      return {
        id: item.id,
        inventoryItemId: item.id,
        code: item.code,
        name: item.name,
        materialUsageType: item.materialUsageType ?? 'PRIMARY',
        unit: item.unitMaster?.symbol ?? item.unit ?? '-',
        warehouseId: bucket.warehouseId,
        zoneId: bucket.zoneId,
        slotId: bucket.slotId,
        returnWarehouseId: item.zone?.warehouse?.code === 'MAIN' ? item.zone.warehouse.id : undefined,
        returnZoneId: item.zone?.warehouse?.code === 'MAIN' ? item.zone.id : undefined,
        warehouse: bucket.warehouse ?? 'Kho vật tư SX',
        location: bucket.location ?? 'Chưa xác định vị trí SX',
        currentStock,
        reserved,
        available,
        averageCost,
        inventoryValue: currentStock * averageCost,
        status:
          available <= 0
            ? 'Thiếu'
            : minimumStock > 0 && available <= minimumStock
              ? 'Cảnh báo'
              : 'Sẵn sàng',
      }
    })
  }, [auditRows, inventoryItems, materialIssues, transactionsData])

  const filtered = rows.filter((row) => {
    if (status && row.status !== status) return false
    if (query && !`${row.code} ${row.name}`.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })
  const totalValue = rows.reduce((sum, row) => sum + row.inventoryValue, 0)
  const totalAvailable = rows.reduce((sum, row) => sum + row.available, 0)
  const warningCount = rows.filter((row) => row.status !== 'Sẵn sàng').length
  const topMaterials = [...rows].sort((a, b) => b.available - a.available).slice(0, 5)
  const pageSize = 14
  const paginatedRows = filtered.slice((page - 1) * pageSize, page * pageSize)
  const recentProductionTransactions = useMemo(() => {
    const transactionRows = Array.isArray(transactionsData)
      ? transactionsData
      : (transactionsData as any)?.data ?? []
    return (transactionRows as any[])
      .filter((transaction) => String(transaction.remarks ?? transaction.note ?? '').includes('COMPONENT_PRODUCTION'))
      .slice(0, 5)
  }, [transactionsData])

  const selectedHistory = useMemo(() => {
    if (!selectedRow) return []
    const transactionRows = Array.isArray(transactionsData)
      ? transactionsData
      : (transactionsData as any)?.data ?? []
    return (transactionRows as any[])
      .filter((transaction) => String(transaction.remarks ?? transaction.note ?? '').includes('COMPONENT_PRODUCTION'))
      .flatMap((transaction) => (transaction.items ?? [])
        .filter((line: any) => String(line.inventoryItemId ?? line.inventoryItem?.id ?? '') === selectedRow.inventoryItemId)
        .map((line: any) => ({ transaction, line })))
  }, [selectedRow, transactionsData])

  async function returnToMainWarehouse(row: MaterialStockRow) {
    const quantity = parseLocaleNumber(returnForm.quantity)
    if (!quantity || quantity <= 0 || quantity > row.available || !row.zoneId) return

    await createTransaction.mutateAsync({
      type: 'RETURN',
      transactionDate: returnForm.returnedAt,
      remarks: `[COMPONENT_PRODUCTION_RETURN] ${returnForm.note || `Trả ${row.code} từ kho vật tư SX về kho chính`}`,
      items: [
        {
          inventoryItemId: row.inventoryItemId,
          quantity: -Math.abs(quantity),
          warehouseId: row.warehouseId,
          zoneId: row.zoneId,
          slotId: row.slotId,
          unitPrice: row.averageCost,
          totalAmount: -Math.abs(quantity) * row.averageCost,
        },
        {
          inventoryItemId: row.inventoryItemId,
          quantity: Math.abs(quantity),
          warehouseId: row.returnWarehouseId,
          zoneId: row.returnZoneId,
          unitPrice: row.averageCost,
          totalAmount: Math.abs(quantity) * row.averageCost,
        },
      ],
    })
    setSelectedRow(null)
    setReturnForm({ returnedAt: formatLocalDateTimeInput(), quantity: '', note: '' })
  }

  return (
    <EnterpriseModulePage>
      <div className="w-full min-w-0 flex-1 space-y-1 -mt-2">
        <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
          <EnterpriseKpiCard
            title="Tổng mã vật tư SX"
            value={formatQuantity(rows.length, 0)}
            tone="cyan"
            icon={<Layers size={15} />}
            isLoading={isLoading || isTransactionsLoading}
          />
          <EnterpriseKpiCard
            title="Giá trị tồn kho SX"
            value={money(totalValue)}
            tone="emerald"
            icon={<CheckCircle2 size={15} />}
            isLoading={isLoading || isTransactionsLoading}
          />
          <EnterpriseKpiCard
            title="Giao dịch SX"
            value={formatQuantity(recentProductionTransactions.length, 0)}
            tone="purple"
            icon={<Clock size={15} />}
            isLoading={isLoading || isTransactionsLoading}
          />
          <EnterpriseKpiCard
            title="Khả dụng sản xuất"
            value={formatQuantity(totalAvailable)}
            tone="blue"
            icon={<Package size={15} />}
            isLoading={isLoading || isTransactionsLoading}
          />
          <EnterpriseKpiCard
            title="Cảnh báo thiếu BOM"
            value={formatQuantity(warningCount, 0)}
            tone="amber"
            icon={<AlertTriangle size={15} />}
            isLoading={isLoading || isTransactionsLoading}
          />
          <EnterpriseKpiCard
            title="Vị trí có vật tư"
            value={formatQuantity(topMaterials.length, 0)}
            tone="cyan"
            icon={<Wrench size={15} />}
            isLoading={isLoading || isTransactionsLoading}
          />
        </div>

        <InventoryPanel className="rounded-xl -mt-1">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_220px_130px_120px]">
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearch()
              }}
              placeholder="Tìm vật tư theo mã, tên..."
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
            />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
            >
              <option value="">Tất cả trạng thái</option>
              <option>Sẵn sàng</option>
              <option>Cảnh báo</option>
              <option>Thiếu</option>
            </select>
            <button
              type="button"
              onClick={applySearch}
              className="h-9 self-end rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
            >
              Tìm kiếm
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="h-9 self-end rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Làm mới
            </button>
          </div>
        </InventoryPanel>

        <div className="grid grid-cols-1 gap-1 xl:grid-cols-12 items-start">
          <div className="xl:col-span-9">
            <InventoryPanel className="rounded-xl">
              <div className="mb-1 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Danh sách vật tư cấp sản xuất</h3>
                  <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-400/20">
                    {filtered.length} vật tư
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedModalOpen(true)}
                  className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition"
                >
                  Xem tất cả
                </button>
              </div>

              <div className="h-[430px] overflow-auto scrollbar-none rounded-lg border border-white/10">
                <table className="w-full min-w-[1180px] table-fixed text-sm">
                  <thead
                    className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                    style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                  >
                    <tr>
                      {['Mã vật tư', 'Tên vật tư', 'Loại vật tư', 'ĐVT', 'Kho nhận', 'Vị trí kho SX', 'Slot/Tầng', 'Tồn hiện tại', 'Đã reserve BOM', 'Khả dụng', 'Giá TB', 'Tổng giá trị', 'Trạng thái'].map((heading) => (
                        <th key={heading} className="px-2 py-2 text-left text-xs font-semibold text-slate-300">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading || isTransactionsLoading ? (
                      <tr>
                        <td colSpan={13} className="px-2 py-8 text-center">
                          <ModuleLoadingState label="Đang tải tồn kho vật tư..." />
                        </td>
                      </tr>
                    ) : paginatedRows.length ? paginatedRows.map((row) => (
                      <tr key={`${row.id}-${row.zoneId ?? 'none'}-${row.slotId ?? 'none'}`} onClick={() => setSelectedRow(row)} className={`cursor-pointer ${inventoryTableRow}`}>
                        <td className="px-2 py-1.5 text-cyan-300 font-mono font-medium">{row.code}</td>
                        <td className="px-2 py-1.5 text-white font-medium truncate">{row.name}</td>
                        <td className="px-2 py-1.5"><span className="rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-200">{materialUsageLabel(row.materialUsageType)}</span></td>
                        <td className="px-2 py-1.5 text-slate-300">{row.unit}</td>
                        <td className="px-2 py-1.5 text-slate-300 truncate">{row.warehouse}</td>
                        <td className="px-2 py-1.5 text-slate-300 truncate">{row.location}</td>
                        <td className="px-2 py-1.5 text-cyan-200 font-mono">{row.slotId ?? '-'}</td>
                        <td className="px-2 py-1.5 font-mono tabular-nums text-slate-200">{formatQuantity(row.currentStock)}</td>
                        <td className="px-2 py-1.5 font-mono tabular-nums text-slate-300">{formatQuantity(row.reserved)}</td>
                        <td className="px-2 py-1.5 font-mono tabular-nums text-emerald-300">{formatQuantity(row.available)}</td>
                        <td className="px-2 py-1.5 font-mono tabular-nums text-slate-300">{money(row.averageCost)}</td>
                        <td className="px-2 py-1.5 font-mono tabular-nums text-cyan-300">{money(row.inventoryValue)}</td>
                        <td className="px-2 py-1.5 text-slate-300">{row.status}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={13} className="px-2 py-10">
                          <ModuleEmptyState icon={<Package size={18} />} title="Chưa có tồn kho sản xuất" description="Không tìm thấy vật tư sản xuất phù hợp với bộ lọc hiện tại." />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <InventoryPagination page={page} pageSize={pageSize} pageCount={Math.max(1, Math.ceil(filtered.length / pageSize))} total={filtered.length} onPageChange={setPage} containerClassName="border-t-0" />
            </InventoryPanel>
          </div>

          <div className="space-y-1 xl:col-span-3">
            <InventoryChartCard title="Thiếu vật tư" className="h-[170px]">
              <div className="flex h-full flex-col justify-center gap-1 text-xs text-slate-300">
                <div className="text-3xl font-bold font-mono text-amber-300">{formatQuantity(warningCount, 0)}</div>
                <div>Vật tư cần kiểm tra cấp phát.</div>
              </div>
            </InventoryChartCard>
            <InventoryChartCard title="Giá trị tồn kho" className="h-[170px]">
              <div className="flex h-full flex-col justify-center gap-1 text-xs text-slate-300">
                <div className="text-2xl font-bold font-mono text-emerald-300">{money(totalValue)}</div>
                <div>Khả dụng: <span className="font-mono text-cyan-300">{formatQuantity(totalAvailable)}</span></div>
              </div>
            </InventoryChartCard>
            <InventoryChartCard title="Giao dịch gần đây" className="h-[170px]">
              {recentProductionTransactions.length ? recentProductionTransactions.map((transaction: any) => (
                <div key={transaction.id} className="mb-1 flex justify-between gap-1 text-[12px] text-slate-300">
                  <span className="truncate text-cyan-300 font-mono">{transaction.transactionNo ?? transaction.code}</span>
                  <span className="shrink-0 font-mono text-slate-400">{formatDateTime(transaction.transactionDate ?? transaction.createdAt)}</span>
                </div>
              )) : (
                <ModuleEmptyState icon={<Clock size={18} />} title="Chưa có giao dịch" description="Chưa phát sinh giao dịch vật tư sản xuất." />
              )}
            </InventoryChartCard>
            <InventoryChartCard title="Top vật tư khả dụng" className="h-[170px]">
              {topMaterials.length ? topMaterials.map((row) => (
                <div key={row.id} className="mb-1 flex justify-between gap-1 text-[12px] text-slate-300">
                  <span className="font-mono">{row.code}</span>
                  <span className="text-cyan-300 font-mono">{formatQuantity(row.available)} {row.unit}</span>
                </div>
              )) : (
                <ModuleEmptyState icon={<Package size={18} />} title="Chưa có dữ liệu" description="Chưa có vật tư khả dụng." />
              )}
            </InventoryChartCard>
          </div>
        </div>
      </div>

      {expandedModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Toàn bộ danh sách vật tư cấp sản xuất</h2>
                <p className="text-xs text-slate-400">Tổng cộng {filtered.length} mã vật tư sản xuất trong hệ thống</p>
              </div>
              <button
                type="button"
                onClick={() => setExpandedModalOpen(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
              >
                Đóng
              </button>
            </div>

            <div className="h-[640px] overflow-y-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[1200px] text-xs table-fixed border-collapse">
                <thead
                  className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                  style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                >
                  <tr>
                    {['Mã vật tư', 'Tên vật tư', 'Loại vật tư', 'ĐVT', 'Kho nhận', 'Vị trí kho SX', 'Slot/Tầng', 'Tồn hiện tại', 'Đã reserve BOM', 'Khả dụng', 'Giá TB', 'Tổng giá trị', 'Trạng thái'].map((heading) => (
                      <th key={heading} className="px-2 py-2 text-left font-semibold text-slate-300">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr
                      key={`${row.id}-${row.zoneId ?? 'none'}-${row.slotId ?? 'none'}`}
                      onClick={() => {
                        setSelectedRow(row)
                        setExpandedModalOpen(false)
                      }}
                      className={`${inventoryTableRow} cursor-pointer`}
                    >
                      <td className="px-2 py-2 text-cyan-300 font-mono font-medium">{row.code}</td>
                      <td className="px-2 py-2 text-white font-medium truncate">{row.name}</td>
                      <td className="px-2 py-2"><span className="rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-200">{materialUsageLabel(row.materialUsageType)}</span></td>
                      <td className="px-2 py-2 text-slate-300">{row.unit}</td>
                      <td className="px-2 py-2 text-slate-300 truncate">{row.warehouse}</td>
                      <td className="px-2 py-2 text-slate-300 truncate">{row.location}</td>
                      <td className="px-2 py-2 text-cyan-200 font-mono">{row.slotId ?? '-'}</td>
                      <td className="px-2 py-2 font-mono tabular-nums text-slate-200">{formatQuantity(row.currentStock)}</td>
                      <td className="px-2 py-2 font-mono tabular-nums text-slate-300">{formatQuantity(row.reserved)}</td>
                      <td className="px-2 py-2 font-mono tabular-nums text-emerald-300">{formatQuantity(row.available)}</td>
                      <td className="px-2 py-2 font-mono tabular-nums text-slate-300">{money(row.averageCost)}</td>
                      <td className="px-2 py-2 font-mono tabular-nums text-cyan-300">{money(row.inventoryValue)}</td>
                      <td className="px-2 py-2 text-slate-300">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <InventoryPagination
              page={page}
              pageSize={pageSize}
              pageCount={Math.max(1, Math.ceil(filtered.length / pageSize))}
              total={filtered.length}
              onPageChange={setPage}
              containerClassName="border-t-0"
            />
          </div>
        </div>
      ) : null}

      <ModuleDetailDrawer
        open={Boolean(selectedRow)}
        title={selectedRow ? `${selectedRow.code} · ${selectedRow.name}` : 'Kho vật tư SX'}
        subtitle={selectedRow ? `${selectedRow.warehouse} / ${selectedRow.location}` : undefined}
        onClose={() => setSelectedRow(null)}
        widthClass="w-[min(48rem,calc(100vw-2rem))]"
      >
        {selectedRow ? (
          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-1 md:grid-cols-4">
              <div className="rounded-lg bg-white/5 p-3">
                <div className="text-[10px] text-slate-400 uppercase">Tồn SX</div>
                <div className="font-mono text-cyan-300">{formatQuantity(selectedRow.currentStock)}</div>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <div className="text-[10px] text-slate-400 uppercase">Khả dụng</div>
                <div className="font-mono text-emerald-300">{formatQuantity(selectedRow.available)}</div>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <div className="text-[10px] text-slate-400 uppercase">Giá TB</div>
                <div className="font-mono text-blue-300">{money(selectedRow.averageCost)}</div>
              </div>
              <div className="rounded-lg bg-white/5 p-3">
                <div className="text-[10px] text-slate-400 uppercase">Giá trị</div>
                <div className="font-mono text-purple-300">{money(selectedRow.inventoryValue)}</div>
              </div>
            </div>
            <InventoryChartCard title="Lịch sử nhập / trả kho SX" className="h-[170px]">
              <div className="max-h-44 overflow-auto text-xs">
                {selectedHistory.map(({ transaction, line }: any) => (
                  <div key={`${transaction.id}-${line.id}`} className="mb-1 flex justify-between rounded border border-slate-800 px-2 py-1.5">
                    <span className={String(transaction.remarks ?? '').includes('RETURN') ? 'text-amber-300' : 'text-emerald-300'}>{transaction.transactionNo ?? transaction.code}</span>
                    <span className="font-mono text-slate-400">{formatDateTime(transaction.transactionDate ?? transaction.createdAt)}</span>
                    <span className="font-mono text-cyan-300">{formatQuantity(Math.abs(Number(line.quantity ?? 0)))} {selectedRow.unit}</span>
                  </div>
                ))}
                {!selectedHistory.length ? <ModuleEmptyState icon={<Clock size={18} />} title="Chưa có lịch sử" description="Chưa có lịch sử nhập/trả kho sản xuất." /> : null}
              </div>
            </InventoryChartCard>
            <div className="grid gap-1 rounded border border-amber-900/60 bg-amber-950/10 p-4 md:grid-cols-3">
              <input type="datetime-local" value={returnForm.returnedAt} onFocus={() => setReturnForm((prev) => ({ ...prev, returnedAt: formatLocalDateTimeInput() }))} onChange={(event) => setReturnForm((prev) => ({ ...prev, returnedAt: event.target.value }))} className={componentsInput} />
              <input value={returnForm.quantity} onFocus={(event) => setReturnForm((prev) => ({ ...prev, quantity: formatQuantityInput(event.target.value) }))} onBlur={(event) => setReturnForm((prev) => ({ ...prev, quantity: formatQuantity(event.target.value) }))} onChange={(event) => setReturnForm((prev) => ({ ...prev, quantity: formatQuantityInput(event.target.value) }))} inputMode="decimal" placeholder="Số lượng trả" className={componentsInput} />
              <input value={returnForm.note} onChange={(event) => setReturnForm((prev) => ({ ...prev, note: event.target.value }))} placeholder="Ghi chú trả kho" className={componentsInput} />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setSelectedRow(null)} className={componentsMutedButton}>Hủy</button>
              <button disabled={!selectedRow.zoneId || parseLocaleNumber(returnForm.quantity || 0) <= 0 || parseLocaleNumber(returnForm.quantity || 0) > selectedRow.available} onClick={() => void returnToMainWarehouse(selectedRow)} className={componentsPrimaryButton}>Trả về kho chính</button>
            </div>
          </div>
        ) : null}
      </ModuleDetailDrawer>
    </EnterpriseModulePage>
  )
}
