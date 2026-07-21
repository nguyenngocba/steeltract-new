import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Filter,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Truck,
  X,
} from 'lucide-react'
import { useLocation } from 'react-router-dom'

import {
  advanceDispatchOrder,
  createDispatchOrder,
  getDispatchDashboard,
  getDispatchOrder,
  getDispatchOrders,
  suggestDispatchItems,
  type CreateDispatchOrderPayload,
  type DispatchItem,
  type DispatchOrder,
  type DispatchOrderStatus,
  type DispatchSuggestion,
} from '@/modules/logistics/api/logistics.api'
import { getProjectsRuntime, type ProjectRuntimeRow, type ProjectsRuntime } from '@/modules/projects/api/projects.api'
import { EnterpriseWorkspace } from '@/shared/ui/enterprise'
import {
  CockpitChartCard,
  CockpitEmptyState,
  CockpitKpiCard,
  CockpitRecentList,
  CockpitStatusList,
  CockpitTableShell,
  DataTablePagination,
} from '@/shared/ui/cockpit'
import {
  ModuleDetailDrawer,
  ModuleLoadingState,
  moduleInput,
  moduleMutedButton,
  modulePrimaryButton,
} from '@/shared/ui/modules'
import { formatQuantity } from '@/shared/utils/number-format'

type LogisticsTab =
  | 'overview'
  | 'planning'
  | 'dispatch'
  | 'loading'
  | 'tracking'
  | 'deliveries'
  | 'vehicles'
  | 'documents'
  | 'reports'

