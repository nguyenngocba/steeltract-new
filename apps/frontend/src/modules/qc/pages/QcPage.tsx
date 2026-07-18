import { useDeferredValue, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CalendarClock, CheckCircle2, ClipboardCheck, FileBarChart, Gauge, ListChecks, RotateCcw, Search, ShieldCheck, SlidersHorizontal, XCircle, type LucideIcon } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { EnterpriseWorkspace } from '@/shared/ui/enterprise'
import { CockpitKpiCard } from '@/shared/ui/cockpit'
import { approveInspection, completeInspection, createInspection, startInspection, type QcCockpit, type QcInspectionRow, type QcProductionQueueRow } from '../api/qc.api'
import { queryKeys } from '@/lib/query/query-keys'
import { useQcDashboard, useQcWorkspace } from '../hooks/useQcWorkspace'
import { formatDateTime, formatQuantity } from '@/shared/utils/number-format'

type QcTab = 'overview' | 'inbound' | 'production' | 'final' | 'plan' | 'standards' | 'ncr' | 'capa' | 'calibration' | 'logs' | 'dashboard' | 'reports'

const tabs: Array<{ id: QcTab; label: string; path: string }> = [
  { id: 'overview', label: 'Tổng quan', path: '/qc' },
  { id: 'inbound', label: 'Kiểm tra đầu vào', path: '/qc/inbound' },
  { id: 'production', label: 'Kiểm tra sản xuất', path: '/qc/production' },
  { id: 'final', label: 'Kiểm tra xuất xưởng', path: '/qc/final' },
  { id: 'ncr', label: 'NCR', path: '/qc/ncr' },
  { id: 'capa', label: 'CAPA', path: '/qc/capa' },
  { id: 'logs', label: 'Nhật ký', path: '/qc/logs' },
  { id: 'dashboard', label: 'Dashboard', path: '/qc/dashboard' },
  { id: 'reports', label: 'Báo cáo', path: '/qc/reports' },
]
const panel = 'rounded-lg border border-white/10 bg-slate-950/55 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl'
const input = 'h-9 rounded-lg border border-white/10 bg-slate-950/65 px-3 text-xs text-slate-100 outline-none transition focus:border-blue-400'
const primaryButton = 'rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500'
const mutedButton = 'rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-200 hover:bg-white/[0.08]'
const tableHead = 'bg-white/[0.04] text-[10px] uppercase tracking-[0.12em] text-slate-400'
const tableRow = 'border-t border-white/10 text-slate-200 transition hover:bg-cyan-400/10'
const fmt = (value = 0) => formatQuantity(value, 1)
const date = (value?: string | null) => value ? formatDateTime(value) : '-'

