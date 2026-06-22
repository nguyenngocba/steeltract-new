import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CircleDollarSign, RefreshCw, ShieldX, TriangleAlert, ClipboardList, PackageCheck, ArrowRight } from 'lucide-react'

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
import { useInventoryItems } from '../../hooks/useInventoryItems'
import { useProjects } from '../../hooks/useProjects'
import { useSuppliers } from '../../hooks/useSuppliers'
import { useZones } from '../../hooks/useZones'
import { formatCurrencyVnd, formatDateTime, formatQuantity } from '@/shared/utils/number-format'
import { ModuleDetailDrawer, ModuleTabs } from '@/shared/ui/modules'
import { getTransactionDetail } from '../../api/endpoints/inventory.endpoint'
import {
  debugAttachment,
  InventoryAttachmentList,
  normalizeAttachmentList,
} from '../../components/InventoryAttachmentPanel'
import { getAttachments } from '@/lib/attachments/attachments-api'

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

export function InventoryTransactionsPage() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [type, setType] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [page, setPage] = useState(1)
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  const pageSize = 10

  const { data: transactions = [], isLoading } = useInventoryTransactions({
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    supplierId: supplierId || undefined,
    projectId: projectId || undefined,
    type: type || undefined,
  })
  const { data: suppliers = [] } = useSuppliers()
  const { data: projects = [] } = useProjects()
  const { data: zones = [] } = useZones()
  const { data: materials = [] } = useInventoryItems()

  const rows = useMemo(() => {
    return (transactions as any[])
      .filter((x: any) => {
        if (zoneId && !x.items?.some((line: any) => String(line.zoneId ?? '') === zoneId)) return false
        return true
      })
      .sort((a: any, b: any) => +new Date(b.transactionDate ?? b.createdAt) - +new Date(a.transactionDate ?? a.createdAt))
  }, [transactions, zoneId])

  const kpis = useMemo(() => {
    const total = rows.length
    const inbound = rows.filter((x: any) => String(x.type).toUpperCase() === 'INBOUND').length
    const outbound = rows.filter((x: any) => String(x.type).toUpperCase() === 'OUTBOUND').length
    const transfer = rows.filter((x: any) => String(x.type).toUpperCase() === 'TRANSFER').length
    const stockTake = rows.filter((x: any) => String(x.type).toUpperCase() === 'ADJUSTMENT').length
    return { total, inbound, outbound, transfer, stockTake }
  }, [rows])

  const byType = useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach((x: any) => {
      const t = String(x.type ?? '').toUpperCase()
      m.set(t, (m.get(t) ?? 0) + 1)
    })
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
  }, [rows])

  const dailyLoad = useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach((x: any) => {
      const key = new Date(x.transactionDate ?? x.createdAt).toISOString().slice(0, 10)
      m.set(key, (m.get(key) ?? 0) + 1)
    })
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-10)
  }, [rows])

  const recent = useMemo(() => rows.slice(0, 6), [rows])

  const typeSegments = useMemo(() => byType.map(([label, value], index) => ({
    label,
    value,
    color: ['#14c987', '#f97316', '#7c3aed', '#1d7cff', '#ef4444'][index % 5],
  })), [byType])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page])
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const { data: selectedTransaction } = useQuery({
    queryKey: ['inventory-transaction-detail', selectedTransactionId],
    queryFn: () => getTransactionDetail(selectedTransactionId as string),
    enabled: Boolean(selectedTransactionId),
  })
  const { data: attachmentResult } = useQuery({
    queryKey: ['attachments', 'inventory', 'transaction', selectedTransactionId],
    queryFn: () => getAttachments({
      module: 'inventory',
      entityType: 'transaction',
      entityId: selectedTransactionId ?? '',
    }),
    enabled: Boolean(selectedTransactionId),
  })
  const selectedAttachments = normalizeAttachmentList(attachmentResult)
  const { data: transactionAttachmentResult } = useQuery({
    queryKey: ['attachments', 'inventory', 'transaction', 'counts'],
    queryFn: () => getAttachments({
      module: 'inventory',
      entityType: 'transaction',
    }),
    staleTime: 10_000,
  })
  const transactionAttachments = normalizeAttachmentList(transactionAttachmentResult)
  const transactionAttachmentCounts = useMemo(() => {
    const map = new Map<string, number>()
    transactionAttachments.forEach((attachment) => {
      const entityId = String(attachment.entityId ?? '')
      if (!entityId) return
      map.set(entityId, (map.get(entityId) ?? 0) + 1)
    })
    return map
  }, [transactionAttachments])
  const attachmentCountForTransaction = (transactionId: string) => transactionAttachmentCounts.get(String(transactionId)) ?? 0

  useEffect(() => {
    if (!import.meta.env.DEV || !selectedTransactionId) return

    console.debug('[inventory.transaction.attachments]', {
      queryParams: {
        module: 'inventory',
        entityType: 'transaction',
        entityId: selectedTransactionId,
      },
      response: attachmentResult,
      mapped: selectedAttachments.map(debugAttachment),
    })
  }, [
    attachmentResult,
    selectedAttachments,
    selectedTransactionId,
  ])

  function exportCsv() {
    const headers = ['transactionNo', 'type', 'material', 'zone', 'quantity', 'unitPrice', 'totalAmount', 'supplier', 'project', 'date']
    const lines = rows.map((x: any) => {
      const line = x.items?.[0]
      return [
        x.transactionNo ?? '',
        x.type ?? '',
        `${line?.inventoryItem?.code ?? ''} ${line?.inventoryItem?.name ?? ''}`.trim(),
        line?.zone?.code ?? '',
        String(num(line?.quantity)),
        String(num(line?.unitPrice)),
        String(num(line?.totalAmount)),
        x.supplierName ?? '',
        x.projectName ?? '',
        new Date(x.transactionDate ?? x.createdAt).toISOString(),
      ]
    })
    const csv = [headers.join(','), ...lines.map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-transactions-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  // Đầu component
  const filterInput =
    'h-9 w-full rounded-md border border-white/10 bg-slate-950/45 px-2 text-xs text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-950/65'

  // Hàm reset (nếu chưa có)
  const resetFilters = () => {
    setFromDate('')
    setToDate('')
    setType('')
    setSupplierId('')
    setProjectId('')
    setZoneId('')
  }

  return (
    <EnterpriseModulePage>
      <InventoryTabWorkspace />

      <div className="space-y-1 -mt-2">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-1.5">
          <OverviewMetricCard
            title="Tổng giao dịch"
            value={formatQuantity(kpis.total, 0)}
            note="Theo bộ lọc"
            tone="blue"
            icon={<ClipboardList size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="Nhập kho"
            value={formatQuantity(kpis.inbound, 0)}
            note="Phiếu nhập"
            tone="emerald"
            icon={<PackageCheck size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="Xuất kho"
            value={formatQuantity(kpis.outbound, 0)}
            note="Phiếu xuất"
            tone="amber"
            icon={<TriangleAlert size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="Điều chuyển"
            value={formatQuantity(kpis.transfer, 0)}
            note="Nội bộ kho"
            tone="cyan"
            icon={<ArrowRight size={15} />}
            trend={[0,0,0,0,0,0]}
          />
          <OverviewMetricCard
            title="Kiểm kê"
            value={formatQuantity(kpis.stockTake, 0)}
            note="Điều chỉnh tồn"
            tone="purple"
            icon={<RefreshCw size={15} />}
            trend={[0,0,0,0,0,0]}
          />
        </div>

        <InventoryPanel className="rounded-xl p-0.5">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-[165px_165px_180px_180px_180px_180px_130px_120px]">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className={filterInput}
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className={filterInput}
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={filterInput}
            >
              <option value="">Loại giao dịch</option>
              <option value="INBOUND">INBOUND</option>
              <option value="OUTBOUND">OUTBOUND</option>
              <option value="TRANSFER">TRANSFER</option>
              <option value="ADJUSTMENT">ADJUSTMENT</option>
              <option value="RETURN">RETURN</option>
            </select>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className={filterInput}
            >
              <option value="">Nhà cung cấp</option>
              {suppliers.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={filterInput}
            >
              <option value="">Công trình</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className={filterInput}
            >
              <option value="">Kho</option>
              {zones.map((z: any) => (
                <option key={z.id} value={z.id}>{z.code}</option>
              ))}
            </select>
            <button
              onClick={resetFilters}
              className="h-9 self-end rounded-md border border-white/10 bg-white/[0.055] px-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Làm mới
            </button>
            <button
              onClick={exportCsv}
              className="h-9 self-end rounded-md bg-blue-600 px-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
            >
              Xuất CSV
            </button>
          </div>
        </InventoryPanel>

        <div className={`grid grid-cols-1 xl:grid-cols-12 gap-1.5`}>
          <InventoryPanel title="Lịch sử giao dịch" className="xl:col-span-9 p-0">
            <div className={`${inventoryTableShell} overflow-auto`}>
              <table className="w-full min-w-[1280px] text-sm">
                <thead className={inventoryTableHead}>
                  <tr>
                    {['Thời gian', 'Loại', 'Số chứng từ', 'Đính kèm', 'Mã vật tư', 'Tên vật tư', 'Kho', 'Số lượng', 'Đơn giá', 'Giá trị', 'Đối tượng', 'Người tạo', 'Trạng thái'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!isLoading &&
                    paged.map((x: any) => {
                      const line = x.items?.[0]
                      const attachmentCount = attachmentCountForTransaction(x.id)
                      return (
                        <tr key={x.id} className={inventoryTableRow}>
                          <td className="px-3 py-1.5">{formatDateTime(x.transactionDate ?? x.createdAt)}</td>
                          <td className="px-3 py-1.5">{x.type}</td>
                          <td className="px-3 py-1.5">
                            <button type="button" onClick={() => setSelectedTransactionId(x.id)} className="font-semibold text-cyan-300 hover:text-cyan-100">
                              {x.transactionNo}
                            </button>
                          </td>
                          <td className="px-3 py-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedTransactionId(x.id)}
                              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold transition ${
                                attachmentCount > 0
                                  ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200 hover:border-cyan-300/60'
                                  : 'border-white/10 bg-white/[0.035] text-slate-500 hover:text-slate-300'
                              }`}
                              title={`${attachmentCount} tài liệu đính kèm`}
                            >
                              <span aria-hidden="true">📎</span>
                              {formatQuantity(attachmentCount, 0)}
                            </button>
                          </td>
                          <td className="px-3 py-1.5">{line?.inventoryItem?.code ?? '-'}</td>
                          <td className="px-3 py-1.5">{line?.inventoryItem?.name ?? '-'}</td>
                          <td className="px-3 py-1.5">{line?.zone?.code ?? '-'}</td>
                          <td className="px-3 py-1.5">{formatQuantity(Math.abs(num(line?.quantity)), 0)}</td>
                          <td className="px-3 py-1.5">{formatCurrency(line?.unitPrice)}</td>
                          <td className="px-3 py-1.5">{formatCurrency(Math.abs(num(line?.totalAmount)))}</td>
                          <td className="px-3 py-1.5">{x.supplierName ?? x.projectName ?? '-'}</td>
                          <td className="px-3 py-1.5">{x.createdBy ?? 'Admin'}</td>
                          <td className="px-3 py-1.5">
                            <span className={`rounded border px-2 py-0.5 text-xs ${
                              String(x.status ?? 'COMPLETED').toUpperCase() === 'COMPLETED'
                                ? 'border-emerald-700/60 bg-emerald-500/10 text-emerald-300'
                                : 'border-amber-700/60 bg-amber-500/10 text-amber-300'
                            }`}>
                              {x.status ?? 'COMPLETED'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
            <MaterialsPagination page={page} pageCount={pageCount} total={rows.length} pageSize={pageSize} onPageChange={setPage} />
          </InventoryPanel>

          <div className="space-y-1.5 xl:col-span-3">
            <InventoryChartCard title="Thống kê giao dịch" className="p-2">
              <CompactDonutSummary segments={typeSegments} centerValue={formatQuantity(kpis.total, 0)} centerLabel="giao dịch" />
            </InventoryChartCard>
            <InventoryChartCard title="Giao dịch theo ngày" className="p-2">
              <HorizontalBars rows={dailyLoad.map(([day, count]) => [day.slice(5), count])} valueFormatter={(value) => formatQuantity(value, 0)} />
            </InventoryChartCard>
            <InventoryChartCard title="Giao dịch gần đây" className="p-2">
              {recent.map((x: any) => (
                <div key={x.id} className="mb-1.5 rounded border border-white/10 p-1.5 text-xs text-slate-300 last:mb-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-cyan-300">{x.transactionNo}</span>
                    <span className="shrink-0 text-[11px] text-slate-500">📎 {formatQuantity(attachmentCountForTransaction(x.id), 0)}</span>
                  </div>
                  <div className="text-slate-400">{x.type}</div>
                </div>
              ))}
            </InventoryChartCard>
          </div>
        </div>
      </div>
      <InventoryTransactionDetailDrawer
        transaction={selectedTransaction}
        attachments={selectedAttachments}
        open={Boolean(selectedTransactionId)}
        onClose={() => setSelectedTransactionId(null)}
      />
    </EnterpriseModulePage>
  )
}

function InventoryTransactionDetailDrawer({
  open,
  transaction,
  attachments,
  onClose,
}: {
  open: boolean
  transaction: any
  attachments: ReturnType<typeof normalizeAttachmentList>
  onClose: () => void
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'attachments'>('overview')
  const items = Array.isArray(transaction?.items) ? transaction.items : []
  const attachmentPreview = attachments.slice(0, 3)

  return (
    <ModuleDetailDrawer
      open={open}
      title={transaction?.transactionNo ?? 'Chi tiết giao dịch'}
      subtitle={`${transaction?.type ?? '-'} · ${transaction?.transactionDate ? formatDateTime(transaction.transactionDate) : '-'} · ${formatQuantity(attachments.length, 0)} tài liệu`}
      onClose={onClose}
      widthClass="max-w-5xl"
    >
      <div className="space-y-3">
        <ModuleTabs
          tabs={[
            { key: 'overview', label: 'Tổng quan' },
            { key: 'attachments', label: 'Tài liệu đính kèm' },
          ]}
          active={activeTab}
          onChange={(tab) => setActiveTab(tab as 'overview' | 'attachments')}
        />

        {activeTab === 'overview' ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="grid gap-2 text-sm md:grid-cols-2">
              <InfoLine label="Số chứng từ" value={transaction?.transactionNo ?? '-'} />
              <InfoLine label="Loại giao dịch" value={transaction?.type ?? '-'} />
              <InfoLine label="Đối tượng" value={transaction?.supplierName ?? transaction?.projectName ?? '-'} />
              <InfoLine label="Ngày giao dịch" value={transaction?.transactionDate ? formatDateTime(transaction.transactionDate) : '-'} />
            </div>
            <div className="mt-3 overflow-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-white/[0.06] text-xs uppercase text-slate-400">
                  <tr>
                    {['Mã vật tư', 'Tên vật tư', 'Kho', 'Ô/Tầng', 'Số lượng', 'Đơn giá', 'Giá trị'].map((header) => (
                      <th key={header} className="px-3 py-2 text-left font-medium">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((line: any) => (
                    <tr key={line.id} className="border-t border-white/10 text-slate-300">
                      <td className="px-3 py-2 text-cyan-300">{line.inventoryItem?.code ?? '-'}</td>
                      <td className="px-3 py-2">{line.inventoryItem?.name ?? '-'}</td>
                      <td className="px-3 py-2">{line.zone?.code ?? line.warehouse?.code ?? '-'}</td>
                      <td className="px-3 py-2">{line.slotId ?? '-'} / {line.level ?? '-'}</td>
                      <td className="px-3 py-2">{formatQuantity(line.quantity)}</td>
                      <td className="px-3 py-2">{formatCurrency(line.unitPrice)}</td>
                      <td className="px-3 py-2">{formatCurrency(Math.abs(num(line.totalAmount)))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 rounded-xl border border-cyan-300/15 bg-cyan-400/[0.055] p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-100">Tài liệu đính kèm</div>
                  <div className="text-xs text-slate-500">{formatQuantity(attachments.length, 0)} file đang gắn với phiếu này</div>
                </div>
                <button type="button" onClick={() => setActiveTab('attachments')} className={inventoryMutedButton}>
                  Xem tất cả
                </button>
              </div>
              {attachmentPreview.length ? (
                <div className="grid gap-2 md:grid-cols-3">
                  {attachmentPreview.map((attachment) => (
                    <button
                      key={attachment.id}
                      type="button"
                      onClick={() => setActiveTab('attachments')}
                      className="min-w-0 rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 text-left text-xs transition hover:border-cyan-300/35 hover:bg-cyan-400/10"
                    >
                      <div className="truncate font-semibold text-cyan-100">📄 {attachment.originalName ?? attachment.title}</div>
                      <div className="mt-1 truncate text-slate-500">{attachment.category}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-white/10 bg-slate-950/35 px-3 py-4 text-center text-xs text-slate-500">
                  Chưa có tài liệu đính kèm cho phiếu này.
                </div>
              )}
            </div>
          </div>
        ) : (
          <InventoryAttachmentList attachments={attachments} />
        )}
      </div>
    </ModuleDetailDrawer>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-slate-100">{value}</div>
    </div>
  )
}
