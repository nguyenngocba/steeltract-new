import { useMemo, useState } from 'react'
import { CircleDollarSign, RefreshCw, ShieldX, TriangleAlert, ClipboardList } from 'lucide-react'

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

function transactionItems(tx: any) {
  return Array.isArray(tx?.items) ? tx.items : []
}

function lineQuantity(line: any) {
  return num(line?.quantity)
}

function lineUnitPrice(line: any) {
  const explicit = num(line?.unitPrice)
  if (explicit) return explicit
  const quantity = Math.abs(lineQuantity(line))
  const amount = Math.abs(num(line?.totalAmount))
  return quantity > 0 ? amount / quantity : 0
}

function varianceValue(line: any) {
  const explicit = Math.abs(num(line?.totalAmount))
  if (explicit) return explicit
  return Math.abs(lineQuantity(line)) * lineUnitPrice(line)
}

function sessionVarianceQuantity(tx: any) {
  return transactionItems(tx).reduce((sum: number, line: any) => sum + lineQuantity(line), 0)
}

function sessionVarianceValue(tx: any) {
  return transactionItems(tx).reduce((sum: number, line: any) => sum + varianceValue(line), 0)
}

function sessionZoneCodes(tx: any) {
  const codes = transactionItems(tx)
    .map((line: any) => line?.zone?.code)
    .filter(Boolean)
  return Array.from(new Set(codes))
}

function materialCode(line: any) {
  return line?.inventoryItem?.code ?? line?.materialCode ?? '-'
}

function materialName(line: any) {
  return line?.inventoryItem?.name ?? line?.materialName ?? '-'
}

function lineUnit(line: any) {
  return line?.unit?.symbol ?? line?.unit?.code ?? line?.inventoryItem?.unit ?? '-'
}

function systemQty(line: any) {
  const candidates = [line?.systemQty, line?.expectedQty, line?.beforeQty, line?.bookQty]
  const value = candidates.find((candidate) => candidate !== undefined && candidate !== null)
  return value === undefined ? null : num(value)
}

function actualQty(line: any) {
  const candidates = [line?.actualQty, line?.countedQty, line?.afterQty]
  const value = candidates.find((candidate) => candidate !== undefined && candidate !== null)
  const system = systemQty(line)
  if (value !== undefined) return num(value)
  if (system !== null) return system + lineQuantity(line)
  return null
}

