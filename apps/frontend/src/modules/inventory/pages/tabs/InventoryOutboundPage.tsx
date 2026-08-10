import { useMemo, useState } from 'react'
import { CircleDollarSign, PackageCheck, RefreshCw, Target, TriangleAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import { CockpitKpiCard, CockpitTableShell, DataTablePagination } from '../../../../shared/ui/cockpit'
import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import {
  ModuleDetailDrawer,
  ModuleFilterBar,
  ModuleLoadingState,
  ModuleEmptyState,
} from '../../../../shared/ui/modules'
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
import { useProjects } from '../../hooks/useProjects'
import { useZones } from '../../hooks/useZones'
import { formatCurrencyVnd, formatQuantity } from '@/shared/utils/number-format'
import {
  InventoryTransactionAttachmentButton,
  InventoryTransactionAttachmentDrawer,
  useInventoryTransactionAttachmentMap,
} from '../../components/InventoryAttachmentPanel'
import { OutboundTransactionModal } from '../../components/InventoryTransactionModals'

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
  const { data: tx = [], isLoading, refetch } = useInventoryTransactions({ type: 'OUTBOUND' })
  const [showAll, setShowAll] = useState(false);
  const [date, setDate] = useState('')
  const [projectId, setProjectId] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [attachmentDrawer, setAttachmentDrawer] = useState<{ transaction: any; attachments: any[] } | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null)
  const pageSize = 11
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
        if (projectId && String(x.projectId ?? '') !== projectId) return false
        if (zoneId && !transactionItems(x).some((line: any) => String(line?.zoneId ?? '') === zoneId)) return false
        if (statusFilter && String(x.status ?? 'COMPLETED') !== statusFilter) return false
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
  }, [tx, date, projectId, zoneId, statusFilter, search])

  const kpis = useMemo(() => {
    const now = new Date()
    const todayKey = now.toISOString().slice(0, 10)
    const todayRows = rows.filter((x: any) => String(x.transactionDate ?? x.createdAt).slice(0, 10) === todayKey)
    const pendingRows = rows.filter((x: any) => String(x.status ?? '').toUpperCase() === 'PENDING')
    const productionRows = rows.filter((x: any) => x.type === 'TRANSFER' || String(x.remarks ?? '').includes('[COMPONENT_PRODUCTION]'))
    const projectRows = rows.filter((x: any) => x.type === 'OUTBOUND' || String(x.remarks ?? '').includes('[PROJECT]'))

    return {
      docsToday: todayRows.length,
      amountToday: sumTransactionAmount(todayRows),
      pending: pendingRows.length,
      productionAmount: sumTransactionAmount(productionRows),
      productionDocs: productionRows.length,
      projectAmount: sumTransactionAmount(projectRows),
      projectDocs: projectRows.length,
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
      const pending = inMonth.filter((x: any) => String(x.status ?? '').toUpperCase() === 'PENDING')
      const production = inMonth.filter((x: any) => x.type === 'TRANSFER' || String(x.remarks ?? '').includes('[COMPONENT_PRODUCTION]'))
      const project = inMonth.filter((x: any) => x.type === 'OUTBOUND' || String(x.remarks ?? '').includes('[PROJECT]'))

      return {
        docsToday: todayRows.length,
        amountToday: sumTransactionAmount(todayRows),
        pending: pending.length,
        productionAmount: sumTransactionAmount(production),
        projectAmount: sumTransactionAmount(project),
      }
    })

    return {
      docsToday: monthData.map((d) => d.docsToday),
      amountToday: monthData.map((d) => d.amountToday),
      pending: monthData.map((d) => d.pending),
      productionAmount: monthData.map((d) => d.productionAmount),
      projectAmount: monthData.map((d) => d.projectAmount),
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

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page])

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))

  const compactInput =
    'h-9 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-xs text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-950/65'

  return (
    <EnterpriseModulePage>
      <div className="space-y-2 text-xs -mt-2">
        {/* KPI Section */}
        <div className="grid grid-cols-1 gap-1 md:grid-cols-5">
          <CockpitKpiCard
            className="!h-[92px] !p-3"
            title="Phiếu xuất hôm nay"
            value={formatQuantity(kpis.docsToday, 0)}
            note="Số lượng chứng từ hôm nay"
            tone="cyan"
            trend={kpiTrend.docsToday}
          />
          <CockpitKpiCard
            className="!h-[92px] !p-3"
            title="Giá trị xuất hôm nay"
            value={formatCurrency(kpis.amountToday)}
            note="Giá trị đã bàn giao hôm nay"
            tone="purple"
            trend={kpiTrend.amountToday}
          />
          <CockpitKpiCard
            className="!h-[92px] !p-3"
            title="Chờ xử lý"
            value={formatQuantity(kpis.pending, 0)}
            note="Phiếu đang đợi phê duyệt"
            tone="amber"
            trend={kpiTrend.pending}
          />
          <CockpitKpiCard
            className="!h-[92px] !p-3"
            title="Xuất cho sản xuất"
            value={formatCurrency(kpis.productionAmount)}
            note={`${formatQuantity(kpis.productionDocs, 0)} phiếu xuất`}
            tone="blue"
            trend={kpiTrend.productionAmount}
          />
          <CockpitKpiCard
            className="!h-[92px] !p-3"
            title="Xuất cho công trình"
            value={formatCurrency(kpis.projectAmount)}
            note={`${formatQuantity(kpis.projectDocs, 0)} phiếu xuất`}
            tone="emerald"
            trend={kpiTrend.projectAmount}
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
                  placeholder="Mã phiếu, vật tư, công trình..."
                  className={compactInput}
                />
              </div>
              <div className="col-span-12 md:col-span-3 xl:col-span-2">
                <select
                  value={zoneId}
                  onChange={(e) => {
                    setZoneId(e.target.value)
                    setPage(1)
                  }}
                  className={compactInput}
                >
                  <option value="">Kho xuất</option>
                  {zones.map((z: any) => (
                    <option key={z.id} value={z.id}>
                      {z.code}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-12 md:col-span-3 xl:col-span-2">
                <select
                  value={projectId}
                  onChange={(e) => {
                    setProjectId(e.target.value)
                    setPage(1)
                  }}
                  className={compactInput}
                >
                  <option value="">Đơn vị nhận</option>
                  {projects.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-12 md:col-span-3 xl:col-span-2">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setPage(1)
                  }}
                  className={compactInput}
                >
                  <option value="">Trạng thái</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>
              <div className="col-span-12 md:col-span-3 xl:col-span-2">
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
              <div className="col-span-12 xl:col-span-1 flex gap-1">
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
                toast.success('Đã tải lại danh sách phiếu xuất')
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
            <button
              onClick={() => setCreateOpen(true)}
              className="h-9 rounded-lg bg-blue-600 px-4 font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20"
            >
              + Tạo phiếu xuất
            </button>
          </div>
        </div>

        {/* Loading state / Content table */}
        {isLoading ? (
          <ModuleLoadingState label="Đang tải danh sách phiếu xuất kho..." variant="table" />
        ) : rows.length === 0 ? (
          <ModuleEmptyState
            title="Không tìm thấy phiếu xuất"
            description="Không có giao dịch xuất kho nào khớp với điều kiện lọc hiện tại."
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
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-1.5 -mt-1">
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
              className="xl:col-span-9"
            >
                <div className="rounded-lg border border-white/10 overflow-hidden h-[430px]">
                <table className="w-full min-w-[1220px] text-xs table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[100px]" />
                    <col className="w-[120px]" />
                    <col className="w-[90px]" />
                    <col className="w-[130px]" />
                    <col className="w-[120px]" />
                    <col className="w-[120px]" />
                    <col className="w-[140px]" />
                    <col className="w-[80px]" />
                    <col className="w-[60px]" />
                    <col className="w-[140px]" />
                  </colgroup>
                  <thead
                    className={`${inventoryTableHead}
                      text-slate-300
                      border-b border-cyan-400/10`}
                    style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                  >
                    <tr>
                      {['Ngày Xuất', 'Mã Phiếu Xuất', 'Loại Xuất', 'Đơn Vị Nhận', 'Kho Xuất', 'Khối Lượng', 'Giá Trị', 'Hồ Sơ', 'SL Mã', 'Người Tạo'].map((h) => (
                        <th key={h} className="px-4 py-2 text-left font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((x: any) => {
                      const zoneCodes = transactionZoneCodes(x)
                      const isPending = String(x.status ?? '').toUpperCase() === 'PENDING'
                      return (
                        <tr
                          key={x.id}
                          className="border-t border-cyan-300/10 text-slate-200 transition hover:bg-cyan-500/5 hover:text-cyan-300 cursor-pointer"
                          onClick={() => setSelectedTransaction(x)}
                        >
                          <td className="px-2.5 py-1">{formatDate(x.transactionDate ?? x.createdAt)}</td>
                          <td className="px-2.5 py-1 text-cyan-300 font-semibold">{x.transactionNo}</td>
                          <td className="px-2.5 py-1">
                            {x.type === 'TRANSFER' ? (
                              <span className="text-blue-400 font-medium">Điều chuyển</span>
                            ) : (
                              <span className="text-slate-300">Xuất kho</span>
                            )}
                          </td>
                          <td className="px-2.5 py-1 truncate">{transactionProjectName(x)}</td>
                          <td className="px-2.5 py-1 truncate">{zoneCodes.length ? zoneCodes.join(', ') : '-'}</td>
                          <td className="px-2.5 py-1 font-medium">{formatQuantity(transactionQuantity(x), 0)} tấn</td>
                          <td className="px-2.5 py-1 font-bold text-emerald-400">{formatCurrency(transactionAmount(x))}</td>
                          <td className="px-2.5 py-1" onClick={(event) => event.stopPropagation()}>
                            <InventoryTransactionAttachmentButton
                              transaction={x}
                              attachmentMap={attachmentMap}
                              onOpen={(attachments) => setAttachmentDrawer({ transaction: x, attachments })}
                            />
                          </td>
                          <td className="px-2.5 py-1 text-center font-semibold text-cyan-300">
                            {new Set(
                              transactionItems(x).map((line: any) => line.inventoryItemId)
                            ).size}
                          </td>
                          <td className="px-2.5 py-1 text-slate-400">{transactionActor(x)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
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
              <InventoryChartCard title="Phân bổ xuất theo kho" className="p-2">
                <CompactDonutSummary segments={zoneSegments} centerValue={formatQuantity(kpis.docsToday + kpis.pending, 0)} centerLabel="phiếu xuất" />
              </InventoryChartCard>
              <InventoryChartCard title="Top vật tư xuất" className="p-2">
                <HorizontalBars rows={topMaterials.map((m) => [m.code, m.amount])} valueFormatter={(value) => formatCurrency(value)} />
              </InventoryChartCard>
              <InventoryChartCard title="Top công trình theo giá trị xuất" className="p-2">
                <HorizontalBars rows={topProjects.map((p) => [p.name, p.amount])} valueFormatter={(value) => formatCurrency(value)} />
              </InventoryChartCard>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-1.5 xl:grid-cols-12 -mt-1">
          <InventoryChartCard title="KPI tài chính xuất kho" className="p-3 xl:col-span-4">
            <FinancialKpiRows
              today={kpis.amountToday}
              week={kpis.amountToday} // hoặc tuần nếu có cách tính chính xác hơn
              month={kpis.projectAmount + kpis.productionAmount}
              year={kpis.projectAmount + kpis.productionAmount}
            />
          </InventoryChartCard>

          <InventoryChartCard title="Xu hướng xuất theo ngày" className="p-3 xl:col-span-4">
            <TrendPanel rows={dailyTrend} />
          </InventoryChartCard>

          <InventoryChartCard title="Xu hướng xuất theo tháng" className="p-3 xl:col-span-4">
            <TrendPanel rows={monthlyTrend} />
          </InventoryChartCard>

          <InventoryChartCard title="Tiêu thụ theo công trình" className="p-3 xl:col-span-6 -mt-0.5">
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

          <InventoryChartCard title="Tiêu thụ theo vật tư" className="p-3 xl:col-span-6 -mt-0.5">
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

          <InventoryChartCard title="Mục đích xuất kho" className="p-3 xl:col-span-5 -mt-0.5">
            <CompactDonutSummary
              segments={purposeSegments}
              centerValue={formatCurrency(sumTransactionAmount(rows))}
              centerLabel="tổng giá trị"
            />
          </InventoryChartCard>

          <InventoryChartCard title="Cảnh báo tiêu thụ bất thường" className="p-3 xl:col-span-7 -mt-0.5">
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
      {showAll && (
        <div role="dialog" aria-modal="true" aria-label="Danh sách phiếu xuất" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
          <div className="max-h-[90vh] w-full max-w-[95vw] flex flex-col rounded-xl border border-white/10 bg-[#0b1424]/95 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">

            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Tổng danh sách phiếu xuất ({rows.length} phiếu)
              </h3>

              <button
                onClick={() => setShowAll(false)}
                className="rounded border border-white/10 bg-white/5 px-3 py-1 text-slate-300 hover:text-white"
              >
                Đóng
              </button>
            </div>

            <div className="flex-1 min-h-[550px] overflow-y-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[1220px] text-xs table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[100px]" />
                    <col className="w-[160px]" />
                    <col className="w-[100px]" />
                    <col className="w-[120px]" />
                    <col className="w-[100px]" />
                    <col className="w-[120px]" />
                    <col className="w-[140px]" />
                    <col className="w-[80px]" />
                    <col className="w-[100px]" />
                    <col className="w-[140px]" />
                  </colgroup>
                   <thead
                    className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10`}
                    style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                  >
                    <tr className="font-semibold uppercase">
                      {['Ngày xuất', 'Mã phiếu xuất', 'Loại xuất', 'Đơn vị nhận', 'Kho xuất', 'Khối lượng', 'Giá trị', 'Hồ sơ', 'SL mã vật tư', 'Người tạo'].map((h) => (
                        <th key={h} className="px-4 py-2 text-left font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((x: any) => {
                      const zoneCodes = transactionZoneCodes(x)
                      const isPending = String(x.status ?? '').toUpperCase() === 'PENDING'
                      return (
                        <tr
                          key={x.id}
                          className="border-t border-cyan-300/10 text-slate-200 transition hover:bg-cyan-500/5 hover:text-cyan-300 cursor-pointer"
                          onClick={() => setSelectedTransaction(x)}
                        >
                          <td className="px-4 py-2.5">{formatDate(x.transactionDate ?? x.createdAt)}</td>
                          <td className="px-4 py-2.5 text-cyan-300 font-semibold">{x.transactionNo}</td>
                          <td className="px-4 py-2.5">
                            {x.type === 'TRANSFER' ? (
                              <span className="text-blue-400 font-medium">Điều chuyển</span>
                            ) : (
                              <span className="text-slate-300">Xuất kho</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 truncate">{transactionProjectName(x)}</td>
                          <td className="px-4 py-2.5">{zoneCodes.length ? zoneCodes.join(', ') : '-'}</td>
                          <td className="px-4 py-2.5 font-medium">{formatQuantity(transactionQuantity(x), 0)} tấn</td>
                          <td className="px-4 py-2.5 font-bold text-emerald-400">{formatCurrency(transactionAmount(x))}</td>
                          <td className="px-4 py-2.5" onClick={(event) => event.stopPropagation()}>
                            <InventoryTransactionAttachmentButton
                              transaction={x}
                              attachmentMap={attachmentMap}
                              onOpen={(attachments) => setAttachmentDrawer({ transaction: x, attachments })}
                            />
                          </td>
                          <td className="px-4 py-2.5 text-center font-medium text-cyan-300">
                            {transactionItems(x).length}
                          </td>
                          <td className="px-4 py-2.5 text-slate-400">{transactionActor(x)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
               <div className="flex-none pt-2">
                <InventoryPagination
                  page={page}
                  pageCount={pageCount}
                  total={rows.length}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  containerClassName="grid grid-cols-1 items-center gap-2 px-4 py-1 text-xs text-slate-400 md:grid-cols-3 border-t-0"
                />
          </div>
        </div>
      </div>
      )}

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

      <OutboundTransactionModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </EnterpriseModulePage>
  )
}
