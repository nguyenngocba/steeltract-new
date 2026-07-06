import { useMemo, useState } from 'react'
import { CircleDollarSign, PackageCheck, RefreshCw, Target, TriangleAlert } from 'lucide-react'
import { CockpitKpiCard, COCKPIT_HEIGHTS } from '../../../../shared/ui/cockpit'
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
import { useProjects } from '../../hooks/useProjects'
import { useZones } from '../../hooks/useZones'
import { formatCurrencyVnd, formatQuantity } from '@/shared/utils/number-format'
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
  const className = `relative h-[108px] overflow-hidden rounded-xl border bg-[#0b1424] p-3 text-left shadow-[0_14px_42px_rgba(0,0,0,0.3)] ring-1 ring-white/[0.04] transition ${
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

function dateKey(value: any) {
  const date = new Date(value ?? '')
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function monthKey(value: any) {
  const key = dateKey(value)
  return key ? key.slice(0, 7) : ''
}

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay() || 7
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - day + 1)
  return d
}

function sumTransactionAmount(rows: any[]) {
  return rows.reduce((sum: number, tx: any) => sum + transactionAmount(tx), 0)
}

function sumTransactionQuantity(rows: any[]) {
  return rows.reduce((sum: number, tx: any) => sum + transactionQuantity(tx), 0)
}

function transactionItems(tx?: any | null) {
  return Array.isArray(tx?.items) ? tx.items : []
}

function transactionQuantity(tx?: any | null) {
  return transactionItems(tx).reduce(
    (sum: number, line: any) =>
      sum + Math.abs(num(line?.quantity)),
    0,
  )
}

function lineAmount(line?: any | null) {
  const quantity = Math.abs(num(line?.quantity))
  const totalAmount = num(line?.totalAmount)
  if (totalAmount) return Math.abs(totalAmount)
  return quantity * num(line?.unitPrice)
}

function transactionAmount(tx?: any | null) {
  return transactionItems(tx).reduce(
    (sum: number, line: any) =>
      sum + lineAmount(line),
    0,
  )
}

function transactionZoneCodes(tx: any) {
  const codes = transactionItems(tx)
    .map((line: any) => line?.zone?.code)
    .filter(Boolean)
  return Array.from(new Set(codes))
}

function transactionProjectName(tx: any) {
  return tx?.projectName ?? tx?.project?.name ?? '-'
}

function transactionActor(tx: any) {
  return tx?.createdBy ?? tx?.performedBy ?? tx?.approvedBy ?? 'Admin'
}

function lineUnit(line: any) {
  return line?.unit?.symbol ?? line?.unit?.code ?? line?.inventoryItem?.unit ?? '-'
}

function outboundPurpose(tx: any) {
  const text = [
    tx?.referenceType,
    tx?.referenceModule,
    tx?.remarks,
    tx?.note,
    tx?.projectName,
    tx?.customerName,
  ].filter(Boolean).join(' ').toLowerCase()
  if (tx?.projectId || tx?.project || text.includes('project') || text.includes('công trình')) return 'project'
  if (text.includes('production') || text.includes('sản xuất') || text.includes('mo') || text.includes('lệnh sản xuất')) return 'production'
  if (text.includes('customer') || text.includes('khách')) return 'customer'
  return 'other'
}

function purposeLabel(purpose: string) {
  const labels: Record<string, string> = {
    project: 'Công trình',
    production: 'Sản xuất',
    customer: 'Khách hàng',
    other: 'Khác',
  }
  return labels[purpose] ?? purpose
}

function TrendPanel({ rows, valueFormatter = formatCurrency }: { rows: { label: string; value: number }[]; valueFormatter?: (value: number) => string }) {
  const max = Math.max(1, ...rows.map((row) => row.value))
  return (
    <div className="space-y-3">
      <div className="flex h-32 items-end gap-2 rounded-xl border border-white/10 bg-slate-950/35 px-3 pb-3 pt-4">
        {rows.map((row) => (
          <div key={row.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-lg bg-gradient-to-t from-blue-500/75 to-cyan-300/85 shadow-[0_0_18px_rgba(34,211,238,0.18)]"
              style={{ height: `${Math.max(6, (row.value / max) * 100)}%` }}
              title={`${row.label}: ${valueFormatter(row.value)}`}
            />
            <div className="w-full truncate text-center text-[10px] text-slate-500">{row.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
        {rows.slice(-4).map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-2 py-1.5">
            <span className="truncate">{row.label}</span>
            <span className="shrink-0 font-semibold text-slate-100">{valueFormatter(row.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FinancialKpiRows({ today, week, month, year }: { today: number; week: number; month: number; year: number }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {[
        ['Hôm nay', today],
        ['Tuần này', week],
        ['Tháng này', month],
        ['Năm nay', year],
      ].map(([label, value]) => (
        <div key={label as string} className="rounded-xl border border-white/10 bg-white/[0.045] p-3">
          <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{label}</div>
          <div className="mt-2 text-lg font-semibold text-white">{formatCurrency(value)}</div>
        </div>
      ))}
    </div>
  )
}

function OutboundTransactionDetailDrawer({
  transaction,
  onClose,
}: {
  transaction: any | null
  onClose: () => void
}) {
  if (!transaction) return null

  const items = transactionItems(transaction)
  const totalQuantity = transactionQuantity(transaction)
  const totalValue = transactionAmount(transaction)

  return (
    <ModuleDetailDrawer
      open={Boolean(transaction)}
      title={transaction?.transactionNo ?? 'Chi tiết phiếu xuất'}
      subtitle="Chi tiết xuất kho vật tư"
      onClose={onClose}
      widthClass="max-w-5xl"
    >
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-cyan-300/15 bg-cyan-400/[0.055] p-3">
              <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Tổng khối lượng</div>
              <div className="mt-2 text-2xl font-semibold text-white">{formatQuantity(totalQuantity, 0)}</div>
            </div>
            <div className="rounded-xl border border-emerald-300/15 bg-emerald-400/[0.055] p-3">
              <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Tổng giá trị</div>
              <div className="mt-2 text-2xl font-semibold text-white">{formatCurrency(totalValue)}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Số dòng vật tư</div>
              <div className="mt-2 text-2xl font-semibold text-white">{formatQuantity(items.length, 0)}</div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="grid gap-2 text-sm md:grid-cols-2">
              <InfoLine label="Mã phiếu" value={transaction?.transactionNo ?? '-'} />
              <InfoLine label="Ngày xuất" value={formatDate(transaction?.transactionDate ?? transaction?.createdAt)} />
              <InfoLine label="Công trình / đơn vị nhận" value={transactionProjectName(transaction)} />
              <InfoLine label="Người tạo" value={transactionActor(transaction)} />
              <InfoLine label="Kho xuất" value={transactionZoneCodes(transaction).join(', ') || '-'} />
              <InfoLine label="Ghi chú" value={transaction?.remarks ?? transaction?.note ?? '-'} />
            </div>
          </div>

          <div className="overflow-auto rounded-xl border border-white/10 bg-slate-950/35">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-white/[0.06] text-xs uppercase text-slate-400">
                <tr>
                  {['Mã vật tư', 'Tên vật tư', 'Số lượng', 'Đơn vị', 'Đơn giá', 'Thành tiền'].map((header) => (
                    <th key={header} className="px-3 py-2 text-left font-medium">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.length ? items.map((line: any) => (
                  <tr key={line.id ?? `${line.inventoryItemId}-${line.quantity}`} className="border-t border-white/10 text-slate-300">
                    <td className="px-3 py-2 font-medium text-cyan-300">{line?.inventoryItem?.code ?? '-'}</td>
                    <td className="px-3 py-2 text-slate-100">{line?.inventoryItem?.name ?? '-'}</td>
                    <td className="px-3 py-2">{formatQuantity(Math.abs(num(line.quantity)), 3)}</td>
                    <td className="px-3 py-2">{lineUnit(line)}</td>
                    <td className="px-3 py-2">{formatCurrency(line.unitPrice)}</td>
                    <td className="px-3 py-2 font-semibold text-emerald-300">{formatCurrency(lineAmount(line))}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-500">
                      Phiếu xuất chưa có dòng vật tư.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
    </ModuleDetailDrawer>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 truncate text-sm font-medium text-slate-100">{value}</div>
    </div>
  )
}

export function InventoryOutboundPage() {
  const { data: projects = [] } = useProjects()
  const { data: zones = [] } = useZones()
  const { data: tx = [], isLoading } = useInventoryTransactions({ type: 'OUTBOUND' })
  const [showAll, setShowAll] = useState(false);
  const [date, setDate] = useState('')
  const [projectId, setProjectId] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [attachmentDrawer, setAttachmentDrawer] = useState<{ transaction: any; attachments: any[] } | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null)
  const pageSize = 10
  const attachmentMap = useInventoryTransactionAttachmentMap()
  const applySearch = () => {
    setSearch(searchDraft)
    setPage(1)
  }
  const resetFilters = () => {
    setSearchDraft('')
    setSearch('')
    setDate('')
    setProjectId('')
    setZoneId('')
    setPage(1)
  }

  const rows = useMemo(() => {
    return (tx as any[])
      .filter((x: any) => {
        if (date) {
          const d = new Date(x.transactionDate ?? x.createdAt).toISOString().slice(0, 10)
          if (d !== date) return false
        }
        if (projectId && String(x.projectId ?? '') !== projectId) return false
        if (zoneId && !transactionItems(x).some((line: any) => String(line?.zoneId ?? '') === zoneId)) return false
        if (search.trim()) {
          const q = search.trim().toLowerCase()
          const lineText = transactionItems(x)
            .flatMap((line: any) => [
              line?.inventoryItem?.code,
              line?.inventoryItem?.name,
              line?.zone?.code,
            ])
            .join(' ')
          const text = [x.transactionNo, x.projectName, lineText].join(' ').toLowerCase()
          if (!text.includes(q)) return false
        }
        return true
      })
      .sort((a: any, b: any) => +new Date(b.transactionDate ?? b.createdAt) - +new Date(a.transactionDate ?? a.createdAt))
  }, [tx, date, projectId, zoneId, search])

  const kpis = useMemo(() => {
    const now = new Date()
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const inMonth = rows.filter((x: any) => String(x.transactionDate ?? x.createdAt).slice(0, 7) === monthKey)
    const todayKey = now.toISOString().slice(0, 10)
    const todayRows = rows.filter((x: any) => String(x.transactionDate ?? x.createdAt).slice(0, 10) === todayKey)
    const weekStart = startOfWeek(now)
    const weekRows = rows.filter((x: any) => {
      const d = new Date(x.transactionDate ?? x.createdAt)
      return !Number.isNaN(d.getTime()) && d >= weekStart && d <= now
    })
    const yearRows = rows.filter((x: any) => String(x.transactionDate ?? x.createdAt).slice(0, 4) === String(now.getFullYear()))
    const qty = sumTransactionQuantity(inMonth)
    const amount = sumTransactionAmount(inMonth)
    const todayAmount = sumTransactionAmount(todayRows)
    const weekAmount = sumTransactionAmount(weekRows)
    const yearAmount = sumTransactionAmount(yearRows)
    const pending = rows.filter((x: any) => String(x.status ?? '').toUpperCase() === 'PENDING').length
    return {
      monthlyQty: qty,
      monthlyAmount: amount,
      todayAmount,
      weekAmount,
      yearAmount,
      docs: inMonth.length,
      pending,
    }
  }, [rows])

  // ===== TREND DỮ LIỆU THỰC TẾ =====
  const kpiTrend = useMemo(() => {
    const now = new Date()
    // Lấy 6 tháng gần nhất (tính từ tháng hiện tại lùi về 5 tháng)
    const months = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      return { date, key }
    })

    // Nhóm dữ liệu theo tháng
    const monthData = months.map(({ key }) => {
      const inMonth = rows.filter((x: any) => 
        String(x.transactionDate ?? x.createdAt).slice(0, 7) === key
      )
      return {
        qty: sumTransactionQuantity(inMonth),
        amount: sumTransactionAmount(inMonth),
        docs: inMonth.length,
        pending: inMonth.filter((x: any) => String(x.status ?? '').toUpperCase() === 'PENDING').length,
      }
    })

    return {
      monthlyQty: monthData.map((d) => d.qty),
      monthlyAmount: monthData.map((d) => d.amount),
      todayAmount: monthData.map((d) => d.amount), // tạm thời dùng monthly amount, hoặc bạn có thể tính theo ngày
      docs: monthData.map((d) => d.docs),
      pending: monthData.map((d) => d.pending),
    }
  }, [rows])

  const byZone = useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach((x: any) => {
      transactionItems(x).forEach((line: any) => {
        const key = line?.zone?.code ?? 'NA'
        m.set(key, (m.get(key) ?? 0) + Math.abs(num(line?.quantity)))
      })
    })
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [rows])

  const topMaterials = useMemo(() => {
    const m = new Map<string, { code: string; amount: number }>()
    rows.forEach((x: any) => {
      transactionItems(x).forEach((line: any) => {
        const code = line?.inventoryItem?.code ?? 'NA'
        const prev = m.get(code) ?? { code, amount: 0 }
        prev.amount += lineAmount(line)
        m.set(code, prev)
      })
    })
    return Array.from(m.values()).sort((a, b) => b.amount - a.amount).slice(0, 5)
  }, [rows])

  const topProjects = useMemo(() => {
    const m = new Map<string, { name: string; amount: number }>()
    rows.forEach((x: any) => {
      const name = transactionProjectName(x)
      const prev = m.get(name) ?? { name, amount: 0 }
      prev.amount += transactionAmount(x)
      m.set(name, prev)
    })
    return Array.from(m.values()).sort((a, b) => b.amount - a.amount).slice(0, 5)
  }, [rows])

  const zoneSegments = useMemo(() => byZone.map(([label, value], index) => ({
    label,
    value,
    color: ['#1d7cff', '#14c987', '#f59e0b', '#7c3aed', '#ef4444', '#06b6d4'][index % 6],
  })), [byZone])

  const projectConsumption = useMemo(() => {
    const totalValue = Math.max(1, sumTransactionAmount(rows))
    const m = new Map<string, { name: string; docs: Set<string>; quantity: number; value: number }>()
    rows.forEach((x: any) => {
      const name = transactionProjectName(x)
      const prev = m.get(name) ?? { name, docs: new Set<string>(), quantity: 0, value: 0 }
      prev.docs.add(String(x.id ?? x.transactionNo))
      prev.quantity += transactionQuantity(x)
      prev.value += transactionAmount(x)
      m.set(name, prev)
    })
    return Array.from(m.values())
      .map((item) => ({
        name: item.name,
        docs: item.docs.size,
        quantity: item.quantity,
        value: item.value,
        percentage: (item.value / totalValue) * 100,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [rows])

  const materialConsumption = useMemo(() => {
    const m = new Map<string, { code: string; name: string; quantity: number; value: number; issues: Set<string> }>()
    rows.forEach((x: any) => {
      transactionItems(x).forEach((line: any) => {
        const code = line?.inventoryItem?.code ?? 'NA'
        const prev = m.get(code) ?? {
          code,
          name: line?.inventoryItem?.name ?? '-',
          quantity: 0,
          value: 0,
          issues: new Set<string>(),
        }
        prev.quantity += Math.abs(num(line.quantity))
        prev.value += lineAmount(line)
        prev.issues.add(String(x.id ?? x.transactionNo))
        m.set(code, prev)
      })
    })
    return Array.from(m.values())
      .map((item) => ({ ...item, issueCount: item.issues.size }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [rows])

  const dailyTrend = useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach((x: any) => {
      const key = dateKey(x.transactionDate ?? x.createdAt)
      if (key) m.set(key, (m.get(key) ?? 0) + transactionAmount(x))
    })
    return Array.from(m.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-10)
      .map(([key, value]) => ({ label: key.slice(5), value }))
  }, [rows])

  const monthlyTrend = useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach((x: any) => {
      const key = monthKey(x.transactionDate ?? x.createdAt)
      if (key) m.set(key, (m.get(key) ?? 0) + transactionAmount(x))
    })
    return Array.from(m.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([key, value]) => ({ label: key.slice(5), value }))
  }, [rows])

  const purposeSegments = useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach((x: any) => {
      const key = outboundPurpose(x)
      m.set(key, (m.get(key) ?? 0) + transactionAmount(x))
    })
    const colors = ['#1d7cff', '#14c987', '#f59e0b', '#ef4444']
    return Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], index) => ({
        label: purposeLabel(label),
        value,
        color: colors[index % colors.length],
      }))
  }, [rows])

  const abnormalAlerts = useMemo(() => {
    const materialStats = new Map<string, { qtyTotal: number; valueTotal: number; count: number }>()
    rows.forEach((x: any) => {
      transactionItems(x).forEach((line: any) => {
        const code = line?.inventoryItem?.code ?? 'NA'
        const prev = materialStats.get(code) ?? { qtyTotal: 0, valueTotal: 0, count: 0 }
        prev.qtyTotal += Math.abs(num(line.quantity))
        prev.valueTotal += lineAmount(line)
        prev.count += 1
        materialStats.set(code, prev)
      })
    })
    const alerts: { key: string; material: string; reason: string; quantity: number; value: number }[] = []
    rows.forEach((x: any) => {
      transactionItems(x).forEach((line: any) => {
        const code = line?.inventoryItem?.code ?? 'NA'
        const stats = materialStats.get(code)
        if (!stats || stats.count < 2) return
        const qty = Math.abs(num(line.quantity))
        const value = lineAmount(line)
        const avgQty = stats.qtyTotal / stats.count
        const avgValue = stats.valueTotal / stats.count
        if (qty > avgQty * 1.8 || value > avgValue * 1.8) {
          alerts.push({
            key: `${x.id}-${line.id ?? code}`,
            material: `${code} - ${line?.inventoryItem?.name ?? '-'}`,
            reason: qty > avgQty * 1.8 ? 'Khối lượng vượt nền tiêu thụ' : 'Giá trị vượt nền tiêu thụ',
            quantity: qty,
            value,
          })
        }
      })
    })
    return alerts.sort((a, b) => b.value - a.value).slice(0, 5)
  }, [rows])

    const compactInput =
      'h-9 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-950/65'  
    const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page])
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))

  return (
    <EnterpriseModulePage>
      <InventoryTabWorkspace />

      <div className="space-y-1 -mt-2">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-1">
          <CockpitKpiCard
            title="Tổng xuất trong tháng"
            value={`${formatQuantity(kpis.monthlyQty, 0)} tấn`}
            note="Theo phiếu xuất"
            tone="blue"
            icon={<RefreshCw size={15} />}
            trend={kpiTrend.monthlyQty}
          />
          <CockpitKpiCard
            title="Giá trị xuất trong tháng"
            value={formatCurrency(kpis.monthlyAmount)}
            note="Giá trị đã xuất"
            tone="emerald"
            icon={<CircleDollarSign size={15} />}
            trend={kpiTrend.monthlyAmount}
          />
          <CockpitKpiCard
            title="Giá trị xuất hôm nay"
            value={formatCurrency(kpis.todayAmount)}
            note="Theo ngày hiện tại"
            tone="purple"
            icon={<CircleDollarSign size={15} />}
            trend={kpiTrend.todayAmount}
          />
          <CockpitKpiCard
            title="Số phiếu xuất"
            value={formatQuantity(kpis.docs, 0)}
            note="Trong tháng hiện tại"
            tone="cyan"
            icon={<PackageCheck size={15} />}
            trend={kpiTrend.docs}
          />
          <CockpitKpiCard
            title="Chờ duyệt"
            value={formatQuantity(kpis.pending, 0)}
            note="Cần xử lý"
            tone="amber"
            icon={<TriangleAlert size={15} />}
            trend={kpiTrend.pending}
          />
        </div>

        <InventoryPanel className="rounded-xl">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-[180px_180px_180px_minmax(260px,1fr)_130px_120px]">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={compactInput}
            />
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={compactInput}
            >
              <option value="">Đơn vị nhận</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className={compactInput}
            >
              <option value="">Kho xuất</option>
              {zones.map((z: any) => (
                <option key={z.id} value={z.id}>{z.code}</option>
              ))}
            </select>
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearch()
              }}
              placeholder="Tìm mã phiếu, vật tư, đơn vị nhận..."
              className={compactInput}
            />
            <button
              onClick={applySearch}
              className="h-9 self-end rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
            >
              Tìm kiếm
            </button>
            <button
              onClick={resetFilters}
              className="h-9 self-end rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Làm mới
            </button>
          </div>
        </InventoryPanel>

        <div className={`grid grid-cols-1 xl:grid-cols-12 gap-1.5`}>
          <InventoryPanel
            title={
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-white">
                  Danh sách phiếu xuất
                </h3>

                <button
                  onClick={() => setShowAll(true)}
                  className="text-xs font-medium text-cyan-300 hover:text-cyan-200"
                >
                  Xem tất cả
                </button>
              </div>
            }
            className="xl:col-span-9 p-0"
          >
            <div className="rounded-lg border border-white/10 overflow-hidden">
              <table className="w-full min-w-[1300px] text-sm table-fixed">
                <colgroup>
                  <col className="w-[90px]" /> {/* Mã phiếu */}
                  <col className="w-[140px]" /> {/* Ngày */}
                  <col className="w-[80px]" /> {/* Loại */}
                  <col className="w-[150px]" /> {/* Đơn vị nhận */}
                  <col className="w-[60px]" /> {/* Kho xuất */}
                  <col className="w-[60px]" /> {/* Tổng SL */}
                  <col className="w-[140px]" /> {/* Giá trị */}
                  <col className="w-[60px]" /> {/* Hồ sơ */}
                  <col className="w-[80px]" /> {/* Trạng thái */}
                  <col className="w-[160px]" /> {/* Người tạo */}
                </colgroup>
                <thead
                  className={`${inventoryTableHead}
                    text-slate-300
                    border-b border-cyan-400/10`}
                  style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                >
                  <tr>
                    {['Ngày xuất', 'Mã phiếu xuất', 'Loại xuất', 'Đơn vị nhận', 'Kho xuất', 'Tổng khối lượng', 'Giá trị', 'Hồ sơ', 'Trạng thái', 'Người tạo'].map((h) => (
                      <th key={h} className="px-2 py-2 text-left font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!isLoading &&
                    paged.map((x: any) => {
                      const zoneCodes = transactionZoneCodes(x)
                      return (
                        <tr
                          key={x.id}
                          className={`${inventoryTableRow} cursor-pointer`}
                          onClick={() => setSelectedTransaction(x)}
                        >
                          <td className="px-2 py-1.5">{formatDate(x.transactionDate ?? x.createdAt)}</td>
                          <td className="px-2 py-1.5 text-cyan-300">{x.transactionNo}</td>
                          <td className="px-2 py-1.5">{x.referenceType ?? 'Xuất kho'}</td>
                          <td className="px-2 py-1.5">{transactionProjectName(x)}</td>
                          <td className="px-2 py-1.5">{zoneCodes.length ? zoneCodes.join(', ') : '-'}</td>
                          <td className="px-2 py-1.5">{formatQuantity(transactionQuantity(x), 0)}</td>
                          <td className="px-2 py-1.5">{formatCurrency(transactionAmount(x))}</td>
                          <td className="px-2 py-1.5" onClick={(event) => event.stopPropagation()}>
                            <InventoryTransactionAttachmentButton
                              transaction={x}
                              attachmentMap={attachmentMap}
                              onOpen={(attachments) => setAttachmentDrawer({ transaction: x, attachments })}
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <span className="rounded border border-emerald-700/60 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">{String(x.status ?? 'COMPLETED')}</span>
                          </td>
                          <td className="px-2 py-1.5">{x.createdBy ?? 'Admin'}</td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
            <MaterialsPagination page={page} pageCount={pageCount} total={rows.length} pageSize={pageSize} onPageChange={setPage} />
          </InventoryPanel>

          <div className="space-y-1.5 xl:col-span-3">
            <InventoryChartCard title="Phân bổ xuất theo kho" className="p-2">
              <CompactDonutSummary segments={zoneSegments} centerValue={formatQuantity(kpis.monthlyQty, 0)} centerLabel="tổng xuất" />
            </InventoryChartCard>
            <InventoryChartCard title="Top vật tư xuất" className="p-2">
              <HorizontalBars rows={topMaterials.map((m) => [m.code, m.amount])} valueFormatter={(value) => formatCurrency(value)} />
            </InventoryChartCard>
            <InventoryChartCard title="Top công trình theo giá trị xuất" className="p-2">
              <HorizontalBars rows={topProjects.map((p) => [p.name, p.amount])} valueFormatter={(value) => formatCurrency(value)} />
            </InventoryChartCard>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-1.5 xl:grid-cols-12">
          <InventoryChartCard title="KPI tài chính xuất kho" className="p-3 xl:col-span-4">
            <FinancialKpiRows
              today={kpis.todayAmount}
              week={kpis.weekAmount}
              month={kpis.monthlyAmount}
              year={kpis.yearAmount}
            />
          </InventoryChartCard>

          <InventoryChartCard title="Xu hướng xuất theo ngày" className="p-3 xl:col-span-4">
            <TrendPanel rows={dailyTrend} />
          </InventoryChartCard>

          <InventoryChartCard title="Xu hướng xuất theo tháng" className="p-3 xl:col-span-4">
            <TrendPanel rows={monthlyTrend} />
          </InventoryChartCard>

          <InventoryChartCard title="Tiêu thụ theo công trình" className="p-3 xl:col-span-6">
            <div className="space-y-2">
              {projectConsumption.length ? projectConsumption.map((item) => (
                <div key={item.name} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-slate-100">{item.name}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {formatQuantity(item.docs, 0)} hồ sơ · {formatQuantity(item.quantity, 3)} lượng xuất
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-semibold text-emerald-300">{formatCurrency(item.value)}</div>
                      <div className="text-xs text-cyan-300">{item.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-cyan-400" style={{ width: `${Math.min(100, item.percentage)}%` }} />
                  </div>
                </div>
              )) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-6 text-center text-sm text-slate-500">
                  Chưa có dữ liệu xuất theo công trình.
                </div>
              )}
            </div>
          </InventoryChartCard>

          <InventoryChartCard title="Tiêu thụ theo vật tư" className="p-3 xl:col-span-6">
            <div className="overflow-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[620px] text-sm">
                <thead className={inventoryTableHead}>
                  <tr>
                    {['Mã vật tư', 'Khối lượng', 'Giá trị', 'Số lần xuất'].map((header) => (
                      <th key={header} className="px-3 py-2 text-left font-medium">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {materialConsumption.length ? materialConsumption.map((item) => (
                    <tr key={item.code} className="border-t border-white/10 text-slate-300">
                      <td className="px-3 py-2">
                        <div className="font-medium text-cyan-300">{item.code}</div>
                        <div className="truncate text-xs text-slate-500">{item.name}</div>
                      </td>
                      <td className="px-3 py-2">{formatQuantity(item.quantity, 3)}</td>
                      <td className="px-3 py-2 font-semibold text-emerald-300">{formatCurrency(item.value)}</td>
                      <td className="px-3 py-2">{formatQuantity(item.issueCount, 0)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-sm text-slate-500">Chưa có dữ liệu vật tư xuất.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </InventoryChartCard>

          <InventoryChartCard title="Mục đích xuất kho" className="p-3 xl:col-span-5">
            <CompactDonutSummary
              segments={purposeSegments}
              centerValue={formatCurrency(sumTransactionAmount(rows))}
              centerLabel="tổng giá trị"
            />
          </InventoryChartCard>

          <InventoryChartCard title="Cảnh báo tiêu thụ bất thường" className="p-3 xl:col-span-7">
            <div className="space-y-2">
              {abnormalAlerts.length ? abnormalAlerts.map((alert) => (
                <div key={alert.key} className="flex items-start justify-between gap-3 rounded-xl border border-amber-400/20 bg-amber-500/[0.055] p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <TriangleAlert size={15} className="text-amber-300" />
                      <span className="truncate font-medium text-slate-100">{alert.material}</span>
                    </div>
                    <div className="mt-1 text-xs text-amber-200/80">{alert.reason}</div>
                  </div>
                  <div className="shrink-0 text-right text-xs">
                    <div className="font-semibold text-white">{formatQuantity(alert.quantity, 3)}</div>
                    <div className="mt-1 text-emerald-300">{formatCurrency(alert.value)}</div>
                  </div>
                </div>
              )) : (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-500/[0.045] p-6 text-sm text-emerald-200">
                  <Target size={16} />
                  Chưa phát hiện tiêu thụ bất thường trong bộ lọc hiện tại.
                </div>
              )}
            </div>
          </InventoryChartCard>
        </div>
      </div>
      <InventoryTransactionAttachmentDrawer
        open={Boolean(attachmentDrawer)}
        transaction={attachmentDrawer?.transaction}
        attachments={attachmentDrawer?.attachments ?? []}
        onClose={() => setAttachmentDrawer(null)}
      />
      {selectedTransaction ? (
        <OutboundTransactionDetailDrawer
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      ) : null}
    </EnterpriseModulePage>
  )
}
