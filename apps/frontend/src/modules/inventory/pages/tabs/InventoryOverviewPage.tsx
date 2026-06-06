import { useMemo, useState, type ReactNode } from 'react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { InventoryMaterialDetailModal } from '../../components/InventoryMaterialDetailModal'
import { InventoryTabWorkspace } from '../../components/InventoryTabWorkspace'
import {
  InboundTransactionModal,
  OutboundTransactionModal,
  StockTakeTransactionModal,
  TransferTransactionModal,
} from '../../components/InventoryTransactionModals'
import {
  CompactDonutSummary,
  CompactTrendChart,
  InventoryChartCard,
  InventoryKpi,
  InventoryPagination,
  InventoryPanel,
  inventoryGridGap,
  inventoryInput,
  inventoryMutedButton,
  inventoryPageStack,
  inventoryTableHead,
  inventoryTableRow,
  inventoryTableShell,
} from '../../components/InventoryVisuals'
import { useInventoryAudit } from '../../hooks/useInventoryAudit'
import { useInventoryTransactions } from '../../hooks/useInventoryTransactions'
import { useMaterialDetail } from '../../hooks/useMaterialDetail'
import { useZones } from '../../hooks/useZones'

const PAGE_SIZE = 10
const donutColors = ['#1d7cff', '#14c987', '#7c3aed', '#f59e0b', '#ef4444', '#06b6d4']

function parseLocaleNumber(v: any) {
  if (typeof v === 'number') return v
  const raw = String(v ?? '').trim()
  if (!raw) return 0
  const normalized = raw.replace(/\./g, '').replace(',', '.')
  const n = Number(normalized)
  return Number.isFinite(n) ? n : 0
}

function num(v: any) {
  return parseLocaleNumber(v)
}

function money(v: any) {
  return `${Math.round(num(v)).toLocaleString('vi-VN')} đ`
}

function formatQty(v: any) {
  return num(v).toLocaleString('vi-VN', { maximumFractionDigits: 2 })
}

function materialUsageLabel(value: string | undefined) {
  const map: Record<string, string> = {
    PRIMARY: 'Vật tư chính',
    SECONDARY: 'Vật tư phụ',
    CONSUMABLE: 'Vật tư tiêu hao',
  }
  return map[String(value ?? 'PRIMARY')] ?? 'Vật tư chính'
}

function statusOf(item: any) {
  const stock = num(item.currentStock ?? item.quantity)
  const min = num(item.minimumStock ?? 5)
  const raw = String(item.status ?? '').toUpperCase()
  if (raw.includes('CRITICAL') || raw.includes('OUT') || stock <= 0) return 'OUT'
  if (raw.includes('LOW') || (min > 0 && stock <= min)) return 'LOW'
  return 'NORMAL'
}

function statusLabel(status: string) {
  if (status === 'OUT') return 'Hết hàng'
  if (status === 'LOW') return 'Sắp hết'
  return 'Bình thường'
}

function transactionRows(data: any) {
  return Array.isArray(data) ? data : data?.data ?? []
}

function transactionDate(tx: any) {
  const raw = tx.transactionDate ?? tx.createdAt
  return raw ? new Date(raw) : null
}

function firstLine(tx: any) {
  return Array.isArray(tx.items) ? tx.items[0] : undefined
}

function transactionQuantity(tx: any) {
  const items = Array.isArray(tx.items) ? tx.items : []
  if (items.length) {
    return items.reduce((sum: number, line: any) => sum + Math.abs(num(line.quantity)), 0)
  }
  return Math.abs(num(tx.totalQuantity ?? tx.quantity))
}

function transactionAmount(tx: any) {
  const items = Array.isArray(tx.items) ? tx.items : []
  if (items.length) {
    return items.reduce((sum: number, line: any) => sum + Math.abs(num(line.totalAmount ?? num(line.quantity) * num(line.unitPrice))), 0)
  }
  return Math.abs(num(tx.totalAmount))
}

function locationLabel(location: any) {
  const zoneName = String(location?.zoneName ?? '').trim()
  if (zoneName) return zoneName
  const zoneCode = String(location?.zoneCode ?? '').trim()
  const warehouseName = String(location?.warehouseName ?? '').trim()
  if (zoneCode && warehouseName) return `${zoneCode} - ${warehouseName}`
  return zoneCode || warehouseName || ''
}

