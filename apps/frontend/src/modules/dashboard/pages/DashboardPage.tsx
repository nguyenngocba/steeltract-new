import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  Bell,
  Boxes,
  Factory,
  PackagePlus,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Warehouse,
  Clock,
  CheckSquare,
} from 'lucide-react'

import { useComponents } from '@/modules/components/hooks/queries/useComponents'
import { useInventoryAudit } from '@/modules/inventory/hooks/useInventoryAudit'
import { useInventoryTransactions } from '@/modules/inventory/hooks/useInventoryTransactions'
import { useProductionOrders } from '@/modules/production/hooks/useProductionCockpit'
import { getProjectsRuntime } from '@/modules/projects/api/projects.api'
import { getQcCockpit } from '@/modules/qc/api/qc.api'
import { useSupplierCockpitSummaryQuery, useSupplierEvaluationCockpitQuery } from '@/modules/suppliers/hooks/useSuppliersQuery'
import { useYardMetricsRuntime, useYardMovementsRuntime } from '@/modules/yard/hooks/queries/useYardRuntime'
import { OperationalShell } from '@/shared/layouts/OperationalShell'
import {
  ModuleEmptyState,
} from '@/shared/ui/modules'
import { formatCurrencyVnd, formatQuantity } from '@/shared/utils/number-format'
import {
  getDashboardCockpit,
  getDashboardExecutiveCockpit,
  type DashboardCockpit,
  type DashboardExecutiveCockpit,
  type ExecutiveActivityItem,
} from '@/services/api/dashboard.api'
import {
  CockpitChartCard,
  CockpitKpiCard,
  CockpitRecentList,
  CockpitSidebarStats,
  CockpitStatusList,
  COCKPIT_HEIGHTS,
} from '@/shared/ui/cockpit'

