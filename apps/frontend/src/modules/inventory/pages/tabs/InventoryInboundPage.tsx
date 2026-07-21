import { useEffect, useMemo, useState } from 'react'
import { CircleDollarSign, PackageCheck, RefreshCw, ShieldX, TriangleAlert } from 'lucide-react'
import toast from 'react-hot-toast'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import {
  ModuleDetailDrawer,
  ModuleFilterBar,
  ModuleLoadingState,
  ModuleEmptyState,
} from '../../../../shared/ui/modules'
import {
  CockpitKpiCard,
} from '../../../../shared/ui/cockpit'
import {
  CompactDonutSummary,
  HorizontalBars,
  InventoryChartCard,
  InventoryPanel,
  inventoryInput,
  inventoryTableHead,
  inventoryTableRow,
  inventoryTableShell,
  inventoryMutedButton,
  InventoryPagination,
} from '../../components/InventoryVisuals'
import { useInventoryTransactions } from '../../hooks/useInventoryTransactions'
import { useSuppliers } from '../../hooks/useSuppliers'
import { useZones } from '../../hooks/useZones'
import { formatCurrencyVnd, formatQuantity } from '@/shared/utils/number-format'
import {
  InventoryTransactionAttachmentButton,
  InventoryTransactionAttachmentDrawer,
  useInventoryTransactionAttachmentMap,
} from '../../components/InventoryAttachmentPanel'

const compactInput =
  'h-9 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-xs text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-950/65'
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
function num(v: any) {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}

function formatCurrency(v: any) {
  return formatCurrencyVnd(num(v))
}

function formatDate(value: any) {
  const date = new Date(value ?? '')
  if (Number.isNaN(date.getTime())) return '-'
  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    date.getFullYear(),
  ].join('/')
}

function transactionItems(tx: any) {
  return Array.isArray(tx?.items) ? tx.items : []
}

function lineQuantity(line: any) {
  return Math.abs(num(line?.quantity))
}

function lineAmount(line: any) {
  const totalAmount = Math.abs(num(line?.totalAmount))
  if (totalAmount) return totalAmount
  return lineQuantity(line) * Math.abs(num(line?.unitPrice))
}

function transactionQuantity(tx: any) {
  return transactionItems(tx).reduce((sum: number, line: any) => sum + lineQuantity(line), 0)
}

function transactionAmount(tx: any) {
  return transactionItems(tx).reduce((sum: number, line: any) => sum + lineAmount(line), 0)
}

function lineUnit(line: any) {
  return line?.unit?.symbol ?? line?.unit?.code ?? line?.inventoryItem?.unit ?? '-'
}

function transactionUnits(tx: any) {
  return Array.from(
    new Set(transactionItems(tx).map((line: any) => lineUnit(line)).filter((unit) => unit !== '-')),
  ).join(', ') || '-'
}

function transactionUnitPrice(tx: any) {
  const prices = Array.from(
    new Set(
      transactionItems(tx)
        .map((line: any) => line?.unitPrice)
        .filter((value: unknown) => value != null)
        .map((value: unknown) => num(value)),
    ),
  )
  return prices.length === 1 ? prices.at(0) : null
}

function lineWarehouse(line: any) {
  return line?.warehouse?.name ?? line?.warehouse?.code ?? line?.zone?.warehouse?.name ?? line?.zone?.warehouse?.code ?? '-'
}

function lineZone(line: any) {
  return line?.zone?.code ?? line?.zone?.name ?? '-'
}

function transactionZones(tx: any) {
  return Array.from(new Set(transactionItems(tx).map((line: any) => lineZone(line)).filter((zone) => zone && zone !== '-')))
}

function supplierName(tx: any) {
  return tx?.supplierName ?? tx?.supplier?.name ?? '-'
}

function transactionActor(tx: any) {
  return tx?.createdBy ?? tx?.performedBy ?? tx?.approvedBy ?? 'Admin'
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 truncate text-sm font-medium text-slate-100">{value}</div>
    </div>
  )
}

