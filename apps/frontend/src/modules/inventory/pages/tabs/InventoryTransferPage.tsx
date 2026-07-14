import { useMemo, useState } from 'react'
import { CircleDollarSign, PackageCheck, RefreshCw, ShieldX, TriangleAlert } from 'lucide-react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { ModuleDetailDrawer } from '../../../../shared/ui/modules'
import { InventoryTabWorkspace } from '../../components/InventoryTabWorkspace'
import {
  CompactDonutSummary,
  HorizontalBars,
  InventoryChartCard,
  InventoryPagination,
  InventoryPanel,
  inventoryInput,
  inventoryMutedButton,
  inventoryTableHead,
  inventoryTableRow,
  inventoryTableShell,
} from '../../components/InventoryVisuals'
import { useInventoryItems } from '../../hooks/useInventoryItems'
import { useInventoryTransactions } from '../../hooks/useInventoryTransactions'
import { useZones } from '../../hooks/useZones'
import { formatCurrencyVnd, formatDateTime, formatQuantity } from '@/shared/utils/number-format'
import {
  InventoryTransactionAttachmentButton,
  InventoryTransactionAttachmentDrawer,
  useInventoryTransactionAttachmentMap,
} from '../../components/InventoryAttachmentPanel'

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

function outboundLines(tx: any) {
  return transactionItems(tx).filter((line: any) => num(line.quantity) < 0)
}

function inboundLines(tx: any) {
  return transactionItems(tx).filter((line: any) => num(line.quantity) > 0)
}

function lineAmount(line: any) {
  const quantity = Math.abs(num(line?.quantity))
  const totalAmount = Math.abs(num(line?.totalAmount))
  if (totalAmount) return totalAmount
  return quantity * Math.abs(num(line?.unitPrice))
}

function transferAmount(tx: any) {
  const outbound = outboundLines(tx)
  const sourceLines = outbound.length ? outbound : transactionItems(tx)
  return sourceLines.reduce((sum: number, line: any) => sum + lineAmount(line), 0)
}

