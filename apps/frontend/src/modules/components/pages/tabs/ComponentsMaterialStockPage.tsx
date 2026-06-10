import { useMemo, useState } from 'react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { useCreateTransaction } from '../../../inventory/hooks/useCreateTransaction'
import { useInventoryAudit } from '../../../inventory/hooks/useInventoryAudit'
import { useInventoryItems } from '../../../inventory/hooks/useInventoryItems'
import { useInventoryTransactions } from '../../../inventory/hooks/useInventoryTransactions'
import { useProductionIssues } from '../../../production/hooks/useProductionCockpit'
import { ComponentsFilterBar, ComponentsKpiCard, ComponentsPanel } from './ComponentsCockpitShared'

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

const money = (value: number) => `${Math.round(value).toLocaleString('vi-VN')} đ`

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
  const [selectedRow, setSelectedRow] = useState<MaterialStockRow | null>(null)
  const [returnForm, setReturnForm] = useState({ returnedAt: new Date().toISOString().slice(0, 16), quantity: '', note: '' })

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
    const quantity = Number(returnForm.quantity || 0)
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
    setReturnForm({ returnedAt: new Date().toISOString().slice(0, 16), quantity: '', note: '' })
  }

  return (
    <EnterpriseModulePage>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-6">
          <ComponentsKpiCard title="Tổng mã vật tư SX" value={rows.length.toLocaleString('vi-VN')} />
          <ComponentsKpiCard title="Giá trị tồn kho SX" value={money(totalValue)} sub="đồng bộ từ giao dịch kho" />
          <ComponentsKpiCard title="Đã reserve BOM" value={totalReserved.toLocaleString('vi-VN')} sub="chờ allocation backend" />
          <ComponentsKpiCard title="Khả dụng sản xuất" value={totalAvailable.toLocaleString('vi-VN')} />
          <ComponentsKpiCard title="Cảnh báo thiếu BOM" value={warningCount.toLocaleString('vi-VN')} sub="cần cấp phát" />
          <ComponentsKpiCard title="Trạng thái dữ liệu" value="LIVE" sub="làm mới mỗi 5 giây" />
        </div>

        <ComponentsFilterBar>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm vật tư theo mã, tên..."
            className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 xl:col-span-4"
          />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 xl:col-span-2">
            <option value="">Tất cả trạng thái</option>
            <option>Sẵn sàng</option>
            <option>Cảnh báo</option>
            <option>Thiếu</option>
          </select>
          <button onClick={() => { setQuery(''); setStatus('') }} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-200 xl:col-span-2">
            Làm mới
          </button>
        </ComponentsFilterBar>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-9">
            <ComponentsPanel title={`Danh sách vật tư cấp sản xuất (${filtered.length})`}>
              <div className="overflow-auto">
                <table className="w-full min-w-[1180px] text-sm">
                  <thead className="text-xs uppercase text-slate-400">
                    <tr>
                      {['Mã vật tư', 'Tên vật tư', 'Loại vật tư', 'ĐVT', 'Kho nhận', 'Vị trí kho SX', 'Slot/Tầng', 'Tồn hiện tại', 'Đã reserve BOM', 'Khả dụng', 'Giá TB', 'Tổng giá trị', 'Trạng thái'].map((heading) => (
                        <th key={heading} className="px-2 py-2 text-left font-medium">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading || isTransactionsLoading ? (
                      <tr><td colSpan={12} className="px-2 py-6 text-center text-slate-400">Đang tải tồn kho vật tư...</td></tr>
                    ) : filtered.map((row) => (
                      <tr key={`${row.id}-${row.zoneId ?? 'none'}-${row.slotId ?? 'none'}`} onClick={() => setSelectedRow(row)} className="cursor-pointer border-t border-slate-800/80 text-slate-200 hover:bg-slate-900/40">
                        <td className="px-2 py-2 text-cyan-300">{row.code}</td>
                        <td className="px-2 py-2">{row.name}</td>
                        <td className="px-2 py-2"><span className="rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-2 py-1 text-xs text-cyan-200">{materialUsageLabel(row.materialUsageType)}</span></td>
                        <td className="px-2 py-2">{row.unit}</td>
                        <td className="px-2 py-2">{row.warehouse}</td>
                        <td className="px-2 py-2">{row.location}</td>
                        <td className="px-2 py-2 text-cyan-200">{row.slotId ?? '-'}</td>
                        <td className="px-2 py-2">{row.currentStock.toLocaleString('vi-VN')}</td>
                        <td className="px-2 py-2">{row.reserved.toLocaleString('vi-VN')}</td>
                        <td className="px-2 py-2">{row.available.toLocaleString('vi-VN')}</td>
                        <td className="px-2 py-2">{money(row.averageCost)}</td>
                        <td className="px-2 py-2 text-cyan-300">{money(row.inventoryValue)}</td>
                        <td className="px-2 py-2">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-xs text-slate-400">Hiển thị 1 - {filtered.length} của {filtered.length} kết quả</div>
            </ComponentsPanel>
          </div>

          <div className="space-y-4 xl:col-span-3">
            <ComponentsPanel title="Luồng cấp phát">
              <div className="space-y-2 text-sm text-slate-300">
                <div>Kho chính → Kho vật tư SX</div>
                <div>Kho vật tư SX → BOM lệnh sản xuất</div>
                <div>Hoàn thành → Bãi tập kết / zone / slot / tầng</div>
              </div>
            </ComponentsPanel>
            <ComponentsPanel title="Top vật tư khả dụng">
              {topMaterials.map((row) => (
                <div key={row.id} className="mb-2 flex justify-between gap-2 text-sm text-slate-300">
                  <span>{row.code}</span>
                  <span className="text-cyan-300">{row.available.toLocaleString('vi-VN')} {row.unit}</span>
                </div>
              ))}
            </ComponentsPanel>
          </div>
        </div>
      </div>

      {selectedRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-3xl rounded-xl border border-slate-700 bg-[#071323] p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-cyan-400">Kho vật tư SX</div>
                <h3 className="mt-1 text-xl font-semibold text-white">{selectedRow.code} · {selectedRow.name}</h3>
                <div className="mt-1 text-sm text-slate-400">{selectedRow.warehouse} / {selectedRow.location}</div>
                <div className="mt-1 text-xs text-cyan-300">zoneId: {selectedRow.zoneId ?? '-'} · slot: {selectedRow.slotId ?? '-'}</div>
              </div>
              <button onClick={() => setSelectedRow(null)} className="text-slate-300">Đóng</button>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <ComponentsKpiCard title="Tồn SX" value={selectedRow.currentStock.toLocaleString('vi-VN')} />
              <ComponentsKpiCard title="Khả dụng" value={selectedRow.available.toLocaleString('vi-VN')} />
              <ComponentsKpiCard title="Giá TB" value={money(selectedRow.averageCost)} />
              <ComponentsKpiCard title="Giá trị" value={money(selectedRow.inventoryValue)} />
            </div>
            <div className="mt-4 rounded border border-slate-800 bg-[#050d18] p-4">
              <div className="mb-3 text-sm font-semibold text-white">Lịch sử nhập / trả kho SX</div>
              <div className="max-h-44 overflow-auto text-xs">
                {selectedHistory.map(({ transaction, line }: any) => (
                  <div key={`${transaction.id}-${line.id}`} className="mb-2 flex justify-between rounded border border-slate-800 px-2 py-1.5">
                    <span className={String(transaction.remarks ?? '').includes('RETURN') ? 'text-amber-300' : 'text-emerald-300'}>{transaction.transactionNo ?? transaction.code}</span>
                    <span>{new Date(transaction.transactionDate ?? transaction.createdAt).toLocaleString('vi-VN')}</span>
                    <span>{Math.abs(Number(line.quantity ?? 0)).toLocaleString('vi-VN')} {selectedRow.unit}</span>
                  </div>
                ))}
                {!selectedHistory.length ? <p className="text-slate-500">Chưa có lịch sử nhập/trả.</p> : null}
              </div>
            </div>
            <div className="mt-4 grid gap-3 rounded border border-amber-900/60 bg-amber-950/10 p-4 md:grid-cols-3">
              <input type="datetime-local" value={returnForm.returnedAt} onChange={(event) => setReturnForm((prev) => ({ ...prev, returnedAt: event.target.value }))} className="h-10 rounded border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100" />
              <input value={returnForm.quantity} onChange={(event) => setReturnForm((prev) => ({ ...prev, quantity: event.target.value }))} inputMode="decimal" placeholder="Số lượng trả" className="h-10 rounded border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100" />
              <input value={returnForm.note} onChange={(event) => setReturnForm((prev) => ({ ...prev, note: event.target.value }))} placeholder="Ghi chú trả kho" className="h-10 rounded border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setSelectedRow(null)} className="rounded border border-slate-700 px-4 py-2 text-sm text-slate-200">Hủy</button>
              <button disabled={!selectedRow.zoneId || Number(returnForm.quantity || 0) <= 0 || Number(returnForm.quantity || 0) > selectedRow.available} onClick={() => void returnToMainWarehouse(selectedRow)} className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-700">Trả về kho chính</button>
            </div>
          </div>
        </div>
      ) : null}
    </EnterpriseModulePage>
  )
}
