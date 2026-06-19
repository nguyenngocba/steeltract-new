import { useMemo, useState } from 'react'
import { CircleDollarSign, PackageCheck, RefreshCw, ShieldX, TriangleAlert, ClipboardList } from 'lucide-react'

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

export function InventoryStockTakePage() {
  const { data: zones = [] } = useZones()
  const { data: adjustments = [] } = useInventoryTransactions({ type: 'ADJUSTMENT' })

  const [date, setDate] = useState('')
  const [zoneFilter, setZoneFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [page, setPage] = useState(1)
  const [attachmentDrawer, setAttachmentDrawer] = useState<{ transaction: any; attachments: any[] } | null>(null)
  const pageSize = 10
  const attachmentMap = useInventoryTransactionAttachmentMap()

  const rows = useMemo(() => {
    return (adjustments as any[])
      .filter((x: any) => {
        const line = x.items?.[0]
        if (date) {
          const d = new Date(x.transactionDate ?? x.createdAt).toISOString().slice(0, 10)
          if (d !== date) return false
        }
        if (zoneFilter && String(line?.zoneId ?? '') !== zoneFilter) return false
        if (statusFilter && String(x.status ?? 'COMPLETED').toUpperCase() !== statusFilter) return false
        if (methodFilter && String(x.referenceType ?? '') !== methodFilter) return false
        return true
      })
      .sort((a: any, b: any) => +new Date(b.transactionDate ?? b.createdAt) - +new Date(a.transactionDate ?? a.createdAt))
  }, [adjustments, date, zoneFilter, statusFilter, methodFilter])

  const metrics = useMemo(() => {
    const total = rows.length
    const mismatch = rows.filter((x: any) => Math.abs(num(x.items?.[0]?.quantity)) > 0).length
    const matched = Math.max(0, total - mismatch)
    const accuracy = total === 0 ? 100 : (matched / total) * 100
    const varianceValue = rows.reduce((s: number, x: any) => s + Math.abs(num(x.items?.[0]?.totalAmount)), 0)
    return { total, matched, mismatch, accuracy, varianceValue }
  }, [rows])

  const discrepancyByZone = useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach((x: any) => {
      const key = x.items?.[0]?.zone?.code ?? 'NA'
      m.set(key, (m.get(key) ?? 0) + Math.abs(num(x.items?.[0]?.quantity)))
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
            title="Phiếu kiểm kê"
            value={formatQuantity(metrics.total, 0)}
            note="Tổng phiếu"
            tone="blue"
            icon={<ClipboardList size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="Khớp"
            value={formatQuantity(metrics.matched, 0)}
            note="Không chênh lệch"
            tone="emerald"
            icon={<PackageCheck size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="Chênh lệch"
            value={formatQuantity(metrics.mismatch, 0)}
            note="Cần xử lý"
            tone="amber"
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
            title="Giá trị chênh lệch"
            value={formatCurrency(metrics.varianceValue)}
            note="Theo giá trị tồn"
            tone="red"
            icon={<CircleDollarSign size={15} />}
            trend={[0,0,0,0,0,0]}
          />
        </div>

        <InventoryPanel title="Bộ lọc kiểm kê" className="p-2">
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-6">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inventoryInput} />
            <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} className={inventoryInput}>
              <option value="">Kho</option>
              {zones.map((z: any) => (
                <option key={z.id} value={z.id}>
                  {z.code}
                </option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inventoryInput}>
              <option value="">Trạng thái</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="PENDING">Đang thực hiện</option>
            </select>
            <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className={inventoryInput}>
              <option value="">Phương pháp</option>
              <option value="Định kỳ">Định kỳ</option>
              <option value="Bất thường">Bất thường</option>
              <option value="Kiểm kê theo khu vực">Kiểm kê theo khu vực</option>
            </select>
            <button
              onClick={() => {
                setDate('')
                setZoneFilter('')
                setStatusFilter('')
                setMethodFilter('')
              }}
              className={`${inventoryMutedButton} h-10`}
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
                    <tr key={x.id} className={inventoryTableRow}>
                      <td className="px-3 py-1.5 text-cyan-300">{x.transactionNo}</td>
                      <td className="px-3 py-1.5">{x.items?.[0]?.zone?.code ?? '-'}</td>
                      <td className="px-3 py-1.5">{x.referenceType ?? 'Định kỳ'}</td>
                      <td className="px-3 py-1.5">{new Date(x.transactionDate ?? x.createdAt).toLocaleDateString('vi-VN')}</td>
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
                      <td className={`px-3 py-1.5 ${num(x.items?.[0]?.quantity) >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                        {formatQuantity(num(x.items?.[0]?.quantity), 0)}
                      </td>
                      <td className="px-3 py-1.5">{metrics.accuracy.toFixed(2)}%</td>
                      <td className="px-3 py-1.5">
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
