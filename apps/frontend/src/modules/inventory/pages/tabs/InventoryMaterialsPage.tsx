import { useMemo, useState, type ReactNode } from 'react'
import { CircleDollarSign, PackageCheck, RefreshCw, ShieldX, TriangleAlert } from 'lucide-react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { InventoryMaterialDetailModal } from '../../components/InventoryMaterialDetailModal'
import { MaterialDrawer } from '../../components/material-table/MaterialDrawer'
import { InventoryTabWorkspace } from '../../components/InventoryTabWorkspace'
import {
  InventoryPanel,
  inventoryTableHead,
  inventoryTableRow,
  inventoryTableShell,
  inventoryMutedButton,
} from '../../components/InventoryVisuals'
import { useDeleteMaterial } from '../../hooks/useDeleteMaterial'
import { useCategories } from '../../hooks/useCategories'
import { useInventoryAudit } from '../../hooks/useInventoryAudit'
import { useInventoryTransactions } from '../../hooks/useInventoryTransactions'
import { useMaterialDetail } from '../../hooks/useMaterialDetail'
import { useZones } from '../../hooks/useZones'
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

function formatPercentDelta(current: number, previous: number) {
  if (!previous) {
    if (!current) return '+ 0% so với tháng trước'
    return '+ mới so với tháng trước'
  }
  const value = ((current - previous) / Math.abs(previous)) * 100
  return `${value >= 0 ? '+' : ''} ${value.toFixed(1)}% so với tháng trước`
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
  note,
  action,
  page,
  pageCount,
  onPrev,
  onNext,
  children,
}: {
  title: string
  note?: string
  action?: ReactNode
  page?: number
  pageCount?: number
  onPrev?: () => void
  onNext?: () => void
  children: ReactNode
}) {
  const hasPages = Boolean(page && pageCount && pageCount > 1)
  return (
    <section className="h-[202px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/45 p-3 shadow-[0_18px_56px_rgba(0,0,0,0.22)] ring-1 ring-white/[0.025] backdrop-blur-2xl">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-xs font-bold uppercase tracking-[0.12em] text-white">{title}</h3>
          {note ? <p className="mt-0.5 text-[11px] text-slate-500">{note}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {action}
          {hasPages ? (
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <button onClick={onPrev} className="rounded border border-white/10 px-1.5 py-0.5 text-slate-300 hover:bg-white/10">‹</button>
              <span>{page}/{pageCount}</span>
              <button onClick={onNext} className="rounded border border-white/10 px-1.5 py-0.5 text-slate-300 hover:bg-white/10">›</button>
            </div>
          ) : null}
        </div>
      </div>
      <div className="h-[154px] overflow-hidden">{children}</div>
    </section>
  )
}

function InventoryMetricCard({
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
  tone?: 'blue' | 'emerald' | 'cyan' | 'amber' | 'red'
  icon: ReactNode
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

  if (onClick) {
    return <button type="button" onClick={onClick} className={className}>{content}</button>
  }

  return <section className={className}>{content}</section>
}

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
              <span className="text-slate-300">{formatQuantity(item.value, 0)} ({percent.toFixed(1)}%)</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function InventoryMaterialsPage() {
  const { data: rows = [], refetch: refetchAudit } = useInventoryAudit()
  const { data: zones = [] } = useZones()
  const { data: categories = [] } = useCategories()
  const { data: transactions = [] } = useInventoryTransactions({})
  const deleteMaterialMutation = useDeleteMaterial()

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

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((item: any) => {
      if (q) {
        const match = [
          item.materialCode,
          item.materialName,
          item.materialType,
          item.category,
          item.zone,
          item.position,
          displayLocation(item),
        ].join(' ').toLowerCase().includes(q)
        if (!match) return false
      }

      if (categoryFilter && String(item.categoryId ?? '') !== categoryFilter) return false
      if (usageFilter && String(item.materialUsageType ?? 'PRIMARY') !== usageFilter) return false

      if (zoneFilter) {
        const zoneText = rowLocations(item)
          .map((location: any) => [
            location.zoneCode,
            location.zoneName,
            location.warehouseName,
            location.warehouseCode,
          ].filter(Boolean).join(' '))
          .join(' ')
        if (!zoneText.toLowerCase().includes(zoneFilter.toLowerCase())) return false
      }

      if (statusFilter) {
        const status = stockStatus(item)
        if (status !== statusFilter) return false
      }
      return true
    })
  }, [rows, search, categoryFilter, usageFilter, zoneFilter, statusFilter])

  const kpis = useMemo(() => {
    const totalValue = filteredRows.reduce((acc: number, row: any) => acc + Number(row.inventoryValue ?? 0), 0)
    const totalQty = filteredRows.reduce((acc: number, row: any) => acc + totalWarehouseStock(row), 0)
    const low = filteredRows.filter((row: any) => stockStatus(row) === 'LOW').length
    const out = filteredRows.filter((row: any) => stockStatus(row) === 'OUT').length
    return {
      totalValue,
      totalQty,
      totalCodes: filteredRows.length,
      low,
      out,
    }
  }, [filteredRows])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const activePage = Math.min(page, totalPages)
  const pagedRows = filteredRows.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE)

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
    const map = new Map<string, number>()
    filteredRows.forEach((row: any) => {
      const locations = rowLocations(row)
      if (!locations.length) {
        map.set('KHU MẶC ĐỊNH', (map.get('KHU MẶC ĐỊNH') ?? 0) + totalWarehouseStock(row))
        return
      }
      locations.forEach((location: any) => {
        const key = locationLabel(location) || 'KHU MẶC ĐỊNH'
        map.set(key, (map.get(key) ?? 0) + num(location.quantity))
      })
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [filteredRows])

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
    const txRows = transactionRows(transactions)
    const now = new Date()
    const months = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      return { date, key }
    })
    const movements = months.map(({ key }) => {
      return txRows
        .filter((tx: any) => transactionDateKey(tx, 7) === key)
        .reduce((sum: number, tx: any) => {
          const type = String(tx.type ?? '').toUpperCase()
          const amount = transactionAmount(tx)
          if (type === 'OUTBOUND') return sum - amount
          if (type === 'INBOUND' || type === 'ADJUSTMENT' || type === 'RETURN') return sum + amount
          return sum
        }, 0)
    })
    let runningValue = Math.max(0, kpis.totalValue - movements.reduce((sum, value) => sum + value, 0))
    return months.map(({ date }, index) => {
      runningValue = Math.max(0, runningValue + movements[index])
      return {
        label: `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(2)}`,
        value: runningValue,
      }
    })
  }, [transactions, kpis.totalValue])

  const kpiTrend = useMemo(() => {
    const txRows = transactionRows(transactions)
    const now = new Date()
    const months = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
      return {
        key: monthKey(date),
        end: monthEnd(date, now),
      }
    })
    const selectedIds = new Set(filteredRows.map((row: any) => String(row.materialId ?? row.inventoryItemId ?? row.id)))
    const movements = txRows.flatMap((tx: any) => {
      const txDate = new Date(tx.transactionDate ?? tx.createdAt ?? 0)
      return transactionItemRows(tx)
        .filter((line: any) => selectedIds.has(line.inventoryItemId))
        .map((line: any) => ({
          ...line,
          transactionDate: txDate,
        }))
    })
    const stockAt = (row: any, endDate: Date) => {
      const itemId = String(row.materialId ?? row.inventoryItemId ?? row.id)
      const afterEnd = movements
        .filter((line: any) => line.inventoryItemId === itemId && line.transactionDate > endDate)
        .reduce((sum: number, line: any) => sum + num(line.quantity), 0)
      return totalWarehouseStock(row) - afterEnd
    }
    const snapshots = months.map(({ end }) => {
      let quantity = 0
      let value = 0
      let codes = 0
      let low = 0
      let out = 0

      filteredRows.forEach((row: any) => {
        const createdAt = row.createdAt ? new Date(row.createdAt) : null
        const existed = !createdAt || createdAt <= end
        if (!existed) return

        codes += 1
        const stock = stockAt(row, end)
        const averageCost = num(row.averageCost)
        const minimumStock = num(row.minimumStock || 5)
        quantity += stock
        value += stock * averageCost
        if (stock <= 0) out += 1
        else if (stock <= minimumStock || stock <= 5) low += 1
      })

      return {
        value: Math.max(0, value),
        quantity: Math.max(0, quantity),
        codes,
        low,
        out,
      }
    })

    return {
      value: snapshots.map((row) => row.value),
      quantity: snapshots.map((row) => row.quantity),
      codes: snapshots.map((row) => row.codes),
      low: snapshots.map((row) => row.low),
      out: snapshots.map((row) => row.out),
      newCodesThisMonth: filteredRows.filter((row: any) => {
        if (!row.createdAt) return false
        return monthKey(new Date(row.createdAt)) === monthKey(now)
      }).length,
      newCodesPreviousMonth: filteredRows.filter((row: any) => {
        if (!row.createdAt) return false
        const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        return monthKey(new Date(row.createdAt)) === monthKey(previousMonth)
      }).length,
    }
  }, [transactions, filteredRows])

  const kpiDeltas = useMemo(() => {
    const delta = (values: number[]) => formatPercentDelta(values.at(-1) ?? 0, values.at(-2) ?? 0)
    const newCodeDelta = formatPercentDelta(kpiTrend.newCodesThisMonth, kpiTrend.newCodesPreviousMonth)
    return {
      value: delta(kpiTrend.value),
      quantity: delta(kpiTrend.quantity),
      codes: `+ ${formatQuantity(kpiTrend.newCodesThisMonth, 0)} mã mới · ${newCodeDelta}`,
      low: delta(kpiTrend.low),
      out: delta(kpiTrend.out),
    }
  }, [kpiTrend])

  const quickStats = useMemo(() => {
    const txRows = transactionRows(transactions)
    const today = new Date().toISOString().slice(0, 10)
    const month = new Date().toISOString().slice(0, 7)
    const byTypeToday = (type: string) => txRows.filter((tx: any) => String(tx.type ?? '').toUpperCase() === type && transactionDateKey(tx, 10) === today)
    const byTypeMonth = (type: string) => txRows.filter((tx: any) => String(tx.type ?? '').toUpperCase() === type && transactionDateKey(tx, 7) === month)
    const sumQty = (list: any[]) => list.reduce((sum, tx) => sum + transactionQuantity(tx), 0)
    return [
      { title: 'Nhập kho hôm nay', value: `${formatQuantity(sumQty(byTypeToday('INBOUND')), 0)} tấn`, note: `${byTypeToday('INBOUND').length} phiếu`, tone: 'text-cyan-300' },
      { title: 'Xuất kho hôm nay', value: `${formatQuantity(sumQty(byTypeToday('OUTBOUND')), 0)} tấn`, note: `${byTypeToday('OUTBOUND').length} phiếu`, tone: 'text-red-300' },
      { title: 'Điều chuyển hôm nay', value: `${formatQuantity(sumQty(byTypeToday('TRANSFER')), 0)} tấn`, note: `${byTypeToday('TRANSFER').length} phiếu`, tone: 'text-blue-300' },
      { title: 'Kiểm kê tháng này', value: `${formatQuantity(sumQty(byTypeMonth('ADJUSTMENT')), 0)} tấn`, note: 'Hoàn thành', tone: 'text-emerald-300' },
      { title: 'Chênh lệch tồn kho', value: `${kpis.totalCodes ? (((kpis.low + kpis.out) / kpis.totalCodes) * -100).toFixed(2) : '0.00'}%`, note: 'Theo cảnh báo tồn', tone: 'text-amber-300' },
    ]
  }, [transactions, kpis.low, kpis.out, kpis.totalCodes])

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
    void refetchAudit()
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
        <div className="grid grid-cols-1 gap-1.5 md:grid-cols-5">
          <InventoryMetricCard
            title="Tổng giá trị tồn kho"
            value={money(kpis.totalValue)}
            note={kpiDeltas.value}
            tone="blue"
            icon={<CircleDollarSign size={15} />}
            trend={kpiTrend.value}
          />
          <InventoryMetricCard
            title="Tổng khối lượng"
            value={`${formatQuantity(kpis.totalQty, 0)} tấn`}
            note={kpiDeltas.quantity}
            tone="cyan"
            icon={<RefreshCw size={15} />}
            trend={kpiTrend.quantity}
          />
          <InventoryMetricCard
            title="Mã vật tư"
            value={formatQuantity(kpis.totalCodes, 0)}
            note={kpiDeltas.codes}
            tone="emerald"
            icon={<PackageCheck size={15} />}
            trend={kpiTrend.codes}
            active={!statusFilter}
            onClick={() => { setStatusFilter(''); setPage(1) }}
          />
          <InventoryMetricCard
            title="Vật tư sắp hết hàng"
            value={formatQuantity(kpis.low, 0)}
            note={kpiDeltas.low}
            tone="amber"
            icon={<TriangleAlert size={15} />}
            trend={kpiTrend.low}
            active={statusFilter === 'LOW'}
            onClick={() => { setStatusFilter('LOW'); setPage(1) }}
          />
          <InventoryMetricCard
            title="Vật tư hết hàng"
            value={formatQuantity(kpis.out, 0)}
            note={kpiDeltas.out}
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

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-1">
                    <InventoryPanel className="xl:col-span-9 p-0 pb-0">
                      <div className="mb-1 flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-white">Danh sách tồn kho</h3>
                        <button onClick={() => setShowAll(true)} className="text-xs font-medium text-cyan-300 hover:text-cyan-200">Xem tất cả</button>
                      </div>
                      {deleteError && <div className="mb-3 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{deleteError}</div>}
                      <div className={`${inventoryTableShell} h-[520px] overflow-auto`}>
                        <table className="w-full min-w-[1150px] text-sm table-fixed">
                          <colgroup>
                            <col className="w-[100px]" />   {/* Mã vật tư */}
                            <col className="w-[140px]" />   {/* Tên vật tư */}
                            <col className="w-[100px]" />   {/* Quy cách */}
                            <col className="w-[40px]" />    {/* ĐVT */}
                            <col className="w-[100px]" />   {/* Kho chính */}
                            <col className="w-[100px]" />   {/* Kho SX */}
                            <col className="w-[100px]" />   {/* Tổng tồn */}
                            <col className="w-[110px]" />   {/* Đơn giá */}
                            <col className="w-[130px]" />   {/* Giá trị */}
                            <col className="w-[150px]" />   {/* Vị trí */}
                            <col className="w-[100px]" />   {/* Trạng thái */}
                          </colgroup>
                          <thead className={inventoryTableHead}>
                            <tr>
                              <th className="px-1.5 py-0.5 text-left font-medium">Mã vật tư</th>
                              <th className="px-1.5 py-0.5 text-left font-medium">Tên vật tư</th>
                              <th className="px-1.5 py-0.5 text-left font-medium">Quy cách</th>
                              <th className="px-1.5 py-0.5 text-left font-medium">ĐVT</th>
                              <th className="px-1.5 py-0.5 text-right font-medium">Kho chính</th>
                              <th className="px-1.5 py-0.5 text-right font-medium">Kho SX</th>
                              <th className="px-1.5 py-0.5 text-right font-medium">Tổng tồn</th>
                              <th className="px-1.5 py-0.5 text-right font-medium">Đơn giá</th>
                              <th className="px-1.5 py-0.5 text-right font-medium">Giá trị</th>
                              <th className="px-1.5 py-0.5 text-left font-medium">Vị trí</th>
                              <th className="px-1.5 py-0.5 text-left font-medium">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pagedRows.map((item: any) => (
                              <tr key={item.id} onClick={() => openMaterial(item)} className={`cursor-pointer ${inventoryTableRow}`}>
                                <td className="truncate px-1.5 py-0.5 text-cyan-300" title={item.materialCode}>{item.materialCode}</td>
                                <td className="truncate px-1.5 py-0.5 text-white" title={item.materialName}>{item.materialName}</td>
                                <td className="truncate px-1.5 py-0.5 text-slate-300" title={item.materialType ?? '-'}>{item.materialType ?? '-'}</td>
                                <td className="px-1.5 py-0.5 text-slate-300">{item.unit ?? '-'}</td>
                                <td className="truncate px-1.5 py-0.5 text-right font-mono tabular-nums text-slate-200" title={formatQuantity(mainWarehouseStock(item), 3)}>{formatQuantity(mainWarehouseStock(item), 3)}</td>
                                <td className="truncate px-1.5 py-0.5 text-right font-mono tabular-nums text-amber-300" title={formatQuantity(productionWarehouseStock(item), 3)}>{formatQuantity(productionWarehouseStock(item), 3)}</td>
                                <td className="truncate px-1.5 py-0.5 text-right font-mono tabular-nums text-cyan-300" title={formatQuantity(totalWarehouseStock(item), 3)}>{formatQuantity(totalWarehouseStock(item), 3)}</td>
                                <td className="truncate px-1.5 py-0.5 text-right text-slate-300" title={money(Number(item.averageCost ?? 0))}>{money(Number(item.averageCost ?? 0))}</td>
                                <td className="truncate px-1.5 py-0.5 text-right font-medium text-cyan-300" title={money(Number(item.inventoryValue ?? 0))}>{money(Number(item.inventoryValue ?? 0))}</td>
                                <td className="truncate px-1.5 py-0.5">
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
                      </div>
                      <MaterialsPagination page={activePage} pageCount={totalPages} total={filteredRows.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
                    </InventoryPanel>

                    <div className="space-y-1 xl:col-span-3">
                      <ChartCard title="Phân bố tồn kho theo kho" note="Đơn vị: tấn" page={pagedZoneDistribution.page} pageCount={pagedZoneDistribution.pageCount} onPrev={() => setZoneChartPage((p) => Math.max(1, p - 1))} onNext={() => setZoneChartPage((p) => Math.min(pagedZoneDistribution.pageCount, p + 1))}>
                        <CompactDonut
                          segments={pagedZoneSegments}
                          centerValue={formatQuantity(kpis.totalQty, 0)}
                          centerLabel="tấn"
                        />
                      </ChartCard>

                      <ChartCard title="Biến động tồn kho" note="Giá trị: tỷ đồng">
                        <StockTrendChart rows={monthlyTrend} />
                      </ChartCard>

                      <ChartCard title="Cảnh báo tồn kho" action={<button onClick={() => setShowAllAlerts(true)} className="text-xs text-cyan-300 hover:text-cyan-200">Xem tất cả</button>} page={pagedAlerts.page} pageCount={pagedAlerts.pageCount} onPrev={() => setAlertChartPage((p) => Math.max(1, p - 1))} onNext={() => setAlertChartPage((p) => Math.min(pagedAlerts.pageCount, p + 1))}>
                        <div className="h-[154px] space-y-1.5 overflow-hidden text-xs">
                          {pagedAlerts.rows.map((row: any) => (
                            <div key={row.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-lg border border-white/8 bg-white/[0.035] px-2.5 py-1.5">
                              <span className={row.level === 'Hết hàng' ? 'truncate text-red-300' : 'truncate text-amber-300'}>{row.materialName ?? row.materialCode}</span>
                              <span className="text-slate-400">Kho chính: {formatQuantity(row.stock, 3)}</span>
                              <span className={`rounded px-2 py-0.5 ${row.level === 'Hết hàng' ? 'bg-red-500/10 text-red-300' : 'bg-amber-500/10 text-amber-300'}`}>{row.level}</span>
                            </div>
                          ))}
                          {alerts.length === 0 && <div className="rounded border border-white/10 bg-white/[0.04] px-3 py-4 text-center text-slate-500">Không có cảnh báo tồn kho.</div>}
                        </div>
                      </ChartCard>
                    </div>
                  </div>

                <section className="rounded-2xl border border-white/10 bg-slate-950/45 p-3 shadow-[0_16px_52px_rgba(0,0,0,0.2)]">
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-white">Thống kê nhanh</h3>
                  <div className="grid grid-cols-1 divide-y divide-white/10 md:grid-cols-5 md:divide-x md:divide-y-0">
                    {quickStats.map((item) => (
                      <div key={item.title} className="px-3 py-1.5 first:pl-0 last:pr-0">
                        <div className="text-xs text-slate-400">{item.title}</div>
                        <div className={`mt-0.5 text-base font-semibold ${item.tone}`}>{item.value}</div>
                        <div className="text-xs text-slate-500">{item.note}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {showAll && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
                  <div className="max-h-[90vh] w-full max-w-[95vw] overflow-auto rounded-xl border border-white/10 bg-[#0b1424]/95 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        Toàn bộ danh sách tồn kho ({filteredRows.length} vật tư)
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
                          <col className="w-[140px]" />
                          <col className="w-[180px]" />
                          <col className="w-[120px]" />
                          <col className="w-[120px]" />
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
          <div className="max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-xl border border-white/10 bg-[#0b1424]/95 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Tất cả cảnh báo tồn kho</h3>
                <p className="mt-1 text-xs text-slate-500">{formatQuantity(alerts.length, 0)} cảnh báo theo bộ lọc hiện tại</p>
              </div>
              <button onClick={() => setShowAllAlerts(false)} className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300 hover:text-white">Đóng</button>
            </div>
            <div className="grid max-h-[70vh] gap-4 overflow-auto p-4 xl:grid-cols-[1fr_300px]">
              <div className="overflow-hidden rounded-xl border border-white/10">
                <table className="w-full min-w-[780px] text-sm">
                  <thead className="bg-white/[0.055] text-xs uppercase tracking-[0.08em] text-slate-400">
                    <tr>
                      <th className="px-3 py-2 text-left">Mã vật tư</th>
                      <th className="px-3 py-2 text-left">Tên vật tư</th>
                      <th className="px-3 py-2 text-left">Nhóm</th>
                      <th className="px-3 py-2 text-right">Kho chính</th>
                      <th className="px-3 py-2 text-right">Tồn tối thiểu</th>
                      <th className="px-3 py-2 text-left">Mức cảnh báo</th>
                      <th className="px-3 py-2 text-left">Vị trí</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((row: any) => (
                      <tr key={row.id} className="border-t border-white/10 text-slate-200 hover:bg-white/[0.04]">
                        <td className="px-3 py-2 text-cyan-300">{row.materialCode}</td>
                        <td className="px-3 py-2">{row.materialName}</td>
                        <td className="px-3 py-2 text-slate-400">{row.category ?? '-'}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">{formatQuantity(row.stock, 3)}</td>
                        <td className="px-3 py-2 text-right">{formatQuantity(num(row.minimumStock || 5), 0)}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded px-2 py-1 text-xs ${row.level === 'Hết hàng' ? 'bg-red-500/10 text-red-300' : 'bg-amber-500/10 text-amber-300'}`}>{row.level}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-400">{displayLocation(row)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-3">
                <AlertMiniChart title="Theo mức độ" rows={[
                  ['Sắp hết', alerts.filter((row: any) => row.level === 'Sắp hết').length],
                  ['Hết hàng', alerts.filter((row: any) => row.level === 'Hết hàng').length],
                ]} />
                <AlertMiniChart title="Top tồn thấp" rows={alerts.slice(0, 6).map((row: any) => [row.materialCode, row.stock])} />
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
  const max = Math.max(1, ...rows.map((row) => row.value))
  const points = rows.map((row, index) => {
    const x = rows.length <= 1 ? 0 : (index / (rows.length - 1)) * 100
    const y = 100 - (row.value / max) * 78 - 10
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="h-[154px]">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-[118px] w-full overflow-visible">
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

function AlertMiniChart({ title, rows }: { title: string; rows: Array<[string, number]> }) {
  const max = Math.max(1, ...rows.map(([, value]) => value))
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
      <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-white">{title}</h4>
      <div className="mt-3 space-y-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-slate-300">{label}</span>
              <span className="text-cyan-300">{formatQuantity(value, 0)}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-900">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-red-400" style={{ width: `${Math.max(5, (value / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
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
    <div className="grid grid-cols-1 items-center gap-2 px-4 py-2 text-xs text-slate-400 md:grid-cols-3">
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