function InboundDetailDrawer({
  transaction,
  onClose,
}: {
  transaction: any | null
  onClose: () => void
}) {
  const items = transactionItems(transaction)

  return (
    <ModuleDetailDrawer
      open={Boolean(transaction)}
      title={transaction?.transactionNo ?? 'Chi tiết phiếu nhập'}
      subtitle="Chi tiết nhập kho vật tư"
      onClose={onClose}
      widthClass="max-w-6xl"
    >
      {transaction ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-cyan-300/15 bg-cyan-400/[0.055] p-3">
              <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Tổng khối lượng</div>
              <div className="mt-2 text-2xl font-semibold text-white">{formatQuantity(transactionQuantity(transaction), 3)}</div>
            </div>
            <div className="rounded-xl border border-emerald-300/15 bg-emerald-400/[0.055] p-3">
              <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Tổng giá trị</div>
              <div className="mt-2 text-2xl font-semibold text-white">{formatCurrency(transactionAmount(transaction))}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Dòng vật tư</div>
              <div className="mt-2 text-2xl font-semibold text-white">{formatQuantity(items.length, 0)}</div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="grid gap-2 text-sm md:grid-cols-2 lg:grid-cols-3">
              <InfoLine label="Mã phiếu" value={transaction.transactionNo ?? '-'} />
              <InfoLine label="Ngày nhập" value={formatDate(transaction.transactionDate ?? transaction.createdAt)} />
              <InfoLine label="Nhà cung cấp" value={supplierName(transaction)} />
              <InfoLine label="Người tạo" value={transactionActor(transaction)} />
              <InfoLine label="Kho nhập" value={transactionZones(transaction).join(', ') || '-'} />
              <InfoLine label="Ghi chú" value={transaction.remarks ?? transaction.note ?? '-'} />
            </div>
          </div>

          <div className="overflow-auto rounded-xl border border-white/10 bg-slate-950/35">
            <table className="w-full min-w-[1180px] text-sm">
              <thead className="bg-white/[0.06] text-xs uppercase text-slate-400">
                <tr>
                  {['Mã vật tư', 'Tên vật tư', 'Số lượng', 'ĐVT', 'Đơn giá', 'Thành tiền', 'Kho', 'Zone', 'Slot', 'Level'].map((header) => (
                    <th key={header} className="px-3 py-2 text-left font-medium">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.length ? items.map((line: any) => (
                  <tr key={line.id ?? `${line.inventoryItemId}-${line.quantity}-${lineZone(line)}`} className="border-t border-white/10 text-slate-300">
                    <td className="px-3 py-2 font-medium text-cyan-300">{line?.inventoryItem?.code ?? '-'}</td>
                    <td className="px-3 py-2 text-slate-100">{line?.inventoryItem?.name ?? '-'}</td>
                    <td className="px-3 py-2">{formatQuantity(lineQuantity(line), 3)}</td>
                    <td className="px-3 py-2">{lineUnit(line)}</td>
                    <td className="px-3 py-2">{formatCurrency(line.unitPrice)}</td>
                    <td className="px-3 py-2 font-semibold text-emerald-300">{formatCurrency(lineAmount(line))}</td>
                    <td className="px-3 py-2">{lineWarehouse(line)}</td>
                    <td className="px-3 py-2">{lineZone(line)}</td>
                    <td className="px-3 py-2">{line?.slotId ?? '-'}</td>
                    <td className="px-3 py-2">{line?.level ?? '-'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={10} className="px-3 py-8 text-center text-sm text-slate-500">
                      Phiếu nhập chưa có dòng vật tư.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </ModuleDetailDrawer>
  )
}

function PriceChangeList({
  rows,
}: {
  rows: Array<{
    materialCode: string
    materialName: string
    previousPrice: number
    currentPrice: number
    changePercent: number
  }>
}) {
  if (!rows.length) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 bg-slate-950/35 px-3 py-6 text-center text-xs text-slate-500">
        Chưa đủ dữ liệu giá nhập để so sánh.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={`${row.materialCode}-${row.currentPrice}-${row.previousPrice}`} className="rounded-lg border border-white/10 bg-slate-950/35 px-3 py-2 text-xs">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate font-semibold text-cyan-100">{row.materialCode}</div>
              <div className="truncate text-slate-500">{row.materialName}</div>
            </div>
            <span className={row.changePercent >= 0 ? 'text-emerald-300' : 'text-red-300'}>
              {row.changePercent >= 0 ? '+' : ''}{row.changePercent.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-slate-400">
            <span>Trước: {formatCurrency(row.previousPrice)}</span>
            <span className="text-right">Mới: {formatCurrency(row.currentPrice)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function InventoryInboundPage() {
  const { data: suppliers = [] } = useSuppliers()
  const { data: zones = [] } = useZones()
  const { data: tx = [], isLoading, refetch } = useInventoryTransactions({ type: 'INBOUND' })
  const [showAll, setShowAll] = useState(false)
  const [date, setDate] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [attachmentDrawer, setAttachmentDrawer] = useState<{ transaction: any; attachments: any[] } | null>(null)
  const [selectedInbound, setSelectedInbound] = useState<any | null>(null)
  const pageSize = 11
  const modalPageSizeOptions = [10, 20, 50, 100]
  const attachmentMap = useInventoryTransactionAttachmentMap()
  const [searchDraft, setSearchDraft] = useState('')
  const [modalPage, setModalPage] = useState(1)
  const [modalPageSize, setModalPageSize] = useState(20)
  function applySearch() {
    setSearch(searchDraft)
    setPage(1)
  }
  function resetFilters() {
    setSearchDraft('')
    setSearch('')
    setSupplierId('')
    setZoneId('')
    setDate('')
    setPage(1)
  }

  const rows = useMemo(() => {
    return (tx as any[])
      .filter((x: any) => {
        if (date) {
          const d = new Date(x.transactionDate ?? x.createdAt).toISOString().slice(0, 10)
          if (d !== date) return false
        }
        if (supplierId && String(x.supplierId ?? '') !== supplierId) return false
        if (zoneId && !transactionItems(x).some((line: any) => String(line?.zoneId ?? '') === zoneId)) return false
        if (search.trim()) {
          const q = search.trim().toLowerCase()
          const lineText = transactionItems(x)
            .flatMap((line: any) => [
              line?.inventoryItem?.code,
              line?.inventoryItem?.name,
              lineZone(line),
            ])
            .join(' ')
          const text = [
            x.transactionNo,
            supplierName(x),
            lineText,
          ]
            .join(' ')
            .toLowerCase()
          if (!text.includes(q)) return false
        }
        return true
      })
      .sort((a: any, b: any) => +new Date(b.transactionDate ?? b.createdAt) - +new Date(a.transactionDate ?? a.createdAt))
  }, [tx, date, supplierId, zoneId, search])

  const kpis = useMemo(() => {
    const now = new Date()
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const todayKey = now.toISOString().slice(0, 10)
    const inMonth = rows.filter((x: any) => String(x.transactionDate ?? x.createdAt).slice(0, 7) === monthKey)
    const todayRows = rows.filter((x: any) => String(x.transactionDate ?? x.createdAt).slice(0, 10) === todayKey)
    const qty = inMonth.reduce((s: number, x: any) => s + transactionQuantity(x), 0)
    const amount = inMonth.reduce((s: number, x: any) => s + transactionAmount(x), 0)
    const todayAmount = todayRows.reduce((s: number, x: any) => s + transactionAmount(x), 0)
    const supplierIds = new Set(inMonth.map((x: any) => String(x.supplierId ?? supplierName(x))).filter(Boolean))
    const statusDone = rows.filter((x: any) => String(x.status ?? 'COMPLETED').toUpperCase() === 'COMPLETED').length
    return {
      monthlyQty: qty,
      monthlyAmount: amount,
      todayAmount,
      docs: inMonth.length,
      monthlySuppliers: supplierIds.size,
      done: statusDone,
    }
  }, [rows])

  // ===== TREND DỮ LIỆU THỰC TẾ =====
  const kpiTrend = useMemo(() => {
    const now = new Date()
    const months = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      return key
    })

    const monthData = months.map((key) => {
      const inMonth = rows.filter((x: any) => String(x.transactionDate ?? x.createdAt).slice(0, 7) === key)
      const todayRows = inMonth.filter((x: any) => String(x.transactionDate ?? x.createdAt).slice(0, 10) === now.toISOString().slice(0, 10))
      const qty = inMonth.reduce((s: number, x: any) => s + transactionQuantity(x), 0)
      const amount = inMonth.reduce((s: number, x: any) => s + transactionAmount(x), 0)
      const todayAmount = todayRows.reduce((s: number, x: any) => s + transactionAmount(x), 0)
      const supplierIds = new Set(inMonth.map((x: any) => String(x.supplierId ?? supplierName(x))).filter(Boolean))
      const statusDone = inMonth.filter((x: any) => String(x.status ?? 'COMPLETED').toUpperCase() === 'COMPLETED').length

      return {
        monthlyQty: qty,
        monthlyAmount: amount,
        todayAmount,
        docs: inMonth.length,
        monthlySuppliers: supplierIds.size,
        done: statusDone,
      }
    })

    return {
      monthlyQty: monthData.map((d) => d.monthlyQty),
      monthlyAmount: monthData.map((d) => d.monthlyAmount),
      todayAmount: monthData.map((d) => d.todayAmount),
      docs: monthData.map((d) => d.docs),
      monthlySuppliers: monthData.map((d) => d.monthlySuppliers),
      done: monthData.map((d) => d.done),
    }
  }, [rows])

  const byZone = useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach((x: any) => {
      transactionItems(x).forEach((line: any) => {
        const key = lineZone(line)
        m.set(key, (m.get(key) ?? 0) + lineQuantity(line))
      })
    })
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [rows])

  const topMaterials = useMemo(() => {
    const m = new Map<string, { code: string; value: number }>()
    rows.forEach((x: any) => {
      transactionItems(x).forEach((line: any) => {
        const code = line?.inventoryItem?.code ?? 'NA'
        const prev = m.get(code) ?? { code, value: 0 }
        prev.value += lineAmount(line)
        m.set(code, prev)
      })
    })
    return Array.from(m.values()).sort((a, b) => b.value - a.value).slice(0, 5)
  }, [rows])

  const supplierStats = useMemo(() => {
    const m = new Map<string, { name: string; quantity: number; value: number }>()
    rows.forEach((x: any) => {
      const name = supplierName(x)
      const current = m.get(name) ?? { name, quantity: 0, value: 0 }
      current.quantity += transactionQuantity(x)
      current.value += transactionAmount(x)
      m.set(name, current)
    })
    return Array.from(m.values())
  }, [rows])

  const topSuppliers = useMemo(() => {
    return [...supplierStats].sort((a, b) => b.value - a.value).slice(0, 5)
  }, [supplierStats])

  const topSuppliersByQuantity = useMemo(() => {
    return [...supplierStats].sort((a, b) => b.quantity - a.quantity).slice(0, 5)
  }, [supplierStats])

  const priceChanges = useMemo(() => {
    const byMaterial = new Map<string, Array<{
      code: string
      name: string
      price: number
      date: number
    }>>()

    rows.forEach((x: any) => {
      const dateValue = +new Date(x.transactionDate ?? x.createdAt ?? 0)
      transactionItems(x).forEach((line: any) => {
        const price = Math.abs(num(line?.unitPrice))
        if (price <= 0) return
        const key = String(line?.inventoryItemId ?? line?.inventoryItem?.id ?? line?.inventoryItem?.code ?? '')
        if (!key) return
        const list = byMaterial.get(key) ?? []
        list.push({
          code: line?.inventoryItem?.code ?? 'NA',
          name: line?.inventoryItem?.name ?? '-',
          price,
          date: dateValue,
        })
        byMaterial.set(key, list)
      })
    })

    const changes = Array.from(byMaterial.values()).flatMap((list) => {
      const sorted = list.sort((a, b) => b.date - a.date)
      const current = sorted[0]
      const previous = sorted.find((item) => item.date < current.date) ?? sorted[1]
      if (!current || !previous || previous.price <= 0) return []
      const changePercent = ((current.price - previous.price) / previous.price) * 100
      if (!Number.isFinite(changePercent) || changePercent === 0) return []
      return [{
        materialCode: current.code,
        materialName: current.name,
        previousPrice: previous.price,
        currentPrice: current.price,
        changePercent,
      }]
    })

    return {
      increases: changes.filter((item) => item.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent).slice(0, 5),
      decreases: changes.filter((item) => item.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 5),
    }
  }, [rows])

  const zoneSegments = useMemo(() => byZone.map(([label, value], index) => ({
    label,
    value,
    color: ['#1d7cff', '#14c987', '#f59e0b', '#7c3aed', '#ef4444', '#06b6d4'][index % 6],
  })), [byZone])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page])

  const modalPageCount = Math.max(1, Math.ceil(rows.length / modalPageSize))
  const safeModalPage = Math.min(Math.max(1, modalPage), modalPageCount)
  const modalPagedRows = useMemo(() => {
    const start = (safeModalPage - 1) * modalPageSize
    return rows.slice(start, start + modalPageSize)
  }, [rows, safeModalPage, modalPageSize])

  const filterInput =
  'h-9 w-full rounded-md border border-white/10 bg-slate-950/45 px-2 text-xs text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-950/65'


  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))

  useEffect(() => {
    if (showAll) setModalPage(1)
  }, [showAll])

  return (
    <EnterpriseModulePage>
      <div className="space-y-2 text-xs -mt-2">
        {/* KPI Section */}
        <div className="grid grid-cols-1 gap-1 md:grid-cols-6">
          <CockpitKpiCard
            className="!h-[92px] !p-3"
            title="Tổng nhập trong tháng"
            value={formatQuantity(kpis.monthlyQty, 3) + ' tấn'}
            note="Khối lượng theo phiếu nhập"
            tone="blue"
            trend={kpiTrend.monthlyQty}
          />
          <CockpitKpiCard
            className="!h-[92px] !p-3"
            title="Giá trị nhập trong tháng"
            value={formatCurrency(kpis.monthlyAmount)}
            note="Giá trị theo đơn giá nhập"
            tone="emerald"
            trend={kpiTrend.monthlyAmount}
          />
          <CockpitKpiCard
            className="!h-[92px] !p-3"
            title="Giá trị nhập hôm nay"
            value={formatCurrency(kpis.todayAmount)}
            note="Theo ngày hiện tại"
            tone="purple"
            trend={kpiTrend.todayAmount}
          />
          <CockpitKpiCard
            className="!h-[92px] !p-3"
            title="Số phiếu nhập tháng"
            value={formatQuantity(kpis.docs, 0)}
            note="Phiếu phát sinh trong tháng"
            tone="cyan"
            trend={kpiTrend.docs}
          />
          <CockpitKpiCard
            className="!h-[92px] !p-3"
            title="NCC phát sinh tháng"
            value={formatQuantity(kpis.monthlySuppliers, 0)}
            note="Nhà cung cấp có giao dịch"
            tone="amber"
            trend={kpiTrend.monthlySuppliers}
          />
          <CockpitKpiCard
            className="!h-[92px] !p-3"
            title="Hoàn thành"
            value={formatQuantity(kpis.done, 0)}
            note="Phiếu nhập đã hoàn thành"
            tone="emerald"
            trend={kpiTrend.done}
          />
        </div>

        {/* Enterprise Toolbar & Quick Actions */}
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between -mt-1">
          <div className="flex-1 min-w-0">
            <ModuleFilterBar sticky={false} className="p-2.5">
              <div className="col-span-12 xl:col-span-3">
                <input
                  value={searchDraft}
                  onChange={(e) => setSearchDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') applySearch()
                  }}
                  placeholder="Mã phiếu, vật tư, NCC..."
                  className={compactInput}
                />
              </div>
              <div className="col-span-12 md:col-span-4 xl:col-span-3">
                <select
                  value={supplierId}
                  onChange={(e) => {
                    setSupplierId(e.target.value)
                    setPage(1)
                  }}
                  className={compactInput}
                >
                  <option value="">Nhà cung cấp</option>
                  {suppliers.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-12 md:col-span-4 xl:col-span-2">
                <select
                  value={zoneId}
                  onChange={(e) => {
                    setZoneId(e.target.value)
                    setPage(1)
                  }}
                  className={compactInput}
                >
                  <option value="">Vị trí kho nhập</option>
                  {zones.map((z: any) => (
                    <option key={z.id} value={z.id}>
                      {z.code}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-12 md:col-span-4 xl:col-span-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value)
                    setPage(1)
                  }}
                  className={compactInput}
                />
              </div>
              <div className="col-span-12 xl:col-span-2 flex gap-1">
                <button
                  onClick={applySearch}
                  className="flex-1 h-9 rounded-lg bg-blue-600 text-xs font-semibold text-white transition hover:bg-blue-500"
                >
                  Lọc
                </button>
                <button
                  onClick={resetFilters}
                  className="flex-1 h-9 rounded-lg border border-white/10 bg-white/[0.055] text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  Xóa
                </button>
              </div>
            </ModuleFilterBar>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 justify-end">
            <button
              onClick={() => {
                void refetch()
                toast.success('Đã tải lại danh sách phiếu nhập')
              }}
              className="h-9 rounded-lg border border-white/10 bg-slate-900 px-3 font-semibold text-slate-300 transition hover:bg-white/5"
            >
              🔄 Tải lại
            </button>
            <button
              onClick={() => toast.success('Đang kết xuất báo cáo Excel...')}
              className="h-9 rounded-lg border border-white/10 bg-slate-900 px-3 font-semibold text-slate-300 transition hover:bg-white/5"
            >
              📥 Xuất Excel
            </button>
          </div>
        </div>

        {/* Loading state / Content table */}
        {isLoading ? (
          <ModuleLoadingState label="Đang tải danh sách phiếu nhập kho..." variant="table" />
        ) : rows.length === 0 ? (
          <ModuleEmptyState
            title="Không tìm thấy phiếu nhập"
            description="Không có giao dịch nhập kho nào khớp với điều kiện lọc hiện tại."
            action={
              <button
                onClick={resetFilters}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
              >
                Xóa bộ lọc
              </button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-1 -mt-1">
              <InventoryPanel
                title={
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-white">
                      Danh sách phiếu nhập
                    </h3>
                    <button
                      onClick={() => setShowAll(true)}
                      className="text-xs font-medium text-cyan-300 hover:text-cyan-200"
                    >
                      Xem tất cả
                    </button>
                  </div>
                }
                className="xl:col-span-9"
              >
                <div className="rounded-lg border border-white/10 overflow-hidden">
                  <div className="rounded-lg border border-white/10 overflow-hidden h-[430px]">
                  <table className="w-full min-w-[1200px] text-xs table-fixed border-collapse">
                    <colgroup>
                      <col className="w-[100px]" /> {/* Mã phiếu nhập */}
                      <col className="w-[120px]" /> {/* Ngày nhập */}
                      <col className="w-[110px]" /> {/* Nhà cung cấp */}
                      <col className="w-[110px]" /> {/* Vị trí */}
                      <col className="w-[100px]" /> {/* Số lượng */}
                      <col className="w-[70px]" />  {/* ĐVT */}
                      <col className="w-[100px]" /> {/* Đơn giá */}
                      <col className="w-[120px]" /> {/* Tổng giá trị */}
                      <col className="w-[80px]" />  {/* Hồ sơ */}
                      <col className="w-[120px]" /> {/* Trạng thái */}
                      <col className="w-[100px]" /> {/* Người tạo */}
                    </colgroup>
                    <thead
                      className={`${inventoryTableHead}
                        text-slate-300
                        border-b border-cyan-400/10`}
                      style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                    >
                      <tr>
                        {['Ngày nhập', 'Mã phiếu nhập', 'Nhà cung cấp', 'Vị trí', 'Số lượng', 'ĐVT', 'Đơn giá', 'Tổng giá trị', 'Hồ sơ', 'SL mã vật tư', 'Người tạo'].map((h) => (
                          <th key={h} className="px-4 py-2 text-left font-medium">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((x: any) => {
                        const unitPrice = transactionUnitPrice(x)
                        return (
                          <tr
                            key={x.id}
                            className="border-t border-cyan-300/10 text-slate-200 transition hover:bg-cyan-500/5 hover:text-cyan-300 cursor-pointer"
                            onClick={() => setSelectedInbound(x)}
                          >
                            <td className="px-2.5 py-1">{formatDate(x.transactionDate ?? x.createdAt)}</td>
                            <td className="px-2.5 py-1 text-cyan-300 font-medium">{x.transactionNo}</td>
                            <td className="px-2.5 py-1 truncate">{supplierName(x)}</td>
                            <td className="px-2.5 py-1 truncate">{transactionZones(x).join(', ') || '-'}</td>
                            <td className="px-2.5 py-1 font-medium">{formatQuantity(transactionQuantity(x), 3)}</td>
                            <td className="px-2.5 py-1">{transactionUnits(x)}</td>
                            <td className="px-2.5 py-1">{unitPrice == null ? '-' : formatCurrency(unitPrice)}</td>
                            <td className="px-2.5 py-1 font-bold text-emerald-400">{formatCurrency(transactionAmount(x))}</td>
                            <td className="px-2.5 py-1" onClick={(event) => event.stopPropagation()}>
                              <InventoryTransactionAttachmentButton
                                transaction={x}
                                attachmentMap={attachmentMap}
                                onOpen={(attachments) => setAttachmentDrawer({ transaction: x, attachments })}
                              />
                            </td>
                              <td className="px-2.5 py-1 text-center">
                                <span className="inline-flex min-w-[30px] items-center justify-center rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs font-semibold text-cyan-300">
                                  {transactionItems(x).length}
                                </span>
                              </td>
                            <td className="px-2.5 py-1 text-slate-400">{x.createdBy ?? 'Admin'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  </div>
                </div>
                <InventoryPagination
                  page={page}
                  pageCount={pageCount}
                  total={rows.length}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  containerClassName="grid grid-cols-1 items-center gap-2 px-4 py-1 text-xs text-slate-400 md:grid-cols-3 border-t-0"
                />
              </InventoryPanel>

              <div className="space-y-1.5 xl:col-span-3">
                <InventoryChartCard title="Phân bổ nhập theo vị trí" className="p-2">
                  <CompactDonutSummary segments={zoneSegments} centerValue={formatQuantity(kpis.monthlyQty, 0)} centerLabel="tổng nhập" />
                </InventoryChartCard>
                <InventoryChartCard title="Top vật tư nhập" className="p-2">
                  <HorizontalBars rows={topMaterials.map((m) => [m.code, m.value])} valueFormatter={(value) => formatCurrency(value)} />
                </InventoryChartCard>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">

              <InventoryChartCard title="Top NCC theo giá trị nhập" className="p-2">
                <div className="space-y-2">
                  {topSuppliers.map((supplier) => (
                    <div
                      key={supplier.name}
                      className="rounded-lg border border-white/10 bg-slate-950/35 px-3 py-2 text-xs"
                    >
                      <div className="truncate font-semibold text-cyan-100">
                        {supplier.name}
                      </div>

                      <div className="mt-1 grid grid-cols-2 gap-2 text-slate-400">
                        <span>{formatQuantity(supplier.quantity, 3)}</span>
                        <span className="text-right text-emerald-300">
                          {formatCurrency(supplier.value)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </InventoryChartCard>

              <InventoryChartCard title="Top NCC theo khối lượng" className="p-2">
                <div className="space-y-2">
                  {topSuppliersByQuantity.map((supplier) => (
                    <div
                      key={supplier.name}
                      className="rounded-lg border border-white/10 bg-slate-950/35 px-3 py-2 text-xs"
                    >
                      <div className="truncate font-semibold text-cyan-100">
                        {supplier.name}
                      </div>

                      <div className="mt-1 grid grid-cols-2 gap-2 text-slate-400">
                        <span>{formatQuantity(supplier.quantity, 3)}</span>
                        <span className="text-right text-emerald-300">
                          {formatCurrency(supplier.value)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </InventoryChartCard>

              <InventoryChartCard title="Top vật tư tăng giá" className="p-2">
                <PriceChangeList rows={priceChanges.increases} />
              </InventoryChartCard>

              <InventoryChartCard title="Top vật tư giảm giá" className="p-2">
                <PriceChangeList rows={priceChanges.decreases} />
              </InventoryChartCard>

            </div>
          </>
        )}
      </div>
      {showAll && (
        <div role="dialog" aria-modal="true" aria-label="Danh sách phiếu nhập" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
          <div className="max-h-[90vh] w-full max-w-[95vw] flex flex-col rounded-xl border border-white/10 bg-[#0b1424]/95 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Tổng danh sách phiếu nhập ({rows.length} phiếu)
              </h3>
              <button
                onClick={() => setShowAll(false)}
                className="rounded border border-white/10 bg-white/5 px-3 py-1 text-slate-300 hover:text-white"
              >
                Đóng
              </button>
            </div>

            <div className="flex-1 min-h-[400px] overflow-y-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[1200px] text-xs table-fixed border-collapse">
                <colgroup>
                  <col className="w-[100px]" /> {/* Mã phiếu nhập */}
                  <col className="w-[120px]" /> {/* Ngày nhập */}
                  <col className="w-[200px]" /> {/* Nhà cung cấp */}
                  <col className="w-[110px]" /> {/* Vị trí */}
                  <col className="w-[100px]" /> {/* Số lượng */}
                  <col className="w-[70px]" />  {/* ĐVT */}
                  <col className="w-[100px]" /> {/* Đơn giá */}
                  <col className="w-[120px]" /> {/* Tổng giá trị */}
                  <col className="w-[80px]" />  {/* Hồ sơ */}
                  <col className="w-[100px]" /> {/* SL MÃ VẬT TƯ */}
                  <col className="w-[100px]" /> {/* Người tạo */}
                </colgroup>
                <thead
                  className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10`}
                  style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                >
                  <tr>
                    {['Ngày nhập', 'Mã phiếu nhập', 'Nhà cung cấp', 'Vị trí', 'Số lượng', 'ĐVT', 'Đơn giá', 'Tổng giá trị', 'Hồ sơ', 'SL Mã vật tư', 'Người tạo'].map((h) => (
                      <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modalPagedRows.map((x: any) => {
                    const unitPrice = transactionUnitPrice(x)
                    return (
                      <tr
                        key={x.id}
                        className="border-t border-cyan-300/10 text-slate-200 transition hover:bg-cyan-500/5 hover:text-cyan-300 cursor-pointer"
                        onClick={() => {
                          setSelectedInbound(x)
                          setShowAll(false)
                        }}
                      >
                        <td className="px-4 py-2.5">{formatDate(x.transactionDate ?? x.createdAt)}</td>
                        <td className="px-4 py-2.5 text-cyan-300 font-semibold">{x.transactionNo}</td>
                        <td className="px-4 py-2.5 truncate">{supplierName(x)}</td>
                        <td className="px-4 py-2.5 truncate">{transactionZones(x).join(', ') || '-'}</td>
                        <td className="px-4 py-2.5 font-medium">{formatQuantity(transactionQuantity(x), 3)}</td>
                        <td className="px-4 py-2.5">{transactionUnits(x)}</td>
                        <td className="px-4 py-2.5">{unitPrice == null ? '-' : formatCurrency(unitPrice)}</td>
                        <td className="px-4 py-2.5 font-bold text-emerald-400">{formatCurrency(transactionAmount(x))}</td>
                        <td className="px-4 py-2.5" onClick={(event) => event.stopPropagation()}>
                          <InventoryTransactionAttachmentButton
                            transaction={x}
                            attachmentMap={attachmentMap}
                            onOpen={(attachments) => setAttachmentDrawer({ transaction: x, attachments })}
                          />
                        </td>
                            <td className="px-2.5 py-1 text-center">
                              <span className="inline-flex min-w-[30px] items-center justify-center rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs font-semibold text-cyan-300">
                                {transactionItems(x).length}
                              </span>
                            </td>
                        <td className="px-4 py-2.5 text-slate-400">{x.createdBy ?? 'Admin'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {rows.length > modalPageSize ? (
              <InventoryPagination
                page={safeModalPage}
                pageCount={modalPageCount}
                pageSize={modalPageSize}
                total={rows.length}
                onPageChange={setModalPage}
                pageSizeOptions={modalPageSizeOptions}
                onPageSizeChange={(nextPageSize) => {
                  setModalPageSize(nextPageSize)
                  setModalPage(1)
                }}
                containerClassName="mt-0 border-t border-white/10 bg-slate-950/20"
              />
            ) : null}
          </div>
        </div>
      )}
      <InventoryTransactionAttachmentDrawer
        open={Boolean(attachmentDrawer)}
        transaction={attachmentDrawer?.transaction}
        attachments={attachmentDrawer?.attachments ?? []}
        onClose={() => setAttachmentDrawer(null)}
      />
      <InboundDetailDrawer
        transaction={selectedInbound}
        onClose={() => setSelectedInbound(null)}
      />
    </EnterpriseModulePage>
  )
}
