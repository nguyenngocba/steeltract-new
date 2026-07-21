import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  Boxes,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Factory,
  Filter,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Truck,
  X,
} from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { getDispatchOrders } from '@/modules/logistics/api/logistics.api'
import { getProjectsRuntime, type ProjectsRuntime } from '@/modules/projects/api/projects.api'
import { productionApi, type ProductionOrder } from '@/modules/production/api/production.api'
import { getInventoryItems } from '@/modules/inventory/api/inventory.api'
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

type PlanningTab =
  | 'overview'
  | 'master'
  | 'production'
  | 'capacity'
  | 'material'
  | 'procurement'
  | 'schedule'
  | 'calendar'
  | 'constraints'
  | 'reports'

const tabs: Array<{ id: PlanningTab; label: string; path: string }> = [
  { id: 'overview', label: 'Tổng quan', path: '/planning' },
  { id: 'master', label: 'Kế hoạch tổng thể', path: '/planning/master' },
  { id: 'production', label: 'Kế hoạch sản xuất', path: '/planning/production' },
  { id: 'capacity', label: 'Năng lực xưởng', path: '/planning/capacity' },
  { id: 'material', label: 'Nhu cầu vật tư (MRP)', path: '/planning/material' },
  { id: 'procurement', label: 'Mua hàng', path: '/planning/procurement' },
  { id: 'schedule', label: 'Lịch chạy hàng ngày', path: '/planning/schedule' },
  { id: 'calendar', label: 'Lịch tuần', path: '/planning/calendar' },
  { id: 'constraints', label: 'Điểm nghẽn', path: '/planning/constraints' },
  { id: 'reports', label: 'Báo cáo', path: '/planning/reports' },
]

const fmt = (value = 0) => formatQuantity(value, 0)

const getTabFromPath = (path: string): PlanningTab => {
  if (path === '/planning/master') return 'master'
  if (path === '/planning/production' || path === '/production/planning') return 'production'
  if (path === '/planning/capacity') return 'capacity'
  if (path === '/planning/material') return 'material'
  if (path === '/planning/procurement') return 'procurement'
  if (path === '/planning/schedule') return 'schedule'
  if (path === '/planning/calendar') return 'calendar'
  if (path === '/planning/constraints') return 'constraints'
  if (path === '/planning/reports') return 'reports'
  return 'overview'
}

type PlanRow = {
  id: string
  code: string
  title: string
  projectCode?: string
  projectName?: string
  category: 'PRODUCTION' | 'MATERIAL' | 'LOGISTICS' | 'CAPACITY'
  status: 'DRAFT' | 'PLANNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'
  plannedStartDate?: string
  plannedEndDate?: string
  quantity?: number
  unit?: string
  progress?: number
  blockerReason?: string
}