function transferQuantity(tx: any) {
  const outbound = outboundLines(tx)
  const sourceLines = outbound.length ? outbound : transactionItems(tx)
  return sourceLines.reduce((sum: number, line: any) => sum + Math.abs(num(line.quantity)), 0)
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

function locationKey(line: any) {
  return [
    lineWarehouse(line),
    lineZone(line),
    line?.slotId ?? '-',
    line?.level ?? '-',
  ].join(' / ')
}

function uniqueLineSummary(lines: any[], select: (line: any) => string) {
  return Array.from(new Set(lines.map(select).filter((value) => value && value !== '-'))).join(', ') || '-'
}

function transferPairs(tx: any) {
  const pairs = new Map<string, { source?: any; destination?: any }>()
  transactionItems(tx).forEach((line: any) => {
    const key = String(line?.inventoryItemId ?? line?.inventoryItem?.id ?? '')
    const pair = pairs.get(key) ?? {}
    if (num(line?.quantity) < 0) pair.source = line
    if (num(line?.quantity) > 0) pair.destination = line
    pairs.set(key, pair)
  })
  return Array.from(pairs.values()).filter((pair) => pair.source || pair.destination)
}

function transferRoute(tx: any) {
  const labels = transferPairs(tx).map(
    (pair) => `${lineZone(pair.source)} -> ${lineZone(pair.destination)}`,
  )
  return {
    label: Array.from(new Set(labels)).join(', ') || '- -> -',
  }
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

function TransferDetailDrawer({
  transaction,
  onClose,
}: {
  transaction: any | null
  onClose: () => void
}) {
  const items = transactionItems(transaction)
  const sources = outboundLines(transaction)
  const destinations = inboundLines(transaction)
  const route = transferRoute(transaction)

  return (
    <ModuleDetailDrawer
      open={Boolean(transaction)}
      title={transaction?.transactionNo ?? 'Chi tiết điều chuyển'}
      subtitle="Chi tiết phiếu điều chuyển kho"
      onClose={onClose}
      widthClass="max-w-6xl"
    >
      {transaction ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-cyan-300/15 bg-cyan-400/[0.055] p-3">
              <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Tuyến điều chuyển</div>
              <div className="mt-2 truncate text-xl font-semibold text-white">{route.label}</div>
            </div>
            <div className="rounded-xl border border-emerald-300/15 bg-emerald-400/[0.055] p-3">
              <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Giá trị</div>
              <div className="mt-2 text-2xl font-semibold text-white">{formatCurrency(transferAmount(transaction))}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Số lượng</div>
              <div className="mt-2 text-2xl font-semibold text-white">{formatQuantity(transferQuantity(transaction), 3)}</div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="grid gap-2 text-sm md:grid-cols-2 lg:grid-cols-3">
              <InfoLine label="Mã phiếu" value={transaction.transactionNo ?? '-'} />
              <InfoLine label="Ngày điều chuyển" value={formatDate(transaction.transactionDate ?? transaction.createdAt)} />
              <InfoLine label="Loại điều chuyển" value={transaction.referenceType ?? 'Điều chuyển nội bộ'} />
              <InfoLine label="Người tạo" value={transactionActor(transaction)} />
              <InfoLine label="Trạng thái" value={String(transaction.status ?? 'COMPLETED')} />
              <InfoLine label="Ghi chú" value={transaction.remarks ?? transaction.note ?? '-'} />
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-red-300/15 bg-red-400/[0.045] p-3">
              <div className="mb-2 text-sm font-semibold text-red-100">Vị trí nguồn</div>
              <div className="grid gap-2 text-sm md:grid-cols-2">
                <InfoLine label="Warehouse" value={uniqueLineSummary(sources, lineWarehouse)} />
                <InfoLine label="Zone" value={uniqueLineSummary(sources, lineZone)} />
                <InfoLine label="Slot" value={uniqueLineSummary(sources, (line) => line?.slotId ?? '-')} />
                <InfoLine label="Level" value={uniqueLineSummary(sources, (line) => line?.level ?? '-')} />
              </div>
            </div>
            <div className="rounded-xl border border-emerald-300/15 bg-emerald-400/[0.045] p-3">
              <div className="mb-2 text-sm font-semibold text-emerald-100">Vị trí đích</div>
              <div className="grid gap-2 text-sm md:grid-cols-2">
                <InfoLine label="Warehouse" value={uniqueLineSummary(destinations, lineWarehouse)} />
                <InfoLine label="Zone" value={uniqueLineSummary(destinations, lineZone)} />
                <InfoLine label="Slot" value={uniqueLineSummary(destinations, (line) => line?.slotId ?? '-')} />
                <InfoLine label="Level" value={uniqueLineSummary(destinations, (line) => line?.level ?? '-')} />
              </div>
            </div>
          </div>

          <div className="overflow-auto rounded-xl border border-white/10 bg-slate-950/35">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-white/[0.06] text-xs uppercase text-slate-400">
                <tr>
                  {['Hướng', 'Mã vật tư', 'Tên vật tư', 'Warehouse', 'Zone', 'Slot', 'Level', 'Số lượng', 'Đơn vị', 'Đơn giá', 'Giá trị'].map((header) => (
                    <th key={header} className="px-3 py-2 text-left font-medium">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.length ? items.map((line: any) => {
                  const isOut = num(line.quantity) < 0
                  return (
                    <tr key={line.id ?? `${line.inventoryItemId}-${line.quantity}-${lineZone(line)}`} className="border-t border-white/10 text-slate-300">
                      <td className="px-3 py-2">
                        <span className={`rounded border px-2 py-0.5 text-xs ${isOut ? 'border-red-300/30 bg-red-400/10 text-red-200' : 'border-emerald-300/30 bg-emerald-400/10 text-emerald-200'}`}>
                          {isOut ? 'Xuất' : 'Nhập'}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-medium text-cyan-300">{line?.inventoryItem?.code ?? '-'}</td>
                      <td className="px-3 py-2 text-slate-100">{line?.inventoryItem?.name ?? '-'}</td>
                      <td className="px-3 py-2">{lineWarehouse(line)}</td>
                      <td className="px-3 py-2">{lineZone(line)}</td>
                      <td className="px-3 py-2">{line?.slotId ?? '-'}</td>
                      <td className="px-3 py-2">{line?.level ?? '-'}</td>
                      <td className="px-3 py-2">{formatQuantity(Math.abs(num(line.quantity)), 3)}</td>
                      <td className="px-3 py-2">{lineUnit(line)}</td>
                      <td className="px-3 py-2">{formatCurrency(line.unitPrice)}</td>
                      <td className="px-3 py-2 font-semibold text-emerald-300">{formatCurrency(lineAmount(line))}</td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan={11} className="px-3 py-8 text-center text-sm text-slate-500">
                      Phiếu điều chuyển chưa có dòng vật tư.
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

export function InventoryTransferPage() {
  const { data: materials = [] } = useInventoryItems()
  const { data: zones = [] } = useZones()
  const { data: tx = [], isLoading } = useInventoryTransactions({ type: 'TRANSFER' })

  const [date, setDate] = useState('')
  const [materialFilter, setMaterialFilter] = useState('')
  const [fromZoneFilter, setFromZoneFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [attachmentDrawer, setAttachmentDrawer] = useState<{ transaction: any; attachments: any[] } | null>(null)
  const [selectedTransfer, setSelectedTransfer] = useState<any | null>(null)
  const pageSize = 10
  const attachmentMap = useInventoryTransactionAttachmentMap()

  // Các state cần có (nếu chưa có):
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')

  // Hàm áp dụng tìm kiếm
  const applySearch = () => {
    setSearch(searchDraft)
    setPage(1)
  }

  // Hàm reset toàn bộ filter
  const resetFilters = () => {
    setSearchDraft('')
    setSearch('')
    setDate('')
    setMaterialFilter('')
    setFromZoneFilter('')
    setStatusFilter('')
    setPage(1)
  }

  const rows = useMemo(() => {
    return (tx as any[])
      .filter((x: any) => {
        if (date) {
          const d = new Date(x.transactionDate ?? x.createdAt).toISOString().slice(0, 10)
          if (d !== date) return false
        }
        if (materialFilter && !x.items?.some((line: any) => String(line.inventoryItemId) === materialFilter)) return false
        if (fromZoneFilter && !outboundLines(x).some((line: any) => String(line?.zoneId ?? '') === fromZoneFilter)) return false
        if (statusFilter && String(x.status ?? 'COMPLETED').toUpperCase() !== statusFilter) return false
        return true
      })
      .sort((a: any, b: any) => +new Date(b.transactionDate ?? b.createdAt) - +new Date(a.transactionDate ?? a.createdAt))
  }, [tx, date, materialFilter, fromZoneFilter, statusFilter])

  const kpis = useMemo(() => {
    const now = new Date()
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const todayKey = now.toISOString().slice(0, 10)
    const inMonth = rows.filter((x: any) => String(x.transactionDate ?? x.createdAt).slice(0, 7) === monthKey)
    const todayRows = rows.filter((x: any) => String(x.transactionDate ?? x.createdAt).slice(0, 10) === todayKey)
    const total = rows.length
    const pending = rows.filter((x: any) => String(x.status ?? '').toUpperCase() === 'PENDING').length
    const done = rows.filter((x: any) => String(x.status ?? 'COMPLETED').toUpperCase() === 'COMPLETED').length
    const cancelled = rows.filter((x: any) => String(x.status ?? '').toUpperCase() === 'CANCELLED').length
    const monthlyValue = inMonth.reduce((s: number, x: any) => s + transferAmount(x), 0)
    const todayValue = todayRows.reduce((s: number, x: any) => s + transferAmount(x), 0)
    return { total, pending, done, cancelled, monthlyValue, todayValue, monthlyDocs: inMonth.length }
  }, [rows])

  const zoneValue = useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach((x: any) => {
      outboundLines(x).forEach((line: any) => {
        const key = lineZone(line)
        m.set(key, (m.get(key) ?? 0) + lineAmount(line))
      })
    })
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [rows])

  const topMaterials = useMemo(() => {
    const m = new Map<string, { code: string; value: number }>()
    rows.forEach((x: any) => {
      outboundLines(x).forEach((line: any) => {
        const code = line?.inventoryItem?.code ?? 'NA'
        const current = m.get(code) ?? { code, value: 0 }
        current.value += lineAmount(line)
        m.set(code, current)
      })
    })
    return Array.from(m.values()).sort((a, b) => b.value - a.value).slice(0, 5)
  }, [rows])

  const topRoutes = useMemo(() => {
    const m = new Map<string, { label: string; count: number; quantity: number; value: number }>()
    rows.forEach((x: any) => {
      transferPairs(x).forEach((pair) => {
        const label = `${lineZone(pair.source)} -> ${lineZone(pair.destination)}`
        const current = m.get(label) ?? { label, count: 0, quantity: 0, value: 0 }
        current.count += 1
        current.quantity += Math.abs(num(pair.source?.quantity ?? pair.destination?.quantity))
        current.value += lineAmount(pair.source ?? pair.destination)
        m.set(label, current)
      })
    })
    return Array.from(m.values()).sort((a, b) => b.value - a.value).slice(0, 5)
  }, [rows])

  const topSourceLocations = useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach((x: any) => {
      outboundLines(x).forEach((source: any) => {
        const key = locationKey(source)
        m.set(key, (m.get(key) ?? 0) + lineAmount(source))
      })
    })
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [rows])

  const topDestinationLocations = useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach((x: any) => {
      inboundLines(x).forEach((destination: any) => {
        const key = locationKey(destination)
        m.set(key, (m.get(key) ?? 0) + lineAmount(destination))
      })
    })
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [rows])

  const transferSegments = useMemo(() => [
    { label: 'Hoàn thành', value: kpis.done, color: '#14c987' },
    { label: 'Đang thực hiện', value: kpis.pending, color: '#f59e0b' },
    { label: 'Đã hủy', value: kpis.cancelled, color: '#ef4444' },
  ], [kpis.done, kpis.pending, kpis.cancelled])

  const recentActivities = useMemo(() => rows.slice(0, 5), [rows])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page])
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))

  const filterInput =
  'h-9 w-full rounded-md border border-white/10 bg-slate-950/45 px-2 text-xs text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-950/65'


  return (
    <EnterpriseModulePage>
      <InventoryTabWorkspace />

      <div className="space-y-1 -mt-2">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-1.5">
          <OverviewMetricCard
            title="Phiếu điều chuyển tháng"
            value={formatQuantity(kpis.monthlyDocs, 0)}
            note={`${formatQuantity(kpis.total, 0)} phiếu đang lọc`}
            tone="blue"
            icon={<PackageCheck size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="Giá trị tháng này"
            value={formatCurrency(kpis.monthlyValue)}
            note="Theo dòng xuất nguồn"
            tone="emerald"
            icon={<CircleDollarSign size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="Giá trị hôm nay"
            value={formatCurrency(kpis.todayValue)}
            note="Theo ngày hiện tại"
            tone="purple"
            icon={<CircleDollarSign size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="Đang thực hiện"
            value={formatQuantity(kpis.pending, 0)}
            note="Chờ hoàn tất"
            tone="amber"
            icon={<RefreshCw size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="Đã hủy"
            value={formatQuantity(kpis.cancelled, 0)}
            note="Không hợp lệ"
            tone="red"
            icon={<ShieldX size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="Tỷ lệ hoàn tất"
            value={`${kpis.total ? ((kpis.done / kpis.total) * 100).toFixed(1) : '0.0'}%`}
            note="Phiếu hoàn thành"
            tone="cyan"
            icon={<TriangleAlert size={15} />}
            trend={[0,0,0,0,0,0]}
          />
        </div>

        <InventoryPanel className="rounded-xl p-0.5">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-[180px_180px_180px_180px_minmax(260px,1fr)_130px_120px]">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={filterInput}
            />
            <select
              value={materialFilter}
              onChange={(e) => setMaterialFilter(e.target.value)}
              className={filterInput}
            >
              <option value="">Vật tư</option>
              {materials.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.code} - {m.name}
                </option>
              ))}
            </select>
            <select
              value={fromZoneFilter}
              onChange={(e) => setFromZoneFilter(e.target.value)}
              className={filterInput}
            >
              <option value="">Kho xuất</option>
              {zones.map((z: any) => (
                <option key={z.id} value={z.id}>
                  {z.code}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={filterInput}
            >
              <option value="">Trạng thái</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="PENDING">Đang thực hiện</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearch()
              }}
              placeholder="Tìm mã phiếu, vật tư, kho..."
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

        <div className={`grid grid-cols-1 xl:grid-cols-12 gap-1.5`}>
          <InventoryPanel title="Danh sách phiếu điều chuyển" className="xl:col-span-9 p-0">
            <div className={`${inventoryTableShell} overflow-auto`}>
              <table className="w-full min-w-[1100px] text-sm">
                <thead className={inventoryTableHead}>
                  <tr>
                    {['Mã phiếu', 'Ngày tạo', 'Kho xuất', 'Kho nhập', 'Loại điều chuyển', 'Số lượng', 'Giá trị', 'Hồ sơ', 'Trạng thái', 'Người tạo'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!isLoading &&
                    paged.map((x: any) => {
                      const sources = outboundLines(x)
                      const destinations = inboundLines(x)
                      return (
                        <tr
                          key={x.id}
                          className={`${inventoryTableRow} cursor-pointer`}
                          onClick={() => setSelectedTransfer(x)}
                        >
                          <td className="px-3 py-1.5 text-cyan-300">{x.transactionNo}</td>
                          <td className="px-3 py-1.5">{formatDate(x.transactionDate ?? x.createdAt)}</td>
                          <td className="px-3 py-1.5">{uniqueLineSummary(sources, lineZone)}</td>
                          <td className="px-3 py-1.5">{uniqueLineSummary(destinations, lineZone)}</td>
                          <td className="px-3 py-1.5">{x.referenceType ?? 'Điều chuyển nội bộ'}</td>
                          <td className="px-3 py-1.5">{formatQuantity(transferQuantity(x), 3)}</td>
                          <td className="px-3 py-1.5">{formatCurrency(transferAmount(x))}</td>
                          <td className="px-3 py-1.5" onClick={(event) => event.stopPropagation()}>
                            <InventoryTransactionAttachmentButton
                              transaction={x}
                              attachmentMap={attachmentMap}
                              onOpen={(attachments) => setAttachmentDrawer({ transaction: x, attachments })}
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <span className="rounded border border-emerald-700/60 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">{String(x.status ?? 'COMPLETED')}</span>
                          </td>
                          <td className="px-3 py-1.5">{x.createdBy ?? 'Admin'}</td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
            <InventoryPagination page={page} pageCount={pageCount} total={rows.length} pageSize={pageSize} onPageChange={setPage} containerClassName="grid grid-cols-1 items-center gap-2 px-4 py-2 text-xs text-slate-400 md:grid-cols-3" />
          </InventoryPanel>

          <div className="space-y-1.5 xl:col-span-3">
            <InventoryChartCard title="Tổng quan điều chuyển" className="p-2">
              <CompactDonutSummary segments={transferSegments} centerValue={formatQuantity(kpis.total, 0)} centerLabel="phiếu" />
            </InventoryChartCard>
            <InventoryChartCard title="Giá trị điều chuyển theo kho" className="p-2">
              <HorizontalBars rows={zoneValue} valueFormatter={formatCurrency} />
            </InventoryChartCard>
            <InventoryChartCard title="Top vật tư theo giá trị" className="p-2">
              <HorizontalBars rows={topMaterials.map((m) => [m.code, m.value])} valueFormatter={formatCurrency} />
            </InventoryChartCard>
            <InventoryChartCard title="Top tuyến điều chuyển" className="p-2">
              <div className="space-y-2">
                {topRoutes.map((route) => (
                  <div key={route.label} className="rounded-lg border border-white/10 bg-slate-950/35 px-3 py-2 text-xs">
                    <div className="truncate font-semibold text-cyan-100">{route.label}</div>
                    <div className="mt-1 grid grid-cols-3 gap-2 text-slate-400">
                      <span>{formatQuantity(route.count, 0)} phiếu</span>
                      <span>{formatQuantity(route.quantity, 3)}</span>
                      <span className="text-right text-emerald-300">{formatCurrency(route.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </InventoryChartCard>
            <InventoryChartCard title="Top vị trí nguồn" className="p-2">
              <HorizontalBars rows={topSourceLocations} valueFormatter={formatCurrency} />
            </InventoryChartCard>
            <InventoryChartCard title="Top vị trí đích" className="p-2">
              <HorizontalBars rows={topDestinationLocations} valueFormatter={formatCurrency} />
            </InventoryChartCard>
            <InventoryChartCard title="Hoạt động gần đây" className="p-2">
              {recentActivities.map((x: any) => (
                <div key={x.id} className="mb-1.5 rounded border border-white/10 p-2 text-xs text-slate-300">
                  <div className="text-cyan-300">{x.transactionNo}</div>
                  <div className="text-slate-500">{formatDateTime(x.transactionDate ?? x.createdAt)}</div>
                </div>
              ))}
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
      <TransferDetailDrawer
        transaction={selectedTransfer}
        onClose={() => setSelectedTransfer(null)}
      />
    </EnterpriseModulePage>
  )
}
