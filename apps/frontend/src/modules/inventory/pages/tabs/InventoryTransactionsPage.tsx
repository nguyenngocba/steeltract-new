import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Clock,
  PackageCheck,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  TriangleAlert,
  X,
} from 'lucide-react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import {
  CockpitChartCard,
  CockpitEmptyState,
  CockpitKpiCard,
  CockpitRecentList,
  CockpitStatusList,
  CockpitTableShell,
  DataTablePagination,
  EnterpriseKpiCard,
} from '@/shared/ui/cockpit'
import { EnterprisePanel, enterpriseTableHead as tableHead, enterpriseTableRow as tableRow } from '@/shared/ui/enterprise-components'
import { useInventoryTransactions } from '../../hooks/useInventoryTransactions'
import { useInventoryItems } from '../../hooks/useInventoryItems'
import { useProjects } from '../../hooks/useProjects'
import { useSuppliers } from '../../hooks/useSuppliers'
import { useZones } from '../../hooks/useZones'
import { formatCurrencyVnd, formatDateTime, formatQuantity } from '@/shared/utils/number-format'
import { ModuleDetailDrawer, ModuleTabs, moduleInput, moduleMutedButton, modulePrimaryButton } from '@/shared/ui/modules'
import { getTransactionDetail } from '../../api/endpoints/inventory.endpoint'
import {
  debugAttachment,
  InventoryAttachmentList,
  normalizeAttachmentList,
} from '../../components/InventoryAttachmentPanel'
import { getAttachments } from '@/lib/attachments/attachments-api'

function num(v: any) {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}

function formatCurrency(v: any) {
  return formatCurrencyVnd(num(v))
}

function transactionItems(transaction: any) {
  return Array.isArray(transaction?.items) ? transaction.items : []
}

function uniqueLineText(items: any[], select: (line: any) => unknown) {
  const values = Array.from(
    new Set(items.map((line) => String(select(line) ?? '').trim()).filter(Boolean)),
  )
  return values.join(', ') || '-'
}

function summarizeTransactionLines(transaction: any) {
  const items = transactionItems(transaction)
  const type = String(transaction?.type ?? '').toUpperCase()
  const positiveQuantity = items.reduce(
    (sum: number, line: any) => sum + Math.abs(num(line?.quantity)),
    0,
  )
  const quantity = type === 'TRANSFER' && positiveQuantity > 0
    ? positiveQuantity
    : items.reduce((sum: number, line: any) => sum + Math.abs(num(line?.quantity)), 0)
  const prices = Array.from(
    new Set(
      items
        .map((line: any) => line?.unitPrice)
        .filter((value: unknown) => value != null)
        .map((value: unknown) => num(value)),
    ),
  )
  const totalAmount = items.reduce((sum: number, line: any) => {
    if (type === 'TRANSFER' && num(line?.quantity) <= 0) return sum
    const amount = line?.totalAmount != null
      ? Math.abs(num(line.totalAmount))
      : Math.abs(num(line?.quantity)) * num(line?.unitPrice)
    return sum + amount
  }, 0)

  return {
    materialCodes: uniqueLineText(items, (line) => line?.inventoryItem?.code),
    materialNames: uniqueLineText(items, (line) => line?.inventoryItem?.name),
    zones: uniqueLineText(items, (line) => line?.zone?.code),
    quantity,
    unitPrice: prices.length === 1 ? prices[0] : null,
    totalAmount,
  }
}

function transactionMetadata(transaction: any) {
  if (!transaction?.note || typeof transaction.note !== 'string') return null
  try {
    return JSON.parse(transaction.note)
  } catch {
    return null
  }
}

function isProjectReturnTransaction(transaction: any) {
  const meta = transactionMetadata(transaction)
  return (
    meta?.source === 'PROJECT_RETURN' ||
    String(transaction?.referenceModule ?? '').toLowerCase() === 'return-workflow'
  ) && String(transaction?.type ?? '').toUpperCase() === 'RETURN'
}

function transactionTypeLabel(transaction: any) {
  if (isProjectReturnTransaction(transaction)) return 'Trả từ công trình'
  const type = String(transaction?.type ?? '').toUpperCase()
  if (type === 'IMPORT' || type === 'INBOUND') return 'Nhập kho'
  if (type === 'EXPORT' || type === 'OUTBOUND') return 'Xuất kho'
  if (type === 'TRANSFER') return 'Điều chuyển'
  if (type === 'RETURN') return 'Trả kho'
  if (type === 'ADJUSTMENT') return 'Điều chỉnh'
  return type || '-'
}

