import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  Bell,
  Boxes,
  Building2,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  Factory,
  FileClock,
  Filter,
  Layers,
  PackageCheck,
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  UserCheck,
  Warehouse,
  X,
} from 'lucide-react'

import { getDispatchDashboard, getDispatchOrders } from '@/modules/logistics/api/logistics.api'
import { getProjectsRuntime, type ProjectsRuntime } from '@/modules/projects/api/projects.api'
import { productionApi, type ProductionOrder } from '@/modules/production/api/production.api'
import { getInventoryItems } from '@/modules/inventory/api/inventory.api'
import { useWarehouses } from '@/modules/inventory/hooks/useWarehouses'
import { useInventoryAudit } from '@/modules/inventory/hooks/useInventoryAudit'
import { useInventoryTransactions } from '@/modules/inventory/hooks/useInventoryTransactions'
import { getQcCockpit } from '@/modules/qc/api/qc.api'
import { systemApi } from '@/modules/system/api/system.api'
import { EnterpriseWorkspace } from '@/shared/ui/enterprise'
import {
  CockpitChartCard,
  CockpitEmptyState,
  CockpitKpiCard,
  CockpitRecentList,
  CockpitStatusList,
  CockpitTableShell,
} from '@/shared/ui/cockpit'
import {
  ModuleLoadingState,
  moduleInput,
  moduleMutedButton,
  modulePrimaryButton,
} from '@/shared/ui/modules'
import { formatCurrencyVnd, formatQuantity } from '@/shared/utils/number-format'

const fmt = (value = 0, digits = 0) => formatQuantity(value, digits)
const date = (value?: string | null) => (value ? new Intl.DateTimeFormat('vi-VN').format(new Date(value)) : '—')

type TimeRange = 'TODAY' | '7D' | '30D'