export function QcPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selectedInspection, setSelectedInspection] = useState<QcInspectionRow | null>(null)
  const [selectedQueue, setSelectedQueue] = useState<QcProductionQueueRow | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const queryClient = useQueryClient()
  const deferredQuery = useDeferredValue(query)
  const segment = location.pathname.split('/').at(-1)
  const legacyTab = ['plan', 'standards', 'calibration'].includes(segment ?? '') ? segment as QcTab : undefined
  const tab = legacyTab ?? tabs.find((item) => item.path === location.pathname)?.id ?? 'overview'
  const { data, isLoading } = useQcWorkspace({
    page: 1,
    limit: 100,
    search: deferredQuery || undefined,
    status: status === 'all' ? undefined : status,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  })
  const { data: dashboard } = useQcDashboard(tab === 'dashboard')
  const runtime = data ?? emptyRuntime()
  const dashboardRuntime = dashboard ? {
    ...runtime,
    metrics: {
      ...runtime.metrics,
      total: dashboard.data.totalInspections,
      pending: dashboard.data.pendingCount,
      inProgress: dashboard.data.inProgressCount,
      passed: dashboard.data.passedCount,
      failed: dashboard.data.failedCount,
      rework: dashboard.data.reworkCount,
      openIssues: dashboard.data.openIssueCount,
      openNcrs: dashboard.data.openNcrCount,
      waitingProductionOrders: dashboard.data.waitingProductionCount,
      passRate: dashboard.data.passRate,
      defects: dashboard.data.payload?.defects ?? [],
    },
    trend: dashboard.data.payload?.trend ?? [],
    byCategory: [],
    byProject: [],
  } : runtime
  const filteredInspections = runtime.inspections
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.qc.workspaces() })
  const inspectionPayload = (row: QcProductionQueueRow) => ({
    productionOrderId: row.id,
    componentId: row.componentId,
    projectId: row.projectId,
    status: 'READY',
    metadata: { source: 'qc-cockpit', orderNo: row.orderNo },
  })
  const qcErrorMessage = (value: unknown) => {
    const raw = (value as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
    return Array.isArray(raw) ? raw.join(', ') : raw || 'Không thể cập nhật QC.'
  }
  const createMutation = useMutation({
    mutationFn: async (row: QcProductionQueueRow) => createInspection(inspectionPayload(row)),
    onSuccess: async (_, row) => {
      setError('')
      setNotice(`Đã tạo phiếu QC cho ${row.orderNo}.`)
      setCreateDialogOpen(false)
      navigate('/qc/production')
      await invalidate()
    },
    onError: (err) => {
      setNotice('')
      setError(qcErrorMessage(err))
    },
  })
  const startMutation = useMutation({
    mutationFn: startInspection,
    onSuccess: async () => {
      setError('')
      setNotice('Đã bắt đầu kiểm tra QC.')
      await invalidate()
    },
    onError: (err) => setError(qcErrorMessage(err)),
  })
  const passMutation = useMutation({
    mutationFn: async (id: string) => {
      await startInspection(id).catch(() => undefined)
      await completeInspection(id, 'PASSED')
      return approveInspection(id)
    },
    onSuccess: async () => {
      setError('')
      setNotice('Phiếu QC đã đạt và được duyệt. Có thể chuyển thành phẩm ra bãi.')
      await invalidate()
    },
    onError: (err) => {
      setNotice('')
      setError(qcErrorMessage(err))
    },
  })
  const failMutation = useMutation({
    mutationFn: async (id: string) => {
      await startInspection(id).catch(() => undefined)
      return completeInspection(id, 'REWORK_REQUIRED')
    },
    onSuccess: async () => {
      setError('')
      setNotice('Đã ghi nhận QC không đạt / cần xử lý NCR.')
      await invalidate()
    },
    onError: (err) => {
      setNotice('')
      setError(qcErrorMessage(err))
    },
  })
  const quickApproveMutation = useMutation({
    mutationFn: async (row: QcProductionQueueRow) => {
      const existing = runtime.inspections.find((inspection) =>
        inspection.status !== 'APPROVED' &&
        inspection.status !== 'PASSED' &&
        (inspection.productionOrderId === row.id || Boolean(row.componentId && inspection.componentId === row.componentId)),
      )
      const inspection = existing ?? await createInspection(inspectionPayload(row)) as QcInspectionRow
      await startInspection(inspection.id).catch(() => undefined)
      await completeInspection(inspection.id, 'PASSED')
      return approveInspection(inspection.id)
    },
    onSuccess: async (_, row) => {
      setError('')
      setCreateDialogOpen(false)
      setNotice(`QC của ${row.orderNo} đã đạt/duyệt. Quay lại Sản xuất để chuyển thành phẩm ra bãi.`)
      await invalidate()
    },
    onError: (err) => {
      setNotice('')
      setError(qcErrorMessage(err))
    },
  })

  return <EnterpriseWorkspace
    eyebrow="Chất lượng (QC)"
    title="Chất lượng (QC)"
    description="QC móc nối sản xuất và cấu kiện. Thành phẩm chỉ được chuyển bãi khi QC đạt hoặc đã duyệt."
    breadcrumbs={['Vận hành', 'Chất lượng']}
    tabs={tabs}
    activeTab={tab}
    actions={<><button onClick={() => setCreateDialogOpen(true)} className={primaryButton}>+ Tạo phiếu kiểm tra cấu kiện</button><button className={mutedButton}>Xuất Excel</button><button className={mutedButton}>Báo cáo</button></>}
  >
      <FilterBar query={query} status={status} onQuery={setQuery} onStatus={setStatus} />
      {notice ? <div className="mt-3 rounded border border-emerald-800 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">{notice}</div> : null}
      {error ? <div className="mt-3 rounded border border-red-800 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div> : null}
      {isLoading ? <div className={`${panel} mt-3 p-6 text-center text-sm text-slate-500`}>Đang tải QC cockpit...</div> : null}
      {(tab === 'overview' || tab === 'dashboard') && <Overview runtime={tab === 'dashboard' ? dashboardRuntime : runtime} rows={filteredInspections} queue={runtime.productionQueue} onOpen={setSelectedInspection} onQueue={setSelectedQueue} onCreate={(row) => createMutation.mutate(row)} onQuickApprove={(row) => quickApproveMutation.mutate(row)} />}
      {['inbound', 'production', 'final'].includes(tab) && <Inspections rows={filteredInspections} queue={runtime.productionQueue} onOpen={setSelectedInspection} onQueue={setSelectedQueue} onCreate={(row) => createMutation.mutate(row)} onQuickApprove={(row) => quickApproveMutation.mutate(row)} onPass={(row) => passMutation.mutate(row.id)} onFail={(row) => failMutation.mutate(row.id)} />}
      {tab === 'plan' && <Plan queue={runtime.productionQueue} onCreate={(row) => createMutation.mutate(row)} onQuickApprove={(row) => quickApproveMutation.mutate(row)} />}
      {tab === 'standards' && <Standards runtime={runtime} />}
      {tab === 'ncr' && <Ncr runtime={runtime} />}
      {tab === 'capa' && <Ncr runtime={runtime} />}
      {tab === 'calibration' && <Calibration />}
      {tab === 'logs' && <Reports runtime={runtime} />}
      {tab === 'reports' && <Reports runtime={runtime} />}
      <InspectionDetail inspection={selectedInspection} onClose={() => setSelectedInspection(null)} onStart={(id) => startMutation.mutate(id)} onPass={(id) => passMutation.mutate(id)} onFail={(id) => failMutation.mutate(id)} />
      <QueueDetail row={selectedQueue} onClose={() => setSelectedQueue(null)} onCreate={(row) => createMutation.mutate(row)} onQuickApprove={(row) => quickApproveMutation.mutate(row)} />
      <CreateInspectionDialog open={createDialogOpen} queue={runtime.productionQueue} checklists={runtime.checklists} saving={createMutation.isPending || quickApproveMutation.isPending} onClose={() => setCreateDialogOpen(false)} onCreate={(row) => createMutation.mutate(row)} onQuickApprove={(row) => quickApproveMutation.mutate(row)} />
  </EnterpriseWorkspace>
}

function CreateInspectionDialog({
  open,
  queue,
  checklists,
  saving,
  onClose,
  onCreate,
  onQuickApprove,
}: {
  open: boolean
  queue: QcProductionQueueRow[]
  checklists: QcCockpit['checklists']
  saving: boolean
  onClose: () => void
  onCreate: (row: QcProductionQueueRow) => void
  onQuickApprove: (row: QcProductionQueueRow) => void
}) {
  const pendingRows = queue.filter((row) => row.qcStatus !== 'APPROVED')
  const [orderId, setOrderId] = useState('')
  const [checklistId, setChecklistId] = useState('')
  const selected = pendingRows.find((row) => row.id === orderId) ?? pendingRows[0]

  if (!open) return null

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
    <section className="w-full max-w-4xl overflow-hidden rounded-xl border border-cyan-900 bg-[#061321] text-slate-100 shadow-2xl">
      <header className="flex items-start justify-between border-b border-slate-800 px-5 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400">QC cấu kiện</p>
          <h2 className="mt-1 text-xl font-semibold">Tạo phiếu kiểm tra cấu kiện</h2>
          <p className="mt-1 text-xs text-slate-500">Chọn MO/cấu kiện đã hoàn thành. QC đạt/duyệt sẽ mở khóa chuyển thành phẩm ra bãi tập kết.</p>
        </div>
        <button onClick={onClose} className="rounded border border-slate-700 p-2 text-slate-300"><XCircle size={16} /></button>
      </header>

      <div className="grid gap-4 p-5 lg:grid-cols-[1fr_0.85fr]">
        <div className="space-y-3">
          <label className="block text-xs text-slate-400">Lệnh sản xuất / cấu kiện
            <select value={selected?.id ?? ''} onChange={(event) => setOrderId(event.target.value)} className={`${input} mt-2 w-full`}>
              {pendingRows.map((row) => <option key={row.id} value={row.id}>{row.orderNo} · {row.componentCode} · {row.componentName}</option>)}
            </select>
          </label>
          <label className="block text-xs text-slate-400">Checklist / tiêu chuẩn
            <select value={checklistId} onChange={(event) => setChecklistId(event.target.value)} className={`${input} mt-2 w-full`}>
              <option value="">Tự động chọn checklist mặc định</option>
              {checklists.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name} · {item.type}</option>)}
            </select>
          </label>
          <div className="rounded border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-400">
            Phase này tạo phiếu kiểm tra theo MO/cấu kiện và dùng workflow nhanh `Tạo & duyệt đạt` để hoàn thiện cổng QC trước khi chuyển ra bãi. Checklist cụ thể sẽ được dùng để mở rộng nhập kết quả chi tiết ở phase sau.
          </div>
        </div>

        <div className={`${panel} p-4`}>
          <h3 className="text-sm font-semibold">Thông tin cấu kiện</h3>
          {selected ? <div className="mt-3 space-y-2">
            <Info k="MO" v={selected.orderNo} />
            <Info k="Cấu kiện" v={`${selected.componentCode} · ${selected.componentName}`} />
            <Info k="Lệnh sản xuất" v={selected.title} />
            <Info k="Trạng thái sản xuất" v={selected.status} />
            <Info k="Trạng thái QC" v={selected.qcStatus} />
            <Info k="Số phiếu QC" v={fmt(selected.inspectionCount)} />
          </div> : <Empty title="Không có MO hoàn thành đang chờ QC." />}
        </div>
      </div>

      <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-800 px-5 py-4">
        <button onClick={onClose} className="rounded border border-slate-700 px-4 py-2 text-xs text-slate-300">Hủy</button>
        <button disabled={saving || !selected} onClick={() => selected && onCreate(selected)} className="rounded border border-blue-700 px-4 py-2 text-xs text-blue-200 disabled:opacity-50">Tạo phiếu chờ kiểm</button>
        <button disabled={saving || !selected} onClick={() => selected && onQuickApprove(selected)} className="rounded bg-emerald-600 px-5 py-2 text-xs font-semibold text-white disabled:opacity-50">Tạo & duyệt đạt</button>
      </footer>
    </section>
  </div>
}

