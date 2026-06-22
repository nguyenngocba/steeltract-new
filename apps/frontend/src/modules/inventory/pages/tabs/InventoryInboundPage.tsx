import { useMemo, useState } from 'react'
import { CircleDollarSign, PackageCheck, RefreshCw, ShieldX, TriangleAlert } from 'lucide-react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { ModuleDetailDrawer } from '../../../../shared/ui/modules'
import { InventoryTabWorkspace } from '../../components/InventoryTabWorkspace'
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
  'h-5 w-full rounded-md border border-white/10 bg-slate-950/45 px-1.5 text-xs text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-950/65'
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

// ================= PAGINATION (giống bên Tồn kho) =================
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
        Hiển thị {start}-{end}/{total.toLocaleString('vi-VN')} kết quả
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
  const { data: tx = [], isLoading } = useInventoryTransactions({ type: 'INBOUND' })

  const [date, setDate] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [attachmentDrawer, setAttachmentDrawer] = useState<{ transaction: any; attachments: any[] } | null>(null)
  const [selectedInbound, setSelectedInbound] = useState<any | null>(null)
  const pageSize = 14
  const attachmentMap = useInventoryTransactionAttachmentMap()
  const [searchDraft, setSearchDraft] = useState('')
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

  const filterInput =
  'h-9 w-full rounded-md border border-white/10 bg-slate-950/45 px-2 text-xs text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-950/65'


  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))

  return (
    <EnterpriseModulePage>
      <InventoryTabWorkspace />

      <div className="space-y-1 -mt-2">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-1.5">
          <OverviewMetricCard
            title="Tổng nhập trong tháng"
            value={formatQuantity(kpis.monthlyQty, 3)}
            note="Theo phiếu nhập"
            tone="blue"
            icon={<RefreshCw size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="Giá trị nhập trong tháng"
            value={formatCurrency(kpis.monthlyAmount)}
            note="Theo đơn giá nhập"
            tone="emerald"
            icon={<CircleDollarSign size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="Giá trị nhập hôm nay"
            value={formatCurrency(kpis.todayAmount)}
            note="Theo ngày hiện tại"
            tone="purple"
            icon={<CircleDollarSign size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="Số phiếu nhập tháng"
            value={formatQuantity(kpis.docs, 0)}
            note="Trong tháng hiện tại"
            tone="cyan"
            icon={<PackageCheck size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="NCC phát sinh tháng"
            value={formatQuantity(kpis.monthlySuppliers, 0)}
            note="Nhà cung cấp có nhập"
            tone="amber"
            icon={<PackageCheck size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="Hoàn thành"
            value={formatQuantity(kpis.done, 0)}
            note="Phiếu đã ghi nhận"
            tone="emerald"
            icon={<TriangleAlert size={15} />}
            trend={[0,0,0,0,0,0]}
          />
        </div>

        <InventoryPanel className="rounded-xl p-0.5">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-[180px_180px_180px_minmax(260px,1fr)_130px_120px]">
            <select
              value={supplierId}
              onChange={(e) => {
                setSupplierId(e.target.value)
                setPage(1)
              }}
              className={filterInput}
            >
              <option value="">Nhà cung cấp</option>
              {suppliers.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value={zoneId}
              onChange={(e) => {
                setZoneId(e.target.value)
                setPage(1)
              }}
              className={filterInput}
            >
              <option value="">Vị trí</option>
              {zones.map((z: any) => (
                <option key={z.id} value={z.id}>
                  {z.code}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value)
                setPage(1)
              }}
              className={filterInput}
            />
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearch()
              }}
              placeholder="Mã phiếu, vật tư, NCC..."
              className={filterInput}
            />
            <button
              onClick={applySearch}
              className="h-9 self-end rounded-md bg-blue-600 px-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
            >
              Tìm kiếm
            </button>
            <button
              onClick={resetFilters}
              className="h-9 self-end rounded-md border border-white/10 bg-white/[0.055] px-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Làm mới
            </button>
          </div>
        </InventoryPanel>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-1">
          <InventoryPanel title="Danh sách phiếu nhập" className="xl:col-span-9 p-0 pb-0">
            <div className={`${inventoryTableShell} h-[520px] overflow-auto`}>
              <table className="w-full min-w-[1100px] text-xs">
                <thead className={inventoryTableHead}>
                  <tr>
                    {['Mã phiếu nhập', 'Ngày nhập', 'Nhà cung cấp', 'Vị trí', 'Số lượng', 'ĐVT', 'Đơn giá', 'Tổng giá trị', 'Hồ sơ', 'Trạng thái', 'Người tạo'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!isLoading &&
                    paged.map((x: any) => {
                      const line = transactionItems(x)[0]
                      return (
                        <tr
                          key={x.id}
                          className={`${inventoryTableRow} cursor-pointer`}
                          onClick={() => setSelectedInbound(x)}
                        >
                          <td className="px-1.5 py-1 text-cyan-300">{x.transactionNo}</td>
                          <td className="px-1.5 py-1">{formatDate(x.transactionDate ?? x.createdAt)}</td>
                          <td className="px-1.5 py-1">{supplierName(x)}</td>
                          <td className="px-1.5 py-1">{transactionZones(x).join(', ') || '-'}</td>
                          <td className="px-1.5 py-1">{formatQuantity(transactionQuantity(x), 3)}</td>
                          <td className="px-1.5 py-1">{lineUnit(line)}</td>
                          <td className="px-1.5 py-1">{formatCurrency(line?.unitPrice)}</td>
                          <td className="px-1.5 py-1">{formatCurrency(transactionAmount(x))}</td>
                          <td className="px-1.5 py-1" onClick={(event) => event.stopPropagation()}>
                            <InventoryTransactionAttachmentButton
                              transaction={x}
                              attachmentMap={attachmentMap}
                              onOpen={(attachments) => setAttachmentDrawer({ transaction: x, attachments })}
                            />
                          </td>
                          <td className="px-1.5 py-1">
                            <span className="rounded border border-emerald-700/60 bg-emerald-500/10 px-1 py-0.5 text-[10px] text-emerald-300">{String(x.status ?? 'COMPLETED')}</span>
                          </td>
                          <td className="px-1.5 py-1">{x.createdBy ?? 'Admin'}</td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
            <MaterialsPagination page={page} pageCount={pageCount} total={rows.length} pageSize={pageSize} onPageChange={setPage} />
          </InventoryPanel>

          <div className="space-y-1.5 xl:col-span-3">
            <InventoryChartCard title="Phân bổ nhập theo vị trí" className="p-2">
              <CompactDonutSummary segments={zoneSegments} centerValue={formatQuantity(kpis.monthlyQty, 0)} centerLabel="tổng nhập" />
            </InventoryChartCard>
            <InventoryChartCard title="Top vật tư nhập" className="p-2">
              <HorizontalBars rows={topMaterials.map((m) => [m.code, m.value])} valueFormatter={(value) => formatCurrency(value)} />
            </InventoryChartCard>
            <InventoryChartCard title="Top NCC theo giá trị nhập" className="p-2">
              <div className="space-y-2">
                {topSuppliers.map((supplier) => (
                  <div key={supplier.name} className="rounded-lg border border-white/10 bg-slate-950/35 px-3 py-2 text-xs">
                    <div className="truncate font-semibold text-cyan-100">{supplier.name}</div>
                    <div className="mt-1 grid grid-cols-2 gap-2 text-slate-400">
                      <span>{formatQuantity(supplier.quantity, 3)}</span>
                      <span className="text-right text-emerald-300">{formatCurrency(supplier.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </InventoryChartCard>
            <InventoryChartCard title="Top NCC theo khối lượng" className="p-2">
              <div className="space-y-2">
                {topSuppliersByQuantity.map((supplier) => (
                  <div key={supplier.name} className="rounded-lg border border-white/10 bg-slate-950/35 px-3 py-2 text-xs">
                    <div className="truncate font-semibold text-cyan-100">{supplier.name}</div>
                    <div className="mt-1 grid grid-cols-2 gap-2 text-slate-400">
                      <span>{formatQuantity(supplier.quantity, 3)}</span>
                      <span className="text-right text-emerald-300">{formatCurrency(supplier.value)}</span>
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
        </div>
      </div>
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
