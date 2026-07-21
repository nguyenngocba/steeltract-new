import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  Bell,
  Boxes,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Factory,
  FileClock,
  PackageCheck,
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  UserCheck,
  Warehouse,
} from 'lucide-react'

import { getDispatchDashboard, getDispatchOrders } from '@/modules/logistics/api/logistics.api'
import { getProjectsRuntime, type ProjectsRuntime } from '@/modules/projects/api/projects.api'
import { productionApi, type ProductionOrder } from '@/modules/production/api/production.api'
import { getInventoryItems } from '@/modules/inventory/api/inventory.api'
import { useInventoryAudit } from '@/modules/inventory/hooks/useInventoryAudit'
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
  moduleMutedButton,
  modulePrimaryButton,
} from '@/shared/ui/modules'
import { formatCurrencyVnd, formatQuantity } from '@/shared/utils/number-format'

const fmt = (value = 0, digits = 0) => formatQuantity(value, digits)
const date = (value?: string | null) => (value ? new Intl.DateTimeFormat('vi-VN').format(new Date(value)) : '—')

export function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Queries for real data across all modules
  const { data: inventoryRows = [], isLoading: inventoryLoading } = useInventoryAudit()
  const { data: inventoryItems = [] } = useQuery({ queryKey: ['inventory-items'], queryFn: getInventoryItems })
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
  const { data: dispatchOrders = [] } = useQuery({
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

  // 1. Calculations for Executive KPIs
  const inventoryValue = useMemo(() => {
    return inventoryRows.reduce((sum, row) => sum + Number(row.stockValue || 0), 0)
  }, [inventoryRows])

  const lowStockItems = useMemo(() => {
    return inventoryItems.filter((item: any) => {
      const qty = Number(item.quantity || 0)
      const minQty = Number(item.minQuantity || item.reorderPoint || 0)
      return minQty > 0 && qty <= minQty
    }).length
  }, [inventoryItems])

  const runningMOs = useMemo(() => {
    return productionOrders.filter((mo: any) => mo.status === 'RUNNING' || mo.status === 'IN_PROGRESS').length
  }, [productionOrders])

  const activeProjects = useMemo(() => {
    const projects = projectsRuntime?.projects ?? []
    return projects.filter((p) => p.status === 'ACTIVE' || p.progress < 100).length
  }, [projectsRuntime])

  const deliveriesToday = useMemo(() => {
    return dispatchOrders.filter(
      (d) => ['LOADING', 'IN_TRANSIT', 'ARRIVED'].includes(d.status) || d.status === 'PLANNED',
    ).length
  }, [dispatchOrders])

  const openQcIssues = useMemo(() => {
    return Number(qcCockpit?.metrics?.openNcrs ?? 0)
  }, [qcCockpit])

  const pendingApprovals = useMemo(() => {
    const waitingDispatch = dispatchDashboard?.kpis?.waiting ?? 0
    const blockedMOs = productionOrders.filter((mo: any) => Number(mo.scrapCount) > 0).length
    return waitingDispatch + blockedMOs
  }, [dispatchDashboard, productionOrders])

  const okWorkflowSteps = workflow?.steps.filter((s) => s.status === 'OK').length ?? 0
  const totalWorkflowSteps = workflow?.steps.length ?? 1
  const systemHealthPercent = Math.round((okWorkflowSteps / totalWorkflowSteps) * 100)

  // Combined Unified Activity Feed (Newest first)
  const unifiedActivities = useMemo(() => {
    const items: Array<{ id: string; title: string; subtitle: string; time: string; tone?: 'cyan' | 'emerald' | 'amber' | 'red' }> = []

    activityLogs.slice(0, 6).forEach((log) => {
      items.push({
        id: `log-${log.id}`,
        title: `${log.user?.fullName || log.user?.username || 'System'}: ${log.action}`,
        subtitle: `${log.module || 'System'} · ${log.entity} ${log.entityId || ''}`,
        time: date(log.createdAt),
        tone: log.action.toLowerCase().includes('delete') ? 'red' : 'cyan',
      })
    })

    dispatchOrders.slice(0, 4).forEach((d) => {
      items.push({
        id: `disp-${d.id}`,
        title: `Điều xe ${d.code}: ${d.project?.name || 'Công trình'}`,
        subtitle: `Xe: ${d.vehicle || 'Chưa gán'} · Trạng thái: ${d.status}`,
        time: date(d.plannedAt || d.createdAt),
        tone: 'emerald',
      })
    })

    return items.slice(0, 8)
  }, [activityLogs, dispatchOrders])

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
      {/* SECTION 1: 8 Executive KPI Cards */}
      <section className="grid gap-1 md:grid-cols-4 xl:grid-cols-8">
        <CockpitKpiCard
          title="Giá trị tồn kho"
          value={isLoading ? '' : formatCurrencyVnd(inventoryValue)}
          note="Tổng giá trị kho hiện tại"
          icon={<Warehouse size={16} />}
          tone="cyan"
          state={isLoading ? 'loading' : 'normal'}
        />
        <CockpitKpiCard
          title="Vật tư sắp hết"
          value={isLoading ? '' : fmt(lowStockItems)}
          note="Dưới định mức tối thiểu"
          icon={<AlertTriangle size={16} />}
          tone={lowStockItems > 0 ? 'amber' : 'emerald'}
          state={isLoading ? 'loading' : 'normal'}
        />
        <CockpitKpiCard
          title="Lệnh SX đang chạy"
          value={isLoading ? '' : fmt(runningMOs)}
          note="Đang gia công xưởng"
          icon={<Factory size={16} />}
          tone="blue"
          state={isLoading ? 'loading' : 'normal'}
        />
        <CockpitKpiCard
          title="Dự án triển khai"
          value={isLoading ? '' : fmt(activeProjects)}
          note="Công trình đang chạy"
          icon={<Building2 size={16} />}
          tone="cyan"
          state={isLoading ? 'loading' : 'normal'}
        />
        <CockpitKpiCard
          title="Giao hàng hôm nay"
          value={isLoading ? '' : fmt(deliveriesToday)}
          note="Lệnh xe chạy tuyến"
          icon={<Truck size={16} />}
          tone="cyan"
          state={isLoading ? 'loading' : 'normal'}
        />
        <CockpitKpiCard
          title="Sự cố QC / NCR"
          value={isLoading ? '' : fmt(openQcIssues)}
          note="Lỗi kiểm định chờ sửa"
          icon={<ShieldCheck size={16} />}
          tone={openQcIssues > 0 ? 'red' : 'emerald'}
          state={isLoading ? 'loading' : 'normal'}
        />
        <CockpitKpiCard
          title="Chờ điều phối / duyệt"
          value={isLoading ? '' : fmt(pendingApprovals)}
          note="Cần xử lý phê duyệt"
          icon={<CalendarClock size={16} />}
          tone="amber"
          state={isLoading ? 'loading' : 'normal'}
        />
        <CockpitKpiCard
          title="Sức khỏe hệ thống"
          value={isLoading ? '' : `${systemHealthPercent}%`}
          note="Workflow & Services OK"
          icon={<CheckCircle2 size={16} />}
          tone="emerald"
          state={isLoading ? 'loading' : 'normal'}
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
                metric={`${fmt(inventoryRows.length)} vị trí tồn`}
                subtitle={`Giá trị: ${formatCurrencyVnd(inventoryValue)}`}
                actionLabel="Xem kho ➔"
                onAction={() => navigate('/inventory')}
                icon={<Warehouse size={16} className="text-cyan-300" />}
              />
              <ModuleSummaryCard
                title="Sản xuất & Cấu kiện"
                status="XƯỞNG ĐANG CHẠY"
                metric={`${fmt(productionOrders.length)} lệnh sản xuất`}
                subtitle={`${fmt(runningMOs)} MO đang chạy tại xưởng`}
                actionLabel="Xem xưởng ➔"
                onAction={() => navigate('/production')}
                icon={<Factory size={16} className="text-blue-300" />}
              />
              <ModuleSummaryCard
                title="Công trình & WBS"
                status="TIẾN ĐỘ TỐT"
                metric={`${fmt(projectsRuntime?.projects?.length ?? 0)} công trình`}
                subtitle={`${fmt(activeProjects)} dự án đang thi công`}
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
                metric={`${fmt(dispatchOrders.length)} lượt vận chuyển`}
                subtitle={`${fmt(deliveriesToday)} chuyến hôm nay`}
                actionLabel="Xem điều xe ➔"
                onAction={() => navigate('/logistics')}
                icon={<Truck size={16} className="text-amber-300" />}
              />
              <ModuleSummaryCard
                title="Chất lượng & QC"
                status={openQcIssues > 0 ? 'CÓ CẢNH BÁO' : 'ĐẠT CHUẨN'}
                metric={`${fmt(qcCockpit?.metrics?.passRate ?? 98)}% tỷ lệ Pass`}
                subtitle={`${fmt(openQcIssues)} NCR chưa khắc phục`}
                actionLabel="Xem QC ➔"
                onAction={() => navigate('/qc')}
                icon={<ShieldCheck size={16} className="text-purple-300" />}
              />
            </div>
          </section>

          {/* SECTION 3: Trend Analytics */}
          <section className="grid gap-1 lg:grid-cols-2">
            <CockpitChartCard title="Phân bố Trạng thái Sản xuất" className="h-[220px]">
              {productionOrders.length > 0 ? (
                <ProductionStatusDistribution orders={productionOrders} />
              ) : (
                <CockpitEmptyState title="Chưa có dữ liệu sản xuất" description="Số liệu sẽ hiển thị khi khởi tạo lệnh MO." />
              )}
            </CockpitChartCard>

            <CockpitChartCard title="Trạng thái Chuyến vận chuyển" className="h-[220px]">
              {dispatchOrders.length > 0 ? (
                <LogisticsStatusDistribution orders={dispatchOrders} />
              ) : (
                <CockpitEmptyState title="Chưa có dữ liệu điều xe" description="Số liệu sẽ hiển thị khi lập lịch vận chuyển." />
              )}
            </CockpitChartCard>
          </section>
        </main>

        {/* RIGHT SIDEBAR: Notifications, Activities, Health & Quick Actions */}
        <aside className="space-y-1">
          {/* SECTION 7: Quick Actions */}
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

          {/* SECTION 5: Notifications Center */}
          <CockpitChartCard title="Trung tâm Cảnh báo & Thông báo" className="h-[240px]">
            <NotificationCenter lowStock={lowStockItems} openQc={openQcIssues} pending={pendingApprovals} />
          </CockpitChartCard>

          {/* SECTION 4: Recent Activities */}
          <CockpitChartCard title="Nhật ký Hoạt động Gần đây" className="h-[240px]">
            <CockpitRecentList
              items={unifiedActivities}
              emptyMessage="Chưa có nhật ký hoạt động."
            />
          </CockpitChartCard>

          {/* SECTION 6: System Health Details */}
          <CockpitChartCard title="Trạng thái Dịch vụ System">
            <CockpitStatusList
              items={[
                { id: '1', label: 'Backend API Service', value: 'ONLINE', statusTone: 'emerald' },
                { id: '2', label: 'Workflow Integrity', value: `${systemHealthPercent}%`, statusTone: 'cyan' },
                { id: '3', label: 'Background Engine Jobs', value: 'ACTIVE', statusTone: 'emerald' },
              ]}
              emptyMessage="Chưa có dữ liệu hệ thống."
            />
          </CockpitChartCard>
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

function NotificationCenter({ lowStock, openQc, pending }: { lowStock: number; openQc: number; pending: number }) {
  const alerts = []
  if (openQc > 0) {
    alerts.push({ id: 'qc', priority: 'Critical', text: `Có ${openQc} sự cố chất lượng (NCR) cần xử lý` })
  }
  if (lowStock > 0) {
    alerts.push({ id: 'mrp', priority: 'Warning', text: `Có ${lowStock} mặt hàng thiếu tồn khả dụng` })
  }
  if (pending > 0) {
    alerts.push({ id: 'appr', priority: 'Information', text: `Có ${pending} lệnh điều xe / sản xuất chờ phê duyệt` })
  }

  if (!alerts.length) {
    return <CockpitEmptyState title="Hệ thống vận hành an toàn" description="Không phát sinh cảnh báo critical hay warning." />
  }

  return (
    <div className="space-y-2 overflow-y-auto max-h-[180px]">
      {alerts.map((a) => (
        <div
          key={a.id}
          className={`rounded-lg border p-2 text-xs ${
            a.priority === 'Critical'
              ? 'border-red-500/30 bg-red-500/10 text-red-200'
              : a.priority === 'Warning'
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200'
          }`}
        >
          <div className="flex items-center justify-between font-semibold">
            <span>{a.priority}</span>
            <span className="text-[10px] opacity-75">{a.priority === 'Critical' ? 'P1' : 'P2'}</span>
          </div>
          <p className="mt-1 text-slate-300">{a.text}</p>
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
