import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { InventoryMaterialDetailModal } from '../../components/InventoryMaterialDetailModal'
import {
  AdjustmentTransactionModal,
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
  HorizontalBars,
} from '../../components/InventoryVisuals'
import { useInventoryTransactions } from '../../hooks/useInventoryTransactions'
import { useMaterialDetail } from '../../hooks/useMaterialDetail'
import { useZones } from '../../hooks/useZones'
import { useInventoryMaterials, useInventoryOverview } from '../../hooks/useInventoryReadModels'
import { CircleDollarSign, Clock, PackageCheck, RefreshCw, ShieldX, TriangleAlert, Package } from 'lucide-react'
import { formatCurrencyVnd, formatDateTime, formatQuantity } from '@/shared/utils/number-format'
import { getReturnRequests } from '../../api/transactions.api'
// ================= CHART CARD COMPONENT =================
function ChartCard({
  title,
  value,
  delta,
  deltaColorClass = 'text-slate-400',
  action,
  children,
  className = 'h-[260px]',
  chartHeightClass = 'h-[150px]',
}: {
  title: string
  value?: string
  delta?: string
  deltaColorClass?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  chartHeightClass?: string
}) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-cyan-300/15 bg-[linear-gradient(135deg,rgba(15,35,59,0.82),rgba(7,18,34,0.72)_55%,rgba(23,31,71,0.62))] shadow-[0_24px_80px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-cyan-400/[0.055] text-left flex flex-col justify-between p-4 ${className}`}>
      <div className="flex items-start justify-between gap-3 shrink-0">
        <div className="flex flex-col justify-start min-h-[40px]">
          <h3 className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{title}</h3>
          {value && <div className="mt-1 truncate text-2xl font-semibold text-white leading-none">{value}</div>}
          {delta && <div className={`mt-1 truncate text-[10px] ${deltaColorClass}`}>{delta}</div>}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={`overflow-hidden shrink-0 ${chartHeightClass}`}>{children}</div>
    </section>
  )
}

// ================= STOCK TREND CHART =================
function StockTrendChart({ rows }: { rows: Array<{ label: string; value: number }> }) {
  if (rows.length === 0) {
    return (
      <div className="grid h-[90px] place-items-center text-xs text-slate-500">
        Dữ liệu sẽ xuất hiện khi phát sinh nghiệp vụ.
      </div>
    )
  }
  const max = Math.max(1, ...rows.map((row) => row.value))
  const points = rows.map((row, index) => {
    const x = rows.length <= 1 ? 0 : (index / (rows.length - 1)) * 100
    const y = 100 - (row.value / max) * 78 - 10
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="h-[90px] flex flex-col justify-between">     {/* giảm từ 140 xuống 90 */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-[65px] w-full overflow-visible">  {/* giảm từ 105 xuống 65 */}
        <defs>
          <linearGradient id="stockTrendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1d7cff" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#1d7cff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={`0,100 ${points} 100,100`} fill="url(#stockTrendFill)" stroke="none" />
        <polyline points={points} fill="none" stroke="#1d7cff" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        {rows.map((row, index) => {
          const x = rows.length <= 1 ? 0 : (index / (rows.length - 1)) * 100
          const y = 100 - (row.value / max) * 78 - 10
          return <circle key={row.label} cx={x} cy={y} r="1.6" fill="#38bdf8" />
        })}
      </svg>
      <div className="grid grid-cols-6 gap-2 text-[10px] text-slate-500">
        {rows.map((row) => <span key={row.label}>{row.label}</span>)}
      </div>
    </div>
  )
}
const PAGE_SIZE = 13
const donutColors = ['#1d7cff', '#14c987', '#7c3aed', '#f59e0b', '#ef4444', '#06b6d4']
const compactInput =
  'h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]'

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
  return formatQuantity(num(v), 3)
}

function materialUsageLabel(value: string | undefined) {
  const map: Record<string, string> = {
    PRIMARY: 'Vật tư chính',
    SECONDARY: 'Vật tư phụ',
    CONSUMABLE: 'Vật tư tiêu hao',
  }
  return map[String(value ?? 'PRIMARY')] ?? 'Vật tư chính'
}

function isMainWarehouseLocation(location: any) {
  const code = String(location?.warehouseCode ?? '').trim().toUpperCase()
  const name = String(location?.warehouseName ?? '').trim().toLowerCase()
  return code === 'MAIN' || name.includes('kho chính') || name.includes('kho chinh')
}

function isProductionWarehouseLocation(location: any) {
  const code = String(location?.warehouseCode ?? '').trim().toUpperCase()
  const name = String(location?.warehouseName ?? '').trim().toLowerCase()
  return code === 'PRODUCTION' || name.includes('sản xuất') || name.includes('san xuat')
}

function allLocationBalances(item: any) {
  return Array.isArray(item.locationBalances) ? item.locationBalances : []
}

function mainWarehouseStock(item: any) {
  return allLocationBalances(item)
    .filter(isMainWarehouseLocation)
    .reduce((sum: number, location: any) => sum + num(location.quantity), 0)
}

function productionWarehouseStock(item: any) {
  return allLocationBalances(item)
    .filter(isProductionWarehouseLocation)
    .reduce((sum: number, location: any) => sum + num(location.quantity), 0)
}

function totalWarehouseStock(item: any) {
  const balances = allLocationBalances(item)
  if (balances.length) {
    return balances.reduce((sum: number, location: any) => sum + num(location.quantity), 0)
  }
  return num(item.currentStock ?? item.quantity)
}

function statusOf(item: any) {
  const stock = mainWarehouseStock(item)
  const min = num(item.minimumStock ?? 5)
  if (stock <= 0) return 'OUT'
  if (min > 0 && stock <= min) return 'LOW'
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

function transactionItems(tx: any) {
  return Array.isArray(tx?.items) ? tx.items : []
}

function transactionMaterialText(tx: any, field: 'code' | 'name') {
  const values = Array.from(
    new Set(
      transactionItems(tx)
        .map((line: any) => String(line?.inventoryItem?.[field] ?? '').trim())
        .filter(Boolean),
    ),
  )
  return values.join(', ')
}

function transactionQuantity(tx: any) {
  const items = Array.isArray(tx.items) ? tx.items : []
  if (items.length) {
    const transfer = String(tx?.type ?? '').toUpperCase() === 'TRANSFER'
    return items.reduce(
      (sum: number, line: any) =>
        sum + (transfer ? Math.max(0, num(line.quantity)) : Math.abs(num(line.quantity))),
      0,
    )
  }
  return Math.abs(num(tx.totalQuantity ?? tx.quantity))
}

function transactionAmount(tx: any) {
  const items = Array.isArray(tx.items) ? tx.items : []
  if (items.length) {
    const transfer = String(tx?.type ?? '').toUpperCase() === 'TRANSFER'
    return items.reduce((sum: number, line: any) => {
      if (transfer && num(line?.quantity) <= 0) return sum
      return sum + Math.abs(num(line.totalAmount ?? num(line.quantity) * num(line.unitPrice)))
    }, 0)
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
  noteClassName,
  tone = 'blue',
  icon,
  trend,
  active,
  onClick,
  isLoading,
}: {
  title: string
  value: React.ReactNode
  note?: string
  noteClassName?: string
  tone?: 'blue' | 'emerald' | 'cyan' | 'amber' | 'red' | 'purple' | 'indigo' | 'violet' | 'orange'
  icon: React.ReactNode
  trend?: number[]
  active?: boolean
  onClick?: () => void
  isLoading?: boolean
}) {
  const color: Record<string, { text: string; bg: string; line: string; fill: string; note: string }> = {
    blue: { text: 'text-blue-300', bg: 'bg-blue-500/10', line: '#1d7cff', fill: 'rgba(29,124,255,0.24)', note: 'text-emerald-400' },
    emerald: { text: 'text-emerald-300', bg: 'bg-emerald-500/10', line: '#10b981', fill: 'rgba(16,185,129,0.22)', note: 'text-emerald-400' },
    cyan: { text: 'text-cyan-300', bg: 'bg-cyan-500/10', line: '#06b6d4', fill: 'rgba(6,182,212,0.22)', note: 'text-emerald-400' },
    amber: { text: 'text-amber-300', bg: 'bg-amber-500/10', line: '#f59e0b', fill: 'rgba(245,158,11,0.18)', note: 'text-red-400' },
    red: { text: 'text-red-300', bg: 'bg-red-500/10', line: '#ef4444', fill: 'rgba(239,68,68,0.18)', note: 'text-red-400' },
    purple: { text: 'text-purple-300', bg: 'bg-purple-500/10', line: '#a855f7', fill: 'rgba(168,85,247,0.18)', note: 'text-emerald-400' },
    indigo: { text: 'text-indigo-300', bg: 'bg-indigo-500/10', line: '#6366f1', fill: 'rgba(99,102,241,0.22)', note: 'text-emerald-400' },
    violet: { text: 'text-violet-300', bg: 'bg-violet-500/10', line: '#8b5cf6', fill: 'rgba(139,92,246,0.22)', note: 'text-emerald-400' },
    orange: { text: 'text-orange-300', bg: 'bg-orange-500/10', line: '#f97316', fill: 'rgba(249,115,22,0.22)', note: 'text-red-400' },
  }

  if (isLoading) {
    return (
      <section className="relative h-[108px] overflow-hidden rounded-xl border border-white/10 bg-[#08111f]/90 p-3 text-left shadow-[0_14px_42px_rgba(0,0,0,0.2)] ring-1 ring-white/[0.025] animate-pulse">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="h-2 w-16 rounded bg-white/10" />
            <div className="h-5 w-24 rounded bg-white/10" />
            <div className="h-2 w-20 rounded bg-white/10" />
          </div>
          <div className="h-8 w-8 rounded-lg bg-white/10 shrink-0" />
        </div>
        <div className="absolute inset-x-3 bottom-1 h-3 rounded bg-white/5" />
      </section>
    )
  }

  const item = color[tone] || color.blue
  const content = (
    <>
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{title}</div>
          <div className="mt-2 truncate text-xl font-semibold tracking-tight text-white">{value}</div>
          {note ? <div className={`mt-1 truncate text-[10px] font-semibold ${noteClassName ?? item.note}`}>{note}</div> : null}
        </div>
        <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${item.bg} ${item.text}`}>
          {icon}
        </div>
      </div>
      {trend && trend.length > 0 && <KpiSparkline values={trend} line={item.line} fill={item.fill} />}
    </>
  )
  const className = `relative h-[108px] overflow-hidden rounded-2xl border border-cyan-300/15 bg-[linear-gradient(135deg,rgba(15,35,59,0.82),rgba(7,18,34,0.72)_55%,rgba(23,31,71,0.62))] shadow-[0_14px_42px_rgba(0,0,0,0.2)] ring-1 ring-cyan-400/[0.055] text-left p-3 transition ${
  active ? 'border-cyan-400/55 bg-cyan-400/10' : ''
} ${onClick ? 'cursor-pointer hover:border-cyan-400/35 hover:bg-white/[0.055]' : ''}`;
  if (onClick) return <button type="button" onClick={onClick} className={className}>{content}</button>
  return <section className={className}>{content}</section>
}

