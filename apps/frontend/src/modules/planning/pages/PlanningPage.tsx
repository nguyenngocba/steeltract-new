import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  Boxes,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Factory,
} from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { getDispatchOrders } from '@/modules/logistics/api/logistics.api'
import { getProjectsRuntime, type ProjectsRuntime } from '@/modules/projects/api/projects.api'
import { productionApi, type ProductionOrder } from '@/modules/production/api/production.api'
import { getInventoryItems } from '@/modules/inventory/api/inventory.api'
import { EnterpriseWorkspace } from '@/shared/ui/enterprise'
import { EnterprisePanel } from '@/shared/ui/enterprise-components'
import {
  inventoryGridGap,
  inventoryTableHead,
  inventoryTableRow,
} from '@/modules/inventory/components/InventoryVisuals'
import {
  CockpitChartCard,
  CockpitEmptyState,
  DataTablePagination,
  EnterpriseKpiCard,
} from '@/shared/ui/cockpit'
import {
  ModuleDetailDrawer,
  ModuleEmptyState,
  ModuleLoadingState,
  moduleMutedButton,
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
  customerName?: string
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
  return <PlanningPageContent />
}

function PlanningPageContent() {
  const location = useLocation()
  const queryClient = useQueryClient()

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [projectFilter, setProjectFilter] = useState<string>('ALL')
  const [customerFilter, setCustomerFilter] = useState<string>('ALL')
  const [monthFilter, setMonthFilter] = useState<string>('ALL')
  const [selectedPlan, setSelectedPlan] = useState<PlanRow | null>(null)
  const [page, setPage] = useState(1)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)

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

  // Dynamic dropdown option lists derived from authoritative data
  const projects = projectsRuntime?.projects ?? []

  const customers = useMemo(() => {
    const set = new Set<string>()
    projects.forEach((p: any) => {
      if (p.customerName) set.add(p.customerName)
      if (p.customer?.name) set.add(p.customer.name)
    })
    productionOrders.forEach((mo: any) => {
      if (mo.customerName) set.add(mo.customerName)
      if (mo.project?.customerName) set.add(mo.project.customerName)
      if (mo.project?.customer?.name) set.add(mo.project.customer.name)
    })
    return Array.from(set)
  }, [projects, productionOrders])

  // Aggregated Plan Rows
  const planRows = useMemo<PlanRow[]>(() => {
    const rows: PlanRow[] = []

    // 1. Production Orders -> Production Plans
    productionOrders.forEach((mo: any) => {
      const isBlocked = Number(mo.scrapCount) > 0 || String(mo.notes || '').toLowerCase().includes('lỗi')
      const custName = mo.customerName || mo.project?.customerName || mo.project?.customer?.name || 'Khách hàng SteelTrack'
      rows.push({
        id: `mo-${mo.id}`,
        code: mo.code || `MO-${mo.id.slice(0, 6)}`,
        title: `Lệnh sản xuất cấu kiện: ${mo.component?.name || mo.code}`,
        projectCode: mo.project?.code,
        projectName: mo.project?.name,
        customerName: custName,
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

    // 2. Projects -> Master Plans
    projects.forEach((proj: any) => {
      const custName = proj.customerName || proj.customer?.name || 'Khách hàng SteelTrack'
      rows.push({
        id: `proj-${proj.id}`,
        code: proj.code,
        title: `Tiến độ công trình: ${proj.name}`,
        projectCode: proj.code,
        projectName: proj.name,
        customerName: custName,
        category: 'PRODUCTION',
        status: proj.status === 'COMPLETED' ? 'COMPLETED' : proj.status === 'ACTIVE' ? 'IN_PROGRESS' : 'PLANNED',
        plannedStartDate: proj.startedAt || proj.createdAt,
        plannedEndDate: proj.plannedEndAt,
        progress: Number(proj.progress || 0),
      })
    })

    // 3. Logistics Dispatch Schedule -> Logistics Plans
    dispatchOrders.forEach((d: any) => {
      const custName = d.project?.customerName || d.project?.customer?.name || d.customerName || 'Khách hàng SteelTrack'
      rows.push({
        id: `dispatch-${d.id}`,
        code: d.code,
        title: `Kế hoạch vận chuyển đến ${d.project?.name || 'Công trình'}`,
        projectCode: d.project?.code,
        projectName: d.project?.name,
        customerName: custName,
        category: 'LOGISTICS',
        status: d.status === 'COMPLETED' ? 'COMPLETED' : ['LOADING', 'IN_TRANSIT'].includes(d.status) ? 'IN_PROGRESS' : 'PLANNED',
        plannedStartDate: d.plannedAt || d.createdAt,
        quantity: d.items?.length || 0,
        unit: 'dòng hàng',
      })
    })

    // 4. Material Shortages -> Material Plans (MRP)
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
  }, [productionOrders, projects, dispatchOrders, inventoryItems])

  // Contextual filtering based on Tab, Status, Project, Customer, Month, and Search
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

    if (customerFilter !== 'ALL') {
      source = source.filter((p) => p.customerName === customerFilter)
    }

    if (monthFilter !== 'ALL') {
      const monthNum = Number(monthFilter)
      source = source.filter((p) => {
        if (!p.plannedStartDate) return false
        const d = new Date(p.plannedStartDate)
        return !Number.isNaN(d.getTime()) && d.getMonth() + 1 === monthNum
      })
    }

    const keyword = query.trim().toLowerCase()
    if (!keyword) return source

    return source.filter((p) =>
      [p.code, p.title, p.projectCode, p.projectName, p.customerName, p.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(keyword),
    )
  }, [planRows, tab, statusFilter, projectFilter, customerFilter, monthFilter, query])

  const pageSize = 14
  const pagedPlans = filteredPlans.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    setPage(1)
  }, [filteredPlans.length, query, statusFilter, projectFilter, customerFilter, monthFilter])

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['production-cockpit'] })
    queryClient.invalidateQueries({ queryKey: ['project-runtime'] })
    queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
    queryClient.invalidateQueries({ queryKey: ['logistics-dispatch-orders'] })
  }

  // Operational KPIs
  const totalPlanned = planRows.filter((p) => p.status === 'PLANNED' || p.status === 'SCHEDULED').length
  const totalInProgress = planRows.filter((p) => p.status === 'IN_PROGRESS').length
  const totalBlocked = planRows.filter((p) => p.status === 'BLOCKED' || Boolean(p.blockerReason)).length
  const totalCompleted = planRows.filter((p) => p.status === 'COMPLETED').length

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
        return 'Hạng mục kế hoạch cần điều phối (Planning Overview)'
    }
  }

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {}
    planRows.forEach((p) => {
      map[p.category] = (map[p.category] || 0) + 1
    })
    return map
  }, [planRows])

  const blockers = useMemo(() => {
    return planRows.filter((p) => p.status === 'BLOCKED' || Boolean(p.blockerReason))
  }, [planRows])

  return (
    <EnterpriseWorkspace
      eyebrow="Planning"
      title="Kế hoạch tổng thể"
      description="Lập lịch sản xuất, cân đối nguồn lực, vật tư MRP và tiến độ giao vận."
      breadcrumbs={['Vận hành', 'Kế hoạch']}
      tabs={tabs}
      activeTab={tab}
    >
      <div className="space-y-2 text-xs -mt-2">
        {/* Phase 1: ENTERPRISE KPI CARDS */}
        <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
          <EnterpriseKpiCard
            title="Chờ thực hiện (Planned)"
            value={fmt(totalPlanned)}
            tone="cyan"
            icon={<CalendarClock size={15} />}
          />
          <EnterpriseKpiCard
            title="Đang thực hiện (In Progress)"
            value={fmt(totalInProgress)}
            tone="blue"
            icon={<Factory size={15} />}
          />
          <EnterpriseKpiCard
            title="Điểm nghẽn / Cảnh báo"
            value={fmt(totalBlocked)}
            tone="amber"
            icon={<AlertTriangle size={15} />}
          />
          <EnterpriseKpiCard
            title="Hoàn thành mục tiêu"
            value={fmt(totalCompleted)}
            tone="emerald"
            icon={<CheckCircle2 size={15} />}
          />
          <EnterpriseKpiCard
            title="Tổng số kế hoạch"
            value={fmt(planRows.length)}
            tone="purple"
            icon={<ClipboardList size={15} />}
          />
          <EnterpriseKpiCard
            title="Dự án đang theo dõi"
            value={fmt(projects.length)}
            tone="cyan"
            icon={<Boxes size={15} />}
          />
        </div>

        {/* Phase 3: COMPACT TOOLBAR */}
        <EnterprisePanel className="rounded-xl -mt-1">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_150px_160px_160px_130px_110px_110px]">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setPage(1)
              }}
              placeholder="Tìm mã kế hoạch, hạng mục nội dung, dự án, khách hàng..."
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PLANNED">Chờ thực hiện</option>
              <option value="SCHEDULED">Đã lên lịch</option>
              <option value="IN_PROGRESS">Đang chạy</option>
              <option value="BLOCKED">Điểm nghẽn</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="DRAFT">Nháp</option>
            </select>

            <select
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value)
                setPage(1)
              }}
              className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
            >
              <option value="ALL">Tất cả dự án</option>
              {projects.map((p) => (
                <option key={p.id} value={p.code}>
                  {p.code} · {p.name}
                </option>
              ))}
            </select>

            <select
              value={customerFilter}
              onChange={(e) => {
                setCustomerFilter(e.target.value)
                setPage(1)
              }}
              className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
            >
              <option value="ALL">Tất cả khách hàng</option>
              {customers.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={monthFilter}
              onChange={(e) => {
                setMonthFilter(e.target.value)
                setPage(1)
              }}
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
            >
              <option value="ALL">Tất cả tháng</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={String(m)}>Tháng {m}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setPage(1)}
              className="h-9 self-end rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
            >
              Tìm kiếm
            </button>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setStatusFilter('ALL')
                setProjectFilter('ALL')
                setCustomerFilter('ALL')
                setMonthFilter('ALL')
                setPage(1)
                refresh()
              }}
              className="h-9 self-end rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Làm mới
            </button>
          </div>
        </EnterprisePanel>

        {/* Phase 4: HERO TABLE & ANALYTICS DASHBOARD */}
        <div className={`grid ${inventoryGridGap} xl:grid-cols-12`}>
          <div className="xl:col-span-8">
            <EnterprisePanel className="rounded-xl">
              <div className="mb-1 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">{getQuestionTitle(tab)}</h3>
                  <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-400/20">
                    {filteredPlans.length} hạng mục
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

              <div className="h-[430px] overflow-auto scrollbar-none rounded-lg border border-white/10">
                {isLoading ? (
                  <ModuleLoadingState label="Đang nạp dữ liệu kế hoạch..." />
                ) : (
                  <table className="w-full min-w-[1100px] table-fixed text-sm border-collapse">
                    <thead
                      className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                      style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                    >
                      <tr>
                        {['Mã kế hoạch', 'Hạng mục nội dung', 'Dự án', 'Khách hàng', 'Phân loại', 'Số lượng / Tiến độ', 'Thời gian', 'Trạng thái', 'Thao tác'].map(
                          (header, idx) => (
                            <th
                              key={header}
                              className={`px-2 py-2 text-xs font-semibold text-slate-300 ${idx === 8 ? 'text-right' : 'text-left'}`}
                            >
                              {header}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {pagedPlans.map((plan) => (
                        <tr
                          key={plan.id}
                          onClick={() => setSelectedPlan(plan)}
                          className={`${inventoryTableRow} cursor-pointer`}
                        >
                          <td className="px-2 py-1.5 font-mono font-semibold text-cyan-300 text-xs">{plan.code}</td>
                          <td className="px-2 py-1.5 text-white truncate font-medium">{plan.title}</td>
                          <td className="px-2 py-1.5 truncate text-slate-300 text-xs">{plan.projectName || plan.projectCode || '—'}</td>
                          <td className="px-2 py-1.5 truncate text-slate-400 text-xs">{plan.customerName || '—'}</td>
                          <td className="px-2 py-1.5 text-xs font-mono text-cyan-200">{plan.category}</td>
                          <td className="px-2 py-1.5 font-mono text-slate-200 text-xs">
                            {plan.progress != null
                              ? `${plan.progress}%`
                              : plan.quantity
                                ? `${fmt(plan.quantity)} ${plan.unit || ''}`
                                : '—'}
                          </td>
                          <td className="px-2 py-1.5 font-mono text-slate-300 text-xs">{formatDate(plan.plannedStartDate)}</td>
                          <td className="px-2 py-1.5">
                            <PlanStatusBadge status={plan.status} />
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedPlan(plan)
                              }}
                              className="inline-flex items-center gap-0.5 rounded bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
                            >
                              Chi tiết <ChevronRight size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!pagedPlans.length ? (
                        <tr>
                          <td colSpan={9} className="px-2 py-10">
                            <ModuleEmptyState
                              icon={<ClipboardList size={18} />}
                              title="Chưa có dữ liệu kế hoạch"
                              description="Không tìm thấy mục kế hoạch nào thỏa mãn điều kiện lọc hiện tại."
                            />
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                )}
              </div>
              <DataTablePagination page={page} pageSize={pageSize} total={filteredPlans.length} onPageChange={setPage} />
            </EnterprisePanel>
          </div>

          <aside className="space-y-1 xl:col-span-4">
            <CockpitChartCard title="Phân loại Hạng mục Kế hoạch" className="h-[210px]">
              <PlanningCategoryBars counts={categoryCounts} />
            </CockpitChartCard>

            <CockpitChartCard title="Cảnh báo Điểm nghẽn / Rào cản" className="h-[260px]">
              {blockers.length > 0 ? (
                <div className="space-y-2 overflow-y-auto max-h-[200px]">
                  {blockers.slice(0, 5).map((p) => (
                    <div key={p.id} className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-xs">
                      <div className="flex items-center justify-between font-semibold text-red-200">
                        <span>{p.code}</span>
                        <span className="text-[10px] text-red-300 font-mono">BLOCKED</span>
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
          </aside>
        </div>

        {/* Phase 5: EXPANDED TABLE MODAL */}
        {expandedModalOpen
          ? createPortal(
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <h2 className="text-base font-bold text-white">Toàn bộ danh sách kế hoạch (Planning Overview)</h2>
                      <p className="text-xs text-slate-400">Tổng cộng {filteredPlans.length} hạng mục kế hoạch trong hệ thống</p>
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
                    <table className="w-full min-w-[1100px] text-xs table-fixed border-collapse">
                      <thead
                        className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                        style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                      >
                        <tr>
                          {['Mã kế hoạch', 'Hạng mục nội dung', 'Dự án', 'Khách hàng', 'Phân loại', 'Số lượng / Tiến độ', 'Thời gian', 'Trạng thái', 'Thao tác'].map(
                            (header, idx) => (
                              <th
                                key={header}
                                className={`px-2 py-2 text-left font-semibold text-slate-300 ${idx === 8 ? 'text-right' : ''}`}
                              >
                                {header}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPlans.map((plan) => (
                          <tr
                            key={plan.id}
                            onClick={() => {
                              setSelectedPlan(plan)
                              setExpandedModalOpen(false)
                            }}
                            className={`${inventoryTableRow} cursor-pointer`}
                          >
                            <td className="px-2 py-2 font-mono font-semibold text-cyan-300">{plan.code}</td>
                            <td className="px-2 py-2 text-white font-medium truncate">{plan.title}</td>
                            <td className="px-2 py-2 truncate text-slate-300">{plan.projectName || plan.projectCode || '—'}</td>
                            <td className="px-2 py-2 truncate text-slate-400">{plan.customerName || '—'}</td>
                            <td className="px-2 py-2 text-xs font-mono text-cyan-200">{plan.category}</td>
                            <td className="px-2 py-2 font-mono text-slate-200">
                              {plan.progress != null
                                ? `${plan.progress}%`
                                : plan.quantity
                                  ? `${fmt(plan.quantity)} ${plan.unit || ''}`
                                  : '—'}
                            </td>
                            <td className="px-2 py-2 font-mono text-slate-300">{formatDate(plan.plannedStartDate)}</td>
                            <td className="px-2 py-2">
                              <PlanStatusBadge status={plan.status} />
                            </td>
                            <td className="px-2 py-2 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedPlan(plan)
                                  setExpandedModalOpen(false)
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
                  </div>

                  <DataTablePagination page={page} pageSize={pageSize} total={filteredPlans.length} onPageChange={setPage} />
                </div>
              </div>,
              document.body,
            )
          : null}

        {/* Phase 6: DETAIL DRAWER */}
        <PlanningDetailDrawer plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
      </div>
    </EnterpriseWorkspace>
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
          <Info label="Khách hàng" value={plan.customerName} />
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
            <span className="text-slate-300 font-medium">{category}</span>
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
    PLANNED: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-semibold',
    SCHEDULED: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    IN_PROGRESS: 'border-amber-500/30 bg-amber-500/10 text-amber-300 font-semibold',
    COMPLETED: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-semibold',
    BLOCKED: 'border-red-500/30 bg-red-500/10 text-red-300 font-semibold',
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
