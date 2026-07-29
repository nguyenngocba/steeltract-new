import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CalendarClock, CheckCircle2, ClipboardCheck, Clock, Download, FileBarChart, FileText, Gauge, ListChecks, Printer, RotateCcw, Search, ShieldCheck, SlidersHorizontal, X, XCircle, type LucideIcon } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import { EnterpriseWorkspace } from '@/shared/ui/enterprise'
import { EnterpriseModulePage } from '@/shared/runtime-tabs/EnterpriseModulePage'
import { CockpitChartCard, CockpitEmptyState, CockpitKpiCard, CockpitRecentList, CockpitStatusList, CockpitTableShell, DataTablePagination, EnterpriseKpiCard } from '@/shared/ui/cockpit'
import {
  EnterprisePanel,
  enterpriseTableHead as tableHead,
  enterpriseTableRow as tableRow,
} from '@/shared/ui/enterprise-components'
import {
  moduleInput,
  modulePanel,
  modulePrimaryButton,
} from '@/shared/ui/modules'
import { approveInspection, completeInspection, createInspection, startInspection, type QcCockpit, type QcComponentInstance, type QcInspectionRow, type QcProductionQueueRow } from '../api/qc.api'
import { queryKeys } from '@/lib/query/query-keys'
import {
  useCreateCanonicalNcr,
  useFailFinalInspection,
  useMarkNcrRework,
  useMarkNcrScrap,
  useMarkNcrUseAsIs,
  usePassFinalInspection,
  useQcComponentInstances,
  useQcDashboard,
  useQcInspectionDetail,
  useQcWorkspace,
} from '../hooks/useQcWorkspace'
import { formatDateTime, formatQuantity } from '@/shared/utils/number-format'
import { useQCActions } from '../context/QCActionContext'

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
const panel = modulePanel
const input = moduleInput
const primaryButton = modulePrimaryButton
const pageSizeOptions = [10, 20, 50, 100]
const fmt = (value = 0) => formatQuantity(value, 1)
const date = (value?: string | null) => value ? formatDateTime(value) : '-'

export function QcPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selectedInspection, setSelectedInspection] = useState<QcInspectionRow | null>(null)
  const [selectedQueue, setSelectedQueue] = useState<QcProductionQueueRow | null>(null)
  const { createDialogOpen, closeCreateInspection } = useQCActions()
  const [inspectionPage, setInspectionPage] = useState(1)
  const [inspectionPageSize, setInspectionPageSize] = useState(20)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const queryClient = useQueryClient()
  const deferredQuery = useDeferredValue(query)
  const segment = location.pathname.split('/').at(-1)
  const legacyTab = ['plan', 'standards', 'calibration'].includes(segment ?? '') ? segment as QcTab : undefined
  const tab = legacyTab ?? tabs.find((item) => item.path === location.pathname)?.id ?? 'overview'
  const { data, isLoading } = useQcWorkspace({
    page: inspectionPage,
    limit: inspectionPageSize,
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
  useEffect(() => {
    setInspectionPage(1)
  }, [deferredQuery, status, tab, inspectionPageSize])
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
      closeCreateInspection()
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
      closeCreateInspection()
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
  >
      {notice ? <div className="mt-3 rounded border border-emerald-800 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">{notice}</div> : null}
      {error ? <div className="mt-3 rounded border border-red-800 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div> : null}
      {isLoading ? <div className={`${panel} mt-3 p-6 text-center text-sm text-slate-500`}>Đang tải QC cockpit...</div> : null}
      {(tab === 'overview' || tab === 'dashboard') && <Overview runtime={tab === 'dashboard' ? dashboardRuntime : runtime} rows={filteredInspections} queue={runtime.productionQueue} onOpen={setSelectedInspection} onQueue={setSelectedQueue} onCreate={(row) => createMutation.mutate(row)} onQuickApprove={(row) => quickApproveMutation.mutate(row)} />}
      {tab === 'inbound' && <InputInspectionTab runtime={runtime} rows={filteredInspections} onOpen={setSelectedInspection} />}
      {tab === 'production' && <ProductionInspectionTab runtime={runtime} rows={filteredInspections} onOpen={setSelectedInspection} />}
      {tab === 'final' && <OutgoingInspectionTab runtime={runtime} />}
      {tab === 'plan' && <Plan queue={runtime.productionQueue} onCreate={(row) => createMutation.mutate(row)} onQuickApprove={(row) => quickApproveMutation.mutate(row)} />}
      {tab === 'standards' && <Standards runtime={runtime} />}
      {tab === 'ncr' && <NcrTab runtime={runtime} />}
      {tab === 'capa' && <CapaTab runtime={runtime} />}
      {tab === 'calibration' && <Calibration />}
      {tab === 'logs' && <AuditLogsTab runtime={runtime} />}
      {tab === 'reports' && <ReportsTab runtime={runtime} />}
      <InspectionDetail inspection={selectedInspection} onClose={() => setSelectedInspection(null)} onStart={(id) => startMutation.mutate(id)} onPass={(id) => passMutation.mutate(id)} onFail={(id) => failMutation.mutate(id)} />
      <QueueDetail row={selectedQueue} onClose={() => setSelectedQueue(null)} onCreate={(row) => createMutation.mutate(row)} onQuickApprove={(row) => quickApproveMutation.mutate(row)} />
      <CreateInspectionDialog open={createDialogOpen} queue={runtime.productionQueue} checklists={runtime.checklists} saving={createMutation.isPending || quickApproveMutation.isPending} onClose={closeCreateInspection} onCreate={(row) => createMutation.mutate(row)} onQuickApprove={(row) => quickApproveMutation.mutate(row)} />
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
  </div>
}

function StatusMiniBars({ rows }: { rows: Array<[string, number]> }) {
  const max = Math.max(1, ...rows.map(([, v]) => v))
  return (
    <div className="space-y-2 text-xs pt-1">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[100px_1fr_40px] items-center gap-2">
          <span className="truncate text-slate-400">{label}</span>
          <div className="h-2 w-full rounded bg-slate-800/80 overflow-hidden">
            <div className="h-full bg-cyan-400 rounded" style={{ width: `${(value / max) * 100}%` }} />
          </div>
          <span className="text-right font-mono font-semibold text-cyan-300">{value}</span>
        </div>
      ))}
    </div>
  )
}