function StockTakeDetailDrawer({
  session,
  onClose,
}: {
  session: any | null
  onClose: () => void
}) {
  const items = transactionItems(session)
  return (
    <ModuleDetailDrawer
      open={Boolean(session)}
      title={session?.transactionNo ?? 'Chi tiết kiểm kê'}
      subtitle="Phiên kiểm kê và chênh lệch vật tư"
      onClose={onClose}
      widthClass="max-w-6xl"
    >
      {session ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-cyan-300/15 bg-cyan-400/[0.055] p-3">
              <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Dòng kiểm kê</div>
              <div className="mt-2 text-2xl font-semibold text-white">{formatQuantity(items.length, 0)}</div>
            </div>
            <div className="rounded-xl border border-amber-300/15 bg-amber-400/[0.055] p-3">
              <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Chênh lệch lượng</div>
              <div className="mt-2 text-2xl font-semibold text-white">{formatQuantity(sessionVarianceQuantity(session), 3)}</div>
            </div>
            <div className="rounded-xl border border-red-300/15 bg-red-400/[0.055] p-3">
              <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Giá trị chênh lệch</div>
              <div className="mt-2 text-2xl font-semibold text-white">{formatCurrency(sessionVarianceValue(session))}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Kho / khu vực</div>
              <div className="mt-2 truncate text-2xl font-semibold text-white">{sessionZoneCodes(session).join(', ') || '-'}</div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="grid gap-2 text-sm md:grid-cols-2">
              <InfoLine label="Mã kiểm kê" value={session.transactionNo ?? '-'} />
              <InfoLine label="Ngày kiểm kê" value={formatDate(session.transactionDate ?? session.createdAt)} />
              <InfoLine label="Phương pháp" value={session.referenceType ?? 'Định kỳ'} />
              <InfoLine label="Trạng thái" value={String(session.status ?? 'COMPLETED')} />
              <InfoLine label="Người tạo" value={session.createdBy ?? 'Admin'} />
              <InfoLine label="Ghi chú" value={session.remarks ?? session.note ?? '-'} />
            </div>
          </div>

          <div className="overflow-auto rounded-xl border border-white/10 bg-slate-950/35">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className={inventoryTableHead}>
                <tr>
                  {['Material', 'SystemQty', 'ActualQty', 'VarianceQty', 'UnitPrice', 'VarianceValue'].map((header) => (
                    <th key={header} className="px-3 py-2 text-left font-medium">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.length ? items.map((line: any) => {
                  const sys = systemQty(line)
                  const actual = actualQty(line)
                  const variance = lineQuantity(line)
                  return (
                    <tr key={line.id ?? `${line.inventoryItemId}-${line.quantity}`} className="border-t border-white/10 text-slate-300">
                      <td className="px-3 py-2">
                        <div className="font-medium text-cyan-300">{materialCode(line)}</div>
                        <div className="truncate text-xs text-slate-500">{materialName(line)}</div>
                      </td>
                      <td className="px-3 py-2">{sys === null ? '-' : `${formatQuantity(sys, 3)} ${lineUnit(line)}`}</td>
                      <td className="px-3 py-2">{actual === null ? '-' : `${formatQuantity(actual, 3)} ${lineUnit(line)}`}</td>
                      <td className={`px-3 py-2 font-semibold ${variance >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{formatQuantity(variance, 3)}</td>
                      <td className="px-3 py-2">{formatCurrency(lineUnitPrice(line))}</td>
                      <td className="px-3 py-2 font-semibold text-amber-300">{formatCurrency(varianceValue(line))}</td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-sm text-slate-500">
                      Phiên kiểm kê chưa có dòng vật tư.
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

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 truncate text-sm font-medium text-slate-100">{value}</div>
    </div>
  )
}

export function InventoryStockTakePage() {
  const { data: zones = [] } = useZones()
  const { data: adjustments = [] } = useInventoryTransactions({ type: 'ADJUSTMENT' })

  const [date, setDate] = useState('')
  const [zoneFilter, setZoneFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [page, setPage] = useState(1)
  const [attachmentDrawer, setAttachmentDrawer] = useState<{ transaction: any; attachments: any[] } | null>(null)
  const [selectedSession, setSelectedSession] = useState<any | null>(null)
  const pageSize = 10
  const attachmentMap = useInventoryTransactionAttachmentMap()
  // State cho tìm kiếm
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')

  // Áp dụng tìm kiếm
  const applySearch = () => {
    setSearch(searchDraft)
    setPage(1)
  }

  // Reset toàn bộ bộ lọc
  const resetFilters = () => {
    setSearchDraft('')
    setSearch('')
    setDate('')
    setZoneFilter('')
    setStatusFilter('')
    setMethodFilter('')
    setPage(1)
  }

  const rows = useMemo(() => {
    return (adjustments as any[])
      .filter((x: any) => {
        if (date) {
          const d = new Date(x.transactionDate ?? x.createdAt).toISOString().slice(0, 10)
          if (d !== date) return false
        }
        if (zoneFilter && !transactionItems(x).some((line: any) => String(line?.zoneId ?? '') === zoneFilter)) return false
        if (statusFilter && String(x.status ?? 'COMPLETED').toUpperCase() !== statusFilter) return false
        if (methodFilter && String(x.referenceType ?? '') !== methodFilter) return false
        return true
      })
      .sort((a: any, b: any) => +new Date(b.transactionDate ?? b.createdAt) - +new Date(a.transactionDate ?? a.createdAt))
  }, [adjustments, date, zoneFilter, statusFilter, methodFilter])

  const metrics = useMemo(() => {
    const total = rows.length
    const pending = rows.filter((x: any) => String(x.status ?? '').toUpperCase() === 'PENDING').length
    const varianceLines = rows.flatMap((x: any) => transactionItems(x)).filter((line: any) => Math.abs(lineQuantity(line)) > 0)
    const varianceMaterials = new Set(varianceLines.map((line: any) => line?.inventoryItemId ?? materialCode(line))).size
    const mismatch = rows.filter((x: any) => Math.abs(sessionVarianceQuantity(x)) > 0).length
    const matched = Math.max(0, total - mismatch)
    const accuracy = total === 0 ? 100 : (matched / total) * 100
    const varianceValue = rows.reduce((s: number, x: any) => s + sessionVarianceValue(x), 0)
    return { total, pending, matched, mismatch, accuracy, varianceValue, varianceMaterials }
  }, [rows])

  const discrepancyByZone = useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach((x: any) => {
      transactionItems(x).forEach((line: any) => {
        const key = line?.zone?.code ?? 'NA'
        m.set(key, (m.get(key) ?? 0) + Math.abs(lineQuantity(line)))
      })
    })
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [rows])

  const methodDist = useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach((x: any) => {
      const key = x.referenceType ?? 'Định kỳ'
      m.set(key, (m.get(key) ?? 0) + 1)
    })
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [rows])

  const accuracySegments = useMemo(() => [
    { label: 'Khớp', value: metrics.matched, color: '#14c987' },
    { label: 'Chênh lệch', value: metrics.mismatch, color: '#f59e0b' },
  ], [metrics.matched, metrics.mismatch])

  const topVarianceMaterials = useMemo(() => {
    const m = new Map<string, { code: string; name: string; quantity: number; value: number }>()
    rows.forEach((x: any) => {
      transactionItems(x).forEach((line: any) => {
        const code = materialCode(line)
        const prev = m.get(code) ?? { code, name: materialName(line), quantity: 0, value: 0 }
        prev.quantity += Math.abs(lineQuantity(line))
        prev.value += varianceValue(line)
        m.set(code, prev)
      })
    })
    return Array.from(m.values()).sort((a, b) => b.value - a.value).slice(0, 6)
  }, [rows])

  const topVarianceLocations = useMemo(() => {
    const m = new Map<string, { location: string; quantity: number; value: number }>()
    rows.forEach((x: any) => {
      transactionItems(x).forEach((line: any) => {
        const location = [line?.warehouse?.name ?? line?.warehouse?.code, line?.zone?.code, line?.slot?.code, line?.level]
          .filter(Boolean)
          .join(' / ') || 'NA'
        const prev = m.get(location) ?? { location, quantity: 0, value: 0 }
        prev.quantity += Math.abs(lineQuantity(line))
        prev.value += varianceValue(line)
        m.set(location, prev)
      })
    })
    return Array.from(m.values()).sort((a, b) => b.value - a.value).slice(0, 6)
  }, [rows])

  const adjustmentPreview = useMemo(() => {
    return rows
      .flatMap((x: any) => transactionItems(x).map((line: any) => ({
        key: `${x.id}-${line.id ?? materialCode(line)}`,
        transactionNo: x.transactionNo,
        material: `${materialCode(line)} - ${materialName(line)}`,
        quantity: lineQuantity(line),
        value: varianceValue(line),
      })))
      .filter((line: any) => Math.abs(line.quantity) > 0)
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 8)
  }, [rows])
  const filterInput =
  'h-9 w-full rounded-md border border-white/10 bg-slate-950/45 px-2 text-xs text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-950/65'

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page])
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))

  return (
    <EnterpriseModulePage>
      <InventoryTabWorkspace />

      <div className="space-y-1 -mt-2">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-1.5">
          <OverviewMetricCard
            title="Total Sessions"
            value={formatQuantity(metrics.total, 0)}
            note="Tổng phiếu"
            tone="blue"
            icon={<ClipboardList size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="Pending Approval"
            value={formatQuantity(metrics.pending, 0)}
            note="Chờ xử lý"
            tone="amber"
            icon={<ShieldX size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="Variance Materials"
            value={formatQuantity(metrics.varianceMaterials, 0)}
            note="Có chênh lệch"
            tone="cyan"
            icon={<TriangleAlert size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="Độ chính xác"
            value={`${metrics.accuracy.toFixed(2)}%`}
            note="Theo phiếu kiểm kê"
            tone="cyan"
            icon={<RefreshCw size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="Variance Value"
            value={formatCurrency(metrics.varianceValue)}
            note="Theo giá trị tồn"
            tone="red"
            icon={<CircleDollarSign size={15} />}
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
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className={filterInput}
            >
              <option value="">Kho</option>
              {zones.map((z: any) => (
                <option key={z.id} value={z.id}>{z.code}</option>
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
            </select>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className={filterInput}
            >
              <option value="">Phương pháp</option>
              <option value="Định kỳ">Định kỳ</option>
              <option value="Bất thường">Bất thường</option>
              <option value="Kiểm kê theo khu vực">Kiểm kê theo khu vực</option>
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
          <InventoryPanel title="Danh sách phiếu kiểm kê" className="xl:col-span-9 p-0">
            <div className={`${inventoryTableShell} overflow-auto`}>
              <table className="w-full min-w-[1100px] text-sm">
                <thead className={inventoryTableHead}>
                  <tr>
                    {['Mã kiểm kê', 'Kho', 'Phương pháp', 'Ngày', 'Người tạo', 'Trạng thái', 'Chênh lệch', 'Độ chính xác', 'Hồ sơ'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((x: any) => (
                    <tr key={x.id} className={`${inventoryTableRow} cursor-pointer`} onClick={() => setSelectedSession(x)}>
                      <td className="px-3 py-1.5 text-cyan-300">{x.transactionNo}</td>
                      <td className="px-3 py-1.5">{sessionZoneCodes(x).join(', ') || '-'}</td>
                      <td className="px-3 py-1.5">{x.referenceType ?? 'Định kỳ'}</td>
                      <td className="px-3 py-1.5">{formatDate(x.transactionDate ?? x.createdAt)}</td>
                      <td className="px-3 py-1.5">{x.createdBy ?? 'Admin'}</td>
                      <td className="px-3 py-1.5">
                        <span className={`rounded border px-2 py-0.5 text-xs ${
                          String(x.status ?? 'COMPLETED').toUpperCase() === 'COMPLETED'
                            ? 'border-emerald-700/60 bg-emerald-500/10 text-emerald-300'
                            : 'border-amber-700/60 bg-amber-500/10 text-amber-300'
                        }`}>
                          {String(x.status ?? 'COMPLETED')}
                        </span>
                      </td>
                      <td className={`px-3 py-1.5 ${sessionVarianceQuantity(x) >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                        {formatQuantity(sessionVarianceQuantity(x), 3)}
                      </td>
                      <td className="px-3 py-1.5">{metrics.accuracy.toFixed(2)}%</td>
                      <td className="px-3 py-1.5" onClick={(event) => event.stopPropagation()}>
                        <InventoryTransactionAttachmentButton
                          transaction={x}
                          attachmentMap={attachmentMap}
                          onOpen={(attachments) => setAttachmentDrawer({ transaction: x, attachments })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <MaterialsPagination page={page} pageCount={pageCount} total={rows.length} pageSize={pageSize} onPageChange={setPage} />
          </InventoryPanel>

          <div className="space-y-1.5 xl:col-span-3">
            <InventoryChartCard title="Độ chính xác kiểm kê" className="p-2">
              <CompactDonutSummary segments={accuracySegments} centerValue={`${metrics.accuracy.toFixed(1)}%`} centerLabel="chính xác" />
            </InventoryChartCard>
            <InventoryChartCard title="Chênh lệch theo kho" className="p-2">
              <HorizontalBars rows={discrepancyByZone} valueFormatter={(value) => formatQuantity(value, 0)} />
            </InventoryChartCard>
            <InventoryChartCard title="Phương pháp kiểm kê" className="p-2">
              <HorizontalBars rows={methodDist} valueFormatter={(value) => formatQuantity(value, 0)} />
            </InventoryChartCard>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-1.5 xl:grid-cols-12">
          <InventoryChartCard title="Top vật tư chênh lệch" className="p-3 xl:col-span-4">
            <div className="space-y-2">
              {topVarianceMaterials.length ? topVarianceMaterials.map((item) => (
                <div key={item.code} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-cyan-300">{item.code}</div>
                      <div className="truncate text-xs text-slate-500">{item.name}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-semibold text-amber-300">{formatCurrency(item.value)}</div>
                      <div className="text-xs text-slate-500">{formatQuantity(item.quantity, 3)}</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-6 text-center text-sm text-slate-500">
                  Chưa có vật tư chênh lệch.
                </div>
              )}
            </div>
          </InventoryChartCard>

          <InventoryChartCard title="Top vị trí chênh lệch" className="p-3 xl:col-span-4">
            <div className="space-y-2">
              {topVarianceLocations.length ? topVarianceLocations.map((item) => (
                <div key={item.location} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-slate-100">{item.location}</div>
                      <div className="mt-1 text-xs text-slate-500">{formatQuantity(item.quantity, 3)} chênh lệch</div>
                    </div>
                    <div className="shrink-0 font-semibold text-amber-300">{formatCurrency(item.value)}</div>
                  </div>
                </div>
              )) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-6 text-center text-sm text-slate-500">
                  Chưa có vị trí chênh lệch.
                </div>
              )}
            </div>
          </InventoryChartCard>

          <InventoryChartCard title="Adjustment preview" className="p-3 xl:col-span-4">
            <div className="space-y-2">
              {adjustmentPreview.length ? adjustmentPreview.map((line: any) => (
                <div key={line.key} className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-100">{line.material}</div>
                    <div className="mt-1 text-xs text-slate-500">{line.transactionNo}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={`font-semibold ${line.quantity >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                      {line.quantity >= 0 ? '+' : ''}{formatQuantity(line.quantity, 3)}
                    </div>
                    <div className="mt-1 text-xs text-amber-300">{formatCurrency(line.value)}</div>
                  </div>
                </div>
              )) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-6 text-center text-sm text-slate-500">
                  Chưa có điều chỉnh chênh lệch để xem trước.
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
      <StockTakeDetailDrawer
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </EnterpriseModulePage>
  )
}