export function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Global Filters
  const [timeRange, setTimeRange] = useState<TimeRange>('30D')
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all')

  // Real Queries Across All 8 Modules
  const { data: inventoryRows = [], isLoading: inventoryLoading } = useInventoryAudit()
  const { data: inventoryItems = [] } = useQuery({ queryKey: ['inventory-items'], queryFn: getInventoryItems })
  const { data: warehouses = [] } = useWarehouses()
  const { data: transactionsRaw = [] } = useInventoryTransactions({})
  const { data: productionOrders = [], isLoading: productionLoading } = useQuery<ProductionOrder[]>({
    queryKey: ['production-orders'],
    queryFn: () => productionApi.orders(),
  })
  const { data: projectsRuntime, isLoading: projectsLoading } = useQuery<ProjectsRuntime>({
    queryKey: ['project-runtime'],
    queryFn: getProjectsRuntime,
  })
  const { data: dispatchDashboard, isLoading: logisticsLoading } = useQuery({
    queryKey: ['logistics-dispatch-dashboard'],
    queryFn: getDispatchDashboard,
  })
  const { data: dispatchOrders = [], isLoading: dispatchLoading } = useQuery({
    queryKey: ['logistics-dispatch-orders'],
    queryFn: getDispatchOrders,
  })
  const { data: qcCockpit, isLoading: qcLoading } = useQuery({
    queryKey: ['qc-cockpit'],
    queryFn: getQcCockpit,
  })
  const { data: systemOverview, isLoading: systemLoading } = useQuery({
    queryKey: ['system-overview'],
    queryFn: systemApi.overview,
  })
  const { data: workflow } = useQuery({
    queryKey: ['operational-workflow'],
    queryFn: systemApi.workflow,
  })
  const { data: activityLogs = [] } = useQuery({
    queryKey: ['system-activity-logs'],
    queryFn: systemApi.activityLogs,
  })

  const isLoading =
    inventoryLoading || productionLoading || projectsLoading || logisticsLoading || qcLoading || systemLoading

  const refresh = () => {
    queryClient.invalidateQueries()
  }

  // Filtered Datasets Based on Global Filters
  const projectsList = projectsRuntime?.projects ?? []

  const filteredInventoryRows = useMemo(() => {
    return inventoryRows.filter((row) => {
      if (selectedWarehouse !== 'all' && row.warehouseId !== selectedWarehouse) return false
      return true
    })
  }, [inventoryRows, selectedWarehouse])

  const filteredProductionOrders = useMemo(() => {
    return productionOrders.filter((mo: any) => {
      if (selectedProject !== 'all' && mo.projectId !== selectedProject) return false
      return true
    })
  }, [productionOrders, selectedProject])

  const filteredDispatchOrders = useMemo(() => {
    return dispatchOrders.filter((d: any) => {
      if (selectedProject !== 'all' && d.projectId !== selectedProject) return false
      return true
    })
  }, [dispatchOrders, selectedProject])

  // Executive KPI Computations
  const inventoryValue = useMemo(() => {
    return filteredInventoryRows.reduce((sum, row) => sum + Number(row.stockValue || 0), 0)
  }, [filteredInventoryRows])

  const lowStockItems = useMemo(() => {
    return inventoryItems.filter((item: any) => {
      const qty = Number(item.quantity || 0)
      const minQty = Number(item.minQuantity || item.reorderPoint || 0)
      return minQty > 0 && qty <= minQty
    }).length
  }, [inventoryItems])

  const runningMOs = useMemo(() => {
    return filteredProductionOrders.filter((mo: any) => mo.status === 'RUNNING' || mo.status === 'IN_PROGRESS').length
  }, [filteredProductionOrders])

  const activeProjectsCount = useMemo(() => {
    return projectsList.filter((p) => p.status === 'ACTIVE' || p.progress < 100).length
  }, [projectsList])

  const deliveriesTodayCount = useMemo(() => {
    return filteredDispatchOrders.filter(
      (d) => ['LOADING', 'IN_TRANSIT', 'ARRIVED'].includes(d.status) || d.status === 'PLANNED',
    ).length
  }, [filteredDispatchOrders])

  const openQcIssuesCount = useMemo(() => {
    return Number(qcCockpit?.metrics?.openNcrs ?? 0)
  }, [qcCockpit])

  const pendingApprovalsCount = useMemo(() => {
    const waitingDispatch = dispatchDashboard?.kpis?.waiting ?? 0
    const blockedMOs = filteredProductionOrders.filter((mo: any) => Number(mo.scrapCount) > 0).length
    return waitingDispatch + blockedMOs
  }, [dispatchDashboard, filteredProductionOrders])

  const okWorkflowSteps = workflow?.steps.filter((s) => s.status === 'OK').length ?? 0
  const totalWorkflowSteps = workflow?.steps.length ?? 1
  const systemHealthPercent = Math.round((okWorkflowSteps / totalWorkflowSteps) * 100)

  // Section 2: Unified Recent Activities Timeline (Grouped by Today, Yesterday, Earlier)
  const groupedActivities = useMemo(() => {
    const rawEvents: Array<{
      id: string
      module: string
      title: string
      description: string
      createdAt: string
      severity: 'Info' | 'Warning' | 'Critical'
      targetPath?: string
    }> = []

    // 1. System Audit Logs
    activityLogs.forEach((log) => {
      rawEvents.push({
        id: `sys-${log.id}`,
        module: log.module || 'System',
        title: `${log.user?.fullName || log.user?.username || 'System'}: ${log.action}`,
        description: `${log.entity} ${log.entityId ? `#${log.entityId}` : ''}`,
        createdAt: log.createdAt,
        severity: log.action.toLowerCase().includes('delete') ? 'Critical' : 'Info',
        targetPath: '/system-logs',
      })
    })

    // 2. Dispatch Orders
    filteredDispatchOrders.forEach((d) => {
      rawEvents.push({
        id: `disp-${d.id}`,
        module: 'Logistics',
        title: `Lệnh xe ${d.code}: ${d.project?.name || 'Giao vận'}`,
        description: `Trạng thái: ${d.status} · Xe: ${d.vehicle || 'Chưa gán'}`,
        createdAt: d.plannedAt || d.createdAt,
        severity: d.status === 'CANCELLED' ? 'Warning' : 'Info',
        targetPath: '/logistics/dispatch',
      })
    })

    // 3. QC Inspections
    if (qcCockpit?.inspections) {
      qcCockpit.inspections.forEach((insp) => {
        rawEvents.push({
          id: `qc-${insp.id}`,
          module: 'QC',
          title: `Kiểm định ${insp.inspectionNo}: ${insp.componentName || insp.checklistName}`,
          description: `Kết quả: ${insp.result} (${insp.status})`,
          createdAt: insp.date,
          severity: insp.result === 'FAIL' ? 'Critical' : 'Info',
          targetPath: '/qc',
        })
      })
    }

    // Sort newest first
    rawEvents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Group into Today, Yesterday, Earlier
    const now = new Date()
    const todayStr = now.toDateString()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toDateString()

    const groups: { today: typeof rawEvents; yesterday: typeof rawEvents; earlier: typeof rawEvents } = {
      today: [],
      yesterday: [],
      earlier: [],
    }

    rawEvents.slice(0, 15).forEach((event) => {
      const eventDate = new Date(event.createdAt).toDateString()
      if (eventDate === todayStr) {
        groups.today.push(event)
      } else if (eventDate === yesterdayStr) {
        groups.yesterday.push(event)
      } else {
        groups.earlier.push(event)
      }
    })

    return groups
  }, [activityLogs, filteredDispatchOrders, qcCockpit])

  // Section 3: Structured Notifications Center (Critical -> Warning -> Information)
  const structuredNotifications = useMemo(() => {
    const list: Array<{
      id: string
      priority: 'Critical' | 'Warning' | 'Information'
      module: string
      title: string
      description: string
      time: string
      targetPath: string
    }> = []

    if (openQcIssuesCount > 0) {
      list.push({
        id: 'notif-qc',
        priority: 'Critical',
        module: 'QC',
        title: 'Cần sửa đổi sự cố QC (NCR)',
        description: `Hiện có ${openQcIssuesCount} phiếu NCR kiểm định chưa được đóng.`,
        time: 'Hôm nay',
        targetPath: '/qc',
      })
    }

    if (lowStockItems > 0) {
      list.push({
        id: 'notif-stock',
        priority: 'Warning',
        module: 'Inventory',
        title: 'Cảnh báo tồn kho tối thiểu',
        description: `Có ${lowStockItems} mã vật tư tụt dưới ngưỡng dự trữ định mức.`,
        time: 'Hôm nay',
        targetPath: '/inventory',
      })
    }

    if (pendingApprovalsCount > 0) {
      list.push({
        id: 'notif-appr',
        priority: 'Information',
        module: 'Logistics',
        title: 'Lệnh chờ điều phối & phê duyệt',
        description: `Có ${pendingApprovalsCount} lượt vận chuyển hoặc công đoạn sản xuất cần duyệt.`,
        time: 'Hôm nay',
        targetPath: '/logistics/dispatch',
      })
    }

    return list
  }, [lowStockItems, openQcIssuesCount, pendingApprovalsCount])

  const hasActiveFilter = timeRange !== '30D' || selectedProject !== 'all' || selectedWarehouse !== 'all'

  return (
    <EnterpriseWorkspace
      eyebrow="Enterprise"
      title="Bảng điều hành tổng thể"
      description="Trung tâm điều hành doanh nghiệp SteelTrack — Theo dõi kho, sản xuất, công trình và giao vận theo thời gian thực."
      breadcrumbs={['Tổng quan', 'Bảng KPI chính']}
      actions={
        <div className="flex items-center gap-2">
          <button className={moduleMutedButton} onClick={refresh} type="button">
            <RefreshCw size={14} /> Làm mới dữ liệu
          </button>
        </div>
      }
    >
      {/* GLOBAL DASHBOARD FILTERS TOOLBAR */}
      <section className="mb-1 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-2">
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
            <Filter size={13} className="text-cyan-300" /> Bộ lọc Executive:
          </span>

          {/* Time Range Chips */}
          <div className="flex items-center gap-1">
            {[
              { id: 'TODAY', label: 'Hôm nay' },
              { id: '7D', label: '7 Ngày' },
              { id: '30D', label: '30 Ngày' },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setTimeRange(chip.id as TimeRange)}
                className={`h-7 rounded-lg px-2.5 text-[11px] font-medium transition ${
                  timeRange === chip.id
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 font-semibold'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/5'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Project Select */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="h-7 rounded-lg border border-white/10 bg-slate-950/45 px-2 text-xs text-slate-200 outline-none focus:border-cyan-400"
          >
            <option value="all">Tất cả Công trình</option>
            {projectsList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Warehouse Select */}
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="h-7 rounded-lg border border-white/10 bg-slate-950/45 px-2 text-xs text-slate-200 outline-none focus:border-cyan-400"
          >
            <option value="all">Tất cả Kho</option>
            {warehouses.map((w: any) => (
              <option key={w.id} value={w.id}>
                {w.name || w.code}
              </option>
            ))}
          </select>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => {
                setTimeRange('30D')
                setSelectedProject('all')
                setSelectedWarehouse('all')
              }}
              className="h-7 rounded-lg border border-red-500/30 bg-red-500/10 px-2 text-xs font-medium text-red-300 hover:bg-red-500/20 transition flex items-center gap-1 shrink-0"
              title="Xóa lọc"
            >
              <X size={12} /> Xóa lọc
            </button>
          )}
        </div>
      </section>

      {/* SECTION 1: 8 Executive KPI Cards with Drill-down Navigation */}
      <section className="grid gap-1 md:grid-cols-4 xl:grid-cols-8">
        <CockpitKpiCard
          title="Giá trị tồn kho"
          value={isLoading ? '' : formatCurrencyVnd(inventoryValue)}
          note="Tổng giá trị kho hiện tại"
          icon={<Warehouse size={16} />}
          tone="cyan"
          state={isLoading ? 'loading' : 'normal'}
          onClick={() => navigate('/analytics?domain=inventory')}
        />
        <CockpitKpiCard
          title="Vật tư sắp hết"
          value={isLoading ? '' : fmt(lowStockItems)}
          note="Dưới định mức tối thiểu"
          icon={<AlertTriangle size={16} />}
          tone={lowStockItems > 0 ? 'amber' : 'emerald'}
          state={isLoading ? 'loading' : 'normal'}
          onClick={() => navigate('/analytics?domain=inventory')}
        />
        <CockpitKpiCard
          title="Lệnh SX đang chạy"
          value={isLoading ? '' : fmt(runningMOs)}
          note="Đang gia công xưởng"
          icon={<Factory size={16} />}
          tone="blue"
          state={isLoading ? 'loading' : 'normal'}
          onClick={() => navigate('/analytics?domain=production')}
        />
        <CockpitKpiCard
          title="Dự án triển khai"
          value={isLoading ? '' : fmt(activeProjectsCount)}
          note="Công trình đang chạy"
          icon={<Building2 size={16} />}
          tone="cyan"
          state={isLoading ? 'loading' : 'normal'}
          onClick={() => navigate('/analytics?domain=projects')}
        />
        <CockpitKpiCard
          title="Giao hàng hôm nay"
          value={isLoading ? '' : fmt(deliveriesTodayCount)}
          note="Lệnh xe chạy tuyến"
          icon={<Truck size={16} />}
          tone="cyan"
          state={isLoading ? 'loading' : 'normal'}
          onClick={() => navigate('/analytics?domain=logistics')}
        />
        <CockpitKpiCard
          title="Sự cố QC / NCR"
          value={isLoading ? '' : fmt(openQcIssuesCount)}
          note="Lỗi kiểm định chờ sửa"
          icon={<ShieldCheck size={16} />}
          tone={openQcIssuesCount > 0 ? 'red' : 'emerald'}
          state={isLoading ? 'loading' : 'normal'}
          onClick={() => navigate('/analytics?domain=qc')}
        />
        <CockpitKpiCard
          title="Chờ điều phối / duyệt"
          value={isLoading ? '' : fmt(pendingApprovalsCount)}
          note="Cần xử lý phê duyệt"
          icon={<CalendarClock size={16} />}
          tone="amber"
          state={isLoading ? 'loading' : 'normal'}
          onClick={() => navigate('/analytics?domain=planning')}
        />
        <CockpitKpiCard
          title="Sức khỏe hệ thống"
          value={isLoading ? '' : `${systemHealthPercent}%`}
          note="Workflow & Services OK"
          icon={<CheckCircle2 size={16} />}
          tone="emerald"
          state={isLoading ? 'loading' : 'normal'}
          onClick={() => navigate('/analytics?domain=admin')}
        />
      </section>

      {/* MAIN BODY GRID: Left (70%) & Right (30%) */}
      <div className="grid gap-1 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-1">
          {/* SECTION 2: Operational Overview Cards */}
          <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3">
            <h2 className="mb-2 text-sm font-semibold text-white">Tổng quan Vận hành các Phân hệ</h2>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              <ModuleSummaryCard
                title="Vật tư & Kho"
                status="HOẠT ĐỘNG"
                metric={`${fmt(filteredInventoryRows.length)} vị trí tồn`}
                subtitle={`Giá trị: ${formatCurrencyVnd(inventoryValue)}`}
                actionLabel="Xem kho ➔"
                onAction={() => navigate('/inventory')}
                icon={<Warehouse size={16} className="text-cyan-300" />}
              />
              <ModuleSummaryCard
                title="Sản xuất & Cấu kiện"
                status="XƯỞNG ĐANG CHẠY"
                metric={`${fmt(filteredProductionOrders.length)} lệnh sản xuất`}
                subtitle={`${fmt(runningMOs)} MO đang chạy tại xưởng`}
                actionLabel="Xem xưởng ➔"
                onAction={() => navigate('/production')}
                icon={<Factory size={16} className="text-blue-300" />}
              />
              <ModuleSummaryCard
                title="Công trình & WBS"
                status="TIẾN ĐỘ TỐT"
                metric={`${fmt(projectsList.length)} công trình`}
                subtitle={`${fmt(activeProjectsCount)} dự án đang thi công`}
                actionLabel="Xem dự án ➔"
                onAction={() => navigate('/projects')}
                icon={<Building2 size={16} className="text-emerald-300" />}
              />
              <ModuleSummaryCard
                title="Kế hoạch tổng thể"
                status="ĐÃ LẬP LỊCH"
                metric="Lịch chạy 24h & MRP"
                subtitle="Cân đối nguồn lực và vật tư thiếu"
                actionLabel="Xem kế hoạch ➔"
                onAction={() => navigate('/planning')}
                icon={<CalendarClock size={16} className="text-cyan-300" />}
              />
              <ModuleSummaryCard
                title="Vận chuyển & Điều xe"
                status="ĐANG CHẠY TUYẾN"
                metric={`${fmt(filteredDispatchOrders.length)} lượt vận chuyển`}
                subtitle={`${fmt(deliveriesTodayCount)} chuyến hôm nay`}
                actionLabel="Xem điều xe ➔"
                onAction={() => navigate('/logistics')}
                icon={<Truck size={16} className="text-amber-300" />}
              />
              <ModuleSummaryCard
                title="Chất lượng & QC"
                status={openQcIssuesCount > 0 ? 'CÓ CẢNH BÁO' : 'ĐẠT CHUẨN'}
                metric={`${fmt(qcCockpit?.metrics?.passRate ?? 98)}% tỷ lệ Pass`}
                subtitle={`${fmt(openQcIssuesCount)} NCR chưa khắc phục`}
                actionLabel="Xem QC ➔"
                onAction={() => navigate('/qc')}
                icon={<ShieldCheck size={16} className="text-purple-300" />}
              />
            </div>
          </section>

          {/* SECTION 1 — Dedicated Operational Analytics Panels with Card-level Click Navigation */}
          <section className="grid gap-1 lg:grid-cols-2">
            {/* 1. Production Trend Analytics */}
            <div onClick={() => navigate('/analytics?domain=production')} className="cursor-pointer block">
              <CockpitChartCard
                title="Phân bố Trạng thái Sản xuất"
                className="hover:border-cyan-400/25 transition hover:bg-white/[0.02]"
                heightClass="h-[220px]"
              >
                {filteredProductionOrders.length > 0 ? (
                  <ProductionStatusDistribution orders={filteredProductionOrders} />
                ) : (
                  <CockpitEmptyState
                    title="Chưa có dữ liệu sản xuất"
                    description="Dữ liệu tổng hợp theo thời gian thực sẽ xuất hiện khi có lệnh MO."
                  />
                )}
              </CockpitChartCard>
            </div>

            {/* 2. Logistics Trend Analytics */}
            <div onClick={() => navigate('/analytics?domain=logistics')} className="cursor-pointer block">
              <CockpitChartCard
                title="Trạng thái Chuyến vận chuyển"
                className="hover:border-cyan-400/25 transition hover:bg-white/[0.02]"
                heightClass="h-[220px]"
              >
                {filteredDispatchOrders.length > 0 ? (
                  <LogisticsStatusDistribution orders={filteredDispatchOrders} />
                ) : (
                  <CockpitEmptyState
                    title="Chưa có dữ liệu điều xe"
                    description="Dữ liệu tổng hợp theo thời gian thực sẽ xuất hiện khi lập lịch giao vận."
                  />
                )}
              </CockpitChartCard>
            </div>

            {/* 3. Project Trend Analytics */}
            <div onClick={() => navigate('/analytics?domain=projects')} className="cursor-pointer block">
              <CockpitChartCard
                title="Phân bố Tiến độ Dự án"
                className="hover:border-cyan-400/25 transition hover:bg-white/[0.02]"
                heightClass="h-[220px]"
              >
                {projectsList.length > 0 ? (
                  <ProjectStatusDistribution projects={projectsList} />
                ) : (
                  <CockpitEmptyState
                    title="Chưa có công trình"
                    description="Dữ liệu tổng hợp dự án sẽ hiển thị khi khởi tạo WBS."
                  />
                )}
              </CockpitChartCard>
            </div>

            {/* 4. QC Inspection Trend Analytics */}
            <div onClick={() => navigate('/analytics?domain=qc')} className="cursor-pointer block">
              <CockpitChartCard
                title="Chỉ số Kiểm định QC"
                className="hover:border-cyan-400/25 transition hover:bg-white/[0.02]"
                heightClass="h-[220px]"
              >
                {qcCockpit?.metrics ? (
                  <QcMetricsDistribution metrics={qcCockpit.metrics} />
                ) : (
                  <CockpitEmptyState
                    title="Chưa có lịch sử QC"
                    description="Dữ liệu kiểm định sẽ xuất hiện khi có lượt QC phát sinh."
                  />
                )}
              </CockpitChartCard>
            </div>
          </section>
        </main>

        {/* RIGHT SIDEBAR: Notifications, Activities, Health & Quick Actions */}
        <aside className="space-y-1">
          {/* Quick Actions Navigation Shortcuts */}
          <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3">
            <h3 className="mb-2 text-sm font-semibold text-white">Thao tác Nhanh</h3>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => navigate('/inventory/inbound')}
                className="flex items-center gap-1.5 rounded-lg border border-cyan-300/10 bg-slate-950/45 p-2 text-xs font-medium text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300 transition"
              >
                <Warehouse size={14} className="text-cyan-300 shrink-0" /> Nhập kho
              </button>
              <button
                type="button"
                onClick={() => navigate('/logistics/dispatch')}
                className="flex items-center gap-1.5 rounded-lg border border-cyan-300/10 bg-slate-950/45 p-2 text-xs font-medium text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300 transition"
              >
                <Truck size={14} className="text-amber-300 shrink-0" /> Điều xe
              </button>
              <button
                type="button"
                onClick={() => navigate('/production')}
                className="flex items-center gap-1.5 rounded-lg border border-cyan-300/10 bg-slate-950/45 p-2 text-xs font-medium text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300 transition"
              >
                <Factory size={14} className="text-blue-300 shrink-0" /> Tạo lệnh MO
              </button>
              <button
                type="button"
                onClick={() => navigate('/projects')}
                className="flex items-center gap-1.5 rounded-lg border border-cyan-300/10 bg-slate-950/45 p-2 text-xs font-medium text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300 transition"
              >
                <Building2 size={14} className="text-emerald-300 shrink-0" /> Dự án mới
              </button>
            </div>
          </section>

          {/* SECTION 3 — Notifications Center */}
          <CockpitChartCard title="Trung tâm Cảnh báo & Thông báo" className="h-[250px]">
            <StructuredNotificationCenter notifications={structuredNotifications} onNavigate={(path) => navigate(path)} />
          </CockpitChartCard>

          {/* SECTION 2 — Unified Recent Activities Feed (Grouped by Today, Yesterday, Earlier) */}
          <CockpitChartCard title="Nhật ký Hoạt động Hợp nhất" className="h-[270px]">
            <UnifiedActivityTimeline groups={groupedActivities} onNavigate={(path) => path && navigate(path)} />
          </CockpitChartCard>

          {/* System Health Details with click navigation to system settings/logs */}
          <div onClick={() => navigate('/analytics?domain=admin')} className="cursor-pointer block">
            <CockpitChartCard
              title="Trạng thái Dịch vụ System"
              className="hover:border-cyan-400/25 transition hover:bg-white/[0.02]"
            >
              <CockpitStatusList
                items={[
                  { id: '1', label: 'Backend API Service', value: 'ONLINE', statusTone: 'emerald' },
                  { id: '2', label: 'Workflow Integrity', value: `${systemHealthPercent}%`, statusTone: 'cyan' },
                  { id: '3', label: 'Background Engine Jobs', value: 'ACTIVE', statusTone: 'emerald' },
                ]}
                emptyMessage="Chưa có dữ liệu hệ thống."
              />
            </CockpitChartCard>
          </div>
        </aside>
      </div>
    </EnterpriseWorkspace>
  )
}

function ModuleSummaryCard({
  title,
  status,
  metric,
  subtitle,
  actionLabel,
  onAction,
  icon,
}: {
  title: string
  status: string
  metric: string
  subtitle: string
  actionLabel: string
  onAction: () => void
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-cyan-300/10 bg-slate-950/45 p-3 flex flex-col justify-between hover:border-cyan-300/25 transition">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-semibold text-white text-xs">{title}</span>
          </div>
          <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-mono text-cyan-300">
            {status}
          </span>
        </div>
        <div className="text-base font-bold text-cyan-200 font-mono">{metric}</div>
        <div className="text-[11px] text-slate-400 mt-1">{subtitle}</div>
      </div>
      <div className="mt-3 text-right">
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-cyan-300 hover:text-cyan-200 transition"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  )
}

function StructuredNotificationCenter({
  notifications,
  onNavigate,
}: {
  notifications: Array<{
    id: string
    priority: 'Critical' | 'Warning' | 'Information'
    module: string
    title: string
    description: string
    time: string
    targetPath: string
  }>
  onNavigate: (path: string) => void
}) {
  if (!notifications.length) {
    return <CockpitEmptyState title="Vận hành bình thường" description="Không có thông báo critical hay warning." />
  }

  return (
    <div className="space-y-2 overflow-y-auto max-h-[190px]">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`rounded-lg border p-2 text-xs transition ${
            n.priority === 'Critical'
              ? 'border-red-500/30 bg-red-500/10 text-red-200'
              : n.priority === 'Warning'
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200'
          }`}
        >
          <div className="flex items-center justify-between font-semibold">
            <span className="flex items-center gap-1">
              <span className="font-bold">{n.priority.toUpperCase()}</span> · {n.module}
            </span>
            <button
              type="button"
              onClick={() => onNavigate(n.targetPath)}
              className="text-[11px] font-semibold text-cyan-300 hover:underline flex items-center gap-0.5"
            >
              Xử lý <ChevronRight size={12} />
            </button>
          </div>
          <p className="mt-1 font-medium text-white">{n.title}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{n.description}</p>
        </div>
      ))}
    </div>
  )
}

function UnifiedActivityTimeline({
  groups,
  onNavigate,
}: {
  groups: {
    today: Array<{ id: string; module: string; title: string; description: string; createdAt: string; severity: string; targetPath?: string }>
    yesterday: Array<{ id: string; module: string; title: string; description: string; createdAt: string; severity: string; targetPath?: string }>
    earlier: Array<{ id: string; module: string; title: string; description: string; createdAt: string; severity: string; targetPath?: string }>
  }
  onNavigate: (path?: string) => void
}) {
  const isEmpty = !groups.today.length && !groups.yesterday.length && !groups.earlier.length

  if (isEmpty) {
    return <CockpitEmptyState title="Chưa có nhật ký" description="Không phát hiện hoạt động gần đây." />
  }

  return (
    <div className="space-y-3 overflow-y-auto max-h-[210px] text-xs">
      {groups.today.length > 0 && (
        <div>
          <h4 className="text-[11px] font-semibold text-cyan-300 uppercase tracking-wider mb-1">Hôm nay</h4>
          <ActivitySubList items={groups.today} onNavigate={onNavigate} />
        </div>
      )}

      {groups.yesterday.length > 0 && (
        <div>
          <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Hôm qua</h4>
          <ActivitySubList items={groups.yesterday} onNavigate={onNavigate} />
        </div>
      )}

      {groups.earlier.length > 0 && (
        <div>
          <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Trước đó</h4>
          <ActivitySubList items={groups.earlier} onNavigate={onNavigate} />
        </div>
      )}
    </div>
  )
}

function ActivitySubList({
  items,
  onNavigate,
}: {
  items: Array<{ id: string; module: string; title: string; description: string; createdAt: string; severity: string; targetPath?: string }>
  onNavigate: (path?: string) => void
}) {
  return (
    <div className="space-y-1.5 border-l border-cyan-300/15 pl-2">
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => onNavigate(item.targetPath)}
          className="cursor-pointer rounded-md bg-slate-950/45 p-1.5 hover:bg-cyan-500/10 transition flex items-start justify-between gap-2"
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-cyan-500/20 px-1 py-0.5 text-[9px] font-mono text-cyan-300">{item.module}</span>
              <span className="font-semibold text-white truncate max-w-[200px]">{item.title}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[240px]">{item.description}</p>
          </div>
          <span className="text-[10px] text-slate-500 font-mono shrink-0">{date(item.createdAt)}</span>
        </div>
      ))}
    </div>
  )
}

function ProductionStatusDistribution({ orders }: { orders: ProductionOrder[] }) {
  const counts: Record<string, number> = {}
  orders.forEach((o: any) => {
    const s = o.status || 'OTHER'
    counts[s] = (counts[s] || 0) + 1
  })
  const rows = Object.entries(counts)
  const max = Math.max(1, ...rows.map(([, v]) => v))

  return (
    <div className="space-y-2 text-xs">
      {rows.map(([status, value]) => (
        <div key={status}>
          <div className="mb-1 flex justify-between">
            <span className="text-slate-300">{status}</span>
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

function LogisticsStatusDistribution({ orders }: { orders: any[] }) {
  const counts: Record<string, number> = {}
  orders.forEach((o) => {
    const s = o.status || 'OTHER'
    counts[s] = (counts[s] || 0) + 1
  })
  const rows = Object.entries(counts)
  const max = Math.max(1, ...rows.map(([, v]) => v))

  return (
    <div className="space-y-2 text-xs">
      {rows.map(([status, value]) => (
        <div key={status}>
          <div className="mb-1 flex justify-between">
            <span className="text-slate-300">{status}</span>
            <span className="font-mono font-semibold text-cyan-300">{fmt(value)}</span>
          </div>
          <div className="h-2 rounded bg-white/10">
            <i
              className="block h-full rounded bg-gradient-to-r from-amber-500 to-cyan-400"
              style={{ width: `${(value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function ProjectStatusDistribution({ projects }: { projects: any[] }) {
  const active = projects.filter((p) => p.status === 'ACTIVE' || p.progress < 100).length
  const completed = projects.filter((p) => p.progress >= 100).length
  const total = projects.length || 1

  return (
    <div className="space-y-3 text-xs">
      <div>
        <div className="mb-1 flex justify-between">
          <span className="text-slate-300">Đang triển khai</span>
          <span className="font-mono font-semibold text-cyan-300">{fmt(active)}</span>
        </div>
        <div className="h-2 rounded bg-white/10">
          <i className="block h-full rounded bg-cyan-400" style={{ width: `${(active / total) * 100}%` }} />
        </div>
      </div>

      <div>
        <div className="mb-1 flex justify-between">
          <span className="text-slate-300">Hoàn thành</span>
          <span className="font-mono font-semibold text-emerald-300">{fmt(completed)}</span>
        </div>
        <div className="h-2 rounded bg-white/10">
          <i className="block h-full rounded bg-emerald-400" style={{ width: `${(completed / total) * 100}%` }} />
        </div>
      </div>
    </div>
  )
}

function QcMetricsDistribution({ metrics }: { metrics: any }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-center text-xs">
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2">
        <span className="text-emerald-300 font-bold text-base block">{fmt(metrics.passed)}</span>
        <span className="text-slate-400 text-[11px]">Pass</span>
      </div>
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2">
        <span className="text-amber-300 font-bold text-base block">{fmt(metrics.rework)}</span>
        <span className="text-slate-400 text-[11px]">Rework</span>
      </div>
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-2">
        <span className="text-red-300 font-bold text-base block">{fmt(metrics.failed)}</span>
        <span className="text-slate-400 text-[11px]">Fail / NCR</span>
      </div>
    </div>
  )
}