function Overview({
  runtime,
  rows,
  queue,
  onOpen,
  onQueue,
  onCreate,
  onQuickApprove,
}: {
  runtime: QcCockpit
  rows: QcInspectionRow[]
  queue: QcProductionQueueRow[]
  onOpen: (row: QcInspectionRow) => void
  onQueue: (row: QcProductionQueueRow) => void
  onCreate: (row: QcProductionQueueRow) => void
  onQuickApprove: (row: QcProductionQueueRow) => void
}) {
  const navigate = useNavigate()
  const m = runtime.metrics
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [inspectorFilter, setInspectorFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)

  const filteredInspections = useMemo(() => {
    return rows.filter((r) => {
      const cat = r.category || 'PRODUCTION'
      const inspector = r.inspectorId || 'QC Inspector'
      if (search.trim()) {
        const query = search.toLowerCase()
        const match =
          r.inspectionNo.toLowerCase().includes(query) ||
          r.componentCode.toLowerCase().includes(query) ||
          r.componentName.toLowerCase().includes(query) ||
          r.projectName?.toLowerCase().includes(query) ||
          inspector.toLowerCase().includes(query)
        if (!match) return false
      }
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (typeFilter !== 'all' && cat !== typeFilter) return false
      if (projectFilter !== 'all' && r.projectId !== projectFilter) return false
      if (inspectorFilter !== 'all' && inspector !== inspectorFilter) return false
      return true
    })
  }, [rows, search, statusFilter, typeFilter, projectFilter, inspectorFilter])

  const pagedInspections = filteredInspections.slice((page - 1) * pageSize, page * pageSize)
  useEffect(() => setPage(1), [search, statusFilter, typeFilter, projectFilter, inspectorFilter, pageSize])

  const projects = useMemo(() => {
    const map = new Map<string, string>()
    rows.forEach((r) => {
      if (r.projectId && r.projectName) map.set(r.projectId, r.projectName)
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [rows])

  const inspectors = useMemo(() => {
    const set = new Set<string>()
    rows.forEach((r) => {
      const ins = r.inspectorId || 'QC Inspector'
      set.add(ins)
    })
    return Array.from(set)
  }, [rows])

  return (
    <div className="w-full min-w-0 flex-1 space-y-1">
      {/* Phase 1: 6 Enterprise KPI Cards */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard
          title="Tổng phiếu QC"
          value={formatQuantity(m.total, 0)}
          tone="blue"
          icon={<ClipboardCheck size={15} />}
        />
        <EnterpriseKpiCard
          title="Chờ kiểm tra"
          value={formatQuantity(m.pending, 0)}
          tone="amber"
          icon={<Clock size={15} />}
        />
        <EnterpriseKpiCard
          title="Đạt"
          value={formatQuantity(m.passed, 0)}
          tone="emerald"
          icon={<CheckCircle2 size={15} />}
        />
        <EnterpriseKpiCard
          title="Không đạt"
          value={formatQuantity(m.failed + m.rework, 0)}
          tone="red"
          icon={<XCircle size={15} />}
        />
        <EnterpriseKpiCard
          title="Đang xử lý NCR"
          value={formatQuantity(m.openNcrs, 0)}
          tone="purple"
          icon={<AlertTriangle size={15} />}
        />
        <EnterpriseKpiCard
          title="Tỷ lệ Pass"
          value={`${fmt(m.passRate)}%`}
          tone="emerald"
          icon={<ShieldCheck size={15} />}
        />
      </div>

      {/* Phase 2: Analytics Dashboard */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-4">
        <CockpitChartCard title="Pass / Fail" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars
            rows={[
              ['Đạt (Pass)', m.passed],
              ['Chờ xử lý', m.pending],
              ['Đang kiểm', m.inProgress],
              ['Không đạt / NCR', m.failed + m.rework],
            ]}
          />
        </CockpitChartCard>
        <CockpitChartCard title="Defect Trend" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitStatusList
            items={[
              { id: '1', label: 'Tỷ lệ QC Đạt', value: `${fmt(m.passRate)}%`, statusTone: 'emerald' },
              { id: '2', label: 'Tổng loại lỗi phát sinh', value: `${m.defects?.length ?? 0} loại lỗi`, statusTone: 'amber' },
              { id: '3', label: 'NCR đang xử lý', value: `${m.openNcrs} ncr`, statusTone: 'purple' },
            ]}
          />
        </CockpitChartCard>
        <CockpitChartCard title="QC theo công đoạn" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars
            rows={[
              ['Đầu vào', rows.filter((r) => r.category === 'INBOUND').length],
              ['Sản xuất', rows.filter((r) => !r.category || r.category === 'PRODUCTION').length],
              ['Xuất xưởng', rows.filter((r) => r.category === 'FINAL').length],
            ]}
          />
        </CockpitChartCard>
        <CockpitChartCard title="Top Defects" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitRecentList
            items={(m.defects ?? []).slice(0, 5).map((d, i) => ({
              id: `def-${i}`,
              title: d.severity || `Lỗi Mức #${i + 1}`,
              subtitle: `Trạng thái: ${d.status || 'Đang xử lý'}`,
              time: `${d._count ?? 1} vụ`,
              statusDot: 'bg-red-400',
            }))}
            emptyMessage="Chưa ghi nhận lỗi phát sinh."
          />
        </CockpitChartCard>
      </div>

      {/* Phase 3: Compact Toolbar */}
      <EnterprisePanel className="rounded-xl -mt-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_160px_160px_160px_160px_100px_100px]">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã phiếu QC, cấu kiện, dự án, người kiểm..."
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="READY">Chờ xử lý</option>
            <option value="IN_PROGRESS">Đang kiểm</option>
            <option value="PASSED">Đạt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REWORK_REQUIRED">NCR/Rework</option>
            <option value="FAILED">Không đạt</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="all">Tất cả công đoạn</option>
            <option value="INBOUND">Kiểm tra đầu vào</option>
            <option value="PRODUCTION">Kiểm tra sản xuất</option>
            <option value="FINAL">Kiểm tra xuất xưởng</option>
          </select>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="all">Tất cả dự án</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={inspectorFilter}
            onChange={(e) => setInspectorFilter(e.target.value)}
            className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="all">Tất cả người kiểm</option>
            {inspectors.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {}}
            className="h-9 self-end rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
          >
            Tìm kiếm
          </button>
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setStatusFilter('all')
              setTypeFilter('all')
              setProjectFilter('all')
              setInspectorFilter('all')
            }}
            className="h-9 self-end rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Làm mới
          </button>
        </div>
      </EnterprisePanel>

      {/* Phase 4: Hero Table */}
      <div className="grid grid-cols-1 gap-1 xl:grid-cols-[2fr_1fr]">
        <EnterprisePanel className="rounded-xl">
          <div className="mb-1 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Danh sách phiếu kiểm tra QC</h3>
              <span className="rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-300 border border-blue-400/20">
                {filteredInspections.length} phiếu QC
              </span>
            </div>
            <button
              type="button"
              onClick={() => setExpandedModalOpen(true)}
              className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition"
            >
              Xem tất cả
            </button>
          </div>

          <div className="h-[520px] overflow-auto scrollbar-none rounded-lg border border-white/10">
            <table className="w-full min-w-[1000px] table-fixed text-sm border-collapse">
              <thead
                className={`${tableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
              >
                <tr>
                  {['Mã phiếu', 'Cấu kiện', 'Dự án', 'Công đoạn', 'Người kiểm tra', 'Ngày kiểm', 'Kết quả', 'Trạng thái', 'Thao tác'].map((heading) => (
                    <th key={heading} className="px-2 py-2 text-xs font-semibold text-slate-300 text-left">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedInspections.map((row) => (
                  <tr key={row.id} onClick={() => onOpen(row)} className={`${tableRow} cursor-pointer`}>
                    <td className="px-2 py-2 font-mono font-semibold text-cyan-300 text-xs">{row.inspectionNo}</td>
                    <td className="px-2 py-2 text-white font-medium truncate">{row.componentCode} · {row.componentName}</td>
                    <td className="px-2 py-2 text-slate-300 text-xs truncate">{row.projectName || '-'}</td>
                    <td className="px-2 py-2 text-slate-300 text-xs truncate">{row.category === 'INBOUND' ? 'Đầu vào' : row.category === 'FINAL' ? 'Xuất xưởng' : 'Sản xuất'}</td>
                    <td className="px-2 py-2 text-cyan-400 text-xs truncate">{row.inspectorId || 'QC Inspector'}</td>
                    <td className="px-2 py-2 text-slate-300 text-xs truncate">{date(row.date)}</td>
                    <td className="px-2 py-2 text-xs font-semibold">
                      <span className={row.result === 'PASS' ? 'text-emerald-300' : row.result === 'FAIL' ? 'text-red-300' : 'text-slate-400'}>
                        {row.result || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <QcStatusBadge status={row.status} />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpen(row)
                        }}
                        className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
                {!pagedInspections.length ? (
                  <tr>
                    <td colSpan={9} className="px-2 py-10">
                      <CockpitEmptyState
                        title="Chưa có phiếu kiểm tra QC"
                        description="Không tìm thấy phiếu QC phù hợp."
                        icon={<ClipboardCheck size={18} />}
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <DataTablePagination page={page} pageSize={pageSize} total={filteredInspections.length} onPageChange={setPage} />
        </EnterprisePanel>

        <div className="space-y-1">
          <QualityAlerts
            inspections={rows.filter((r) => ['READY', 'IN_PROGRESS', 'FAILED', 'REWORK_REQUIRED'].includes(r.status)).slice(0, 4)}
            queue={queue.filter((r) => r.qcStatus !== 'APPROVED').slice(0, 4)}
            onOpen={onOpen}
            onQueue={onQueue}
          />
          <ProductionQueue
            rows={queue.slice(0, 5)}
            onOpen={onQueue}
            onCreate={onCreate}
            onQuickApprove={onQuickApprove}
            compact
            action={<button type="button" onClick={() => navigate('/qc/plan')} className="text-xs font-medium text-cyan-300 hover:text-cyan-200">Xem tất cả</button>}
          />
        </div>
      </div>

      {/* Phase 5: EXPANDED TABLE MODAL */}
      {expandedModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">Toàn bộ danh sách phiếu kiểm tra QC</h2>
                    <p className="text-xs text-slate-400">Tổng cộng {filteredInspections.length} phiếu QC</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedModalOpen(false)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                  >
                    Đóng
                  </button>
                </div>

                <div className="h-[640px] overflow-y-auto rounded-xl border border-white/10">
                  <table className="w-full min-w-[1000px] text-xs table-fixed border-collapse">
                    <thead
                      className={`${tableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                      style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                    >
                      <tr>
                        {['Mã phiếu', 'Cấu kiện', 'Dự án', 'Công đoạn', 'Người kiểm tra', 'Ngày kiểm', 'Kết quả', 'Trạng thái', 'Thao tác'].map((heading) => (
                          <th key={heading} className="px-2 py-2 text-left font-semibold text-slate-300">
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInspections.map((row) => (
                        <tr
                          key={row.id}
                          onClick={() => {
                            onOpen(row)
                            setExpandedModalOpen(false)
                          }}
                          className={`${tableRow} cursor-pointer`}
                        >
                          <td className="px-2 py-2 font-mono font-semibold text-cyan-300">{row.inspectionNo}</td>
                          <td className="px-2 py-2 text-white font-medium truncate">{row.componentCode} · {row.componentName}</td>
                          <td className="px-2 py-2 text-slate-300 truncate">{row.projectName || '-'}</td>
                          <td className="px-2 py-2 text-slate-300 truncate">{row.category === 'INBOUND' ? 'Đầu vào' : row.category === 'FINAL' ? 'Xuất xưởng' : 'Sản xuất'}</td>
                          <td className="px-2 py-2 text-cyan-400 truncate">{row.inspectorId || 'QC Inspector'}</td>
                          <td className="px-2 py-2 text-slate-300 truncate">{date(row.date)}</td>
                          <td className="px-2 py-2 font-semibold">
                            <span className={row.result === 'PASS' ? 'text-emerald-300' : row.result === 'FAIL' ? 'text-red-300' : 'text-slate-400'}>
                              {row.result || 'PENDING'}
                            </span>
                          </td>
                          <td className="px-2 py-2"><QcStatusBadge status={row.status} /></td>
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                onOpen(row)
                                setExpandedModalOpen(false)
                              }}
                              className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition"
                            >
                              Chi tiết
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function QcStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; tone: string }> = {
    READY: { label: 'Chờ xử lý', tone: 'bg-amber-400/10 text-amber-300 border-amber-400/20' },
    IN_PROGRESS: { label: 'Đang kiểm', tone: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20' },
    PASSED: { label: 'Đạt', tone: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20' },
    APPROVED: { label: 'Đã duyệt', tone: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20' },
    REWORK_REQUIRED: { label: 'NCR/Rework', tone: 'bg-purple-400/10 text-purple-300 border-purple-400/20' },
    FAILED: { label: 'Không đạt', tone: 'bg-red-400/10 text-red-300 border-red-400/20' },
  }
  const item = map[status] ?? { label: status, tone: 'bg-slate-400/10 text-slate-300 border-slate-400/20' }
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${item.tone}`}>
      {item.label}
    </span>
  )
}

function QualityAlerts({
  inspections,
  queue,
  onOpen,
  onQueue,
}: {
  inspections: QcInspectionRow[]
  queue: QcProductionQueueRow[]
  onOpen: (row: QcInspectionRow) => void
  onQueue: (row: QcProductionQueueRow) => void
}) {
  const hasAlerts = inspections.length > 0 || queue.length > 0
  return <div className={`${panel} p-4`}>
    <div className="flex items-center justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold text-white">Quality alerts</h2>
        <p className="mt-1 text-xs text-slate-500">Ưu tiên kiểm tra cấu kiện, NCR/rework và MO đang chặn xuất bãi.</p>
      </div>
      <span className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300">{inspections.length + queue.length} cần xem</span>
    </div>
    {hasAlerts ? (
      <div className="mt-3 grid gap-2 xl:grid-cols-2">
        <div className="space-y-2">
          {inspections.map((row) => (
            <button key={row.id} type="button" onClick={() => onOpen(row)} className="grid w-full grid-cols-[1fr_auto] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-left text-xs hover:border-red-400/35 hover:bg-white/[0.06]">
              <span className="min-w-0">
                <span className="block truncate font-semibold text-cyan-300">{row.inspectionNo}</span>
                <span className="block truncate text-slate-400">{row.componentCode} · {row.projectName}</span>
              </span>
              <span className="rounded border border-red-400/30 bg-red-500/10 px-2 py-0.5 text-red-300">{row.status}</span>
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {queue.map((row) => (
            <button key={row.id} type="button" onClick={() => onQueue(row)} className="grid w-full grid-cols-[1fr_auto] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-left text-xs hover:border-amber-400/35 hover:bg-white/[0.06]">
              <span className="min-w-0">
                <span className="block truncate font-semibold text-cyan-300">{row.orderNo}</span>
                <span className="block truncate text-slate-400">{row.componentCode} · {row.componentName}</span>
              </span>
              <span className="rounded border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-amber-300">Chờ QC</span>
            </button>
          ))}
        </div>
      </div>
    ) : <Empty title="Không có cảnh báo QC đang mở." />}
  </div>
}

function KpiStrip({ runtime, rows = [] }: { runtime: QcCockpit; rows?: QcInspectionRow[] }) {
  const m = runtime.metrics
  const visibleRows = rows.length ? `Đang xem ${fmt(rows.length)} phiếu` : 'Không có dòng phù hợp'
  return <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6"><Kpi icon={ClipboardCheck} title="Pending inspection" value={fmt(m.pending)} note="Chờ xử lý" tone="amber" /><Kpi icon={SlidersHorizontal} title="In progress" value={fmt(m.inProgress)} note="Đang kiểm" /><Kpi icon={CheckCircle2} title="Passed" value={fmt(m.passed)} note={`${fmt(m.passRate)}% pass rate`} tone="emerald" /><Kpi icon={XCircle} title="Failed / Rework" value={fmt(m.failed + m.rework)} note="Cần xử lý" tone="red" /><Kpi icon={FileBarChart} title="NCR mở" value={fmt(m.openNcrs)} note={visibleRows} tone="purple" /><Kpi icon={ShieldCheck} title="MO chờ QC" value={fmt(m.waitingProductionOrders)} note="Chặn xuất bãi" tone="cyan" /></div>
}

function Inspections({
  rows,
  queue,
  meta,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onOpen,
  onQueue,
  onCreate,
  onQuickApprove,
  onPass,
  onFail,
}: {
  rows: QcInspectionRow[]
  queue: QcProductionQueueRow[]
  meta: QcCockpit['meta']
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onOpen: (row: QcInspectionRow) => void
  onQueue: (row: QcProductionQueueRow) => void
  onCreate: (row: QcProductionQueueRow) => void
  onQuickApprove: (row: QcProductionQueueRow) => void
  onPass: (row: QcInspectionRow) => void
  onFail: (row: QcInspectionRow) => void
}) {
  return <div className="mt-3 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]"><InspectionTable rows={rows} meta={meta} page={page} pageSize={pageSize} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} onOpen={onOpen} onPass={onPass} onFail={onFail} paginated /><aside className="space-y-4"><ProductionQueue rows={queue} onOpen={onQueue} onCreate={onCreate} onQuickApprove={onQuickApprove} compact /></aside></div>
}

function InspectionTable({
  rows,
  onOpen,
  onPass,
  onFail,
  title = 'Danh sách phiếu kiểm tra',
  action,
  meta,
  page = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  paginated = false,
}: {
  rows: QcInspectionRow[]
  onOpen: (row: QcInspectionRow) => void
  onPass?: (row: QcInspectionRow) => void
  onFail?: (row: QcInspectionRow) => void
  title?: string
  action?: ReactNode
  meta?: QcCockpit['meta']
  page?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  paginated?: boolean
}) {
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
  const total = paginated ? meta?.total ?? rows.length : rows.length

  return (
    <EnterprisePanel className="flex min-h-[580px] flex-col rounded-xl p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">{title}</h3>
          <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-400/20">
            {fmt(total)} phiếu QC
          </span>
        </div>
        <div className="flex items-center gap-3">
          {action}
          <button
            type="button"
            onClick={() => setExpandedModalOpen(true)}
            className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition"
          >
            Xem tất cả
          </button>
        </div>
      </div>

      <div className="h-[430px] overflow-auto scrollbar-none rounded-lg border border-white/10">
        <table className="w-full min-w-[980px] text-xs table-fixed border-collapse">
          <thead
            className={`${tableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
            style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
          >
            <tr>
              {['Mã phiếu', 'Ngày kiểm tra', 'Dự án', 'Cấu kiện', 'MO', 'Loại kiểm tra', 'Kết quả', 'Trạng thái', 'Thao tác'].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-semibold text-slate-300">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} onClick={() => onOpen(row)} className={`cursor-pointer ${tableRow}`}>
                <td className="px-3 py-2 text-cyan-300 font-mono font-semibold">{row.inspectionNo}</td>
                <td className="px-3 py-2 text-slate-300 font-mono text-xs">{date(row.date)}</td>
                <td className="px-3 py-2 text-slate-300 font-mono">{row.projectName}</td>
                <td className="px-3 py-2 text-white font-medium">{row.componentCode}</td>
                <td className="px-3 py-2 text-slate-300 font-mono">{row.productionOrderNo}</td>
                <td className="px-3 py-2 text-slate-300">{row.category}</td>
                <td className="px-3 py-2"><ResultBadge value={row.result} /></td>
                <td className="px-3 py-2"><StatusBadge value={row.status} /></td>
                <td className="px-3 py-2">
                  <div className="flex gap-1.5">
                    <button type="button" onClick={(e) => { e.stopPropagation(); onPass?.(row) }} className="rounded border border-emerald-700/60 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-900/50">Đạt</button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onFail?.(row) }} className="rounded border border-red-700/60 bg-red-950/40 px-2 py-0.5 text-[10px] font-semibold text-red-300 hover:bg-red-900/50">NCR</button>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={9} className="px-3 py-10">
                  <Empty title="Chưa có phiếu kiểm tra." />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {paginated && total > pageSize && onPageChange && onPageSizeChange ? (
        <DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} pageSizeOptions={pageSizeOptions} />
      ) : null}

      {/* EXPANDED TABLE MODAL */}
      {expandedModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">Toàn bộ danh sách phiếu kiểm tra QC</h2>
                    <p className="text-xs text-slate-400">Tổng cộng {total} phiếu kiểm tra trong hệ thống</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedModalOpen(false)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                  >
                    Đóng
                  </button>
                </div>

                <div className="h-[640px] overflow-y-auto rounded-xl border border-white/10">
                  <table className="w-full min-w-[980px] text-xs table-fixed border-collapse">
                    <thead
                      className={`${tableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                      style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                    >
                      <tr>
                        {['Mã phiếu', 'Ngày kiểm tra', 'Dự án', 'Cấu kiện', 'MO', 'Loại kiểm tra', 'Kết quả', 'Trạng thái', 'Thao tác'].map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-semibold text-slate-300">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr
                          key={row.id}
                          onClick={() => {
                            onOpen(row)
                            setExpandedModalOpen(false)
                          }}
                          className={`${tableRow} cursor-pointer`}
                        >
                          <td className="px-3 py-2 text-cyan-300 font-mono font-semibold">{row.inspectionNo}</td>
                          <td className="px-3 py-2 text-slate-300 font-mono text-xs">{date(row.date)}</td>
                          <td className="px-3 py-2 text-slate-300 font-mono">{row.projectName}</td>
                          <td className="px-3 py-2 text-white font-medium">{row.componentCode}</td>
                          <td className="px-3 py-2 text-slate-300 font-mono">{row.productionOrderNo}</td>
                          <td className="px-3 py-2 text-slate-300">{row.category}</td>
                          <td className="px-3 py-2"><ResultBadge value={row.result} /></td>
                          <td className="px-3 py-2"><StatusBadge value={row.status} /></td>
                          <td className="px-3 py-2">
                            <div className="flex gap-1.5">
                              <button type="button" onClick={(e) => { e.stopPropagation(); onPass?.(row); setExpandedModalOpen(false) }} className="rounded border border-emerald-700/60 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Đạt</button>
                              <button type="button" onClick={(e) => { e.stopPropagation(); onFail?.(row); setExpandedModalOpen(false) }} className="rounded border border-red-700/60 bg-red-950/40 px-2 py-0.5 text-[10px] font-semibold text-red-300">NCR</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {paginated && total > pageSize && onPageChange && onPageSizeChange ? (
                  <DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} pageSizeOptions={pageSizeOptions} />
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </EnterprisePanel>
  )
}

function ProductionQueue({ rows, onOpen, onCreate, onQuickApprove, compact = false, action }: { rows: QcProductionQueueRow[]; onOpen: (row: QcProductionQueueRow) => void; onCreate: (row: QcProductionQueueRow) => void; onQuickApprove: (row: QcProductionQueueRow) => void; compact?: boolean; action?: ReactNode }) {
  return <div className={`${panel} overflow-hidden`}><div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3"><h2 className="text-sm font-semibold">MO hoàn thành chờ QC</h2>{action}</div><div className={`${compact ? 'max-h-[520px]' : 'max-h-80'} overflow-auto`}>{rows.map((row) => <div key={row.id} onClick={() => onOpen(row)} className="grid cursor-pointer grid-cols-[1fr_auto] gap-3 border-b border-slate-800 px-4 py-3 text-xs hover:bg-cyan-950/20"><span><b className="text-cyan-300">{row.orderNo}</b><span className="mt-1 block text-slate-300">{row.componentCode} · {row.componentName}</span><span className="mt-1 block text-slate-500">{row.title}</span><span className="mt-1 block text-slate-500">{row.inspectionCount} phiếu QC</span></span><span className="space-y-2 text-right"><StatusBadge value={row.qcStatus === 'APPROVED' ? 'APPROVED' : row.qcStatus === 'REWORK_REQUIRED' ? 'REWORK_REQUIRED' : 'READY'} />{row.qcStatus !== 'APPROVED' ? <><button onClick={(e) => { e.stopPropagation(); onCreate(row) }} className="block w-full rounded border border-blue-700 px-3 py-1 text-[10px] text-blue-200">Tạo QC</button><button onClick={(e) => { e.stopPropagation(); onQuickApprove(row) }} className="block w-full rounded bg-emerald-600 px-3 py-1 text-[10px] text-white">Tạo & duyệt đạt</button></> : <span className="block rounded border border-emerald-700 px-3 py-1 text-[10px] text-emerald-300">Cho phép xuất bãi</span>}</span></div>)}{!rows.length ? <Empty title="Chưa có MO hoàn thành chờ QC." /> : null}</div></div>
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
  return <div className="mt-3"><div className={`${panel} p-6`}><Gauge className="text-cyan-300" size={22} /><h2 className="mt-3 text-sm font-semibold">Hiệu chuẩn thiết bị</h2><p className="mt-2 max-w-2xl text-sm text-slate-500">Chưa có dữ liệu hiệu chuẩn thiết bị từ backend QC. Trang này giữ trạng thái rỗng có kiểm soát thay vì dựng danh sách thiết bị giả.</p></div></div>
}

function Reports({ runtime }: { runtime: QcCockpit }) {
  return <div className="mt-3 space-y-4"><KpiStrip runtime={runtime} /><div className="grid gap-4 xl:grid-cols-3"><Trend rows={runtime.trend} /><ByProject rows={runtime.byProject} /><Donut title="Cơ cấu lỗi theo mức độ" center={fmt(runtime.metrics.openIssues)} rows={runtime.metrics.defects.map((d, i) => [d.severity, d._count, ['bg-red-500', 'bg-amber-400', 'bg-blue-500'][i % 3]]) as any} /></div></div>
}

function Latest({ rows, onOpen }: { rows: QcInspectionRow[]; onOpen: (row: QcInspectionRow) => void }) {
  const navigate = useNavigate()
  const latest = rows[0]
  return <div className={`${panel} p-4`}><div className="flex justify-between"><h3 className="text-sm font-semibold">Phiếu kiểm tra mới nhất</h3><button type="button" onClick={() => navigate('/qc/production')} className="text-xs text-cyan-300 hover:text-cyan-200">Xem tất cả</button></div>{latest ? <button onClick={() => onOpen(latest)} className="mt-3 w-full rounded border border-slate-800 p-3 text-left text-xs hover:border-cyan-600"><div className="flex justify-between"><b className="text-cyan-300">{latest.inspectionNo}</b><StatusBadge value={latest.status} /></div><div className="mt-3 grid grid-cols-2 gap-2 text-slate-400"><span>Dự án</span><span className="text-right text-slate-200">{latest.projectName}</span><span>Cấu kiện</span><span className="text-right text-slate-200">{latest.componentCode}</span><span>Kết quả</span><span className="text-right"><ResultBadge value={latest.result} /></span><span>Tỷ lệ đạt</span><span className="text-right text-emerald-300">{fmt(latest.passRate)}%</span></div></button> : <Empty title="Chưa có phiếu kiểm tra." />}</div>
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

function Kpi({ icon: Icon, title, value, note, tone = 'cyan', trend }: { icon: LucideIcon; title: string; value: string; note: string; tone?: 'cyan' | 'emerald' | 'red' | 'amber' | 'purple'; trend?: number[] }) {
  return <CockpitKpiCard title={title} value={value} note={note} tone={tone} icon={<Icon size={18} />} trend={trend} />
}

function Donut({ title, center, rows }: { title: string; center: string; rows: Array<[string, number, string]> }) {
  return <div className={`${panel} p-4`}><h3 className="text-sm font-semibold">{title}</h3><div className="mt-4 grid grid-cols-[120px_1fr] items-center gap-4"><div className="grid aspect-square place-items-center rounded-full bg-[conic-gradient(#2563eb_0_38%,#10b981_38%_66%,#f59e0b_66%_84%,#8b5cf6_84%_100%)] p-4"><div className="grid h-full w-full place-items-center rounded-full bg-slate-950 text-center"><div><div className="text-xl font-semibold">{center}</div><div className="text-xs text-slate-500">Tổng</div></div></div></div><div className="space-y-2">{rows.map(([label, value, color]) => <div key={label} className="flex justify-between gap-2 text-xs"><span className="flex items-center gap-2"><i className={`h-2 w-2 rounded-full ${color}`} />{label}</span><b>{fmt(value)}</b></div>)}</div></div></div>
}

function InspectionDetail({ inspection, onClose, onStart, onPass, onFail }: { inspection: QcInspectionRow | null; onClose: () => void; onStart: (id: string) => void; onPass: (id: string) => void; onFail: (id: string) => void }) {
  if (!inspection) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <section className="flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-cyan-900 bg-[#061321] shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div><p className="text-[10px] uppercase tracking-[0.18em] text-cyan-300">{inspection.inspectionNo}</p><h2 className="mt-1 text-lg font-semibold text-white">{inspection.componentCode} · {inspection.componentName}</h2></div>
        <button onClick={onClose} className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:border-cyan-500 hover:text-white"><XCircle size={16} /></button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <Info k="Dự án" v={inspection.projectName} />
          <Info k="MO" v={inspection.productionOrderNo} />
          <Info k="Loại kiểm tra" v={inspection.category} />
          <Info k="Checklist" v={inspection.checklistName} />
          <Info k="Kết quả" v={inspection.result} />
          <Info k="Trạng thái" v={inspection.status} />
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-4">
        <button onClick={() => onStart(inspection.id)} className="rounded-lg border border-slate-700 px-5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/5">Bắt đầu</button>
        <button onClick={() => onFail(inspection.id)} className="rounded-lg border border-red-500/40 bg-red-500/10 px-5 py-2.5 text-xs font-semibold text-red-200 hover:bg-red-500/15">Không đạt / NCR</button>
        <button onClick={() => onPass(inspection.id)} className="rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500">Chấm đạt & duyệt</button>
      </div>
    </section>
  </div>
}

function QueueDetail({ row, onClose, onCreate, onQuickApprove }: { row: QcProductionQueueRow | null; onClose: () => void; onCreate: (row: QcProductionQueueRow) => void; onQuickApprove: (row: QcProductionQueueRow) => void }) {
  if (!row) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <section className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-cyan-900 bg-[#061321] shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div><p className="text-[10px] uppercase tracking-[0.18em] text-cyan-300">{row.orderNo}</p><h2 className="mt-1 text-lg font-semibold text-white">{row.componentCode} · {row.componentName}</h2></div>
        <button onClick={onClose} className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:border-cyan-500 hover:text-white"><XCircle size={16} /></button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="space-y-2 text-sm"><Info k="Lệnh sản xuất" v={row.title} /><Info k="Trạng thái sản xuất" v={row.status} /><Info k="Trạng thái QC" v={row.qcStatus} /><Info k="Số phiếu QC" v={fmt(row.inspectionCount)} /></div>
        <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-400">Khi QC đạt/đã duyệt, lệnh sản xuất này sẽ được mở khóa bước chuyển thành phẩm ra bãi tập kết.</div>
      </div>
      <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-4">
        <button onClick={() => onCreate(row)} className="rounded-lg border border-blue-700 px-5 py-2.5 text-xs font-semibold text-blue-200 hover:bg-blue-500/10">Tạo phiếu QC</button>
        <button onClick={() => onQuickApprove(row)} className="rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500">Tạo & duyệt đạt</button>
      </div>
    </section>
  </div>
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
  return <CockpitEmptyState icon={<ClipboardCheck size={18} />} title={title} description="QC chỉ hiển thị dữ liệu thật từ backend. Khi chưa có bản ghi phù hợp, workspace giữ trạng thái rỗng có kiểm soát." />
}

function emptyRuntime(): QcCockpit {
  return { metrics: { total: 0, pending: 0, inProgress: 0, passed: 0, failed: 0, rework: 0, overdue: 0, openIssues: 0, openNcrs: 0, waitingProductionOrders: 0, passRate: 0, defects: [] }, inspections: [], productionQueue: [], checklists: [], ncrs: [], byCategory: [], byProject: [], trend: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } }
}

function InputInspectionTab({
  runtime,
  rows,
  onOpen,
}: {
  runtime: QcCockpit
  rows: QcInspectionRow[]
  onOpen: (row: QcInspectionRow) => void
}) {
  const m = runtime.metrics
  const inboundRows = rows.filter((r) => r.category === 'INBOUND')
  const [search, setSearch] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [materialFilter, setMaterialFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [inspectorFilter, setInspectorFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
  const inspectors = useMemo(() => Array.from(new Set(inboundRows.map((row) => row.inspectorId).filter(Boolean))) as string[], [inboundRows])

  const filtered = useMemo(() => {
    return inboundRows.filter((r) => {
      const query = search.toLowerCase()
      if (
        query &&
        !r.inspectionNo.toLowerCase().includes(query) &&
        !r.componentCode.toLowerCase().includes(query) &&
        !r.componentName.toLowerCase().includes(query)
      ) {
        return false
      }
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (inspectorFilter !== 'all' && (r.inspectorId || 'QC Admin') !== inspectorFilter) return false
      return true
    })
  }, [inboundRows, search, statusFilter, inspectorFilter])

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="w-full min-w-0 flex-1 space-y-1 mt-1">
      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard title="Chờ kiểm tra" value={formatQuantity(m.pending, 0)} tone="amber" icon={<Clock size={15} />} />
        <EnterpriseKpiCard title="Đạt" value={formatQuantity(m.passed, 0)} tone="emerald" icon={<CheckCircle2 size={15} />} />
        <EnterpriseKpiCard title="Không đạt" value={formatQuantity(m.failed, 0)} tone="red" icon={<XCircle size={15} />} />
        <EnterpriseKpiCard title="Chờ NCR" value={formatQuantity(m.openNcrs, 0)} tone="purple" icon={<AlertTriangle size={15} />} />
        <EnterpriseKpiCard title="Quá hạn" value={formatQuantity(m.overdue || 0, 0)} tone="red" icon={<CalendarClock size={15} />} />
        <EnterpriseKpiCard title="Pass Rate" value={`${fmt(m.passRate)}%`} tone="emerald" icon={<ShieldCheck size={15} />} />
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-4">
        <CockpitChartCard title="Pass/Fail" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars rows={[['Đạt', m.passed], ['Chờ kiểm', m.pending], ['Không đạt', m.failed]]} />
        </CockpitChartCard>
        <CockpitChartCard title="Defect theo nhà cung cấp" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitEmptyState title="Chưa có dữ liệu nhà cung cấp" description="Backend QC chưa trả nguồn supplier cho phiếu kiểm tra đầu vào." icon={<ShieldCheck size={18} />} />
        </CockpitChartCard>
        <CockpitChartCard title="Defect theo vật tư" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars rows={Object.entries(inboundRows.reduce((map, row) => {
            const key = row.componentName || row.componentCode || 'Không xác định'
            map[key] = (map[key] ?? 0) + 1
            return map
          }, {} as Record<string, number>)).slice(0, 5)} />
        </CockpitChartCard>
        <CockpitChartCard title="Trend theo thời gian" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitStatusList items={[
            { id: '1', label: 'Tỷ lệ QC đạt', value: `${fmt(m.passRate)}%`, statusTone: 'emerald' },
            { id: '2', label: 'Điểm dữ liệu trend', value: `${runtime.trend.length} kỳ`, statusTone: 'cyan' },
            { id: '3', label: 'Cảnh báo chất lượng mở', value: `${m.openNcrs} ncr`, statusTone: 'purple' },
          ]} />
        </CockpitChartCard>
      </div>

      {/* Toolbar */}
      <EnterprisePanel className="rounded-xl -mt-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_160px_160px_160px_160px_160px_100px_100px]">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm vật tư, nhà cung cấp, mã lô..."
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
            />
          </div>

          <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none">
            <option value="all">Tất cả NCC</option>
            <option value="unavailable" disabled>Chưa có dữ liệu NCC</option>
          </select>
          <select value={materialFilter} onChange={(e) => setMaterialFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none">
            <option value="all">Tất cả vật tư</option>
            <option value="unavailable" disabled>Chưa có dữ liệu Material Master</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none">
            <option value="all">Tất cả trạng thái</option>
            <option value="READY">Chờ xử lý</option>
            <option value="PASSED">Đạt</option>
            <option value="FAILED">Không đạt</option>
          </select>
          <select value={inspectorFilter} onChange={(e) => setInspectorFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none">
            <option value="all">Tất cả người kiểm</option>
            {inspectors.map((inspector) => <option key={inspector} value={inspector}>{inspector}</option>)}
          </select>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none">
            <option value="all">Tất cả thời gian</option>
          </select>

          <button type="button" onClick={() => {}} className="h-9 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-500 transition">Tìm kiếm</button>
          <button type="button" onClick={() => { setSearch(''); setSupplierFilter('all'); setMaterialFilter('all'); setStatusFilter('all'); setInspectorFilter('all'); setDateFilter('all') }} className="h-9 rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 hover:bg-white/10 transition">Làm mới</button>
        </div>
      </EnterprisePanel>

      {/* Hero Table */}
      <EnterprisePanel className="rounded-xl">
        <div className="mb-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Kiểm tra đầu vào (Inbound QC)</h3>
            <span className="rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-300 border border-blue-400/20">{filtered.length} phiếu</span>
          </div>
          <button type="button" onClick={() => setExpandedModalOpen(true)} className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition">Xem tất cả</button>
        </div>

        <div className="h-[520px] overflow-auto scrollbar-none rounded-lg border border-white/10">
          <table className="w-full min-w-[1000px] table-fixed text-sm border-collapse">
            <thead className={`${tableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`} style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}>
              <tr>
                {['Mã phiếu', 'Nhà cung cấp', 'Vật tư / Quy cách', 'Số lượng kiểm', 'Người kiểm', 'Ngày kiểm', 'Kết quả', 'Trạng thái', 'Thao tác'].map((h) => (
                  <th key={h} className="px-2 py-2 text-xs font-semibold text-slate-300 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((row) => (
                <tr key={row.id} onClick={() => onOpen(row)} className={`${tableRow} cursor-pointer`}>
                  <td className="px-2 py-2 font-mono font-semibold text-cyan-300 text-xs">{row.inspectionNo}</td>
                  <td className="px-2 py-2 text-white font-medium truncate">-</td>
                  <td className="px-2 py-2 text-slate-300 text-xs truncate">{row.componentCode} · {row.componentName}</td>
                  <td className="px-2 py-2 font-mono text-cyan-400 text-xs">-</td>
                  <td className="px-2 py-2 text-cyan-400 text-xs truncate">{row.inspectorId || '-'}</td>
                  <td className="px-2 py-2 text-slate-300 text-xs truncate">{date(row.date)}</td>
                  <td className="px-2 py-2 text-xs font-semibold"><span className={row.result === 'PASS' ? 'text-emerald-300' : 'text-slate-400'}>{row.result || 'PENDING'}</span></td>
                  <td className="px-2 py-2"><QcStatusBadge status={row.status} /></td>
                  <td className="px-2 py-2"><button type="button" onClick={(e) => { e.stopPropagation(); onOpen(row) }} className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition">Chi tiết</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DataTablePagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
      </EnterprisePanel>

      {/* Expanded Modal */}
      {expandedModalOpen ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Toàn bộ danh sách kiểm tra đầu vào</h2>
                <p className="text-xs text-slate-400">Tổng cộng {filtered.length} phiếu</p>
              </div>
              <button type="button" onClick={() => setExpandedModalOpen(false)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition">Đóng</button>
            </div>
            <div className="h-[640px] overflow-y-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[1000px] text-xs table-fixed border-collapse">
                <thead className={`${tableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`} style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}>
                  <tr>
                    {['Mã phiếu', 'Nhà cung cấp', 'Vật tư / Quy cách', 'Số lượng kiểm', 'Người kiểm', 'Ngày kiểm', 'Kết quả', 'Trạng thái', 'Thao tác'].map((h) => (
                      <th key={h} className="px-2 py-2 text-left font-semibold text-slate-300">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id} onClick={() => { onOpen(row); setExpandedModalOpen(false) }} className={`${tableRow} cursor-pointer`}>
                      <td className="px-2 py-2 font-mono font-semibold text-cyan-300">{row.inspectionNo}</td>
                      <td className="px-2 py-2 text-white font-medium truncate">-</td>
                      <td className="px-2 py-2 text-slate-300 truncate">{row.componentCode} · {row.componentName}</td>
                      <td className="px-2 py-2 font-mono text-cyan-400">-</td>
                      <td className="px-2 py-2 text-cyan-400 truncate">{row.inspectorId || '-'}</td>
                      <td className="px-2 py-2 text-slate-300 truncate">{date(row.date)}</td>
                      <td className="px-2 py-2 font-semibold"><span className={row.result === 'PASS' ? 'text-emerald-300' : 'text-slate-400'}>{row.result || 'PENDING'}</span></td>
                      <td className="px-2 py-2"><QcStatusBadge status={row.status} /></td>
                      <td className="px-2 py-2"><button type="button" onClick={(e) => { e.stopPropagation(); onOpen(row); setExpandedModalOpen(false) }} className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition">Chi tiết</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  )
}

function ProductionInspectionTab({
  runtime,
  rows,
  onOpen,
}: {
  runtime: QcCockpit
  rows: QcInspectionRow[]
  onOpen: (row: QcInspectionRow) => void
}) {
  const m = runtime.metrics
  const prodRows = rows
  const [search, setSearch] = useState('')
  const [lineFilter, setLineFilter] = useState('all')
  const [processFilter, setProcessFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [inspectorFilter, setInspectorFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
  const inspectors = useMemo(() => Array.from(new Set(prodRows.map((row) => row.inspectorId).filter(Boolean))) as string[], [prodRows])

  const filtered = useMemo(() => {
    return prodRows.filter((r) => {
      const query = search.toLowerCase()
      if (
        query &&
        !r.inspectionNo.toLowerCase().includes(query) &&
        !r.componentCode.toLowerCase().includes(query) &&
        !r.componentName.toLowerCase().includes(query)
      ) {
        return false
      }
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (inspectorFilter !== 'all' && r.inspectorId !== inspectorFilter) return false
      return true
    })
  }, [prodRows, search, statusFilter, inspectorFilter])

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="w-full min-w-0 flex-1 space-y-1 mt-1">
      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard title="Chờ kiểm tra" value={formatQuantity(m.pending, 0)} tone="amber" icon={<Clock size={15} />} />
        <EnterpriseKpiCard title="Đạt" value={formatQuantity(m.passed, 0)} tone="emerald" icon={<CheckCircle2 size={15} />} />
        <EnterpriseKpiCard title="Không đạt" value={formatQuantity(m.failed, 0)} tone="red" icon={<XCircle size={15} />} />
        <EnterpriseKpiCard title="Chờ NCR" value={formatQuantity(m.openNcrs, 0)} tone="purple" icon={<AlertTriangle size={15} />} />
        <EnterpriseKpiCard title="Quá hạn" value={formatQuantity(m.overdue || 0, 0)} tone="red" icon={<CalendarClock size={15} />} />
        <EnterpriseKpiCard title="Pass Rate" value={`${fmt(m.passRate)}%`} tone="emerald" icon={<ShieldCheck size={15} />} />
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-4">
        <CockpitChartCard title="Defect theo công đoạn" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars rows={Object.entries(prodRows.reduce((map, row) => {
            const key = row.category || 'PRODUCTION'
            map[key] = (map[key] ?? 0) + 1
            return map
          }, {} as Record<string, number>)).slice(0, 5)} />
        </CockpitChartCard>
        <CockpitChartCard title="Pass Rate theo Line" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitEmptyState title="Chưa có dữ liệu line" description="Backend QC chưa trả line/work center cho inspection sản xuất." icon={<Gauge size={18} />} />
        </CockpitChartCard>
        <CockpitChartCard title="NCR theo Line" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitEmptyState title="Chưa có dữ liệu NCR theo line" description="NCR hiện chưa có trường line/work center authoritative." icon={<AlertTriangle size={18} />} />
        </CockpitChartCard>
        <CockpitChartCard title="Rework Trend" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitRecentList
            items={runtime.ncrs.slice(0, 5).map((ncr) => ({
              id: ncr.id,
              title: ncr.ncrNo,
              subtitle: ncr.title,
              time: ncr.status,
              statusDot: 'bg-amber-400',
            }))}
            emptyMessage="Chưa có NCR/rework sản xuất."
          />
        </CockpitChartCard>
      </div>

      {/* Toolbar */}
      <EnterprisePanel className="rounded-xl -mt-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_160px_160px_160px_160px_100px_100px]">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã phiếu, công đoạn, cấu kiện, ca..."
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
            />
          </div>

          <select value={lineFilter} onChange={(e) => setLineFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none">
            <option value="all">Tất cả Line</option>
            <option value="unavailable" disabled>Chưa có dữ liệu line</option>
          </select>
          <select value={processFilter} onChange={(e) => setProcessFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none">
            <option value="all">Tất cả công đoạn</option>
            <option value="unavailable" disabled>Chưa có dữ liệu công đoạn</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none">
            <option value="all">Tất cả trạng thái</option>
            <option value="READY">Chờ xử lý</option>
            <option value="PASSED">Đạt</option>
            <option value="FAILED">Không đạt</option>
          </select>
          <select value={inspectorFilter} onChange={(e) => setInspectorFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none">
            <option value="all">Tất cả người kiểm</option>
            {inspectors.map((inspector) => <option key={inspector} value={inspector}>{inspector}</option>)}
          </select>

          <button type="button" onClick={() => {}} className="h-9 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-500 transition">Tìm kiếm</button>
          <button type="button" onClick={() => { setSearch(''); setLineFilter('all'); setProcessFilter('all'); setStatusFilter('all'); setInspectorFilter('all') }} className="h-9 rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 hover:bg-white/10 transition">Làm mới</button>
        </div>
      </EnterprisePanel>

      {/* Hero Table */}
      <EnterprisePanel className="rounded-xl">
        <div className="mb-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Kiểm tra sản xuất (Production QC)</h3>
            <span className="rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-300 border border-blue-400/20">{filtered.length} phiếu</span>
          </div>
          <button type="button" onClick={() => setExpandedModalOpen(true)} className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition">Xem tất cả</button>
        </div>

        <div className="h-[520px] overflow-auto scrollbar-none rounded-lg border border-white/10">
          <table className="w-full min-w-[1000px] table-fixed text-sm border-collapse">
            <thead className={`${tableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`} style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}>
              <tr>
                {['Mã phiếu', 'Công đoạn', 'Cấu kiện', 'Ca sản xuất', 'Người kiểm', 'Kết quả', 'NCR', 'Trạng thái', 'Thao tác'].map((h) => (
                  <th key={h} className="px-2 py-2 text-xs font-semibold text-slate-300 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((row) => (
                <tr key={row.id} onClick={() => onOpen(row)} className={`${tableRow} cursor-pointer`}>
                  <td className="px-2 py-2 font-mono font-semibold text-cyan-300 text-xs">{row.inspectionNo}</td>
                  <td className="px-2 py-2 text-slate-300 text-xs truncate">{row.category || 'PRODUCTION'}</td>
                  <td className="px-2 py-2 text-white font-medium truncate">{row.componentCode} · {row.componentName}</td>
                  <td className="px-2 py-2 text-slate-300 text-xs truncate">-</td>
                  <td className="px-2 py-2 text-cyan-400 text-xs truncate">{row.inspectorId || '-'}</td>
                  <td className="px-2 py-2 text-xs font-semibold"><span className={row.result === 'PASS' ? 'text-emerald-300' : 'text-slate-400'}>{row.result || 'PENDING'}</span></td>
                  <td className="px-2 py-2 text-xs font-mono text-purple-300">{row.ncrCount ? `${row.ncrCount} NCR` : '-'}</td>
                  <td className="px-2 py-2"><QcStatusBadge status={row.status} /></td>
                  <td className="px-2 py-2"><button type="button" onClick={(e) => { e.stopPropagation(); onOpen(row) }} className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition">Chi tiết</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DataTablePagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
      </EnterprisePanel>

      {/* Expanded Modal */}
      {expandedModalOpen ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Toàn bộ danh sách kiểm tra sản xuất</h2>
                <p className="text-xs text-slate-400">Tổng cộng {filtered.length} phiếu</p>
              </div>
              <button type="button" onClick={() => setExpandedModalOpen(false)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition">Đóng</button>
            </div>
            <div className="h-[640px] overflow-y-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[1000px] text-xs table-fixed border-collapse">
                <thead className={`${tableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`} style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}>
                  <tr>
                    {['Mã phiếu', 'Công đoạn', 'Cấu kiện', 'Ca sản xuất', 'Người kiểm', 'Kết quả', 'NCR', 'Trạng thái', 'Thao tác'].map((h) => (
                      <th key={h} className="px-2 py-2 text-left font-semibold text-slate-300">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id} onClick={() => { onOpen(row); setExpandedModalOpen(false) }} className={`${tableRow} cursor-pointer`}>
                      <td className="px-2 py-2 font-mono font-semibold text-cyan-300">{row.inspectionNo}</td>
                      <td className="px-2 py-2 text-slate-300 truncate">{row.category || 'PRODUCTION'}</td>
                      <td className="px-2 py-2 text-white font-medium truncate">{row.componentCode} · {row.componentName}</td>
                      <td className="px-2 py-2 text-slate-300 truncate">-</td>
                      <td className="px-2 py-2 text-cyan-400 truncate">{row.inspectorId || '-'}</td>
                      <td className="px-2 py-2 font-semibold"><span className={row.result === 'PASS' ? 'text-emerald-300' : 'text-slate-400'}>{row.result || 'PENDING'}</span></td>
                      <td className="px-2 py-2 font-mono text-purple-300">{row.ncrCount ? `${row.ncrCount} NCR` : '-'}</td>
                      <td className="px-2 py-2"><QcStatusBadge status={row.status} /></td>
                      <td className="px-2 py-2"><button type="button" onClick={(e) => { e.stopPropagation(); onOpen(row); setExpandedModalOpen(false) }} className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition">Chi tiết</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  )
}

function OutgoingInspectionTab({ runtime }: { runtime: QcCockpit }) {
  const { data: waitingReadModel } = useQcComponentInstances({ state: 'PRODUCED_WAITING_QC', limit: 100 }, true)
  const waitingInstances = waitingReadModel?.data ?? []
  const passFinal = usePassFinalInspection()
  const failFinal = useFailFinalInspection()
  const createNcr = useCreateCanonicalNcr()
  const markRework = useMarkNcrRework()
  const markScrap = useMarkNcrScrap()
  const markUseAsIs = useMarkNcrUseAsIs()
  const queryClient = useQueryClient()
  const finalChecklist = runtime.checklists.find((item) => item.type === 'FINAL' && item.isActive) ?? runtime.checklists.find((item) => item.type === 'FINAL')
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
  const [selectedInstance, setSelectedInstance] = useState<QcComponentInstance | null>(null)
  const [localError, setLocalError] = useState('')
  const [localNotice, setLocalNotice] = useState('')
  const finalRows = runtime.inspections.filter((row) => row.category === 'FINAL')
  const passedCount = finalRows.filter((row) => ['PASSED', 'APPROVED'].includes(row.status)).length
  const failedCount = finalRows.filter((row) => ['FAILED', 'REWORK_REQUIRED', 'REJECTED'].includes(row.status)).length
  const reworkCount = waitingInstances.filter((instance) => instance.state === 'REWORK').length
  const scrapCount = finalRows.filter((row) => row.result === 'FAIL').length
  const projects = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>()
    waitingInstances.forEach((instance) => {
      if (instance.projectId && instance.project) map.set(instance.projectId, { id: instance.projectId, label: `${instance.project.code} - ${instance.project.name}` })
    })
    return Array.from(map.values())
  }, [waitingInstances])

  const filtered = useMemo(() => {
    return waitingInstances.filter((instance) => {
      const query = search.toLowerCase()
      if (
        query &&
        !instance.instanceNo.toLowerCase().includes(query) &&
        !(instance.component?.code ?? '').toLowerCase().includes(query) &&
        !(instance.component?.name ?? '').toLowerCase().includes(query) &&
        !(instance.project?.name ?? '').toLowerCase().includes(query) &&
        !(instance.productionOrder?.orderNo ?? '').toLowerCase().includes(query)
      ) {
        return false
      }
      if (projectFilter !== 'all' && instance.projectId !== projectFilter) return false
      if (statusFilter !== 'all' && instance.state !== statusFilter) return false
      return true
    })
  }, [projectFilter, search, statusFilter, waitingInstances])

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  useEffect(() => setPage(1), [search, projectFilter, statusFilter, pageSize])

  const qcErrorMessage = (value: unknown) => {
    const raw = (value as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message
    return Array.isArray(raw) ? raw.join(', ') : raw || (value instanceof Error ? value.message : 'Không thể cập nhật QC thành phẩm.')
  }

  async function createFinalInspection(instance: QcComponentInstance) {
    if (!finalChecklist) {
      throw new Error('Chưa có checklist FINAL đang hoạt động cho QC thành phẩm.')
    }
    return createInspection({
      checklistId: finalChecklist?.id,
      componentInstanceId: instance.id,
      status: 'READY',
      metadata: {
        source: 'qc-final-component-instance',
        instanceNo: instance.instanceNo,
        productionOrderId: instance.productionOrderId,
      },
    }) as Promise<QcInspectionRow>
  }

  async function passInstance(instance: QcComponentInstance) {
    setLocalError('')
    setLocalNotice('')
    try {
      const inspection = await createFinalInspection(instance)
      await passFinal.mutateAsync({ id: inspection.id, expectedVersion: 0 })
      setLocalNotice(`${instance.instanceNo} đã đạt QC và đủ điều kiện thành phẩm.`)
      await queryClient.invalidateQueries({ queryKey: queryKeys.qc.all })
    } catch (error) {
      setLocalError(qcErrorMessage(error))
    }
  }

  async function failInstance(instance: QcComponentInstance) {
    setLocalError('')
    setLocalNotice('')
    try {
      const inspection = await createFinalInspection(instance)
      await failFinal.mutateAsync({ id: inspection.id, expectedVersion: 0 })
      await createNcr.mutateAsync({
        inspectionId: inspection.id,
        payload: {
          expectedVersion: 1,
          title: `Không đạt QC cuối cho ${instance.instanceNo}`,
          description: 'Phiếu NCR được tạo từ UI QC physical instance.',
          severity: 'HIGH',
          defectCode: 'FINAL_QC_FAIL',
          reasonCode: 'FINAL_INSPECTION',
        },
      })
      setLocalNotice(`${instance.instanceNo} không đạt QC. NCR đã được tạo và cấu kiện không vào Finished Goods.`)
      await queryClient.invalidateQueries({ queryKey: queryKeys.qc.all })
    } catch (error) {
      setLocalError(qcErrorMessage(error))
    }
  }

  return (
    <div className="w-full min-w-0 flex-1 space-y-1 mt-1">
      {localNotice ? <div className="rounded border border-emerald-800 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">{localNotice}</div> : null}
      {localError ? <div className="rounded border border-red-800 bg-red-950/30 px-4 py-3 text-sm text-red-200">{localError}</div> : null}
      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard title="Chờ QC" value={formatQuantity(waitingInstances.length, 0)} tone="amber" icon={<Clock size={15} />} />
        <EnterpriseKpiCard title="Đạt QC" value={formatQuantity(passedCount, 0)} tone="emerald" icon={<CheckCircle2 size={15} />} />
        <EnterpriseKpiCard title="Không đạt" value={formatQuantity(failedCount, 0)} tone="red" icon={<XCircle size={15} />} />
        <EnterpriseKpiCard title="Làm lại" value={formatQuantity(reworkCount, 0)} tone="purple" icon={<RotateCcw size={15} />} />
        <EnterpriseKpiCard title="Loại bỏ" value={formatQuantity(scrapCount, 0)} tone="red" icon={<AlertTriangle size={15} />} />
        <EnterpriseKpiCard title="Checklist Final" value={finalChecklist ? 'Sẵn sàng' : 'Thiếu'} tone={finalChecklist ? 'emerald' : 'amber'} icon={<ShieldCheck size={15} />} />
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-4">
        <CockpitChartCard title="Trạng thái physical QC" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars rows={[['Chờ QC', waitingInstances.length], ['Đã đạt', passedCount], ['Không đạt', failedCount]]} />
        </CockpitChartCard>
        <CockpitChartCard title="Lineage theo PO" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitStatusList items={[
            ...waitingInstances.slice(0, 5).map((instance) => ({
              id: instance.id,
              label: instance.productionOrder?.orderNo ?? 'Không có PO',
              value: instance.instanceNo,
              statusTone: 'amber' as const,
            })),
          ]} />
        </CockpitChartCard>
        <CockpitChartCard title="Công trình chờ QC" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars rows={projects.slice(0, 5).map((project) => [project.label, waitingInstances.filter((instance) => instance.projectId === project.id).length])} />
        </CockpitChartCard>
        <CockpitChartCard title="NCR final" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitRecentList
            items={runtime.ncrs.filter((ncr) => ncr.componentInstanceId).slice(0, 5).map((ncr) => ({
              id: ncr.id,
              title: ncr.ncrNo,
              subtitle: ncr.title,
              time: ncr.status,
              statusDot: 'bg-red-400',
            }))}
            emptyMessage="Chưa có NCR theo cấu kiện vật lý."
          />
        </CockpitChartCard>
      </div>

      {/* Toolbar */}
      <EnterprisePanel className="rounded-xl -mt-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_160px_160px_160px_160px_100px_100px]">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã lô, dự án, khách hàng..."
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
            />
          </div>

          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none">
            <option value="all">Tất cả dự án</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.label}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none">
            <option value="all">Tất cả trạng thái</option>
            <option value="PRODUCED_WAITING_QC">Chờ QC</option>
          </select>

          <button type="button" onClick={() => {}} className="h-9 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-500 transition">Tìm kiếm</button>
          <button type="button" onClick={() => { setSearch(''); setProjectFilter('all'); setStatusFilter('all') }} className="h-9 rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 hover:bg-white/10 transition">Làm mới</button>
        </div>
      </EnterprisePanel>

      {/* Hero Table */}
      <EnterprisePanel className="rounded-xl">
        <div className="mb-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Chờ kiểm tra final theo cấu kiện vật lý</h3>
            <span className="rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-300 border border-blue-400/20">{filtered.length} cấu kiện</span>
          </div>
          <button type="button" onClick={() => setExpandedModalOpen(true)} className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition">Xem tất cả</button>
        </div>

        <div className="h-[520px] overflow-auto scrollbar-none rounded-lg border border-white/10">
          <table className="w-full min-w-[1000px] table-fixed text-sm border-collapse">
            <thead className={`${tableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`} style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}>
              <tr>
                {['Mã cấu kiện vật lý', 'Hồ sơ cấu kiện', 'Công trình', 'Production Order', 'Hoàn thành SX', 'Trạng thái', 'Thao tác'].map((h) => (
                  <th key={h} className="px-2 py-2 text-xs font-semibold text-slate-300 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((instance) => (
                <tr key={instance.id} onClick={() => setSelectedInstance(instance)} className={`${tableRow} cursor-pointer`}>
                  <td className="px-2 py-2 font-mono font-semibold text-cyan-300 text-xs">{instance.instanceNo}</td>
                  <td className="px-2 py-2 text-white font-medium truncate">{instance.component?.code} · {instance.component?.name}</td>
                  <td className="px-2 py-2 text-slate-300 text-xs truncate">{instance.project ? `${instance.project.code} - ${instance.project.name}` : '-'}</td>
                  <td className="px-2 py-2 text-cyan-400 text-xs truncate">{instance.productionOrder?.orderNo ?? '-'}</td>
                  <td className="px-2 py-2 text-slate-300 text-xs truncate">{date(instance.producedAt)}</td>
                  <td className="px-2 py-2"><QcStatusBadge status="READY" /></td>
                  <td className="px-2 py-2"><button type="button" onClick={(e) => { e.stopPropagation(); setSelectedInstance(instance) }} className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition">Kiểm tra</button></td>
                </tr>
              ))}
              {!paged.length ? <tr><td colSpan={7} className="px-2 py-10"><CockpitEmptyState title="Không có cấu kiện vật lý chờ QC" description="Chỉ ComponentInstance ở trạng thái PRODUCED_WAITING_QC mới xuất hiện tại đây." icon={<ShieldCheck size={18} />} /></td></tr> : null}
            </tbody>
          </table>
        </div>
        <DataTablePagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
      </EnterprisePanel>

      {/* Expanded Modal */}
      {expandedModalOpen ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Toàn bộ danh sách kiểm tra xuất xưởng</h2>
                <p className="text-xs text-slate-400">Tổng cộng {filtered.length} lô xuất</p>
              </div>
              <button type="button" onClick={() => setExpandedModalOpen(false)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition">Đóng</button>
            </div>
            <div className="h-[640px] overflow-y-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[1000px] text-xs table-fixed border-collapse">
                <thead className={`${tableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`} style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}>
                  <tr>
                    {['Mã cấu kiện vật lý', 'Hồ sơ cấu kiện', 'Công trình', 'Production Order', 'Hoàn thành SX', 'Trạng thái', 'Thao tác'].map((h) => (
                      <th key={h} className="px-2 py-2 text-left font-semibold text-slate-300">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((instance) => (
                    <tr key={instance.id} onClick={() => { setSelectedInstance(instance); setExpandedModalOpen(false) }} className={`${tableRow} cursor-pointer`}>
                      <td className="px-2 py-2 font-mono font-semibold text-cyan-300">{instance.instanceNo}</td>
                      <td className="px-2 py-2 text-white font-medium truncate">{instance.component?.code} · {instance.component?.name}</td>
                      <td className="px-2 py-2 text-slate-300 truncate">{instance.project ? `${instance.project.code} - ${instance.project.name}` : '-'}</td>
                      <td className="px-2 py-2 text-cyan-400 truncate">{instance.productionOrder?.orderNo ?? '-'}</td>
                      <td className="px-2 py-2 text-slate-300 truncate">{date(instance.producedAt)}</td>
                      <td className="px-2 py-2"><QcStatusBadge status="READY" /></td>
                      <td className="px-2 py-2"><button type="button" onClick={(e) => { e.stopPropagation(); setSelectedInstance(instance); setExpandedModalOpen(false) }} className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition">Kiểm tra</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
      <FinalInstanceDetail
        instance={selectedInstance}
        finalChecklist={finalChecklist}
        onClose={() => setSelectedInstance(null)}
        onPass={passInstance}
        onFail={failInstance}
        busy={passFinal.isPending || failFinal.isPending || createNcr.isPending || markRework.isPending || markScrap.isPending || markUseAsIs.isPending}
      />
    </div>
  )
}

function FinalInstanceDetail({
  instance,
  finalChecklist,
  onClose,
  onPass,
  onFail,
  busy,
}: {
  instance: QcComponentInstance | null
  finalChecklist?: QcCockpit['checklists'][number]
  onClose: () => void
  onPass: (instance: QcComponentInstance) => void
  onFail: (instance: QcComponentInstance) => void
  busy: boolean
}) {
  if (!instance) return null
  const completedExecutions = instance.executions?.filter((execution) => execution.status === 'COMPLETED') ?? []
  const latestExecution = instance.executions?.[instance.executions.length - 1]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <section className="flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-cyan-900 bg-[#061321] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400">Final QC theo cấu kiện vật lý</p>
            <h2 className="mt-1 text-lg font-semibold text-white">{instance.instanceNo}</h2>
            <p className="mt-1 text-xs text-slate-500">
              ComponentInstance vật lý, kiểm tra theo lineage sản xuất thực tế.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:border-cyan-500 hover:text-white"><XCircle size={16} /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Info k="Mã cấu kiện vật lý" v={instance.instanceNo} />
            <Info k="Hồ sơ cấu kiện" v={instance.component ? `${instance.component.code} · ${instance.component.name}` : '-'} />
            <Info k="Công trình" v={instance.project ? `${instance.project.code} - ${instance.project.name}` : '-'} />
            <Info k="Yêu cầu cấu kiện" v={instance.requirement ? `${instance.requirement.requirementNo} · SL ${fmt(instance.requirement.requiredQuantity)}` : '-'} />
            <Info k="Production Order" v={instance.productionOrder ? `${instance.productionOrder.orderNo} · ${instance.productionOrder.title}` : '-'} />
            <Info k="Hoàn thành sản xuất" v={date(instance.producedAt)} />
            <Info k="Trạng thái vật lý" v={instance.state} />
            <Info k="Revision" v={instance.componentRevision?.revisionNo ?? '-'} />
            <Info k="Operation cuối" v={latestExecution?.workOrder?.workOrderNo ?? '-'} />
            <Info k="Checklist FINAL" v={finalChecklist ? `${finalChecklist.code} · ${finalChecklist.name}` : 'Chưa có checklist FINAL'} />
          </div>

          <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_260px]">
            <div className={`${panel} overflow-hidden`}>
              <div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold">Lịch sử công đoạn</div>
              <div className="max-h-[280px] overflow-auto">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead className="bg-slate-900/70 text-[10px] uppercase text-slate-500">
                    <tr>{['WorkOrder', 'Execution', 'Trạng thái', 'Bắt đầu', 'Hoàn thành'].map((head) => <th key={head} className="px-3 py-2">{head}</th>)}</tr>
                  </thead>
                  <tbody>
                    {(instance.executions ?? []).map((execution) => (
                      <tr key={execution.id} className="border-t border-slate-800">
                        <td className="px-3 py-3 text-cyan-300">{execution.workOrder?.workOrderNo ?? '-'}</td>
                        <td className="px-3 py-3 text-slate-300">{execution.productionExecution?.state ?? '-'}</td>
                        <td className="px-3 py-3"><StatusBadge value={execution.status} /></td>
                        <td className="px-3 py-3 text-slate-400">{date(execution.startedAt)}</td>
                        <td className="px-3 py-3 text-slate-400">{date(execution.completedAt)}</td>
                      </tr>
                    ))}
                    {!instance.executions?.length ? <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-500">Chưa có execution evidence cho instance này.</td></tr> : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={`${panel} p-4`}>
              <h3 className="text-sm font-semibold">Tổng hợp kiểm tra</h3>
              <div className="mt-3 space-y-2 text-xs text-slate-400">
                <Info k="Operation hoàn tất" v={fmt(completedExecutions.length)} />
                <Info k="Điều kiện queue" v="PRODUCED_WAITING_QC" />
                <Info k="Finished Goods" v="Theo backend eligibility" />
                <Info k="Checklist" v={finalChecklist ? `${finalChecklist.revision} · ${finalChecklist.items?.length ?? 0} tiêu chí` : 'Chưa khả dụng'} />
              </div>
              <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-500">
                PASS/FAIL chỉ áp dụng đúng instance vật lý này và giữ nguyên lineage QC.
              </p>
              {!finalChecklist ? (
                <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                  Chưa có checklist FINAL authoritative. Không thể tạo quyết định QC cuối cho tới khi cấu hình checklist.
                </p>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-4">
          <button disabled={busy} onClick={onClose} className="rounded-lg border border-slate-700 px-5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/5 disabled:opacity-50">Hủy</button>
          <button disabled={busy || !finalChecklist} onClick={() => onFail(instance)} className="rounded-lg border border-red-500/40 bg-red-500/10 px-5 py-2.5 text-xs font-semibold text-red-200 hover:bg-red-500/15 disabled:opacity-50">Không đạt</button>
          <button disabled={busy || !finalChecklist} onClick={() => onPass(instance)} className="rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">Đạt</button>
        </div>
      </section>
    </div>
  )
}

function NcrTab({ runtime }: { runtime: QcCockpit }) {
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [ownerFilter, setOwnerFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
  const [selectedNcr, setSelectedNcr] = useState<any>(null)

  const ncrList = runtime.ncrs.map((ncr) => ({
    id: ncr.id,
    code: ncr.ncrNo,
    project: ncr.componentInstanceId ? 'Cấu kiện vật lý' : ncr.productionOrderId ? 'Lệnh sản xuất' : '-',
    process: ncr.componentInstanceId ? 'Final QC' : 'QC',
    severity: ncr.severity || '-',
    owner: '-',
    deadline: date(ncr.updatedAt),
    status: ncr.status,
    rootCause: ncr.title,
    timeline: `Cập nhật: ${date(ncr.updatedAt)}`,
  }))
  const ncrSeverityRows = Object.entries(ncrList.reduce((map, row) => {
    map[row.severity] = (map[row.severity] ?? 0) + 1
    return map
  }, {} as Record<string, number>))
  const ncrStatusRows = Object.entries(ncrList.reduce((map, row) => {
    map[row.status] = (map[row.status] ?? 0) + 1
    return map
  }, {} as Record<string, number>))

  const filtered = useMemo(() => {
    return ncrList.filter((r) => {
      const q = search.toLowerCase()
      if (q && !r.code.toLowerCase().includes(q) && !r.project.toLowerCase().includes(q) && !r.owner.toLowerCase().includes(q)) return false
      if (severityFilter !== 'all' && r.severity.toLowerCase() !== severityFilter.toLowerCase()) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      return true
    })
  }, [ncrList, search, severityFilter, statusFilter])

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="w-full min-w-0 flex-1 space-y-1 mt-1">
      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard title="NCR đang mở" value={formatQuantity(runtime.metrics.openNcrs, 0)} tone="purple" icon={<AlertTriangle size={15} />} />
        <EnterpriseKpiCard title="Tổng NCR" value={formatQuantity(ncrList.length, 0)} tone="blue" icon={<FileText size={15} />} />
        <EnterpriseKpiCard title="Không đạt/Rework" value={formatQuantity(runtime.metrics.failed + runtime.metrics.rework, 0)} tone="red" icon={<XCircle size={15} />} />
        <EnterpriseKpiCard title="Đang CAPA" value="0" tone="amber" icon={<SlidersHorizontal size={15} />} />
        <EnterpriseKpiCard title="Critical NCR" value={formatQuantity(ncrList.filter((row) => row.severity.toUpperCase() === 'CRITICAL').length, 0)} tone="red" icon={<XCircle size={15} />} />
        <EnterpriseKpiCard title="Average Close Time" value="-" tone="blue" icon={<CalendarClock size={15} />} />
      </div>

      {/* 4 Analytics Dashboards */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-4">
        <CockpitChartCard title="NCR theo nguyên nhân" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitEmptyState title="Chưa có root-cause" description="NCR backend hiện chưa trả root-cause taxonomy authoritative." icon={<AlertTriangle size={18} />} />
        </CockpitChartCard>
        <CockpitChartCard title="NCR theo dự án" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars rows={ncrStatusRows.slice(0, 5)} />
        </CockpitChartCard>
        <CockpitChartCard title="NCR theo mức độ" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars rows={ncrSeverityRows.slice(0, 5)} />
        </CockpitChartCard>
        <CockpitChartCard title="Trend đóng NCR" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitRecentList
            items={ncrList.slice(0, 5).map((row) => ({
              id: row.id,
              title: row.code,
              subtitle: row.rootCause,
              time: row.status,
              statusDot: 'bg-amber-400',
            }))}
            emptyMessage="Chưa có NCR."
          />
        </CockpitChartCard>
      </div>

      {/* Compact Toolbar */}
      <EnterprisePanel className="rounded-xl -mt-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_150px_150px_160px_150px_150px_100px_100px]">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã NCR, nội dung, chủ sở hữu..." className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 pl-9 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-500" />
          </div>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none">
            <option value="all">Mọi mức độ</option>
            <option value="critical">Critical</option>
            <option value="major">Major</option>
            <option value="minor">Minor</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none">
            <option value="all">Tất cả trạng thái</option>
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="UNDER_CAPA">UNDER_CAPA</option>
            <option value="CLOSED">CLOSED</option>
          </select>
          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none">
            <option value="all">Tất cả dự án</option>
          </select>
          <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none">
            <option value="all">Chủ sở hữu</option>
          </select>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none">
            <option value="all">Thời gian</option>
          </select>
          <button type="button" onClick={() => {}} className="h-9 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-500 transition">Tìm kiếm</button>
          <button type="button" onClick={() => { setSearch(''); setSeverityFilter('all'); setStatusFilter('all'); setProjectFilter('all'); setOwnerFilter('all'); setDateFilter('all') }} className="h-9 rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 hover:bg-white/10 transition">Làm mới</button>
        </div>
      </EnterprisePanel>

      {/* Hero Table */}
      <EnterprisePanel className="rounded-xl">
        <div className="mb-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Danh sách NCR (Non-Conformance Reports)</h3>
            <span className="rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-300 border border-blue-400/20">{filtered.length} NCR</span>
          </div>
          <button type="button" onClick={() => setExpandedModalOpen(true)} className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition">Xem tất cả</button>
        </div>

        <div className="h-[520px] overflow-auto scrollbar-none rounded-lg border border-white/10">
          <table className="w-full min-w-[1000px] table-fixed text-sm border-collapse">
            <thead className={`${tableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`} style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}>
              <tr>
                {['Mã NCR', 'Dự án', 'Công đoạn', 'Mức độ', 'Chủ sở hữu', 'Deadline', 'Trạng thái', 'Thao tác'].map((h) => (
                  <th key={h} className="px-2 py-2 text-xs font-semibold text-slate-300 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((row) => (
                <tr key={row.id} onClick={() => setSelectedNcr(row)} className={`${tableRow} cursor-pointer`}>
                  <td className="px-2 py-2 font-mono font-semibold text-cyan-300 text-xs">{row.code}</td>
                  <td className="px-2 py-2 text-white font-medium truncate">{row.project}</td>
                  <td className="px-2 py-2 text-slate-300 text-xs truncate">{row.process}</td>
                  <td className="px-2 py-2 text-xs font-semibold"><span className={row.severity === 'Critical' ? 'text-red-400 font-bold' : row.severity === 'Major' ? 'text-amber-300' : 'text-cyan-300'}>{row.severity}</span></td>
                  <td className="px-2 py-2 text-cyan-400 text-xs truncate">{row.owner}</td>
                  <td className="px-2 py-2 text-slate-300 text-xs truncate">{row.deadline}</td>
                  <td className="px-2 py-2"><QcStatusBadge status={row.status} /></td>
                  <td className="px-2 py-2"><button type="button" onClick={(e) => { e.stopPropagation(); setSelectedNcr(row) }} className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition">Chi tiết</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DataTablePagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
      </EnterprisePanel>

      {/* Expanded Modal */}
      {expandedModalOpen ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Toàn bộ danh sách NCR</h2>
                <p className="text-xs text-slate-400">Tổng cộng {filtered.length} NCR</p>
              </div>
              <button type="button" onClick={() => setExpandedModalOpen(false)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition">Đóng</button>
            </div>
            <div className="h-[640px] overflow-y-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[1000px] text-xs table-fixed border-collapse">
                <thead className={`${tableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`} style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}>
                  <tr>
                    {['Mã NCR', 'Dự án', 'Công đoạn', 'Mức độ', 'Chủ sở hữu', 'Deadline', 'Trạng thái', 'Thao tác'].map((h) => (
                      <th key={h} className="px-2 py-2 text-left font-semibold text-slate-300">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id} onClick={() => { setSelectedNcr(row); setExpandedModalOpen(false) }} className={`${tableRow} cursor-pointer`}>
                      <td className="px-2 py-2 font-mono font-semibold text-cyan-300">{row.code}</td>
                      <td className="px-2 py-2 text-white font-medium truncate">{row.project}</td>
                      <td className="px-2 py-2 text-slate-300 truncate">{row.process}</td>
                      <td className="px-2 py-2 font-semibold"><span className={row.severity === 'Critical' ? 'text-red-400 font-bold' : row.severity === 'Major' ? 'text-amber-300' : 'text-cyan-300'}>{row.severity}</span></td>
                      <td className="px-2 py-2 text-cyan-400 truncate">{row.owner}</td>
                      <td className="px-2 py-2 text-slate-300 truncate">{row.deadline}</td>
                      <td className="px-2 py-2"><QcStatusBadge status={row.status} /></td>
                      <td className="px-2 py-2"><button type="button" onClick={(e) => { e.stopPropagation(); setSelectedNcr(row); setExpandedModalOpen(false) }} className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition">Chi tiết</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}

      {/* Drawer */}
      {selectedNcr ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <section className="flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-cyan-900 bg-[#05101d] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="px-6 pt-6">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-400">Chi tiết NCR</span>
                <h2 className="text-lg font-bold text-white mt-0.5">{selectedNcr.code}</h2>
              </div>
              <button type="button" onClick={() => setSelectedNcr(null)} className="mr-6 mt-6 rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 hover:text-white"><X size={16} /></button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className={`${panel} p-3 space-y-1`}><div className="text-[10px] text-slate-500 uppercase">Đối tượng</div><div className="text-white font-medium">{selectedNcr.project}</div></div>
                <div className={`${panel} p-3 space-y-1`}><div className="text-[10px] text-slate-500 uppercase">Công đoạn</div><div className="text-cyan-300 font-medium">{selectedNcr.process}</div></div>
                <div className={`${panel} p-3 space-y-1`}><div className="text-[10px] text-slate-500 uppercase">Mức độ & hạn chót</div><div className="text-slate-200 font-semibold">{selectedNcr.severity} · {selectedNcr.deadline}</div></div>
                <div className={`${panel} p-3 space-y-1`}><div className="text-[10px] text-slate-500 uppercase">Phụ trách</div><div className="text-cyan-400 font-mono">{selectedNcr.owner}</div></div>
              </div>
              <div className={`${panel} p-4 space-y-2`}>
                <h3 className="text-xs font-bold text-cyan-300 uppercase">Mô tả không phù hợp</h3>
                <p className="text-xs text-slate-300">{selectedNcr.rootCause}</p>
              </div>
              <div className={`${panel} p-4 space-y-2`}>
                <h3 className="text-xs font-bold text-cyan-300 uppercase">Lịch sử / hoạt động</h3>
                <p className="text-xs text-slate-400">{selectedNcr.timeline}</p>
              </div>
            </div>
            <div className="flex justify-end border-t border-white/10 px-6 py-4">
              <button type="button" onClick={() => setSelectedNcr(null)} className="rounded-lg border border-slate-700 px-5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/5">Đóng</button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function CapaTab({ runtime }: { runtime: QcCockpit }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [ownerFilter, setOwnerFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
  const [selectedCapa, setSelectedCapa] = useState<any>(null)

  const capaList: Array<{
    id: string
    code: string
    ncrCode: string
    owner: string
    dueDate: string
    progress: number
    verification: string
    status: string
    actionPlan: string
  }> = []

  const filtered = useMemo(() => {
    return capaList.filter((r) => {
      const q = search.toLowerCase()
      if (q && !r.code.toLowerCase().includes(q) && !r.ncrCode.toLowerCase().includes(q) && !r.owner.toLowerCase().includes(q)) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      return true
    })
  }, [capaList, search, statusFilter])

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="w-full min-w-0 flex-1 space-y-1 mt-1">
      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard title="CAPA mở" value="0" tone="amber" icon={<SlidersHorizontal size={15} />} />
        <EnterpriseKpiCard title="Đang thực hiện" value="0" tone="blue" icon={<Clock size={15} />} />
        <EnterpriseKpiCard title="Hoàn thành" value="0" tone="emerald" icon={<CheckCircle2 size={15} />} />
        <EnterpriseKpiCard title="Quá hạn" value="0" tone="red" icon={<CalendarClock size={15} />} />
        <EnterpriseKpiCard title="Verification Pending" value="0" tone="purple" icon={<AlertTriangle size={15} />} />
        <EnterpriseKpiCard title="Effectiveness" value="-" tone="emerald" icon={<ShieldCheck size={15} />} />
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-4">
        <CockpitChartCard title="CAPA Progress" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitEmptyState title="Chưa có dữ liệu CAPA" description="QC backend chưa có read-model CAPA authoritative." icon={<SlidersHorizontal size={18} />} />
        </CockpitChartCard>
        <CockpitChartCard title="CAPA theo Owner" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitEmptyState title="Chưa có owner CAPA" description="Không hiển thị owner giả khi backend chưa cung cấp." icon={<ClipboardCheck size={18} />} />
        </CockpitChartCard>
        <CockpitChartCard title="CAPA theo Loại" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitEmptyState title="Chưa có phân loại CAPA" description="Chờ read-model phân loại CAPA từ backend QC." icon={<FileBarChart size={18} />} />
        </CockpitChartCard>
        <CockpitChartCard title="Completion Trend" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitEmptyState title="Chưa có trend CAPA" description="Không dựng tỷ lệ hoàn thành khi chưa có nguồn dữ liệu." icon={<CalendarClock size={18} />} />
        </CockpitChartCard>
      </div>

      {/* Toolbar */}
      <EnterprisePanel className="rounded-xl -mt-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_160px_160px_160px_160px_100px_100px]">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã CAPA, tiêu đề, owner..." className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 pl-9 pr-3 text-sm text-slate-100 outline-none" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none">
            <option value="all">Tất cả trạng thái</option>
            <option value="IN_PROGRESS">Đang làm</option>
            <option value="COMPLETED">Hoàn thành</option>
          </select>
          <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none"><option value="all">Tất cả Owner</option></select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none"><option value="all">Tất cả độ ưu tiên</option></select>
          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none"><option value="all">Tất cả bộ phận</option></select>
          <button type="button" onClick={() => {}} className="h-9 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-500 transition">Tìm kiếm</button>
          <button type="button" onClick={() => { setSearch(''); setStatusFilter('all'); setOwnerFilter('all'); setPriorityFilter('all'); setDepartmentFilter('all') }} className="h-9 rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 hover:bg-white/10 transition">Làm mới</button>
        </div>
      </EnterprisePanel>

      {/* Hero Table */}
      <EnterprisePanel className="rounded-xl">
        <div className="mb-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Danh sách CAPA (Corrective & Preventive Actions)</h3>
            <span className="rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-300 border border-blue-400/20">{filtered.length} CAPA</span>
          </div>
          <button type="button" onClick={() => setExpandedModalOpen(true)} className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition">Xem tất cả</button>
        </div>

        <div className="h-[520px] overflow-auto scrollbar-none rounded-lg border border-white/10">
          <table className="w-full min-w-[1000px] table-fixed text-sm border-collapse">
            <thead className={`${tableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`} style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}>
              <tr>
                {['CAPA ID', 'Liên kết NCR', 'Owner', 'Due Date', 'Progress', 'Verification', 'Trạng thái', 'Thao tác'].map((h) => (
                  <th key={h} className="px-2 py-2 text-xs font-semibold text-slate-300 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((row) => (
                <tr key={row.id} onClick={() => setSelectedCapa(row)} className={`${tableRow} cursor-pointer`}>
                  <td className="px-2 py-2 font-mono font-semibold text-cyan-300 text-xs">{row.code}</td>
                  <td className="px-2 py-2 font-mono text-purple-300 text-xs">{row.ncrCode}</td>
                  <td className="px-2 py-2 text-cyan-400 text-xs truncate">{row.owner}</td>
                  <td className="px-2 py-2 text-slate-300 text-xs truncate">{row.dueDate}</td>
                  <td className="px-2 py-2 text-xs font-mono font-semibold text-emerald-300">{row.progress}%</td>
                  <td className="px-2 py-2 text-xs font-medium"><span className={row.verification === 'VERIFIED' ? 'text-emerald-300' : 'text-amber-300'}>{row.verification}</span></td>
                  <td className="px-2 py-2"><QcStatusBadge status={row.status} /></td>
                  <td className="px-2 py-2"><button type="button" onClick={(e) => { e.stopPropagation(); setSelectedCapa(row) }} className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition">Chi tiết</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DataTablePagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
      </EnterprisePanel>

      {/* Expanded Modal */}
      {expandedModalOpen ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Toàn bộ danh sách CAPA</h2>
                <p className="text-xs text-slate-400">Tổng cộng {filtered.length} CAPA</p>
              </div>
              <button type="button" onClick={() => setExpandedModalOpen(false)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition">Đóng</button>
            </div>
            <div className="h-[640px] overflow-y-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[1000px] text-xs table-fixed border-collapse">
                <thead className={`${tableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`} style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}>
                  <tr>
                    {['CAPA ID', 'Liên kết NCR', 'Owner', 'Due Date', 'Progress', 'Verification', 'Trạng thái', 'Thao tác'].map((h) => (
                      <th key={h} className="px-2 py-2 text-left font-semibold text-slate-300">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id} onClick={() => { setSelectedCapa(row); setExpandedModalOpen(false) }} className={`${tableRow} cursor-pointer`}>
                      <td className="px-2 py-2 font-mono font-semibold text-cyan-300">{row.code}</td>
                      <td className="px-2 py-2 font-mono text-purple-300">{row.ncrCode}</td>
                      <td className="px-2 py-2 text-cyan-400 truncate">{row.owner}</td>
                      <td className="px-2 py-2 text-slate-300 truncate">{row.dueDate}</td>
                      <td className="px-2 py-2 font-mono font-semibold text-emerald-300">{row.progress}%</td>
                      <td className="px-2 py-2 font-medium"><span className={row.verification === 'VERIFIED' ? 'text-emerald-300' : 'text-amber-300'}>{row.verification}</span></td>
                      <td className="px-2 py-2"><QcStatusBadge status={row.status} /></td>
                      <td className="px-2 py-2"><button type="button" onClick={(e) => { e.stopPropagation(); setSelectedCapa(row); setExpandedModalOpen(false) }} className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition">Chi tiết</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}

      {/* Drawer */}
      {selectedCapa ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <section className="h-full w-full max-w-2xl overflow-y-auto border-l border-cyan-900 bg-[#05101d] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-400">Chi tiết CAPA</span>
                <h2 className="text-lg font-bold text-white mt-0.5">{selectedCapa.code}</h2>
              </div>
              <button type="button" onClick={() => setSelectedCapa(null)} className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 hover:text-white"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className={`${panel} p-3 space-y-1`}><div className="text-[10px] text-slate-500 uppercase">Mã NCR liên kết</div><div className="text-purple-300 font-mono">{selectedCapa.ncrCode}</div></div>
              <div className={`${panel} p-3 space-y-1`}><div className="text-[10px] text-slate-500 uppercase">Chủ trì (Owner)</div><div className="text-cyan-300 font-medium">{selectedCapa.owner}</div></div>
              <div className={`${panel} p-3 space-y-1`}><div className="text-[10px] text-slate-500 uppercase">Tiến độ & Hạn chót</div><div className="text-emerald-300 font-semibold">{selectedCapa.progress}% · {selectedCapa.dueDate}</div></div>
              <div className={`${panel} p-3 space-y-1`}><div className="text-[10px] text-slate-500 uppercase">N nghiệm thu</div><div className="text-white font-mono">{selectedCapa.verification}</div></div>
            </div>
            <div className={`${panel} p-4 space-y-2`}>
              <h3 className="text-xs font-bold text-cyan-300 uppercase">Action Plan (Kế hoạch hành động)</h3>
              <p className="text-xs text-slate-300">{selectedCapa.actionPlan}</p>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function AuditLogsTab({ runtime }: { runtime: QcCockpit }) {
  const [search, setSearch] = useState('')
  const [userFilter, setUserFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<any>(null)

  const logList: Array<{ id: string; time: string; user: string; module: string; action: string; object: string; ip: string; detail: string }> = []

  const filtered = useMemo(() => {
    return logList.filter((r) => {
      const q = search.toLowerCase()
      if (q && !r.user.toLowerCase().includes(q) && !r.action.toLowerCase().includes(q) && !r.ip.includes(q)) return false
      return true
    })
  }, [logList, search])

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="w-full min-w-0 flex-1 space-y-1 mt-1">
      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard title="Tổng hoạt động" value="0" tone="blue" icon={<FileBarChart size={15} />} />
        <EnterpriseKpiCard title="Người dùng" value="0" tone="cyan" icon={<Gauge size={15} />} />
        <EnterpriseKpiCard title="Thao tác hôm nay" value="0" tone="emerald" icon={<Clock size={15} />} />
        <EnterpriseKpiCard title="Login" value="0" tone="emerald" icon={<CheckCircle2 size={15} />} />
        <EnterpriseKpiCard title="Export" value="0" tone="amber" icon={<ListChecks size={15} />} />
        <EnterpriseKpiCard title="Critical Events" value="0" tone="purple" icon={<AlertTriangle size={15} />} />
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-4">
        <CockpitChartCard title="User Activity" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitEmptyState title="Chưa có audit logs" description="QC backend chưa trả audit log read-model cho tab này." icon={<FileBarChart size={18} />} />
        </CockpitChartCard>
        <CockpitChartCard title="Action Distribution" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitEmptyState title="Chưa có phân bổ hành động" description="Không dựng tỷ lệ thao tác khi chưa có nguồn dữ liệu." icon={<ListChecks size={18} />} />
        </CockpitChartCard>
        <CockpitChartCard title="Login Trend" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitEmptyState title="Chưa có login trend" description="Login history không thuộc QC read-model hiện tại." icon={<Clock size={18} />} />
        </CockpitChartCard>
        <CockpitChartCard title="Top Users" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitEmptyState title="Chưa có top users" description="Không hiển thị người dùng giả khi backend chưa cung cấp." icon={<Gauge size={18} />} />
        </CockpitChartCard>
      </div>

      {/* Toolbar */}
      <EnterprisePanel className="rounded-xl -mt-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_160px_160px_160px_160px_100px_100px]">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm IP, người dùng, hành động, module..." className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 pl-9 pr-3 text-sm text-slate-100 outline-none" />
          </div>
          <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none"><option value="all">Tất cả người dùng</option></select>
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none"><option value="all">Tất cả hành động</option></select>
          <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none"><option value="all">Tất cả module</option></select>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none"><option value="all">Tất cả thời gian</option></select>
          <button type="button" onClick={() => {}} className="h-9 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-500 transition">Tìm kiếm</button>
          <button type="button" onClick={() => { setSearch(''); setUserFilter('all'); setActionFilter('all'); setModuleFilter('all'); setDateFilter('all') }} className="h-9 rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 hover:bg-white/10 transition">Làm mới</button>
        </div>
      </EnterprisePanel>

      {/* Hero Table */}
      <EnterprisePanel className="rounded-xl">
        <div className="mb-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Nhật ký hoạt động (Audit Logs)</h3>
            <span className="rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-300 border border-blue-400/20">{filtered.length} nhật ký</span>
          </div>
          <button type="button" onClick={() => setExpandedModalOpen(true)} className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition">Xem tất cả</button>
        </div>

        <div className="h-[520px] overflow-auto scrollbar-none rounded-lg border border-white/10">
          <table className="w-full min-w-[1000px] table-fixed text-sm border-collapse">
            <thead className={`${tableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`} style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}>
              <tr>
                {['Thời gian', 'Người dùng', 'Module', 'Hành động', 'Đối tượng', 'IP', 'Chi tiết', 'Thao tác'].map((h) => (
                  <th key={h} className="px-2 py-2 text-xs font-semibold text-slate-300 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((row) => (
                <tr key={row.id} onClick={() => setSelectedLog(row)} className={`${tableRow} cursor-pointer`}>
                  <td className="px-2 py-2 font-mono text-slate-300 text-xs">{row.time}</td>
                  <td className="px-2 py-2 text-cyan-300 font-medium truncate">{row.user}</td>
                  <td className="px-2 py-2 text-slate-300 text-xs truncate">{row.module}</td>
                  <td className="px-2 py-2 font-mono text-emerald-300 text-xs font-semibold">{row.action}</td>
                  <td className="px-2 py-2 font-mono text-white text-xs truncate">{row.object}</td>
                  <td className="px-2 py-2 font-mono text-cyan-400 text-xs">{row.ip}</td>
                  <td className="px-2 py-2 text-slate-300 text-xs truncate">{row.detail}</td>
                  <td className="px-2 py-2"><button type="button" onClick={(e) => { e.stopPropagation(); setSelectedLog(row) }} className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition">Chi tiết</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DataTablePagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
      </EnterprisePanel>

      {/* Expanded Modal */}
      {expandedModalOpen ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Toàn bộ nhật ký hoạt động</h2>
                <p className="text-xs text-slate-400">Tổng cộng {filtered.length} nhật ký</p>
              </div>
              <button type="button" onClick={() => setExpandedModalOpen(false)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition">Đóng</button>
            </div>
            <div className="h-[640px] overflow-y-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[1000px] text-xs table-fixed border-collapse">
                <thead className={`${tableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`} style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}>
                  <tr>
                    {['Thời gian', 'Người dùng', 'Module', 'Hành động', 'Đối tượng', 'IP', 'Chi tiết', 'Thao tác'].map((h) => (
                      <th key={h} className="px-2 py-2 text-left font-semibold text-slate-300">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id} onClick={() => { setSelectedLog(row); setExpandedModalOpen(false) }} className={`${tableRow} cursor-pointer`}>
                      <td className="px-2 py-2 font-mono text-slate-300">{row.time}</td>
                      <td className="px-2 py-2 text-cyan-300 font-medium truncate">{row.user}</td>
                      <td className="px-2 py-2 text-slate-300 truncate">{row.module}</td>
                      <td className="px-2 py-2 font-mono text-emerald-300 font-semibold">{row.action}</td>
                      <td className="px-2 py-2 font-mono text-white truncate">{row.object}</td>
                      <td className="px-2 py-2 font-mono text-cyan-400">{row.ip}</td>
                      <td className="px-2 py-2 text-slate-300 truncate">{row.detail}</td>
                      <td className="px-2 py-2"><button type="button" onClick={(e) => { e.stopPropagation(); setSelectedLog(row); setExpandedModalOpen(false) }} className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition">Chi tiết</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}

      {/* Drawer */}
      {selectedLog ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <section className="h-full w-full max-w-2xl overflow-y-auto border-l border-cyan-900 bg-[#05101d] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-400">Full Audit Detail</span>
                <h2 className="text-lg font-bold text-white mt-0.5">{selectedLog.action}</h2>
              </div>
              <button type="button" onClick={() => setSelectedLog(null)} className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 hover:text-white"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className={`${panel} p-3 space-y-1`}><div className="text-[10px] text-slate-500 uppercase">Thời gian</div><div className="text-white font-mono">{selectedLog.time}</div></div>
              <div className={`${panel} p-3 space-y-1`}><div className="text-[10px] text-slate-500 uppercase">Người thực hiện</div><div className="text-cyan-300 font-medium">{selectedLog.user}</div></div>
              <div className={`${panel} p-3 space-y-1`}><div className="text-[10px] text-slate-500 uppercase">Module & Thao tác</div><div className="text-slate-200 font-semibold">{selectedLog.module} · {selectedLog.action}</div></div>
              <div className={`${panel} p-3 space-y-1`}><div className="text-[10px] text-slate-500 uppercase">Địa chỉ IP</div><div className="text-cyan-400 font-mono">{selectedLog.ip}</div></div>
            </div>
            <div className={`${panel} p-4 space-y-2`}>
              <h3 className="text-xs font-bold text-cyan-300 uppercase">Chi tiết thao tác</h3>
              <p className="text-xs text-slate-300">{selectedLog.detail}</p>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function ReportsTab({ runtime }: { runtime: QcCockpit }) {
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('all')
  const [customerFilter, setCustomerFilter] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [reportTypeFilter, setReportTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [selectedReport, setSelectedReport] = useState<any>(null)

  const reportList: Array<{ id: string; name: string; project: string; customer: string; supplier: string; passRate: string; ncr: string; capa: string }> = []

  const filtered = useMemo(() => {
    return reportList.filter((r) => {
      const q = search.toLowerCase()
      if (q && !r.name.toLowerCase().includes(q) && !r.project.toLowerCase().includes(q) && !r.customer.toLowerCase().includes(q)) return false
      return true
    })
  }, [reportList, search])

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="w-full min-w-0 flex-1 space-y-1 mt-1">
      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard title="Tổng báo cáo" value="0" tone="blue" icon={<FileBarChart size={15} />} />
        <EnterpriseKpiCard title="Pass Rate" value={`${fmt(runtime.metrics.passRate)}%`} tone="emerald" icon={<CheckCircle2 size={15} />} />
        <EnterpriseKpiCard title="NCR mở" value={formatQuantity(runtime.metrics.openNcrs, 0)} tone="purple" icon={<AlertTriangle size={15} />} />
        <EnterpriseKpiCard title="CAPA Rate" value="-" tone="amber" icon={<SlidersHorizontal size={15} />} />
        <EnterpriseKpiCard title="Rework" value={formatQuantity(runtime.metrics.rework, 0)} tone="red" icon={<RotateCcw size={15} />} />
        <EnterpriseKpiCard title="Quality Score" value="-" tone="cyan" icon={<ShieldCheck size={15} />} />
      </div>

      {/* 6 Analytics Dashboards / Pareto / Heatmap */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <CockpitChartCard title="Pass Rate Trend" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars rows={runtime.trend.slice(0, 6).map((row) => [row.date, row.passed])} />
        </CockpitChartCard>
        <CockpitChartCard title="Defect Pareto" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars rows={runtime.metrics.defects.slice(0, 6).map((row) => [row.severity, row._count])} />
        </CockpitChartCard>
        <CockpitChartCard title="Supplier Ranking" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitEmptyState title="Chưa có supplier ranking" description="QC read-model chưa cung cấp ranking nhà cung cấp." icon={<ShieldCheck size={18} />} />
        </CockpitChartCard>
        <CockpitChartCard title="Project Quality" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars rows={runtime.byProject.slice(0, 6).map((row) => [row.projectName, row.passRate])} />
        </CockpitChartCard>
        <CockpitChartCard title="Monthly QC" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars rows={runtime.trend.slice(0, 6).map((row) => [row.date, row.total])} />
        </CockpitChartCard>
        <CockpitChartCard title="Defect Heatmap" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitEmptyState title="Chưa có heatmap lỗi" description="Backend chưa trả work center/zone cho defect heatmap." icon={<AlertTriangle size={18} />} />
        </CockpitChartCard>
      </div>

      {/* Toolbar */}
      <EnterprisePanel className="rounded-xl -mt-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_140px_140px_140px_120px_120px_140px_90px_90px]">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm báo cáo, dự án, NCC..." className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 pl-9 pr-3 text-sm text-slate-100 outline-none" />
          </div>
          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none"><option value="all">Dự án</option></select>
          <select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none"><option value="all">Khách hàng</option></select>
          <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none"><option value="all">Nhà cung cấp</option></select>
          <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none"><option value="all">Tháng</option></select>
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none"><option value="all">Năm</option></select>
          <select value={reportTypeFilter} onChange={(e) => setReportTypeFilter(e.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none"><option value="all">Loại báo cáo</option></select>

          <button type="button" onClick={() => {}} className="h-9 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-500 transition">Tìm kiếm</button>
          <button type="button" onClick={() => { setSearch(''); setProjectFilter('all'); setCustomerFilter('all'); setSupplierFilter('all'); setMonthFilter('all'); setYearFilter('all'); setReportTypeFilter('all') }} className="h-9 rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 hover:bg-white/10 transition">Làm mới</button>
        </div>
      </EnterprisePanel>

      {/* Hero Table */}
      <EnterprisePanel className="rounded-xl">
        <div className="mb-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Danh sách Báo cáo Chất lượng Enterprise</h3>
            <span className="rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-300 border border-blue-400/20">{filtered.length} báo cáo</span>
          </div>
        </div>

        <div className="h-[520px] overflow-auto scrollbar-none rounded-lg border border-white/10">
          <table className="w-full min-w-[1000px] table-fixed text-sm border-collapse">
            <thead className={`${tableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`} style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}>
              <tr>
                {['Tên Báo cáo', 'Dự án', 'Khách hàng', 'Nhà cung cấp', 'Pass Rate', 'NCR', 'CAPA', 'Thao tác / Viewer'].map((h) => (
                  <th key={h} className="px-2 py-2 text-xs font-semibold text-slate-300 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((row) => (
                <tr key={row.id} onClick={() => setSelectedReport(row)} className={`${tableRow} cursor-pointer`}>
                  <td className="px-2 py-2 font-semibold text-white text-xs truncate">{row.name}</td>
                  <td className="px-2 py-2 text-slate-300 text-xs truncate">{row.project}</td>
                  <td className="px-2 py-2 text-slate-300 text-xs truncate">{row.customer}</td>
                  <td className="px-2 py-2 text-cyan-300 text-xs truncate">{row.supplier}</td>
                  <td className="px-2 py-2 text-xs font-mono font-semibold text-emerald-300">{row.passRate}</td>
                  <td className="px-2 py-2 text-xs font-mono text-purple-300">{row.ncr}</td>
                  <td className="px-2 py-2 text-xs font-mono text-amber-300">{row.capa}</td>
                  <td className="px-2 py-2 flex items-center gap-1.5">
                    <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedReport(row) }} className="rounded border border-cyan-700 bg-cyan-950/40 px-2 py-1 text-xs text-cyan-200 hover:bg-cyan-900 transition flex items-center gap-1">
                      <FileText size={12} /> Xem Báo Cáo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DataTablePagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
      </EnterprisePanel>

      {/* Modal: Enterprise Report Viewer */}
      {selectedReport ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-6xl rounded-2xl border border-cyan-500/30 bg-[#061322] p-6 shadow-2xl space-y-5 text-xs text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400">Enterprise QC Report Viewer</span>
                <h2 className="text-xl font-bold text-white mt-0.5">{selectedReport.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{selectedReport.project} · {selectedReport.customer}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => {}} className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition">
                  <Download size={14} /> Export Excel
                </button>
                <button type="button" onClick={() => {}} className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20 transition">
                  <Download size={14} /> Export PDF
                </button>
                <button type="button" onClick={() => {}} className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition">
                  <Printer size={14} /> Print
                </button>
                <button type="button" onClick={() => setSelectedReport(null)} className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 hover:text-white"><X size={16} /></button>
              </div>
            </div>

            {/* Viewer KPIs */}
            <div className="grid grid-cols-4 gap-3">
              <div className={`${panel} p-3 space-y-1`}><div className="text-[10px] text-slate-400">Tỷ lệ Đạt Pass Rate</div><div className="text-lg font-bold font-mono text-emerald-400">{selectedReport.passRate}</div></div>
              <div className={`${panel} p-3 space-y-1`}><div className="text-[10px] text-slate-400">Sự cố NCR</div><div className="text-lg font-bold font-mono text-purple-400">{selectedReport.ncr}</div></div>
              <div className={`${panel} p-3 space-y-1`}><div className="text-[10px] text-slate-400">Hành động CAPA</div><div className="text-lg font-bold font-mono text-amber-400">{selectedReport.capa}</div></div>
              <div className={`${panel} p-3 space-y-1`}><div className="text-[10px] text-slate-400">Điểm Chất Lượng Total</div><div className="text-lg font-bold font-mono text-cyan-400">9.8 / 10</div></div>
            </div>

            {/* Viewer Charts & Tables */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`${panel} p-4 space-y-2`}>
                <h3 className="text-xs font-bold text-cyan-300 uppercase">Phân bổ chất lượng lô hàng</h3>
                <StatusMiniBars rows={[['Đạt xuất xưởng', 98], ['Cần làm lại (Rework)', 1.5], ['Phế phẩm (Scrap)', 0.5]]} />
              </div>
              <div className={`${panel} p-4 space-y-2`}>
                <h3 className="text-xs font-bold text-cyan-300 uppercase">Top phát sinh kiểm tra</h3>
                <CockpitStatusList items={[
                  { id: '1', label: 'Kiểm tra kích thước hình học', value: '100% Đạt', statusTone: 'emerald' },
                  { id: '2', label: 'Nghiệm thu Siêu âm mối hàn (UT)', value: '99.1% Đạt', statusTone: 'emerald' },
                  { id: '3', label: 'Kiểm tra chiều dày sơn màng khô (DFT)', value: '97.8% Đạt', statusTone: 'cyan' },
                ]} />
              </div>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  )
}
