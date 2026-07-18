import { useEffect, useMemo, useState } from 'react'

import { ComponentsWorkspace } from '../../components/ComponentsWorkspace'
import { CockpitChartCard, CockpitKpiCard, CockpitTableShell, COCKPIT_HEIGHTS, DataTablePagination } from '../../../../shared/ui/cockpit'
import { ModuleDetailDrawer, ModuleEmptyState, ModuleFilterBar, ModuleLoadingState } from '../../../../shared/ui/modules'
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
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selectedRow, setSelectedRow] = useState<MaterialStockRow | null>(null)
  const [returnForm, setReturnForm] = useState({ returnedAt: formatLocalDateTimeInput(), quantity: '', note: '' })

  useEffect(() => {
    setPage(1)
  }, [query, status])

  useEffect(() => {
    if (!selectedRow) return

    setReturnForm((prev) => ({
      ...prev,
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
  const totalReserved = rows.reduce((sum, row) => sum + row.reserved, 0)
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
      .slice(0, 8)
  }, [selectedRow, transactionsData])

  async function returnToMainWarehouse(row: MaterialStockRow) {
    const quantity = parseLocaleNumber(returnForm.quantity || 0)
    if (quantity <= 0 || quantity > row.available || !row.zoneId) return

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
    <ComponentsWorkspace>
      <div className="w-full min-w-0 flex-1 space-y-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-6">
          <CockpitKpiCard title="Tổng mã vật tư SX" value={formatQuantity(rows.length, 0)} state="normal" tone="cyan" />
          <CockpitKpiCard title="Giá trị tồn kho SX" value={money(totalValue)} note="đồng bộ từ giao dịch kho" state="normal" tone="emerald" />
          <CockpitKpiCard title="Đã reserve BOM" value={formatQuantity(totalReserved)} note="chờ allocation backend" state="normal" tone="purple" />
          <CockpitKpiCard title="Khả dụng sản xuất" value={formatQuantity(totalAvailable)} state="normal" tone="blue" />
          <CockpitKpiCard title="Cảnh báo thiếu BOM" value={formatQuantity(warningCount, 0)} note="cần cấp phát" state="normal" tone="amber" />
          <CockpitKpiCard title="Trạng thái dữ liệu" value="LIVE" note="làm mới mỗi 5 giây" state="normal" tone="cyan" />
        </div>

        <ModuleFilterBar>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm vật tư theo mã, tên..."
            className={`${componentsInput} xl:col-span-4`}
          />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className={`${componentsInput} xl:col-span-2`}>
            <option value="">Tất cả trạng thái</option>
            <option>Sẵn sàng</option>
            <option>Cảnh báo</option>
            <option>Thiếu</option>
          </select>
          <button onClick={() => { setQuery(''); setStatus('') }} className={`${componentsMutedButton} xl:col-span-2`}>
            Làm mới
          </button>
        </ModuleFilterBar>

        <div className="grid grid-cols-1 gap-1 xl:grid-cols-12">
          <div className="xl:col-span-9">
            <CockpitChartCard title={`Danh sách vật tư cấp sản xuất (${filtered.length})`} className={COCKPIT_HEIGHTS.TABLE_MD}>
              <CockpitTableShell className="h-full">
                <table className="w-full min-w-[1180px] table-fixed text-[13px]">
                  <thead className="border-b border-cyan-400/10 bg-transparent text-slate-300">
                    <tr>
                      {['Mã vật tư', 'Tên vật tư', 'Loại vật tư', 'ĐVT', 'Kho nhận', 'Vị trí kho SX', 'Slot/Tầng', 'Tồn hiện tại', 'Đã reserve BOM', 'Khả dụng', 'Giá TB', 'Tổng giá trị', 'Trạng thái'].map((heading) => (
                        <th key={heading} className="px-1.5 py-0.5 text-left font-medium">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading || isTransactionsLoading ? (
                      <tr>
                        <td colSpan={13} className="px-2 py-8">
                          <ModuleLoadingState label="Đang tải tồn kho vật tư..." />
                        </td>
                      </tr>
                    ) : paginatedRows.length ? paginatedRows.map((row) => (
                      <tr key={`${row.id}-${row.zoneId ?? 'none'}-${row.slotId ?? 'none'}`} onClick={() => setSelectedRow(row)} className="cursor-pointer border-t border-slate-800/80 text-slate-200 hover:bg-slate-900/40">
                        <td className="px-2 py-2 text-cyan-300">{row.code}</td>
                        <td className="px-2 py-2">{row.name}</td>
                        <td className="px-2 py-2"><span className="rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-2 py-1 text-xs text-cyan-200">{materialUsageLabel(row.materialUsageType)}</span></td>
                        <td className="px-2 py-2">{row.unit}</td>
                        <td className="px-2 py-2">{row.warehouse}</td>
                        <td className="px-2 py-2">{row.location}</td>
                        <td className="px-2 py-2 text-cyan-200">{row.slotId ?? '-'}</td>
                        <td className="px-2 py-2">{formatQuantity(row.currentStock)}</td>
                        <td className="px-2 py-2">{formatQuantity(row.reserved)}</td>
                        <td className="px-2 py-2">{formatQuantity(row.available)}</td>
                        <td className="px-2 py-2">{money(row.averageCost)}</td>
                        <td className="px-2 py-2 text-cyan-300">{money(row.inventoryValue)}</td>
                        <td className="px-2 py-2">{row.status}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={13} className="px-2 py-10">
                          <ModuleEmptyState icon="📦" title="Chưa có tồn kho sản xuất" description="Không tìm thấy vật tư sản xuất phù hợp với bộ lọc hiện tại." />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CockpitTableShell>
              <DataTablePagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
            </CockpitChartCard>
          </div>

          <div className="space-y-1 xl:col-span-3">
            <CockpitChartCard title="Thiếu vật tư" className={COCKPIT_HEIGHTS.CHART_SM}>
              <div className="flex h-full flex-col justify-center gap-1 text-sm text-slate-300">
                <div className="text-3xl font-bold text-amber-300">{formatQuantity(warningCount, 0)}</div>
                <div>Vật tư cần kiểm tra cấp phát.</div>
              </div>
            </CockpitChartCard>
            <CockpitChartCard title="Giá trị" className={COCKPIT_HEIGHTS.CHART_SM}>
              <div className="flex h-full flex-col justify-center gap-1 text-sm text-slate-300">
                <div className="text-2xl font-bold text-emerald-300">{money(totalValue)}</div>
                <div>Khả dụng: {formatQuantity(totalAvailable)}</div>
              </div>
            </CockpitChartCard>
            <CockpitChartCard title="Giao dịch gần đây" className={COCKPIT_HEIGHTS.CHART_SM}>
              {recentProductionTransactions.length ? recentProductionTransactions.map((transaction: any) => (
                <div key={transaction.id} className="mb-1 flex justify-between gap-1 text-[12px] text-slate-300">
                  <span className="truncate text-cyan-300">{transaction.transactionNo ?? transaction.code}</span>
                  <span className="shrink-0">{formatDateTime(transaction.transactionDate ?? transaction.createdAt)}</span>
                </div>
              )) : (
                <ModuleEmptyState icon="🕒" title="Chưa có giao dịch" description="Chưa phát sinh giao dịch vật tư sản xuất." />
              )}
            </CockpitChartCard>
            <CockpitChartCard title="Top vật tư khả dụng" className={COCKPIT_HEIGHTS.CHART_SM}>
              {topMaterials.length ? topMaterials.map((row) => (
                <div key={row.id} className="mb-1 flex justify-between gap-1 text-[12px] text-slate-300">
                  <span>{row.code}</span>
                  <span className="text-cyan-300">{formatQuantity(row.available)} {row.unit}</span>
                </div>
              )) : (
                <ModuleEmptyState icon="📦" title="Chưa có dữ liệu" description="Chưa có vật tư khả dụng." />
              )}
            </CockpitChartCard>
          </div>
        </div>
      </div>

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
              <CockpitKpiCard title="Tồn SX" value={formatQuantity(selectedRow.currentStock)} state="normal" tone="cyan" />
              <CockpitKpiCard title="Khả dụng" value={formatQuantity(selectedRow.available)} state="normal" tone="emerald" />
              <CockpitKpiCard title="Giá TB" value={money(selectedRow.averageCost)} state="normal" tone="blue" />
              <CockpitKpiCard title="Giá trị" value={money(selectedRow.inventoryValue)} state="normal" tone="purple" />
            </div>
            <CockpitChartCard title="Lịch sử nhập / trả kho SX" className={COCKPIT_HEIGHTS.CHART_SM}>
              <div className="max-h-44 overflow-auto text-xs">
                {selectedHistory.map(({ transaction, line }: any) => (
                  <div key={`${transaction.id}-${line.id}`} className="mb-1 flex justify-between rounded border border-slate-800 px-2 py-1.5">
                    <span className={String(transaction.remarks ?? '').includes('RETURN') ? 'text-amber-300' : 'text-emerald-300'}>{transaction.transactionNo ?? transaction.code}</span>
                    <span>{formatDateTime(transaction.transactionDate ?? transaction.createdAt)}</span>
                    <span>{formatQuantity(Math.abs(Number(line.quantity ?? 0)))} {selectedRow.unit}</span>
                  </div>
                ))}
                {!selectedHistory.length ? <ModuleEmptyState icon="🕒" title="Chưa có lịch sử" description="Chưa có lịch sử nhập/trả kho sản xuất." /> : null}
              </div>
            </CockpitChartCard>
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
    </ComponentsWorkspace>
  )
}