export function PlanningPage() {
  const location = useLocation()
  const queryClient = useQueryClient()

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [projectFilter, setProjectFilter] = useState<string>('ALL')
  const [selectedPlan, setSelectedPlan] = useState<PlanRow | null>(null)
  const [creating, setCreating] = useState(false)

  const tab = getTabFromPath(location.pathname)

  // Real data queries
  const { data: productionOrders = [], isLoading: productionLoading } = useQuery<ProductionOrder[]>({
    queryKey: ['production-orders'],
    queryFn: () => productionApi.orders(),
  })

  const { data: projectsRuntime, isLoading: projectsLoading } = useQuery<ProjectsRuntime>({
    queryKey: ['project-runtime'],
    queryFn: getProjectsRuntime,
  })

  const { data: inventoryItems = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: getInventoryItems,
  })

  const { data: dispatchOrders = [], isLoading: dispatchLoading } = useQuery({
    queryKey: ['logistics-dispatch-orders'],
    queryFn: getDispatchOrders,
  })

  const isLoading = productionLoading || projectsLoading || inventoryLoading || dispatchLoading

  // Aggregated Plan Rows derived from authoritative production orders and projects
  const planRows = useMemo<PlanRow[]>(() => {
    const rows: PlanRow[] = []

    // 1. Map Production Orders into Production Plans
    productionOrders.forEach((mo: any) => {
      const isBlocked = Number(mo.scrapCount) > 0 || String(mo.notes || '').toLowerCase().includes('lỗi')
      rows.push({
        id: `mo-${mo.id}`,
        code: mo.code || `MO-${mo.id.slice(0, 6)}`,
        title: `Lệnh sản xuất cấu kiện: ${mo.component?.name || mo.code}`,
        projectCode: mo.project?.code,
        projectName: mo.project?.name,
        category: 'PRODUCTION',
        status: isBlocked
          ? 'BLOCKED'
          : mo.status === 'COMPLETED'
            ? 'COMPLETED'
            : mo.status === 'RUNNING' || mo.status === 'IN_PROGRESS'
              ? 'IN_PROGRESS'
              : 'PLANNED',
        plannedStartDate: mo.startDate || mo.createdAt,
        plannedEndDate: mo.targetDate || mo.plannedDate,
        quantity: Number(mo.targetQuantity || mo.quantity || 1),
        unit: mo.unit || 'cấu kiện',
        progress: mo.targetQuantity ? Math.min(100, Math.round((Number(mo.completedQuantity || 0) / Number(mo.targetQuantity)) * 100)) : 0,
        blockerReason: isBlocked ? 'Cần xử lý sai lệch kiểm định QC / Phế phẩm' : undefined,
      })
    })

    // 2. Map Projects into Master Plans
    const projects = projectsRuntime?.projects ?? []
    projects.forEach((proj: any) => {
      rows.push({
        id: `proj-${proj.id}`,
        code: proj.code,
        title: `Tiến độ công trình: ${proj.name}`,
        projectCode: proj.code,
        projectName: proj.name,
        category: 'PRODUCTION',
        status: proj.status === 'COMPLETED' ? 'COMPLETED' : proj.status === 'ACTIVE' ? 'IN_PROGRESS' : 'PLANNED',
        plannedStartDate: proj.startedAt || proj.createdAt,
        plannedEndDate: proj.plannedEndAt,
        progress: Number(proj.progress || 0),
      })
    })

    // 3. Map Logistics Dispatch Schedule into Logistics Plans
    dispatchOrders.forEach((d) => {
      rows.push({
        id: `dispatch-${d.id}`,
        code: d.code,
        title: `Kế hoạch vận chuyển đến ${d.project?.name || 'Công trình'}`,
        projectCode: d.project?.code,
        projectName: d.project?.name,
        category: 'LOGISTICS',
        status: d.status === 'COMPLETED' ? 'COMPLETED' : ['LOADING', 'IN_TRANSIT'].includes(d.status) ? 'IN_PROGRESS' : 'PLANNED',
        plannedStartDate: d.plannedAt || d.createdAt,
        quantity: d.items?.length || 0,
        unit: 'dòng hàng',
      })
    })

    // 4. Map Material Shortages into Material Plans (MRP)
    inventoryItems.forEach((m: any) => {
      const qty = Number(m.quantity || 0)
      const minQty = Number(m.minQuantity || m.reorderPoint || 0)
      if (qty < minQty || (minQty > 0 && qty <= minQty * 1.2)) {
        rows.push({
          id: `mrp-${m.id}`,
          code: `MRP-${m.code}`,
          title: `Nhu cầu bổ sung vật tư: ${m.name}`,
          category: 'MATERIAL',
          status: qty < minQty ? 'BLOCKED' : 'PLANNED',
          quantity: Math.max(1, minQty - qty),
          unit: m.unit || 'kg',
          blockerReason: qty < minQty ? `Tồn kho khả dụng (${fmt(qty)}) dưới định mức tối thiểu (${fmt(minQty)})` : undefined,
        })
      }
    })

    return rows
  }, [productionOrders, projectsRuntime, dispatchOrders, inventoryItems])

  // Contextual filtering based on Tab, Status, Project, and Search
  const filteredPlans = useMemo(() => {
    let source = planRows

    if (tab === 'production') {
      source = planRows.filter((p) => p.category === 'PRODUCTION')
    } else if (tab === 'material' || tab === 'procurement') {
      source = planRows.filter((p) => p.category === 'MATERIAL')
    } else if (tab === 'capacity') {
      source = planRows.filter((p) => p.category === 'CAPACITY' || p.category === 'PRODUCTION')
    } else if (tab === 'schedule' || tab === 'calendar') {
      source = planRows.filter((p) => p.status === 'PLANNED' || p.status === 'SCHEDULED' || p.status === 'IN_PROGRESS')
    } else if (tab === 'constraints') {
      source = planRows.filter((p) => p.status === 'BLOCKED' || Boolean(p.blockerReason))
    } else if (tab === 'reports') {
      source = planRows.filter((p) => p.status === 'COMPLETED' || p.status === 'IN_PROGRESS')
    }

    if (statusFilter !== 'ALL') {
      source = source.filter((p) => p.status === statusFilter)
    }

    if (projectFilter !== 'ALL') {
      source = source.filter((p) => p.projectCode === projectFilter || p.projectName === projectFilter)
    }

    const keyword = query.trim().toLowerCase()
    if (!keyword) return source

    return source.filter((p) =>
      [p.code, p.title, p.projectCode, p.projectName, p.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(keyword),
    )
  }, [planRows, tab, statusFilter, projectFilter, query])

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['production-cockpit'] })
    queryClient.invalidateQueries({ queryKey: ['project-runtime'] })
    queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
    queryClient.invalidateQueries({ queryKey: ['logistics-dispatch-orders'] })
  }

  const projects = projectsRuntime?.projects ?? []
  const isFiltered = Boolean(query || statusFilter !== 'ALL' || projectFilter !== 'ALL')

  // Operational KPIs
  const totalPlanned = planRows.filter((p) => p.status === 'PLANNED' || p.status === 'SCHEDULED').length
  const totalInProgress = planRows.filter((p) => p.status === 'IN_PROGRESS').length
  const totalBlocked = planRows.filter((p) => p.status === 'BLOCKED' || Boolean(p.blockerReason)).length
  const totalCompleted = planRows.filter((p) => p.status === 'COMPLETED').length

  return (
    <EnterpriseWorkspace
      eyebrow="Planning"
      title="Kế hoạch tổng thể"
      description="Lập lịch sản xuất, cân đối nguồn lực, vật tư MRP và tiến độ giao vận."
      breadcrumbs={['Vận hành', 'Kế hoạch']}
      tabs={tabs}
      activeTab={tab}
      actions={
        <div className="flex items-center gap-2">
          <button className={moduleMutedButton} onClick={refresh} type="button">
            <RefreshCw size={14} /> Làm mới
          </button>
          <button className={modulePrimaryButton} onClick={() => setCreating(true)} type="button">
            <Plus size={14} /> Lập kế hoạch mới
          </button>
        </div>
      }
    >
      {/* 1. KPI Cards Row */}
      <section className="grid gap-1 md:grid-cols-2 xl:grid-cols-4">
        <CockpitKpiCard
          title="Kế hoạch chờ chạy"
          value={fmt(totalPlanned)}
          note="Đã lập lịch / chưa phát lệnh"
          icon={<CalendarClock size={18} />}
          tone="cyan"
          state={isLoading ? 'loading' : 'normal'}
        />
        <CockpitKpiCard
          title="Đang thực hiện"
          value={fmt(totalInProgress)}
          note="Đang chạy xưởng & giao vận"
          icon={<Factory size={18} />}
          tone="blue"
          state={isLoading ? 'loading' : 'normal'}
        />
        <CockpitKpiCard
          title="Điểm nghẽn / Nghẽn MRP"
          value={fmt(totalBlocked)}
          note="Vượt định mức / thiếu vật tư"
          icon={<AlertTriangle size={18} />}
          tone="amber"
          state={isLoading ? 'loading' : 'normal'}
        />
        <CockpitKpiCard
          title="Hoàn thành mục tiêu"
          value={fmt(totalCompleted)}
          note="Đã đóng chu kỳ kế hoạch"
          icon={<CheckCircle2 size={18} />}
          tone="emerald"
          state={isLoading ? 'loading' : 'normal'}
        />
      </section>

      {/* 2. Search & Filter Toolbar */}
      <section className="my-1 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-2">
        <div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/45 px-2">
          <Search size={14} className="text-cyan-300 shrink-0" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm mã kế hoạch, hạng mục, công trình..."
            className="h-8 w-full bg-transparent text-xs text-slate-100 outline-none placeholder:text-slate-500"
          />
        </div>

        {/* Quick Status Chips */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'PLANNED', label: 'Chờ thực hiện' },
            { id: 'IN_PROGRESS', label: 'Đang chạy' },
            { id: 'BLOCKED', label: 'Điểm nghẽn' },
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
            <option value="PLANNED">Chờ thực hiện</option>
            <option value="IN_PROGRESS">Đang chạy</option>
            <option value="BLOCKED">Điểm nghẽn</option>
            <option value="COMPLETED">Hoàn thành</option>
          </select>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="h-8 max-w-[180px] truncate rounded-lg border border-white/10 bg-slate-950/45 px-2 text-xs text-slate-200 outline-none focus:border-cyan-400"
          >
            <option value="ALL">Tất cả dự án</option>
            {projects.map((p) => (
              <option key={p.id} value={p.code}>
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

      {/* 3. Hero Workspace & Supporting Analytics */}
      <MainPlanningWorkspace
        tab={tab}
        plans={filteredPlans}
        allPlans={planRows}
        onSelect={setSelectedPlan}
        loading={isLoading}
      />

      {/* Drawers */}
      <PlanningDetailDrawer plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
      {creating ? <CreatePlanDrawer onClose={() => setCreating(false)} /> : null}
    </EnterpriseWorkspace>
  )
}

function MainPlanningWorkspace({
  tab,
  plans,
  allPlans,
  onSelect,
  loading,
}: {
  tab: PlanningTab
  plans: PlanRow[]
  allPlans: PlanRow[]
  onSelect: (plan: PlanRow) => void
  loading: boolean
}) {
  const getQuestionTitle = (currentTab: PlanningTab) => {
    switch (currentTab) {
      case 'master':
        return 'Bảng kế hoạch điều phối tổng thể dự án'
      case 'production':
        return 'Lịch lập kế hoạch sản xuất cấu kiện'
      case 'capacity':
        return 'Cân đối năng lực dây chuyền & xưởng'
      case 'material':
        return 'Nhu cầu vật tư MRP & Cân đối kho tồn'
      case 'procurement':
        return 'Lịch mua hàng & Cung ứng vật tư thiếu'
      case 'schedule':
        return 'Lịch thực hiện công việc trong ngày'
      case 'calendar':
        return 'Lịch kế hoạch giao nhận & sản xuất tuần'
      case 'constraints':
        return 'Danh sách các điểm nghẽn & rào cản thực hiện'
      case 'reports':
        return 'Báo cáo tổng kết hoàn thành kế hoạch'
      default:
        return 'Hạng mục kế hoạch cần điều phối hôm nay'
    }
  }

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {}
    allPlans.forEach((p) => {
      map[p.category] = (map[p.category] || 0) + 1
    })
    return map
  }, [allPlans])

  const blockers = useMemo(() => {
    return allPlans.filter((p) => p.status === 'BLOCKED' || Boolean(p.blockerReason))
  }, [allPlans])

  return (
    <div className="grid gap-1 xl:grid-cols-[minmax(0,1fr)_360px]">
      <PlanningTable plans={plans} onSelect={onSelect} loading={loading} title={getQuestionTitle(tab)} />

      <aside className="space-y-1">
        <CockpitChartCard title="Phân loại Hạng mục Kế hoạch" className="h-[170px]">
          <PlanningCategoryBars counts={categoryCounts} />
        </CockpitChartCard>

        <CockpitChartCard title="Cảnh báo Điểm nghẽn / Khóa" className="h-[260px]">
          {blockers.length > 0 ? (
            <div className="space-y-2 overflow-y-auto max-h-[200px]">
              {blockers.slice(0, 5).map((p) => (
                <div key={p.id} className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-xs">
                  <div className="flex items-center justify-between font-semibold text-red-200">
                    <span>{p.code}</span>
                    <span className="text-[10px] text-red-300">BLOCKED</span>
                  </div>
                  <p className="mt-1 text-slate-300 truncate">{p.title}</p>
                  <p className="mt-1 text-[11px] text-red-300 font-mono">{p.blockerReason || 'Rào cản tiến độ'}</p>
                </div>
              ))}
            </div>
          ) : (
            <CockpitEmptyState title="Không có điểm nghẽn" description="Mọi hạng mục kế hoạch đang vận hành đúng tiến độ." />
          )}
        </CockpitChartCard>

        <CockpitStatusList
          items={allPlans.slice(0, 5).map((p) => ({
            id: p.id,
            label: `${p.code} · ${p.title}`,
            value: p.progress ? `${p.progress}%` : p.status,
            statusTone: p.status === 'COMPLETED' ? 'emerald' : p.status === 'BLOCKED' ? 'red' : 'cyan',
          }))}
          emptyMessage="Chưa có dữ liệu kế hoạch."
        />
      </aside>
    </div>
  )
}

