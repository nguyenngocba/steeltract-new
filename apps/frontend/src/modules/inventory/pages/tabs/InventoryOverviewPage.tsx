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
import { CircleDollarSign, PackageCheck, RefreshCw, ShieldX, TriangleAlert, Package } from 'lucide-react'
import { formatCurrencyVnd, formatQuantity } from '@/shared/utils/number-format'

const PAGE_SIZE = 10
const donutColors = ['#1d7cff', '#14c987', '#7c3aed', '#f59e0b', '#ef4444', '#06b6d4']
const compactInput =
  'h-9 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-950/65'

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
  return formatCurrencyVnd(num(v))
}

function formatQty(v: any) {
  return formatQuantity(num(v), 2)
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
function transactionDateKey(tx: any, length: number) {
  return String(tx.transactionDate ?? tx.createdAt ?? '').slice(0, length)
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
      <span className="mb-0 block text-[12px] font-medium text-slate-400">{label}</span>
      {children}
    </label>
  )
}
// ================= COMPONENT SPARKLINE =================
function KpiSparkline({ values, line, fill }: { values: number[]; line: string; fill: string }) {
  const rows = values.length ? values : [0, 0, 0, 0, 0, 0]
  const min = Math.min(...rows)
  const max = Math.max(...rows)
  const range = Math.max(1, max - min)
  const points = rows.map((value, index) => {
    const x = rows.length <= 1 ? 0 : (index / (rows.length - 1)) * 100
    const y = 34 - ((value - min) / range) * 24 - 5
    return `${x},${y}`
  }).join(' ')
  return (
    <svg viewBox="0 0 100 34" preserveAspectRatio="none" className="absolute inset-x-3 bottom-1 h-9 w-[calc(100%-24px)] opacity-95">
      <polyline points={`0,34 ${points} 100,34`} fill={fill} stroke="none" />
      <polyline points={points} fill="none" stroke={line} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

// ================= COMPONENT METRIC CARD =================
function OverviewMetricCard({
  title,
  value,
  note,
  tone = 'blue',
  icon,
  trend,
  active,
  onClick,
}: {
  title: string
  value: string
  note?: string
  tone?: 'blue' | 'emerald' | 'cyan' | 'amber' | 'red' | 'purple'
  icon: React.ReactNode
  trend: number[]
  active?: boolean
  onClick?: () => void
}) {
  const color: Record<string, { text: string; bg: string; line: string; fill: string; note: string }> = {
    blue: { text: 'text-blue-300', bg: 'bg-blue-500/10', line: '#1d7cff', fill: 'rgba(29,124,255,0.24)', note: 'text-emerald-400' },
    emerald: { text: 'text-emerald-300', bg: 'bg-emerald-500/10', line: '#10b981', fill: 'rgba(16,185,129,0.22)', note: 'text-emerald-400' },
    cyan: { text: 'text-cyan-300', bg: 'bg-cyan-500/10', line: '#06b6d4', fill: 'rgba(6,182,212,0.22)', note: 'text-emerald-400' },
    amber: { text: 'text-amber-300', bg: 'bg-amber-500/10', line: '#f59e0b', fill: 'rgba(245,158,11,0.18)', note: 'text-red-400' },
    red: { text: 'text-red-300', bg: 'bg-red-500/10', line: '#ef4444', fill: 'rgba(239,68,68,0.18)', note: 'text-red-400' },
    purple: { text: 'text-purple-300', bg: 'bg-purple-500/10', line: '#a855f7', fill: 'rgba(168,85,247,0.18)', note: 'text-emerald-400' },
  }
  const item = color[tone]
  const content = (
    <>
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{title}</div>
          <div className="mt-2 truncate text-xl font-semibold tracking-tight text-white">{value}</div>
          {note ? <div className={`mt-1 truncate text-[11px] font-semibold ${item.note}`}>{note}</div> : null}
        </div>
        <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${item.bg} ${item.text}`}>
          {icon}
        </div>
      </div>
      <KpiSparkline values={trend} line={item.line} fill={item.fill} />
    </>
  )
  const className = `relative h-[108px] overflow-hidden rounded-xl border bg-slate-950/45 p-3 text-left shadow-[0_14px_42px_rgba(0,0,0,0.2)] ring-1 ring-white/[0.025] transition ${
    active ? 'border-cyan-400/55 bg-cyan-400/10' : 'border-white/10'
  } ${onClick ? 'cursor-pointer hover:border-cyan-400/35 hover:bg-white/[0.055]' : ''}`
  if (onClick) return <button type="button" onClick={onClick} className={className}>{content}</button>
  return <section className={className}>{content}</section>
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
  const recentTransferRows = useMemo(
    () =>
      transactions.filter(
        (x: any) => String(x.type ?? '').toUpperCase() === 'TRANSFER',
      ),
    [transactions],
  )
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
  const kpiTrend = useMemo(() => {
  const txRows = transactionRows(transactionsData)
  const now = new Date()
  const months = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    return { key }
  })
  // Quantity trend
  const qtyMovements = months.map(({ key }) =>
    txRows.filter(tx => transactionDateKey(tx, 7) === key).reduce((sum, tx) => {
      const type = String(tx.type ?? '').toUpperCase()
      const qty = transactionQuantity(tx)
      if (type === 'OUTBOUND') return sum - qty
      if (type === 'INBOUND' || type === 'ADJUSTMENT' || type === 'RETURN') return sum + qty
      return sum
    }, 0)
  )
  let runningQty = Math.max(0, summary.totalQty - qtyMovements.reduce((a, b) => a + b, 0))
  const quantityTrend = qtyMovements.map(m => { runningQty = Math.max(0, runningQty + m); return runningQty })
  // Value trend (dùng valueTrend đã có)
  const valueTrendValues = valueTrend.map(row => row.value)
  // Low, Out, Consumable trend (tạm tính dựa trên dữ liệu hiện tại)
  const lowTrend = Array(6).fill(0).map((_, i) => Math.max(0, summary.low + Math.floor(i * summary.low / 5)))
  const outTrend = Array(6).fill(0).map((_, i) => Math.max(0, summary.out + Math.floor(i * summary.out / 5)))
  const consumableTrend = Array(6).fill(0).map((_, i) => Math.max(0, summary.consumableValue / 1e6 + i * 0.5))
  return {
    value: valueTrendValues,
    quantity: quantityTrend,
    low: lowTrend,
    out: outTrend,
    consumable: consumableTrend,
  }
}, [transactionsData, summary.totalQty, summary.totalValue, summary.low, summary.out, summary.consumableValue, valueTrend])

const kpiDeltas = useMemo(() => {
  const percent = (arr: number[]) => {
    const prev = arr.at(-2) ?? 0
    const curr = arr.at(-1) ?? 0
    if (!prev) return curr ? '+ mới' : '+ 0%'
    const delta = ((curr - prev) / Math.abs(prev)) * 100
    return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}% so với tháng trước`
  }
  return {
    value: percent(kpiTrend.value),
    quantity: percent(kpiTrend.quantity),
    low: percent(kpiTrend.low),
    out: percent(kpiTrend.out),
    consumable: percent(kpiTrend.consumable),
  }
}, [kpiTrend])

  const alerts = useMemo(() => {
    return filteredRows
      .map((item: any) => ({ ...item, stockStatus: statusOf(item) }))
      .filter((item: any) => item.stockStatus !== 'NORMAL')
      .sort((a: any, b: any) => num(a.quantity) - num(b.quantity))
  }, [filteredRows])

  const todayStats = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10)

    const inboundToday = recentInboundRows.filter(
      (tx: any) => String(tx.transactionDate ?? tx.createdAt).slice(0, 10) === todayKey,
    )

    const outboundToday = recentOutboundRows.filter(
      (tx: any) => String(tx.transactionDate ?? tx.createdAt).slice(0, 10) === todayKey,
    )

    const transferToday = recentTransferRows.filter(
      (tx: any) => String(tx.transactionDate ?? tx.createdAt).slice(0, 10) === todayKey,
    )

    return {
      inboundDocs: inboundToday.length,
      inboundQty: inboundToday.reduce(
        (sum: number, tx: any) => sum + transactionQuantity(tx),
        0,
      ),

      outboundDocs: outboundToday.length,
      outboundQty: outboundToday.reduce(
        (sum: number, tx: any) => sum + transactionQuantity(tx),
        0,
      ),

      transferDocs: transferToday.length,
      transferQty: transferToday.reduce(
        (sum: number, tx: any) => sum + transactionQuantity(tx),
        0,
      ),
    }
  }, [
    recentInboundRows,
    recentOutboundRows,
    recentTransferRows,
  ])

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

      <div className="space-y-1 -mt-2">
        <div className="grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-6 gap-1">
          <OverviewMetricCard
            title="Tổng giá trị tồn kho"
            value={formatCurrencyVnd(summary.totalValue)}
            note={kpiDeltas.value}
            tone="blue"
            icon={<CircleDollarSign size={15} />}
            trend={kpiTrend.value}
          />
          <OverviewMetricCard
            title="Tổng khối lượng"
            value={`${formatQuantity(summary.totalQty, 0)} tấn`}
            note={kpiDeltas.quantity}
            tone="cyan"
            icon={<RefreshCw size={15} />}
            trend={kpiTrend.quantity}
          />
          <OverviewMetricCard
            title="Mã vật tư"
            value={formatQuantity(summary.totalItems, 0)}
            note="Đang theo dõi"
            tone="emerald"
            icon={<PackageCheck size={15} />}
            trend={kpiTrend.quantity}
          />
          <OverviewMetricCard
            title="Sắp hết hàng"
            value={formatQuantity(summary.low, 0)}
            note={kpiDeltas.low}
            tone="amber"
            icon={<TriangleAlert size={15} />}
            trend={kpiTrend.low}
          />
          <OverviewMetricCard
            title="Hết hàng"
            value={formatQuantity(summary.out, 0)}
            note={kpiDeltas.out}
            tone="red"
            icon={<ShieldX size={15} />}
            trend={kpiTrend.out}
          />
          <OverviewMetricCard
            title="Vật tư tiêu hao"
            value={formatCurrencyVnd(summary.consumableValue)}
            note={kpiDeltas.consumable}
            tone="purple"
            icon={<Package size={15} />}
            trend={kpiTrend.consumable}
          />
        </div>

        <InventoryPanel className="rounded-xl">
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-[180px_180px_180px_180px_minmax(260px,1fr)_130px_120px]">
            <LabeledFilter label="">
              <select value={warehouseFilter} onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1) }} className={compactInput}>
                <option value="">Tất cả kho</option>
                {warehouseOptions.map((warehouse) => 
                <option key={warehouse.value} value={warehouse.value}>
                  {warehouse.label}
                </option>)}
              </select>
            </LabeledFilter>
			    <LabeledFilter label="">
              <select
                value={usageFilter}
                onChange={(e) => {
                  setUsageFilter(e.target.value)
                  setPage(1)
                }}
                className={compactInput}
              >
                <option value="">Tất cả loại vật tư</option>
                <option value="PRIMARY">Vật tư chính</option>
                <option value="SECONDARY">Vật tư phụ</option>
                <option value="CONSUMABLE">Vật tư tiêu hao</option>
              </select>
            </LabeledFilter>
            <LabeledFilter label="">
              <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }} className={compactInput}>
                <option value="">Tất cả nhóm vật tư</option>
                {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </LabeledFilter>
            <LabeledFilter label="">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className={compactInput}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="NORMAL">Bình thường</option>
                <option value="LOW">Sắp hết</option>
                <option value="OUT">Hết hàng</option>
              </select>
            </LabeledFilter>
            <LabeledFilter label="">
              <input
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applySearch()
                }}
                placeholder="Mã, tên, quy cách, nhà cung cấp..."
                className={compactInput}
              />
            </LabeledFilter>
            <button onClick={applySearch} className="h-9 self-end rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500">
              Tìm kiếm
            </button>
            <button onClick={resetFilters} className="h-9 self-end rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
              Làm mới
            </button>
          </div>
        </InventoryPanel>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-1">
          <div className="space-y-1 xl:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-1">
              <InventoryChartCard title="Thao tác nhanh" className="p-1.5">
                <div className="grid grid-cols-2 gap-1 md:grid-cols-4">
                  <QuickActionButton label="Nhập kho" tone="blue" onClick={() => setTransactionModal('inbound')} />
                  <QuickActionButton label="Xuất kho" tone="amber" onClick={() => setTransactionModal('outbound')} />
                  <QuickActionButton label="Điều chuyển" tone="purple" onClick={() => setTransactionModal('transfer')} />
                  <QuickActionButton label="Kiểm kê" tone="emerald" onClick={() => setTransactionModal('stock-take')} />
                </div>
              </InventoryChartCard>
              <InventoryChartCard title="Nhập kho hôm nay" className="border-cyan-500/20 bg-cyan-500/5">
                <TransactionSummary title="phiếu" count={todayStats.inboundDocs} quantity={todayStats.inboundQty} amount={recentInboundRows.slice(0, 5).reduce((sum: number, tx: any) => sum + transactionAmount(tx), 0)} tone="cyan" />
              </InventoryChartCard>
              <InventoryChartCard title="Xuất kho hôm nay" className="border-amber-500/20 bg-amber-500/5">
                <TransactionSummary title="phiếu" count={todayStats.outboundDocs} quantity={todayStats.outboundQty} amount={recentOutboundRows.slice(0, 5).reduce((sum: number, tx: any) => sum + transactionAmount(tx), 0)} tone="amber" />
              </InventoryChartCard>
              <InventoryChartCard title="Điều chuyển hôm nay" className="border-purple-500/20 bg-purple-500/5 p-1.5">
                <TransactionSummary title="phiếu" count={todayStats.transferDocs} quantity={todayStats.transferQty} amount={0} tone="purple" />
              </InventoryChartCard>
            </div>
            <InventoryPanel>
              <div className="mb-1 flex items-center justify-between gap-3">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Tồn kho vật tư</h3>
                <button onClick={() => setOverviewPopup('stock-full')} className="text-xs text-cyan-300 hover:text-cyan-200">Xem tất cả</button>
              </div>
              <div className={`${inventoryTableShell} h-[425px] overflow-auto`}>
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
                          <td className="max-w-[120px] truncate px-2 py-1.5 text-cyan-300" title={item.code}>{item.code}</td>
                          <td className="max-w-[160px] truncate px-2 py-1.5 text-white" title={item.name}>{item.name}</td>
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
                            <span
                              className={`inline-flex rounded-lg border px-2 py-1 text-xs ${
                                status === 'OUT'
                                  ? 'border-red-400/30 bg-red-500/10 text-red-300'
                                  : status === 'LOW'
                                  ? 'border-amber-400/30 bg-amber-500/10 text-amber-300'
                                  : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                              }`}
                            >
                              {statusLabel(status)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <OverviewPagination page={activePage} pageCount={pageCount} total={filteredRows.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
            </InventoryPanel>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <RecentTransactionCard title="Nhập kho gần đây" rows={recentInboundRows.slice(0, 5)} tone="cyan" onViewAll={() => setOverviewPopup('recent-inbound')} />
              <RecentTransactionCard title="Xuất kho gần đây" rows={recentOutboundRows.slice(0, 5)} tone="amber" onViewAll={() => setOverviewPopup('recent-outbound')} />
            </div>
          </div>

          <div className="space-y-1 xl:col-span-4">
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
      <div className={`text-base font-semibold ${toneClass}`}>{formatQuantity(value, 0)}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  )
}

