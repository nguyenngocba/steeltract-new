import { useMemo, useState, type ReactNode } from 'react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { InventoryMaterialDetailModal } from '../../components/InventoryMaterialDetailModal'
import { MaterialDrawer } from '../../components/material-table/MaterialDrawer'
import { InventoryTabWorkspace } from '../../components/InventoryTabWorkspace'
import {
  InventoryPagination,
  InventoryPanel,
  inventoryGridGap,
  inventoryPageStack,
  inventoryTableHead,
  inventoryTableRow,
  inventoryTableShell,
} from '../../components/InventoryVisuals'
import { useDeleteMaterial } from '../../hooks/useDeleteMaterial'
import { useCategories } from '../../hooks/useCategories'
import { useInventoryAudit } from '../../hooks/useInventoryAudit'
import { useInventoryTransactions } from '../../hooks/useInventoryTransactions'
import { useMaterialDetail } from '../../hooks/useMaterialDetail'
import { useZones } from '../../hooks/useZones'

const PAGE_SIZE = 10
const CHART_PAGE_SIZE = 6
const compactInput =
  'h-9 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-950/65'

function num(value: any) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function money(value: number) {
  return value.toLocaleString('vi-VN') + ' đ'
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
  const currentStock = Number(item.currentStock ?? 0)
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

function displayLocation(item: any) {
  const locations = rowLocations(item)
  if (!locations.length) return '-'
  const primary = locationLabel(locations[0]) || '-'
  return locations.length > 1 ? `${primary} ... +${locations.length - 1}` : primary
}

function LabeledFilter({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-slate-400">{label}</span>
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

function CompactKpi({ title, value, note, tone = 'cyan' }: { title: string; value: string; note?: string; tone?: string }) {
  const toneClass: Record<string, string> = {
    blue: 'from-blue-500 to-cyan-400',
    emerald: 'from-emerald-500 to-teal-400',
    cyan: 'from-cyan-500 to-sky-400',
    amber: 'from-amber-500 to-orange-400',
    red: 'from-red-500 to-rose-400',
  }
  return (
    <section className="rounded-xl border border-white/10 bg-slate-950/45 p-2.5 shadow-[0_14px_44px_rgba(0,0,0,0.18)]">
      <div className={`mb-1 h-0.5 w-10 rounded-full bg-gradient-to-r ${toneClass[tone] ?? toneClass.cyan}`} />
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{title}</div>
      <div className="mt-0.5 truncate text-base font-semibold text-white">{value}</div>
      {note ? <div className="mt-0.5 truncate text-[11px] text-slate-500">{note}</div> : null}
    </section>
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
              <span className="text-slate-300">{item.value.toLocaleString('vi-VN')} ({percent.toFixed(1)}%)</span>
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
    const totalQty = filteredRows.reduce((acc: number, row: any) => acc + Number(row.currentStock ?? 0), 0)
    const low = filteredRows.filter((row: any) => Number(row.currentStock ?? 0) > 0 && Number(row.currentStock ?? 0) <= 5).length
    const out = filteredRows.filter((row: any) => Number(row.currentStock ?? 0) <= 0).length
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
        map.set('KHU MẶC ĐỊNH', (map.get('KHU MẶC ĐỊNH') ?? 0) + num(row.currentStock))
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
        const stock = num(row.currentStock)
        const min = num(row.minimumStock || 5)
        const level = stock <= 0 ? 'Hết hàng' : stock <= min || stock <= 5 ? 'Sắp hết' : ''
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

  const quickStats = useMemo(() => {
    const txRows = transactionRows(transactions)
    const today = new Date().toISOString().slice(0, 10)
    const month = new Date().toISOString().slice(0, 7)
    const byTypeToday = (type: string) => txRows.filter((tx: any) => String(tx.type ?? '').toUpperCase() === type && transactionDateKey(tx, 10) === today)
    const byTypeMonth = (type: string) => txRows.filter((tx: any) => String(tx.type ?? '').toUpperCase() === type && transactionDateKey(tx, 7) === month)
    const sumQty = (list: any[]) => list.reduce((sum, tx) => sum + transactionQuantity(tx), 0)
    return [
      { title: 'Nhập kho hôm nay', value: `${sumQty(byTypeToday('INBOUND')).toLocaleString('vi-VN')} tấn`, note: `${byTypeToday('INBOUND').length} phiếu`, tone: 'text-cyan-300' },
      { title: 'Xuất kho hôm nay', value: `${sumQty(byTypeToday('OUTBOUND')).toLocaleString('vi-VN')} tấn`, note: `${byTypeToday('OUTBOUND').length} phiếu`, tone: 'text-red-300' },
      { title: 'Điều chuyển hôm nay', value: `${sumQty(byTypeToday('TRANSFER')).toLocaleString('vi-VN')} tấn`, note: `${byTypeToday('TRANSFER').length} phiếu`, tone: 'text-blue-300' },
      { title: 'Kiểm kê tháng này', value: `${sumQty(byTypeMonth('ADJUSTMENT')).toLocaleString('vi-VN')} tấn`, note: 'Hoàn thành', tone: 'text-emerald-300' },
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

      <div className={inventoryPageStack}>
        <div className={`grid grid-cols-1 md:grid-cols-5 ${inventoryGridGap}`}>
          <CompactKpi title="Tổng giá trị tồn kho" value={money(kpis.totalValue)} note="Theo giá bình quân" tone="blue" />
          <CompactKpi title="Tổng khối lượng" value={kpis.totalQty.toLocaleString('vi-VN')} note="Tồn hiện hành" tone="emerald" />
          <CompactKpi title="Mã vật tư" value={kpis.totalCodes.toLocaleString('vi-VN')} note="Đang theo dõi" tone="cyan" />
          <CompactKpi title="Vật tư sắp hết" value={kpis.low.toLocaleString('vi-VN')} note="Cần bổ sung" tone="amber" />
          <CompactKpi title="Vật tư hết hàng" value={kpis.out.toLocaleString('vi-VN')} note="Rủi ro cao" tone="red" />
        </div>

        <InventoryPanel className="rounded-xl">
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-[180px_180px_180px_180px_minmax(260px,1fr)_130px_120px]">
            <LabeledFilter label="Nhóm vật tư">
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value)
                  setPage(1)
                }}
                className={compactInput}
              >
                <option value="">Tất cả</option>
                {categories.map((category: any) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </LabeledFilter>
            <LabeledFilter label="Loại vật tư">
              <select
                value={usageFilter}
                onChange={(e) => {
                  setUsageFilter(e.target.value)
                  setPage(1)
                }}
                className={compactInput}
              >
                <option value="">Tất cả</option>
                <option value="PRIMARY">Vật tư chính</option>
                <option value="SECONDARY">Vật tư phụ</option>
                <option value="CONSUMABLE">Vật tư tiêu hao</option>
              </select>
            </LabeledFilter>
            <LabeledFilter label="Kho">
              <select
                value={zoneFilter}
                onChange={(e) => {
                  setZoneFilter(e.target.value)
                  setPage(1)
                }}
                className={compactInput}
              >
                <option value="">Tất cả</option>
                {warehouseOptions.map((warehouse) => (
                  <option key={warehouse.value} value={warehouse.value}>
                    {warehouse.label}
                  </option>
                ))}
              </select>
            </LabeledFilter>
            <LabeledFilter label="Trạng thái">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className={compactInput}
              >
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

        <div className={`grid grid-cols-1 xl:grid-cols-12 ${inventoryGridGap}`}>
          <InventoryPanel className="xl:col-span-8">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-white">Danh sách tồn kho</h3>
            <button onClick={() => setShowAll(true)} className="text-xs font-medium text-cyan-300 hover:text-cyan-200">Xem tất cả</button>
          </div>
          {deleteError && <div className="mb-3 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{deleteError}</div>}
          <div className={`${inventoryTableShell} min-h-[354px]`}>
            <table className="w-full text-xs">
              <thead className={inventoryTableHead}>
                <tr>
                  <th className="w-8 px-2 py-2 text-left font-medium"><input type="checkbox" className="h-3.5 w-3.5 rounded border-white/10 bg-slate-950" /></th>
                  <th className="px-2 py-2 text-left font-medium">Mã vật tư</th>
                  <th className="px-2 py-2 text-left font-medium">Tên vật tư</th>
                  <th className="px-2 py-2 text-left font-medium">Quy cách</th>
                  <th className="px-2 py-2 text-left font-medium">Loại</th>
                  <th className="px-2 py-2 text-right font-medium">Tồn</th>
                  <th className="px-2 py-2 text-right font-medium">Giá trị</th>
                  <th className="px-2 py-2 text-left font-medium">Vị trí</th>
                  <th className="px-2 py-2 text-left font-medium">Trạng thái</th>
                  <th className="px-2 py-2 text-left font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((item: any) => (
                  <tr key={item.id} onClick={() => openMaterial(item)} className={`cursor-pointer ${inventoryTableRow}`}>
                    <td className="px-2 py-1.5"><input type="checkbox" onClick={(event) => event.stopPropagation()} className="h-3.5 w-3.5 rounded border-white/10 bg-slate-950" /></td>
                    <td className="px-2 py-1.5 font-medium text-cyan-300">{item.materialCode}</td>
                    <td className="px-2 py-1.5 text-white">{item.materialName}</td>
                    <td className="px-2 py-1.5 text-slate-300">{item.materialType ?? '-'}</td>
                    <td className="px-2 py-1.5">
                      <span className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-xs text-cyan-200">
                        {materialUsageLabel(item.materialUsageType)}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-right">{Number(item.currentStock ?? 0).toLocaleString('vi-VN')}</td>
                    <td className="px-2 py-1.5 text-right font-medium text-cyan-300">{money(Number(item.inventoryValue ?? 0))}</td>
                    <td className="px-2 py-1.5">
                      <span title={rowLocations(item).map(locationLabel).join('\n')} className="inline-flex max-w-44 items-center rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-xs text-cyan-100">
                        {displayLocation(item)}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <span className={`inline-flex rounded-lg border px-2 py-1 text-xs ${stockStatusClass(stockStatus(item))}`}>
                        {stockStatusLabel(stockStatus(item))}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex gap-2">
                        <button onClick={(event) => { event.stopPropagation(); editMaterial(item) }} className="rounded border border-amber-400/40 bg-amber-500/10 px-2 py-1 text-xs text-amber-300">Sửa</button>
                        <button onClick={(event) => { event.stopPropagation(); handleDelete(item.materialId ?? item.inventoryItemId ?? item.id) }} className="rounded border border-red-400/40 bg-red-500/10 px-2 py-1 text-xs text-red-300">Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <InventoryPagination page={activePage} pageCount={totalPages} total={filteredRows.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </InventoryPanel>

          <div className="space-y-3 xl:col-span-4">
          <ChartCard title="Phân bố tồn kho theo kho" note="Đơn vị: tấn" page={pagedZoneDistribution.page} pageCount={pagedZoneDistribution.pageCount} onPrev={() => setZoneChartPage((p) => Math.max(1, p - 1))} onNext={() => setZoneChartPage((p) => Math.min(pagedZoneDistribution.pageCount, p + 1))}>
            <CompactDonut
              segments={pagedZoneSegments}
              centerValue={kpis.totalQty.toLocaleString('vi-VN')}
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
                    <span className="text-slate-400">Tồn còn: {row.stock.toLocaleString('vi-VN')}</span>
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
          <div className="max-h-[90vh] w-full max-w-6xl overflow-auto rounded-xl border border-white/10 bg-[#0b1424]/95 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Toàn bộ danh sách tồn kho</h3>
              <button onClick={() => setShowAll(false)} className="rounded border border-white/10 bg-white/5 px-3 py-1 text-slate-300 hover:text-white">Đóng</button>
            </div>
            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full">
                <thead className="bg-white/[0.06]">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs text-slate-400">Mã</th>
                    <th className="px-3 py-2 text-left text-xs text-slate-400">Tên</th>
                    <th className="px-3 py-2 text-left text-xs text-slate-400">Loại vật tư</th>
                    <th className="px-3 py-2 text-left text-xs text-slate-400">Tồn</th>
                    <th className="px-3 py-2 text-left text-xs text-slate-400">Giá trị</th>
                    <th className="px-3 py-2 text-left text-xs text-slate-400">Vị trí</th>
                    <th className="px-3 py-2 text-left text-xs text-slate-400">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((item: any) => (
                    <tr key={item.id} onClick={() => openMaterial(item)} className="cursor-pointer border-t border-white/10 hover:bg-white/[0.06]">
                      <td className="px-3 py-2 text-cyan-300">{item.materialCode}</td>
                      <td className="px-3 py-2 text-white">{item.materialName}</td>
                      <td className="px-3 py-2 text-slate-300">{materialUsageLabel(item.materialUsageType)}</td>
                      <td className="px-3 py-2 text-slate-200">{Number(item.currentStock ?? 0).toLocaleString('vi-VN')}</td>
                      <td className="px-3 py-2 text-cyan-300">{money(Number(item.inventoryValue ?? 0))}</td>
                      <td className="px-3 py-2 text-slate-300">{displayLocation(item)}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-lg border px-2 py-1 text-xs ${stockStatusClass(stockStatus(item))}`}>
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
                <p className="mt-1 text-xs text-slate-500">{alerts.length.toLocaleString('vi-VN')} cảnh báo theo bộ lọc hiện tại</p>
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
                      <th className="px-3 py-2 text-right">Tồn còn</th>
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
                        <td className="px-3 py-2 text-right">{row.stock.toLocaleString('vi-VN')}</td>
                        <td className="px-3 py-2 text-right">{num(row.minimumStock || 5).toLocaleString('vi-VN')}</td>
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
              <span className="text-cyan-300">{value.toLocaleString('vi-VN')}</span>
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