function PlanningTable({
  plans,
  onSelect,
  loading,
  title = 'Danh sách kế hoạch',
}: {
  plans: PlanRow[]
  onSelect: (plan: PlanRow) => void
  loading: boolean
  title?: string
}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const paginatedPlans = useMemo(() => {
    const start = (page - 1) * pageSize
    return plans.slice(start, start + pageSize)
  }, [plans, page, pageSize])

  if (loading) {
    return <ModuleLoadingState label="Đang đọc dữ liệu kế hoạch..." />
  }

  return (
    <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3 flex flex-col justify-between">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <span className="text-xs text-slate-500">{fmt(plans.length)} hạng mục</span>
        </div>
        <CockpitTableShell className="min-h-[480px]">
          {plans.length > 0 ? (
            <table className="w-full min-w-[1100px] table-fixed text-[13px]">
              <thead className="border-b border-cyan-400/10 bg-transparent text-slate-300">
                <tr>
                  {['Mã kế hoạch', 'Hạng mục nội dung', 'Dự án', 'Phân loại', 'Số lượng / Tiến độ', 'Thời gian', 'Trạng thái', 'Thao tác'].map(
                    (header, idx) => (
                      <th
                        key={header}
                        className={`px-2 py-2 font-medium ${idx === 7 ? 'text-right' : 'text-left'}`}
                      >
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedPlans.map((plan) => (
                  <tr
                    key={plan.id}
                    onClick={() => onSelect(plan)}
                    className="cursor-pointer border-b border-cyan-300/10 text-slate-300 hover:bg-cyan-300/[0.055] transition"
                  >
                    <td className="px-2 py-2 font-mono font-semibold text-cyan-300">{plan.code}</td>
                    <td className="px-2 py-2 text-white truncate font-medium">{plan.title}</td>
                    <td className="px-2 py-2 truncate text-slate-300">{plan.projectName || plan.projectCode || '—'}</td>
                    <td className="px-2 py-2 text-xs font-mono">{plan.category}</td>
                    <td className="px-2 py-2 font-mono">
                      {plan.progress != null
                        ? `${plan.progress}%`
                        : plan.quantity
                          ? `${fmt(plan.quantity)} ${plan.unit || ''}`
                          : '—'}
                    </td>
                    <td className="px-2 py-2 font-mono text-slate-400 text-xs">{formatDate(plan.plannedStartDate)}</td>
                    <td className="px-2 py-2">
                      <PlanStatusBadge status={plan.status} />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelect(plan)
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
              title="Chưa có dữ liệu kế hoạch"
              description="Không tìm thấy mục kế hoạch nào thỏa mãn điều kiện lọc hiện tại."
            />
          )}
        </CockpitTableShell>
      </div>

      {plans.length > 0 && (
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          total={plans.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 20, 50]}
        />
      )}
    </section>
  )
}

function PlanningDetailDrawer({ plan, onClose }: { plan: PlanRow | null; onClose: () => void }) {
  if (!plan) return null

  return (
    <ModuleDetailDrawer
      open={Boolean(plan)}
      onClose={onClose}
      title={`Kế hoạch ${plan.code}`}
      subtitle={plan.title}
      size="md"
    >
      <div className="space-y-3 text-sm text-slate-300">
        <section className="grid gap-2 md:grid-cols-2">
          <Info label="Mã kế hoạch" value={plan.code} />
          <Info label="Phân loại" value={plan.category} />
          <Info label="Dự án" value={plan.projectName || plan.projectCode} />
          <Info label="Trạng thái" value={plan.status} />
          <Info label="Thời gian kế hoạch" value={formatDate(plan.plannedStartDate)} />
          <Info label="Khối lượng / Tiến độ" value={plan.progress ? `${plan.progress}%` : plan.quantity ? `${fmt(plan.quantity)} ${plan.unit || ''}` : '—'} />
        </section>

        {plan.blockerReason && (
          <section className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
            <h4 className="font-bold uppercase tracking-wider text-red-300 mb-1">Cảnh báo rào cản tiến độ (Constraint)</h4>
            <p>{plan.blockerReason}</p>
          </section>
        )}

        <section className="rounded-2xl border border-cyan-300/10 bg-slate-950/25 p-3">
          <h3 className="mb-2 text-sm font-semibold text-white">Lưu vết & Tiến độ thực thi</h3>
          <p className="text-xs text-slate-400">
            Chi tiết kế hoạch được liên kết tự động từ lệnh sản xuất, đơn điều xe và yêu cầu vật tư tương ứng trong hệ thống.
          </p>
        </section>

        <footer className="sticky bottom-0 -mx-1 flex justify-end gap-2 border-t border-cyan-300/10 bg-[#07111f]/95 px-1 py-3 backdrop-blur">
          <button className={moduleMutedButton} onClick={onClose} type="button">
            Đóng
          </button>
        </footer>
      </div>
    </ModuleDetailDrawer>
  )
}

function CreatePlanDrawer({ onClose }: { onClose: () => void }) {
  return (
    <ModuleDetailDrawer
      open
      onClose={onClose}
      title="Lập kế hoạch mới"
      subtitle="Tạo kế hoạch điều phối sản xuất, vật tư hoặc giao vận"
      size="md"
    >
      <div className="space-y-3 text-sm text-slate-300">
        <label className="space-y-1 text-xs text-slate-400">
          Mã kế hoạch
          <input className={`${moduleInput} w-full`} placeholder="VD: PLN-2026-001" />
        </label>
        <label className="space-y-1 text-xs text-slate-400">
          Tên kế hoạch
          <input className={`${moduleInput} w-full`} placeholder="Tên kế hoạch điều phối" />
        </label>

        <CockpitEmptyState
          title="Form tạo kế hoạch mới"
          description="Nghiệp vụ lập kế hoạch mới sẽ đồng bộ tự động với lệnh sản xuất và lịch giao nhận."
        />

        <footer className="sticky bottom-0 -mx-1 flex justify-end gap-2 border-t border-cyan-300/10 bg-[#07111f]/95 px-1 py-3 backdrop-blur">
          <button className={moduleMutedButton} onClick={onClose} type="button">
            Hủy
          </button>
          <button className={modulePrimaryButton} onClick={onClose} type="button">
            Xác nhận tạo kế hoạch
          </button>
        </footer>
      </div>
    </ModuleDetailDrawer>
  )
}

function PlanningCategoryBars({ counts }: { counts: Record<string, number> }) {
  const rows = Object.entries(counts)
  if (!rows.length)
    return <CockpitEmptyState title="Chưa có dữ liệu" description="Dữ liệu phân loại kế hoạch sẽ xuất hiện tại đây." />
  const max = Math.max(1, ...rows.map(([, value]) => value))
  return (
    <div className="space-y-2 text-xs">
      {rows.map(([category, value]) => (
        <div key={category}>
          <div className="mb-1 flex justify-between">
            <span className="text-slate-300">{category}</span>
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

function PlanStatusBadge({ status }: { status: PlanRow['status'] }) {
  const tones: Record<PlanRow['status'], string> = {
    DRAFT: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
    PLANNED: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
    SCHEDULED: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    IN_PROGRESS: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    COMPLETED: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    BLOCKED: 'border-red-500/30 bg-red-500/10 text-red-300',
  }
  const labels: Record<PlanRow['status'], string> = {
    DRAFT: 'Nháp',
    PLANNED: 'Chờ chạy',
    SCHEDULED: 'Đã lên lịch',
    IN_PROGRESS: 'Đang chạy',
    COMPLETED: 'Hoàn thành',
    BLOCKED: 'Điểm nghẽn',
  }
  return <span className={`rounded-lg border px-2 py-0.5 text-[11px] ${tones[status]}`}>{labels[status]}</span>
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg border border-cyan-300/10 bg-slate-950/35 px-3 py-2">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-white font-medium">{value || '—'}</p>
    </div>
  )
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN').format(d)
}