function FilterBar({ query, status, onQuery, onStatus }: { query: string; status: string; onQuery: (value: string) => void; onStatus: (value: string) => void }) {
  return <div className={`${panel} flex flex-wrap items-end gap-2 p-3`}>
    <div className="flex min-w-[320px] flex-1 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/65 px-3"><Search size={15} className="text-cyan-400" /><input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Tìm mã phiếu, MO, cấu kiện, dự án..." className="h-9 w-full bg-transparent text-xs outline-none" /></div>
    <select value={status} onChange={(e) => onStatus(e.target.value)} className={input}><option value="all">Trạng thái: Tất cả</option><option value="READY">Chờ xử lý</option><option value="IN_PROGRESS">Đang kiểm</option><option value="PASSED">Đạt</option><option value="APPROVED">Đã duyệt</option><option value="REWORK_REQUIRED">NCR/Rework</option><option value="FAILED">Không đạt</option></select>
    <button className={primaryButton}>Tìm kiếm</button><button className={mutedButton}>Làm mới</button>
  </div>
}

function Overview({ runtime, rows, queue, onOpen, onQueue, onCreate, onQuickApprove }: { runtime: QcCockpit; rows: QcInspectionRow[]; queue: QcProductionQueueRow[]; onOpen: (row: QcInspectionRow) => void; onQueue: (row: QcProductionQueueRow) => void; onCreate: (row: QcProductionQueueRow) => void; onQuickApprove: (row: QcProductionQueueRow) => void }) {
  const m = runtime.metrics
  return <div className="mt-3 space-y-4">
    <KpiStrip runtime={runtime} />
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]"><InspectionTable rows={rows.slice(0, 10)} onOpen={onOpen} /><aside className="space-y-4"><Latest rows={rows} onOpen={onOpen} /><Donut title="Thống kê theo loại kiểm tra" center={fmt(m.total)} rows={runtime.byCategory.map((r, i) => [r.category, r.count, ['bg-blue-500', 'bg-emerald-500', 'bg-amber-400', 'bg-purple-500'][i % 4]]) as any} /><NcrSummary runtime={runtime} /></aside></div>
    <div className="grid gap-4 xl:grid-cols-2"><Trend rows={runtime.trend} /><ByProject rows={runtime.byProject} /></div>
    <ProductionQueue rows={queue.slice(0, 8)} onOpen={onQueue} onCreate={onCreate} onQuickApprove={onQuickApprove} />
  </div>
}