const fmt = (value = 0, digits = 0) => formatQuantity(value, digits)
const colors = ['#1d7cff', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#38bdf8']
type DashboardTab = 'kpi' | 'trends' | 'activities' | 'notifications'
const dashboardTabs: Array<{ id: DashboardTab; label: string }> = [
  { id: 'kpi', label: 'KPI Chính' },
  { id: 'trends', label: 'Biểu đồ xu hướng' },
  { id: 'activities', label: 'Hoạt động gần đây' },
  { id: 'notifications', label: 'Thông báo' },
]

// ----------------------------------------------------
// Main Cockpit Page Component
// ----------------------------------------------------

export function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab') as DashboardTab | null
  const activeTab = dashboardTabs.some((tab) => tab.id === requestedTab) ? requestedTab! : 'kpi'
  const { data, isLoading } = useQuery<DashboardCockpit>({
    queryKey: ['dashboard-cockpit'],
    queryFn: getDashboardCockpit,
    refetchInterval: 10000,
  })
  const { data: executiveCockpit, isLoading: executiveLoading } = useQuery<DashboardExecutiveCockpit>({
    queryKey: ['dashboard-executive-cockpit'],
    queryFn: getDashboardExecutiveCockpit,
    refetchInterval: 10000,
  })
  const { data: transactionsRaw = [] } = useInventoryTransactions({})
  const { data: inventoryRows = [] } = useInventoryAudit()
  const { data: components = [] } = useComponents()
  const { data: productionOrders = [] } = useProductionOrders()
  const { data: projectsRuntime } = useQuery({ queryKey: ['projects-runtime'], queryFn: getProjectsRuntime, refetchInterval: 10000 })
  const { data: supplierSummary } = useSupplierCockpitSummaryQuery()
  const { data: supplierEvaluation } = useSupplierEvaluationCockpitQuery()
  const { data: yardMetrics } = useYardMetricsRuntime()
  const { data: yardMovements = [] } = useYardMovementsRuntime()
  const { data: qc } = useQuery({ queryKey: ['qc-cockpit'], queryFn: getQcCockpit, refetchInterval: 10000 })

  const transactions = normalizeRows(transactionsRaw)
  const materialRecommendations = useMemo(() => buildMaterialRecommendations(inventoryRows, transactions), [inventoryRows, transactions])
  const inventoryForecast = useMemo(() => buildInventoryForecast(data, inventoryRows, transactions), [data, inventoryRows, transactions])
  const componentPipeline = useMemo(() => buildComponentPipeline(components, productionOrders), [components, productionOrders])
  const componentForecast = useMemo(() => buildComponentForecast(componentPipeline, productionOrders), [componentPipeline, productionOrders])
  const productionOverview = useMemo(() => buildProductionOverview(productionOrders), [productionOrders])
  const projectsOverview = useMemo(() => buildProjectsOverview(projectsRuntime), [projectsRuntime])
  const suppliersOverview = useMemo(() => buildSuppliersOverview(supplierSummary, supplierEvaluation), [supplierSummary, supplierEvaluation])
  const yardAnalytics = useMemo(() => buildYardAnalytics(yardMetrics, yardMovements), [yardMetrics, yardMovements])
  const qcTrend = useMemo(() => buildQcTrend(qc), [qc])
  const inventoryKpis = useMemo(() => buildInventoryKpis(inventoryRows), [inventoryRows])
  const executiveAlerts = useMemo(
    () => buildExecutiveAlerts(data, inventoryForecast, componentPipeline, yardAnalytics, qcTrend, materialRecommendations, componentForecast),
    [data, inventoryForecast, componentPipeline, yardAnalytics, qcTrend, materialRecommendations, componentForecast],
  )
  const inventoryTrendData = useMemo(() => inventoryForecast.trendRows?.map((row) => row.stock) ?? [], [inventoryForecast.trendRows])

  return (
    <OperationalShell>
      <main className="min-h-screen bg-[#050b14] p-2.5 text-slate-100 font-sans space-y-1">
        <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-cyan-300/10 bg-slate-950/40 p-1">
          {dashboardTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSearchParams(tab.id === 'kpi' ? {} : { tab: tab.id })}
              className={`h-9 rounded-xl px-3 text-[13px] font-medium transition ${
                activeTab === tab.id
                  ? 'border border-cyan-300/25 bg-cyan-500/15 text-cyan-200 shadow-[0_0_22px_rgba(34,211,238,0.12)]'
                  : 'border border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'trends' && (
          <PredictiveTrendsTab cockpit={executiveCockpit} isLoading={executiveLoading} />
        )}

        {activeTab === 'activities' && (
          <RecentActivitiesTab cockpit={executiveCockpit} isLoading={executiveLoading} />
        )}

        {activeTab === 'notifications' && (
          <ExecutiveNotificationsTab cockpit={executiveCockpit} isLoading={executiveLoading} />
        )}

        {activeTab === 'kpi' && (
          <>
        <ExecutiveControlTower cockpit={executiveCockpit} isLoading={executiveLoading} />
        
        {/* ROW 1: Inventory KPI strip (KPI Chính) */}
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <CockpitKpiCard
            title="Giá trị tồn kho"
            value={isLoading ? '' : formatCurrencyVnd(inventoryKpis.inventoryValue)}
            trendText={inventoryKpis.inventoryValue > 0 ? 'Từ tồn kho hiện tại' : 'Chưa có giá trị'}
            trendData={inventoryTrendData}
            tone="cyan"
            state={isLoading ? 'loading' : (!inventoryKpis.inventoryValue ? 'empty' : 'normal')}
          />
          <CockpitKpiCard
            title="Khối lượng tồn"
            value={isLoading ? '' : `${fmt(inventoryKpis.totalStock, 1)} tấn`}
            trendText="Theo inventory_location_stocks / audit"
            tone="blue"
            state={isLoading ? 'loading' : (!inventoryKpis.totalStock ? 'empty' : 'normal')}
          />
          <CockpitKpiCard
            title="Mã vật tư"
            value={isLoading ? '' : fmt(inventoryKpis.materialCodes)}
            trendText="Số mã trong Material Master"
            tone="cyan"
            state={isLoading ? 'loading' : (!inventoryKpis.materialCodes ? 'empty' : 'normal')}
          />
          <CockpitKpiCard
            title="Sắp hết hàng"
            value={isLoading ? '' : fmt(inventoryKpis.lowStock)}
            trendText="Dựa trên tồn tối thiểu"
            tone={inventoryKpis.lowStock ? 'amber' : 'emerald'}
            state={isLoading ? 'loading' : (inventoryKpis.lowStock ? 'alert' : 'normal')}
          />
          <CockpitKpiCard
            title="Hết hàng"
            value={isLoading ? '' : fmt(inventoryKpis.outOfStock)}
            trendText="Tồn kho <= 0"
            tone={inventoryKpis.outOfStock ? 'red' : 'emerald'}
            state={isLoading ? 'loading' : (inventoryKpis.outOfStock ? 'alert' : 'normal')}
          />
        </div>

        {/* ROW 2: Biến động nhập - xuất - tồn & Cảnh báo */}
        <div className="grid grid-cols-12 gap-1">
          <CockpitChartCard 
            title="Biến động nhập - xuất - tồn kho"
            subtitle="Cân đối xuất nhập kho thực tế"
            heightClass="h-[380px]"
            className="col-span-12 xl:col-span-8"
          >
            <MovementGroupedBarChart series={inventoryForecast.trendRows} />
          </CockpitChartCard>

          <CockpitChartCard 
            title={`Cảnh báo (${executiveAlerts.length})`}
            subtitle="Danh sách lỗi vận hành hoạt động"
            heightClass="h-[380px]"
            className="col-span-12 xl:col-span-4"
          >
            <AlertsPanel alerts={executiveAlerts} />
          </CockpitChartCard>
        </div>

        {/* ROW 3: Dự báo tồn, Tiến độ cấu kiện, Sử dụng bãi */}
        <div className="grid grid-cols-12 gap-1">
          <CockpitChartCard 
            title="Dự báo tồn kho"
            subtitle="Ước tính cover kho theo nhu cầu dự kiến"
            heightClass="h-[260px]"
            className="col-span-12 xl:col-span-4"
          >
            <InventoryForecastPanel forecast={inventoryForecast} />
          </CockpitChartCard>

          <CockpitChartCard 
            title="Tiến độ cấu kiện"
            subtitle="Số lượng cấu kiện trong pipeline chuỗi"
            heightClass="h-[260px]"
            className="col-span-12 xl:col-span-4"
          >
            <ComponentPipelinePanel pipeline={componentPipeline} />
          </CockpitChartCard>

          <CockpitChartCard 
            title="Sử dụng bãi"
            subtitle="Lấp đầy slots bãi thành phẩm"
            heightClass="h-[260px]"
            className="col-span-12 xl:col-span-4"
          >
            <YardOccupancyPanel analytics={yardAnalytics} />
          </CockpitChartCard>
        </div>

        {/* ROW 4: Bổ sung vật tư & Xu hướng QC */}
        <div className="grid grid-cols-12 gap-1">
          <CockpitChartCard 
            title="Bổ sung vật tư"
            subtitle="Đề xuất cung ứng dựa trên lượng tồn hiện tại"
            heightClass="h-[260px]"
            className="col-span-12 xl:col-span-7"
          >
            <MaterialReplenishmentPanel recommendations={materialRecommendations} />
          </CockpitChartCard>

          <CockpitChartCard 
            title="Xu hướng QC"
            subtitle="Tỷ lệ pass và lỗi kiểm định QC"
            heightClass="h-[260px]"
            className="col-span-12 xl:col-span-5"
          >
            <QcTrendPanel trend={qcTrend} />
          </CockpitChartCard>
        </div>

        {/* ROW 5: Production, Projects, Suppliers */}
        <div className="grid grid-cols-12 gap-1">
          <CockpitChartCard
            title="Sản xuất"
            subtitle="KPI lệnh sản xuất từ dữ liệu MO"
            heightClass="h-[260px]"
            className="col-span-12 xl:col-span-4"
          >
            <ProductionOverviewPanel overview={productionOverview} />
          </CockpitChartCard>

          <CockpitChartCard
            title="Công trình"
            subtitle="Tiến độ và giá trị theo công trình"
            heightClass="h-[260px]"
            className="col-span-12 xl:col-span-4"
          >
            <ProjectsOverviewPanel overview={projectsOverview} />
          </CockpitChartCard>

          <CockpitChartCard
            title="Nhà cung cấp"
            subtitle="NCC hoạt động và đánh giá thật"
            heightClass="h-[260px]"
            className="col-span-12 xl:col-span-4"
          >
            <SuppliersOverviewPanel overview={suppliersOverview} />
          </CockpitChartCard>
        </div>

        {/* ROW 6: Hoạt động gần đây & Giả định dự báo */}
        <div className="grid grid-cols-12 gap-1">
          <CockpitChartCard 
            title="Hoạt động gần đây"
            subtitle="Nhật ký các giao dịch kho mới nhất"
            heightClass="h-[220px]"
            className="col-span-12 xl:col-span-8"
          >
            <RecentActivityPanel activities={data?.alerts ? buildRecentActivities(transactions) : []} />
          </CockpitChartCard>

          <CockpitChartCard 
            title="Giả định dự báo"
            subtitle="Quy tắc tính toán logic chỉ số"
            heightClass="h-[160px]"
            className="col-span-12 xl:col-span-4"
          >
            <AssumptionsPanel />
          </CockpitChartCard>
        </div>
          </>
        )}
      </main>
    </OperationalShell>
  )
}

// ----------------------------------------------------
// Local Chart & Layout Sub-Components
// ----------------------------------------------------

function ExecutiveControlTower({ cockpit, isLoading }: { cockpit?: DashboardExecutiveCockpit; isLoading: boolean }) {
  const health = cockpit?.health
  const summary = cockpit?.executiveSummary
  const recommendations = cockpit?.recommendations
  const activities = cockpit?.activities.items ?? []
  const notifications = cockpit?.notifications

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-12 gap-1">
        <CockpitChartCard title="Tình trạng vận hành hôm nay" subtitle="Inventory / Production / Yard / QC / Suppliers / Projects" className="col-span-12 xl:col-span-4" heightClass="h-[300px]">
          {isLoading ? (
            <ModuleEmptyState title="Đang tải" description="Hệ thống đang tổng hợp tình trạng vận hành." />
          ) : (
            <HealthScorePanel health={health} />
          )}
        </CockpitChartCard>

        <CockpitChartCard title="7 ngày tới" subtitle="Moving average và trạng thái vận hành" className="col-span-12 xl:col-span-4" heightClass="h-[300px]">
          <ExecutiveSummaryPanel rows={summary?.items ?? []} />
        </CockpitChartCard>

        <CockpitChartCard title="Khuyến nghị hôm nay" subtitle="Rules engine từ cảnh báo vận hành" className="col-span-12 xl:col-span-4" heightClass="h-[300px]">
          <SuggestedActionsPanel rows={recommendations?.items ?? []} />
        </CockpitChartCard>
      </div>

      <div className="grid grid-cols-12 gap-1">
        <CockpitChartCard title="Hoạt động theo module" subtitle="Nhóm hoạt động gần đây" className="col-span-12 xl:col-span-7" heightClass="h-[340px]">
          <ActivityModuleGroups rows={activities} />
        </CockpitChartCard>

        <CockpitChartCard title="Notification Center" subtitle="Critical / Warning / Information" className="col-span-12 xl:col-span-5" heightClass="h-[340px]">
          <NotificationCenterPanel notifications={notifications} />
        </CockpitChartCard>
      </div>
    </div>
  )
}

function HealthScorePanel({ health }: { health?: DashboardExecutiveCockpit['health'] }) {
  if (!health) {
    return <ModuleEmptyState title="Chưa có dữ liệu" description="Dữ liệu sẽ xuất hiện khi phát sinh nghiệp vụ." />
  }

  const scoreTone = health.status === 'critical' ? 'text-red-300' : health.status === 'warning' ? 'text-amber-300' : 'text-emerald-300'
  const scoreBg = health.status === 'critical' ? 'border-red-400/25 bg-red-950/[0.04]' : health.status === 'warning' ? 'border-amber-400/25 bg-amber-950/[0.04]' : 'border-emerald-400/20 bg-emerald-950/[0.03]'

  return (
    <div className="grid h-[224px] grid-cols-[140px_1fr] gap-3">
      <div className={`flex flex-col items-center justify-center rounded-2xl border ${scoreBg}`}>
        <div className={`text-[42px] font-bold leading-none tabular-nums ${scoreTone}`}>{fmt(health.score)}</div>
        <div className="mt-1 text-[13px] text-slate-400">/ 100</div>
        <div className="mt-3 text-center text-[12px] text-slate-500">{health.title}</div>
      </div>
      <div className="space-y-1 overflow-y-auto scrollbar-thin">
        <CockpitStatusList
          items={health.modules.map((module) => ({
            id: module.module,
            label: `${statusIcon(module.status)} ${module.label}: ${module.summary}`,
            value: module.score,
            statusTone: module.status === 'critical' ? 'red' : module.status === 'warning' ? 'amber' : 'emerald',
          }))}
        />
      </div>
    </div>
  )
}

function ExecutiveSummaryPanel({ rows }: { rows: DashboardExecutiveCockpit['executiveSummary']['items'] }) {
  if (!rows.length) {
    return <ModuleEmptyState title="Chưa có dữ liệu" description="Dữ liệu sẽ xuất hiện khi phát sinh nghiệp vụ." />
  }

  return (
    <div className="h-[224px] overflow-y-auto scrollbar-thin">
      <CockpitRecentList
        items={rows.map((row) => ({
          id: row.id,
          title: row.title,
          subtitle: row.description,
          time: row.unit ? `${fmt(row.value, 1)}${row.unit}` : fmt(row.value),
          statusDot: row.priority === 'critical' ? 'bg-red-400' : row.priority === 'warning' ? 'bg-amber-400' : 'bg-cyan-400',
          highlight: row.priority === 'critical',
        }))}
        emptyMessage="Dữ liệu sẽ xuất hiện khi phát sinh nghiệp vụ."
      />
    </div>
  )
}

function SuggestedActionsPanel({ rows }: { rows: DashboardExecutiveCockpit['recommendations']['items'] }) {
  if (!rows.length) {
    return <ModuleEmptyState title="Chưa có khuyến nghị" description="Hệ thống chưa phát hiện hành động cần ưu tiên." />
  }

  return (
    <div className="h-[224px] overflow-y-auto scrollbar-thin">
      <CockpitRecentList
        items={rows.map((row, index) => ({
          id: row.id,
          title: `${index + 1}. ${row.title}`,
          subtitle: `${row.actionType} · ${row.suggestedAction}`,
          time: row.entityCode ?? row.module,
          statusDot: row.priority === 'critical' ? 'bg-red-400' : row.priority === 'warning' ? 'bg-amber-400' : 'bg-cyan-400',
          highlight: row.priority === 'critical',
        }))}
      />
    </div>
  )
}

function ActivityModuleGroups({ rows }: { rows: ExecutiveActivityItem[] }) {
  if (!rows.length) {
    return <ModuleEmptyState title="Chưa có dữ liệu" description="Dữ liệu sẽ xuất hiện khi phát sinh nghiệp vụ." />
  }

  const modules: ExecutiveActivityItem['module'][] = ['Inventory', 'Production', 'Yard', 'QC', 'Projects', 'Purchasing']

  return (
    <div className="grid h-[264px] grid-cols-1 gap-1 overflow-y-auto scrollbar-thin md:grid-cols-2 xl:grid-cols-3">
      {modules.map((module) => {
        const moduleRows = rows.filter((row) => row.module === module).slice(0, 4)
        return (
          <div key={module} className="rounded-xl border border-white/5 bg-slate-950/25 p-2">
            <div className="mb-2 flex items-center justify-between">
              <span className={`rounded-lg border px-2 py-0.5 text-[11px] ${moduleTone(module)}`}>{moduleLabel(module)}</span>
              <span className="text-[11px] text-slate-500">{fmt(rows.filter((row) => row.module === module).length)} dòng</span>
            </div>
            <CockpitRecentList
              items={moduleRows.map((row) => ({
                id: row.id,
                title: row.title,
                subtitle: row.description,
                time: row.relativeTime,
                statusDot: row.severity === 'critical' ? 'bg-red-400' : row.severity === 'warning' ? 'bg-amber-400' : 'bg-cyan-400',
              }))}
              emptyMessage="Chưa có hoạt động."
            />
          </div>
        )
      })}
    </div>
  )
}

function NotificationCenterPanel({ notifications }: { notifications?: DashboardExecutiveCockpit['notifications'] }) {
  const counts = notifications?.counts ?? { critical: 0, warning: 0, information: 0 }
  const topRows = notifications?.items.slice(0, 6) ?? []

  return (
    <div className="grid h-[264px] grid-cols-[160px_1fr] gap-3">
      <CockpitSidebarStats
        stats={[
          { label: 'Critical', value: counts.critical, colorClass: counts.critical ? 'text-red-300' : 'text-slate-400' },
          { label: 'Warning', value: counts.warning, colorClass: counts.warning ? 'text-amber-300' : 'text-slate-400' },
          { label: 'Information', value: counts.information, colorClass: 'text-cyan-300' },
          { label: 'Tổng', value: counts.critical + counts.warning + counts.information, colorClass: 'text-white' },
        ]}
      />
      <div className="overflow-y-auto scrollbar-thin">
        {topRows.length ? (
          <CockpitRecentList
            items={topRows.map((row) => ({
              id: row.id,
              title: row.title,
              subtitle: row.description,
              time: row.priority,
              statusDot: row.priority === 'Critical' ? 'bg-red-400' : row.priority === 'Warning' ? 'bg-amber-400' : 'bg-cyan-400',
              highlight: row.priority === 'Critical',
            }))}
          />
        ) : (
          <ModuleEmptyState title="Chưa có dữ liệu" description="Dữ liệu sẽ xuất hiện khi phát sinh nghiệp vụ." />
        )}
      </div>
    </div>
  )
}

function statusIcon(status: 'normal' | 'warning' | 'critical') {
  if (status === 'critical') return '🔴'
  if (status === 'warning') return '🟡'
  return '🟢'
}

function moduleLabel(module: ExecutiveActivityItem['module']) {
  switch (module) {
    case 'Inventory':
      return 'Kho'
    case 'Production':
      return 'Sản xuất'
    case 'Yard':
      return 'Bãi tập kết'
    case 'QC':
      return 'QC'
    case 'Projects':
      return 'Projects'
    case 'Purchasing':
      return 'Suppliers'
    default:
      return module
  }
}

function PredictiveTrendsTab({ cockpit, isLoading }: { cockpit?: DashboardExecutiveCockpit; isLoading: boolean }) {
  const trends = cockpit?.trends
  const shortageRows = trends?.materialShortageForecast ?? []
  const risks = trends?.productionStopRisks ?? []
  const recommendations = trends?.recommendations ?? []
  const forecast = trends?.inventoryForecast

  if (isLoading) {
    return <div className="grid grid-cols-12 gap-1"><CockpitChartCard title="Đang tải dữ liệu dự báo" className="col-span-12 h-[520px]"><ModuleEmptyState title="Đang tải" description="Hệ thống đang tổng hợp dữ liệu vận hành." /></CockpitChartCard></div>
  }

  return (
    <div className="grid grid-cols-12 gap-1">
      <CockpitChartCard title="Dự báo thiếu vật tư" subtitle="Tồn hiện tại / tiêu thụ 30-90 ngày" className="col-span-12 xl:col-span-8" heightClass="h-[360px]">
        <MaterialShortageForecast rows={shortageRows} />
      </CockpitChartCard>

      <CockpitChartCard title="Nên nhập" subtitle="Khuyến nghị theo moving average" className="col-span-12 xl:col-span-4" heightClass="h-[360px]">
        <RecommendationPanel rows={recommendations} />
      </CockpitChartCard>

      <CockpitChartCard title="Nguy cơ dừng sản xuất" subtitle="BOM + issued + tồn khả dụng" className="col-span-12 xl:col-span-5" heightClass="h-[300px]">
        <ProductionRiskPanel rows={risks} />
      </CockpitChartCard>

      <CockpitChartCard title="Xu hướng tiêu thụ" subtitle="30 ngày gần nhất so với 30 ngày trước" className="col-span-12 xl:col-span-4" heightClass="h-[300px]">
        <ConsumptionTrendPanel trends={trends?.consumptionTrends} />
      </CockpitChartCard>

      <CockpitChartCard title="Dự báo tồn kho" subtitle="7 / 30 / 90 ngày từ rolling average" className="col-span-12 xl:col-span-3" heightClass="h-[300px]">
        <InventoryProjectionPanel forecast={forecast} />
      </CockpitChartCard>
    </div>
  )
}

function MaterialShortageForecast({ rows }: { rows: DashboardExecutiveCockpit['trends']['materialShortageForecast'] }) {
  if (!rows.length) {
    return <ModuleEmptyState title="Chưa có dữ liệu" description="Dữ liệu sẽ xuất hiện khi phát sinh nghiệp vụ." icon={<PackagePlus className="h-8 w-8" />} />
  }

  return (
    <div className="h-[284px] overflow-y-auto scrollbar-thin">
      <table className="w-full table-fixed text-[13px]">
        <thead className="border-b border-cyan-400/10 text-slate-400">
          <tr>
            <th className="px-2 py-2 text-left font-medium">Vật tư</th>
            <th className="px-2 py-2 text-right font-medium">Tồn</th>
            <th className="px-2 py-2 text-right font-medium">TB/ngày</th>
            <th className="px-2 py-2 text-right font-medium">Hết sau</th>
            <th className="px-2 py-2 text-right font-medium">Khuyến nghị</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.slice(0, 10).map((row) => (
            <tr key={row.inventoryItemId} className="hover:bg-cyan-400/[0.04]">
              <td className="px-2 py-2">
                <div className="truncate font-semibold text-white">{row.materialCode}</div>
                <div className="truncate text-[12px] text-slate-500">{row.materialName}</div>
              </td>
              <td className="px-2 py-2 text-right font-mono text-slate-200">{fmt(row.currentStock, 2)} {row.unit}</td>
              <td className="px-2 py-2 text-right font-mono text-cyan-300">{fmt(row.averageDailyUsage, 2)}</td>
              <td className={`px-2 py-2 text-right font-mono ${row.severity === 'critical' ? 'text-red-400' : row.severity === 'warning' ? 'text-amber-400' : 'text-slate-300'}`}>
                {row.daysUntilStockout === null ? '—' : `${fmt(row.daysUntilStockout)} ngày`}
              </td>
              <td className="px-2 py-2 text-right font-mono text-emerald-300">{fmt(row.recommendedReorderQty, 2)} {row.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RecommendationPanel({ rows }: { rows: DashboardExecutiveCockpit['trends']['recommendations'] }) {
  if (!rows.length) {
    return <ModuleEmptyState title="Chưa có dữ liệu" description="Dữ liệu sẽ xuất hiện khi phát sinh nghiệp vụ." icon={<PackagePlus className="h-8 w-8" />} />
  }

  return (
    <div className="h-[284px] space-y-2 overflow-y-auto scrollbar-thin">
      {rows.slice(0, 8).map((row) => (
        <div key={row.materialId} className="rounded-xl border border-cyan-300/10 bg-slate-950/40 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold text-white">{row.materialCode}</div>
              <div className="truncate text-[12px] text-slate-500">{row.materialName}</div>
            </div>
            <span className={`rounded-lg border px-2 py-0.5 text-[11px] ${row.priority === 'critical' ? 'border-red-400/30 text-red-300' : row.priority === 'warning' ? 'border-amber-400/30 text-amber-300' : 'border-cyan-400/30 text-cyan-300'}`}>
              {fmt(row.recommendedQty, 2)} {row.unit}
            </span>
          </div>
          <div className="mt-2 text-[12px] text-slate-400">{row.reason}</div>
        </div>
      ))}
    </div>
  )
}

function ProductionRiskPanel({ rows }: { rows: DashboardExecutiveCockpit['trends']['productionStopRisks'] }) {
  if (!rows.length) {
    return <ModuleEmptyState title="Chưa có dữ liệu" description="Dữ liệu sẽ xuất hiện khi phát sinh nghiệp vụ." icon={<Factory className="h-8 w-8" />} />
  }

  return (
    <div className="h-[224px] space-y-2 overflow-y-auto scrollbar-thin">
      {rows.slice(0, 6).map((row) => (
        <div key={row.productionOrderId} className="rounded-xl border border-red-400/15 bg-red-950/[0.04] p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold text-white">{row.productionOrderNo}</div>
              <div className="truncate text-[12px] text-slate-500">{row.componentCode ?? row.title}</div>
            </div>
            <span className="rounded-lg border border-red-400/30 px-2 py-0.5 text-[11px] text-red-300">{row.missingMaterials.length} thiếu</span>
          </div>
          <div className="mt-2 space-y-1">
            {row.missingMaterials.slice(0, 3).map((material) => (
              <div key={material.materialId} className="flex justify-between gap-2 text-[12px] text-slate-300">
                <span className="truncate">{material.materialCode} · {material.materialName}</span>
                <span className="shrink-0 font-mono text-red-300">{fmt(material.shortageQty, 2)} {material.unit}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ConsumptionTrendPanel({ trends }: { trends?: DashboardExecutiveCockpit['trends']['consumptionTrends'] }) {
  const increasing = trends?.increasing ?? []
  const decreasing = trends?.decreasing ?? []
  const abnormal = trends?.abnormal ?? []

  if (!increasing.length && !decreasing.length && !abnormal.length) {
    return <ModuleEmptyState title="Chưa có dữ liệu" description="Dữ liệu sẽ xuất hiện khi phát sinh nghiệp vụ." icon={<TrendingUp className="h-8 w-8" />} />
  }

  return (
    <div className="grid h-[224px] grid-cols-3 gap-2">
      <TrendMiniList title="Tăng sử dụng" rows={increasing} tone="up" />
      <TrendMiniList title="Giảm sử dụng" rows={decreasing} tone="down" />
      <TrendMiniList title="Bất thường" rows={abnormal} tone="alert" />
    </div>
  )
}

function TrendMiniList({ title, rows, tone }: { title: string; rows: DashboardExecutiveCockpit['trends']['consumptionTrends']['increasing']; tone: 'up' | 'down' | 'alert' }) {
  const toneClass = tone === 'up' ? 'text-emerald-300' : tone === 'down' ? 'text-sky-300' : 'text-amber-300'
  return (
    <div className="rounded-xl border border-white/5 bg-slate-950/30 p-2">
      <div className={`mb-2 flex items-center gap-1 text-[12px] font-semibold ${toneClass}`}>
        {tone === 'down' ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
        {title}
      </div>
      <div className="space-y-1.5">
        {rows.slice(0, 4).map((row) => (
          <div key={row.materialId} className="min-w-0">
            <div className="truncate text-[12px] text-white">{row.materialCode}</div>
            <div className="text-[11px] text-slate-500">{fmt(row.changePercent, 1)}%</div>
          </div>
        ))}
        {!rows.length && <div className="text-[12px] text-slate-600">Không có</div>}
      </div>
    </div>
  )
}

function InventoryProjectionPanel({ forecast }: { forecast?: DashboardExecutiveCockpit['trends']['inventoryForecast'] }) {
  if (!forecast?.currentStock) {
    return <ModuleEmptyState title="Chưa có dữ liệu" description="Dữ liệu sẽ xuất hiện khi phát sinh nghiệp vụ." icon={<Warehouse className="h-8 w-8" />} />
  }

  const rows = [
    { label: '7 ngày', value: forecast.horizon7d.at(-1)?.projectedStock ?? forecast.currentStock },
    { label: '30 ngày', value: forecast.horizon30d.at(-1)?.projectedStock ?? forecast.currentStock },
    { label: '90 ngày', value: forecast.horizon90d.at(-1)?.projectedStock ?? forecast.currentStock },
  ]

  return (
    <div className="h-[224px] space-y-3">
      <div className="rounded-xl border border-white/5 bg-slate-950/30 p-3">
        <div className="text-[12px] text-slate-500">Xu hướng</div>
        <div className={`mt-1 text-lg font-bold ${forecast.trend === 'DOWN_STRONG' ? 'text-red-300' : forecast.trend === 'UP' ? 'text-emerald-300' : 'text-cyan-300'}`}>
          {forecast.trend === 'DOWN_STRONG' ? 'Giảm mạnh' : forecast.trend === 'UP' ? 'Tăng' : 'Ổn định'}
        </div>
      </div>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-950/20 px-3 py-2 text-[13px]">
            <span className="text-slate-400">{row.label}</span>
            <span className="font-mono font-semibold text-white">{fmt(row.value, 1)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecentActivitiesTab({ cockpit, isLoading }: { cockpit?: DashboardExecutiveCockpit; isLoading: boolean }) {
  const filters = cockpit?.activities.filters ?? []
  const [activeFilter, setActiveFilter] = useState<ExecutiveActivityItem['module'] | 'ALL'>('ALL')
  const rows = cockpit?.activities.items ?? []
  const filtered = activeFilter === 'ALL' ? rows : rows.filter((row) => row.module === activeFilter)

  return (
    <div className="grid grid-cols-12 gap-1">
      <CockpitChartCard
        title="Hoạt động theo module"
        subtitle="Kho / Sản xuất / Bãi / QC / Projects / Suppliers"
        className="col-span-12 xl:col-span-5"
        heightClass="h-[620px]"
        action={
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => setActiveFilter('ALL')} className={activityFilterClass(activeFilter === 'ALL')}>Tất cả</button>
            {filters.map((filter) => (
              <button key={filter} type="button" onClick={() => setActiveFilter(filter)} className={activityFilterClass(activeFilter === filter)}>{filter}</button>
            ))}
          </div>
        }
      >
        {isLoading ? (
          <ModuleEmptyState title="Đang tải" description="Hệ thống đang tổng hợp hoạt động gần đây." icon={<Activity className="h-8 w-8" />} />
        ) : (
          <ActivityModuleGroups rows={filtered} />
        )}
      </CockpitChartCard>

      <CockpitChartCard
        title="Timeline hợp nhất toàn hệ thống"
        subtitle="Dòng thời gian điều hành"
        className="col-span-12 xl:col-span-7"
        heightClass="h-[620px]"
      >
        {isLoading ? (
          <ModuleEmptyState title="Đang tải" description="Hệ thống đang tổng hợp hoạt động gần đây." icon={<Activity className="h-8 w-8" />} />
        ) : (
          <ActivityTimeline rows={filtered} />
        )}
      </CockpitChartCard>
    </div>
  )
}

function ActivityTimeline({ rows }: { rows: ExecutiveActivityItem[] }) {
  if (!rows.length) {
    return <ModuleEmptyState title="Chưa có dữ liệu" description="Dữ liệu sẽ xuất hiện khi phát sinh nghiệp vụ." icon={<Activity className="h-8 w-8" />} />
  }

  return (
    <div className="h-[544px] overflow-y-auto pr-1 scrollbar-thin">
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="grid grid-cols-[90px_1fr] gap-3 rounded-xl border border-cyan-300/10 bg-slate-950/30 p-3">
            <div className="text-right">
              <div className="text-[12px] font-semibold text-cyan-300">{row.relativeTime}</div>
              <div className="mt-1 text-[11px] text-slate-600">{new Date(row.occurredAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <div className="min-w-0 border-l border-cyan-400/10 pl-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-lg border px-2 py-0.5 text-[11px] ${moduleTone(row.module)}`}>{row.module}</span>
                <span className="text-[13px] font-semibold text-white">{row.title}</span>
                {row.entityCode && <span className="text-[12px] text-slate-500">{row.entityCode}</span>}
              </div>
              <div className="mt-1 text-[13px] text-slate-300">{row.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ExecutiveNotificationsTab({ cockpit, isLoading }: { cockpit?: DashboardExecutiveCockpit; isLoading: boolean }) {
  const notifications = cockpit?.notifications
  const rows = notifications?.items ?? []

  if (isLoading) {
    return <CockpitChartCard title="Thông báo hệ thống" heightClass="h-[520px]"><ModuleEmptyState title="Đang tải" description="Hệ thống đang tổng hợp thông báo." icon={<Bell className="h-8 w-8" />} /></CockpitChartCard>
  }

  return (
    <div className="grid grid-cols-12 gap-1">
      <CockpitKpiCard className="col-span-12 md:col-span-4" title="Critical" value={fmt(notifications?.counts.critical ?? 0)} trendText="Cần xử lý ngay" tone={(notifications?.counts.critical ?? 0) ? 'red' : 'emerald'} state={(notifications?.counts.critical ?? 0) ? 'alert' : 'normal'} />
      <CockpitKpiCard className="col-span-12 md:col-span-4" title="Warning" value={fmt(notifications?.counts.warning ?? 0)} trendText="Cần theo dõi" tone={(notifications?.counts.warning ?? 0) ? 'amber' : 'emerald'} state={(notifications?.counts.warning ?? 0) ? 'alert' : 'normal'} />
      <CockpitKpiCard className="col-span-12 md:col-span-4" title="Information" value={fmt(notifications?.counts.information ?? 0)} trendText="Thông tin vận hành" tone="cyan" state={(notifications?.counts.information ?? 0) ? 'normal' : 'empty'} />
      <div className="col-span-12 grid grid-cols-12 gap-1">
        <NotificationColumn title="Critical" rows={rows.filter((row) => row.priority === 'Critical')} className="col-span-12 xl:col-span-4" />
        <NotificationColumn title="Warning" rows={rows.filter((row) => row.priority === 'Warning')} className="col-span-12 xl:col-span-4" />
        <NotificationColumn title="Information" rows={rows.filter((row) => row.priority === 'Information')} className="col-span-12 xl:col-span-4" />
      </div>
    </div>
  )
}

function NotificationColumn({ title, rows, className }: { title: string; rows: DashboardExecutiveCockpit['notifications']['items']; className?: string }) {
  return (
    <CockpitChartCard title={title} subtitle={`${fmt(rows.length)} thông báo`} className={className} heightClass="h-[520px]">
      {!rows.length ? (
        <ModuleEmptyState title="Chưa có dữ liệu" description="Dữ liệu sẽ xuất hiện khi phát sinh nghiệp vụ." icon={<Bell className="h-8 w-8" />} />
      ) : (
        <div className="h-[444px] space-y-2 overflow-y-auto scrollbar-thin">
          {rows.map((row) => (
            <div key={row.id} className={`rounded-xl border p-3 ${row.priority === 'Critical' ? 'border-red-400/20 bg-red-950/[0.04]' : row.priority === 'Warning' ? 'border-amber-400/20 bg-amber-950/[0.04]' : 'border-cyan-400/15 bg-cyan-950/[0.03]'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-white">{row.title}</div>
                  <div className="mt-0.5 text-[12px] text-slate-500">{row.module}{row.entityCode ? ` · ${row.entityCode}` : ''}</div>
                </div>
                {row.actionLabel && <span className="shrink-0 rounded-lg border border-white/10 px-2 py-0.5 text-[11px] text-slate-300">{row.actionLabel}</span>}
              </div>
              <div className="mt-2 text-[13px] text-slate-300">{row.description}</div>
            </div>
          ))}
        </div>
      )}
    </CockpitChartCard>
  )
}

function activityFilterClass(active: boolean) {
  return `h-7 rounded-lg border px-2 text-[11px] transition ${
    active
      ? 'border-cyan-300/30 bg-cyan-500/15 text-cyan-200'
      : 'border-white/10 text-slate-400 hover:bg-white/[0.04] hover:text-white'
  }`
}

function moduleTone(module: ExecutiveActivityItem['module']) {
  switch (module) {
    case 'Inventory':
      return 'border-emerald-400/25 text-emerald-300'
    case 'Production':
      return 'border-blue-400/25 text-blue-300'
    case 'Yard':
      return 'border-cyan-400/25 text-cyan-300'
    case 'QC':
      return 'border-violet-400/25 text-violet-300'
    case 'Purchasing':
      return 'border-amber-400/25 text-amber-300'
    case 'Projects':
      return 'border-sky-400/25 text-sky-300'
    default:
      return 'border-white/10 text-slate-300'
  }
}

function MovementGroupedBarChart({ series }: { series: InventoryMovementPoint[] }) {
  const maxValue = Math.max(1, ...series.flatMap((row) => [row.inbound, row.outbound, row.stock]))
  const avgInbound = series.reduce((sum, row) => sum + row.inbound, 0) / Math.max(1, series.length)
  const avgOutbound = series.reduce((sum, row) => sum + row.outbound, 0) / Math.max(1, series.length)
  const latestStock = series.at(-1)?.stock ?? 0
  return (
    <div className="relative h-[290px] w-full flex flex-col justify-between pt-1">
      {/* Legend on top */}
      <div className="flex items-center gap-4 text-[10px] text-slate-400 mb-2 justify-end px-2">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> Nhập</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-red-500" /> Xuất</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-cyan-400" /> Tồn kho</span>
      </div>

      {/* SVG Grouped Bar Chart */}
      <div className="flex-1 min-h-[170px] w-full relative">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
          <line x1="0" y1="20" x2="100" y2="20" className="stroke-white/5" strokeWidth="0.5" />
          <line x1="0" y1="50" x2="100" y2="50" className="stroke-white/5" strokeWidth="0.5" />
          <line x1="0" y1="80" x2="100" y2="80" className="stroke-white/5" strokeWidth="0.5" />
          
          {series.map((s, idx) => {
            const xOffset = 6 + idx * 19
            const inboundHeight = s.inbound > 0 ? Math.max(5, (s.inbound / maxValue) * 80) : 0
            const outboundHeight = s.outbound > 0 ? Math.max(5, (s.outbound / maxValue) * 80) : 0
            const stockHeight = s.stock > 0 ? Math.max(5, (s.stock / maxValue) * 80) : 0

            return (
              <g key={idx}>
                {/* Inbound bar */}
                <rect x={xOffset} y={90 - inboundHeight} width="3.2" height={inboundHeight} className="fill-emerald-500/80" rx="0.5" />
                {/* Outbound bar */}
                <rect x={xOffset + 4} y={90 - outboundHeight} width="3.2" height={outboundHeight} className="fill-red-500/80" rx="0.5" />
                {/* Stock bar */}
                <rect x={xOffset + 8} y={90 - stockHeight} width="3.2" height={stockHeight} className="fill-cyan-400/80" rx="0.5" />
              </g>
            )
          })}
        </svg>
      </div>

      {/* X Axis Labels */}
      <div className="grid grid-cols-5 gap-2 text-[9px] text-slate-500 mt-2 font-mono">
        {series.map((s) => <span key={s.label} className="text-center">{s.label}</span>)}
      </div>

      {/* Summary Metrics below chart */}
      <div className="grid grid-cols-3 gap-2 text-center border-t border-white/5 pt-2 mt-2">
        <div>
          <span className="text-[9px] text-slate-500 block uppercase">Trung bình nhập</span>
          <span className="text-xs font-semibold text-white font-mono">{fmt(avgInbound, 1)} t</span>
        </div>
        <div>
          <span className="text-[9px] text-slate-500 block uppercase">Trung bình xuất</span>
          <span className="text-xs font-semibold text-white font-mono">{fmt(avgOutbound, 1)} t</span>
        </div>
        <div>
          <span className="text-[9px] text-slate-500 block uppercase">Tồn hiện tại</span>
          <span className="text-xs font-semibold text-cyan-300 font-mono">{fmt(latestStock, 1)} t</span>
        </div>
      </div>
    </div>
  )
}

function AlertsPanel({ alerts }: { alerts: ExecutiveAlert[] }) {
  const top4 = alerts.slice(0, 4)
  return (
    <div className="space-y-2 py-1 h-[290px] overflow-y-auto scrollbar-thin">
      {top4.map((a) => (
        <div 
          key={a.code} 
          className={`rounded-lg border px-3 py-2 flex items-start gap-2.5 text-xs transition duration-155 ${
            a.tone === 'red' 
              ? 'border-red-500/10 bg-red-950/[0.02] text-red-250' 
              : 'border-amber-500/10 bg-amber-950/[0.02] text-amber-250'
          }`}
        >
          <span className={`text-[12px] shrink-0 mt-0.5 ${a.tone === 'red' ? 'text-red-400' : 'text-amber-400'}`}>⚠</span>
          <div className="min-w-0 flex-1">
            <div className="font-semibold flex items-center justify-between text-white">
              <span className="truncate">{a.title}</span>
              <span className="text-[9px] text-slate-400 font-mono shrink-0 ml-2">{a.value}</span>
            </div>
            <div className="text-[10px] text-slate-405 mt-0.5 truncate">{a.description}</div>
          </div>
        </div>
      ))}
      {!top4.length && <ModuleEmptyState title="Không có cảnh báo" description="Vận hành hiện tại an toàn." />}
    </div>
  )
}

function ProductionOverviewPanel({ overview }: { overview: ProductionOverview }) {
  if (!overview.totalOrders) {
    return <div className="flex h-[180px] items-center justify-center"><ModuleEmptyState title="Chưa có dữ liệu sản xuất" description="Dữ liệu sẽ xuất hiện khi phát sinh lệnh sản xuất." /></div>
  }

  const rows = [
    { label: 'Đang chạy', value: overview.running, tone: 'text-cyan-300' },
    { label: 'Hoàn thành hôm nay', value: overview.completedToday, tone: 'text-emerald-400' },
    { label: 'Chậm tiến độ', value: overview.delayed, tone: overview.delayed ? 'text-red-400' : 'text-slate-300' },
    { label: 'Chờ vật tư', value: overview.waitingMaterial, tone: overview.waitingMaterial ? 'text-amber-400' : 'text-slate-300' },
  ]

  return (
    <div className="space-y-2 py-1 h-[180px] flex flex-col justify-between">
      <div className="grid grid-cols-2 gap-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl border border-white/5 bg-slate-950/20 p-2">
            <div className={`text-lg font-bold font-mono ${row.tone}`}>{fmt(row.value)}</div>
            <div className="mt-0.5 text-[12px] text-slate-500">{row.label}</div>
          </div>
        ))}
      </div>
      <div className="border-t border-white/5 pt-2">
        <div className="flex justify-between text-[13px] text-slate-400">
          <span>Hiệu suất hoàn thành</span>
          <span className="font-bold text-white font-mono">{fmt(overview.efficiency, 1)}%</span>
        </div>
        <Meter value={overview.efficiency} />
      </div>
    </div>
  )
}

function ProjectsOverviewPanel({ overview }: { overview: ProjectsOverview }) {
  if (!overview.totalProjects && !overview.contractValue) {
    return <div className="flex h-[180px] items-center justify-center"><ModuleEmptyState title="Chưa có dữ liệu công trình" description="Dữ liệu sẽ xuất hiện khi phát sinh công trình, cấu kiện hoặc vật tư." /></div>
  }

  return (
    <div className="space-y-2 py-1 h-[180px] flex flex-col justify-between">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/5 bg-slate-950/20 p-2">
          <div className="text-lg font-bold text-cyan-300 font-mono">{fmt(overview.activeProjects)}</div>
          <div className="mt-0.5 text-[12px] text-slate-500">Đang triển khai</div>
        </div>
        <div className="rounded-xl border border-white/5 bg-slate-950/20 p-2">
          <div className={`text-lg font-bold font-mono ${overview.delayedProjects ? 'text-red-400' : 'text-slate-300'}`}>{fmt(overview.delayedProjects)}</div>
          <div className="mt-0.5 text-[12px] text-slate-500">Trễ tiến độ</div>
        </div>
      </div>
      <div className="space-y-1.5 text-[13px]">
        <div className="flex justify-between text-slate-400"><span>Giá trị hợp đồng</span><span className="font-mono font-semibold text-white">{formatCurrencyVnd(overview.contractValue)}</span></div>
        <div className="flex justify-between text-slate-400"><span>Cấu kiện sản xuất</span><span className="font-mono font-semibold text-cyan-300">{fmt(overview.componentsInProduction)}</span></div>
        <div className="flex justify-between text-slate-400"><span>Vật tư sử dụng</span><span className="font-mono font-semibold text-emerald-400">{formatCurrencyVnd(overview.materialValue)}</span></div>
      </div>
    </div>
  )
}

function SuppliersOverviewPanel({ overview }: { overview: SuppliersOverview }) {
  if (!overview.totalSuppliers) {
    return <div className="flex h-[180px] items-center justify-center"><ModuleEmptyState title="Chưa có dữ liệu nhà cung cấp" description="Dữ liệu sẽ xuất hiện khi có NCC, nhập kho hoặc đánh giá." /></div>
  }

  return (
    <div className="space-y-2 py-1 h-[180px] flex flex-col justify-between">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/5 bg-slate-950/20 p-2">
          <div className="text-lg font-bold text-cyan-300 font-mono">{fmt(overview.activeSuppliers)}</div>
          <div className="mt-0.5 text-[12px] text-slate-500">NCC hoạt động</div>
        </div>
        <div className="rounded-xl border border-white/5 bg-slate-950/20 p-2">
          <div className="text-lg font-bold text-emerald-400 font-mono">{fmt(overview.averageRating, 1)}</div>
          <div className="mt-0.5 text-[12px] text-slate-500">Điểm đánh giá</div>
        </div>
      </div>
      <div className="space-y-1.5 text-[13px]">
        <div className="flex justify-between text-slate-400"><span>NCC có giao dịch kho</span><span className="font-mono font-semibold text-white">{fmt(overview.usedInInventory)}</span></div>
        <div className="flex justify-between text-slate-400"><span>NCC đã đánh giá</span><span className="font-mono font-semibold text-white">{fmt(overview.evaluated)}</span></div>
        <div className="flex justify-between text-slate-400"><span>Cảnh báo đánh giá</span><span className={`font-mono font-semibold ${overview.warning ? 'text-amber-400' : 'text-slate-300'}`}>{fmt(overview.warning)}</span></div>
      </div>
    </div>
  )
}

function InventoryForecastPanel({ forecast }: { forecast: InventoryForecast }) {
  if (!forecast.currentStock) {
    return (
      <div className="flex h-[180px] flex-col justify-center items-center py-4">
        <AlertTriangle className="h-8 w-8 text-amber-500 mb-1.5" />
        <div className="text-[13px] font-bold text-white">Chưa có dữ liệu dự báo</div>
        <div className="text-[12px] text-slate-500 text-center px-4 mt-0.5">Không phát hiện số dư tồn kho để dự báo.</div>
      </div>
    )
  }
  return (
    <div className="space-y-2 py-1 h-[180px] flex flex-col justify-between">
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl border border-white/5 bg-slate-950/20 p-2">
          <div className="text-[13px] font-bold text-white font-mono">{fmt(forecast.daysOfCover, 0)} ngày</div>
          <div className="text-[12px] text-slate-500 mt-0.5">Days of cover</div>
        </div>
        <div className="rounded-xl border border-white/5 bg-slate-950/20 p-2">
          <div className="text-[13px] font-bold text-emerald-400 font-mono">{forecast.netDailyMovement > 0 ? '+' : ''}{fmt(forecast.netDailyMovement, 1)}t</div>
          <div className="text-[12px] text-slate-500 mt-0.5">Net/ngày</div>
        </div>
      </div>
      
      <div className="rounded-xl border border-white/5 bg-slate-950/20 px-2 py-1 flex items-center justify-between">
        <span className="text-[13px] text-slate-400">Xu hướng tồn kho:</span>
        <div className="w-24 h-5">
          <Sparkline rows={forecast.trendRows} heightClass="h-5" />
        </div>
      </div>

      <div className="flex items-center justify-between text-[13px] text-slate-500 border-t border-white/5 pt-1.5">
        <span>Dự kiến tồn kho:</span>
        <span className="font-semibold text-white font-mono">{fmt(forecast.projectedStock, 1)}t</span>
      </div>
    </div>
  )
}

function ComponentPipelinePanel({ pipeline }: { pipeline: ComponentPipeline }) {
  const rows = [
    { label: 'STOCK', value: pipeline.stock, color: '#f59e0b' },
    { label: 'READY', value: pipeline.ready, color: '#22c55e' },
    { label: 'SHIPPED', value: pipeline.shipped, color: '#38bdf8' },
    { label: 'DELIVERED', value: pipeline.delivered, color: '#8b5cf6' },
    { label: 'INSTALLED', value: pipeline.installed, color: '#1d7cff' },
  ]
  if (!pipeline.total) {
    return (
      <div className="flex h-[180px] flex-col justify-center items-center py-4">
        <Boxes className="h-8 w-8 text-amber-500 mb-1.5" />
        <div className="text-[13px] font-bold text-white">Chưa có tiến độ cấu kiện</div>
        <div className="text-[12px] text-slate-500 text-center px-4 mt-0.5">Không phát hiện cấu kiện đang lưu hành.</div>
      </div>
    )
  }
  return (
    <div className="space-y-2 py-1 h-[180px] flex flex-col justify-between">
      <div className="grid grid-cols-[80px_1fr] items-center gap-3">
        <Donut rows={rows} center={fmt(pipeline.total)} label="kiện" />
        <div className="space-y-0.5 text-[13px] text-slate-400">
          {rows.slice(0, 4).map((r) => (
            <div key={r.label} className="flex justify-between items-center text-[13px]">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: r.color }} />
                <span>{r.label}</span>
              </span>
              <span className="font-semibold text-white font-mono">{fmt(r.value)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[13px] border-t border-white/5 pt-1.5">
        <div className="flex justify-between text-slate-500">
          <span>Open MO:</span>
          <span className="font-semibold text-white font-mono">{fmt(pipeline.openProduction)}</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>Completion:</span>
          <span className="font-semibold text-emerald-400 font-mono">{fmt(pipeline.completionRate, 1)}%</span>
        </div>
      </div>
    </div>
  )
}

function YardOccupancyPanel({ analytics }: { analytics: YardAnalytics }) {
  if (!analytics.totalSlots) {
    return (
      <div className="flex h-[180px] flex-col justify-center items-center py-4">
        <Warehouse className="h-8 w-8 text-amber-500 mb-1.5" />
        <div className="text-[13px] font-bold text-white">Chưa có dữ liệu bãi</div>
        <div className="text-[12px] text-slate-500 text-center px-4 mt-0.5">Không phát hiện slots bãi được cấu hình.</div>
      </div>
    )
  }
  return (
    <div className="space-y-2 py-1 h-[180px] flex flex-col justify-between">
      <div>
        <div className="flex justify-between text-[13px] text-slate-400 mb-1">
          <span>Tỷ lệ lấp đầy bãi</span>
          <span className="font-bold text-white font-mono">{fmt(analytics.occupancyRate, 1)}%</span>
        </div>
        <Meter value={analytics.occupancyRate} />
        <div className="text-[12px] text-slate-550 mt-1 flex justify-between">
          <span>{fmt(analytics.occupiedSlots)}/{fmt(analytics.totalSlots)} slot</span>
          <span className={analytics.occupancyRate >= 85 ? 'text-red-400' : 'text-emerald-450'}>
            {analytics.occupancyRate >= 85 ? 'Áp lực cao' : 'Bình thường'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 text-center">
        <div className="rounded-lg border border-white/5 bg-slate-950/20 p-1">
          <div className="text-[13px] font-bold text-white font-mono">+{fmt(analytics.inbound)}</div>
          <div className="text-[12px] text-slate-505">Nhập</div>
        </div>
        <div className="rounded-lg border border-white/5 bg-slate-950/20 p-1">
          <div className="text-[13px] font-bold text-white font-mono">-{fmt(analytics.outbound)}</div>
          <div className="text-[12px] text-slate-505">Xuất</div>
        </div>
        <div className="rounded-lg border border-white/5 bg-slate-950/20 p-1">
          <div className="text-[13px] font-bold text-white font-mono">{fmt(analytics.moves)}</div>
          <div className="text-[12px] text-slate-505">Moves</div>
        </div>
      </div>
    </div>
  )
}

function MaterialReplenishmentPanel({ recommendations }: { recommendations: MaterialRecommendation[] }) {
  const urgent = recommendations.filter((row) => row.recommendedQty > 0)
  const bars = urgent.slice(0, 5).map((row) => ({ label: row.code, value: row.recommendedQty }))
  const top5 = recommendations.slice(0, 5)

  if (!recommendations.length) {
    return (
      <div className="flex h-[180px] flex-col justify-center items-center py-4">
        <PackagePlus className="h-8 w-8 text-amber-500 mb-1.5" />
        <div className="text-[13px] font-bold text-white">Chưa có đề xuất nhập</div>
        <div className="text-[12px] text-slate-500 text-center px-4 mt-0.5">Các mã vật tư đều ở ngưỡng tồn kho an toàn.</div>
      </div>
    )
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_1.3fr] py-1 h-[180px]">
      <div className="rounded-xl border border-white/5 bg-slate-950/20 p-3 flex flex-col justify-between">
        <span className="text-[13px] font-bold text-slate-550 uppercase tracking-wider mb-2">Top đề xuất nhập</span>
        <div className="flex-1 flex flex-col justify-center">
          {bars.length ? <HorizontalBars rows={bars} max={Math.max(1, ...bars.map((row) => row.value))} /> : (
            <ModuleEmptyState title="Tồn an toàn" description="Không có đề xuất nhập gấp." />
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/5 bg-slate-950/20 flex flex-col justify-between">
        <div className="grid grid-cols-[1.2fr_.8fr_.8fr] gap-2 border-b border-white/10 px-3 py-1 text-[13px] uppercase tracking-wide text-slate-500 font-semibold bg-white/[0.01]">
          <span>Vật tư</span>
          <span className="text-right">Tồn</span>
          <span className="text-right">Yêu cầu</span>
        </div>
        <div className="divide-y divide-white/5 flex-1 flex flex-col justify-around">
          {top5.map((row) => (
            <div key={row.key} className="grid grid-cols-[1.2fr_.8fr_.8fr] items-center gap-2 px-3 py-0.5 text-[13px]">
              <div className="min-w-0 truncate">
                <span className="font-semibold text-slate-200 block truncate leading-tight">{row.code}</span>
                <span className="text-[12px] text-slate-500 block truncate leading-tight mt-0.5">{row.name}</span>
              </div>
              <span className="text-right text-slate-400 font-mono">{fmt(row.currentStock, 1)} {row.unit}</span>
              <span className={`text-right font-semibold font-mono ${row.recommendedQty > 0 ? 'text-amber-400' : 'text-slate-650'}`}>
                {row.recommendedQty > 0 ? fmt(row.recommendedQty, 1) : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function QcTrendPanel({ trend }: { trend: QcTrend }) {
  const maxVal = Math.max(1, trend.passed, trend.rework, trend.failed)
  const passY = 90 - (trend.passed / maxVal) * 70
  const reworkY = 90 - (trend.rework / maxVal) * 70
  const failY = 90 - (trend.failed / maxVal) * 70

  if (!trend.passed && !trend.rework && !trend.failed) {
    return (
      <div className="flex h-[180px] flex-col justify-center items-center py-4">
        <ShieldCheck className="h-8 w-8 text-amber-500 mb-1.5" />
        <div className="text-[13px] font-bold text-white">Chưa có dữ liệu QC</div>
        <div className="text-[12px] text-slate-500 text-center px-4 mt-0.5">Không phát hiện lượt kiểm định chất lượng.</div>
      </div>
    )
  }

  return (
    <div className="space-y-1 py-1 h-[180px] flex flex-col justify-between">
      <div className="flex items-center gap-3 text-[12px] text-slate-400 justify-end px-2">
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-450" /> Đạt</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Sửa</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Lỗi</span>
      </div>

      <div className="h-[110px] w-full relative">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
          <line x1="0" y1="20" x2="100" y2="20" className="stroke-white/5" strokeWidth="0.5" />
          <line x1="0" y1="50" x2="100" y2="50" className="stroke-white/5" strokeWidth="0.5" />
          <line x1="0" y1="80" x2="100" y2="80" className="stroke-white/5" strokeWidth="0.5" />

          <path d={`M 10,80 L 35,${passY} L 60,${passY - 8} L 90,${passY}`} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
          <path d={`M 10,90 L 35,80 L 60,${reworkY} L 90,85`} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round" />
          <path d={`M 10,95 L 35,90 L 60,92 L 90,${failY}`} fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center border-t border-white/5 pt-1.5 mt-1">
        <div className="flex justify-between items-center text-[13px] text-slate-500 px-1">
          <span>QC đạt:</span>
          <span className="font-semibold text-emerald-400 font-mono">{fmt(trend.passRate, 1)}%</span>
        </div>
        <div className="flex justify-between items-center text-[13px] text-slate-500 px-1">
          <span>NCR mở:</span>
          <span className="font-semibold text-red-400 font-mono">{fmt(trend.openNcrs)}</span>
        </div>
      </div>
    </div>
  )
}

function RecentActivityPanel({ activities }: { activities: any[] }) {
  if (!activities.length) {
    return (
      <div className="flex h-[140px] flex-col justify-center items-center py-4">
        <Clock className="h-8 w-8 text-slate-600 mb-1.5" />
        <div className="text-[13px] font-bold text-white">Chưa có hoạt động</div>
        <div className="text-[12px] text-slate-500 text-center px-4 mt-0.5">Không phát hiện giao dịch gần đây.</div>
      </div>
    )
  }
  return (
    <div className="py-1 px-3 h-[140px] overflow-y-auto scrollbar-thin space-y-1.5">
      {activities.slice(0, 5).map((act) => {
        let dotColor = 'text-cyan-400'
        let actionLabel = 'Điều chuyển'
        if (act.module === 'production') {
          dotColor = 'text-blue-450'
          actionLabel = 'Sản xuất'
        } else if (act.module === 'qc') {
          dotColor = 'text-emerald-450'
          actionLabel = 'QC'
        } else if (act.description.toLowerCase().includes('inbound') || act.description.toLowerCase().includes('nhập')) {
          dotColor = 'text-emerald-500'
          actionLabel = 'Nhập kho'
        } else if (act.description.toLowerCase().includes('outbound') || act.description.toLowerCase().includes('xuất')) {
          dotColor = 'text-red-400'
          actionLabel = 'Xuất kho'
        }

        return (
          <div key={act.id} className="flex items-start justify-between gap-3 text-[13px] border-b border-white/5 pb-1 last:border-0 last:pb-0">
            <div className="flex items-start gap-2 min-w-0">
              <span className={`text-[12px] mt-0.5 shrink-0 ${dotColor}`}>🟢</span>
              <div className="min-w-0">
                <span className="font-semibold text-slate-200 block leading-tight">{actionLabel}</span>
                <span className="text-[12px] text-slate-405 block leading-tight mt-0.5 line-clamp-2">{act.description}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-slate-350 block font-medium leading-tight">{act.operatorName}</span>
              <span className="text-[12px] text-slate-500 block font-mono leading-tight mt-0.5">{act.timestamp}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AssumptionsPanel() {
  const assumptions = [
    { label: 'Forecast logic', desc: 'Current stock + 7-day net average daily movements.' },
    { label: 'Pipeline logic', desc: 'Lifecycle stages synced from Component.status.' },
    { label: 'Yard logic', desc: 'Occupancy calculated from active yard slots.' },
    { label: 'QC logic', desc: 'Pass/rework rates computed from inspection ledger.' }
  ]
  return (
    <div className="space-y-1.5 py-1 h-[110px] flex flex-col justify-around">
      {assumptions.map((a, idx) => (
        <div key={idx} className="flex items-start gap-2 text-[13px]">
          <CheckSquare className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-slate-200 block text-[13px] leading-tight truncate">{a.label}</span>
            <span className="text-[12px] text-slate-500 block leading-tight truncate mt-0.5">{a.desc}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ----------------------------------------------------
// Helper Calculation Handlers
// ----------------------------------------------------

type InventoryForecast = {
  currentStock: number
  inboundDaily: number
  outboundDaily: number
  netDailyMovement: number
  projectedStock: number
  daysOfCover: number
  trendDirection: 'up' | 'down'
  trendRows: InventoryMovementPoint[]
  assumption: string
}

type InventoryMovementPoint = {
  label: string
  inbound: number
  outbound: number
  stock: number
}

type InventoryKpis = {
  inventoryValue: number
  totalStock: number
  materialCodes: number
  lowStock: number
  outOfStock: number
}

type ComponentPipeline = {
  total: number
  stock: number
  ready: number
  shipped: number
  delivered: number
  installed: number
  openProduction: number
  completionRate: number
  assumption: string
}

type MaterialRecommendation = {
  key: string
  code: string
  name: string
  unit: string
  currentStock: number
  minimumStock: number
  dailyUsage: number
  projected7d: number
  recommendedQty: number
  action: string
  tone: 'red' | 'amber' | 'cyan'
}

type ComponentForecast = {
  readyNow: number
  activeProduction: number
  forecastReady7d: number
  shippedBacklog: number
  installBacklog: number
  rows: Array<{ label: string; value: number }>
  assumption: string
}

type YardAnalytics = {
  occupancyRate: number
  occupiedSlots: number
  totalSlots: number
  inbound: number
  outbound: number
  moves: number
  assumption: string
}

type QcTrend = {
  passed: number
  failed: number
  rework: number
  openIssues: number
  openNcrs: number
  passRate: number
  rows: Array<{ label: string; value: number }>
  assumption: string
}

type ProductionOverview = {
  totalOrders: number
  running: number
  completedToday: number
  delayed: number
  waitingMaterial: number
  efficiency: number
}

type ProjectsOverview = {
  totalProjects: number
  activeProjects: number
  delayedProjects: number
  contractValue: number
  componentsInProduction: number
  materialValue: number
}

type SuppliersOverview = {
  totalSuppliers: number
  activeSuppliers: number
  usedInInventory: number
  evaluated: number
  averageRating: number
  warning: number
}

type ExecutiveAlert = {
  code: string
  title: string
  value: string
  description: string
  tone: 'red' | 'amber' | 'cyan'
}

function normalizeRows(raw: any): any[] {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.data)) return raw.data
  return []
}

function buildInventoryKpis(inventoryRows: any[]): InventoryKpis {
  return inventoryRows.reduce<InventoryKpis>((acc, row) => {
    const stock = Number(row.currentStock ?? row.quantity ?? 0)
    const minimumStock = Number(row.minimumStock ?? row.minStock ?? row.safetyStock ?? 0)
    const averageCost = Number(row.averageCost ?? row.avgCost ?? row.unitPrice ?? 0)
    acc.inventoryValue += stock * averageCost
    acc.totalStock += stock
    acc.materialCodes += 1
    if (stock <= 0) acc.outOfStock += 1
    else if (minimumStock > 0 && stock <= minimumStock) acc.lowStock += 1
    return acc
  }, {
    inventoryValue: 0,
    totalStock: 0,
    materialCodes: 0,
    lowStock: 0,
    outOfStock: 0,
  })
}

function buildInventoryForecast(data: DashboardCockpit | undefined, inventoryRows: any[], transactions: any[]): InventoryForecast {
  const currentStock = inventoryRows.reduce((sum, row) => sum + Number(row.currentStock ?? row.quantity ?? 0), 0)
  const trendRows = buildInventoryMovementRows(transactions, currentStock, data?.movementTrend)
  const recent = transactions.slice(0, 80)
  const inbound = recent.filter((tx) => isInbound(tx)).reduce((sum, tx) => sum + transactionQuantity(tx), 0)
  const outbound = recent.filter((tx) => isOutbound(tx)).reduce((sum, tx) => sum + transactionQuantity(tx), 0)
  const days = Math.max(1, Math.min(14, trendRows.length || 7))
  const inboundDaily = inbound / days
  const outboundDaily = outbound / days
  const fallbackNet = trendRows.length >= 2 ? (trendRows.at(-1)!.stock - trendRows[0].stock) / Math.max(1, trendRows.length - 1) : 0
  const netDailyMovement = recent.length ? inboundDaily - outboundDaily : fallbackNet
  const projectedStock = Math.max(0, currentStock + netDailyMovement * 7)
  const consumptionRate = Math.max(0.1, outboundDaily || Math.abs(netDailyMovement) || 1)
  const daysOfCover = currentStock / consumptionRate
  return {
    currentStock,
    inboundDaily,
    outboundDaily,
    netDailyMovement,
    projectedStock,
    daysOfCover,
    trendDirection: netDailyMovement < 0 ? 'down' : 'up',
    trendRows: trendRows.length ? trendRows : [{ label: 'No data', inbound: 0, outbound: 0, stock: 0 }],
    assumption: recent.length ? 'Forecast = current stock + 7 ngày net movement gần nhất.' : 'Thiếu transaction chi tiết; dùng movementTrend.',
  }
}

function buildInventoryMovementRows(
  transactions: any[],
  currentStock: number,
  fallback?: Array<{ label: string; value: number }>,
): InventoryMovementPoint[] {
  if (!transactions.length) {
    return (fallback ?? []).map((row) => ({
      label: row.label,
      inbound: 0,
      outbound: 0,
      stock: Number(row.value ?? 0),
    }))
  }

  const sorted = [...transactions].sort((a, b) =>
    String(a.transactionDate ?? a.createdAt ?? '').localeCompare(String(b.transactionDate ?? b.createdAt ?? '')),
  )
  const map = new Map<string, { inbound: number; outbound: number }>()
  sorted.forEach((tx) => {
    const label = String(tx.transactionDate ?? tx.createdAt ?? '').slice(5, 10) || '-'
    const row = map.get(label) ?? { inbound: 0, outbound: 0 }
    const quantity = transactionQuantity(tx)
    if (isInbound(tx)) row.inbound += quantity
    if (isOutbound(tx)) row.outbound += quantity
    map.set(label, row)
  })

  const rows = Array.from(map.entries()).slice(-7)
  const netTotal = rows.reduce((sum, [, row]) => sum + row.inbound - row.outbound, 0)
  let runningStock = Math.max(0, currentStock - netTotal)
  return rows.map(([label, row]) => {
    runningStock = Math.max(0, runningStock + row.inbound - row.outbound)
    return {
      label,
      inbound: row.inbound,
      outbound: row.outbound,
      stock: runningStock,
    }
  })
}

function buildComponentPipeline(components: any[], productionOrders: any[]): ComponentPipeline {
  const count = (status: string) => components.filter((row) => row.status === status).length
  const total = components.length
  const installed = count('INSTALLED')
  return {
    total,
    stock: count('STOCK'),
    ready: count('READY'),
    shipped: count('SHIPPED'),
    delivered: count('DELIVERED'),
    installed,
    openProduction: productionOrders.filter((row) => !['COMPLETED', 'CANCELLED'].includes(row.status)).length,
    completionRate: total ? installed / total * 100 : 0,
    assumption: 'Pipeline lấy trực tiếp từ Component.status; completion = INSTALLED / tổng.',
  }
}

function buildMaterialRecommendations(inventoryRows: any[], transactions: any[]): MaterialRecommendation[] {
  const usageByKey = new Map<string, number>()
  const transactionDays = new Set<string>()
  transactions.forEach((tx) => {
    const day = String(tx.transactionDate ?? tx.createdAt ?? '').slice(0, 10)
    if (day) transactionDays.add(day)
    if (!isOutbound(tx)) return
    transactionItems(tx).forEach((item) => {
      const key = transactionItemKey(item)
      if (!key) return
      usageByKey.set(key, (usageByKey.get(key) ?? 0) + Math.abs(Number(item.quantity ?? 0)))
    })
  })
  const days = Math.max(1, Math.min(14, transactionDays.size || 7))
  return inventoryRows.map((row) => {
    const key = inventoryItemKey(row)
    const code = String(row.materialCode ?? row.code ?? row.sku ?? key)
    const currentStock = Number(row.currentStock ?? row.quantity ?? 0)
    const minimumStock = Number(row.minimumStock ?? row.minStock ?? row.safetyStock ?? 0)
    const dailyUsage = Number(usageByKey.get(key) ?? usageByKey.get(code) ?? 0) / days
    const projected7d = currentStock - dailyUsage * 7
    const targetStock = Math.max(minimumStock * 2, dailyUsage * 14, minimumStock)
    const recommendedQty = Math.max(0, targetStock - Math.max(0, projected7d))
    const isCritical = projected7d <= 0 || currentStock <= minimumStock
    const shouldReplenish = recommendedQty > 0 && projected7d <= Math.max(minimumStock, dailyUsage * 3)
    return {
      key,
      code,
      name: String(row.materialName ?? row.name ?? row.description ?? 'Vật tư'),
      unit: String(row.unit ?? row.unitName ?? ''),
      currentStock,
      minimumStock,
      dailyUsage,
      projected7d,
      recommendedQty: shouldReplenish || isCritical ? recommendedQty : 0,
      action: isCritical ? 'Cần mua gấp' : shouldReplenish ? 'Cần nhập thêm' : 'Theo dõi',
      tone: isCritical ? 'red' : shouldReplenish ? 'amber' : 'cyan',
    } satisfies MaterialRecommendation
  }).sort((a, b) => {
    const toneScore = { red: 3, amber: 2, cyan: 1 }
    return toneScore[b.tone] - toneScore[a.tone] || b.recommendedQty - a.recommendedQty || a.code.localeCompare(b.code)
  })
}

function buildComponentForecast(pipeline: ComponentPipeline, productionOrders: any[]): ComponentForecast {
  const activeProduction = productionOrders.filter((row) => !['COMPLETED', 'CANCELLED'].includes(String(row.status ?? '').toUpperCase())).length
  const completedOrders = productionOrders.filter((row) => String(row.status ?? '').toUpperCase() === 'COMPLETED').length
  const completionVelocity = Math.max(0, Math.ceil(completedOrders / 7))
  const forecastReady7d = pipeline.ready + Math.min(activeProduction, Math.max(completionVelocity * 7, Math.ceil(activeProduction * 0.35)))
  const shippedBacklog = Math.max(0, pipeline.shipped - pipeline.delivered - pipeline.installed)
  const installBacklog = Math.max(0, pipeline.delivered - pipeline.installed)
  return {
    readyNow: pipeline.ready,
    activeProduction,
    forecastReady7d,
    shippedBacklog,
    installBacklog,
    rows: [
      { label: 'READY', value: pipeline.ready },
      { label: 'SHIP', value: pipeline.shipped },
      { label: 'DLV', value: pipeline.delivered },
      { label: 'INST', value: pipeline.installed },
      { label: '+7d', value: forecastReady7d },
    ],
    assumption: 'Forecast +7d = READY hiện tại + một phần MO đang mở.',
  }
}

function buildProductionOverview(productionOrders: any[]): ProductionOverview {
  const today = new Date().toISOString().slice(0, 10)
  const normalized = productionOrders.map((row) => ({ ...row, statusText: String(row.status ?? '').toUpperCase() }))
  const completed = normalized.filter((row) => ['COMPLETED', 'DONE', 'FINISHED'].includes(row.statusText))
  const running = normalized.filter((row) => ['IN_PROGRESS', 'RUNNING', 'ACTIVE', 'PROCESSING', 'RELEASED'].includes(row.statusText)).length
  const completedToday = completed.filter((row) => String(row.completedAt ?? row.updatedAt ?? row.finishedAt ?? '').slice(0, 10) === today).length
  const delayed = normalized.filter((row) => {
    const due = String(row.dueDate ?? row.plannedEndAt ?? row.endDate ?? '').slice(0, 10)
    return due && due < today && !['COMPLETED', 'DONE', 'FINISHED', 'CANCELLED'].includes(row.statusText)
  }).length
  const waitingMaterial = normalized.filter((row) => ['WAITING_MATERIAL', 'MATERIAL_SHORTAGE', 'BLOCKED'].includes(row.statusText)).length
  return {
    totalOrders: normalized.length,
    running,
    completedToday,
    delayed,
    waitingMaterial,
    efficiency: normalized.length ? completed.length / normalized.length * 100 : 0,
  }
}

function buildProjectsOverview(runtime: any): ProjectsOverview {
  const metrics = runtime?.metrics ?? {}
  const projects = Array.isArray(runtime?.projects) ? runtime.projects : []
  const materials = Array.isArray(runtime?.materials) ? runtime.materials : []
  const delayedProjects = projects.filter((row: any) => Number(row.delayedOrders ?? 0) > 0).length
  const materialValue = materials.reduce((sum: number, row: any) => sum + Number(row.totalAmount ?? 0), 0)
  return {
    totalProjects: Number(metrics.totalProjects ?? projects.length ?? 0),
    activeProjects: Number(metrics.activeProjects ?? projects.filter((row: any) => row.status === 'ACTIVE').length ?? 0),
    delayedProjects,
    contractValue: Number(metrics.contractValue ?? 0),
    componentsInProduction: Number(metrics.readyComponents ?? 0) + Number(metrics.shippedComponents ?? 0) + Number(metrics.deliveredComponents ?? 0),
    materialValue,
  }
}

function buildSuppliersOverview(summary: any, evaluation: any): SuppliersOverview {
  return {
    totalSuppliers: Number(summary?.total ?? evaluation?.metrics?.total ?? 0),
    activeSuppliers: Number(summary?.active ?? 0),
    usedInInventory: Number(summary?.usedInInventory ?? 0),
    evaluated: Number(evaluation?.metrics?.evaluated ?? 0),
    averageRating: Number(evaluation?.metrics?.averageOverall ?? 0),
    warning: Number(evaluation?.metrics?.warning ?? 0),
  }
}

function buildYardAnalytics(metrics: any, movements: any[]): YardAnalytics {
  return {
    occupancyRate: Number(metrics?.occupancyRate ?? 0),
    occupiedSlots: Number(metrics?.occupiedSlots ?? 0),
    totalSlots: Number(metrics?.totalSlots ?? 0),
    inbound: movements.filter((row) => row.type === 'PLACE').length,
    outbound: movements.filter((row) => row.type === 'REMOVE').length,
    moves: movements.filter((row) => row.type === 'MOVE').length,
    assumption: metrics ? 'Yard occupancy đồng bộ realtime.' : 'Yard: chưa có dữ liệu realtime.',
  }
}

function buildQcTrend(qc: any): QcTrend {
  const metrics = qc?.metrics
  const rows = [
    { label: 'Pass', value: Number(metrics?.passed ?? 0) },
    { label: 'Rework', value: Number(metrics?.rework ?? 0) },
    { label: 'Fail', value: Number(metrics?.failed ?? 0) },
    { label: 'Open', value: Number(metrics?.openIssues ?? 0) },
  ]
  return {
    passed: rows[0].value,
    rework: rows[1].value,
    failed: rows[2].value,
    openIssues: Number(metrics?.openIssues ?? 0),
    openNcrs: Number(metrics?.openNcrs ?? 0),
    passRate: Number(metrics?.passRate ?? 0),
    rows,
    assumption: qc ? 'QC trend đồng bộ QC cockpit.' : 'QC: chưa có dữ liệu cockpit.',
  }
}

function buildExecutiveAlerts(data: DashboardCockpit | undefined, inventory: InventoryForecast, components: ComponentPipeline, yard: YardAnalytics, qc: QcTrend, materials: MaterialRecommendation[], componentForecast: ComponentForecast): ExecutiveAlert[] {
  const alerts: ExecutiveAlert[] = []
  materials.filter((row) => row.recommendedQty > 0).slice(0, 3).forEach((row) => {
    alerts.push({
      code: `material-${row.key}`,
      title: row.code,
      value: `${fmt(row.recommendedQty, 1)} ${row.unit}`,
      description: `Tồn ${fmt(row.currentStock, 0)} · thiếu ${fmt(row.recommendedQty, 0)} ${row.unit}`,
      tone: row.tone === 'cyan' ? 'cyan' : row.tone,
    })
  })
  if (inventory.daysOfCover < 7) alerts.push({ code: 'inventory-cover', title: 'Inventory cover thấp', value: `${fmt(inventory.daysOfCover, 1)} ngày`, description: 'Dự báo tồn kho dưới 7 ngày theo movement hiện tại.', tone: 'red' })
  if (yard.occupancyRate >= 85) alerts.push({ code: 'yard-high', title: 'Bãi gần quá tải', value: `${fmt(yard.occupancyRate, 1)}%`, description: 'Occupancy vượt ngưỡng điều hành 85%.', tone: 'amber' })
  if (qc.passRate > 0 && qc.passRate < 90) alerts.push({ code: 'qc-pass-rate', title: 'QC pass rate thấp', value: `${fmt(qc.passRate, 1)}%`, description: 'Tỷ lệ đạt QC dưới 90%, cần kiểm tra lỗi/rework.', tone: 'amber' })
  if (components.shipped > components.delivered + components.installed) alerts.push({ code: 'component-transit', title: 'Cấu kiện đang transit', value: fmt(components.shipped), description: 'SHIPPED lớn hơn DELIVERED/INSTALLED, cần theo dõi bàn giao.', tone: 'cyan' })
  if (componentForecast.installBacklog > 0) alerts.push({ code: 'component-install-backlog', title: 'Cấu kiện chờ lắp đặt', value: fmt(componentForecast.installBacklog), description: 'DELIVERED lớn hơn INSTALLED, cần điều phối đội lắp dựng.', tone: 'amber' })
  ;(data?.alerts ?? []).forEach((alert) => {
    if (alert.count > 0) alerts.push({ code: alert.code, title: alert.title, value: fmt(alert.count), description: 'Cảnh báo từ dashboard cockpit hiện có.', tone: alert.code.includes('QC') ? 'amber' : 'red' })
  })
  return alerts.slice(0, 8)
}

function buildRecentActivities(transactions: any[]): any[] {
  return transactions.slice(0, 6).map((tx, idx) => ({
    id: tx.id ?? String(idx),
    timestamp: formatActivityTime(tx.transactionDate ?? tx.createdAt),
    operatorName: tx.operatorName ?? 'Operator',
    module: tx.type === 'PRODUCTION' ? 'production' : tx.type === 'QC' ? 'qc' : 'warehouse',
    description: tx.description ?? tx.note ?? `Giao dịch ${tx.transactionNo ?? tx.code ?? ''}`
  }))
}

function formatActivityTime(value: unknown) {
  const raw = String(value ?? '')
  if (!raw) return '-'
  const date = raw.slice(0, 10)
  const time = raw.slice(11, 16)
  return time ? `${date} ${time}` : date || '-'
}

function isInbound(tx: any) {
  const type = String(tx.type ?? tx.transactionType ?? '').toUpperCase()
  return ['IMPORT', 'INBOUND', 'RECEIPT', 'RETURN'].some((key) => type.includes(key))
}

function isOutbound(tx: any) {
  const type = String(tx.type ?? tx.transactionType ?? '').toUpperCase()
  return ['EXPORT', 'OUTBOUND', 'ISSUE'].some((key) => type.includes(key))
}

function transactionQuantity(tx: any) {
  const items = transactionItems(tx)
  if (items.length) return items.reduce((sum: number, item: any) => sum + Math.abs(Number(item.quantity ?? 0)), 0)
  return Math.abs(Number(tx.totalQuantity ?? tx.quantity ?? 0))
}

function transactionItems(tx: any) {
  return Array.isArray(tx.items) ? tx.items : Array.isArray(tx.transactionItems) ? tx.transactionItems : []
}

function inventoryItemKey(row: any) {
  return String(row.inventoryItemId ?? row.materialId ?? row.itemId ?? row.id ?? row.materialCode ?? row.code ?? '').trim()
}

function transactionItemKey(item: any) {
  return String(
    item.inventoryItemId ??
    item.materialId ??
    item.itemId ??
    item.inventoryItem?.id ??
    item.material?.id ??
    item.inventoryItem?.materialCode ??
    item.inventoryItem?.code ??
    item.materialCode ??
    item.code ??
    '',
  ).trim()
}

// ----------------------------------------------------
// UI Element Components
// ----------------------------------------------------

function Meter({ value }: { value: number }) {
  const color = value >= 85 ? 'bg-red-500' : value >= 65 ? 'bg-amber-400' : 'bg-emerald-500'
  return <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(4, value))}%` }} /></div>
}

function Sparkline({ rows, heightClass = 'h-28' }: { rows: Array<{ label: string; value?: number; stock?: number }>; heightClass?: string }) {
  const values = rows.map((row) => Number(row.value ?? row.stock ?? 0))
  const max = Math.max(1, ...values)
  return (
    <div className={`flex ${heightClass} items-end gap-1.5 rounded-xl border border-white/5 bg-slate-950/20 px-2 pb-2`}>
      {rows.map((row, index) => (
        <div key={row.label} className="flex flex-1 flex-col items-center justify-end h-full">
          <div className="w-full rounded-t bg-gradient-to-t from-blue-700 to-cyan-400" style={{ height: `${Math.max(8, (values[index] / max) * 100)}%` }} />
        </div>
      ))}
    </div>
  )
}

function HorizontalBars({ rows, max }: { rows: Array<{ label: string; value: number }>; max: number }) {
  if (!rows.length) return <ModuleEmptyState title="Chưa có dữ liệu" description="Chờ cập nhật..." />
  return (
    <div className="space-y-1.8">
      {rows.slice(0, 4).map((row) => (
        <div key={row.label} className="grid grid-cols-[80px_1fr_40px] items-center gap-2 text-xs">
          <span className="truncate text-slate-400 font-semibold">{row.label}</span>
          <span className="h-2 rounded bg-slate-900"><i className="block h-full rounded bg-cyan-400" style={{ width: `${Math.max(4, Math.min(100, (row.value / Math.max(1, max)) * 100))}%` }} /></span>
          <b className="text-right text-slate-355 font-mono">{fmt(row.value, 0)}</b>
        </div>
      ))}
    </div>
  )
}

function Donut({ rows, center, label }: { rows: Array<{ label: string; value: number; color: string }>; center: string; label: string }) {
  const total = Math.max(1, rows.reduce((sum, row) => sum + row.value, 0))
  let cursor = 0
  const gradient = rows.map((row) => {
    const start = cursor
    const end = cursor + row.value / total * 100
    cursor = end
    return `${row.color} ${start}% ${end}%`
  }).join(', ')
  return (
    <div className="relative h-24 w-24 rounded-full flex-shrink-0" style={{ background: `conic-gradient(${gradient})` }}>
      <div className="absolute inset-2.5 rounded-full bg-[#08111f]" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-lg font-bold text-white font-mono">{center}</div>
        <div className="text-[9px] text-slate-500 uppercase">{label}</div>
      </div>
    </div>
  )
}