const tabs: Array<{ id: LogisticsTab; label: string; path: string }> = [
  { id: 'overview', label: 'Tổng quan', path: '/logistics' },
  { id: 'planning', label: 'Kế hoạch', path: '/logistics/planning' },
  { id: 'dispatch', label: 'Điều xe', path: '/logistics/dispatch' },
  { id: 'loading', label: 'Đang bốc hàng', path: '/logistics/loading' },
  { id: 'tracking', label: 'Đang vận chuyển', path: '/logistics/tracking' },
  { id: 'deliveries', label: 'Đã giao', path: '/logistics/deliveries' },
  { id: 'vehicles', label: 'Phương tiện', path: '/logistics/vehicles' },
  { id: 'documents', label: 'Chứng từ', path: '/logistics/documents' },
  { id: 'reports', label: 'Báo cáo & Lịch sử', path: '/logistics/reports' },
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

const getTabFromPath = (path: string): LogisticsTab => {
  if (path === '/logistics/planning') return 'planning'
  if (path === '/logistics/dispatch') return 'dispatch'
  if (path === '/logistics/loading') return 'loading'
  if (path === '/logistics/tracking' || path === '/logistics/shipment-tracking') return 'tracking'
  if (path === '/logistics/deliveries') return 'deliveries'
  if (path === '/logistics/vehicles') return 'vehicles'
  if (path === '/logistics/documents') return 'documents'
  if (path === '/logistics/reports' || path === '/logistics/history' || path === '/logistics/logs') return 'reports'
  return 'overview'
}

export function LogisticsPage() {
  const location = useLocation()
  const queryClient = useQueryClient()

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [projectFilter, setProjectFilter] = useState<string>('ALL')
  const [selectedOrder, setSelectedOrder] = useState<DispatchOrder | null>(null)
  const [creating, setCreating] = useState(false)

  const tab = getTabFromPath(location.pathname)

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
    let source = orders

    // Tab-based filtering
    if (tab === 'planning') {
      source = orders.filter((o) => ['DRAFT', 'PLANNED'].includes(o.status))
    } else if (tab === 'dispatch') {
      source = orders.filter((o) => ['DRAFT', 'PLANNED', 'LOADING'].includes(o.status))
    } else if (tab === 'loading') {
      source = orders.filter((o) => o.status === 'LOADING')
    } else if (tab === 'tracking') {
      source = orders.filter((o) => ['IN_TRANSIT', 'ARRIVED'].includes(o.status))
    } else if (tab === 'deliveries') {
      source = orders.filter((o) => ['ARRIVED', 'RECEIVED', 'COMPLETED'].includes(o.status))
    } else if (tab === 'reports') {
      source = orders.filter((o) => ['RECEIVED', 'COMPLETED', 'CANCELLED'].includes(o.status))
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      source = source.filter((o) => o.status === statusFilter)
    }

    // Project filter
    if (projectFilter !== 'ALL') {
      source = source.filter((o) => o.projectId === projectFilter || o.project?.id === projectFilter)
    }

    // Keyword search
    const keyword = query.trim().toLowerCase()
    if (!keyword) return source

    return source.filter((order) =>
      [
        order.code,
        order.project?.code,
        order.project?.name,
        order.projectTask?.name,
        order.vehicle,
        order.driver,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(keyword),
    )
  }, [orders, query, tab, statusFilter, projectFilter])

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

  const isFiltered = Boolean(query || statusFilter !== 'ALL' || projectFilter !== 'ALL')

  return (
    <EnterpriseWorkspace
      eyebrow="Logistics"
      title="Vận chuyển"
      description="Điều xe, theo dõi giao nhận từ kho/bãi đến công trình."
      breadcrumbs={['Vận hành', 'Vận chuyển']}
      tabs={tabs}
      activeTab={tab}
      actions={
        <div className="flex items-center gap-2">
          <button className={moduleMutedButton} onClick={refresh} type="button">
            <RefreshCw size={14} /> Làm mới
          </button>
          <button className={modulePrimaryButton} onClick={() => setCreating(true)} type="button">
            <Plus size={14} /> Tạo điều xe
          </button>
        </div>
      }
    >
      {/* 1. Operational KPIs */}
      <section className="grid gap-1 md:grid-cols-2 xl:grid-cols-4">
        <CockpitKpiCard
          title="Chờ điều xe"
          value={fmt(dashboard?.kpis.waiting ?? 0)}
          note="Nháp / kế hoạch / bốc hàng"
          icon={<CalendarClock size={18} />}
          tone="amber"
          state={dashboardLoading ? 'loading' : 'normal'}
        />
        <CockpitKpiCard
          title="Đang vận chuyển"
          value={fmt(dashboard?.kpis.inTransit ?? 0)}
          note="Đang chạy tuyến"
          icon={<Truck size={18} />}
          tone="blue"
          state={dashboardLoading ? 'loading' : 'normal'}
        />
        <CockpitKpiCard
          title="Đã giao công trình"
          value={fmt(dashboard?.kpis.delivered ?? 0)}
          note="Đã đến / đã nhận"
          icon={<PackageCheck size={18} />}
          tone="cyan"
          state={dashboardLoading ? 'loading' : 'normal'}
        />
        <CockpitKpiCard
          title="Hoàn thành chuyến"
          value={fmt(dashboard?.kpis.completed ?? 0)}
          note="Đóng giao nhận"
          icon={<CheckCircle2 size={18} />}
          tone="emerald"
          state={dashboardLoading ? 'loading' : 'normal'}
        />
      </section>

      {/* 2. Toolbar & Quick Filters */}
      <section className="my-1 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-2">
        <div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/45 px-2">
          <Search size={14} className="text-cyan-300 shrink-0" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm mã điều xe, công trình, xe, tài xế..."
            className="h-8 w-full bg-transparent text-xs text-slate-100 outline-none placeholder:text-slate-500"
          />
        </div>

        {/* Quick Status Chips */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'PLANNED', label: 'Kế hoạch' },
            { id: 'LOADING', label: 'Bốc hàng' },
            { id: 'IN_TRANSIT', label: 'Đang chạy' },
            { id: 'ARRIVED', label: 'Đã đến' },
            { id: 'COMPLETED', label: 'Hoàn thành' },
          ].map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setStatusFilter(chip.id)}
              className={`h-8 whitespace-nowrap rounded-lg px-2.5 text-xs transition ${
                statusFilter === chip.id
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 font-semibold'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/5'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Filter size={14} className="text-slate-400" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-lg border border-white/10 bg-slate-950/45 px-2 text-xs text-slate-200 outline-none focus:border-cyan-400"
          >
            <option value="ALL">Tất cả trạng thái</option>
            {Object.entries(statusLabel).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="h-8 max-w-[180px] truncate rounded-lg border border-white/10 bg-slate-950/45 px-2 text-xs text-slate-200 outline-none focus:border-cyan-400"
          >
            <option value="ALL">Tất cả công trình</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} · {p.name}
              </option>
            ))}
          </select>

          {isFiltered && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setStatusFilter('ALL')
                setProjectFilter('ALL')
              }}
              className="h-8 rounded-lg border border-red-500/30 bg-red-500/10 px-2 text-xs font-medium text-red-300 hover:bg-red-500/20 transition flex items-center gap-1 shrink-0"
              title="Xóa bộ lọc"
            >
              <X size={12} /> Xóa lọc
            </button>
          )}
        </div>
      </section>

      {/* 3. Main Workspace & Analytics Rail */}
      {tab === 'vehicles' ? (
        <VehiclesWorkspace dashboard={dashboard} orders={orders} loading={isLoading} />
      ) : tab === 'documents' ? (
        <DocumentsWorkspace orders={orders} onSelect={setSelectedOrder} loading={isLoading} />
      ) : (
        <MainLogisticsWorkspace
          tab={tab}
          orders={filteredOrders}
          dashboard={dashboard}
          onSelect={setSelectedOrder}
          loading={isLoading}
        />
      )}

      {/* Drawers */}
      <DispatchDetailDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onAction={(action) => (selectedOrder ? advanceMutation.mutate({ id: selectedOrder.id, action }) : undefined)}
        pending={advanceMutation.isPending}
      />
      {creating ? (
        <CreateDispatchDrawer
          projects={projects}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false)
            refresh()
          }}
        />
      ) : null}
    </EnterpriseWorkspace>
  )
}

function MainLogisticsWorkspace({
  tab,
  orders,
  dashboard,
  onSelect,
  loading,
}: {
  tab: LogisticsTab
  orders: DispatchOrder[]
  dashboard?: Awaited<ReturnType<typeof getDispatchDashboard>>
  onSelect: (order: DispatchOrder) => void
  loading: boolean
}) {
  const getTabQuestion = (currentTab: LogisticsTab) => {
    switch (currentTab) {
      case 'planning':
        return 'Kế hoạch giao vận sắp tới'
      case 'dispatch':
        return 'Danh sách lệnh cần điều xe / xử lý'
      case 'loading':
        return 'Chuyến xe đang thực hiện bốc xếp tại kho/bãi'
      case 'tracking':
        return 'Tuyến vận chuyển đang di chuyển đến công trình'
      case 'deliveries':
        return 'Đơn vị giao nhận đã đến / đã hoàn tất nhận hàng'
      case 'reports':
        return 'Lịch sử và báo cáo hoàn thành điều xe'
      default:
        return 'Tổng quan danh sách lệnh vận chuyển'
    }
  }

  return (
    <div className="grid gap-1 xl:grid-cols-[minmax(0,1fr)_360px]">
      <DispatchTable
        orders={orders}
        onSelect={onSelect}
        loading={loading}
        title={getTabQuestion(tab)}
      />
      <aside className="space-y-1">
        <CockpitChartCard title="Phân bố Trạng thái" className="h-[170px]">
          <StatusBars counts={dashboard?.statusCounts ?? {}} />
        </CockpitChartCard>
        <CockpitChartCard title="Xu hướng Điều xe" className="h-[170px]">
          <TrendBars rows={dashboard?.trend ?? []} />
        </CockpitChartCard>
        <CockpitStatusList
          items={(dashboard?.vehicleUtilization ?? []).slice(0, 5).map((row) => ({
            id: row.vehicle,
            label: row.vehicle,
            value: `${fmt(row.active)} hoạt động / ${fmt(row.total)} tổng`,
            statusTone: row.active > 0 ? 'cyan' : undefined,
          }))}
          emptyMessage="Chưa có dữ liệu phương tiện."
        />
      </aside>
    </div>
  )
}

function VehiclesWorkspace({
  dashboard,
  orders,
  loading,
}: {
  dashboard?: Awaited<ReturnType<typeof getDispatchDashboard>>
  orders: DispatchOrder[]
  loading: boolean
}) {
  const vehicles = useMemo(() => {
    const list = dashboard?.vehicleUtilization ?? []
    if (list.length > 0) return list

    // Aggregate from orders if vehicleUtilization array is empty
    const map = new Map<string, { vehicle: string; total: number; active: number }>()
    orders.forEach((o) => {
      const v = o.vehicle || 'Chưa gán xe'
      const cur = map.get(v) || { vehicle: v, total: 0, active: 0 }
      cur.total += 1
      if (['LOADING', 'IN_TRANSIT', 'ARRIVED'].includes(o.status)) {
        cur.active += 1
      }
      map.set(v, cur)
    })
    return Array.from(map.values())
  }, [dashboard, orders])

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return vehicles.slice(start, start + pageSize)
  }, [vehicles, page, pageSize])

  if (loading) return <ModuleLoadingState label="Đang tải danh sách xe" />

  return (
    <div className="grid gap-1 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3 flex flex-col justify-between">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Quản lý Đội xe & Phương tiện vận chuyển</h2>
            <span className="text-xs text-slate-500">{fmt(vehicles.length)} phương tiện</span>
          </div>
          <CockpitTableShell className="min-h-[480px]">
            {vehicles.length > 0 ? (
              <table className="w-full min-w-[600px] table-fixed text-[13px]">
                <thead className="border-b border-cyan-400/10 bg-transparent text-slate-300">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Biển số / Phương tiện</th>
                    <th className="px-3 py-2 text-center font-medium">Chuyến đang chạy</th>
                    <th className="px-3 py-2 text-center font-medium">Tổng số chuyến</th>
                    <th className="px-3 py-2 text-right font-medium">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((v) => (
                    <tr key={v.vehicle} className="border-b border-cyan-300/10 text-slate-300 hover:bg-cyan-300/[0.055]">
                      <td className="px-3 py-2 font-semibold text-white flex items-center gap-2">
                        <Truck size={14} className="text-cyan-300 shrink-0" />
                        {v.vehicle}
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-cyan-300">{fmt(v.active)}</td>
                      <td className="px-3 py-2 text-center font-mono text-slate-200">{fmt(v.total)}</td>
                      <td className="px-3 py-2 text-right">
                        <span
                          className={`rounded-lg border px-2 py-0.5 text-[11px] ${
                            v.active > 0
                              ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                              : 'border-slate-500/30 bg-slate-500/10 text-slate-400'
                          }`}
                        >
                          {v.active > 0 ? 'Đang chạy tuyến' : 'Sẵn sàng / Nhàn rỗi'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <CockpitEmptyState
                title="Chưa có dữ liệu xe"
                description="Các phương tiện được điều động trong lệnh vận chuyển sẽ tự động cập nhật thống kê tại đây."
              />
            )}
          </CockpitTableShell>
        </div>
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          total={vehicles.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 20, 50]}
        />
      </section>

      <aside className="space-y-1">
        <CockpitChartCard title="Mật độ sử dụng xe" className="h-[240px]">
          <CockpitStatusList
            items={vehicles.slice(0, 7).map((row) => ({
              id: row.vehicle,
              label: row.vehicle,
              value: `${fmt(row.active)} đang chạy / ${fmt(row.total)} tổng`,
              statusTone: row.active > 0 ? 'cyan' : undefined,
            }))}
            emptyMessage="Chưa có phương tiện."
          />
        </CockpitChartCard>
      </aside>
    </div>
  )
}

function DocumentsWorkspace({
  orders,
  onSelect,
  loading,
}: {
  orders: DispatchOrder[]
  onSelect: (order: DispatchOrder) => void
  loading: boolean
}) {
  const documentOrders = useMemo(() => {
    return orders.filter((o) => o.events.length > 0 || o.items.length > 0)
  }, [orders])

  if (loading) return <ModuleLoadingState label="Đang tải chứng từ vận chuyển" />

  return (
    <div className="grid gap-1 xl:grid-cols-[minmax(0,1fr)_360px]">
      <DispatchTable
        orders={documentOrders}
        onSelect={onSelect}
        loading={loading}
        title="Hồ sơ & Chứng từ giao nhận vận chuyển"
      />

      <aside className="space-y-1">
        <CockpitChartCard title="Lưu vết chứng từ" className="h-[300px]">
          <CockpitRecentList
            items={orders
              .flatMap((o) => o.events.map((e) => ({ order: o, event: e })))
              .slice(0, 8)
              .map(({ order, event }) => ({
                id: event.id,
                title: `${order.code} · ${event.type}`,
                subtitle: event.message || 'Lưu vết lịch sử giao nhận',
                time: formatDate(event.createdAt),
              }))}
            emptyMessage="Chưa có biên bản/chứng từ."
          />
        </CockpitChartCard>
      </aside>
    </div>
  )
}

function DispatchTable({
  orders,
  onSelect,
  loading,
  title = 'Danh sách điều xe',
}: {
  orders: DispatchOrder[]
  onSelect: (order: DispatchOrder) => void
  loading: boolean
  title?: string
}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize
    return orders.slice(start, start + pageSize)
  }, [orders, page, pageSize])

  if (loading) {
    return <ModuleLoadingState label="Đang đọc dữ liệu vận chuyển" />
  }

  return (
    <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3 flex flex-col justify-between">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <span className="text-xs text-slate-500">{fmt(orders.length)} lệnh</span>
        </div>
        <CockpitTableShell className="min-h-[480px]">
          {orders.length > 0 ? (
            <table className="w-full min-w-[1150px] table-fixed text-[13px]">
              <thead className="border-b border-cyan-400/10 bg-transparent text-slate-300">
                <tr>
                  {['Mã lệnh', 'Công trình', 'Task', 'Hàng hóa', 'Xe', 'Tài xế', 'Kế hoạch', 'Trạng thái', 'Thao tác'].map(
                    (header, idx) => (
                      <th
                        key={header}
                        className={`px-2 py-2 font-medium ${idx === 8 ? 'text-right' : 'text-left'}`}
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => onSelect(order)}
                    className="cursor-pointer border-b border-cyan-300/10 text-slate-300 hover:bg-cyan-300/[0.055] transition"
                  >
                    <td className="px-2 py-2 font-mono font-semibold text-cyan-300">{order.code}</td>
                    <td className="px-2 py-2 text-white truncate">{order.project?.name ?? '—'}</td>
                    <td className="px-2 py-2 truncate">{order.projectTask?.name ?? '—'}</td>
                    <td className="px-2 py-2 font-mono">{fmt(order.items.length)} dòng</td>
                    <td className="px-2 py-2 font-medium">{order.vehicle || '—'}</td>
                    <td className="px-2 py-2">{order.driver || '—'}</td>
                    <td className="px-2 py-2 font-mono text-slate-400">{formatDate(order.plannedAt)}</td>
                    <td className="px-2 py-2">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelect(order)
                        }}
                        className="inline-flex items-center gap-0.5 rounded bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
                      >
                        Chi tiết <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <CockpitEmptyState
              title="Chưa có dữ liệu chuyến xe"
              description="Không tìm thấy chuyến vận chuyển thỏa mãn điều kiện lọc hiện tại."
            />
          )}
        </CockpitTableShell>
      </div>

      {orders.length > 0 && (
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          total={orders.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 20, 50]}
        />
      )}
    </section>
  )
}

function DispatchDetailDrawer({
  order,
  onClose,
  onAction,
  pending,
}: {
  order: DispatchOrder | null
  onClose: () => void
  onAction: (action: 'loading' | 'depart' | 'arrive' | 'receive' | 'complete' | 'cancel') => void
  pending: boolean
}) {
  const { data: freshOrder } = useQuery({
    queryKey: ['logistics-dispatch-detail', order?.id],
    queryFn: () => getDispatchOrder(order!.id),
    enabled: Boolean(order?.id),
    staleTime: 15_000,
  })
  if (!order) return null
  const detailOrder = freshOrder ?? order
  const action = nextAction(detailOrder.status)

  return (
    <ModuleDetailDrawer
      open={Boolean(order)}
      onClose={onClose}
      title={`Điều xe ${detailOrder.code}`}
      subtitle={`${detailOrder.project?.name ?? 'Chưa rõ công trình'} · ${statusLabel[detailOrder.status]}`}
      size="md"
    >
      <div className="space-y-3 text-sm text-slate-300">
        <section className="grid gap-2 md:grid-cols-2">
          <Info label="Công trình" value={detailOrder.project?.name} />
          <Info label="Task" value={detailOrder.projectTask?.name} />
          <Info label="Phương tiện" value={detailOrder.vehicle} />
          <Info label="Tài xế" value={detailOrder.driver} />
          <Info label="Ngày kế hoạch" value={formatDateTime(detailOrder.plannedAt)} />
          <Info label="Trạng thái" value={statusLabel[detailOrder.status]} />
        </section>

        <Section title="Hàng hóa vận chuyển">
          <div className="space-y-2">
            {detailOrder.items.length > 0 ? (
              detailOrder.items.map((item) => <DispatchItemRow key={item.id} item={item} />)
            ) : (
              <CockpitEmptyState title="Chưa có chi tiết hàng hóa" description="Lệnh điều xe này chưa gán danh mục hàng hóa." />
            )}
          </div>
        </Section>

        <Section title="Checklist giao nhận & bốc xếp">
          <div className="grid gap-2 md:grid-cols-2">
            {['Đã kiểm đếm', 'Đã QC kiểm định', 'Đã chằng buộc', 'Đã chụp ảnh kiểm soát', 'Đã ký biên bản'].map((label) => (
              <span key={label} className="rounded-lg border border-cyan-300/10 bg-slate-950/35 px-3 py-2 text-xs text-slate-300">
                <ClipboardCheck size={14} className="mr-2 inline text-cyan-300" />
                {label}
              </span>
            ))}
          </div>
        </Section>

        <Section title="Lịch sử sự kiện / Timeline">
          <div className="space-y-2">
            {detailOrder.events.length > 0 ? (
              detailOrder.events.map((event) => (
                <div key={event.id} className="rounded-lg border border-cyan-300/10 bg-cyan-400/[0.035] px-3 py-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-cyan-200">{event.type}</span>
                    <span className="font-mono text-slate-500">{formatDateTime(event.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-slate-400">{event.message || '—'}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">Chưa ghi nhận sự kiện chuyển trạng thái.</p>
            )}
          </div>
        </Section>

        <footer className="sticky bottom-0 -mx-1 flex flex-wrap justify-end gap-2 border-t border-cyan-300/10 bg-[#07111f]/95 px-1 py-3 backdrop-blur">
          {detailOrder.status !== 'COMPLETED' && detailOrder.status !== 'CANCELLED' ? (
            <button className={moduleMutedButton} onClick={() => onAction('cancel')} disabled={pending} type="button">
              <X size={14} /> Hủy lệnh
            </button>
          ) : null}
          {action ? (
            <button className={modulePrimaryButton} onClick={() => onAction(action.id)} disabled={pending} type="button">
              {action.label}
            </button>
          ) : null}
        </footer>
      </div>
    </ModuleDetailDrawer>
  )
}

function CreateDispatchDrawer({
  projects,
  onClose,
  onCreated,
}: {
  projects: ProjectRuntimeRow[]
  onClose: () => void
  onCreated: () => void
}) {
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
    <ModuleDetailDrawer open onClose={onClose} title="Tạo lệnh điều xe mới" subtitle="Đề xuất hàng hóa tự động theo tiến độ công trình" size="md">
      <div className="space-y-3 text-sm text-slate-300">
        <section className="grid gap-2 md:grid-cols-2">
          <label className="space-y-1 text-xs text-slate-400">
            Công trình
            <select
              className={`${moduleInput} w-full`}
              value={projectId}
              onChange={(event) => {
                setProjectId(event.target.value)
                setSuggestion(null)
              }}
            >
              <option value="">Chọn công trình</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} · {project.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs text-slate-400">
            Ngày kế hoạch
            <input
              className={`${moduleInput} w-full`}
              type="datetime-local"
              value={plannedAt}
              onChange={(event) => setPlannedAt(event.target.value)}
            />
          </label>
          <label className="space-y-1 text-xs text-slate-400">
            Biển số xe
            <input
              className={`${moduleInput} w-full`}
              value={vehicle}
              onChange={(event) => setVehicle(event.target.value)}
              placeholder="VD: 51C-246.18"
            />
          </label>
          <label className="space-y-1 text-xs text-slate-400">
            Tài xế điều khiển
            <input
              className={`${moduleInput} w-full`}
              value={driver}
              onChange={(event) => setDriver(event.target.value)}
              placeholder="Họ tên tài xế"
            />
          </label>
        </section>
        <label className="space-y-1 text-xs text-slate-400">
          Ghi chú chuyến xe
          <textarea
            className={`${moduleInput} h-20 w-full py-2`}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
        <button
          className={moduleMutedButton}
          type="button"
          onClick={() => projectId && suggestMutation.mutate({ projectId })}
          disabled={!projectId || suggestMutation.isPending}
        >
          <RefreshCw size={14} /> Tự đề xuất hàng hóa
        </button>

        <Section title="Hàng hóa đề xuất giao vận">
          {selectedItems.length ? (
            <div className="space-y-2">
              {selectedItems.map((item, index) => (
                <div
                  key={`${item.type}-${item.inventoryItemId ?? item.componentId}-${index}`}
                  className="rounded-lg border border-cyan-300/10 bg-slate-950/35 px-3 py-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white">
                      {item.materialCode ?? item.componentCode} · {item.materialName ?? item.componentName}
                    </span>
                    <span className="font-mono text-cyan-300">
                      {fmt(item.quantity)} {item.unit ?? ''}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-500">
                    {item.projectTaskName ?? 'Task'} · {item.reason}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <CockpitEmptyState
              title="Chưa có hàng hóa đề xuất"
              description="Chọn công trình rồi bấm Tự đề xuất để đọc task, vật tư thiếu và cấu kiện cần vận chuyển."
            />
          )}
        </Section>
        <footer className="sticky bottom-0 -mx-1 flex justify-end gap-2 border-t border-cyan-300/10 bg-[#07111f]/95 px-1 py-3 backdrop-blur">
          <button className={moduleMutedButton} onClick={onClose} type="button">
            Hủy
          </button>
          <button className={modulePrimaryButton} onClick={submit} disabled={!canSubmit || createMutation.isPending} type="button">
            Tạo lệnh điều xe
          </button>
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
        <span className="font-semibold text-white">
          {code} · {name}
        </span>
        <span className="font-mono text-cyan-300">
          {fmt(item.quantity)} {item.inventoryItem?.unit ?? ''}
        </span>
      </div>
      <p className="mt-1 text-slate-500">{item.type === 'MATERIAL' ? 'Vật tư' : 'Cấu kiện'}</p>
    </div>
  )
}

function StatusBars({ counts }: { counts: Record<string, number> }) {
  const rows = Object.entries(counts)
  if (!rows.length)
    return <CockpitEmptyState title="Chưa có trạng thái" description="Dữ liệu sẽ xuất hiện khi có lệnh điều xe." />
  const max = Math.max(1, ...rows.map(([, value]) => value))
  return (
    <div className="space-y-2 text-xs">
      {rows.map(([status, value]) => (
        <div key={status}>
          <div className="mb-1 flex justify-between">
            <span className="text-slate-300">{statusLabel[status as DispatchOrderStatus] ?? status}</span>
            <span className="font-mono font-semibold text-cyan-300">{fmt(value)}</span>
          </div>
          <div className="h-2 rounded bg-white/10">
            <i
              className="block h-full rounded bg-gradient-to-r from-blue-500 to-cyan-400"
              style={{ width: `${(value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function TrendBars({ rows }: { rows: Array<{ date: string; total: number; completed: number }> }) {
  if (!rows.length)
    return <CockpitEmptyState title="Chưa có xu hướng" description="Dữ liệu sẽ xuất hiện khi phát sinh điều xe." />
  const max = Math.max(1, ...rows.map((row) => row.total))
  return (
    <div className="flex h-[110px] items-end gap-2">
      {rows.slice(-12).map((row) => (
        <div key={row.date} className="flex flex-1 flex-col items-center gap-1">
          <span
            className="w-full rounded-t bg-gradient-to-t from-blue-700 to-cyan-300"
            style={{ height: `${Math.max(6, (row.total / max) * 92)}px` }}
          />
          <span className="text-[10px] text-slate-500">{row.date.slice(5)}</span>
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: DispatchOrderStatus }) {
  return <span className={`rounded-lg border px-2 py-0.5 text-[11px] ${statusTone[status]}`}>{statusLabel[status]}</span>
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg border border-cyan-300/10 bg-slate-950/35 px-3 py-2">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-white">{value || '—'}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-cyan-300/10 bg-slate-950/25 p-3">
      <h3 className="mb-2 text-sm font-semibold text-white">{title}</h3>
      {children}
    </section>
  )
}

function nextAction(
  status: DispatchOrderStatus,
): { id: 'loading' | 'depart' | 'arrive' | 'receive' | 'complete'; label: string } | null {
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