function KpiStrip({ runtime }: { runtime: QcCockpit }) {
  const m = runtime.metrics
  return <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6"><Kpi icon={ClipboardCheck} title="Tổng phiếu kiểm tra" value={fmt(m.total)} note="Trong hệ thống" /><Kpi icon={CheckCircle2} title="Đạt" value={fmt(m.passed)} note={`${fmt(m.passRate)}%`} tone="emerald" /><Kpi icon={XCircle} title="Không đạt" value={fmt(m.failed + m.rework)} note="Rework/Failed" tone="red" /><Kpi icon={CalendarClock} title="Chờ xử lý" value={fmt(m.pending)} note="Phiếu" tone="amber" /><Kpi icon={FileBarChart} title="NCR mở" value={fmt(m.openNcrs)} note="Trong tổng số" tone="purple" /><Kpi icon={ShieldCheck} title="MO chờ QC" value={fmt(m.waitingProductionOrders)} note="Chặn xuất bãi" tone="cyan" /></div>
}

function Inspections({ rows, queue, onOpen, onQueue, onCreate, onQuickApprove, onPass, onFail }: { rows: QcInspectionRow[]; queue: QcProductionQueueRow[]; onOpen: (row: QcInspectionRow) => void; onQueue: (row: QcProductionQueueRow) => void; onCreate: (row: QcProductionQueueRow) => void; onQuickApprove: (row: QcProductionQueueRow) => void; onPass: (row: QcInspectionRow) => void; onFail: (row: QcInspectionRow) => void }) {
  return <div className="mt-3 grid gap-4 xl:grid-cols-[1fr_360px]"><InspectionTable rows={rows} onOpen={onOpen} onPass={onPass} onFail={onFail} /><aside className="space-y-4"><ProductionQueue rows={queue} onOpen={onQueue} onCreate={onCreate} onQuickApprove={onQuickApprove} compact /></aside></div>
}

