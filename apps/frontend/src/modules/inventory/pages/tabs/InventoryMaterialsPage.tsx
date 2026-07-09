import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { CircleDollarSign, PackageCheck, RefreshCw, ShieldX, TriangleAlert } from 'lucide-react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { InventoryMaterialDetailModal } from '../../components/InventoryMaterialDetailModal'
import { MaterialDrawer } from '../../components/material-table/MaterialDrawer'
import { InventoryTabWorkspace } from '../../components/InventoryTabWorkspace'
import {
  InventoryPanel,
  inventoryTableHead,
  inventoryTableRow,
  inventoryMutedButton,
} from '../../components/InventoryVisuals'
import { CockpitChartCard, CockpitKpiCard, CockpitTableShell, COCKPIT_HEIGHTS } from '../../../../shared/ui/cockpit'
import { useDeleteMaterial } from '../../hooks/useDeleteMaterial'
import { useCategories } from '../../hooks/useCategories'
import { useMaterialDetail } from '../../hooks/useMaterialDetail'
import { useZones } from '../../hooks/useZones'
import { useInventoryMaterials, useInventoryOverview } from '../../hooks/useInventoryReadModels'
import { formatCurrencyVnd, formatQuantity, parseLocaleNumber } from '@/shared/utils/number-format'

const PAGE_SIZE = 16
const CHART_PAGE_SIZE = 6
const compactInput =
  'h-9 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-950/65'

