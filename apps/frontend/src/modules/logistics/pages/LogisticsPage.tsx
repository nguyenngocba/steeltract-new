import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Truck,
  X,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import {
  advanceDispatchOrder,
  createDispatchOrder,
  getDispatchDashboard,
  getDispatchOrders,
  suggestDispatchItems,
  type CreateDispatchOrderPayload,
  type DispatchItem,
  type DispatchOrder,
  type DispatchOrderStatus,
  type DispatchSuggestion,
} from '@/modules/logistics/api/logistics.api'
import { getProjectsRuntime, type ProjectRuntimeRow, type ProjectsRuntime } from '@/modules/projects/api/projects.api'
import { OperationalShell } from '@/shared/layouts/OperationalShell'
import {
  CockpitChartCard,
  CockpitEmptyState,
  CockpitKpiCard,
  CockpitRecentList,
  CockpitStatusList,
  CockpitTableShell,
} from '@/shared/ui/cockpit'
import {
  ModuleDetailDrawer,
  moduleInput,
  moduleMutedButton,
  modulePrimaryButton,
} from '@/shared/ui/modules'
import { formatQuantity } from '@/shared/utils/number-format'

type LogisticsTab = 'overview' | 'dispatch' | 'tracking' | 'history'

const tabs: Array<{ id: LogisticsTab; label: string; path: string }> = [
  { id: 'overview', label: 'Tổng quan', path: '/logistics' },
  { id: 'dispatch', label: 'Điều xe', path: '/logistics/dispatch' },
  { id: 'tracking', label: 'Đang vận chuyển', path: '/logistics/tracking' },
  { id: 'history', label: 'Lịch sử', path: '/logistics/history' },
]

const statusLabel: Record<DispatchOrderStatus, string> = {
  DRAFT: 'Nháp',
  PLANNED: 'Đã lên kế hoạch',
  LOADING: 'Đang bốc hàng',
  IN_TRANSIT: 'Đang vận chuyển',
  ARRIVED: 'Đã đến công trình',
  RECEIVED: 'Đã nhận',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
}

const statusTone: Record<DispatchOrderStatus, string> = {
  DRAFT: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
  PLANNED: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  LOADING: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  IN_TRANSIT: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  ARRIVED: 'border-violet-500/30 bg-violet-500/10 text-violet-300',
  RECEIVED: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  COMPLETED: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  CANCELLED: 'border-red-500/30 bg-red-500/10 text-red-300',
}

const fmt = (value = 0) => formatQuantity(value, 0)