export function InventoryOverviewPage() {
  const navigate = useNavigate()
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('')
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [usageFilter, setUsageFilter] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [transactionModal, setTransactionModal] = useState<null | 'inbound' | 'outbound' | 'transfer' | 'stock-take' | 'adjustment'>(null)
  const [overviewPopup, setOverviewPopup] = useState<null | 'recent-inbound' | 'recent-outbound' | 'stock-full' | 'alerts-full'>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchDraft)
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchDraft])

  const materialQuery = {
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    categoryId: categoryFilter || undefined,
    materialUsageType: usageFilter || undefined,
    warehouse: warehouseFilter || undefined,
    stockStatus: statusFilter || undefined,
    sortBy: 'code' as const,
    sortOrder: 'asc' as const,
  }
  const overviewQuery = {
    search: search || undefined,
    categoryId: categoryFilter || undefined,
    materialUsageType: usageFilter || undefined,
    warehouse: warehouseFilter || undefined,
    stockStatus: statusFilter || undefined,
  }
  const { data: materialsData, isLoading: isLoadingMaterials, refetch: refetchMaterials } =
    useInventoryMaterials(materialQuery)
  const { data: overviewData, isLoading: isLoadingOverview, refetch: refetchOverview } =
    useInventoryOverview(overviewQuery)
  const { data: zones = [] } = useZones()
  const { data: transactionsData = [], isLoading: isLoadingTransactions } =
    useInventoryTransactions({ page: 1, pageSize: 50 })
  const { data: returnRequests = [], isLoading: isLoadingReturns } = useQuery({
    queryKey: ['inventory-return-requests-overview'],
    queryFn: () => getReturnRequests({ flowType: 'SITE_RETURN' }),
  })
  const isLoading = isLoadingMaterials || isLoadingOverview || isLoadingTransactions
  const auditRows = materialsData?.items ?? []

  const { data: selectedMaterialDetail } = useMaterialDetail(selectedMaterialId || undefined)
  const rows = useMemo(() => {
    return (auditRows as any[]).map((item: any) => {
      const averageCost = num(item.averageCost ?? item.unitPrice)
      const mainStock = mainWarehouseStock(item)
      const productionStock = productionWarehouseStock(item)
      const totalStock = totalWarehouseStock(item)
      return {
        ...item,
        id: item.materialId ?? item.inventoryItemId ?? item.id,
        code: item.materialCode ?? item.code,
        name: item.materialName ?? item.name,
        quantity: totalStock,
        mainStock,
        productionStock,
        totalStock,
        averageCost,
        inventoryValue: num(item.inventoryValue ?? totalStock * averageCost),
      }
    })
  }, [auditRows])

  const categoryOptions = useMemo(() => {
    return (overviewData?.facets?.categories ?? [])
      .map((item: any) => String(item.label ?? '').trim())
      .filter(Boolean)
      .sort()
  }, [overviewData])

  const warehouseOptions = useMemo(() => {
    const fromZones = zones
      .map((z: any) => ({
        value: String(z.warehouse?.code ?? z.warehouseCode ?? z.code ?? ''),
        label: String(z.warehouse?.name ?? z.warehouseName ?? z.name ?? z.code ?? ''),
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

  const filteredRows = rows
  const pageCount = materialsData?.totalPages ?? 1
  const activePage = materialsData?.page ?? page
  const pagedRows = rows

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
  const summary = {
    totalItems: num(overviewData?.summary?.totalItems),
    totalQty: num(overviewData?.summary?.totalStock),
    mainQty: num(overviewData?.summary?.mainStock),
    productionQty: num(overviewData?.summary?.productionStock),
    totalValue: num(overviewData?.summary?.totalValue),
    low: num(overviewData?.summary?.lowStock),
    out: num(overviewData?.summary?.outOfStock),
    reserved: 0,
    primaryCount: num(overviewData?.summary?.primaryCount),
    primaryQty: num(overviewData?.summary?.primaryStock),
    secondaryCount: num(overviewData?.summary?.secondaryCount),
    secondaryQty: num(overviewData?.summary?.secondaryStock),
    consumableCount: num(overviewData?.summary?.consumableCount),
    consumableQty: num(overviewData?.summary?.consumableStock),
  }
  const pendingReturns = useMemo(() => {
    const rows = returnRequests.filter((request: any) => ['REQUESTED', 'APPROVED'].includes(request.status))
    const quantity = rows.reduce((sum: number, request: any) => {
      const items = Array.isArray(request.items) ? request.items : []
      return sum + items.reduce((lineSum: number, item: any) => lineSum + num(item.requestedQuantity), 0)
    }, 0)
    return {
      count: rows.length,
      quantity,
      trend: rows.slice(0, 6).map((request: any) => {
        const items = Array.isArray(request.items) ? request.items : []
        return items.reduce((lineSum: number, item: any) => lineSum + num(item.requestedQuantity), 0)
      }),
    }
  }, [returnRequests])

  const zoneSegments = useMemo(() => {
    return (overviewData?.facets?.warehouses ?? [])
      .map((item: any) => [String(item.label), num(item.value)] as [string, number])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value], index) => ({ label, value, color: donutColors[index % donutColors.length] }))
  }, [overviewData])

  const categorySegments = useMemo(() => {
    return (overviewData?.facets?.categories ?? [])
      .map((item: any) => [String(item.label), num(item.value)] as [string, number])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value], index) => ({ label, value, color: donutColors[index % donutColors.length] }))
  }, [overviewData])

  const valueTrend = useMemo(() => {
    return (overviewData?.stockTrend ?? []).slice(-6).map((row: any) => {
      const date = new Date(row.date)
      return {
        label: `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`,
        value: num(row.value),
      }
    })
  }, [overviewData])
  const { kpiTrend, kpiDeltas, kpiNoteColors } = useMemo(() => {
    const stockRows = overviewData?.stockTrend ?? []
    const historicalRows = overviewData?.historicalMetrics ?? []
    const values = stockRows.map((row: any) => num(row.value))
    const quantities = stockRows.map((row: any) => num(row.quantity))
    const metricSeries = (field: string) =>
      historicalRows
        .filter((row: any) => typeof row?.[field] === 'number')
        .map((row: any) => Number(row[field]))
    const deltaText = (series: number[], suffix: string) => {
      if (series.length < 2) return 'Chưa có dữ liệu lịch sử'
      const current = series.at(-1) ?? 0
      const previous = series.at(-2) ?? 0
      const difference = current - previous
      if (difference === 0) return `0 ${suffix} (0%) so với lần ghi nhận trước`
      const percent = previous ? (difference / Math.abs(previous)) * 100 : null
      const value = suffix === 'đ'
        ? formatCurrencyVnd(Math.abs(difference))
        : `${formatQuantity(Math.abs(difference), 1)} ${suffix}`
      return `${difference > 0 ? '▲' : '▼'}${value}${
        percent == null ? '' : ` (${percent > 0 ? '+' : ''}${percent.toFixed(1)}%)`
      } so với lần ghi nhận trước`
    }
    const trend = {
      value: values,
      quantity: quantities,
      low: metricSeries('lowStock'),
      out: metricSeries('outOfStock'),
      primary: metricSeries('primaryStock'),
      secondary: metricSeries('secondaryStock'),
      consumable: metricSeries('consumableStock'),
      items: metricSeries('totalItems'),
    }
    const noteColor = (series: number[], alertMetric = false) => {
      if (series.length < 2) return 'text-slate-400'
      const difference = (series.at(-1) ?? 0) - (series.at(-2) ?? 0)
      if (difference === 0) return 'text-slate-400'
      if (alertMetric) return difference < 0 ? 'text-emerald-400' : 'text-red-400'
      return difference > 0 ? 'text-emerald-400' : 'text-red-400'
    }

    return {
      kpiTrend: trend,
      kpiDeltas: {
        value: deltaText(values, 'đ'),
        quantity: deltaText(quantities, 'tấn'),
        low: deltaText(trend.low, 'mã'),
        out: deltaText(trend.out, 'mã'),
        primary: deltaText(trend.primary, 'tấn'),
        secondary: deltaText(trend.secondary, 'tấn'),
        consumable: deltaText(trend.consumable, 'tấn'),
        items: deltaText(trend.items, 'mã'),
      },
      kpiNoteColors: {
        value: noteColor(values),
        quantity: noteColor(quantities),
        low: noteColor(trend.low, true),
        out: noteColor(trend.out, true),
        primary: noteColor(trend.primary),
        secondary: noteColor(trend.secondary),
        consumable: noteColor(trend.consumable),
        items: noteColor(trend.items),
      },
    }
  }, [overviewData])

  const alerts = useMemo(() => {
    return filteredRows
      .map((item: any) => ({ ...item, stockStatus: statusOf(item) }))
      .filter((item: any) => item.stockStatus !== 'NORMAL')
      .sort((a: any, b: any) => mainWarehouseStock(a) - mainWarehouseStock(b))
  }, [filteredRows])
    const alertsDelta = useMemo(() => {
    // Giả sử bạn có dữ liệu lịch sử, nếu không thì hiển thị "0 cảnh báo mới"
    const current = alerts.length;
    // Nếu không có dữ liệu tháng trước, coi là 0
    const previous = 0; // bạn có thể thay bằng dữ liệu thực tế nếu có
    const diff = current - previous;
      if (diff === 0) return { text: '0 cảnh báo mới (tháng này)', color: 'text-slate-400' };
      if (diff > 0) return { text: `▲ ${diff} cảnh báo mới (tháng này)`, color: 'text-red-400' };
      return { text: `▼ ${Math.abs(diff)} cảnh báo (tháng này)`, color: 'text-red-400' };
    }, [alerts]);

    const quantityDelta = useMemo(() => {
    const trend = kpiTrend.quantity; // mảng 6 giá trị: [tháng 5, tháng 4, ..., hiện tại]
    if (!trend || trend.length < 2) {
      return { text: '0 tấn (0.0%)', color: 'text-slate-400' };
    }
    const current = trend[trend.length - 1];     // tháng hiện tại
    const previous = trend[trend.length - 2];    // tháng trước
    const diff = current - previous;
    const percent = previous > 0 ? (diff / previous) * 100 : 0;
    if (diff === 0) return { text: '0 tấn (0.0%)', color: 'text-slate-400' };
    const formattedDiff = formatQty(Math.abs(diff));
    if (diff > 0) {
      return { text: `▲ ${formattedDiff} tấn (+${percent.toFixed(1)}%)`, color: 'text-emerald-400' };
    }
    return { text: `▼ ${formattedDiff} tấn (${percent.toFixed(1)}%)`, color: 'text-red-400' };
  }, [kpiTrend.quantity]);

  const topMaterials = useMemo(() => {
    return filteredRows
      .map((item: any) => ({
        name: item.name,
        code: item.code,
        quantity: totalWarehouseStock(item),
        value: item.inventoryValue ?? totalWarehouseStock(item) * item.averageCost,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredRows]);

  const todayStats = useMemo(() => {
    const inbound = overviewData?.today?.INBOUND ?? {}
    const outbound = overviewData?.today?.OUTBOUND ?? {}
    const transfer = overviewData?.today?.TRANSFER ?? {}

    return {
      inboundDocs: num(inbound.documents),
      inboundQty: num(inbound.quantity),
      inboundValue: num(inbound.value),
      outboundDocs: num(outbound.documents),
      outboundQty: num(outbound.quantity),
      outboundValue: num(outbound.value),
      transferDocs: num(transfer.documents),
      transferQty: num(transfer.quantity),
      transferValue: num(transfer.value),
    }
  }, [overviewData])

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
    void refetchMaterials()
    void refetchOverview()
  }

  return (
    <EnterpriseModulePage>
      <div className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-4 2xl:grid-cols-5 gap-1">
          <OverviewMetricCard
            title="Tổng giá trị tồn kho"
            value={formatCurrencyVnd(summary.totalValue)}
            note={kpiDeltas.value}
            noteClassName={kpiNoteColors.value}
            tone="emerald"
            icon={<CircleDollarSign size={15} />}
            trend={kpiTrend.value}
            isLoading={isLoading}
          />
          <OverviewMetricCard
            title="Tổng khối lượng"
            value={`${formatQuantity(summary.totalQty, 0)} tấn`}
            note={kpiDeltas.quantity}
            noteClassName={kpiNoteColors.quantity}
            tone="cyan"
            icon={<RefreshCw size={15} />}
            trend={kpiTrend.quantity}
            isLoading={isLoading}
          />
          <OverviewMetricCard
            title="Mã vật tư"
            value={formatQuantity(summary.totalItems, 0)}
            note={kpiDeltas.items}
            noteClassName={kpiNoteColors.items}
            tone="indigo"
            icon={<PackageCheck size={15} />}
            trend={kpiTrend.items}
            isLoading={isLoading}
          />
          <OverviewMetricCard
            title="Vật tư chính"
            value={
              <>
                <span className="text-white font-semibold">{formatQuantity(summary.primaryCount, 0)}</span>{' '}
                <span className="text-slate-400 font-normal text-[14px]">({formatQuantity(summary.primaryQty)} tấn)</span>
              </>
            }
            note={kpiDeltas.primary}
            noteClassName={kpiNoteColors.primary}
            tone="blue"
            icon={<PackageCheck size={15} />}
            trend={kpiTrend.primary}
            isLoading={isLoading}
          />
          <OverviewMetricCard
            title="Vật tư phụ"
            value={
              <>
                <span className="text-white font-semibold">{formatQuantity(summary.secondaryCount, 0)}</span>{' '}
                <span className="text-slate-400 font-normal text-[14px]">({formatQuantity(summary.secondaryQty)} tấn)</span>
              </>
            }
            note={kpiDeltas.secondary}
            noteClassName={kpiNoteColors.secondary}
            tone="violet"
            icon={<Package size={15} />}
            trend={kpiTrend.secondary}
            isLoading={isLoading}
          />
          <OverviewMetricCard
            title="Vật tư tiêu hao"
            value={
              <>
                <span className="text-white font-semibold">{formatQuantity(summary.consumableCount, 0)}</span>{' '}
                <span className="text-slate-400 font-normal text-[14px]">({formatQuantity(summary.consumableQty)} tấn)</span>
              </>
            }
            note={kpiDeltas.consumable}
            noteClassName={kpiNoteColors.consumable}
            tone="orange"
            icon={<Package size={15} />}
            trend={kpiTrend.consumable}
            isLoading={isLoading}
          />
          <OverviewMetricCard
            title="Sắp hết hàng"
            value={formatQuantity(summary.low, 0)}
            note={kpiDeltas.low}
            noteClassName={kpiNoteColors.low}
            tone="amber"
            icon={<TriangleAlert size={15} />}
            trend={kpiTrend.low}
            isLoading={isLoading}
          />
          <OverviewMetricCard
            title="Hết hàng"
            value={formatQuantity(summary.out, 0)}
            note={kpiDeltas.out}
            noteClassName={kpiNoteColors.out}
            tone="red"
            icon={<ShieldX size={15} />}
            trend={kpiTrend.out}
            isLoading={isLoading}
          />
          <OverviewMetricCard
            title="Pending Returns"
            value={formatQuantity(pendingReturns.count, 0)}
            note={`${formatQuantity(pendingReturns.quantity)} chờ nhận`}
            noteClassName="text-amber-300"
            tone="amber"
            icon={<Clock size={15} />}
            trend={pendingReturns.trend}
            isLoading={isLoadingReturns}
            onClick={() => navigate('/inventory/returns')}
          />
        </div>

        <InventoryPanel className="rounded-xl">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-[180px_180px_180px_180px_minmax(260px,1fr)_130px_120px]">
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
          <div className="space-y-1 xl:col-span-9">
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
                <TransactionSummary title="phiếu" count={todayStats.inboundDocs} quantity={todayStats.inboundQty} amount={todayStats.inboundValue} tone="cyan" />
              </InventoryChartCard>
              <InventoryChartCard title="Xuất kho hôm nay" className="border-amber-500/20 bg-amber-500/5">
                <TransactionSummary title="phiếu" count={todayStats.outboundDocs} quantity={todayStats.outboundQty} amount={todayStats.outboundValue} tone="amber" />
              </InventoryChartCard>
              <InventoryChartCard title="Điều chuyển hôm nay" className="border-purple-500/20 bg-purple-500/5 p-1.5">
                <TransactionSummary title="phiếu" count={todayStats.transferDocs} quantity={todayStats.transferQty} amount={todayStats.transferValue} tone="purple" />
              </InventoryChartCard>
            </div>
            <InventoryPanel>
              <div className="mb-1 flex items-center justify-between gap-3">
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Tồn kho vật tư</h3>
                <button onClick={() => setOverviewPopup('stock-full')} className="text-xs text-cyan-300 hover:text-cyan-200">Xem tất cả</button>
              </div>
              <div className={`${inventoryTableShell} border border-white/10 ring-0 bg-transparent shadow-none rounded-lg h-[430px] overflow-auto scrollbar-none`}>
                <table className="w-full min-w-[1050px] text-sm table-fixed">
                  <colgroup>
                    <col className="w-[140px]" />
                    <col className="w-[140px]" />
                    <col className="w-[40px]" />
                    <col className="w-[100px]" />
                    <col className="w-[100px]" />
                    <col className="w-[100px]" />
                    <col className="w-[110px]" />
                    <col className="w-[130px]" />
                    <col className="w-[150px]" />
                    <col className="w-[100px]" />
                  </colgroup>
                          <thead
                            className={`${inventoryTableHead}
                              text-slate-300
                              border-b border-cyan-400/10`}
                            style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                          >
                            <tr>
                              <th className="px-1.5 py-1 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">Tên vật tư</th>
                              <th className="px-1.5 py-1 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">Quy cách</th>
                              <th className="px-1.5 py-1 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">ĐVT</th>
                              <th className="px-1.5 py-1 text-right text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">Kho chính</th>
                              <th className="px-1.5 py-1 text-right text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">Kho SX</th>
                              <th className="px-1.5 py-1 text-right text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">Tổng tồn</th>
                              <th className="px-1.5 py-1 text-right text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">Đơn giá</th>
                              <th className="px-1.5 py-1 text-right text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">Giá trị</th>
                              <th className="px-1.5 py-1 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">Vị trí</th>
                              <th className="px-1.5 py-1 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-300">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody>

                    {pagedRows.map((item: any) => {
                      const status = statusOf(item)
                      return (
                        <tr key={item.id} className={`cursor-pointer ${inventoryTableRow}`} onClick={() => setSelectedMaterialId(String(item.id))}>
                          <td className="truncate px-1.5 py-0.5 text-white" title={item.name}>{item.name}</td>
                          <td className="truncate px-1.5 py-0.5 text-slate-300" title={item.materialType ?? item.specification ?? '-'}>{item.materialType ?? item.specification ?? '-'}</td>
                          <td className="px-1.5 py-0.5 text-slate-300">{item.unit ?? '-'}</td>
                          <td className="truncate px-1.5 py-0.5 text-right font-medium tabular-nums text-slate-200" title={formatQty(mainWarehouseStock(item))}>{formatQty(mainWarehouseStock(item))}</td>
                          <td className="truncate px-1.5 py-0.5 text-right font-medium tabular-nums text-amber-300" title={formatQty(productionWarehouseStock(item))}>{formatQty(productionWarehouseStock(item))}</td>
                          <td className="truncate px-1.5 py-0.5 text-right font-medium tabular-nums text-cyan-300" title={formatQty(totalWarehouseStock(item))}>{formatQty(totalWarehouseStock(item))}</td>
                          <td className="truncate px-1.5 py-0.5 text-right text-slate-300" title={money(item.averageCost)}>{money(item.averageCost)}</td>
                          <td className="truncate px-1.5 py-0.5 text-right font-medium text-cyan-300" title={money(item.inventoryValue)}>{money(item.inventoryValue)}</td>
                          <td className="truncate px-1.5 py-0.5">
                            <span
                              title={rowLocations(item).map(locationLabel).join('\n')}
                              className="inline-block w-full truncate rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-1.5 py-0.5 text-[10px] text-cyan-100"
                            >
                              {displayLocation(item)}
                            </span>
                          </td>
                          <td className="px-1.5 py-0.5">
                            <span
                              className={`inline-flex rounded-lg border px-2 py-0.5 text-xs ${
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
              <InventoryPagination
                page={activePage}
                pageCount={pageCount}
                total={materialsData?.total ?? 0}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </InventoryPanel>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              <RecentTransactionCard title="Nhập kho gần đây" rows={recentInboundRows.slice(0, 5)} tone="cyan" onViewAll={() => setOverviewPopup('recent-inbound')} />
              <RecentTransactionCard title="Xuất kho gần đây" rows={recentOutboundRows.slice(0, 5)} tone="amber" onViewAll={() => setOverviewPopup('recent-outbound')} />
            </div>
          </div>

          <div className="space-y-1 xl:col-span-3">
            {/* 1. Phân bố tồn kho */}
            <ChartCard
              title="Phân bố tồn kho"
              value={`${formatQty(summary.totalQty)} tấn`}
              delta={`${zoneSegments.length} kho hoạt động`}
              className="h-[220px]"
              chartHeightClass="h-[120px] overflow-y-auto scrollbar-none"
            >
              <CompactDonutSummary
                segments={zoneSegments}
                centerValue={formatQuantity(summary.totalQty, 1)}   // 1 chữ số thập phân
                centerLabel="tấn"
                showPercent={true}
              />
            </ChartCard>

            {/* 2. Biến động tồn kho */}
            <ChartCard
              title="Biến động tồn kho"
              value={`${formatQty(summary.totalQty)} tấn`}
              delta={quantityDelta.text}
              deltaColorClass={quantityDelta.color}
              className="h-[178px]"
              chartHeightClass="h-[90px] overflow-y-auto scrollbar-none"
            >
              <StockTrendChart rows={valueTrend} />
            </ChartCard>

            {/* 3. Cảnh báo tồn kho */}
            <ChartCard
              title="Cảnh báo tồn kho"
              value={`${alerts.length} cảnh báo`}
              delta={alertsDelta.text}
              deltaColorClass={alertsDelta.color}
              action={<button onClick={() => setOverviewPopup('alerts-full')} className="text-[10px] text-cyan-300 hover:text-cyan-200 transition">Xem tất cả</button>}
              className="h-[200px]"
              chartHeightClass="h-[140px]"   // bỏ overflow-y-auto
            >
              <AlertRows rows={alerts} />   // truyền toàn bộ alerts
            </ChartCard>

            {/* 4. Top vật tư tồn kho (mới) */}
            <InventoryChartCard
              title="Top vật tư tồn kho"
              note="Theo giá trị tồn kho"
              className="h-[207px]"
            >
              <div className="h-[160px] overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-width-none pr-1">
                {topMaterials.length > 0 ? (
                  <HorizontalBars
                    rows={topMaterials.map((item) => [item.name, item.value])}
                    valueFormatter={(v) => formatCurrencyVnd(v)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-500">
                    Không có dữ liệu tồn kho
                  </div>
                )}
              </div>
            </InventoryChartCard>
          </div>
        </div>

        <InventoryChartCard title="Tình trạng kho">
          <div className="grid grid-cols-1 items-center gap-10 text-xs md:grid-cols-[220px_1fr_auto_auto_auto]">
            <label className="block">
              <span className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-slate-500">Kho chính</span>
              <select
                value={warehouseFilter}
                onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1) }}
                className="h-7 w-full rounded-md border border-white/10 bg-slate-950/45 px-2 py-0.5 text-xs text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-950/65"
              >
                <option value="">Tất cả kho</option>
                {warehouseOptions.map((warehouse) => (
                  <option key={warehouse.value} value={warehouse.value}>
                    {warehouse.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-1 md:grid-cols-4">
              <StatusMetric label="Tổng mã" value={selectedWarehouseStat.total} tone="cyan" />
              <StatusMetric label="Sắp hết" value={selectedWarehouseStat.low} tone="amber" />
              <StatusMetric label="Hết hàng" value={selectedWarehouseStat.out} tone="red" />
              <StatusMetric label="Cảnh báo khác" value={Math.max(0, alerts.length - selectedWarehouseStat.low - selectedWarehouseStat.out)} tone="amber" />
            </div>

            <div className="hidden h-8 border-l border-white/10 md:block" />

            <div className="text-center text-[10px] text-slate-400">
              Cập nhật
              <br />
              <span className="text-xs text-white">{new Date().toLocaleTimeString('vi-VN')}</span>
            </div>

            <div className="text-center text-[10px] text-emerald-300">
              An toàn
              <br />
              <span className="text-xs font-semibold">{selectedWarehouseStat.out > 0 ? 'Theo dõi' : 'Bình thường'}</span>
            </div>
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
          // thêm các filter
          search={search}
          categoryFilter={categoryFilter}
          usageFilter={usageFilter}
          warehouseFilter={warehouseFilter}
          statusFilter={statusFilter}
        />
      )}
      <InboundTransactionModal open={transactionModal === 'inbound'} onClose={() => setTransactionModal(null)} />
      <OutboundTransactionModal open={transactionModal === 'outbound'} onClose={() => setTransactionModal(null)} />
      <TransferTransactionModal open={transactionModal === 'transfer'} onClose={() => setTransactionModal(null)} />
      <StockTakeTransactionModal open={transactionModal === 'stock-take'} onClose={() => setTransactionModal(null)} />
      <AdjustmentTransactionModal open={transactionModal === 'adjustment'} onClose={() => setTransactionModal(null)} />
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
      <div className="text-[14px] text-slate-500">{label}</div>
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
          const materialName = transactionMaterialText(row, 'name')
          const materialCode = transactionMaterialText(row, 'code')
          const date = transactionDate(row)
          return (
            <div key={row.id} className="grid grid-cols-[80px_180px_1fr_80px_80px] items-center gap-2 border-b border-white/8 px-1.5 py-1.5 text-xs last:border-b-0">
              {/* Thời gian */}
              <div className="text-slate-400">{date ? date.toLocaleDateString('vi-VN') : '-'}</div>
              {/* Mã giao dịch */}
              <div className={`truncate font-medium ${tone === 'cyan' ? 'text-cyan-300' : 'text-blue-300'}`}>
                {row.transactionNo ?? row.code}
              </div>
              {/* Tên vật tư */}
              <div className="truncate text-slate-300" title={materialName || row.projectName || row.supplierName || materialCode || '-'}>
                {materialName || row.projectName || row.supplierName || materialCode || '-'}
              </div>
              {/* Số lượng */}
              <div className="text-right text-white">{formatQty(transactionQuantity(row))}</div>
              {/* Trạng thái */}
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
    <div className="h-full space-y-1.5 overflow-y-auto text-xs [&::-webkit-scrollbar]:hidden scrollbar-width-none">
      {rows.map((row: any) => {
        const status = row.stockStatus ?? statusOf(row)
        return (
          <div key={row.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-2.5 py-1.5">
            <span className={status === 'OUT' ? 'truncate text-red-300' : 'truncate text-amber-300'}>{row.name ?? row.code}</span>
            <span className="text-slate-400">Kho chính: {formatQty(mainWarehouseStock(row))}</span>
            <span className={status === 'OUT' ? 'rounded bg-red-500/10 px-2 py-0.5 text-red-300' : 'rounded bg-amber-500/10 px-2 py-0.5 text-amber-300'}>
              {statusLabel(status)}
            </span>
          </div>
        )
      })}
      {rows.length === 0 && (
        <div className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-5 text-center text-sm text-slate-500">
          Không có cảnh báo tồn kho.
        </div>
      )}
    </div>
  )
}
function AlertMiniChart({ rows, colors }: { rows: Array<[string, number]>; colors?: string[] }) {
  const max = Math.max(1, ...rows.map(([, value]) => value))
  const defaultColors = ['from-amber-500 to-orange-400', 'from-red-500 to-pink-500', 'from-cyan-500 to-blue-400', 'from-emerald-500 to-teal-400']
  return (
    <div className="space-y-3 py-1">  {/* tăng space-y từ 2 lên 3 */}
      {rows.map(([label, value], index) => {
        const percent = max > 0 ? (value / max) * 100 : 0
        const barColor = colors ? colors[index % colors.length] : defaultColors[index % defaultColors.length]
        return (
          <div key={label} className="group">
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">  {/* text-[11px] → text-xs */}
              <span className="truncate text-slate-300 font-medium group-hover:text-white transition">{label}</span>
              <span className="text-cyan-300 font-mono font-semibold text-xs">{formatQuantity(value, 0)}</span> {/* thêm text-xs */}
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-900 ring-1 ring-white/[0.05]">  {/* h-2 → h-2.5 */}
              <div
                className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`}
                style={{ width: `${Math.max(4, percent)}%` }}
              />
            </div>
          </div>
        )
      })}
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

  search,
  categoryFilter,
  usageFilter,
  warehouseFilter,
  statusFilter,
}: {
  type: 'recent-inbound' | 'recent-outbound' | 'stock-full' | 'alerts-full'

  onClose: () => void

  rows: any[]

  alerts: any[]

  inboundRows: any[]

  outboundRows: any[]

  search?: string

  categoryFilter?: string

  usageFilter?: string

  warehouseFilter?: string

  statusFilter?: string
}) {
  const title = {
    'recent-inbound': 'Toàn bộ nhập kho gần đây',
    'recent-outbound': 'Toàn bộ xuất kho gần đây',
    'stock-full': 'Toàn bộ danh sách tồn kho',
    'alerts-full': 'Tất cả cảnh báo tồn kho',
  }[type]
  const txRows = type === 'recent-inbound' ? inboundRows : outboundRows

  // Phân trang cho recent-inbound / recent-outbound
  const [page, setPage] = useState(1)
  const [pageStock, setPageStock] = useState(1)
  const STOCK_PAGE_SIZE = 13

  const {
  data: fullStockData,
  isLoading: isLoadingFullStock,
} = useInventoryMaterials({
  page: pageStock,
  pageSize: STOCK_PAGE_SIZE,
  search: search || undefined,
  categoryId: categoryFilter || undefined,
  materialUsageType: usageFilter || undefined,
  warehouse: warehouseFilter || undefined,
  stockStatus: statusFilter || undefined,
  sortBy: 'code',
  sortOrder: 'asc',
})

  const fullStockRows = useMemo(() => {
    return (fullStockData?.items ?? []).map((item: any) => {
      const averageCost = num(item.averageCost ?? item.unitPrice)
      const mainStock = mainWarehouseStock(item)
      const productionStock = productionWarehouseStock(item)
      const totalStock = totalWarehouseStock(item)

      return {
        ...item,
        id: item.materialId ?? item.inventoryItemId ?? item.id,
        code: item.materialCode ?? item.code,
        name: item.materialName ?? item.name,
        quantity: totalStock,
        mainStock,
        productionStock,
        totalStock,
        averageCost,
        inventoryValue:
          num(item.inventoryValue ?? totalStock * averageCost),
      }
    })
  }, [fullStockData])

  const totalStock = fullStockData?.total ?? 0

  const totalStockPages =
    fullStockData?.totalPages ??
    Math.max(1, Math.ceil(totalStock / STOCK_PAGE_SIZE))
  const pageSize = 16
  const pagedTxRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return txRows.slice(start, start + pageSize)
  }, [txRows, page])
  const totalPages = Math.max(1, Math.ceil(txRows.length / pageSize))

  // Reset về trang 1 khi dữ liệu thay đổi
  useEffect(() => {
  if (page > totalPages) {
    setPage(totalPages)
  }
}, [txRows, totalPages, page])
  useEffect(() => {
    if (pageStock > totalStockPages) {
      setPageStock(totalStockPages)
    }
  }, [rows, totalStockPages, pageStock])

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="max-h-[90vh] w-full max-w-[95vw] overflow-hidden rounded-2xl border border-white/10 bg-[#08111f]/95 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            {type === 'stock-full' ? `Toàn bộ danh sách tồn kho (${totalStock} vật tư)` : title}
          </h3>
          <button onClick={onClose} className="rounded border border-white/10 bg-white/5 px-3 py-1 text-slate-300 hover:text-white">
            Đóng
          </button>
        </div>
        <div className="max-h-[74vh] overflow-auto min-h-[300px]">
          {(type === 'recent-inbound' || type === 'recent-outbound') ? (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <div className="min-h-[220px]">
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
                  {pagedTxRows.length > 0 ? (
                    pagedTxRows.map((row: any) => {
                      const date = transactionDate(row)
                      return (
                        <tr key={row.id} className={inventoryTableRow}>
                          <td className="px-3 py-2">{date ? formatDateTime(date) : '-'}</td>
                          <td className="px-3 py-2 text-cyan-300">{row.transactionNo ?? row.code}</td>
                          <td className="px-3 py-2">{transactionMaterialText(row, 'code') || row.itemCode || '-'}</td>
                          <td className="px-3 py-2">{transactionMaterialText(row, 'name') || '-'}</td>
                          <td className="px-3 py-2 text-right">{formatQty(transactionQuantity(row))}</td>
                          <td className="px-3 py-2 text-right text-cyan-300">{money(transactionAmount(row))}</td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                        Không có giao dịch.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Phân trang luôn hiển thị */}
            <div className="flex items-center justify-between gap-3 px-4 py-2 text-xs text-slate-400 border-t border-white/10">
              <span>
                Hiển thị {(txRows.length > 0) ? ((page - 1) * pageSize + 1) : 0}-
                {Math.min(page * pageSize, txRows.length)}/{txRows.length} kết quả
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || txRows.length === 0}
                  className={inventoryMutedButton}
                >
                  Trước
                </button>
                <span className="px-2 py-1 text-slate-300">{page}/{totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || txRows.length === 0}
                  className={inventoryMutedButton}
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        ) : null}

          {type === 'stock-full' ? (
            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full min-w-[1400px] text-sm table-fixed">
                <colgroup>
                  <col className="w-[120px]" />
                  <col className="w-[180px]" />
                  <col className="w-[120px]" />
                  <col className="w-[120px]" />
                  <col className="w-[120px]" />
                  <col className="w-[50px]" />
                  <col className="w-[100px]" />
                  <col className="w-[120px]" />
                  <col className="w-[120px]" />
                  <col className="w-[120px]" />
                  <col className="w-[140px]" />
                  <col className="w-[150px]" />
                  <col className="w-[120px]" />
                </colgroup>
                 <thead className="bg-white/[0.06]">
                  <tr>
                    <th className="px-3 py-1.5 text-left text-slate-400">Mã vật tư</th>
                    <th className="px-3 py-1.5 text-left text-slate-400">Tên vật tư</th>
                    <th className="px-3 py-1.5 text-left text-slate-400">Loại vật tư</th>
                    <th className="px-3 py-1.5 text-left text-slate-400">Nhóm vật tư</th>
                    <th className="px-3 py-1.5 text-left text-slate-400">Quy cách</th>
                    <th className="px-3 py-1.5 text-left text-slate-400">ĐVT</th>
                    <th className="px-3 py-1.5 text-right text-slate-400">Kho chính</th>
                    <th className="px-3 py-1.5 text-right text-slate-400">Kho SX</th>
                    <th className="px-3 py-1.5 text-right text-slate-400">Tổng tồn</th>
                    <th className="px-3 py-1.5 text-right text-slate-400">Đơn giá</th>
                    <th className="px-3 py-1.5 text-right text-slate-400">Giá trị</th>
                    <th className="px-3 py-1.5 text-left text-slate-400">Vị trí</th>
                    <th className="px-3 py-1.5 text-left text-slate-400">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {fullStockRows.map((item: any) => {
                    const status = statusOf(item)
                    return (
                      <tr key={item.id} className={inventoryTableRow}>
                        <td className="truncate px-3 py-1.5 text-cyan-300" title={item.code}>{item.code}</td>
                        <td className="truncate px-3 py-1.5 text-white" title={item.name}>{item.name}</td>
                        <td className="truncate px-3 py-2 text-slate-300" title={materialUsageLabel(item.materialUsageType)}>{materialUsageLabel(item.materialUsageType)}</td>
                        <td className="truncate px-3 py-2 text-slate-300" title={item.category}>{item.category ?? '-'}</td>
                        <td className="truncate px-3 py-1.5 text-slate-300" title={item.materialType ?? item.specification ?? '-'}>{item.materialType ?? item.specification ?? '-'}</td>
                        <td className="px-3 py-1.5 text-slate-300">{item.unit ?? '-'}</td>
                        <td className="truncate px-3 py-1.5 text-right font-medium tabular-nums text-slate-200" title={formatQty(mainWarehouseStock(item))}>{formatQty(mainWarehouseStock(item))}</td>
                        <td className="truncate px-3 py-1.5 text-right font-medium tabular-nums text-amber-300" title={formatQty(productionWarehouseStock(item))}>{formatQty(productionWarehouseStock(item))}</td>
                        <td className="truncate px-3 py-1.5 text-right font-medium tabular-nums text-cyan-300" title={formatQty(totalWarehouseStock(item))}>{formatQty(totalWarehouseStock(item))}</td>
                        <td className="truncate px-3 py-1.5 text-right text-slate-300" title={money(item.averageCost)}>{money(item.averageCost)}</td>
                        <td className="truncate px-3 py-1.5 text-right font-medium text-cyan-300" title={money(item.inventoryValue)}>{money(item.inventoryValue)}</td>
                        <td className="truncate px-3 py-1.5">
                          <span
                            title={rowLocations(item).map(locationLabel).join('\n')}
                            className="inline-block w-full truncate rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-100"
                          >
                            {displayLocation(item)}
                          </span>
                        </td>
                        <td className="px-3 py-1.5">
                          <span
                            className={`inline-flex rounded-lg border px-3 py-0.5 text-xs ${
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

              <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-2 text-xs text-slate-400">
                <span>
                  Hiển thị {totalStock === 0 ? 0 : (pageStock - 1) * STOCK_PAGE_SIZE + 1}
                  -
                  {Math.min(pageStock * STOCK_PAGE_SIZE, totalStock)}
                  / {totalStock} vật tư
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPageStock((p) => Math.max(1, p - 1))}
                    disabled={pageStock <= 1}
                    className={inventoryMutedButton}
                  >
                    Trước
                  </button>

                  <span className="px-2 py-1 text-slate-300">
                    {pageStock}/{totalStockPages}
                  </span>

                  <button
                    onClick={() => setPageStock((p) => Math.min(totalStockPages, p + 1))}
                    disabled={pageStock >= totalStockPages}
                    className={inventoryMutedButton}
                  >
                    Sau
                  </button>
                </div>
              </div>

              </div>
              ) : null}

          {type === 'alerts-full' ? (
            <div className="grid max-h-[74vh] gap-4 overflow-auto xl:grid-cols-[1fr_320px]">
              {/* Bảng bên trái */}
              <div className="overflow-hidden rounded-xl border border-white/10">
                <table className="w-full min-w-[1100px] text-sm table-fixed">
                  <colgroup>
                    <col className="w-[140px]" />
                    <col className="w-[180px]" />
                    <col className="w-[120px]" />
                    <col className="w-[120px]" />
                    <col className="w-[120px]" />
                    <col className="w-[140px]" />
                    <col className="w-[160px]" />
                  </colgroup>
                  <thead className="bg-white/[0.055] text-xs uppercase tracking-[0.08em] text-slate-400">
                    <tr>
                      <th className="px-4 py-3 text-left">Mã vật tư</th>
                      <th className="px-4 py-3 text-left">Tên vật tư</th>
                      <th className="px-4 py-3 text-left">Nhóm</th>
                      <th className="px-4 py-3 text-right">Kho chính</th>
                      <th className="px-4 py-3 text-right">Tồn tối thiểu</th>
                      <th className="px-4 py-3 text-left">Mức cảnh báo</th>
                      <th className="px-4 py-3 text-left">Vị trí</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                          Không có cảnh báo tồn kho.
                        </td>
                      </tr>
                    ) : (
                      alerts.map((item: any) => {
                        const status = item.stockStatus ?? statusOf(item)
                        return (
                          <tr key={item.id} className="border-t border-white/10 text-slate-200 hover:bg-white/[0.04]">
                            <td className="truncate px-4 py-2.5 text-cyan-300" title={item.code}>{item.code}</td>
                            <td className="truncate px-4 py-2.5" title={item.name}>{item.name}</td>
                            <td className="truncate px-4 py-2.5 text-slate-400" title={item.category ?? '-'}>{item.category ?? '-'}</td>
                            <td className="px-4 py-2.5 text-right font-mono tabular-nums">{formatQty(mainWarehouseStock(item))}</td>
                            <td className="px-4 py-2.5 text-right">{formatQty(item.minimumStock ?? 5)}</td>
                            <td className="px-4 py-2.5">
                              <span className={`rounded px-2.5 py-1 text-xs font-semibold ${status === 'OUT' ? 'bg-red-500/10 text-red-300' : 'bg-amber-500/10 text-amber-300'}`}>
                                {statusLabel(status)}
                              </span>
                            </td>
                            <td className="truncate px-4 py-2.5 text-slate-400" title={displayLocation(item)}>{displayLocation(item)}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Sidebar bên phải: 2 chart nhỏ */}
              <div className="space-y-4">
                <ChartCard
                  title="Theo mức độ"
                  value={`${alerts.length} cảnh báo`}
                  delta="Phân bố theo mức"
                  className="h-[300px]"
                  chartHeightClass="h-[300px]"
                >
                  <AlertMiniChart rows={[
                    ['Sắp hết', alerts.filter((item: any) => (item.stockStatus ?? statusOf(item)) === 'LOW').length],
                    ['Hết hàng', alerts.filter((item: any) => (item.stockStatus ?? statusOf(item)) === 'OUT').length],
                  ]} />
                </ChartCard>

                <ChartCard
                  title="Top tồn thấp"
                  value={`${Math.min(6, alerts.length)} vật tư gần ngưỡng`}
                  delta="Dưới định mức"
                  className="h-[350px]"
                  chartHeightClass="h-[300px]"
                >
                  <AlertMiniChart rows={alerts.slice(0, 6).map((item: any) => [
                    `${item.code} (${formatQty(item.stock ?? mainWarehouseStock(item))} tấn)`,
                    item.stock ?? mainWarehouseStock(item)
                  ])} />
                </ChartCard>
              </div>
            </div>
          ) : null}

        </div>
      </div>
    </div>
  )
}