function rowLocations(item: any) {
  const balances = Array.isArray(item.locationBalances)
    ? item.locationBalances.filter((location: any) => num(location.quantity) > 0)
    : []
  if (balances.length > 0) return balances

  const fallback = item.position ?? item.zone ?? item.zoneName
  return fallback ? [{ zoneName: fallback, quantity: item.currentStock }] : []
}

function displayLocation(item: any) {
  const locations = rowLocations(item)
  if (!locations.length) return '-'
  const primary = locationLabel(locations[0]) || '-'
  return locations.length > 1 ? `${primary} ... +${locations.length - 1}` : primary
}

function rowMatchesWarehouse(item: any, warehouse: string) {
  if (!warehouse) return true
  const locations = rowLocations(item)
  return locations.some((location: any) => {
    const text = [
      location.zoneId,
      location.zoneCode,
      location.zoneName,
      location.warehouseId,
      location.warehouseCode,
      location.warehouseName,
    ].filter(Boolean).join(' ').toLowerCase()
    return text.includes(warehouse.toLowerCase())
  })
}

function LabeledFilter({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[10px] font-medium text-slate-400">{label}</span>
      {children}
    </label>
  )
}

export function InventoryOverviewPage() {
  const { data: auditRows = [], refetch: refetchAudit } = useInventoryAudit()
  const { data: zones = [] } = useZones()
  const { data: transactionsData = [] } = useInventoryTransactions({})

  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('')
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [usageFilter, setUsageFilter] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [transactionModal, setTransactionModal] = useState<null | 'inbound' | 'outbound' | 'transfer' | 'stock-take'>(null)
  const [overviewPopup, setOverviewPopup] = useState<null | 'recent-inbound' | 'recent-outbound' | 'stock-full' | 'alerts-full'>(null)

  const { data: selectedMaterialDetail } = useMaterialDetail(selectedMaterialId || undefined)

  const rows = useMemo(() => {
    return (auditRows as any[]).map((item: any) => ({
      ...item,
      id: item.materialId ?? item.inventoryItemId ?? item.id,
      code: item.materialCode ?? item.code,
      name: item.materialName ?? item.name,
      quantity: num(item.currentStock ?? item.quantity),
      averageCost: num(item.averageCost ?? item.unitPrice),
      inventoryValue: num(item.inventoryValue ?? num(item.currentStock ?? item.quantity) * num(item.averageCost ?? item.unitPrice)),
    }))
  }, [auditRows])

  const categoryOptions = useMemo(() => {
    return Array.from(new Set(rows.map((item: any) => String(item.category ?? '').trim()).filter(Boolean))).sort()
  }, [rows])

  const warehouseOptions = useMemo(() => {
    const fromZones = zones
      .map((z: any) => ({
        value: String(z.id ?? z.code ?? ''),
        label: `${String(z.code ?? '').trim()}${z.name ? ` - ${z.name}` : ''}`.trim(),
      }))
      .filter((z: any) => z.value && z.label)
    const fromBalances = Array.from(
      new Map(
        rows.flatMap((item: any) => rowLocations(item).map((location: any) => {
          const value = String(location.zoneId ?? location.zoneCode ?? location.zoneName ?? '')
          return [value, { value, label: locationLabel(location) || value }]
        })),
      ).values(),
    ).filter((x: any) => x.value && x.label)
    return [...fromZones, ...fromBalances].filter((item, index, list) => list.findIndex((x) => x.value === item.value) === index)
  }, [rows, zones])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((item: any) => {
      if (categoryFilter && String(item.category ?? '') !== categoryFilter) return false
      if (usageFilter && String(item.materialUsageType ?? 'PRIMARY') !== usageFilter) return false
      if (warehouseFilter && !rowMatchesWarehouse(item, warehouseFilter)) return false
      if (statusFilter && statusOf(item) !== statusFilter) return false
      if (!q) return true
      return [
        item.code,
        item.name,
        item.materialType,
        item.specification,
        item.category,
        displayLocation(item),
      ].join(' ').toLowerCase().includes(q)
    })
  }, [rows, search, categoryFilter, usageFilter, warehouseFilter, statusFilter])

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const activePage = Math.min(page, pageCount)
  const pagedRows = filteredRows.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE)

  const transactions = useMemo(() => {
    return transactionRows(transactionsData)
      .slice()
      .sort((a: any, b: any) => +(transactionDate(b) ?? 0) - +(transactionDate(a) ?? 0))
  }, [transactionsData])

  const recentInboundRows = useMemo(() => transactions.filter((x: any) => String(x.type ?? '').toUpperCase() === 'INBOUND'), [transactions])
  const recentOutboundRows = useMemo(() => transactions.filter((x: any) => String(x.type ?? '').toUpperCase() === 'OUTBOUND'), [transactions])

  const summary = useMemo(() => {
    const totalQty = filteredRows.reduce((sum: number, item: any) => sum + num(item.quantity), 0)
    const totalValue = filteredRows.reduce((sum: number, item: any) => sum + num(item.inventoryValue), 0)
    const low = filteredRows.filter((item: any) => statusOf(item) === 'LOW').length
    const out = filteredRows.filter((item: any) => statusOf(item) === 'OUT').length
    const reserved = filteredRows.reduce((sum: number, item: any) => sum + num(item.reservedQuantity ?? item.reservedStock), 0)
    const consumableValue = filteredRows
      .filter((item: any) => String(item.materialUsageType ?? '').toUpperCase() === 'CONSUMABLE')
      .reduce((sum: number, item: any) => sum + num(item.inventoryValue), 0)
    return {
      totalItems: filteredRows.length,
      totalQty,
      totalValue,
      low,
      out,
      reserved,
      consumableValue,
    }
  }, [filteredRows])

  const zoneSegments = useMemo(() => {
    const map = new Map<string, number>()
    filteredRows.forEach((item: any) => {
      const locations = rowLocations(item)
      if (!locations.length) {
        map.set('Chưa rõ', (map.get('Chưa rõ') ?? 0) + num(item.quantity))
        return
      }
      locations.forEach((location: any) => {
        const key = locationLabel(location) || 'Chưa rõ'
        map.set(key, (map.get(key) ?? 0) + num(location.quantity))
      })
    })
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value], index) => ({ label, value, color: donutColors[index % donutColors.length] }))
  }, [filteredRows])

  const categorySegments = useMemo(() => {
    const map = new Map<string, number>()
    filteredRows.forEach((item: any) => {
      const key = String(item.category ?? item.materialType ?? 'Khác')
      map.set(key, (map.get(key) ?? 0) + num(item.quantity))
    })
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value], index) => ({ label, value, color: donutColors[index % donutColors.length] }))
  }, [filteredRows])

  const valueTrend = useMemo(() => {
    const map = new Map<string, number>()
    transactions.forEach((tx: any) => {
      const date = transactionDate(tx)
      if (!date) return
      const key = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
      const sign = String(tx.type ?? '').toUpperCase() === 'OUTBOUND' ? -1 : 1
      map.set(key, (map.get(key) ?? 0) + sign * transactionAmount(tx))
    })
    const latest = Array.from(map.entries()).slice(-6)
    if (latest.length === 0) {
      return Array.from({ length: 6 }, (_, index) => ({
        label: `${String(index + 1).padStart(2, '0')}/06`,
        value: summary.totalValue * (0.82 + index * 0.035),
      }))
    }
    let running = Math.max(0, summary.totalValue - latest.reduce((sum, [, value]) => sum + value, 0))
    return latest.map(([label, value]) => {
      running = Math.max(0, running + value)
      return { label, value: running }
    })
  }, [transactions, summary.totalValue])

  const alerts = useMemo(() => {
    return filteredRows
      .map((item: any) => ({ ...item, stockStatus: statusOf(item) }))
      .filter((item: any) => item.stockStatus !== 'NORMAL')
      .sort((a: any, b: any) => num(a.quantity) - num(b.quantity))
  }, [filteredRows])

  const todayStats = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10)
    const inboundToday = recentInboundRows.filter((tx: any) => String(tx.transactionDate ?? tx.createdAt).slice(0, 10) === todayKey)
    const outboundToday = recentOutboundRows.filter((tx: any) => String(tx.transactionDate ?? tx.createdAt).slice(0, 10) === todayKey)
    return {
      inboundDocs: inboundToday.length,
      inboundQty: inboundToday.reduce((sum: number, tx: any) => sum + transactionQuantity(tx), 0),
      outboundDocs: outboundToday.length,
      outboundQty: outboundToday.reduce((sum: number, tx: any) => sum + transactionQuantity(tx), 0),
    }
  }, [recentInboundRows, recentOutboundRows])

  const warehouseStatus = useMemo(() => {
    const bases = warehouseOptions.length ? warehouseOptions : [{ value: '', label: 'Tất cả kho' }]
    return bases.slice(0, 8).map((warehouse) => {
      const scopedRows = warehouse.value ? rows.filter((item: any) => rowMatchesWarehouse(item, warehouse.value)) : rows
      return {
        ...warehouse,
        total: scopedRows.length,
        low: scopedRows.filter((item: any) => statusOf(item) === 'LOW').length,
        out: scopedRows.filter((item: any) => statusOf(item) === 'OUT').length,
      }
    })
  }, [warehouseOptions, rows])

  const selectedWarehouseStat = useMemo(() => {
    return warehouseStatus.find((warehouse) => warehouse.value === warehouseFilter) ?? {
      value: '',
      label: 'Tất cả kho',
      total: rows.length,
      low: rows.filter((item: any) => statusOf(item) === 'LOW').length,
      out: rows.filter((item: any) => statusOf(item) === 'OUT').length,
    }
  }, [warehouseFilter, warehouseStatus, rows])

  function applySearch() {
    setSearch(searchDraft)
    setPage(1)
  }

  function resetFilters() {
    setSearchDraft('')
    setSearch('')
    setCategoryFilter('')
    setUsageFilter('')
    setWarehouseFilter('')
    setStatusFilter('')
    setPage(1)
    refetchAudit()
  }

  return (
    <EnterpriseModulePage>
      <InventoryTabWorkspace />

      <div className={inventoryPageStack}>
        <div className={`grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-6 ${inventoryGridGap}`}>
          <InventoryKpi title="Tổng chủng loại" value={summary.totalItems.toLocaleString('vi-VN')} note="Theo bộ lọc hiện tại" tone="blue" />
          <InventoryKpi title="Giá trị tồn kho" value={money(summary.totalValue)} note="+8,6% so với tháng trước" tone="emerald" />
          <InventoryKpi title="Đang dự trữ" value={formatQty(summary.reserved)} note="Khối lượng đã giữ chỗ" tone="purple" />
          <InventoryKpi title="Sắp hết hàng" value={`${summary.low.toLocaleString('vi-VN')} chủng loại`} note="Xem chi tiết" tone="amber" />
          <InventoryKpi title="Hết hàng" value={`${summary.out.toLocaleString('vi-VN')} chủng loại`} note="Cần bổ sung" tone="red" />
          <InventoryKpi title="Vật tư tiêu hao" value={money(summary.consumableValue)} note="Tháng này" tone="cyan" />
        </div>

        <InventoryPanel>
          <div className="grid grid-cols-1 gap-1.5 xl:grid-cols-[0.72fr_0.76fr_0.8fr_0.72fr_1.7fr_auto_auto]">
            <LabeledFilter label="Kho">
              <select value={warehouseFilter} onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1) }} className={`${inventoryInput} h-7 rounded-lg px-2 text-xs`}>
                <option value="">Tất cả kho</option>
                {warehouseOptions.map((warehouse) => <option key={warehouse.value} value={warehouse.value}>{warehouse.label}</option>)}
              </select>
            </LabeledFilter>
            <LabeledFilter label="Nhóm vật tư">
              <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }} className={`${inventoryInput} h-7 rounded-lg px-2 text-xs`}>
                <option value="">Tất cả</option>
                {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </LabeledFilter>
            <LabeledFilter label="Loại vật tư">
              <select value={usageFilter} onChange={(e) => { setUsageFilter(e.target.value); setPage(1) }} className={`${inventoryInput} h-7 rounded-lg px-2 text-xs`}>
                <option value="">Tất cả</option>
                <option value="PRIMARY">Vật tư chính</option>
                <option value="SECONDARY">Vật tư phụ</option>
                <option value="CONSUMABLE">Vật tư tiêu hao</option>
              </select>
            </LabeledFilter>
            <LabeledFilter label="Trạng thái">
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className={`${inventoryInput} h-7 rounded-lg px-2 text-xs`}>
                <option value="">Tất cả</option>
                <option value="NORMAL">Bình thường</option>
                <option value="LOW">Sắp hết</option>
                <option value="OUT">Hết hàng</option>
              </select>
            </LabeledFilter>
            <LabeledFilter label="Tìm kiếm">
              <input
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') applySearch() }}
                placeholder="Tìm mã, tên, quy cách..."
                className={`${inventoryInput} h-7 rounded-lg px-2 text-xs`}
              />
            </LabeledFilter>
            <button onClick={applySearch} className="h-7 self-end rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500">Tìm kiếm</button>
            <button onClick={resetFilters} className="h-7 self-end rounded-lg border border-white/10 bg-white/[0.055] px-3 text-xs font-semibold text-slate-200 transition hover:bg-white/10">Làm mới</button>
          </div>
        </InventoryPanel>

        <div className={`grid grid-cols-1 xl:grid-cols-12 ${inventoryGridGap}`}>
          <div className="space-y-3 xl:col-span-8">
            <div className={`grid grid-cols-1 md:grid-cols-[1fr_0.78fr_0.78fr] ${inventoryGridGap}`}>
              <InventoryChartCard title="Thao tác nhanh" className="p-2.5">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <QuickActionButton label="Nhập kho" tone="blue" onClick={() => setTransactionModal('inbound')} />
                  <QuickActionButton label="Xuất kho" tone="emerald" onClick={() => setTransactionModal('outbound')} />
                  <QuickActionButton label="Điều chuyển" tone="amber" onClick={() => setTransactionModal('transfer')} />
                  <QuickActionButton label="Kiểm kê" tone="purple" onClick={() => setTransactionModal('stock-take')} />
                </div>
              </InventoryChartCard>
              <InventoryChartCard title="Nhập kho hôm nay" className="p-2.5">
                <TransactionSummary title="phiếu" count={todayStats.inboundDocs} quantity={todayStats.inboundQty} amount={recentInboundRows.slice(0, 5).reduce((sum: number, tx: any) => sum + transactionAmount(tx), 0)} tone="cyan" />
              </InventoryChartCard>
              <InventoryChartCard title="Xuất kho hôm nay" className="p-2.5">
                <TransactionSummary title="phiếu" count={todayStats.outboundDocs} quantity={todayStats.outboundQty} amount={recentOutboundRows.slice(0, 5).reduce((sum: number, tx: any) => sum + transactionAmount(tx), 0)} tone="amber" />
              </InventoryChartCard>
            </div>
            <InventoryPanel>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Tồn kho vật tư</h3>
                <button onClick={() => setOverviewPopup('stock-full')} className="text-xs text-cyan-300 hover:text-cyan-200">Xem tất cả</button>
              </div>
              <div className={`${inventoryTableShell} min-h-[354px] overflow-auto`}>
                <table className="w-full min-w-[980px] text-xs">
                  <thead className={inventoryTableHead}>
                    <tr>
                      <th className="px-2 py-2 text-left font-medium">Mã vật tư</th>
                      <th className="px-2 py-2 text-left font-medium">Tên vật tư</th>
                      <th className="px-2 py-2 text-left font-medium">Quy cách</th>
                      <th className="px-2 py-2 text-left font-medium">ĐVT</th>
                      <th className="px-2 py-2 text-right font-medium">Tồn kho</th>
                      <th className="px-2 py-2 text-right font-medium">Đơn giá</th>
                      <th className="px-2 py-2 text-right font-medium">Giá trị</th>
                      <th className="px-2 py-2 text-left font-medium">Vị trí</th>
                      <th className="px-2 py-2 text-left font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRows.map((item: any) => {
                      const status = statusOf(item)
                      return (
                        <tr key={item.id} className={`cursor-pointer ${inventoryTableRow}`} onClick={() => setSelectedMaterialId(String(item.id))}>
                          <td className="px-2 py-1.5 text-cyan-300">{item.code}</td>
                          <td className="max-w-[180px] truncate px-2 py-1.5 text-white">{item.name}</td>
                          <td className="max-w-[150px] truncate px-2 py-1.5 text-slate-300">{item.materialType ?? item.specification ?? '-'}</td>
                          <td className="px-2 py-1.5 text-slate-300">{item.unit ?? '-'}</td>
                          <td className="px-2 py-1.5 text-right text-slate-200">{formatQty(item.quantity)}</td>
                          <td className="px-2 py-1.5 text-right text-slate-300">{money(item.averageCost)}</td>
                          <td className="px-2 py-1.5 text-right font-medium text-cyan-300">{money(item.inventoryValue)}</td>
                          <td className="px-2 py-1.5">
                            <span title={rowLocations(item).map(locationLabel).join('\n')} className="inline-flex max-w-44 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-cyan-100">
                              {displayLocation(item)}
                            </span>
                          </td>
                          <td className="px-2 py-1.5">
                            <span className={status === 'OUT' ? 'rounded bg-red-500/10 px-2 py-1 text-red-300' : status === 'LOW' ? 'rounded bg-amber-500/10 px-2 py-1 text-amber-300' : 'rounded bg-emerald-500/10 px-2 py-1 text-emerald-300'}>
                              {statusLabel(status)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <InventoryPagination page={activePage} pageCount={pageCount} total={filteredRows.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
            </InventoryPanel>

            <div className={`grid grid-cols-1 md:grid-cols-2 ${inventoryGridGap}`}>
              <RecentTransactionCard title="Nhập kho gần đây" rows={recentInboundRows.slice(0, 5)} tone="cyan" onViewAll={() => setOverviewPopup('recent-inbound')} />
              <RecentTransactionCard title="Xuất kho gần đây" rows={recentOutboundRows.slice(0, 5)} tone="amber" onViewAll={() => setOverviewPopup('recent-outbound')} />
            </div>
          </div>

          <div className="space-y-3 xl:col-span-4">
            <InventoryChartCard title="Tổng quan tồn kho" note="Theo vị trí thực tế">
              <CompactDonutSummary segments={zoneSegments} centerValue={formatQty(summary.totalQty)} centerLabel="tấn" />
            </InventoryChartCard>
            <InventoryChartCard title="Giá trị tồn kho" note={money(summary.totalValue)}>
              <CompactTrendChart rows={valueTrend} />
            </InventoryChartCard>
            <InventoryChartCard
              title="Cảnh báo tồn kho"
              action={<button onClick={() => setOverviewPopup('alerts-full')} className="text-xs text-cyan-300 hover:text-cyan-200">Xem tất cả</button>}
            >
              <AlertRows rows={alerts.slice(0, 6)} />
            </InventoryChartCard>
            <InventoryChartCard title="Cơ cấu nhóm vật tư" note="Tỷ trọng tồn kho">
              <CompactDonutSummary segments={categorySegments} centerValue={formatQty(summary.totalQty)} centerLabel="tấn" />
            </InventoryChartCard>
          </div>
        </div>

        <InventoryChartCard title="Tình trạng kho">
          <div className="grid grid-cols-1 items-center gap-4 text-xs md:grid-cols-[220px_1fr_auto_auto_auto]">
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-slate-500">Kho chính</span>
              <select value={warehouseFilter} onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1) }} className={`${inventoryInput} h-8 rounded-lg text-xs`}>
                <option value="">Tất cả kho</option>
                {warehouseOptions.map((warehouse) => <option key={warehouse.value} value={warehouse.value}>{warehouse.label}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatusMetric label="Tổng mã" value={selectedWarehouseStat.total} tone="cyan" />
              <StatusMetric label="Sắp hết hàng" value={selectedWarehouseStat.low} tone="amber" />
              <StatusMetric label="Hết hàng" value={selectedWarehouseStat.out} tone="red" />
              <StatusMetric label="Cảnh báo khác" value={Math.max(0, alerts.length - selectedWarehouseStat.low - selectedWarehouseStat.out)} tone="amber" />
            </div>
            <div className="hidden h-10 border-l border-white/10 md:block" />
            <div className="text-slate-400">Cập nhật cuối<br /><span className="text-white">{new Date().toLocaleTimeString('vi-VN')}</span></div>
            <div className="text-emerald-300">An toàn<br /><span className="font-semibold">{selectedWarehouseStat.out > 0 ? 'Theo dõi' : 'Bình thường'}</span></div>
          </div>
        </InventoryChartCard>
      </div>

      <InventoryMaterialDetailModal
        open={Boolean(selectedMaterialId && selectedMaterialDetail)}
        detail={selectedMaterialDetail}
        onClose={() => setSelectedMaterialId('')}
      />

      {overviewPopup && (
        <OverviewModal
          type={overviewPopup}
          onClose={() => setOverviewPopup(null)}
          rows={filteredRows}
          alerts={alerts}
          inboundRows={recentInboundRows}
          outboundRows={recentOutboundRows}
        />
      )}
      <InboundTransactionModal open={transactionModal === 'inbound'} onClose={() => setTransactionModal(null)} />
      <OutboundTransactionModal open={transactionModal === 'outbound'} onClose={() => setTransactionModal(null)} />
      <TransferTransactionModal open={transactionModal === 'transfer'} onClose={() => setTransactionModal(null)} />
      <StockTakeTransactionModal open={transactionModal === 'stock-take'} onClose={() => setTransactionModal(null)} />
    </EnterpriseModulePage>
  )
}

function QuickActionButton({ label, tone, onClick }: { label: string; tone: 'blue' | 'emerald' | 'amber' | 'purple'; onClick: () => void }) {
  const toneClass = {
    blue: 'border-blue-400/25 bg-blue-600/18 text-blue-200 hover:bg-blue-600/28',
    emerald: 'border-emerald-400/25 bg-emerald-500/14 text-emerald-200 hover:bg-emerald-500/22',
    amber: 'border-amber-400/25 bg-amber-500/14 text-amber-200 hover:bg-amber-500/22',
    purple: 'border-purple-400/25 bg-purple-500/16 text-purple-200 hover:bg-purple-500/24',
  }[tone]
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded-lg border px-2 text-[11px] font-semibold transition ${toneClass}`}
    >
      {label}
    </button>
  )
}

function StatusMetric({ label, value, tone }: { label: string; value: number; tone: 'cyan' | 'amber' | 'red' }) {
  const toneClass = {
    cyan: 'text-cyan-300',
    amber: 'text-amber-300',
    red: 'text-red-300',
  }[tone]
  return (
    <div className="text-center md:text-left">
      <div className={`text-base font-semibold ${toneClass}`}>{value.toLocaleString('vi-VN')}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  )
}

function TransactionSummary({ title, count, quantity, amount, tone }: { title: string; count: number; quantity: number; amount: number; tone: 'cyan' | 'amber' }) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-end gap-3">
      <div>
        <div className="text-2xl font-semibold text-white">{count}</div>
        <div className="text-[11px] text-slate-500">{title}</div>
      </div>
      <div className="text-right">
        <div className={`text-base font-semibold ${tone === 'cyan' ? 'text-cyan-300' : 'text-amber-300'}`}>{formatQty(quantity)} tấn</div>
        <div className="text-xs text-slate-400">{money(amount)}</div>
      </div>
    </div>
  )
}

function RecentTransactionCard({ title, rows, tone, onViewAll }: { title: string; rows: any[]; tone: 'cyan' | 'amber'; onViewAll: () => void }) {
  return (
    <InventoryChartCard title={title} action={<button onClick={onViewAll} className="text-xs text-cyan-300 hover:text-cyan-200">Xem tất cả</button>}>
      <div className="space-y-0.5">
        {rows.map((row: any) => {
          const line = firstLine(row)
          const date = transactionDate(row)
          return (
            <div key={row.id} className="grid grid-cols-[92px_1fr_76px_52px_58px] items-center gap-2 border-b border-white/8 px-1.5 py-1.5 text-xs last:border-b-0">
              <div className={`truncate font-medium ${tone === 'cyan' ? 'text-cyan-300' : 'text-blue-300'}`}>{row.transactionNo ?? row.code}</div>
              <div className="truncate text-slate-300">{line?.inventoryItem?.name ?? row.projectName ?? row.supplierName ?? line?.inventoryItem?.code ?? '-'}</div>
              <div className="text-slate-400">{date ? date.toLocaleDateString('vi-VN') : '-'}</div>
              <div className="text-right text-white">{formatQty(transactionQuantity(row))}</div>
              <div className="text-right text-emerald-300">{tone === 'cyan' ? 'Đã nhập' : 'Đã xuất'}</div>
            </div>
          )
        })}
        {rows.length === 0 ? <div className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-5 text-center text-sm text-slate-500">Chưa có giao dịch.</div> : null}
      </div>
    </InventoryChartCard>
  )
}

function AlertRows({ rows }: { rows: any[] }) {
  return (
    <div className="h-[150px] space-y-1.5 overflow-hidden text-xs">
      {rows.map((row: any) => {
        const status = row.stockStatus ?? statusOf(row)
        return (
          <div key={row.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-2.5 py-1.5">
            <span className={status === 'OUT' ? 'truncate text-red-300' : 'truncate text-amber-300'}>{row.name ?? row.code}</span>
            <span className="text-slate-400">Tồn còn: {formatQty(row.quantity)}</span>
            <span className={status === 'OUT' ? 'rounded bg-red-500/10 px-2 py-0.5 text-red-300' : 'rounded bg-amber-500/10 px-2 py-0.5 text-amber-300'}>{statusLabel(status)}</span>
          </div>
        )
      })}
      {rows.length === 0 ? <div className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-5 text-center text-sm text-slate-500">Không có cảnh báo tồn kho.</div> : null}
    </div>
  )
}

function OverviewModal({
  type,
  onClose,
  rows,
  alerts,
  inboundRows,
  outboundRows,
}: {
  type: 'recent-inbound' | 'recent-outbound' | 'stock-full' | 'alerts-full'
  onClose: () => void
  rows: any[]
  alerts: any[]
  inboundRows: any[]
  outboundRows: any[]
}) {
  const title = {
    'recent-inbound': 'Toàn bộ nhập kho gần đây',
    'recent-outbound': 'Toàn bộ xuất kho gần đây',
    'stock-full': 'Tồn kho vật tư',
    'alerts-full': 'Tất cả cảnh báo tồn kho',
  }[type]
  const txRows = type === 'recent-inbound' ? inboundRows : outboundRows

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-[#08111f]/95 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className={inventoryMutedButton}>Đóng</button>
        </div>
        <div className="max-h-[74vh] overflow-auto p-4">
          {(type === 'recent-inbound' || type === 'recent-outbound') ? (
            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full min-w-[820px] text-sm">
                <thead className={inventoryTableHead}>
                  <tr>
                    <th className="px-3 py-2 text-left">Thời gian</th>
                    <th className="px-3 py-2 text-left">Mã giao dịch</th>
                    <th className="px-3 py-2 text-left">Mã vật tư</th>
                    <th className="px-3 py-2 text-left">Tên vật tư</th>
                    <th className="px-3 py-2 text-right">Số lượng</th>
                    <th className="px-3 py-2 text-right">Giá trị</th>
                  </tr>
                </thead>
                <tbody>
                  {txRows.map((row: any) => {
                    const line = firstLine(row)
                    const date = transactionDate(row)
                    return (
                      <tr key={row.id} className={inventoryTableRow}>
                        <td className="px-3 py-2">{date ? date.toLocaleString('vi-VN') : '-'}</td>
                        <td className="px-3 py-2 text-cyan-300">{row.transactionNo ?? row.code}</td>
                        <td className="px-3 py-2">{line?.inventoryItem?.code ?? row.itemCode ?? '-'}</td>
                        <td className="px-3 py-2">{line?.inventoryItem?.name ?? '-'}</td>
                        <td className="px-3 py-2 text-right">{formatQty(transactionQuantity(row))}</td>
                        <td className="px-3 py-2 text-right text-cyan-300">{money(transactionAmount(row))}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : null}

          {type === 'stock-full' ? (
            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full min-w-[980px] text-sm">
                <thead className={inventoryTableHead}>
                  <tr>
                    <th className="px-3 py-2 text-left">Mã vật tư</th>
                    <th className="px-3 py-2 text-left">Tên vật tư</th>
                    <th className="px-3 py-2 text-left">Loại vật tư</th>
                    <th className="px-3 py-2 text-left">Quy cách</th>
                    <th className="px-3 py-2 text-right">Tồn</th>
                    <th className="px-3 py-2 text-right">Giá trị</th>
                    <th className="px-3 py-2 text-left">Vị trí</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item: any) => (
                    <tr key={item.id} className={inventoryTableRow}>
                      <td className="px-3 py-2 text-cyan-300">{item.code}</td>
                      <td className="px-3 py-2">{item.name}</td>
                      <td className="px-3 py-2">{materialUsageLabel(item.materialUsageType)}</td>
                      <td className="px-3 py-2">{item.materialType ?? item.specification ?? '-'}</td>
                      <td className="px-3 py-2 text-right">{formatQty(item.quantity)}</td>
                      <td className="px-3 py-2 text-right text-cyan-300">{money(item.inventoryValue)}</td>
                      <td className="px-3 py-2">{displayLocation(item)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {type === 'alerts-full' ? (
            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full min-w-[820px] text-sm">
                <thead className={inventoryTableHead}>
                  <tr>
                    <th className="px-3 py-2 text-left">Mã vật tư</th>
                    <th className="px-3 py-2 text-left">Tên vật tư</th>
                    <th className="px-3 py-2 text-right">Tồn còn</th>
                    <th className="px-3 py-2 text-right">Tồn tối thiểu</th>
                    <th className="px-3 py-2 text-left">Mức cảnh báo</th>
                    <th className="px-3 py-2 text-left">Vị trí</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((item: any) => {
                    const status = item.stockStatus ?? statusOf(item)
                    return (
                      <tr key={item.id} className={inventoryTableRow}>
                        <td className="px-3 py-2 text-cyan-300">{item.code}</td>
                        <td className="px-3 py-2">{item.name}</td>
                        <td className="px-3 py-2 text-right">{formatQty(item.quantity)}</td>
                        <td className="px-3 py-2 text-right">{formatQty(item.minimumStock ?? 5)}</td>
                        <td className="px-3 py-2">
                          <span className={status === 'OUT' ? 'rounded bg-red-500/10 px-2 py-1 text-red-300' : 'rounded bg-amber-500/10 px-2 py-1 text-amber-300'}>{statusLabel(status)}</span>
                        </td>
                        <td className="px-3 py-2">{displayLocation(item)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
