import { useMemo, useState } from 'react'
import { CircleDollarSign, PackageCheck, RefreshCw, ShieldX, TriangleAlert } from 'lucide-react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
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

function transactionItems(tx: any) {
  return Array.isArray(tx.items) ? tx.items : []
}

function transactionQuantity(tx: any) {
  return transactionItems(tx).reduce(
    (sum: number, line: any) =>
      sum + Math.abs(num(line.quantity)),
    0,
  )
}

function lineAmount(line: any) {
  const quantity = Math.abs(num(line.quantity))
  const totalAmount = num(line.totalAmount)
  if (totalAmount) return Math.abs(totalAmount)
  return quantity * num(line.unitPrice)
}

function transactionAmount(tx: any) {
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

export function InventoryOutboundPage() {
  const { data: projects = [] } = useProjects()
  const { data: zones = [] } = useZones()
  const { data: tx = [], isLoading } = useInventoryTransactions({ type: 'OUTBOUND' })

  const [date, setDate] = useState('')
  const [projectId, setProjectId] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [attachmentDrawer, setAttachmentDrawer] = useState<{ transaction: any; attachments: any[] } | null>(null)
  const pageSize = 10
  const attachmentMap = useInventoryTransactionAttachmentMap()

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
    const qty = inMonth.reduce((s: number, x: any) => s + transactionQuantity(x), 0)
    const amount = inMonth.reduce((s: number, x: any) => s + transactionAmount(x), 0)
    const pending = rows.filter((x: any) => String(x.status ?? '').toUpperCase() === 'PENDING').length
    return {
      monthlyQty: qty,
      monthlyAmount: amount,
      docs: inMonth.length,
      pending,
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
    const m = new Map<string, { code: string; qty: number }>()
    rows.forEach((x: any) => {
      transactionItems(x).forEach((line: any) => {
        const code = line?.inventoryItem?.code ?? 'NA'
        const prev = m.get(code) ?? { code, qty: 0 }
        prev.qty += Math.abs(num(line?.quantity))
        m.set(code, prev)
      })
    })
    return Array.from(m.values()).sort((a, b) => b.qty - a.qty).slice(0, 5)
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
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))

  return (
    <EnterpriseModulePage>
      <InventoryTabWorkspace />

      <div className="space-y-1 -mt-2">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-1.5">
          <OverviewMetricCard
            title="Tổng xuất trong tháng"
            value={`${formatQuantity(kpis.monthlyQty, 0)} tấn`}
            note="Theo phiếu xuất"
            tone="blue"
            icon={<RefreshCw size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="Giá trị xuất trong tháng"
            value={formatCurrency(kpis.monthlyAmount)}
            note="Giá trị đã xuất"
            tone="emerald"
            icon={<CircleDollarSign size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="Số phiếu xuất"
            value={formatQuantity(kpis.docs, 0)}
            note="Trong tháng hiện tại"
            tone="cyan"
            icon={<PackageCheck size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="Chờ duyệt"
            value={formatQuantity(kpis.pending, 0)}
            note="Cần xử lý"
            tone="amber"
            icon={<TriangleAlert size={15} />}
            trend={[0,0,0,0,0,0]}
          />
        </div>

        <InventoryPanel title="Bộ lọc phiếu xuất" className="p-2">
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-6">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inventoryInput} />
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inventoryInput}>
              <option value="">Đơn vị nhận</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className={inventoryInput}>
              <option value="">Kho xuất</option>
              {zones.map((z: any) => (
                <option key={z.id} value={z.id}>
                  {z.code}
                </option>
              ))}
            </select>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã phiếu, vật tư, đơn vị nhận..." className={`${inventoryInput} xl:col-span-3`} />
          </div>
        </InventoryPanel>

        <div className={`grid grid-cols-1 xl:grid-cols-12 gap-1.5`}>
          <InventoryPanel title="Danh sách phiếu xuất" className="xl:col-span-9 p-0">
            <div className={`${inventoryTableShell} overflow-auto`}>
              <table className="w-full min-w-[1100px] text-sm">
                <thead className={inventoryTableHead}>
                  <tr>
                    {['Mã phiếu xuất', 'Ngày xuất', 'Loại xuất', 'Đơn vị nhận', 'Kho xuất', 'Tổng khối lượng', 'Giá trị', 'Hồ sơ', 'Trạng thái', 'Người tạo'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium">
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
                        <tr key={x.id} className={inventoryTableRow}>
                          <td className="px-3 py-1.5 text-cyan-300">{x.transactionNo}</td>
                          <td className="px-3 py-1.5">{new Date(x.transactionDate ?? x.createdAt).toLocaleDateString('vi-VN')}</td>
                          <td className="px-3 py-1.5">{x.referenceType ?? 'Xuất kho'}</td>
                          <td className="px-3 py-1.5">{x.projectName ?? '-'}</td>
                          <td className="px-3 py-1.5">{zoneCodes.length ? zoneCodes.join(', ') : '-'}</td>
                          <td className="px-3 py-1.5">{formatQuantity(transactionQuantity(x), 0)}</td>
                          <td className="px-3 py-1.5">{formatCurrency(transactionAmount(x))}</td>
                          <td className="px-3 py-1.5">
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
            <MaterialsPagination page={page} pageCount={pageCount} total={rows.length} pageSize={pageSize} onPageChange={setPage} />
          </InventoryPanel>

          <div className="space-y-1.5 xl:col-span-3">
            <InventoryChartCard title="Phân bổ xuất theo kho" className="p-2">
              <CompactDonutSummary segments={zoneSegments} centerValue={formatQuantity(kpis.monthlyQty, 0)} centerLabel="tổng xuất" />
            </InventoryChartCard>
            <InventoryChartCard title="Top vật tư xuất" className="p-2">
              <HorizontalBars rows={topMaterials.map((m) => [m.code, m.qty])} valueFormatter={(value) => formatQuantity(value, 0)} />
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
    </EnterpriseModulePage>
  )
}