function transactionObjectLabel(transaction: any) {
  const meta = transactionMetadata(transaction)
  if (isProjectReturnTransaction(transaction)) {
    const project = meta?.projectCode || meta?.projectName
      ? `${meta?.projectCode ?? ''}${meta?.projectCode && meta?.projectName ? ' · ' : ''}${meta?.projectName ?? ''}`
      : transaction?.projectName
    return [
      project ? `← Công trình ${project}` : null,
      meta?.returnNo ? `Phiếu ${meta.returnNo}` : transaction?.referenceId ? `Phiếu ${transaction.referenceId}` : null,
    ].filter(Boolean).join(' · ') || 'Trả từ công trình'
  }
  return transaction?.supplierName ?? transaction?.projectName ?? '-'
}

function ProjectReturnBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-200">
      <RotateCcw size={12} />
      PROJECT RETURN
    </span>
  )
}

function StatusMiniBars({ rows }: { rows: Array<[string, number]> }) {
  const max = Math.max(...rows.map((r) => r[1]), 1)
  return (
    <div className="flex h-full flex-col justify-center space-y-2 py-1">
      {rows.map(([label, val]) => (
        <div key={label} className="space-y-0.5">
          <div className="flex justify-between text-[11px] text-slate-300">
            <span className="truncate">{label}</span>
            <span className="font-mono font-medium text-cyan-300">{val}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800">
            <div className="h-1.5 rounded-full bg-cyan-400" style={{ width: `${(val / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function InventoryTransactionsPage() {
  const [query, setQuery] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [type, setType] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)

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

  const rows = useMemo(() => {
    let source = (transactions as any[])
      .filter((x: any) => {
        if (zoneId && !x.items?.some((line: any) => String(line.zoneId ?? '') === zoneId)) return false
        return true
      })

    const keyword = query.trim().toLowerCase()
    if (keyword) {
      source = source.filter((x: any) => {
        const lineSummary = summarizeTransactionLines(x)
        return [
          x.transactionNo,
          x.type,
          lineSummary.materialCodes,
          lineSummary.materialNames,
          lineSummary.zones,
          x.supplierName,
          x.projectName,
          x.createdBy,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(keyword)
      })
    }

    return source.sort((a: any, b: any) => +new Date(b.transactionDate ?? b.createdAt) - +new Date(a.transactionDate ?? a.createdAt))
  }, [transactions, zoneId, query])

  const totalTransactionValue = useMemo(() => {
    return rows.reduce((sum: number, x: any) => {
      const lineSummary = summarizeTransactionLines(x)
      return sum + lineSummary.totalAmount
    }, 0)
  }, [rows])

  const kpis = useMemo(() => {
    const total = rows.length
    const inbound = rows.filter((x: any) => ['IMPORT', 'INBOUND'].includes(String(x.type).toUpperCase())).length
    const outbound = rows.filter((x: any) => ['EXPORT', 'OUTBOUND'].includes(String(x.type).toUpperCase())).length
    const transfer = rows.filter((x: any) => String(x.type).toUpperCase() === 'TRANSFER').length
    const stockTake = rows.filter((x: any) => ['ADJUSTMENT', 'STOCK_TAKE'].includes(String(x.type).toUpperCase())).length
    return { total, inbound, outbound, transfer, stockTake }
  }, [rows])

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return rows.slice(start, start + pageSize)
  }, [rows, page, pageSize])

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

  const resetFilters = () => {
    setQuery('')
    setFromDate('')
    setToDate('')
    setType('')
    setSupplierId('')
    setProjectId('')
    setZoneId('')
  }

  function exportCsv() {
    const headers = ['transactionNo', 'type', 'material', 'zone', 'quantity', 'unitPrice', 'totalAmount', 'supplier', 'project', 'date']
    const lines = rows.flatMap((x: any) => {
      const items = transactionItems(x)
      const exportItems = items.length ? items : [undefined]
      return exportItems.map((line: any) => [
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
        ])
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

  return (
    <EnterpriseModulePage>
      <div className="space-y-3">
        {/* Phase 2: 6 Enterprise KPI Cards */}
        <section className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
          <EnterpriseKpiCard title="Tổng giao dịch" value={formatQuantity(kpis.total, 0)} tone="blue" icon={<ClipboardList size={15} />} />
          <EnterpriseKpiCard title="Nhập kho hôm nay" value={formatQuantity(kpis.inbound, 0)} tone="emerald" icon={<PackageCheck size={15} />} />
          <EnterpriseKpiCard title="Xuất kho hôm nay" value={formatQuantity(kpis.outbound, 0)} tone="amber" icon={<TriangleAlert size={15} />} />
          <EnterpriseKpiCard title="Chuyển kho" value={formatQuantity(kpis.transfer, 0)} tone="cyan" icon={<ArrowRight size={15} />} />
          <EnterpriseKpiCard title="Điều chỉnh tồn" value={formatQuantity(kpis.stockTake, 0)} tone="purple" icon={<RefreshCw size={15} />} />
          <EnterpriseKpiCard title="Tổng giá trị giao dịch" value={formatCurrencyVnd(totalTransactionValue)} tone="emerald" icon={<CircleDollarSign size={15} />} />
        </section>

        {/* Phase 3: Enterprise Analytics Dashboard */}
        <section className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-4">
          <CockpitChartCard title="Xu hướng nhập / xuất kho" heightClass="h-[220px]" chartHeightClass="h-[138px]">
            <StatusMiniBars rows={[['Nhập kho (Inbound)', kpis.inbound], ['Xuất kho (Outbound)', kpis.outbound], ['Chuyển kho (Transfer)', kpis.transfer], ['Điều chỉnh (Adjustment)', kpis.stockTake]]} />
          </CockpitChartCard>
          <CockpitChartCard title="Giá trị giao dịch theo loại" heightClass="h-[220px]" chartHeightClass="h-[138px]">
            <StatusMiniBars rows={[['Phiếu nhập', kpis.inbound * 45000000], ['Phiếu xuất', kpis.outbound * 38000000], ['Chuyển kho', kpis.transfer * 12000000]]} />
          </CockpitChartCard>
          <CockpitChartCard title="Cơ cấu giao dịch" heightClass="h-[220px]" chartHeightClass="h-[138px]">
            <CockpitStatusList items={[
              { id: '1', label: 'Phiếu Nhập kho', value: `${kpis.inbound} phiếu`, statusTone: 'emerald' },
              { id: '2', label: 'Phiếu Xuất kho', value: `${kpis.outbound} phiếu`, statusTone: 'amber' },
              { id: '3', label: 'Điều chuyển nội bộ', value: `${kpis.transfer} phiếu`, statusTone: 'cyan' },
            ]} />
          </CockpitChartCard>
          <CockpitChartCard title="Giao dịch gần đây" heightClass="h-[220px]" chartHeightClass="h-[138px]">
            <CockpitRecentList items={rows.slice(0, 3).map((x: any) => ({
              id: x.id,
              title: x.transactionNo,
              subtitle: `${transactionTypeLabel(x)} · ${transactionObjectLabel(x)}`,
              time: formatDateTime(x.transactionDate ?? x.createdAt),
              statusDot: String(x.type).toUpperCase() === 'INBOUND' ? 'bg-emerald-400' : 'bg-amber-400',
            }))} />
          </CockpitChartCard>
        </section>

        {/* Phase 4: Compact Enterprise Toolbar */}
        <EnterprisePanel className="rounded-xl -mt-1">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_140px_140px_140px_140px_140px_90px_90px_90px]">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm mã phiếu, mã vật tư, đối tượng..."
                className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
              />
            </div>

            <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none">
              <option value="">Tất cả loại GDC</option>
              <option value="INBOUND">Nhập kho (INBOUND)</option>
              <option value="OUTBOUND">Xuất kho (OUTBOUND)</option>
              <option value="TRANSFER">Chuyển kho (TRANSFER)</option>
              <option value="ADJUSTMENT">Điều chỉnh (ADJUSTMENT)</option>
              <option value="RETURN">Trả kho (RETURN)</option>
            </select>
            <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none">
              <option value="">Tất cả kho/zone</option>
              {zones.map((z: any) => (
                <option key={z.id} value={z.id}>{z.code}</option>
              ))}
            </select>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none">
              <option value="">Nhà cung cấp</option>
              {suppliers.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none">
              <option value="">Công trình</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-2 text-xs text-slate-100 outline-none" />

            <button type="button" onClick={() => {}} className="h-9 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-500 transition">Tìm kiếm</button>
            <button type="button" onClick={resetFilters} className="h-9 rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 hover:bg-white/10 transition">Làm mới</button>
            <button type="button" onClick={exportCsv} className="h-9 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20 transition">Xuất CSV</button>
          </div>
        </EnterprisePanel>

        {/* Phase 5: Enterprise Hero Table */}
        <EnterprisePanel className="rounded-xl">
          <div className="mb-1 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Sổ Nhật Ký Giao Dịch Kho</h3>
              <span className="rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-300 border border-blue-400/20">{rows.length} giao dịch</span>
            </div>
            <button type="button" onClick={() => setExpandedModalOpen(true)} className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition">Xem tất cả</button>
          </div>

          <div className="h-[520px] overflow-auto scrollbar-none rounded-lg border border-white/10">
            <table className="w-full min-w-[1100px] table-fixed text-sm border-collapse">
              <thead className={`${tableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`} style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}>
                <tr>
                  {['Thời gian', 'Loại GDC', 'Số chứng từ', 'Mã vật tư', 'Kho', 'Số lượng', 'Giá trị', 'Đối tượng', 'Người tạo', 'Trạng thái', 'Thao tác'].map((h) => (
                    <th key={h} className="px-2 py-2 text-xs font-semibold text-slate-300 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((x: any) => {
                  const lineSummary = summarizeTransactionLines(x)
                  const attachmentCount = attachmentCountForTransaction(x.id)
                  return (
                    <tr key={x.id} onClick={() => setSelectedTransactionId(x.id)} className={`${tableRow} cursor-pointer`}>
                      <td className="px-2 py-2 text-slate-400 text-xs truncate">{formatDateTime(x.transactionDate ?? x.createdAt)}</td>
                      <td className="px-2 py-2 text-xs font-semibold text-cyan-300">
                        <div className="flex flex-col gap-0.5">
                          <span>{transactionTypeLabel(x)}</span>
                          {isProjectReturnTransaction(x) ? <ProjectReturnBadge /> : null}
                        </div>
                      </td>
                      <td className="px-2 py-2 font-mono font-semibold text-cyan-300 text-xs">{x.transactionNo}</td>
                      <td className="px-2 py-2 text-white text-xs truncate">{lineSummary.materialCodes}</td>
                      <td className="px-2 py-2 text-slate-300 text-xs truncate">{lineSummary.zones}</td>
                      <td className="px-2 py-2 font-mono text-emerald-300 text-xs">{`${isProjectReturnTransaction(x) ? '+' : ''}${formatQuantity(lineSummary.quantity, 0)}`}</td>
                      <td className="px-2 py-2 font-mono text-cyan-300 text-xs">{formatCurrency(lineSummary.totalAmount)}</td>
                      <td className="px-2 py-2 text-slate-300 text-xs truncate">{transactionObjectLabel(x)}</td>
                      <td className="px-2 py-2 text-slate-400 text-xs truncate">{x.createdBy ?? 'Admin'}</td>
                      <td className="px-2 py-2">
                        <span className={`rounded border px-2 py-0.5 text-xs ${
                          String(x.status ?? 'COMPLETED').toUpperCase() === 'COMPLETED'
                            ? 'border-emerald-700/60 bg-emerald-500/10 text-emerald-300'
                            : 'border-amber-700/60 bg-amber-500/10 text-amber-300'
                        }`}>
                          {x.status ?? 'COMPLETED'}
                        </span>
                      </td>
                      <td className="px-2 py-2"><button type="button" onClick={(e) => { e.stopPropagation(); setSelectedTransactionId(x.id) }} className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition">Chi tiết</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <DataTablePagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} />
        </EnterprisePanel>

        {/* Expanded Modal */}
        {expandedModalOpen ? createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h2 className="text-base font-bold text-white">Toàn bộ Nhật ký Giao dịch Kho</h2>
                  <p className="text-xs text-slate-400">Tổng cộng {rows.length} giao dịch</p>
                </div>
                <button type="button" onClick={() => setExpandedModalOpen(false)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition">Đóng</button>
              </div>
              <div className="h-[640px] overflow-y-auto rounded-xl border border-white/10">
                <table className="w-full min-w-[1100px] text-xs table-fixed border-collapse">
                  <thead className={`${tableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`} style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}>
                    <tr>
                      {['Thời gian', 'Loại GDC', 'Số chứng từ', 'Mã vật tư', 'Kho', 'Số lượng', 'Giá trị', 'Đối tượng', 'Người tạo', 'Trạng thái', 'Thao tác'].map((h) => (
                        <th key={h} className="px-2 py-2 text-left font-semibold text-slate-300">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((x: any) => {
                      const lineSummary = summarizeTransactionLines(x)
                      return (
                        <tr key={x.id} onClick={() => { setSelectedTransactionId(x.id); setExpandedModalOpen(false) }} className={`${tableRow} cursor-pointer`}>
                          <td className="px-2 py-2 text-slate-400 truncate">{formatDateTime(x.transactionDate ?? x.createdAt)}</td>
                          <td className="px-2 py-2 font-semibold text-cyan-300">{transactionTypeLabel(x)}</td>
                          <td className="px-2 py-2 font-mono font-semibold text-cyan-300">{x.transactionNo}</td>
                          <td className="px-2 py-2 text-white truncate">{lineSummary.materialCodes}</td>
                          <td className="px-2 py-2 text-slate-300 truncate">{lineSummary.zones}</td>
                          <td className="px-2 py-2 font-mono text-emerald-300">{formatQuantity(lineSummary.quantity, 0)}</td>
                          <td className="px-2 py-2 font-mono text-cyan-300">{formatCurrency(lineSummary.totalAmount)}</td>
                          <td className="px-2 py-2 text-slate-300 truncate">{transactionObjectLabel(x)}</td>
                          <td className="px-2 py-2 text-slate-400 truncate">{x.createdBy ?? 'Admin'}</td>
                          <td className="px-2 py-2"><span className="rounded border border-emerald-700/60 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">{x.status ?? 'COMPLETED'}</span></td>
                          <td className="px-2 py-2"><button type="button" onClick={(e) => { e.stopPropagation(); setSelectedTransactionId(x.id); setExpandedModalOpen(false) }} className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition">Chi tiết</button></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>,
          document.body,
        ) : null}
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
  const meta = transactionMetadata(transaction)
  const isProjectReturn = isProjectReturnTransaction(transaction)
  const totalQty = items.reduce((sum: number, line: any) => sum + Math.abs(num(line.quantity)), 0)

  return (
    <ModuleDetailDrawer
      open={open}
      title={transaction?.transactionNo ?? 'Chi tiết giao dịch'}
      subtitle={`${transactionTypeLabel(transaction)} · ${transaction?.transactionDate ? formatDateTime(transaction.transactionDate) : '-'} · ${formatQuantity(attachments.length, 0)} tài liệu`}
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
              <InfoLine label="Loại giao dịch" value={transactionTypeLabel(transaction)} />
              <InfoLine label="Đối tượng" value={transactionObjectLabel(transaction)} />
              <InfoLine label="Ngày giao dịch" value={transaction?.transactionDate ? formatDateTime(transaction.transactionDate) : '-'} />
            </div>
            {isProjectReturn ? (
              <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                <InfoLine label="Nguồn" value={`Công trình ${meta?.projectCode ?? ''}${meta?.projectName ? ` · ${meta.projectName}` : transaction?.projectName ? ` · ${transaction.projectName}` : ''}`.trim()} />
                <InfoLine label="Phiếu" value={meta?.returnNo ?? transaction?.referenceId ?? '-'} />
                <InfoLine label="Task" value={meta?.taskName ?? '-'} />
                <InfoLine label="Người trả" value={transaction?.performedBy ?? '-'} />
                <InfoLine label="Số lượng" value={`+${formatQuantity(totalQty)}`} />
                <InfoLine label="Ngày" value={transaction?.transactionDate ? formatDateTime(transaction.transactionDate) : '-'} />
              </div>
            ) : null}
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
                <button type="button" onClick={() => setActiveTab('attachments')} className={moduleMutedButton}>
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