function InspectionTable({ rows, onOpen, onPass, onFail }: { rows: QcInspectionRow[]; onOpen: (row: QcInspectionRow) => void; onPass?: (row: QcInspectionRow) => void; onFail?: (row: QcInspectionRow) => void }) {
  return <div className={`${panel} overflow-hidden`}><div className="flex justify-between border-b border-white/10 px-4 py-3"><h2 className="text-sm font-semibold">Danh sách phiếu kiểm tra</h2><span className="text-xs text-slate-500">{rows.length} phiếu</span></div><div className="overflow-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className={tableHead}><tr>{['Mã phiếu', 'Ngày kiểm tra', 'Dự án', 'Cấu kiện', 'MO', 'Loại kiểm tra', 'Kết quả', 'Trạng thái', 'Thao tác'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} onClick={() => onOpen(row)} className={`cursor-pointer ${tableRow}`}><td className="px-4 py-3 text-cyan-300">{row.inspectionNo}</td><td className="px-4 py-3">{date(row.date)}</td><td className="px-4 py-3">{row.projectName}</td><td className="px-4 py-3">{row.componentCode}</td><td className="px-4 py-3">{row.productionOrderNo}</td><td className="px-4 py-3">{row.category}</td><td className="px-4 py-3"><ResultBadge value={row.result} /></td><td className="px-4 py-3"><StatusBadge value={row.status} /></td><td className="px-4 py-3"><div className="flex gap-1"><button onClick={(e) => { e.stopPropagation(); onPass?.(row) }} className="rounded border border-emerald-700 px-2 py-1 text-[10px] text-emerald-300">Đạt</button><button onClick={(e) => { e.stopPropagation(); onFail?.(row) }} className="rounded border border-red-700 px-2 py-1 text-[10px] text-red-300">NCR</button></div></td></tr>)}</tbody></table></div>{!rows.length ? <Empty title="Chưa có phiếu kiểm tra." /> : null}</div>
}

function ProductionQueue({ rows, onOpen, onCreate, onQuickApprove, compact = false }: { rows: QcProductionQueueRow[]; onOpen: (row: QcProductionQueueRow) => void; onCreate: (row: QcProductionQueueRow) => void; onQuickApprove: (row: QcProductionQueueRow) => void; compact?: boolean }) {
  return <div className={`${panel} overflow-hidden`}><div className="border-b border-slate-800 px-4 py-3"><h2 className="text-sm font-semibold">MO hoàn thành chờ QC</h2></div><div className={`${compact ? 'max-h-[520px]' : 'max-h-80'} overflow-auto`}>{rows.map((row) => <div key={row.id} onClick={() => onOpen(row)} className="grid cursor-pointer grid-cols-[1fr_auto] gap-3 border-b border-slate-800 px-4 py-3 text-xs hover:bg-cyan-950/20"><span><b className="text-cyan-300">{row.orderNo}</b><span className="mt-1 block text-slate-300">{row.componentCode} · {row.componentName}</span><span className="mt-1 block text-slate-500">{row.title}</span><span className="mt-1 block text-slate-500">{row.inspectionCount} phiếu QC</span></span><span className="space-y-2 text-right"><StatusBadge value={row.qcStatus === 'APPROVED' ? 'APPROVED' : row.qcStatus === 'REWORK_REQUIRED' ? 'REWORK_REQUIRED' : 'READY'} />{row.qcStatus !== 'APPROVED' ? <><button onClick={(e) => { e.stopPropagation(); onCreate(row) }} className="block w-full rounded border border-blue-700 px-3 py-1 text-[10px] text-blue-200">Tạo QC</button><button onClick={(e) => { e.stopPropagation(); onQuickApprove(row) }} className="block w-full rounded bg-emerald-600 px-3 py-1 text-[10px] text-white">Tạo & duyệt đạt</button></> : <span className="block rounded border border-emerald-700 px-3 py-1 text-[10px] text-emerald-300">Cho phép xuất bãi</span>}</span></div>)}{!rows.length ? <Empty title="Chưa có MO hoàn thành chờ QC." /> : null}</div></div>
}