export function LogisticsPage() {
  const location = useLocation()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<DispatchOrder | null>(null)
  const [creating, setCreating] = useState(false)
  const tab = tabs.find((item) => item.path === location.pathname)?.id
    ?? (location.pathname === '/logistics/logs' ? 'history' : 'overview')

  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['logistics-dispatch-dashboard'],
    queryFn: getDispatchDashboard,
  })
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['logistics-dispatch-orders'],
    queryFn: getDispatchOrders,
  })
  const { data: projectsRuntime } = useQuery<ProjectsRuntime>({
    queryKey: ['project-runtime'],
    queryFn: getProjectsRuntime,
  })
  const projects = projectsRuntime?.projects ?? []

  const filteredOrders = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    const source = tab === 'tracking'
      ? orders.filter((order) => ['LOADING', 'IN_TRANSIT', 'ARRIVED'].includes(order.status))
      : tab === 'history'
        ? orders.filter((order) => ['RECEIVED', 'COMPLETED', 'CANCELLED'].includes(order.status))
        : orders

    if (!keyword) return source
    return source.filter((order) => [
      order.code,
      order.project?.code,
      order.project?.name,
      order.projectTask?.name,
      order.vehicle,
      order.driver,
    ].filter(Boolean).join(' ').toLowerCase().includes(keyword))
  }, [orders, query, tab])

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['logistics-dispatch-dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['logistics-dispatch-orders'] })
    queryClient.invalidateQueries({ queryKey: ['project-runtime'] })
  }

  const advanceMutation = useMutation({
    mutationFn: advanceDispatchOrder,
    onSuccess: (order) => {
      setSelectedOrder(order)
      refresh()
    },
  })

  return (
    <OperationalShell>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_30%),linear-gradient(135deg,#07111f_0%,#0f172a_46%,#111827_100%)] p-4 text-slate-100">
        <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold text-white">Vận chuyển</h1>
            <p className="text-xs text-slate-500">Điều xe, theo dõi giao nhận từ kho/bãi đến công trình.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className={moduleMutedButton} onClick={refresh} type="button">
              <RefreshCw size={14} /> Làm mới
            </button>
            <button className={modulePrimaryButton} onClick={() => setCreating(true)} type="button">
              <Plus size={14} /> Tạo điều xe
            </button>
          </div>
        </header>

        <nav className="mb-1 flex gap-1 overflow-x-auto rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-1">
          {tabs.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs transition ${tab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/30' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <section className="grid gap-1 md:grid-cols-2 xl:grid-cols-4">
          <CockpitKpiCard title="Chờ điều xe" value={fmt(dashboard?.kpis.waiting ?? 0)} note="Nháp / kế hoạch / bốc hàng" icon={<CalendarClock size={18} />} tone="amber" state={dashboardLoading ? 'loading' : 'normal'} />
          <CockpitKpiCard title="Đang vận chuyển" value={fmt(dashboard?.kpis.inTransit ?? 0)} note="Đang chạy tuyến" icon={<Truck size={18} />} tone="blue" state={dashboardLoading ? 'loading' : 'normal'} />
          <CockpitKpiCard title="Đã giao" value={fmt(dashboard?.kpis.delivered ?? 0)} note="Đã đến / đã nhận" icon={<PackageCheck size={18} />} tone="cyan" state={dashboardLoading ? 'loading' : 'normal'} />
          <CockpitKpiCard title="Hoàn thành" value={fmt(dashboard?.kpis.completed ?? 0)} note="Đóng giao nhận" icon={<CheckCircle2 size={18} />} tone="emerald" state={dashboardLoading ? 'loading' : 'normal'} />
        </section>

        <section className="my-1 flex flex-wrap items-center gap-1 rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-2">
          <div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/45 px-2">
            <Search size={14} className="text-cyan-300" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm mã điều xe, công trình, xe, tài xế..."
              className="h-8 w-full bg-transparent text-xs text-slate-100 outline-none placeholder:text-slate-500"
            />
          </div>
        </section>

        {tab === 'overview' ? (
          <Overview orders={filteredOrders} dashboard={dashboard} onSelect={setSelectedOrder} loading={isLoading} />
        ) : null}
        {tab === 'dispatch' ? (
          <DispatchWorkspace orders={filteredOrders} onSelect={setSelectedOrder} loading={isLoading} />
        ) : null}
        {tab === 'tracking' ? (
          <TrackingWorkspace orders={filteredOrders} onSelect={setSelectedOrder} loading={isLoading} />
        ) : null}
        {tab === 'history' ? (
          <HistoryWorkspace orders={filteredOrders} onSelect={setSelectedOrder} loading={isLoading} />
        ) : null}

        <DispatchDetailDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onAction={(action) => selectedOrder ? advanceMutation.mutate({ id: selectedOrder.id, action }) : undefined}
          pending={advanceMutation.isPending}
        />
        {creating ? <CreateDispatchDrawer projects={projects} onClose={() => setCreating(false)} onCreated={() => { setCreating(false); refresh() }} /> : null}
      </main>
    </OperationalShell>
  )
}

function Overview({ orders, dashboard, onSelect, loading }: { orders: DispatchOrder[]; dashboard?: Awaited<ReturnType<typeof getDispatchDashboard>>; onSelect: (order: DispatchOrder) => void; loading: boolean }) {
  return (
    <div className="grid gap-1 xl:grid-cols-[minmax(0,1fr)_360px]">
      <DispatchTable orders={orders} onSelect={onSelect} loading={loading} />
      <aside className="space-y-1">
        <CockpitChartCard title="Delivery Status" className="h-[170px]">
          <StatusBars counts={dashboard?.statusCounts ?? {}} />
        </CockpitChartCard>
        <CockpitChartCard title="Dispatch Trend" className="h-[170px]">
          <TrendBars rows={dashboard?.trend ?? []} />
        </CockpitChartCard>
        <CockpitStatusList
          items={(dashboard?.vehicleUtilization ?? []).slice(0, 5).map((row) => ({
            id: row.vehicle,
            label: row.vehicle,
            value: `${fmt(row.active)} / ${fmt(row.total)}`,
            statusTone: row.active > 0 ? 'cyan' : undefined,
          }))}
          emptyMessage="Chưa có xe vận chuyển."
        />
      </aside>
    </div>
  )
}

function DispatchWorkspace({ orders, onSelect, loading }: { orders: DispatchOrder[]; onSelect: (order: DispatchOrder) => void; loading: boolean }) {
  return (
    <div className="grid gap-1 xl:grid-cols-[minmax(0,1fr)_360px]">
      <DispatchTable orders={orders.filter((order) => ['DRAFT', 'PLANNED', 'LOADING'].includes(order.status))} onSelect={onSelect} loading={loading} />
      <CockpitChartCard title="Chờ xử lý" className="h-[560px]">
        <CockpitRecentList
          items={orders.slice(0, 8).map((order) => ({
            id: order.id,
            title: order.code,
            subtitle: `${order.project?.name ?? 'Chưa rõ công trình'} · ${statusLabel[order.status]}`,
            time: formatDateTime(order.createdAt),
          }))}
          emptyMessage="Chưa có lệnh điều xe."
        />
      </CockpitChartCard>
    </div>
  )
}

function TrackingWorkspace({ orders, onSelect, loading }: { orders: DispatchOrder[]; onSelect: (order: DispatchOrder) => void; loading: boolean }) {
  return (
    <div className="grid gap-1 xl:grid-cols-[minmax(0,1fr)_360px]">
      <DispatchTable orders={orders} onSelect={onSelect} loading={loading} />
      <CockpitChartCard title="Tuyến đang chạy" className="h-[520px]">
        {orders.length ? (
          <div className="space-y-2 text-xs">
            {orders.map((order) => (
              <button key={order.id} type="button" onClick={() => onSelect(order)} className="w-full rounded-xl border border-cyan-300/10 bg-cyan-400/[0.045] p-3 text-left hover:border-cyan-300/30">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-cyan-200">{order.code}</span>
                  <StatusBadge status={order.status} />
                </div>
                <p className="mt-1 text-slate-400">{order.vehicle || 'Chưa gán xe'} · {order.driver || 'Chưa gán tài xế'}</p>
                <p className="mt-1 text-slate-500">{order.project?.name ?? 'Chưa rõ công trình'}</p>
              </button>
            ))}
          </div>
        ) : (
          <CockpitEmptyState title="Chưa có chuyến đang chạy" description="Các lệnh bốc hàng, đang vận chuyển hoặc đã đến công trình sẽ xuất hiện tại đây." />
        )}
      </CockpitChartCard>
    </div>
  )
}

function HistoryWorkspace({ orders, onSelect, loading }: { orders: DispatchOrder[]; onSelect: (order: DispatchOrder) => void; loading: boolean }) {
  return <DispatchTable orders={orders} onSelect={onSelect} loading={loading} />
}

function DispatchTable({ orders, onSelect, loading }: { orders: DispatchOrder[]; onSelect: (order: DispatchOrder) => void; loading: boolean }) {
  if (loading) {
    return <CockpitChartCard title="Danh sách điều xe" className="h-[560px]"><CockpitEmptyState title="Đang tải dữ liệu" description="Đang đọc lệnh điều xe từ hệ thống." /></CockpitChartCard>
  }

  if (!orders.length) {
    return <CockpitChartCard title="Danh sách điều xe" className="h-[560px]"><CockpitEmptyState title="Chưa có lệnh điều xe" description="Dữ liệu sẽ xuất hiện khi phát sinh nghiệp vụ vận chuyển." /></CockpitChartCard>
  }

  return (
    <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Danh sách điều xe</h2>
        <span className="text-xs text-slate-500">{fmt(orders.length)} lệnh</span>
      </div>
      <CockpitTableShell className="h-[560px]">
        <table className="w-full min-w-[1120px] table-fixed text-[13px]">
          <thead className="border-b border-cyan-400/10 bg-transparent text-slate-300">
            <tr>{['Mã', 'Công trình', 'Task', 'Hàng hóa', 'Xe', 'Tài xế', 'Kế hoạch', 'Trạng thái'].map((header) => <th key={header} className="px-1.5 py-1 text-left font-medium">{header}</th>)}</tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} onClick={() => onSelect(order)} className="cursor-pointer border-b border-cyan-300/10 text-slate-300 hover:bg-cyan-300/[0.055]">
                <td className="px-1.5 py-2 font-mono text-cyan-300">{order.code}</td>
                <td className="px-1.5 py-2 text-white">{order.project?.name ?? '—'}</td>
                <td className="px-1.5 py-2">{order.projectTask?.name ?? '—'}</td>
                <td className="px-1.5 py-2">{fmt(order.items.length)} dòng</td>
                <td className="px-1.5 py-2">{order.vehicle || '—'}</td>
                <td className="px-1.5 py-2">{order.driver || '—'}</td>
                <td className="px-1.5 py-2 font-mono text-slate-300">{formatDate(order.plannedAt)}</td>
                <td className="px-1.5 py-2"><StatusBadge status={order.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CockpitTableShell>
    </section>
  )
}

function DispatchDetailDrawer({ order, onClose, onAction, pending }: { order: DispatchOrder | null; onClose: () => void; onAction: (action: 'loading' | 'depart' | 'arrive' | 'receive' | 'complete' | 'cancel') => void; pending: boolean }) {
  if (!order) return null

  const action = nextAction(order.status)

  return (
    <ModuleDetailDrawer open={Boolean(order)} onClose={onClose} title={`Điều xe ${order.code}`} subtitle={`${order.project?.name ?? 'Chưa rõ công trình'} · ${statusLabel[order.status]}`} size="md">
      <div className="space-y-3 text-sm text-slate-300">
        <section className="grid gap-2 md:grid-cols-2">
          <Info label="Công trình" value={order.project?.name} />
          <Info label="Task" value={order.projectTask?.name} />
          <Info label="Xe" value={order.vehicle} />
          <Info label="Tài xế" value={order.driver} />
          <Info label="Ngày kế hoạch" value={formatDateTime(order.plannedAt)} />
          <Info label="Trạng thái" value={statusLabel[order.status]} />
        </section>

        <Section title="Hàng hóa">
          <div className="space-y-2">
            {order.items.map((item) => <DispatchItemRow key={item.id} item={item} />)}
          </div>
        </Section>

        <Section title="Checklist bốc hàng">
          <div className="grid gap-2 md:grid-cols-2">
            {['Đã kiểm đếm', 'Đã QC', 'Đã chằng buộc', 'Đã chụp ảnh', 'Đã ký xác nhận'].map((label) => (
              <span key={label} className="rounded-lg border border-cyan-300/10 bg-slate-950/35 px-3 py-2 text-xs text-slate-300">
                <ClipboardCheck size={14} className="mr-2 inline text-cyan-300" />{label}
              </span>
            ))}
          </div>
        </Section>

        <Section title="Timeline / Logs">
          <div className="space-y-2">
            {order.events.map((event) => (
              <div key={event.id} className="rounded-lg border border-cyan-300/10 bg-cyan-400/[0.035] px-3 py-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-cyan-200">{event.type}</span>
                  <span className="font-mono text-slate-500">{formatDateTime(event.createdAt)}</span>
                </div>
                <p className="mt-1 text-slate-400">{event.message || '—'}</p>
              </div>
            ))}
          </div>
        </Section>

        <footer className="sticky bottom-0 -mx-1 flex flex-wrap justify-end gap-2 border-t border-cyan-300/10 bg-[#07111f]/95 px-1 py-3 backdrop-blur">
          {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' ? <button className={moduleMutedButton} onClick={() => onAction('cancel')} disabled={pending} type="button"><X size={14} /> Hủy</button> : null}
          {action ? <button className={modulePrimaryButton} onClick={() => onAction(action.id)} disabled={pending} type="button">{action.label}</button> : null}
        </footer>
      </div>
    </ModuleDetailDrawer>
  )
}

function CreateDispatchDrawer({ projects, onClose, onCreated }: { projects: ProjectRuntimeRow[]; onClose: () => void; onCreated: () => void }) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [projectTaskId, setProjectTaskId] = useState('')
  const [plannedAt, setPlannedAt] = useState(() => new Date().toISOString().slice(0, 16))
  const [vehicle, setVehicle] = useState('')
  const [driver, setDriver] = useState('')
  const [notes, setNotes] = useState('')
  const [suggestion, setSuggestion] = useState<DispatchSuggestion | null>(null)

  const suggestMutation = useMutation({
    mutationFn: suggestDispatchItems,
    onSuccess: (data) => {
      setSuggestion(data)
      const firstTask = data.items.find((item) => item.projectTaskId)?.projectTaskId
      if (firstTask) setProjectTaskId(firstTask)
    },
  })
  const createMutation = useMutation({
    mutationFn: createDispatchOrder,
    onSuccess: onCreated,
  })

  const selectedItems = suggestion?.items ?? []
  const canSubmit = Boolean(projectId) && selectedItems.length > 0

  const submit = () => {
    const payload: CreateDispatchOrderPayload = {
      projectId,
      projectTaskId: projectTaskId || undefined,
      plannedAt: plannedAt ? new Date(plannedAt).toISOString() : undefined,
      vehicle,
      driver,
      notes,
      items: selectedItems.map((item) => ({
        type: item.type,
        inventoryItemId: item.inventoryItemId,
        componentId: item.componentId,
        quantity: item.quantity,
      })),
    }
    createMutation.mutate(payload)
  }

  return (
    <ModuleDetailDrawer open onClose={onClose} title="Tạo điều xe" subtitle="Tự đề xuất hàng hóa từ task sắp tới của công trình" size="md">
      <div className="space-y-3 text-sm text-slate-300">
        <section className="grid gap-2 md:grid-cols-2">
          <label className="space-y-1 text-xs text-slate-400">Công trình
            <select className={`${moduleInput} w-full`} value={projectId} onChange={(event) => { setProjectId(event.target.value); setSuggestion(null) }}>
              <option value="">Chọn công trình</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.code} · {project.name}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs text-slate-400">Ngày kế hoạch
            <input className={`${moduleInput} w-full`} type="datetime-local" value={plannedAt} onChange={(event) => setPlannedAt(event.target.value)} />
          </label>
          <label className="space-y-1 text-xs text-slate-400">Xe
            <input className={`${moduleInput} w-full`} value={vehicle} onChange={(event) => setVehicle(event.target.value)} placeholder="VD: 51C-246.18" />
          </label>
          <label className="space-y-1 text-xs text-slate-400">Tài xế
            <input className={`${moduleInput} w-full`} value={driver} onChange={(event) => setDriver(event.target.value)} placeholder="Tên tài xế" />
          </label>
        </section>
        <label className="space-y-1 text-xs text-slate-400">Ghi chú
          <textarea className={`${moduleInput} h-20 w-full py-2`} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <button className={moduleMutedButton} type="button" onClick={() => projectId && suggestMutation.mutate({ projectId })} disabled={!projectId || suggestMutation.isPending}>
          <RefreshCw size={14} /> Tự đề xuất
        </button>
        <Section title="Hàng hóa đề xuất">
          {selectedItems.length ? (
            <div className="space-y-2">
              {selectedItems.map((item, index) => (
                <div key={`${item.type}-${item.inventoryItemId ?? item.componentId}-${index}`} className="rounded-lg border border-cyan-300/10 bg-slate-950/35 px-3 py-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white">{item.materialCode ?? item.componentCode} · {item.materialName ?? item.componentName}</span>
                    <span className="font-mono text-cyan-300">{fmt(item.quantity)} {item.unit ?? ''}</span>
                  </div>
                  <p className="mt-1 text-slate-500">{item.projectTaskName ?? 'Task'} · {item.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <CockpitEmptyState title="Chưa có hàng hóa đề xuất" description="Chọn công trình rồi bấm Tự đề xuất để đọc task, vật tư thiếu và cấu kiện đã gán." />
          )}
        </Section>
        <footer className="sticky bottom-0 -mx-1 flex justify-end gap-2 border-t border-cyan-300/10 bg-[#07111f]/95 px-1 py-3 backdrop-blur">
          <button className={moduleMutedButton} onClick={onClose} type="button">Hủy</button>
          <button className={modulePrimaryButton} onClick={submit} disabled={!canSubmit || createMutation.isPending} type="button">Tạo điều xe</button>
        </footer>
      </div>
    </ModuleDetailDrawer>
  )
}

function DispatchItemRow({ item }: { item: DispatchItem }) {
  const code = item.inventoryItem?.code ?? item.component?.code ?? '—'
  const name = item.inventoryItem?.name ?? item.component?.name ?? '—'
  return (
    <div className="rounded-lg border border-cyan-300/10 bg-slate-950/35 px-3 py-2 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-white">{code} · {name}</span>
        <span className="font-mono text-cyan-300">{fmt(item.quantity)} {item.inventoryItem?.unit ?? ''}</span>
      </div>
      <p className="mt-1 text-slate-500">{item.type === 'MATERIAL' ? 'Vật tư' : 'Cấu kiện'}</p>
    </div>
  )
}

function StatusBars({ counts }: { counts: Record<string, number> }) {
  const rows = Object.entries(counts)
  if (!rows.length) return <CockpitEmptyState title="Chưa có trạng thái" description="Dữ liệu sẽ xuất hiện khi có lệnh điều xe." />
  const max = Math.max(1, ...rows.map(([, value]) => value))
  return <div className="space-y-2 text-xs">{rows.map(([status, value]) => <div key={status}><div className="mb-1 flex justify-between"><span>{statusLabel[status as DispatchOrderStatus] ?? status}</span><span>{fmt(value)}</span></div><div className="h-2 rounded bg-white/10"><i className="block h-full rounded bg-cyan-400" style={{ width: `${(value / max) * 100}%` }} /></div></div>)}</div>
}

function TrendBars({ rows }: { rows: Array<{ date: string; total: number; completed: number }> }) {
  if (!rows.length) return <CockpitEmptyState title="Chưa có xu hướng" description="Dữ liệu sẽ xuất hiện khi phát sinh điều xe." />
  const max = Math.max(1, ...rows.map((row) => row.total))
  return <div className="flex h-[110px] items-end gap-2">{rows.slice(-12).map((row) => <div key={row.date} className="flex flex-1 flex-col items-center gap-1"><span className="w-full rounded-t bg-gradient-to-t from-blue-700 to-cyan-300" style={{ height: `${Math.max(6, (row.total / max) * 92)}px` }} /><span className="text-[10px] text-slate-500">{row.date.slice(5)}</span></div>)}</div>
}

function StatusBadge({ status }: { status: DispatchOrderStatus }) {
  return <span className={`rounded-lg border px-2 py-0.5 text-[11px] ${statusTone[status]}`}>{statusLabel[status]}</span>
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return <div className="rounded-lg border border-cyan-300/10 bg-slate-950/35 px-3 py-2"><p className="text-[11px] text-slate-500">{label}</p><p className="mt-1 text-sm text-white">{value || '—'}</p></div>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-cyan-300/10 bg-slate-950/25 p-3"><h3 className="mb-2 text-sm font-semibold text-white">{title}</h3>{children}</section>
}

function nextAction(status: DispatchOrderStatus): { id: 'loading' | 'depart' | 'arrive' | 'receive' | 'complete'; label: string } | null {
  if (status === 'DRAFT' || status === 'PLANNED') return { id: 'loading', label: 'Bắt đầu bốc hàng' }
  if (status === 'LOADING') return { id: 'depart', label: 'Rời bãi' }
  if (status === 'IN_TRANSIT') return { id: 'arrive', label: 'Đã đến công trình' }
  if (status === 'ARRIVED') return { id: 'receive', label: 'Công trình nhận hàng' }
  if (status === 'RECEIVED') return { id: 'complete', label: 'Hoàn thành' }
  return null
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value))
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