function num(value: any) {
  const parsed = parseLocaleNumber(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function money(value: number) {
  return formatCurrencyVnd(value)
}

function materialUsageLabel(value: string | undefined) {
  const map: Record<string, string> = {
    PRIMARY: 'Vật tư chính',
    SECONDARY: 'Vật tư phụ',
    CONSUMABLE: 'Vật tư tiêu hao',
  }
  return map[String(value ?? 'PRIMARY')] ?? 'Vật tư chính'
}

function stockStatus(item: any) {
  const currentStock = mainWarehouseStock(item)
  if (currentStock <= 0) return 'OUT'
  if (currentStock <= Number(item.minimumStock ?? 5)) return 'LOW'
  return 'NORMAL'
}

function stockStatusLabel(status: string) {
  if (status === 'OUT') return 'Hết hàng'
  if (status === 'LOW') return 'Sắp hết'
  return 'Bình thường'
}

function stockStatusClass(status: string) {
  if (status === 'OUT') return 'border-red-400/30 bg-red-500/10 text-red-300'
  if (status === 'LOW') return 'border-amber-400/30 bg-amber-500/10 text-amber-300'
  return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
}

function transactionRows(data: any) {
  return Array.isArray(data) ? data : data?.data ?? []
}

function transactionDateKey(tx: any, length: number) {
  return String(tx.transactionDate ?? tx.createdAt ?? '').slice(0, length)
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

function transactionItemRows(tx: any) {
  const items = Array.isArray(tx.items) ? tx.items : []
  return items.map((line: any) => ({
    inventoryItemId: String(line.inventoryItemId ?? line.inventoryItem?.id ?? ''),
    quantity: num(line.quantity),
    transactionDate: tx.transactionDate ?? tx.createdAt,
  })).filter((line: any) => line.inventoryItemId)
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthEnd(date: Date, now = new Date()) {
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
  return end > now ? now : end
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

  const fallback = item.position ?? item.zone
  return fallback ? [{ zoneName: fallback, quantity: item.currentStock }] : []
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

function displayLocation(item: any) {
  const locations = rowLocations(item)
  if (!locations.length) return '-'
  const primary = locationLabel(locations[0]) || '-'
  return locations.length > 1 ? `${primary} ... +${locations.length - 1}` : primary
}

function LabeledFilter({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-0 block text-[12px] font-medium text-slate-400">{label}</span>
      {children}
    </label>
  )
}

function ChartCard({
  title,
  value,
  delta,
  deltaColorClass = 'text-slate-400',
  action,
  page,
  pageCount,
  onPrev,
  onNext,
  children,
  className = 'h-[260px]',
  chartHeightClass = 'h-[150px]',
}: {
  title: string
  value?: string
  delta?: string
  deltaColorClass?: string
  action?: ReactNode
  page?: number
  pageCount?: number
  onPrev?: () => void
  onNext?: () => void
  children: ReactNode
  className?: string
  chartHeightClass?: string
}) {
  return (
    <CockpitChartCard
      title={title}
      value={value}
      delta={delta}
      deltaColorClass={deltaColorClass}
      action={action}
      page={page}
      pageCount={pageCount}
      onPrev={onPrev}
      onNext={onNext}
      className={className}
      chartHeightClass={chartHeightClass}
    >
      {children}
    </CockpitChartCard>
  )
}

function InventoryMetricCard({
  title,
  value,
  note,
  noteClassName,
  tone = 'blue',
  icon,
  trend,
  active,
  onClick,
}: {
  title: string
  value: ReactNode
  note?: string
  noteClassName?: string
  tone?: 'blue' | 'emerald' | 'cyan' | 'amber' | 'red' | 'purple' | 'indigo' | 'violet' | 'orange'
  icon: ReactNode
  trend: number[]
  active?: boolean
  onClick?: () => void
}) {
  return (
    <CockpitKpiCard
      title={title}
      value={value}
      note={note}
      noteClassName={noteClassName}
      tone={tone}
      icon={icon}
      trend={trend}
      active={active}
      onClick={onClick}
    />
  )
}

function CompactDonut({ segments, centerValue, centerLabel }: { segments: Array<{ label: string; value: number; color: string }>; centerValue: string; centerLabel: string }) {
  const total = Math.max(1, segments.reduce((sum, item) => sum + item.value, 0))
  let cursor = 0
  const gradient = segments.map((item) => {
    const start = cursor
    const end = cursor + (item.value / total) * 100
    cursor = end
    return `${item.color} ${start}% ${end}%`
  }).join(', ')

  return (
    <div className="grid h-full grid-cols-[120px_1fr] items-center gap-3">
      <div className="relative h-28 w-28 rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="absolute inset-3 rounded-full bg-[#08111f]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-lg font-semibold text-white">{centerValue}</div>
          <div className="text-[10px] text-slate-500">{centerLabel}</div>
        </div>
      </div>
      <div className="space-y-1.5 overflow-hidden">
        {segments.slice(0, 6).map((item) => {
          const percent = (item.value / total) * 100
          return (
            <div key={item.label} className="grid grid-cols-[1fr_auto] items-center gap-2 text-[11px]">
              <span className="flex min-w-0 items-center gap-1.5 text-slate-300">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="text-slate-300">
                {formatQuantity(item.value, 1)} ({percent.toFixed(1)}%)
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function InventoryMaterialsPage() {
  const [open, setOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null)
  const [detailMaterial, setDetailMaterial] = useState<any | null>(null)
  const { data: detailMaterialData } = useMaterialDetail(
    detailMaterial ? String(detailMaterial.materialId ?? detailMaterial.inventoryItemId ?? detailMaterial.id) : undefined,
  )
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [usageFilter, setUsageFilter] = useState('')
  const [zoneFilter, setZoneFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [zoneChartPage, setZoneChartPage] = useState(1)
  const [alertChartPage, setAlertChartPage] = useState(1)
  const [showAll, setShowAll] = useState(false)
  const [showAllAlerts, setShowAllAlerts] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchDraft)
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchDraft])

  const query = {
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    categoryId: categoryFilter || undefined,
    materialUsageType: usageFilter || undefined,
    warehouse: zoneFilter || undefined,
    stockStatus: statusFilter || undefined,
    sortBy: 'code' as const,
    sortOrder: 'asc' as const,
  }
  const overviewQuery = {
    search: search || undefined,
    categoryId: categoryFilter || undefined,
    materialUsageType: usageFilter || undefined,
    warehouse: zoneFilter || undefined,
    stockStatus: statusFilter || undefined,
  }
  const { data: materialsData, refetch: refetchMaterials } = useInventoryMaterials(query)
  const { data: overviewData, refetch: refetchOverview } = useInventoryOverview(overviewQuery)
  const { data: zones = [] } = useZones()
  const { data: categories = [] } = useCategories()
  const deleteMaterialMutation = useDeleteMaterial()
  const rows = materialsData?.items ?? []
  const transactions: any[] = []

  const filteredRows = rows
  const kpis = {
    totalValue: num(overviewData?.summary?.totalValue),
    totalQty: num(overviewData?.summary?.totalStock),
    totalCodes: num(overviewData?.summary?.totalItems),
    low: num(overviewData?.summary?.lowStock),
    out: num(overviewData?.summary?.outOfStock),
  }
  const totalPages = materialsData?.totalPages ?? 1
  const activePage = materialsData?.page ?? page
  const pagedRows = rows

  async function handleDelete(id: string) {
    setDeleteError('')
    if (!window.confirm('Xóa vật tư này khỏi Material Master? Lịch sử giao dịch cũ vẫn được giữ lại.')) return
    try {
      await deleteMaterialMutation.mutateAsync(id)
    } catch (error: any) {
      console.error(error)
      setDeleteError(error?.response?.data?.message ?? 'Không thể xoá vật tư. Vui lòng thử lại hoặc kiểm tra dữ liệu liên kết.')
    }
  }

  function openMaterial(item: any) {
    setDetailMaterial(item)
  }

  function AlertRows({ rows }: { rows: any[] }) {
  return (
    <div className="h-full space-y-1.5 overflow-y-auto text-xs [&::-webkit-scrollbar]:hidden scrollbar-width-none">
      {rows.map((row: any) => {
        const status = row.stockStatus ?? stockStatus(row)
        return (
          <div key={row.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-2.5 py-1.5">
            <span className={status === 'OUT' ? 'truncate text-red-300' : 'truncate text-amber-300'}>{row.materialName ?? row.materialCode}</span>
            <span className="text-slate-400">Kho chính: {formatQuantity(mainWarehouseStock(row), 3)}</span>
            <span className={status === 'OUT' ? 'rounded bg-red-500/10 px-2 py-0.5 text-red-300' : 'rounded bg-amber-500/10 px-2 py-0.5 text-amber-300'}>
              {stockStatusLabel(status)}
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

  function editMaterial(item: any) {
    setSelectedMaterial({
      id: item.materialId ?? item.inventoryItemId ?? item.id,
      code: item.materialCode ?? item.code,
      name: item.materialName ?? item.name,
      unit: item.unit ?? item.unitCode ?? 'PCS',
      minimumStock: item.minimumStock ?? 0,
      categoryId: item.categoryId ?? '',
      materialTypeId: item.materialTypeId ?? '',
      materialUsageType: item.materialUsageType ?? 'PRIMARY',
      zoneId: item.zoneId ?? '',
      description: item.description ?? '',
    })
    setOpen(true)
  }

  const zoneDistribution = useMemo<Array<[string, number]>>(() => {
    return (overviewData?.facets?.warehouses ?? [])
      .map((item: any) => [String(item.label), num(item.value)] as [string, number])
      .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
  }, [overviewData])

  const zoneSegments = useMemo(() => {
    const colors = ['#1d7cff', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4']
    return zoneDistribution.map(([label, value], index) => ({
      label,
      value,
      color: colors[index % colors.length],
    }))
  }, [zoneDistribution])

  const alerts = useMemo(() => {
    return filteredRows
      .map((row: any) => {
        const stock = mainWarehouseStock(row)
        const min = num(row.minimumStock || 5)
        const level = stock <= 0 ? 'Hết hàng' : stock <= min ? 'Sắp hết' : ''
        return { ...row, stock, level }
      })
      .filter((row: any) => row.level)
      .sort((a: any, b: any) => a.stock - b.stock)
  }, [filteredRows])

  const pagedZoneDistribution = useMemo(() => {
    const total = Math.max(1, Math.ceil(zoneDistribution.length / CHART_PAGE_SIZE))
    const pageNo = Math.min(zoneChartPage, total)
    return {
      page: pageNo,
      pageCount: total,
      rows: zoneDistribution.slice((pageNo - 1) * CHART_PAGE_SIZE, pageNo * CHART_PAGE_SIZE),
    }
  }, [zoneDistribution, zoneChartPage])

  const pagedZoneSegments = useMemo(() => {
    const segments = zoneSegments.filter((segment) => pagedZoneDistribution.rows.some(([label]) => label === segment.label))
    return segments.length ? segments : [{ label: 'Chưa có dữ liệu', value: 1, color: '#334155' }]
  }, [zoneSegments, pagedZoneDistribution.rows])

  const pagedAlerts = useMemo(() => {
    const total = Math.max(1, Math.ceil(alerts.length / CHART_PAGE_SIZE))
    const pageNo = Math.min(alertChartPage, total)
    return {
      page: pageNo,
      pageCount: total,
      rows: alerts.slice((pageNo - 1) * CHART_PAGE_SIZE, pageNo * CHART_PAGE_SIZE),
    }
  }, [alerts, alertChartPage])

  const monthlyTrend = useMemo(() => {
    return (overviewData?.stockTrend ?? []).slice(-6).map((row: any) => {
      const date = new Date(row.date)
      return {
        label: `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(2)}`,
        value: num(row.value),
      }
    })
  }, [overviewData])

  const kpiTrend = useMemo(() => {
    const stockRows = overviewData?.stockTrend ?? []
    return {
      value: stockRows.map((row: any) => num(row.value)),
      quantity: stockRows.map((row: any) => num(row.quantity)),
      codes: [],
      low: [],
      out: [],
      newCodesThisMonth: 0,
      newCodesPreviousMonth: 0,
    }

    const txRows = transactionRows(transactions)
    const now = new Date()

    // Compute oldest data age in days
    const dates: Date[] = []
    txRows.forEach((tx: any) => {
      const raw = tx.transactionDate ?? tx.createdAt
      const d = raw ? new Date(raw) : null
      if (d && !isNaN(d.getTime())) {
        dates.push(d)
      }
    })
    filteredRows.forEach((row: any) => {
      const d = row.createdAt ? new Date(row.createdAt) : null
      if (d && !isNaN(d.getTime())) {
        dates.push(d)
      }
    })
    const oldest = dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))) : new Date()
    const ageInDays = (now.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24)

    // 12 snapshot dates (match InventoryOverviewPage exactly)
    const snapshotDates = Array.from({ length: 12 }).map((_, index) => {
      const monthsBack = 11 - index
      const date = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 0, 23, 59, 59, 999)
      return date > now ? now : date
    })

    const selectedIds = new Set(filteredRows.map((row: any) => String(row.materialId ?? row.inventoryItemId ?? row.id)))
    const movements = txRows.flatMap((tx: any) => {
      const txDate = new Date(tx.transactionDate ?? tx.createdAt ?? 0)
      const items = Array.isArray(tx.items) ? tx.items : []
      return items
        .map((line: any) => ({
          inventoryItemId: String(line.inventoryItemId ?? line.inventoryItem?.id ?? ''),
          quantity: num(line.quantity),
          transactionDate: txDate,
          rawLine: line,
        }))
        .filter((line: any) => line.inventoryItemId && selectedIds.has(line.inventoryItemId))
    })

    // PART 1: Build firstTransactionDateMap
    const firstTransactionDateMap = new Map<string, Date>()
    filteredRows.forEach((row: any) => {
      const itemId = String(row.materialId ?? row.inventoryItemId ?? row.id)
      const itemTxRows = movements.filter((m: any) => m.inventoryItemId === itemId)
      if (itemTxRows.length > 0) {
        const minTxDate = new Date(Math.min(...itemTxRows.map((m: any) => m.transactionDate.getTime())))
        firstTransactionDateMap.set(itemId, minTxDate)
      } else {
        const createdAt = row.createdAt ? new Date(row.createdAt) : null
        if (createdAt && !isNaN(createdAt.getTime())) {
          firstTransactionDateMap.set(itemId, createdAt)
        }
      }
    })

    const isMainWarehouseLine = (line: any) => {
      const warehouse = line?.warehouse ?? line?.zone?.warehouse
      if (!warehouse) return true
      const code = String(warehouse.code ?? '').trim().toUpperCase()
      const name = String(warehouse.name ?? '').trim().toLowerCase()
      return code === 'MAIN' || name.includes('kho chính') || name.includes('kho chinh')
    }

    const stockAt = (row: any, endDate: Date) => {
      const itemId = String(row.materialId ?? row.inventoryItemId ?? row.id)
      const afterEnd = movements
        .filter((line: any) => line.inventoryItemId === itemId && line.transactionDate > endDate)
        .reduce((sum: number, line: any) => sum + num(line.quantity), 0)
      return totalWarehouseStock(row) - afterEnd
    }

    const mainStockAt = (row: any, endDate: Date) => {
      const itemId = String(row.materialId ?? row.inventoryItemId ?? row.id)
      const afterEnd = movements
        .filter((line: any) => line.inventoryItemId === itemId && line.transactionDate > endDate && isMainWarehouseLine(line.rawLine))
        .reduce((sum: number, line: any) => sum + num(line.quantity), 0)
      return mainWarehouseStock(row) - afterEnd
    }

    // PART 2 & PART 3: Replace material existence logic and rebuild snapshots
    const snapshots = snapshotDates.map((end) => {
      let quantity = 0
      let value = 0
      let codes = 0
      let low = 0
      let out = 0

      filteredRows.forEach((row: any) => {
        const itemId = String(row.materialId ?? row.inventoryItemId ?? row.id)
        const firstTxDate = firstTransactionDateMap.get(itemId)
        const existed = firstTxDate && firstTxDate <= end
        if (!existed) return

        codes += 1
        const stock = stockAt(row, end)
        const mainStock = mainStockAt(row, end)
        const averageCost = num(row.averageCost)
        const minimumStock = num(row.minimumStock || 5)
        quantity += stock
        value += stock * averageCost
        if (mainStock <= 0) out += 1
        else if (minimumStock > 0 && mainStock <= minimumStock) low += 1
      })

      return {
        value: Math.max(0, value),
        quantity: Math.max(0, quantity),
        codes,
        low,
        out,
      }
    })

    const realTrend = {
      value: snapshots.map((row) => row.value),
      quantity: snapshots.map((row) => row.quantity),
      codes: snapshots.map((row) => row.codes),
      low: snapshots.map((row) => row.low),
      out: snapshots.map((row) => row.out),
    }

    const flat = (val: number) => Array.from({ length: 12 }, () => val)
    const trend = ageInDays >= 365 ? realTrend : {
      value: flat(kpis.totalValue),
      quantity: flat(kpis.totalQty),
      codes: flat(kpis.totalCodes),
      low: flat(kpis.low),
      out: flat(kpis.out),
    }

    // PART 4: Replace code-count month calculations using firstTransactionDateMap
    return {
      value: trend.value,
      quantity: trend.quantity,
      codes: trend.codes,
      low: trend.low,
      out: trend.out,
      newCodesThisMonth: filteredRows.filter((row: any) => {
        const itemId = String(row.materialId ?? row.inventoryItemId ?? row.id)
        const firstTxDate = firstTransactionDateMap.get(itemId)
        if (!firstTxDate) return false
        return monthKey(firstTxDate) === monthKey(now)
      }).length,
      newCodesPreviousMonth: filteredRows.filter((row: any) => {
        const itemId = String(row.materialId ?? row.inventoryItemId ?? row.id)
        const firstTxDate = firstTransactionDateMap.get(itemId)
        if (!firstTxDate) return false
        const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        return monthKey(firstTxDate) === monthKey(previousMonth)
      }).length,
    }
  }, [transactions, filteredRows, kpis, overviewData])

  const kpiDeltas = useMemo(() => {
    const percent = (curr: number, prev: number, suffix: string) => {
      const diff = curr - prev
      const absDiff = Math.abs(diff)
      const formattedDiff = suffix === 'đ' ? formatCurrencyVnd(absDiff) : `${formatQuantity(absDiff, 1)} ${suffix}`
      const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : ''
      const arrowPrefix = arrow ? `${arrow}${formattedDiff}` : `0 ${suffix}`
      
      if (!prev) {
        if (!curr) return `0 ${suffix} (0%)`
        return `▲${formattedDiff} (+100%)`
      }
      const delta = (diff / Math.abs(prev)) * 100
      if (delta === 0) return `0 ${suffix} (0%)`
      const sign = delta > 0 ? '+' : '-'
      const formattedDelta = (delta % 1 === 0 ? Math.abs(delta).toFixed(0) : Math.abs(delta).toFixed(1)).replace('.', ',')
      return `${arrowPrefix} (${sign}${formattedDelta}%)`
    }

    const count = (curr: number, prev: number, suffix = 'mã') => {
      const diff = curr - prev
      if (diff === 0) return `0 ${suffix}`
      const arrow = diff > 0 ? '▲' : '▼'
      return `${arrow}${Math.abs(diff)} ${suffix}`
    }

    return {
      value: percent(kpiTrend.value.at(-1) ?? 0, kpiTrend.value.at(-2) ?? 0, 'đ'),
      quantity: percent(kpiTrend.quantity.at(-1) ?? 0, kpiTrend.quantity.at(-2) ?? 0, 'tấn'),
      codes: count(kpiTrend.codes.at(-1) ?? 0, kpiTrend.codes.at(-2) ?? 0, 'mã'),
      low: count(kpiTrend.low.at(-1) ?? 0, kpiTrend.low.at(-2) ?? 0, 'mã'),
      out: count(kpiTrend.out.at(-1) ?? 0, kpiTrend.out.at(-2) ?? 0, 'mã'),
    }
  }, [kpiTrend])

  const kpiNoteColors = useMemo(() => {
    const getNoteColorClass = (curr: number, prev: number, isAlertMetric: boolean) => {
      const diff = curr - prev
      if (diff === 0) return 'text-slate-400'
      if (isAlertMetric) {
        return diff < 0 ? 'text-emerald-400' : 'text-red-400'
      } else {
        return diff > 0 ? 'text-emerald-400' : 'text-red-400'
      }
    }
    return {
      value: getNoteColorClass(kpiTrend.value.at(-1) ?? 0, kpiTrend.value.at(-2) ?? 0, false),
      quantity: getNoteColorClass(kpiTrend.quantity.at(-1) ?? 0, kpiTrend.quantity.at(-2) ?? 0, false),
      codes: getNoteColorClass(kpiTrend.codes.at(-1) ?? 0, kpiTrend.codes.at(-2) ?? 0, false),
      low: getNoteColorClass(kpiTrend.low.at(-1) ?? 0, kpiTrend.low.at(-2) ?? 0, true),
      out: getNoteColorClass(kpiTrend.out.at(-1) ?? 0, kpiTrend.out.at(-2) ?? 0, true),
    }
  }, [kpiTrend])

  const quantityDelta = useMemo(() => {
    const curr = kpiTrend.quantity.at(-1) ?? 0
    const prev = kpiTrend.quantity.at(-2) ?? 0
    const diff = curr - prev
    const absDiff = Math.abs(diff)
    const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : ''
    if (!prev) {
      if (!curr) return { text: '0 tấn (0%)', color: 'text-slate-400' }
      return { text: `▲${formatQuantity(absDiff, 1)} tấn (+100%)`, color: 'text-emerald-400' }
    }
    const percent = (diff / Math.abs(prev)) * 100
    const sign = percent >= 0 ? '+' : '-'
    return {
      text: `${arrow}${formatQuantity(absDiff, 1)} tấn (${sign}${Math.abs(percent).toFixed(1)}%)`,
      color: diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-slate-400',
    }
  }, [kpiTrend])

  const alertsDiff = useMemo(() => {
    const curr = (kpiTrend.low.at(-1) ?? 0) + (kpiTrend.out.at(-1) ?? 0);
    const prev = (kpiTrend.low.at(-2) ?? 0) + (kpiTrend.out.at(-2) ?? 0);
    const diff = curr - prev;
    const absDiff = Math.abs(diff);
    let text = '';
    let color = 'text-slate-400';

    if (diff === 0) {
      text = 'Không thay đổi';
    } else if (diff > 0) {
      text = `▲ ${absDiff} cảnh báo so với tháng trước`;
      color = 'text-red-400';
    } else {
      text = `▼ ${absDiff} cảnh báo so với tháng trước`;
      color = 'text-emerald-400';
    }

    // Nếu không có dữ liệu tháng trước, hiển thị fallback
    if (prev === 0 && curr === 0) {
      text = 'Chưa có cảnh báo';
      color = 'text-slate-400';
    } else if (prev === 0 && curr > 0) {
      text = `▲ ${curr} cảnh báo mới (tháng này)`;
      color = 'text-red-400';
    }

    return { text, color };
  }, [kpiTrend]);

  const quickStats = useMemo(() => {
    const today = overviewData?.today ?? {}
    const month = overviewData?.month ?? {}
    const metric = (source: any, type: string) => source?.[type] ?? {}
    return [
      { title: 'Nhập kho hôm nay', value: `${formatQuantity(num(metric(today, 'INBOUND').quantity), 0)} tấn`, note: `${num(metric(today, 'INBOUND').documents)} phiếu`, tone: 'text-cyan-300' },
      { title: 'Xuất kho hôm nay', value: `${formatQuantity(num(metric(today, 'OUTBOUND').quantity), 0)} tấn`, note: `${num(metric(today, 'OUTBOUND').documents)} phiếu`, tone: 'text-red-300' },
      { title: 'Điều chuyển hôm nay', value: `${formatQuantity(num(metric(today, 'TRANSFER').quantity), 0)} tấn`, note: `${num(metric(today, 'TRANSFER').documents)} phiếu`, tone: 'text-blue-300' },
      { title: 'Điều chỉnh tháng này', value: `${formatQuantity(num(metric(month, 'ADJUSTMENT').quantity), 0)} tấn`, note: `${num(metric(month, 'ADJUSTMENT').documents)} phiếu`, tone: 'text-emerald-300' },
      { title: 'Cảnh báo tồn kho', value: `${kpis.low + kpis.out} mã`, note: `${kpis.low} sắp hết · ${kpis.out} hết hàng`, tone: 'text-amber-300' },
    ]
  }, [overviewData, kpis.low, kpis.out])

  const warehouseOptions = useMemo(() => {
    const map = new Map<string, string>()
    ;(zones as any[]).forEach((zone) => {
      const key = zone.warehouse?.code ?? zone.code
      const label = zone.warehouse?.name ?? `${zone.code} - ${zone.name}`
      if (key) map.set(String(key), label)
    })
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [zones])

  function applySearch() {
    setSearch(searchDraft)
    setPage(1)
  }

  function resetFilters() {
    setSearchDraft('')
    setSearch('')
    setCategoryFilter('')
    setUsageFilter('')
    setZoneFilter('')
    setStatusFilter('')
    setPage(1)
    setZoneChartPage(1)
    setAlertChartPage(1)
    void refetchMaterials()
    void refetchOverview()
  }

  return (
    <EnterpriseModulePage>
      <MaterialDrawer
        open={open}
        material={selectedMaterial}
        onClose={() => {
          setOpen(false)
          setSelectedMaterial(null)
        }}
      />

      <InventoryTabWorkspace />

      <div className="space-y-1 -mt-2">
        <div className="grid grid-cols-1 gap-1 md:grid-cols-5">
          <InventoryMetricCard
            title="Tổng giá trị tồn kho"
            value={money(kpis.totalValue)}
            note={kpiDeltas.value}
            noteClassName={kpiNoteColors.value}
            tone="emerald"
            icon={<CircleDollarSign size={15} />}
            trend={kpiTrend.value}
          />
          <InventoryMetricCard
            title="Tổng khối lượng"
            value={`${formatQuantity(kpis.totalQty, 0)} tấn`}
            note={kpiDeltas.quantity}
            noteClassName={kpiNoteColors.quantity}
            tone="cyan"
            icon={<RefreshCw size={15} />}
            trend={kpiTrend.quantity}
          />
          <InventoryMetricCard
            title="Mã vật tư"
            value={formatQuantity(kpis.totalCodes, 0)}
            note={kpiDeltas.codes}
            noteClassName={kpiNoteColors.codes}
            tone="indigo"
            icon={<PackageCheck size={15} />}
            trend={kpiTrend.codes}
            active={!statusFilter}
            onClick={() => { setStatusFilter(''); setPage(1) }}
          />
          <InventoryMetricCard
            title="Sắp hết hàng"
            value={formatQuantity(kpis.low, 0)}
            note={kpiDeltas.low}
            noteClassName={kpiNoteColors.low}
            tone="amber"
            icon={<TriangleAlert size={15} />}
            trend={kpiTrend.low}
            active={statusFilter === 'LOW'}
            onClick={() => { setStatusFilter('LOW'); setPage(1) }}
          />
          <InventoryMetricCard
            title="Hết hàng"
            value={formatQuantity(kpis.out, 0)}
            note={kpiDeltas.out}
            noteClassName={kpiNoteColors.out}
            tone="red"
            icon={<ShieldX size={15} />}
            trend={kpiTrend.out}
            active={statusFilter === 'OUT'}
            onClick={() => { setStatusFilter('OUT'); setPage(1) }}
          />
        </div>

        <InventoryPanel className="rounded-xl">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-[180px_180px_180px_180px_minmax(260px,1fr)_130px_120px]">
            <LabeledFilter label="">
                    <select
                      value={zoneFilter}
                      onChange={(e) => {
                        setZoneFilter(e.target.value)
                        setPage(1)
                      }}
                      className={compactInput}
                    >
                      <option value="">Tất cả kho</option>
                      {warehouseOptions.map((warehouse) => (
                        <option key={warehouse.value} value={warehouse.value}>
                          {warehouse.label}
                        </option>
                      ))}
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
                    <select
                      value={categoryFilter}
                      onChange={(e) => {
                        setCategoryFilter(e.target.value)
                        setPage(1)
                      }}
                      className={compactInput}
                    >
                      <option value="">Tất cả nhóm vật tư</option>
                      {categories.map((category: any) => <option key={category.id} value={category.id}>{category.name}</option>)}
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
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-1 items-start">
                    <InventoryPanel className="xl:col-span-9">
                      <div className="mb-1 flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-white">Danh sách tồn kho</h3>
                        <button onClick={() => setShowAll(true)} className="text-xs font-medium text-cyan-300 hover:text-cyan-200">Xem tất cả</button>
                      </div>
                      {deleteError && <div className="mb-3 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{deleteError}</div>}
                      <div className="rounded-lg border border-white/10 overflow-hidden">
                      <CockpitTableShell className={COCKPIT_HEIGHTS.TABLE_SM}>
                        <table className="w-full min-w-[1050px] text-sm table-fixed">
                          <colgroup>
                            <col className="w-[140px]" />   {/* Tên vật tư */}
                            <col className="w-[140px]" />   {/* Quy cách */}
                            <col className="w-[40px]" />    {/* ĐVT */}
                            <col className="w-[100px]" />   {/* Kho chính */}
                            <col className="w-[100px]" />   {/* Kho SX */}
                            <col className="w-[100px]" />   {/* Tổng tồn */}
                            <col className="w-[110px]" />   {/* Đơn giá */}
                            <col className="w-[130px]" />   {/* Giá trị */}
                            <col className="w-[150px]" />   {/* Vị trí */}
                            <col className="w-[100px]" />   {/* Trạng thái */}
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
                            {pagedRows.map((item: any) => (
                              <tr key={item.id} onClick={() => openMaterial(item)} className={`cursor-pointer ${inventoryTableRow}`}>
                                <td className="truncate px-1.5 py-0.5 text-white" title={item.materialName}>{item.materialName}</td>
                                <td className="truncate px-1.5 py-0.5 text-slate-300" title={item.materialType ?? '-'}>{item.materialType ?? '-'}</td>
                                <td className="px-1.5 py-0.5 text-slate-300">{item.unit ?? '-'}</td>
                                <td className="truncate px-1.5 py-0.5 text-right font-mono tabular-nums text-slate-200" title={formatQuantity(mainWarehouseStock(item), 3)}>{formatQuantity(mainWarehouseStock(item), 3)}</td>
                                <td className="truncate px-1.5 py-0.5 text-right font-mono tabular-nums text-amber-300" title={formatQuantity(productionWarehouseStock(item), 3)}>{formatQuantity(productionWarehouseStock(item), 3)}</td>
                                <td className="truncate px-1.5 py-0.5 text-right font-mono tabular-nums text-cyan-300" title={formatQuantity(totalWarehouseStock(item), 3)}>{formatQuantity(totalWarehouseStock(item), 3)}</td>
                                <td className="truncate px-1.5 py-0.5 text-right text-slate-300" title={money(Number(item.averageCost ?? 0))}>{money(Number(item.averageCost ?? 0))}</td>
                                <td className="truncate px-1.5 py-0.5 text-right font-medium text-cyan-300" title={money(Number(item.inventoryValue ?? 0))}>{money(Number(item.inventoryValue ?? 0))}</td>
                                <td className="truncate px-1.5 py-0.5 align-middle">
                                  <span
                                    title={rowLocations(item).map(locationLabel).join('\n')}
                                    className="inline-block w-full truncate rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-1.5 py-0.5 text-[10px] text-cyan-100"
                                  >
                                    {displayLocation(item)}
                                  </span>
                                </td>
                                <td className="px-1.5 py-0.5">
                                  <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs ${stockStatusClass(stockStatus(item))}`}>
                                    {stockStatusLabel(stockStatus(item))}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </CockpitTableShell>
                      </div>
                      <MaterialsPagination page={activePage} pageCount={totalPages} total={materialsData?.total ?? 0} pageSize={PAGE_SIZE} onPageChange={setPage} />
                    </InventoryPanel>

                   <div className="space-y-1 xl:col-span-3">
                    <ChartCard
                      title="Phân bố tồn kho"
                      value={`${formatQuantity(kpis.totalQty, 1)} tấn`}
                      delta={`${zoneDistribution.length} kho hoạt động`}
                      page={pagedZoneDistribution.page}
                      pageCount={pagedZoneDistribution.pageCount}
                      onPrev={() => setZoneChartPage((p) => Math.max(1, p - 1))}
                      onNext={() => setZoneChartPage((p) => Math.min(pagedZoneDistribution.pageCount, p + 1))}
                      className="h-[220px]"
                      chartHeightClass="h-[120px] overflow-y-auto scrollbar-none"
                    >
                      <CompactDonut
                        segments={pagedZoneSegments}
                        centerValue={formatQuantity(kpis.totalQty, 1)}
                        centerLabel="tấn"
                      />
                    </ChartCard>

                      <ChartCard
                        title="Biến động tồn kho"
                        value={`${formatQuantity(kpis.totalQty, 1)} tấn`}
                        delta={quantityDelta.text}
                        deltaColorClass={quantityDelta.color}
                        className="h-[178px]"
                        chartHeightClass="h-[82px] overflow-y-auto scrollbar-none"
                      >
                        <StockTrendChart rows={monthlyTrend} />
                      </ChartCard>

                      <ChartCard
                        title="Cảnh báo tồn kho"
                        value={`${alerts.length} cảnh báo`}
                        delta={alertsDiff.text}
                        deltaColorClass={alertsDiff.color}
                        action={<button onClick={() => setShowAllAlerts(true)} className="text-[10px] text-cyan-300 hover:text-cyan-200 transition">Xem tất cả</button>}
                        className="h-[200px]"
                        chartHeightClass="h-[140px] overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-width-none"
                      >
                        <AlertRows rows={alerts} />
                      </ChartCard>
                    </div>
                  </div>

                <CockpitChartCard title="Thống kê nhanh" className="min-h-0">
                  <div className="grid grid-cols-1 sm:grid-cols-5 divide-y sm:divide-y-0 divide-white/10">
                    {quickStats.map((item, idx) => (
                      <div
                        key={item.title}
                        className={`flex items-center justify-between px-3 py-1.5 ${
                          idx < quickStats.length - 1 ? 'sm:border-r border-white/10' : ''
                        }`}
                      >
                        <span className="text-xs text-slate-400">{item.title}</span>
                        <div className="text-right">
                          <div className={`text-sm font-bold ${item.tone}`}>{item.value}</div>
                          <div className="text-[10px] text-slate-500">{item.note}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CockpitChartCard>
              </div>

              {showAll && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
                  <div className="max-h-[90vh] w-full max-w-[95vw] overflow-auto rounded-xl border border-white/10 bg-[#0b1424]/95 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        Danh sách trang hiện tại ({filteredRows.length}/{materialsData?.total ?? 0} vật tư)
                      </h3>
                      <button
                        onClick={() => setShowAll(false)}
                        className="rounded border border-white/10 bg-white/5 px-3 py-1 text-slate-300 hover:text-white"
                      >
                        Đóng
                      </button>
                    </div>
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
                    {filteredRows.map((item: any) => (
                      <tr key={item.id} onClick={() => openMaterial(item)} className="cursor-pointer border-t border-white/10 hover:bg-white/[0.06]">
                        <td className="truncate px-3 py-1.5 text-cyan-300" title={item.materialCode}>{item.materialCode}</td>
                        <td className="truncate px-3 py-1.5 text-white" title={item.materialName}>{item.materialName}</td>
                        <td className="truncate px-3 py-2 text-slate-300" title={materialUsageLabel(item.materialUsageType)}>{materialUsageLabel(item.materialUsageType)}</td>
                        <td className="truncate px-3 py-2 text-slate-300" title={item.category}>{item.category ?? '-'}</td>
                        <td className="truncate px-3 py-1.5 text-slate-300" title={item.materialType ?? '-'}>{item.materialType ?? '-'}</td>
                        <td className="px-3 py-1.5 text-slate-300">{item.unit ?? '-'}</td>
                        <td className="truncate px-3 py-1.5 text-right font-mono tabular-nums text-slate-200" title={formatQuantity(mainWarehouseStock(item), 3)}>{formatQuantity(mainWarehouseStock(item), 3)}</td>
                        <td className="truncate px-3 py-1.5 text-right font-mono tabular-nums text-amber-300" title={formatQuantity(productionWarehouseStock(item), 3)}>{formatQuantity(productionWarehouseStock(item), 3)}</td>
                        <td className="truncate px-3 py-1.5 text-right font-mono tabular-nums text-cyan-300" title={formatQuantity(totalWarehouseStock(item), 3)}>{formatQuantity(totalWarehouseStock(item), 3)}</td>
                        <td className="truncate px-3 py-1.5 text-right text-slate-300" title={money(Number(item.averageCost ?? 0))}>{money(Number(item.averageCost ?? 0))}</td>
                        <td className="truncate px-3 py-1.5 text-right font-medium text-cyan-300" title={money(Number(item.inventoryValue ?? 0))}>{money(Number(item.inventoryValue ?? 0))}</td>
                        <td className="truncate px-3 py-1.5">
                          <span
                            title={rowLocations(item).map(locationLabel).join('\n')}
                            className="inline-block w-full truncate rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-100"
                          >
                            {displayLocation(item)}
                          </span>
                        </td>
                        <td className="px-3 py-1.5">
                          <span className={`inline-flex rounded-lg border px-3 py-0.5 text-xs ${stockStatusClass(stockStatus(item))}`}>
                            {stockStatusLabel(stockStatus(item))}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      {showAllAlerts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md">
          <div className="max-h-[90vh] w-full max-w-[95vw] overflow-hidden rounded-xl border border-white/10 bg-[#0b1424]/95 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Tất cả cảnh báo tồn kho</h3>
              </div>
              <button onClick={() => setShowAllAlerts(false)} className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300 hover:text-white">Đóng</button>
            </div>
             <div className="grid max-h-[74vh] gap-4 overflow-auto p-4 xl:grid-cols-[1fr_320px]">
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
                    {alerts.map((row: any) => (
                      <tr key={row.id} className="border-t border-white/10 text-slate-200 hover:bg-white/[0.04]">
                        <td className="truncate px-4 py-2.5 text-cyan-300" title={row.materialCode}>{row.materialCode}</td>
                        <td className="truncate px-4 py-2.5" title={row.materialName}>{row.materialName}</td>
                        <td className="truncate px-4 py-2.5 text-slate-400" title={row.category ?? '-'}>{row.category ?? '-'}</td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums">{formatQuantity(row.stock, 3)}</td>
                        <td className="px-4 py-2.5 text-right">{formatQuantity(num(row.minimumStock || 5), 0)}</td>
                        <td className="px-4 py-2.5">
                          <span className={`rounded px-2.5 py-1 text-xs font-semibold ${row.level === 'Hết hàng' ? 'bg-red-500/10 text-red-300' : 'bg-amber-500/10 text-amber-300'}`}>{row.level}</span>
                        </td>
                        <td className="truncate px-4 py-2.5 text-slate-400" title={displayLocation(row)}>{displayLocation(row)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-4">
                <ChartCard
                  title="Theo mức độ"
                  value={`${alerts.length} cảnh báo`}
                  delta="Phân bố theo mức"
                  className="h-[300px]"
                  chartHeightClass="h-[300px]"
                >
                  <AlertMiniChart rows={[
                    ['Sắp hết', alerts.filter((row: any) => row.level === 'Sắp hết').length],
                    ['Hết hàng', alerts.filter((row: any) => row.level === 'Hết hàng').length],
                  ]} />
                </ChartCard>

                <ChartCard
                  title="Top tồn thấp"
                  value={`${Math.min(6, alerts.length)} vật tư gần ngưỡng`}
                  delta="Dưới định mức"
                  className="h-[350px]"
                  chartHeightClass="h-[300px]"
                >
                  <AlertMiniChart rows={alerts.slice(0, 6).map((row: any) => [
                    `${row.materialCode} (${formatQuantity(row.stock, 1)} tấn)`,
                    row.stock
                  ])} />
                </ChartCard>
              </div>
            </div>
          </div>
        </div>
      )}

      <InventoryMaterialDetailModal
        open={Boolean(detailMaterial)}
        detail={detailMaterialData}
        fallback={detailMaterial}
        onClose={() => setDetailMaterial(null)}
        onEdit={() => {
          editMaterial(detailMaterial)
          setDetailMaterial(null)
        }}
      />
    </EnterpriseModulePage>
  )
}

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

function AlertMiniChart({ rows, colors }: { rows: Array<[string, number]>; colors?: string[] }) {
  const max = Math.max(1, ...rows.map(([, value]) => value))
  const defaultColors = ['from-amber-500 to-orange-400', 'from-red-500 to-pink-500', 'from-cyan-500 to-blue-400', 'from-emerald-500 to-teal-400']
  return (
    <div className="space-y-3 py-1">
      {rows.map(([label, value], index) => {
        const percent = max > 0 ? (value / max) * 100 : 0
        const barColor = colors ? colors[index % colors.length] : defaultColors[index % defaultColors.length]
        return (
          <div key={label} className="group">
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-slate-300 font-medium group-hover:text-white transition text-[11px]">{label}</span>
              <span className="text-cyan-300 font-mono font-semibold text-[11px]">{formatQuantity(value, 0)}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-900 ring-1 ring-white/[0.05]">
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

function MaterialsPagination({
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
    <div className="grid grid-cols-1 items-center gap-2 px-4 py-1 text-xs text-slate-400 md:grid-cols-3">
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
        <button
          disabled={safePage <= 1}
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          className={inventoryMutedButton}
        >
          Trước
        </button>
        <button
          disabled={safePage >= safePageCount}
          onClick={() => onPageChange(Math.min(safePageCount, safePage + 1))}
          className={inventoryMutedButton}
        >
          Sau
        </button>
      </div>
    </div>
  )
}