function Plan({ queue, onCreate, onQuickApprove }: { queue: QcProductionQueueRow[]; onCreate: (row: QcProductionQueueRow) => void; onQuickApprove: (row: QcProductionQueueRow) => void }) {
  return <div className="mt-3"><ProductionQueue rows={queue} onOpen={() => undefined} onCreate={onCreate} onQuickApprove={onQuickApprove} /></div>
}

function Standards({ runtime }: { runtime: QcCockpit }) {
  return <div className="mt-3 grid gap-4 xl:grid-cols-2">{runtime.checklists.map((item) => <div key={item.id} className={`${panel} p-4`}><div className="flex justify-between"><h3 className="text-sm font-semibold text-cyan-300">{item.code} · {item.name}</h3><span className="rounded bg-slate-900 px-2 py-1 text-[10px]">{item.type}</span></div><p className="mt-2 text-xs text-slate-500">Revision {item.revision} · {item.items.length} tiêu chí · {item.isActive ? 'Đang dùng' : 'Ngưng dùng'}</p></div>)}{!runtime.checklists.length ? <Empty title="Chưa có bộ tiêu chuẩn QC." /> : null}</div>
}

function Ncr({ runtime }: { runtime: QcCockpit }) {
  return <div className="mt-3 grid gap-4 xl:grid-cols-[1fr_360px]"><div className={`${panel} overflow-hidden`}><div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold">Không phù hợp (NCR)</div><table className="w-full min-w-[860px] text-left text-sm"><thead className="bg-slate-900/70 text-[10px] uppercase text-slate-500"><tr>{['NCR', 'Tiêu đề', 'Mức độ', 'Trạng thái', 'Cập nhật'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{runtime.ncrs.map((row) => <tr key={row.id} className="border-t border-slate-800"><td className="px-4 py-3 text-cyan-300">{row.ncrNo}</td><td className="px-4 py-3">{row.title}</td><td className="px-4 py-3">{row.severity}</td><td className="px-4 py-3">{row.status}</td><td className="px-4 py-3">{date(row.updatedAt)}</td></tr>)}</tbody></table>{!runtime.ncrs.length ? <Empty title="Chưa có NCR." /> : null}</div><NcrSummary runtime={runtime} /></div>
}

function Calibration() {
  return <div className="mt-3 grid gap-4 xl:grid-cols-3">{['Máy đo kích thước', 'Máy siêu âm UT', 'Máy đo sơn phủ', 'Cân tải trọng', 'Thước đo laser', 'Thiết bị đo độ thẳng'].map((name, index) => <div key={name} className={`${panel} p-4`}><Gauge className="text-cyan-300" size={22} /><h3 className="mt-3 text-sm font-semibold">{name}</h3><p className="mt-2 text-xs text-slate-500">Trạng thái hiệu chuẩn: {index % 4 === 0 ? 'Sắp hết hạn' : 'Còn hiệu lực'}</p><Progress value={index % 4 === 0 ? 78 : 42} /></div>)}</div>
}

function Reports({ runtime }: { runtime: QcCockpit }) {
  return <div className="mt-3 space-y-4"><KpiStrip runtime={runtime} /><div className="grid gap-4 xl:grid-cols-3"><Trend rows={runtime.trend} /><ByProject rows={runtime.byProject} /><Donut title="Cơ cấu lỗi theo mức độ" center={fmt(runtime.metrics.openIssues)} rows={runtime.metrics.defects.map((d, i) => [d.severity, d._count, ['bg-red-500', 'bg-amber-400', 'bg-blue-500'][i % 3]]) as any} /></div></div>
}