function TransactionSummary({ title, count, quantity, amount, tone }: { title: string; count: number; quantity: number; amount: number; tone: 'cyan' | 'amber' | 'purple' }) {
  const toneClass = {
    cyan: 'text-cyan-300',
    amber: 'text-amber-300',
    purple: 'text-purple-300',
  }[tone]
  return (
    <div className="grid grid-cols-[auto_1fr] items-end gap-3">
      <div>
        <div className={`text-2xl font-semibold ${toneClass}`}>
          {count}
        </div>

        <div className="text-[11px] text-slate-500">
          {title}
        </div>
      </div>

      <div className="text-right">
        <div className={`text-base font-semibold ${toneClass}`}>
          {formatQty(quantity)} tấn
        </div>

        <div className="text-xs text-slate-400">
          {money(amount)}
        </div>
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
function OverviewPagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
}: {
  page: number
  pageCount: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}) {
  const safePageCount = Math.max(1, pageCount)
  const safePage = Math.min(Math.max(1, page), safePageCount)
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const end = Math.min(safePage * pageSize, total)
  const windowSize = 5
  const firstPage = Math.max(1, Math.min(safePage - 2, safePageCount - windowSize + 1))
  const pages = Array.from({ length: Math.min(windowSize, safePageCount) }, (_, index) => firstPage + index)

  return (
    <div className="grid grid-cols-1 items-center gap-1 px-4 py-1 text-xs text-slate-400 md:grid-cols-3">
      <div>
        Hiển thị {start}-{end}/{formatQuantity(total, 0)} kết quả
      </div>
      <div className="flex justify-center gap-2">
        {pages[0] > 1 && <span className="px-1 py-2 text-slate-500">...</span>}
        {pages.map((pageNo) => (
          <button
            key={pageNo}
            onClick={() => onPageChange(pageNo)}
            className={`h-8 min-w-8 rounded-xl border px-2 transition ${
              safePage === pageNo
                ? 'border-blue-400 bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'border-white/10 bg-white/[0.045] text-slate-300 hover:border-cyan-400/40 hover:bg-cyan-400/10'
            }`}
          >
            {pageNo}
          </button>
        ))}
        {pages[pages.length - 1] < safePageCount && <span className="px-1 py-2 text-slate-500">...</span>}
      </div>
      <div className="flex justify-start gap-2 md:justify-end">
        <button disabled={safePage <= 1} onClick={() => onPageChange(Math.max(1, safePage - 1))} className={inventoryMutedButton}>
          Trước
        </button>
        <button disabled={safePage >= safePageCount} onClick={() => onPageChange(Math.min(safePageCount, safePage + 1))} className={inventoryMutedButton}>
          Sau
        </button>
      </div>
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
                        <td className="px-3 py-2">{date ? formatQuantity(date, 0) : '-'}</td>
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