function Latest({ rows, onOpen }: { rows: QcInspectionRow[]; onOpen: (row: QcInspectionRow) => void }) {
  const latest = rows[0]
  return <div className={`${panel} p-4`}><div className="flex justify-between"><h3 className="text-sm font-semibold">Phiếu kiểm tra mới nhất</h3><button className="text-xs text-cyan-300">Xem tất cả</button></div>{latest ? <button onClick={() => onOpen(latest)} className="mt-3 w-full rounded border border-slate-800 p-3 text-left text-xs hover:border-cyan-600"><div className="flex justify-between"><b className="text-cyan-300">{latest.inspectionNo}</b><StatusBadge value={latest.status} /></div><div className="mt-3 grid grid-cols-2 gap-2 text-slate-400"><span>Dự án</span><span className="text-right text-slate-200">{latest.projectName}</span><span>Cấu kiện</span><span className="text-right text-slate-200">{latest.componentCode}</span><span>Kết quả</span><span className="text-right"><ResultBadge value={latest.result} /></span><span>Tỷ lệ đạt</span><span className="text-right text-emerald-300">{fmt(latest.passRate)}%</span></div></button> : <Empty title="Chưa có phiếu kiểm tra." />}</div>
}

function NcrSummary({ runtime }: { runtime: QcCockpit }) {
  return <div className={`${panel} p-4`}><h3 className="text-sm font-semibold">NCR (Không phù hợp)</h3><div className="mt-3 space-y-2 text-xs"><Info k="NCR mở" v={fmt(runtime.metrics.openNcrs)} /><Info k="Issue mở" v={fmt(runtime.metrics.openIssues)} /><Info k="Không đạt/Rework" v={fmt(runtime.metrics.failed + runtime.metrics.rework)} /></div><div className="mt-4 rounded bg-red-950/30 p-4 text-center text-red-300"><AlertTriangle className="mx-auto" /></div></div>
}

function Trend({ rows }: { rows: QcCockpit['trend'] }) {
  const max = Math.max(1, ...rows.flatMap((row) => [row.passed, row.failed]))
  return <div className={`${panel} p-4`}><h3 className="text-sm font-semibold">Xu hướng kết quả QC</h3>{rows.length ? <div className="mt-4 grid h-48 items-end gap-3 border-b border-l border-slate-800 px-3 pb-3" style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(24px, 1fr))` }}>{rows.map((row) => <div key={row.date} className="flex flex-col items-center gap-2"><div className="w-6 rounded-t bg-emerald-500" style={{ height: `${Math.max(4, (row.passed / max) * 120)}px` }} /><div className="w-6 rounded-t bg-red-500" style={{ height: `${Math.max(4, (row.failed / max) * 120)}px` }} /><span className="text-[10px] text-slate-500">{row.date.slice(8, 10)}/{row.date.slice(5, 7)}</span></div>)}</div> : <Empty title="Chưa có dữ liệu lịch sử" />}</div>
}

function ByProject({ rows }: { rows: QcCockpit['byProject'] }) {
  return <div className={`${panel} p-4`}><h3 className="text-sm font-semibold">Thống kê theo dự án</h3><div className="mt-4 space-y-3">{rows.slice(0, 7).map((row) => <div key={row.projectName} className="grid grid-cols-[130px_1fr_70px] items-center gap-3 text-xs"><span className="truncate">{row.projectName}</span><Progress value={row.passRate} /><span className="text-right text-slate-400">{row.passed}/{row.total}</span></div>)}{!rows.length ? <p className="text-xs text-slate-500">Chưa có dữ liệu dự án.</p> : null}</div></div>
}

function Kpi({ icon: Icon, title, value, note, tone = 'cyan' }: { icon: LucideIcon; title: string; value: string; note: string; tone?: 'cyan' | 'emerald' | 'red' | 'amber' | 'purple' }) {
  return <CockpitKpiCard title={title} value={value} note={note} tone={tone} icon={<Icon size={18} />} />
}

function Donut({ title, center, rows }: { title: string; center: string; rows: Array<[string, number, string]> }) {
  return <div className={`${panel} p-4`}><h3 className="text-sm font-semibold">{title}</h3><div className="mt-4 grid grid-cols-[120px_1fr] items-center gap-4"><div className="grid aspect-square place-items-center rounded-full bg-[conic-gradient(#2563eb_0_38%,#10b981_38%_66%,#f59e0b_66%_84%,#8b5cf6_84%_100%)] p-4"><div className="grid h-full w-full place-items-center rounded-full bg-slate-950 text-center"><div><div className="text-xl font-semibold">{center}</div><div className="text-xs text-slate-500">Tổng</div></div></div></div><div className="space-y-2">{rows.map(([label, value, color]) => <div key={label} className="flex justify-between gap-2 text-xs"><span className="flex items-center gap-2"><i className={`h-2 w-2 rounded-full ${color}`} />{label}</span><b>{fmt(value)}</b></div>)}</div></div></div>
}

function InspectionDetail({ inspection, onClose, onStart, onPass, onFail }: { inspection: QcInspectionRow | null; onClose: () => void; onStart: (id: string) => void; onPass: (id: string) => void; onFail: (id: string) => void }) {
  if (!inspection) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><section className="w-full max-w-4xl rounded border border-cyan-900 bg-[#061321] p-5"><div className="flex justify-between"><div><p className="text-xs text-cyan-300">{inspection.inspectionNo}</p><h2 className="mt-1 text-xl font-semibold">{inspection.componentCode} · {inspection.componentName}</h2></div><button onClick={onClose}><XCircle /></button></div><div className="mt-5 grid gap-3 md:grid-cols-2"><Info k="Dự án" v={inspection.projectName} /><Info k="MO" v={inspection.productionOrderNo} /><Info k="Loại kiểm tra" v={inspection.category} /><Info k="Checklist" v={inspection.checklistName} /><Info k="Kết quả" v={inspection.result} /><Info k="Trạng thái" v={inspection.status} /></div><div className="mt-5 flex justify-end gap-2"><button onClick={() => onStart(inspection.id)} className="rounded border border-slate-700 px-4 py-2 text-xs">Bắt đầu</button><button onClick={() => onFail(inspection.id)} className="rounded bg-red-600 px-4 py-2 text-xs">Không đạt / NCR</button><button onClick={() => onPass(inspection.id)} className="rounded bg-emerald-600 px-4 py-2 text-xs">Chấm đạt & duyệt</button></div></section></div>
}

function QueueDetail({ row, onClose, onCreate, onQuickApprove }: { row: QcProductionQueueRow | null; onClose: () => void; onCreate: (row: QcProductionQueueRow) => void; onQuickApprove: (row: QcProductionQueueRow) => void }) {
  if (!row) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><section className="w-full max-w-3xl rounded border border-cyan-900 bg-[#061321] p-5"><div className="flex justify-between"><div><p className="text-xs text-cyan-300">{row.orderNo}</p><h2 className="mt-1 text-xl font-semibold">{row.componentCode} · {row.componentName}</h2></div><button onClick={onClose}><XCircle /></button></div><div className="mt-5 space-y-2 text-sm"><Info k="Lệnh sản xuất" v={row.title} /><Info k="Trạng thái sản xuất" v={row.status} /><Info k="Trạng thái QC" v={row.qcStatus} /><Info k="Số phiếu QC" v={fmt(row.inspectionCount)} /></div><div className="mt-5 rounded border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-400">Khi QC đạt/đã duyệt, lệnh sản xuất này sẽ được mở khóa bước chuyển thành phẩm ra bãi tập kết.</div><div className="mt-5 flex justify-end gap-2"><button onClick={() => onCreate(row)} className="rounded border border-blue-700 px-4 py-2 text-xs text-blue-200">Tạo phiếu QC</button><button onClick={() => onQuickApprove(row)} className="rounded bg-emerald-600 px-4 py-2 text-xs font-semibold text-white">Tạo & duyệt đạt</button></div></section></div>
}

function StatusBadge({ value }: { value: string }) {
  const tone = ['APPROVED', 'PASSED'].includes(value) ? 'bg-emerald-950 text-emerald-300' : ['FAILED', 'REWORK_REQUIRED', 'REJECTED'].includes(value) ? 'bg-red-950 text-red-300' : value === 'IN_PROGRESS' ? 'bg-blue-950 text-blue-300' : 'bg-amber-950 text-amber-300'
  return <span className={`rounded px-2 py-1 text-[10px] ${tone}`}>{value}</span>
}

function ResultBadge({ value }: { value: string }) {
  const tone = value === 'PASS' ? 'text-emerald-300' : value === 'FAIL' ? 'text-red-300' : 'text-amber-300'
  return <span className={tone}>{value}</span>
}

function Progress({ value }: { value: number }) {
  return <span className="block h-2 rounded bg-slate-800"><i className="block h-full rounded bg-emerald-500" style={{ width: `${Math.max(4, Math.min(100, value))}%` }} /></span>
}

function Info({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-4 rounded border border-slate-800 px-3 py-2 text-xs"><span className="text-slate-500">{k}</span><span className="text-right text-slate-200">{v}</span></div>
}

function Empty({ title }: { title: string }) {
  return <div className="p-8 text-center text-sm text-slate-500">{title}</div>
}

function emptyRuntime(): QcCockpit {
  return { metrics: { total: 0, pending: 0, inProgress: 0, passed: 0, failed: 0, rework: 0, overdue: 0, openIssues: 0, openNcrs: 0, waitingProductionOrders: 0, passRate: 0, defects: [] }, inspections: [], productionQueue: [], checklists: [], ncrs: [], byCategory: [], byProject: [], trend: [], meta: { page: 1, limit: 100, total: 0, totalPages: 1 } }
}
