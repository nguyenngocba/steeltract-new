import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  Building2,
  ChevronRight,
  Clock,
  Factory,
  Filter,
  PackageCheck,
  PackagePlus,
  ShieldCheck,
  Truck,
  Warehouse,
  X,
  type LucideIcon,
} from 'lucide-react'

import { getDispatchDashboard, getDispatchOrders, type DispatchOrder, type DispatchOrderStatus } from '@/modules/logistics/api/logistics.api'
import { getProjectsRuntime, type ProjectRuntimeRow, type ProjectsRuntime } from '@/modules/projects/api/projects.api'
import { productionApi, type ProductionOrder } from '@/modules/production/api/production.api'
import { getComponentsDashboard } from '@/modules/components/services/api/components.api'
import { getSupplierCockpitSummary, type SupplierCockpitSummary } from '@/modules/suppliers/api/suppliers.api'
import { getInventoryItems } from '@/modules/inventory/api/inventory.api'
import { useWarehouses } from '@/modules/inventory/hooks/useWarehouses'
import { useInventoryAudit } from '@/modules/inventory/hooks/useInventoryAudit'
import { useInventoryOverview } from '@/modules/inventory/hooks/useInventoryReadModels'
import { useInventoryTransactions } from '@/modules/inventory/hooks/useInventoryTransactions'
import { getQcCockpit, type QcCockpit } from '@/modules/qc/api/qc.api'
import { EnterpriseWorkspace } from '@/shared/ui/enterprise'
import { CockpitEmptyState, CockpitTableShell, DataTablePagination } from '@/shared/ui/cockpit'
import {
  AnalyticsActivityPanel,
  AnalyticsDistributionCard,
  AnalyticsHeader,
  AnalyticsMetricGrid,
  AnalyticsModuleKpiCard,
  AnalyticsRankingCard,
  AnalyticsSection,
  AnalyticsTable,
  AnalyticsTrendChart,
  type AnalyticsActivityRow,
  type DomainTheme,
  domainThemes,
} from '@/shared/ui/analytics'
import { formatCurrencyVnd, formatQuantity } from '@/shared/utils/number-format'
import materialCardBg from '../../../../../../images/vattu.png'
import supplierCardBg from '../../../../../../images/nhacungcap.jpg'
import projectCardBg from '../../../../../../images/congtrinh.jpg'
import componentCardBg from '../../../../../../images/caukien.jpg'

type TimeRange = 'TODAY' | '7D' | '30D' | 'CUSTOM'
type DashboardTab = 'kpi' | 'trends' | 'activities' | 'notifications'
type AnalyticsDomain = 'inventory' | 'inbound' | 'outbound' | 'production' | 'qc' | 'projects' | 'dispatch'
type DashboardWidgetId = 'inventory-type' | 'import-export' | 'components' | 'projects-progress' | 'qc-status' | 'delivery-status' | 'alerts'
type Tone = 'blue' | 'emerald' | 'cyan' | 'amber' | 'red' | 'purple' | 'indigo' | 'orange'
type RecordRow = Record<string, unknown>
type SeriesPoint = { label: string; value: number; secondary?: number }
type DistributionPoint = { label: string; value: number; color: string }
type AlertRow = { id: string; type: string; level: 'Cao' | 'Trung bình'; content: string; impact: string; time: string; domain: AnalyticsDomain }
type DateRange = { start: Date; end: Date }

const fmt = (value = 0, digits = 0) => formatQuantity(value, digits)
const money = (value = 0) => formatCurrencyVnd(value)
const dateTime = (value?: string | null) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'Dữ liệu chưa khả dụng'
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

const productionStatusLabels: Record<string, string> = {
  DRAFT: 'Nháp',
  RELEASED: 'Đã phát hành',
  READY: 'Sẵn sàng',
  STARTED: 'Đã bắt đầu',
  RUNNING: 'Đang chạy',
  IN_PROGRESS: 'Đang thực hiện',
  PAUSED: 'Tạm dừng',
  COMPLETED: 'Hoàn thành',
  CLOSED: 'Đã đóng',
  CANCELLED: 'Đã hủy',
  DELAYED: 'Chậm tiến độ',
  BLOCKED: 'Bị chặn',
}

const qcStatusLabels: Record<string, string> = {
  DRAFT: 'Nháp',
  READY: 'Sẵn sàng',
  IN_PROGRESS: 'Đang kiểm',
  PASSED: 'Đạt',
  FAILED: 'Không đạt',
  REWORK_REQUIRED: 'Cần rework',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
}

const qcResultLabels: Record<string, string> = {
  PASS: 'Đạt',
  FAIL: 'Không đạt',
  PENDING: 'Chờ kiểm',
}

const projectStatusLabels: Record<string, string> = {
  ACTIVE: 'Đang thực hiện',
  PLANNING: 'Đang lập kế hoạch',
  ON_HOLD: 'Tạm dừng',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  DELAYED: 'Chậm tiến độ',
  BLOCKED: 'Bị chặn',
}

function productionStatusLabel(value: string) {
  return productionStatusLabels[value] ?? (value || 'Chưa rõ')
}

function projectStatusLabel(value: string) {
  return projectStatusLabels[value] ?? (value || 'Chưa rõ')
}

function qcStatusLabel(value: string) {
  return qcStatusLabels[value] ?? (value || 'Chưa rõ')
}

function qcResultLabel(value: string) {
  return qcResultLabels[value] ?? (value || 'Chưa rõ')
}

function dashboardTabFromSearch(value: string | null): DashboardTab {
  if (value === 'trends' || value === 'activities' || value === 'notifications') return value
  return 'kpi'
}

function dashboardTabMeta(tab: DashboardTab) {
  const meta: Record<DashboardTab, { title: string; description: string }> = {
    kpi: { title: 'Bảng KPI chính', description: `Cập nhật lúc ${dateTime(new Date().toISOString())}` },
    trends: { title: 'Biểu đồ xu hướng', description: 'Dự báo vật tư, cấu kiện, nhà cung cấp, công trình và kế hoạch sản xuất từ dữ liệu vận hành hiện có.' },
    activities: { title: 'Hoạt động gần đây', description: 'Dòng sự kiện vận hành gần nhất từ kho, sản xuất, QC, giao nhận và công trình.' },
    notifications: { title: 'Thông báo', description: 'Cảnh báo điều hành cần theo dõi từ tồn kho, QC, giao nhận và tiến độ công trình.' },
  }
  return meta[tab]
}

const domainTabs: Array<{ id: AnalyticsDomain; label: string; icon: LucideIcon }> = [
  { id: 'inventory', label: 'Tồn kho', icon: Warehouse },
  { id: 'inbound', label: 'Nhập kho', icon: PackagePlus },
  { id: 'outbound', label: 'Xuất kho', icon: Truck },
  { id: 'production', label: 'Sản xuất', icon: Factory },
  { id: 'qc', label: 'Chất lượng', icon: ShieldCheck },
  { id: 'projects', label: 'Dự án', icon: Building2 },
  { id: 'dispatch', label: 'Giao nhận', icon: PackageCheck },
]

const toneMap: Record<Tone, { border: string; glow: string; text: string; soft: string; stroke: string; fill: string }> = {
  blue: { border: 'border-blue-400/35', glow: 'hover:shadow-blue-500/25', text: 'text-blue-300', soft: 'bg-blue-500/10', stroke: '#38bdf8', fill: 'rgba(56,189,248,0.18)' },
  emerald: { border: 'border-emerald-400/35', glow: 'hover:shadow-emerald-500/25', text: 'text-emerald-300', soft: 'bg-emerald-500/10', stroke: '#34d399', fill: 'rgba(52,211,153,0.18)' },
  cyan: { border: 'border-cyan-400/35', glow: 'hover:shadow-cyan-500/25', text: 'text-cyan-300', soft: 'bg-cyan-500/10', stroke: '#22d3ee', fill: 'rgba(34,211,238,0.18)' },
  amber: { border: 'border-amber-400/35', glow: 'hover:shadow-amber-500/25', text: 'text-amber-300', soft: 'bg-amber-500/10', stroke: '#f59e0b', fill: 'rgba(245,158,11,0.18)' },
  red: { border: 'border-red-400/35', glow: 'hover:shadow-red-500/25', text: 'text-red-300', soft: 'bg-red-500/10', stroke: '#f87171', fill: 'rgba(248,113,113,0.18)' },
  purple: { border: 'border-purple-400/35', glow: 'hover:shadow-purple-500/25', text: 'text-purple-300', soft: 'bg-purple-500/10', stroke: '#a78bfa', fill: 'rgba(167,139,250,0.18)' },
  indigo: { border: 'border-indigo-400/35', glow: 'hover:shadow-indigo-500/25', text: 'text-indigo-300', soft: 'bg-indigo-500/10', stroke: '#818cf8', fill: 'rgba(129,140,248,0.18)' },
  orange: { border: 'border-orange-400/35', glow: 'hover:shadow-orange-500/25', text: 'text-orange-300', soft: 'bg-orange-500/10', stroke: '#fb923c', fill: 'rgba(251,146,60,0.18)' },
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const dashboardTab = dashboardTabFromSearch(searchParams.get('tab'))
  const pageMeta = dashboardTabMeta(dashboardTab)
  const [timeRange, setTimeRange] = useState<TimeRange>('30D')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [selectedProject, setSelectedProject] = useState('all')
  const [selectedWarehouse, setSelectedWarehouse] = useState('all')
  const [activeDomain, setActiveDomain] = useState<AnalyticsDomain | null>(null)
  const [activeWidget, setActiveWidget] = useState<DashboardWidgetId | null>(null)
  const [detailPage, setDetailPage] = useState(1)

  const { data: inventoryAudit = [] } = useInventoryAudit()
  const { data: inventoryOverview } = useInventoryOverview({})
  const { data: inventoryItemsRaw = [] } = useQuery({ queryKey: ['inventory-items'], queryFn: getInventoryItems })
  const { data: warehouses = [] } = useWarehouses()
  const shouldLoadTransactionDetail = dashboardTab === 'activities' || activeWidget === 'import-export' || activeDomain === 'inbound' || activeDomain === 'outbound'
  const { data: transactionPayload = [] } = useInventoryTransactions({ page: 1, pageSize: 200 }, { enabled: shouldLoadTransactionDetail })
  const { data: productionOrdersRaw = [] } = useQuery({ queryKey: ['production-orders'], queryFn: () => productionApi.orders() })
  const { data: componentsDashboard } = useQuery({ queryKey: ['components-dashboard'], queryFn: getComponentsDashboard })
  const { data: supplierSummary } = useQuery<SupplierCockpitSummary>({ queryKey: ['suppliers', 'cockpit-summary'], queryFn: getSupplierCockpitSummary })
  const { data: projectsRuntime } = useQuery<ProjectsRuntime>({ queryKey: ['project-runtime'], queryFn: getProjectsRuntime })
  const { data: dispatchDashboard } = useQuery({ queryKey: ['logistics-dispatch-dashboard'], queryFn: getDispatchDashboard })
  const { data: dispatchOrders = [] } = useQuery({ queryKey: ['logistics-dispatch-orders'], queryFn: getDispatchOrders })
  const { data: qcCockpit } = useQuery<QcCockpit>({ queryKey: ['qc-cockpit'], queryFn: getQcCockpit })

  const inventoryRows = asRows(inventoryAudit)
  const inventoryItems = asRows(inventoryItemsRaw)
  const transactions = asRows(transactionPayload)
  const inventoryOverviewRecord = asRecord(inventoryOverview)
  const inventoryOverviewMonth = asRecord(inventoryOverviewRecord.month)
  const inventoryOverviewMovementTrend = asRows(inventoryOverviewRecord.movementTrend)
  const productionOrders = asRows(productionOrdersRaw) as unknown as ProductionOrder[]
  const projects = projectsRuntime?.projects ?? []
  const timelineAnchor = useMemo(() => latestTimestamp([
    ...inventoryRows,
    ...inventoryItems,
    ...inventoryOverviewMovementTrend,
    ...(productionOrders as unknown as RecordRow[]),
    ...(projects as unknown as RecordRow[]),
    ...(dispatchOrders as unknown as RecordRow[]),
  ]), [inventoryRows, inventoryItems, inventoryOverviewMovementTrend, productionOrders, projects, dispatchOrders])
  const dateRange = useMemo(() => resolveDateRange(timeRange, customStartDate, customEndDate, timelineAnchor), [timeRange, customStartDate, customEndDate, timelineAnchor])
  const dateFilteredTransactions = useMemo(() => filterRowsByDate(transactions, dateRange), [transactions, dateRange])
  const dateFilteredInventoryRows = useMemo(() => filterRowsByDate(inventoryRows, dateRange), [inventoryRows, dateRange])
  const dateFilteredInventoryItems = useMemo(() => filterRowsByDate(inventoryItems, dateRange), [inventoryItems, dateRange])
  const effectiveInventoryRows = dateFilteredInventoryRows
  const effectiveInventoryItems = dateFilteredInventoryItems

  const filteredInventoryRows = useMemo(() => {
    if (selectedWarehouse === 'all') return effectiveInventoryRows
    return effectiveInventoryRows.filter((row) => str(row.warehouseId) === selectedWarehouse || str(row.warehouse) === selectedWarehouse)
  }, [effectiveInventoryRows, selectedWarehouse])

  const filteredProductionOrders = useMemo(() => {
    const rows = filterRowsByDate(productionOrders as unknown as RecordRow[], dateRange) as unknown as ProductionOrder[]
    if (selectedProject === 'all') return rows
    return rows.filter((order) => str((order as RecordRow).projectId) === selectedProject)
  }, [productionOrders, selectedProject, dateRange])

  const filteredProjects = useMemo(() => {
    const rows = filterRowsByDate(projects as unknown as RecordRow[], dateRange) as unknown as ProjectRuntimeRow[]
    if (selectedProject === 'all') return rows
    return rows.filter((project) => project.id === selectedProject)
  }, [projects, selectedProject, dateRange])

  const filteredDispatchOrders = useMemo(() => {
    const rows = filterRowsByDate(dispatchOrders as unknown as RecordRow[], dateRange) as unknown as DispatchOrder[]
    if (selectedProject === 'all') return rows
    return rows.filter((order) => order.projectId === selectedProject)
  }, [dispatchOrders, selectedProject, dateRange])

  const inboundTransactions = useMemo(() => dateFilteredTransactions.filter((row) => transactionType(row) === 'INBOUND'), [dateFilteredTransactions])
  const outboundTransactions = useMemo(() => dateFilteredTransactions.filter((row) => transactionType(row) === 'OUTBOUND'), [dateFilteredTransactions])

  const inventoryValue = selectedWarehouse === 'all'
    ? num(inventoryOverviewRecord.summary, 'totalValue') || sum(filteredInventoryRows, ['stockValue', 'inventoryValue', 'totalValue'])
    : sum(filteredInventoryRows, ['stockValue', 'inventoryValue', 'totalValue'])
  const inventoryQty = sum(effectiveInventoryItems, ['quantity', 'currentStock', 'stockOnHand'])
  const inboundValue = overviewMonthValue(inventoryOverviewMonth, 'inbound')
  const outboundValue = overviewMonthValue(inventoryOverviewMonth, 'outbound')
  const runningProduction = filteredProductionOrders.filter((order) => isActiveProductionOrder(str((order as RecordRow).status))).length
  const activeProjects = filteredProjects.filter((project) => project.status === 'ACTIVE' || project.progress < 100).length
  const dispatchActive = filteredDispatchOrders.filter((order) => ['PLANNED', 'LOADING', 'IN_TRANSIT', 'ARRIVED'].includes(order.status)).length
  const passRate = num(qcCockpit?.metrics, 'passRate')
  const openNcr = num(qcCockpit?.metrics, 'openNcrs')
  const lowStockItems = filteredInventoryRows.filter((item) => {
    const quantity = num(item, 'quantity') || num(item, 'currentStock')
    const minQuantity = num(item, 'minimumStock') || num(item, 'minQuantity') || num(item, 'reorderPoint')
    return quantity < 0 || (minQuantity > 0 && quantity <= minQuantity)
  })

  const inventoryValueSeries = dailySeries(filteredInventoryRows, ['stockValue', 'inventoryValue', 'totalValue'])
  const inventoryQtySeries = dailySeries(effectiveInventoryItems, ['quantity', 'currentStock', 'stockOnHand'])
  const importExportTrend = importExportValueTrend(filterRowsByDate(inventoryOverviewMovementTrend, dateRange))
  const inboundValueSeries = importExportTrend.map((row) => ({ label: row.label, value: row.value }))
  const outboundValueSeries = importExportTrend.map((row) => ({ label: row.label, value: row.secondary ?? 0 }))
  const productionSeries = dailySeries(filteredProductionOrders as unknown as RecordRow[], ['quantity', 'plannedQty', 'completedQty'], true)
  const projectSeries = filteredProjects.length ? filteredProjects.map((project) => ({ label: project.code, value: project.progress })) : []
  const dispatchSeries = dailySeries(filteredDispatchOrders as unknown as RecordRow[], ['value'], true)
  const qcSeries = (qcCockpit?.trend ?? []).map((row) => ({ label: row.date.slice(8) || row.date, value: row.passed, secondary: row.failed }))
  const inventoryValueByType = inventoryValueByMaterialType(filteredInventoryRows)
  const componentStatusRows = componentStatusDistribution(componentsDashboard)
  const componentTotal = componentTotalCount(componentsDashboard, componentStatusRows)
  const componentReady = componentStatusValue(componentStatusRows, 'Sẵn sàng')
  const projectContractValue = filteredProjects.reduce((sumValue, project) => sumValue + project.contractValue, 0)

  const kpis = [
    buildKpi('inventory', Warehouse, 'Tổng giá trị tồn kho', compactCurrencyValue(inventoryValue), 'VND', 'so với tháng trước', 'purple', inventoryValueSeries, deltaPercent(inventoryValueSeries)),
    buildKpi('inventory', Boxes, 'Tổng số lượng tồn kho', fmt(inventoryQty), '', 'so với tháng trước', 'blue', inventoryQtySeries, deltaPercent(inventoryQtySeries)),
    buildKpi('inbound', PackagePlus, 'Giá trị nhập kho', compactCurrencyValue(inboundValue), 'VND', 'so với tháng trước', 'emerald', inboundValueSeries, deltaPercent(inboundValueSeries)),
    buildKpi('outbound', Truck, 'Giá trị xuất kho', compactCurrencyValue(outboundValue), 'VND', 'so với tháng trước', 'orange', outboundValueSeries, deltaPercent(outboundValueSeries)),
    buildKpi('production', Factory, 'Sản xuất đang chạy', fmt(runningProduction), 'lệnh', 'so với tháng trước', 'cyan', productionSeries, deltaPercent(productionSeries)),
    buildKpi('projects', Building2, 'Dự án đang thực hiện', fmt(activeProjects), 'dự án', 'so với tháng trước', 'amber', projectSeries, deltaPercent(projectSeries)),
    buildKpi('dispatch', Clock, 'Giao hàng hôm nay', fmt(dispatchActive), 'chuyến', 'so với tháng trước', 'emerald', dispatchSeries, deltaPercent(dispatchSeries)),
    buildKpi('qc', ShieldCheck, 'QC / NCR mở', `${fmt(passRate, 1)}%`, 'đạt', 'so với tháng trước', 'red', qcSeries, deltaPercent(qcSeries)),
  ]

  const alerts = buildAlerts({ lowStockItems, dispatchOrders: filteredDispatchOrders, openNcr, projects: filteredProjects })
  const domainContext: DomainContext = {
    inventoryRows: filteredInventoryRows,
    inventoryItems,
    transactions,
    inboundTransactions,
    outboundTransactions,
    productionOrders: filteredProductionOrders as unknown as RecordRow[],
    projects: filteredProjects,
    dispatchOrders: filteredDispatchOrders,
    dispatchDashboard,
    qcCockpit,
    inventoryValue,
    inventoryQty,
    inboundValue,
    outboundValue,
    runningProduction,
    activeProjects,
    dispatchActive,
    passRate,
    openNcr,
  }

  return (
    <EnterpriseWorkspace
      eyebrow="TỔNG QUAN"
      title={pageMeta.title}
      description={pageMeta.description}
      breadcrumbs={['Tổng quan', pageMeta.title]}
    >
      <ExecutiveFilterBar
        timeRange={timeRange}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        selectedProject={selectedProject}
        selectedWarehouse={selectedWarehouse}
        projects={projects}
        warehouses={asRows(warehouses)}
        onTimeRange={setTimeRange}
        onCustomStartDate={setCustomStartDate}
        onCustomEndDate={setCustomEndDate}
        onProject={setSelectedProject}
        onWarehouse={setSelectedWarehouse}
      />

      {dashboardTab === 'trends' ? (
        <ExecutiveTrendsWorkspace
          inventoryQty={inventoryQty}
          inventoryValue={inventoryValue}
          inboundValue={inboundValue}
          outboundValue={outboundValue}
          importExportTrend={importExportTrend}
          inventoryValueSeries={inventoryValueSeries}
          inventoryQtySeries={inventoryQtySeries}
          componentStatusRows={componentStatusRows}
          componentTotal={componentTotal}
          supplierSummary={supplierSummary}
          projects={filteredProjects}
          productionOrders={filteredProductionOrders as unknown as RecordRow[]}
        />
      ) : dashboardTab === 'activities' ? (
        <ExecutiveActivitiesWorkspace
          transactions={transactions}
          productionOrders={filteredProductionOrders as unknown as RecordRow[]}
          dispatchOrders={filteredDispatchOrders}
          qcCockpit={qcCockpit}
          projects={filteredProjects}
        />
      ) : dashboardTab === 'notifications' ? (
        <ExecutiveNotificationsWorkspace
          alerts={alerts}
          lowStockItems={lowStockItems}
          openNcr={openNcr}
          dispatchOrders={filteredDispatchOrders}
          projects={filteredProjects}
        />
      ) : (
        <>
          <section className="grid gap-2 md:grid-cols-4 xl:grid-cols-8">
            {kpis.map((kpi) => (
              <ExecutiveKpiCard key={`${kpi.domain}-${kpi.title}`} {...kpi} onClick={() => { setActiveDomain(kpi.domain); setDetailPage(1) }} />
            ))}
          </section>

          <section className="grid gap-2 xl:grid-cols-4">
            <ExecutiveBusinessCard
              title="Vật tư"
              description="Quản lý toàn bộ vật tư trong kho"
              Icon={Boxes}
              background={materialCardBg}
              accent="#1d7cff"
              stats={[
                { value: fmt(inventoryQty), label: 'Tổng tồn kho' },
                { value: fmt(inventoryValueByType.length), label: 'Chủng loại' },
                { value: compactCurrencyValue(inventoryValue), label: 'Giá trị tồn' },
              ]}
              trend={inventoryQtySeries.map((row) => row.value)}
              onOpen={() => navigate('/inventory/materials')}
            />
            <ExecutiveBusinessCard
              title="Nhà cung cấp"
              description="Theo dõi nhập hàng và đánh giá nhà cung cấp"
              Icon={PackagePlus}
              background={supplierCardBg}
              accent="#10b981"
              stats={[
                { value: fmt(supplierSummary?.total ?? 0), label: 'Nhà cung cấp' },
                { value: fmt(supplierSummary?.usedInInventory ?? 0), label: 'Có phát sinh' },
                { value: compactCurrencyValue(inboundValue), label: 'Giá trị nhập' },
              ]}
              trend={inboundValueSeries.map((row) => row.value)}
              onOpen={() => navigate('/suppliers')}
            />
            <ExecutiveBusinessCard
              title="Công trình"
              description="Quản lý vật tư theo công trình"
              Icon={Building2}
              background={projectCardBg}
              accent="#8b5cf6"
              stats={[
                { value: fmt(filteredProjects.length), label: 'Công trình' },
                { value: fmt(activeProjects), label: 'Đang thi công' },
                { value: compactCurrencyValue(projectContractValue), label: 'Giá trị dự án' },
              ]}
              trend={projectSeries.map((row) => row.value)}
              onOpen={() => navigate('/projects')}
            />
            <ExecutiveBusinessCard
              title="Cấu kiện"
              description="Quản lý sản xuất và tồn kho cấu kiện"
              Icon={Factory}
              background={componentCardBg}
              accent="#f59e0b"
              stats={[
                { value: fmt(componentTotal), label: 'Tổng số lượng' },
                { value: fmt(componentStatusRows.length), label: 'Trạng thái' },
                { value: fmt(componentReady), label: 'Sẵn sàng' },
              ]}
              trend={componentStatusRows.map((row) => row.value)}
              onOpen={() => navigate('/components/list')}
            />
          </section>

          <section className="grid gap-2 xl:grid-cols-[1.05fr_1.2fr_1.05fr]">
            <ExecutiveChartCard title="Giá trị tồn kho theo loại vật tư" onAction={() => setActiveWidget('inventory-type')}>
              <DonutChart centerLabel="Tổng" total={compactCurrencyValue(inventoryValue)} rows={inventoryValueByType} emptyTitle="Dữ liệu giá trị tồn kho theo loại vật tư chưa khả dụng" valueFormatter={compactCurrencyValue} />
            </ExecutiveChartCard>
            <ExecutiveChartCard title="Giá trị nhập - xuất" action="Chi tiết" onAction={() => setActiveWidget('import-export')}>
              <ImportExportMiniTrend rows={importExportTrend} />
            </ExecutiveChartCard>
            <ExecutiveChartCard title="Cấu kiện" onAction={() => setActiveWidget('components')}>
              <ComponentBarChart rows={componentStatusRows} total={componentTotal} />
            </ExecutiveChartCard>
          </section>

          <section className="grid gap-2 xl:grid-cols-3">
            <ExecutiveChartCard title="Dự án theo tiến độ" onAction={() => setActiveWidget('projects-progress')}>
              <DonutChart centerLabel="Dự án" total={fmt(filteredProjects.length)} rows={projectProgressDistribution(filteredProjects)} emptyTitle="Dữ liệu dự án chưa khả dụng" />
            </ExecutiveChartCard>
            <ExecutiveChartCard title="Trạng thái chất lượng QC" onAction={() => setActiveWidget('qc-status')}>
              <DonutChart centerLabel="Đạt" total={`${fmt(passRate, 1)}%`} rows={qcDistribution(qcCockpit)} emptyTitle="Dữ liệu QC chưa khả dụng" />
            </ExecutiveChartCard>
            <ExecutiveChartCard title="Giao hàng theo trạng thái" onAction={() => setActiveWidget('delivery-status')}>
              <DonutChart centerLabel="Chuyến" total={fmt(filteredDispatchOrders.length)} rows={dispatchDistribution(filteredDispatchOrders)} emptyTitle="Dữ liệu giao nhận chưa khả dụng" />
            </ExecutiveChartCard>
          </section>

          <section role="button" tabIndex={0} onClick={() => setActiveWidget('alerts')} onKeyDown={(event) => { if (event.key === 'Enter') setActiveWidget('alerts') }} className="cursor-pointer rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3 shadow-[0_20px_60px_rgba(8,47,73,0.18)] transition duration-300 hover:-translate-y-1 hover:border-cyan-300/35 hover:bg-slate-950/45 hover:shadow-cyan-500/10">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-200">Cảnh báo & rủi ro hoạt động</h2>
              <span className="text-[11px] text-slate-500">{alerts.length ? `${fmt(alerts.length)} cảnh báo từ dữ liệu thật` : 'Không có cảnh báo hiện tại'}</span>
            </div>
            <AlertSummaryStrip
              lowStockCount={lowStockItems.filter((item) => (num(item, 'currentStock') || num(item, 'quantity')) >= 0).length}
              negativeStockCount={lowStockItems.filter((item) => (num(item, 'currentStock') || num(item, 'quantity')) < 0).length}
              openNcr={openNcr}
              lateDispatchCount={lateDispatchCount(filteredDispatchOrders)}
            />
            {alerts.length ? <RiskTable rows={alerts} onOpen={() => setActiveWidget('alerts')} /> : <CockpitEmptyState title="Không có cảnh báo" description="Không phát hiện tồn kho thấp, tồn âm, NCR mở, chuyến trễ/hủy hoặc dự án bị chặn từ dữ liệu backend hiện tại." />}
          </section>
        </>
      )}
      {activeWidget ? (
        <DashboardWidgetModal
          widget={activeWidget}
          onClose={() => setActiveWidget(null)}
          inventoryValue={inventoryValue}
          inventoryRows={filteredInventoryRows}
          inventoryValueByType={inventoryValueByType}
          componentStatusRows={componentStatusRows}
          componentTotal={componentTotal}
          importExportTrend={importExportTrend}
          projects={filteredProjects}
          qcCockpit={qcCockpit}
          dispatchOrders={filteredDispatchOrders}
          alerts={alerts}
          lowStockItems={lowStockItems}
          openNcr={openNcr}
        />
      ) : null}
      {activeDomain ? (
        <ExecutiveAnalyticsPortal
          domain={activeDomain}
          context={domainContext}
          page={detailPage}
          onPageChange={setDetailPage}
          onDomainChange={(value) => {
            setActiveDomain(value)
            setDetailPage(1)
          }}
          onClose={() => {
            setActiveDomain(null)
            setDetailPage(1)
          }}
        />
      ) : null}
    </EnterpriseWorkspace>
  )
}

type KpiSpec = ReturnType<typeof buildKpi> & { onClick: () => void }

function buildKpi(domain: AnalyticsDomain, Icon: LucideIcon, title: string, value: string, unit: string, subtitle: string, tone: Tone, series: SeriesPoint[], deltaPercent?: number) {
  return { domain, Icon, title, value, unit, subtitle, tone, series, deltaPercent }
}

function ExecutiveKpiCard({ domain, Icon, title, value, unit, subtitle, series, deltaPercent, onClick }: KpiSpec) {
  return (
    <AnalyticsModuleKpiCard
      Icon={Icon}
      title={title}
      value={value}
      unit={unit}
      subtitle={subtitle}
      deltaPercent={deltaPercent}
      theme={domainThemes[domain]}
      series={series}
      onClick={onClick}
    />
  )
}

function ExecutiveBusinessCard({
  title,
  description,
  Icon,
  background,
  accent,
  stats,
  trend,
  onOpen,
}: {
  title: string
  description: string
  Icon: LucideIcon
  background: string
  accent: string
  stats: Array<{ value: string; label: string }>
  trend: number[]
  onOpen: () => void
}) {
  return (
    <section
      className="group relative min-h-[178px] overflow-hidden rounded-2xl border border-cyan-300/15 bg-slate-950/45 p-4 shadow-[0_20px_60px_rgba(8,47,73,0.16)] transition duration-300 hover:-translate-y-1 hover:border-cyan-300/35 hover:shadow-cyan-500/10"
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(7,17,31,0.94) 0%, rgba(7,17,31,0.82) 48%, rgba(7,17,31,0.60) 100%), url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(56,189,248,0.14),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0),rgba(15,23,42,0.34))]" />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-white">{title}</h3>
          <button type="button" onClick={onOpen} className="inline-flex items-center gap-1 text-xs font-medium text-blue-300 transition hover:text-blue-100">
            Xem chi tiết <ChevronRight size={13} />
          </button>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.08] shadow-[0_0_24px_rgba(37,99,235,0.18)]">
            <Icon size={21} style={{ color: accent }} />
          </div>
          <p className="min-w-0 text-sm font-medium text-slate-300">{description}</p>
        </div>
        <div className="mt-5 grid grid-cols-3 divide-x divide-cyan-300/10">
          {stats.map((stat) => (
            <div key={stat.label} className="px-2 first:pl-0 last:pr-0">
              <p className="truncate text-xl font-semibold text-white">{stat.value}</p>
              <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-auto">
          <Sparkline values={trend} stroke={accent} fill={`${accent}22`} />
        </div>
      </div>
    </section>
  )
}

function ExecutiveTrendsWorkspace({
  inventoryQty,
  inventoryValue,
  inboundValue,
  outboundValue,
  importExportTrend,
  inventoryValueSeries,
  inventoryQtySeries,
  componentStatusRows,
  componentTotal,
  supplierSummary,
  projects,
  productionOrders,
}: {
  inventoryQty: number
  inventoryValue: number
  inboundValue: number
  outboundValue: number
  importExportTrend: SeriesPoint[]
  inventoryValueSeries: SeriesPoint[]
  inventoryQtySeries: SeriesPoint[]
  componentStatusRows: DistributionPoint[]
  componentTotal: number
  supplierSummary?: SupplierCockpitSummary
  projects: ProjectRuntimeRow[]
  productionOrders: RecordRow[]
}) {
  const theme = domainThemes.inventory
  const materialForecast = forecastFromSeries(inventoryQtySeries, inventoryQty, 'Vật tư')
  const componentForecast = forecastFromDistribution(componentStatusRows, componentTotal, 'Cấu kiện')
  const supplierForecast = forecastFromSeries(importExportTrend.map((row) => ({ label: row.label, value: row.value })), inboundValue, 'Nhà cung cấp')
  const projectForecast = forecastFromSeries(projects.map((project) => ({ label: project.code, value: project.progress })), avg(projects.map((project) => project.progress)), 'Công trình')
  const productionForecast = forecastFromSeries(statusSeries(productionOrders), productionOrders.length, 'Kế hoạch SX')
  const riskRows = [
    materialForecast,
    componentForecast,
    supplierForecast,
    projectForecast,
    productionForecast,
  ]

  return (
    <div className="space-y-2">
      <section className="grid gap-2 xl:grid-cols-5">
        <ForecastCard title="Dự báo vật tư" forecast={materialForecast} tone="blue" note={`Giá trị tồn ${compactCurrencyValue(inventoryValue)}`} />
        <ForecastCard title="Dự báo cấu kiện" forecast={componentForecast} tone="amber" note={`${fmt(componentTotal)} cấu kiện theo trạng thái`} />
        <ForecastCard title="Dự báo nhà cung cấp" forecast={supplierForecast} tone="emerald" note={`${fmt(supplierSummary?.usedInInventory ?? 0)} NCC có phát sinh`} />
        <ForecastCard title="Dự báo công trình" forecast={projectForecast} tone="purple" note={`${fmt(projects.length)} công trình theo tiến độ`} />
        <ForecastCard title="Kế hoạch sản xuất" forecast={productionForecast} tone="cyan" note={`${fmt(productionOrders.length)} lệnh sản xuất`} />
      </section>

      <section className="grid gap-2 xl:grid-cols-[1.2fr_0.8fr]">
        <AnalyticsSection title="Xu hướng nhập - xuất vật tư" theme={theme} className="min-h-[360px]">
          <AnalyticsTrendChart rows={importExportTrend} theme={theme} variant="dual" />
        </AnalyticsSection>
        <AnalyticsSection title="Dự báo tồn vật tư" theme={theme} className="min-h-[360px]">
          <AnalyticsTrendChart rows={inventoryQtySeries} theme={theme} variant="line" />
        </AnalyticsSection>
      </section>

      <section className="grid gap-2 xl:grid-cols-3">
        <AnalyticsSection title="Cấu kiện theo trạng thái" theme={domainThemes.production}>
          <AnalyticsDistributionCard rows={componentStatusRows} theme={domainThemes.production} centerLabel="Cấu kiện" total={fmt(componentTotal)} variant="heatmap" emptyTitle="Dữ liệu cấu kiện chưa khả dụng" />
        </AnalyticsSection>
        <AnalyticsSection title="Công trình theo tiến độ" theme={domainThemes.projects}>
          <AnalyticsTrendChart rows={projects.map((project) => ({ label: project.code, value: project.progress }))} theme={domainThemes.projects} variant="bars" />
        </AnalyticsSection>
        <AnalyticsSection title="Kế hoạch sản xuất theo trạng thái" theme={domainThemes.production}>
          <AnalyticsDistributionCard rows={distributionByKey(productionOrders, 'status', ['quantity'], true)} theme={domainThemes.production} centerLabel="Lệnh" total={fmt(productionOrders.length)} variant="list" emptyTitle="Dữ liệu sản xuất chưa khả dụng" />
        </AnalyticsSection>
      </section>

      <SimpleDetailTable
        title="Bảng phân tích dự báo"
        headers={['Nhóm', 'Tình trạng', 'Cơ sở tính', 'Khuyến nghị']}
        rows={riskRows.map((row) => [row.label, row.status, row.basis, row.recommendation])}
      />
    </div>
  )
}

function ExecutiveActivitiesWorkspace({
  transactions,
  productionOrders,
  dispatchOrders,
  qcCockpit,
  projects,
}: {
  transactions: RecordRow[]
  productionOrders: RecordRow[]
  dispatchOrders: DispatchOrder[]
  qcCockpit?: QcCockpit
  projects: ProjectRuntimeRow[]
}) {
  const rows = recentActivityRows({ transactions, productionOrders, dispatchOrders, qcCockpit, projects })
  return (
    <div className="space-y-2">
      <section className="grid gap-2 xl:grid-cols-[1fr_360px]">
        <AnalyticsSection title="Dòng hoạt động vận hành" theme={domainThemes.inventory} className="min-h-[420px]">
          {rows.length ? <AnalyticsActivityPanel rows={rows.slice(0, 12)} /> : <CockpitEmptyState title="Chưa có hoạt động gần đây" description="Mở giao dịch hoặc lệnh vận hành để hệ thống hiển thị dòng hoạt động." />}
        </AnalyticsSection>
        <AnalyticsSection title="Tóm tắt nguồn sự kiện" theme={domainThemes.dispatch} className="min-h-[420px]">
          <AnalyticsDistributionCard rows={activityDistribution(rows)} theme={domainThemes.dispatch} centerLabel="Sự kiện" total={fmt(rows.length)} variant="list" emptyTitle="Chưa có sự kiện" />
        </AnalyticsSection>
      </section>
      <SimpleDetailTable
        title="Chi tiết hoạt động"
        headers={['Nguồn', 'Nội dung', 'Thời gian']}
        rows={rows.map((row) => [row.subtitle.split(' · ')[0] || 'Hệ thống', row.title, row.time]).slice(0, 40)}
      />
    </div>
  )
}

function ExecutiveNotificationsWorkspace({
  alerts,
  lowStockItems,
  openNcr,
  dispatchOrders,
  projects,
}: {
  alerts: AlertRow[]
  lowStockItems: RecordRow[]
  openNcr: number
  dispatchOrders: DispatchOrder[]
  projects: ProjectRuntimeRow[]
}) {
  const lowStockCount = lowStockItems.filter((item) => (num(item, 'currentStock') || num(item, 'quantity')) >= 0).length
  const negativeStockCount = lowStockItems.filter((item) => (num(item, 'currentStock') || num(item, 'quantity')) < 0).length
  const lateCount = lateDispatchCount(dispatchOrders)
  return (
    <div className="space-y-2">
      <AlertSummaryStrip lowStockCount={lowStockCount} negativeStockCount={negativeStockCount} openNcr={openNcr} lateDispatchCount={lateCount} />
      <section className="grid gap-2 xl:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-200">Thông báo cần xử lý</h2>
            <span className="text-[11px] text-slate-500">{alerts.length ? `${fmt(alerts.length)} cảnh báo` : 'Không có cảnh báo'}</span>
          </div>
          {alerts.length ? <RiskTable rows={alerts} /> : <CockpitEmptyState title="Không có thông báo" description="Không phát hiện tồn kho thấp, tồn âm, NCR mở, chuyến trễ/hủy hoặc dự án bị chặn từ dữ liệu backend hiện tại." />}
        </section>
        <AnalyticsSection title="Phân bổ mức độ" theme={domainThemes.qc}>
          <AnalyticsDistributionCard rows={notificationDistribution(alerts, projects)} theme={domainThemes.qc} centerLabel="Alert" total={fmt(alerts.length)} variant="heatmap" emptyTitle="Không có cảnh báo" />
        </AnalyticsSection>
      </section>
      <LowStockDetailTable rows={lowStockItems} />
    </div>
  )
}

type ForecastSignal = {
  label: string
  status: string
  basis: string
  recommendation: string
  delta: number
}

function ForecastCard({ title, forecast, note, tone }: { title: string; forecast: ForecastSignal; note: string; tone: Tone }) {
  const toneClasses: Record<Tone, string> = {
    blue: 'border-blue-400/25 bg-blue-500/10 text-blue-200',
    emerald: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200',
    cyan: 'border-cyan-400/25 bg-cyan-500/10 text-cyan-200',
    amber: 'border-amber-400/25 bg-amber-500/10 text-amber-200',
    red: 'border-red-400/25 bg-red-500/10 text-red-200',
    purple: 'border-purple-400/25 bg-purple-500/10 text-purple-200',
    indigo: 'border-indigo-400/25 bg-indigo-500/10 text-indigo-200',
    orange: 'border-orange-400/25 bg-orange-500/10 text-orange-200',
  }
  const riskClass = forecast.status.includes('thiếu') || forecast.status.includes('trễ') || forecast.status.includes('giảm')
    ? 'text-red-300'
    : forecast.status.includes('dư') || forecast.status.includes('tăng')
      ? 'text-emerald-300'
      : 'text-slate-300'
  return (
    <section className={`min-h-[150px] rounded-2xl border p-3 shadow-[0_18px_50px_rgba(2,8,23,0.22)] ${toneClasses[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.13em] text-white">{title}</h3>
        <span className={`text-xs font-semibold ${riskClass}`}>{forecast.status}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-white">{forecast.delta > 0 ? '+' : ''}{fmt(forecast.delta, 1)}%</p>
      <p className="mt-1 text-xs font-medium text-slate-400">{note}</p>
      <p className="mt-3 text-xs leading-relaxed text-slate-300">{forecast.recommendation}</p>
    </section>
  )
}

function forecastFromSeries(series: SeriesPoint[], current: number, label: string): ForecastSignal {
  const values = series.map((row) => row.value).filter((value) => Number.isFinite(value))
  if (values.length < 2) {
    return {
      label,
      status: 'Chưa đủ dữ liệu',
      basis: 'Cần ít nhất hai điểm dữ liệu thật để tính xu hướng.',
      recommendation: 'Tiếp tục ghi nhận vận hành; chưa đưa ra dự báo.',
      delta: 0,
    }
  }
  const delta = deltaPercent(series) ?? 0
  const status = delta < -8 ? 'Có nguy cơ thiếu / trễ' : delta > 12 ? 'Có khả năng dư / tăng tải' : 'Ổn định'
  const recommendation = delta < -8
    ? `Theo dõi ${label.toLowerCase()} vì xu hướng đang giảm rõ.`
    : delta > 12
      ? `Kiểm tra sức chứa và kế hoạch vì ${label.toLowerCase()} đang tăng nhanh.`
      : `${label} đang trong vùng ổn định theo dữ liệu hiện có.`
  return {
    label,
    status,
    basis: `${values.length} điểm dữ liệu, giá trị hiện tại ${fmt(current, 1)}.`,
    recommendation,
    delta,
  }
}

function forecastFromDistribution(rows: DistributionPoint[], total: number, label: string): ForecastSignal {
  if (!rows.length || total <= 0) {
    return {
      label,
      status: 'Chưa đủ dữ liệu',
      basis: 'Components dashboard chưa trả phân bổ trạng thái.',
      recommendation: 'Chưa đưa ra dự báo cấu kiện.',
      delta: 0,
    }
  }
  const ready = componentStatusValue(rows, 'Sẵn sàng')
  const producing = rows.filter((row) => ['Đang cắt', 'Đang hàn', 'Đang sơn'].includes(row.label)).reduce((sumValue, row) => sumValue + row.value, 0)
  const readiness = (ready / Math.max(1, total)) * 100
  const pressure = (producing / Math.max(1, total)) * 100
  const status = readiness < 20 && pressure < 35 ? 'Có nguy cơ thiếu' : readiness > 55 ? 'Có khả năng dư' : 'Ổn định'
  return {
    label,
    status,
    basis: `${fmt(total)} cấu kiện, ${fmt(ready)} sẵn sàng, ${fmt(producing)} đang sản xuất.`,
    recommendation: status === 'Có nguy cơ thiếu'
      ? 'Ưu tiên kiểm tra queue sản xuất và lịch QC để tránh thiếu cấu kiện giao công trình.'
      : status === 'Có khả năng dư'
        ? 'Kiểm tra kế hoạch bãi và giao nhận vì lượng cấu kiện sẵn sàng đang cao.'
        : 'Cấu kiện đang cân bằng giữa sản xuất và sẵn sàng.',
    delta: readiness - pressure,
  }
}

function recentActivityRows({ transactions, productionOrders, dispatchOrders, qcCockpit, projects }: {
  transactions: RecordRow[]
  productionOrders: RecordRow[]
  dispatchOrders: DispatchOrder[]
  qcCockpit?: QcCockpit
  projects: ProjectRuntimeRow[]
}): AnalyticsActivityRow[] {
  return [
    ...transactions.slice(0, 12).map((row) => ({
      title: str(row.transactionNo) || str(row.code) || 'Giao dịch kho',
      subtitle: `Kho · ${transactionType(row) || 'Giao dịch'}`,
      time: dateTime(rowDateString(row)),
    })),
    ...productionOrders.slice(0, 10).map((row) => ({
      title: str(row.orderNo) || str(row.code) || 'Lệnh sản xuất',
      subtitle: `Sản xuất · ${productionStatusLabel(str(row.status))}`,
      time: dateTime(str(row.updatedAt) || str(row.createdAt)),
    })),
    ...(qcCockpit?.inspections ?? []).slice(0, 8).map((row) => ({
      title: row.inspectionNo,
      subtitle: `QC · ${qcStatusLabel(row.status)}`,
      time: dateTime(row.date),
    })),
    ...dispatchOrders.slice(0, 10).map((row) => ({
      title: row.code,
      subtitle: `Giao nhận · ${statusLabel[row.status]}`,
      time: dateTime(row.updatedAt || row.createdAt || row.plannedAt),
    })),
    ...projects.slice(0, 8).map((row) => ({
      title: row.name,
      subtitle: `Công trình · ${projectStatusLabel(row.status)}`,
      time: dateTime(row.updatedAt),
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
}

function activityDistribution(rows: AnalyticsActivityRow[]): DistributionPoint[] {
  const map = new Map<string, number>()
  rows.forEach((row) => {
    const label = row.subtitle.split(' · ')[0] || 'Khác'
    map.set(label, (map.get(label) ?? 0) + 1)
  })
  return Array.from(map.entries()).map(([label, value], index) => ({ label, value, color: colorAt(index) }))
}

function notificationDistribution(alerts: AlertRow[], projects: ProjectRuntimeRow[]): DistributionPoint[] {
  const rows = distributionByKey(alerts as unknown as RecordRow[], 'domain', ['value'], true)
  const blockedProjects = projects.filter((project) => project.delayedOrders > 0).length
  if (blockedProjects > 0 && !rows.some((row) => row.label === 'projects')) {
    rows.push({ label: 'projects', value: blockedProjects, color: colorAt(rows.length) })
  }
  return rows.map((row) => ({ ...row, label: alertDomainLabel(row.label) }))
}

function alertDomainLabel(value: string) {
  const labels: Record<string, string> = {
    inventory: 'Kho vật tư',
    qc: 'QC',
    dispatch: 'Giao nhận',
    projects: 'Công trình',
  }
  return labels[value] ?? value
}

function ExecutiveFilterBar({
  timeRange,
  customStartDate,
  customEndDate,
  selectedProject,
  selectedWarehouse,
  projects,
  warehouses,
  onTimeRange,
  onCustomStartDate,
  onCustomEndDate,
  onProject,
  onWarehouse,
}: {
  timeRange: TimeRange
  customStartDate: string
  customEndDate: string
  selectedProject: string
  selectedWarehouse: string
  projects: ProjectRuntimeRow[]
  warehouses: RecordRow[]
  onTimeRange: (value: TimeRange) => void
  onCustomStartDate: (value: string) => void
  onCustomEndDate: (value: string) => void
  onProject: (value: string) => void
  onWarehouse: (value: string) => void
}) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-2">
      <div className="flex flex-wrap items-center gap-1">
        <span className="mr-1 flex items-center gap-1 text-xs font-semibold text-slate-400"><Filter size={13} className="text-cyan-300" /> Bộ lọc</span>
        {[
          { id: 'TODAY', label: 'Hôm nay' },
          { id: '7D', label: '7 ngày' },
          { id: '30D', label: '30 ngày' },
          { id: 'CUSTOM', label: 'Chọn ngày' },
        ].map((chip) => (
          <button key={chip.id} type="button" onClick={() => onTimeRange(chip.id as TimeRange)} className={`h-8 rounded-xl border px-3 text-xs transition ${timeRange === chip.id ? 'border-cyan-400/45 bg-cyan-500/15 text-cyan-200' : 'border-white/10 bg-white/[0.04] text-slate-400 hover:bg-white/[0.07]'}`}>
            {chip.label}
          </button>
        ))}
        {timeRange === 'CUSTOM' ? (
          <div className="ml-1 flex items-center gap-1">
            <input type="date" value={customStartDate} onChange={(event) => onCustomStartDate(event.target.value)} className="h-8 rounded-xl border border-white/10 bg-slate-950/60 px-2 text-xs text-slate-200 outline-none focus:border-cyan-400" />
            <span className="text-xs text-slate-500">đến</span>
            <input type="date" value={customEndDate} onChange={(event) => onCustomEndDate(event.target.value)} className="h-8 rounded-xl border border-white/10 bg-slate-950/60 px-2 text-xs text-slate-200 outline-none focus:border-cyan-400" />
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select value={selectedProject} onChange={(event) => onProject(event.target.value)} className="h-8 rounded-xl border border-white/10 bg-slate-950/60 px-3 text-xs text-slate-200 outline-none focus:border-cyan-400">
          <option value="all">Tất cả dự án</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        <select value={selectedWarehouse} onChange={(event) => onWarehouse(event.target.value)} className="h-8 rounded-xl border border-white/10 bg-slate-950/60 px-3 text-xs text-slate-200 outline-none focus:border-cyan-400">
          <option value="all">Tất cả kho</option>
          {warehouses.map((warehouse) => <option key={str(warehouse.id) || str(warehouse.code) || str(warehouse.name)} value={str(warehouse.id) || str(warehouse.name)}>{str(warehouse.name) || str(warehouse.code)}</option>)}
        </select>
      </div>
    </section>
  )
}

function ExecutiveChartCard({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: React.ReactNode }) {
  return (
    <section
      role={onAction ? 'button' : undefined}
      tabIndex={onAction ? 0 : undefined}
      onClick={onAction}
      onKeyDown={(event) => { if (onAction && event.key === 'Enter') onAction() }}
      className={`min-h-[240px] rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-4 shadow-[0_20px_60px_rgba(8,47,73,0.15)] transition duration-300 ${onAction ? 'cursor-pointer hover:-translate-y-1 hover:border-cyan-300/35 hover:bg-slate-950/45 hover:shadow-cyan-500/10' : ''}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-slate-100">{title}</h3>
        {action && onAction ? <button type="button" onClick={(event) => { event.stopPropagation(); onAction() }} className="inline-flex items-center gap-1 text-xs text-cyan-300 transition hover:text-cyan-100">{action}<ChevronRight size={13} /></button> : null}
      </div>
      <div className="h-[180px]">{children}</div>
    </section>
  )
}

function ExecutiveAnalyticsPortal({ domain, context, page, onPageChange, onDomainChange, onClose }: { domain: AnalyticsDomain; context: DomainContext; page: number; onPageChange: (page: number) => void; onDomainChange: (domain: AnalyticsDomain) => void; onClose: () => void }) {
  const spec = buildAnalyticsSpec(domain, context)
  const theme = calmTheme(domainThemes[domain])
  const pageSize = 8
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/72 p-4 backdrop-blur-sm">
      <section className="grid max-h-[90vh] w-full max-w-[1360px] overflow-hidden rounded-3xl border border-cyan-300/20 bg-[#07111f] text-slate-100 shadow-[0_32px_120px_rgba(2,8,23,0.54)] xl:grid-cols-[240px_1fr]">
        <aside className="max-h-[90vh] overflow-y-auto border-r border-cyan-300/10 bg-slate-950/55 p-4">
          <button type="button" onClick={onClose} className="mb-4 inline-flex h-9 items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-500/8 px-3 text-xs font-medium text-cyan-100 transition hover:bg-cyan-500/14">
            <ArrowLeft size={14} /> Quay lại
          </button>
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-cyan-300">Executive BI</p>
            {domainTabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button key={tab.id} type="button" onClick={() => onDomainChange(tab.id)} className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs ${tab.id === domain ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100' : 'border-white/10 bg-white/[0.03] text-slate-400'}`}>
                  <Icon size={14} /> {tab.label}
                </button>
              )
            })}
          </div>
          <div className={`mt-4 rounded-2xl border ${theme.border} bg-gradient-to-br ${theme.panel} p-3`}>
            <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Tổng quan</h3>
            <div className="mt-3 space-y-2">
              {spec.summary.map((row) => <SummaryLine key={row.label} label={row.label} value={row.value} />)}
            </div>
          </div>
        </aside>
        <main className="max-h-[90vh] overflow-y-auto p-4">
          <AnalyticsHeader
            Icon={spec.icon}
            theme={theme}
            eyebrow={spec.eyebrow}
            title={spec.title}
            subtitle={spec.subtitle}
            actions={
              <div className="flex items-center gap-2">
                <span className="rounded-xl border border-white/10 bg-slate-950/55 px-3 py-2 text-xs font-medium text-slate-400">{dateTime(new Date().toISOString())}</span>
                <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08]"><X size={16} /></button>
              </div>
            }
          />
          <DomainAnalyticsLayout spec={spec} domain={domain} page={page} pageSize={pageSize} onPageChange={onPageChange} />
        </main>
      </section>
    </div>
  )
}

type AnalyticsSpec = ReturnType<typeof buildAnalyticsSpec>

function DomainAnalyticsLayout({ spec, domain, page, pageSize, onPageChange }: { spec: AnalyticsSpec; domain: AnalyticsDomain; page: number; pageSize: number; onPageChange: (page: number) => void }) {
  const theme = calmTheme(domainThemes[domain])
  const trendVariant: Record<AnalyticsDomain, 'bars' | 'line' | 'dual'> = {
    inventory: 'line',
    inbound: 'dual',
    outbound: 'bars',
    production: 'bars',
    qc: 'line',
    projects: 'bars',
    dispatch: 'dual',
  }
  const distributionVariant: Record<AnalyticsDomain, 'donut' | 'heatmap' | 'list'> = {
    inventory: 'heatmap',
    inbound: 'list',
    outbound: 'donut',
    production: 'heatmap',
    qc: 'donut',
    projects: 'list',
    dispatch: 'heatmap',
  }

  if (domain === 'inventory') {
    return (
      <div className="space-y-3">
        <AnalyticsMetricGrid items={spec.kpis} theme={theme} />
        <section className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
          <AnalyticsSection title="Sức chứa và sử dụng kho" theme={theme} className="min-h-[400px]">
            <AnalyticsDistributionCard rows={spec.distribution} theme={theme} centerLabel="Kho" total={spec.distributionTotal} variant="donut" />
          </AnalyticsSection>
          <AnalyticsSection title="Phân tích ABC theo giá trị tồn" theme={theme} className="min-h-[400px]">
            <AnalyticsDistributionCard rows={spec.matrix} theme={theme} centerLabel="ABC" total={spec.summary[0]?.value ?? ''} variant="heatmap" />
          </AnalyticsSection>
        </section>
        <section className="grid gap-3 xl:grid-cols-[0.9fr_1.1fr_360px]">
          <AnalyticsSection title="Tuổi tồn kho" theme={theme} className="min-h-[300px]">
            <AnalyticsDistributionCard rows={spec.secondaryDistribution} theme={theme} centerLabel="Aging" total={spec.summary[2]?.value ?? ''} variant="list" />
          </AnalyticsSection>
          <AnalyticsSection title={spec.trendTitle} theme={theme} className="min-h-[330px]">
            <AnalyticsTrendChart rows={analyticsTrendRows(spec)} theme={theme} variant="line" />
          </AnalyticsSection>
          <AnalyticsSection title={spec.rankingTitle} theme={theme} className="min-h-[300px]">
            <AnalyticsRankingCard rows={spec.ranking} theme={theme} valueFormatter={(value) => fmt(value, 1)} />
          </AnalyticsSection>
        </section>
        <AnalyticsTable title={spec.tableTitle} headers={spec.tableHeaders} rows={spec.tableRows} page={page} pageSize={pageSize} onPageChange={onPageChange} />
      </div>
    )
  }

  if (domain === 'inbound') {
    return (
      <div className="space-y-3">
        <AnalyticsMetricGrid items={spec.kpis} theme={theme} />
        <section className="grid gap-3 xl:grid-cols-[360px_1fr]">
          <AnalyticsSection title="Nhập theo nhà cung cấp" theme={theme} className="min-h-[410px]">
            <AnalyticsRankingCard rows={spec.ranking} theme={theme} valueFormatter={(value) => fmt(value, 1)} />
          </AnalyticsSection>
          <AnalyticsSection title="Xu hướng nhập hàng" theme={theme} className="min-h-[410px]">
            <AnalyticsTrendChart rows={analyticsTrendRows(spec)} theme={theme} variant="dual" />
          </AnalyticsSection>
        </section>
        <section className="grid gap-3 xl:grid-cols-[1fr_1fr_360px]">
          <AnalyticsSection title="Lead time nhập hàng" theme={theme}>
            <AnalyticsDistributionCard rows={spec.secondaryDistribution} theme={theme} centerLabel="Lead" total="—" variant="list" emptyTitle="Dữ liệu lead time chưa khả dụng" />
          </AnalyticsSection>
          <AnalyticsSection title="Kho nhận hàng" theme={theme}>
            <AnalyticsDistributionCard rows={spec.distribution} theme={theme} centerLabel="Kho" total={spec.distributionTotal} variant="list" />
          </AnalyticsSection>
          <AnalyticsSection title="Phiếu nhập gần đây" theme={theme}>
            <AnalyticsActivityPanel rows={spec.activities} />
          </AnalyticsSection>
        </section>
        <AnalyticsTable title={spec.tableTitle} headers={spec.tableHeaders} rows={spec.tableRows} page={page} pageSize={pageSize} onPageChange={onPageChange} />
      </div>
    )
  }

  if (domain === 'outbound') {
    return (
      <div className="space-y-3">
        <AnalyticsMetricGrid items={spec.kpis} theme={theme} />
        <section className="grid gap-3 xl:grid-cols-[1fr_420px]">
          <AnalyticsSection title="Dòng giá trị xuất kho" theme={theme} className="min-h-[410px]">
            <AnalyticsTrendChart rows={analyticsTrendRows(spec)} theme={theme} variant="bars" />
          </AnalyticsSection>
          <AnalyticsSection title="Phân bổ theo dự án/khách hàng" theme={theme} className="min-h-[410px]">
            <AnalyticsDistributionCard rows={spec.distribution} theme={theme} centerLabel="Xuất" total={spec.distributionTotal} variant="donut" />
          </AnalyticsSection>
        </section>
        <section className="grid gap-3 xl:grid-cols-[360px_1fr_360px]">
          <AnalyticsSection title="Sẵn sàng vận chuyển" theme={theme}>
            <AnalyticsDistributionCard rows={spec.secondaryDistribution} theme={theme} centerLabel="OTD" total="—" variant="heatmap" emptyTitle="Dữ liệu carrier/OTD chưa khả dụng" />
          </AnalyticsSection>
          <AnalyticsSection title={spec.rankingTitle} theme={theme}>
            <AnalyticsRankingCard rows={spec.ranking} theme={theme} valueFormatter={(value) => fmt(value, 1)} />
          </AnalyticsSection>
          <AnalyticsSection title="Hoạt động xuất kho gần đây" theme={theme}>
            <AnalyticsActivityPanel rows={spec.activities} />
          </AnalyticsSection>
        </section>
        <AnalyticsTable title={spec.tableTitle} headers={spec.tableHeaders} rows={spec.tableRows} page={page} pageSize={pageSize} onPageChange={onPageChange} />
      </div>
    )
  }

  if (domain === 'production') {
    return (
      <div className="space-y-3">
        <AnalyticsMetricGrid items={spec.kpis} theme={theme} />
        <section className="grid gap-3 xl:grid-cols-[1fr_1fr]">
          <AnalyticsSection title="Công suất và trạng thái lệnh" theme={theme} className="min-h-[410px]">
            <AnalyticsDistributionCard rows={spec.distribution} theme={theme} centerLabel="MO" total={spec.distributionTotal} variant="heatmap" />
          </AnalyticsSection>
          <AnalyticsSection title="Xu hướng sản lượng xưởng" theme={theme} className="min-h-[410px]">
            <AnalyticsTrendChart rows={analyticsTrendRows(spec)} theme={theme} variant="bars" />
          </AnalyticsSection>
        </section>
        <section className="grid gap-3 xl:grid-cols-[1fr_360px_360px]">
          <AnalyticsSection title="Mức sẵn sàng máy" theme={theme}>
            <AnalyticsDistributionCard rows={spec.secondaryDistribution} theme={theme} centerLabel="Máy" total="—" variant="list" emptyTitle="Dữ liệu sử dụng máy chưa khả dụng" />
          </AnalyticsSection>
          <AnalyticsSection title={spec.rankingTitle} theme={theme}>
            <AnalyticsRankingCard rows={spec.ranking} theme={theme} valueFormatter={(value) => fmt(value, 1)} />
          </AnalyticsSection>
          <AnalyticsSection title="Hoạt động sản xuất" theme={theme}>
            <AnalyticsActivityPanel rows={spec.activities} />
          </AnalyticsSection>
        </section>
        <AnalyticsTable title={spec.tableTitle} headers={spec.tableHeaders} rows={spec.tableRows} page={page} pageSize={pageSize} onPageChange={onPageChange} />
      </div>
    )
  }

  if (domain === 'qc') {
    return (
      <div className="space-y-3">
        <AnalyticsMetricGrid items={spec.kpis} theme={theme} />
        <section className="grid gap-3 xl:grid-cols-[420px_1fr]">
          <AnalyticsSection title="Pareto NCR / mức độ lỗi" theme={theme} className="min-h-[410px]">
            <AnalyticsRankingCard rows={spec.ranking} theme={theme} valueFormatter={(value) => `${fmt(value, 1)}%`} />
          </AnalyticsSection>
          <AnalyticsSection title="Xu hướng chất lượng" theme={theme} className="min-h-[410px]">
            <AnalyticsTrendChart rows={analyticsTrendRows(spec)} theme={theme} variant="line" />
          </AnalyticsSection>
        </section>
        <section className="grid gap-3 xl:grid-cols-[1fr_1fr_360px]">
          <AnalyticsSection title="Phân bổ kết quả QC" theme={theme}>
            <AnalyticsDistributionCard rows={spec.distribution} theme={theme} centerLabel="QC" total={spec.distributionTotal} variant="donut" />
          </AnalyticsSection>
          <AnalyticsSection title="Root cause" theme={theme}>
            <AnalyticsDistributionCard rows={spec.secondaryDistribution} theme={theme} centerLabel="Cause" total="—" variant="heatmap" emptyTitle="Dữ liệu root cause chưa khả dụng" />
          </AnalyticsSection>
          <AnalyticsSection title="Hoạt động kiểm tra" theme={theme}>
            <AnalyticsActivityPanel rows={spec.activities} />
          </AnalyticsSection>
        </section>
        <AnalyticsTable title={spec.tableTitle} headers={spec.tableHeaders} rows={spec.tableRows} page={page} pageSize={pageSize} onPageChange={onPageChange} />
      </div>
    )
  }

  if (domain === 'projects') {
    return (
      <div className="space-y-3">
        <AnalyticsMetricGrid items={spec.kpis} theme={theme} />
        <section className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
          <AnalyticsSection title="Tiến độ mốc dự án" theme={theme} className="min-h-[410px]">
            <AnalyticsTrendChart rows={analyticsTrendRows(spec)} theme={theme} variant="bars" />
          </AnalyticsSection>
          <AnalyticsSection title="Xếp hạng ngân sách / hợp đồng" theme={theme} className="min-h-[410px]">
            <AnalyticsRankingCard rows={spec.ranking} theme={theme} valueFormatter={(value) => money(value)} />
          </AnalyticsSection>
        </section>
        <section className="grid gap-3 xl:grid-cols-[1fr_1fr_360px]">
          <AnalyticsSection title="Rủi ro chậm tiến độ" theme={theme}>
            <AnalyticsDistributionCard rows={spec.matrix} theme={theme} centerLabel="Delay" total={spec.summary[1]?.value ?? ''} variant="heatmap" />
          </AnalyticsSection>
          <AnalyticsSection title="Tải cấu kiện / nguồn lực" theme={theme}>
            <AnalyticsDistributionCard rows={spec.secondaryDistribution} theme={theme} centerLabel="Resource" total={spec.summary[2]?.value ?? ''} variant="list" />
          </AnalyticsSection>
          <AnalyticsSection title="Hoạt động dự án" theme={theme}>
            <AnalyticsActivityPanel rows={spec.activities} />
          </AnalyticsSection>
        </section>
        <AnalyticsTable title={spec.tableTitle} headers={spec.tableHeaders} rows={spec.tableRows} page={page} pageSize={pageSize} onPageChange={onPageChange} />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <AnalyticsMetricGrid items={spec.kpis} theme={theme} />
      <section className="grid gap-3 xl:grid-cols-[380px_1fr_380px]">
        <AnalyticsSection title="Bảng chuyến hôm nay" theme={theme} className="min-h-[410px]">
          <AnalyticsActivityPanel rows={spec.activities} />
        </AnalyticsSection>
        <AnalyticsSection title="Luồng tuyến / điều phối" theme={theme} className="min-h-[410px]">
          <AnalyticsTrendChart rows={analyticsTrendRows(spec)} theme={theme} variant={trendVariant[domain]} />
        </AnalyticsSection>
        <AnalyticsSection title="Trạng thái giao hàng" theme={theme} className="min-h-[410px]">
          <AnalyticsDistributionCard rows={spec.distribution} theme={theme} centerLabel="Chuyến" total={spec.distributionTotal} variant={distributionVariant[domain]} />
        </AnalyticsSection>
      </section>
      <section className="grid gap-3 xl:grid-cols-[1fr_1fr]">
        <AnalyticsSection title="Sử dụng xe" theme={theme}>
          <AnalyticsRankingCard rows={spec.ranking} theme={theme} valueFormatter={(value) => fmt(value, 1)} />
        </AnalyticsSection>
        <AnalyticsSection title="Sẵn sàng nhà vận chuyển" theme={theme}>
          <AnalyticsDistributionCard rows={spec.secondaryDistribution} theme={theme} centerLabel="Carrier" total="—" variant="list" emptyTitle="Dữ liệu carrier chưa khả dụng" />
        </AnalyticsSection>
      </section>
      <AnalyticsTable title={spec.tableTitle} headers={spec.tableHeaders} rows={spec.tableRows} page={page} pageSize={pageSize} onPageChange={onPageChange} />
    </div>
  )
}

function analyticsTrendRows(spec: AnalyticsSpec): SeriesPoint[] {
  if (spec.trend.length) return spec.trend
  if (spec.ranking.length) return spec.ranking.slice(0, 12)
  if (spec.distribution.length) return spec.distribution.slice(0, 12).map((row) => ({ label: row.label, value: row.value }))
  if (spec.matrix.length) return spec.matrix.slice(0, 12).map((row) => ({ label: row.label, value: row.value }))
  return []
}

function calmTheme(theme: DomainTheme): DomainTheme {
  return {
    ...theme,
    border: 'border-cyan-300/18',
    glow: 'hover:shadow-cyan-950/20',
    text: 'text-cyan-200',
    soft: 'bg-cyan-500/8',
    panel: 'from-slate-900/55 via-slate-950/35 to-slate-950/55',
    gradient: 'from-cyan-300 via-slate-200 to-blue-200',
    halo: 'rgba(14,165,233,0.14)',
    fill: 'rgba(14,165,233,0.10)',
  }
}

type DomainContext = {
  inventoryRows: RecordRow[]
  inventoryItems: RecordRow[]
  transactions: RecordRow[]
  inboundTransactions: RecordRow[]
  outboundTransactions: RecordRow[]
  productionOrders: RecordRow[]
  projects: ProjectRuntimeRow[]
  dispatchOrders: DispatchOrder[]
  dispatchDashboard?: Awaited<ReturnType<typeof getDispatchDashboard>>
  qcCockpit?: QcCockpit
  inventoryValue: number
  inventoryQty: number
  inboundValue: number
  outboundValue: number
  runningProduction: number
  activeProjects: number
  dispatchActive: number
  passRate: number
  openNcr: number
}

function buildAnalyticsSpec(domain: AnalyticsDomain, context: DomainContext) {
  const base = {
    inventory: {
      icon: Warehouse,
      tone: 'purple' as Tone,
      eyebrow: 'Phân tích tồn kho',
      title: 'Phân tích tồn kho',
      subtitle: 'Giá trị, số lượng, phân bổ kho và nhóm vật tư.',
      kpis: [
        { label: 'Giá trị tồn hiện tại', value: money(context.inventoryValue), note: 'Từ Inventory overview/audit' },
        { label: 'Số lượng tồn', value: fmt(context.inventoryQty), note: 'Tổng quantity hiện có' },
        { label: 'Vật tư cảnh báo', value: fmt(context.inventoryItems.filter((item) => str(item.status) === 'LOW_STOCK' || str(item.status) === 'CRITICAL').length), note: 'Theo trạng thái tồn' },
        { label: 'Kho có dữ liệu', value: fmt(uniqueCount(context.inventoryRows, 'warehouse')), note: 'Nguồn Inventory audit' },
        { label: 'Giao dịch gần nhất', value: fmt(context.transactions.length), note: 'Mẫu đọc hiện tại' },
      ],
      trendTitle: 'Biến động tồn kho theo giao dịch',
      trend: seriesByMonth(context.transactions, ['totalAmount', 'amount', 'value', 'totalValue', 'quantity'], transactionAmount),
      distributionTitle: 'Cơ cấu tồn kho theo kho',
      distributionTotal: money(context.inventoryValue),
      distribution: distributionByKey(context.inventoryRows, 'warehouse', ['stockValue', 'inventoryValue', 'totalValue']),
      rankingTitle: 'Top vật tư theo tồn',
      ranking: topByKey(context.inventoryItems, 'name', ['quantity', 'currentStock']),
      matrixTitle: 'ABC tồn kho',
      matrix: abcDistribution(context.inventoryItems),
      secondaryDistribution: inventoryAgingDistribution(context.inventoryItems),
      activities: context.transactions.slice(0, 8).map(transactionActivity),
      tableTitle: 'Chi tiết vật tư tồn kho',
      tableHeaders: ['Mã', 'Tên vật tư', 'Kho', 'Số lượng', 'Trạng thái'],
      tableRows: context.inventoryItems.map((item) => [str(item.code), str(item.name), str(item.warehouse), fmt(num(item, 'quantity') || num(item, 'currentStock')), str(item.status)]),
      summary: [
        { label: 'Giá trị tồn', value: money(context.inventoryValue) },
        { label: 'Số lượng', value: fmt(context.inventoryQty) },
        { label: 'Vật tư', value: fmt(context.inventoryItems.length) },
      ],
    },
    inbound: flowSpec('Phân tích nhập kho', 'Phân tích nhập kho', 'Dòng nhập vật tư theo phiếu và nhà cung cấp.', 'emerald', PackagePlus, context.inboundTransactions, context.inboundValue),
    outbound: flowSpec('Phân tích xuất kho', 'Phân tích xuất kho', 'Dòng xuất vật tư theo dự án và kho.', 'orange', Truck, context.outboundTransactions, context.outboundValue),
    production: {
      icon: Factory,
      tone: 'cyan' as Tone,
      eyebrow: 'Phân tích sản xuất',
      title: 'Phân tích sản xuất',
      subtitle: 'Lệnh sản xuất, trạng thái vận hành và backlog xưởng.',
      kpis: [
        { label: 'Lệnh đang chạy', value: fmt(context.runningProduction), note: 'Đang chạy / đang thực hiện / đã phát hành' },
        { label: 'Tổng lệnh', value: fmt(context.productionOrders.length), note: 'Production API' },
        { label: 'Hoàn thành', value: fmt(context.productionOrders.filter((row) => str(row.status) === 'COMPLETED').length), note: 'Theo trạng thái MO' },
        { label: 'Trễ/Cảnh báo', value: fmt(context.productionOrders.filter((row) => str(row.status).includes('DELAY')).length), note: 'Nếu backend đánh dấu' },
        { label: 'Dự án liên quan', value: fmt(uniqueCount(context.productionOrders, 'projectId')), note: 'Theo lệnh sản xuất' },
      ],
      trendTitle: 'Lệnh sản xuất theo thời gian',
      trend: seriesByMonth(context.productionOrders, ['quantity', 'plannedQty', 'completedQty']),
      distributionTitle: 'Trạng thái sản xuất',
      distributionTotal: fmt(context.productionOrders.length),
      distribution: distributionByKey(context.productionOrders, 'status', ['quantity', 'plannedQty', 'completedQty'], true),
      secondaryDistribution: [],
      rankingTitle: 'Top lệnh theo sản lượng',
      ranking: topByKey(context.productionOrders, 'orderNo', ['quantity', 'plannedQty', 'completedQty']),
      matrixTitle: 'Ma trận trạng thái',
      matrix: distributionByKey(context.productionOrders, 'status', ['quantity', 'plannedQty'], true),
      activities: context.productionOrders.slice(0, 8).map((row) => ({ title: str(row.orderNo) || str(row.code) || 'Lệnh sản xuất', subtitle: productionStatusLabel(str(row.status)), time: dateTime(str(row.updatedAt) || str(row.createdAt)) })),
      tableTitle: 'Danh sách lệnh sản xuất',
      tableHeaders: ['Mã lệnh', 'Tên', 'Trạng thái', 'Số lượng', 'Cập nhật'],
      tableRows: context.productionOrders.map((row) => [str(row.orderNo) || str(row.code), str(row.title) || str(row.name), productionStatusLabel(str(row.status)), fmt(num(row, 'quantity') || num(row, 'plannedQty')), dateTime(str(row.updatedAt) || str(row.createdAt))]),
      summary: [
        { label: 'Đang chạy', value: fmt(context.runningProduction) },
        { label: 'Tổng lệnh', value: fmt(context.productionOrders.length) },
        { label: 'Dự án', value: fmt(uniqueCount(context.productionOrders, 'projectId')) },
      ],
    },
    qc: {
      icon: ShieldCheck,
      tone: 'red' as Tone,
      eyebrow: 'Phân tích chất lượng',
      title: 'Phân tích chất lượng QC',
      subtitle: 'Pass rate, NCR, lỗi mở và hàng chờ kiểm.',
      kpis: [
        { label: 'Tỷ lệ đạt', value: `${fmt(context.passRate, 1)}%`, note: 'QC cockpit' },
        { label: 'NCR mở', value: fmt(context.openNcr), note: 'Cần disposition' },
        { label: 'Đang kiểm', value: fmt(context.qcCockpit?.metrics?.inProgress ?? 0), note: 'Inspection runtime' },
        { label: 'Không đạt/Rework', value: fmt((context.qcCockpit?.metrics?.failed ?? 0) + (context.qcCockpit?.metrics?.rework ?? 0)), note: 'Cần xử lý' },
        { label: 'MO chờ QC', value: fmt(context.qcCockpit?.metrics?.waitingProductionOrders ?? 0), note: 'Chặn xuất bãi' },
      ],
      trendTitle: 'Xu hướng kết quả QC',
      trend: (context.qcCockpit?.trend ?? []).map((row) => ({ label: row.date.slice(5), value: row.passed, secondary: row.failed })),
      distributionTitle: 'Phân bổ kết quả QC',
      distributionTotal: `${fmt(context.passRate, 1)}%`,
      distribution: qcDistribution(context.qcCockpit),
      secondaryDistribution: [],
      rankingTitle: 'Dự án theo pass rate',
      ranking: (context.qcCockpit?.byProject ?? []).map((row) => ({ label: row.projectName, value: row.passRate })),
      matrixTitle: 'Severity lỗi',
      matrix: (context.qcCockpit?.metrics?.defects ?? []).map((row, index) => ({ label: row.severity, value: row._count, color: colorAt(index) })),
      activities: (context.qcCockpit?.inspections ?? []).slice(0, 8).map((row) => ({ title: row.inspectionNo, subtitle: `${row.componentCode} · ${qcStatusLabel(row.status)}`, time: dateTime(row.date) })),
      tableTitle: 'Phiếu kiểm tra gần đây',
      tableHeaders: ['Phiếu', 'Dự án', 'Cấu kiện', 'Kết quả', 'Trạng thái'],
      tableRows: (context.qcCockpit?.inspections ?? []).map((row) => [row.inspectionNo, row.projectName, row.componentCode, qcResultLabel(row.result), qcStatusLabel(row.status)]),
      summary: [
        { label: 'Pass rate', value: `${fmt(context.passRate, 1)}%` },
        { label: 'NCR mở', value: fmt(context.openNcr) },
        { label: 'Phiếu', value: fmt(context.qcCockpit?.metrics?.total ?? 0) },
      ],
    },
    projects: {
      icon: Building2,
      tone: 'amber' as Tone,
      eyebrow: 'Phân tích dự án',
      title: 'Phân tích dự án',
      subtitle: 'Tiến độ, giá trị, giao hàng và component theo công trình.',
      kpis: [
        { label: 'Dự án hoạt động', value: fmt(context.activeProjects), note: 'ACTIVE hoặc chưa hoàn tất' },
        { label: 'Tiến độ TB', value: `${fmt(avg(context.projects.map((p) => p.progress)), 1)}%`, note: 'Theo project runtime' },
        { label: 'Giá trị hợp đồng', value: money(context.projects.reduce((s, p) => s + p.contractValue, 0)), note: 'Tổng contract value' },
        { label: 'Cấu kiện', value: fmt(context.projects.reduce((s, p) => s + p.componentCount, 0)), note: 'Tổng component count' },
        { label: 'Chậm tiến độ', value: fmt(context.projects.filter((p) => p.delayedOrders > 0).length), note: 'Có delayed orders' },
      ],
      trendTitle: 'Tiến độ dự án',
      trend: context.projects.map((project) => ({ label: project.code, value: project.progress })),
      distributionTitle: 'Trạng thái dự án',
      distributionTotal: fmt(context.projects.length),
      distribution: distributionByProjectsStatus(context.projects),
      secondaryDistribution: context.projects.map((project, index) => ({ label: project.code, value: project.componentCount, color: colorAt(index) })).filter((row) => row.value > 0),
      rankingTitle: 'Top dự án theo giá trị',
      ranking: context.projects.map((project) => ({ label: project.name, value: project.contractValue })).sort((a, b) => b.value - a.value).slice(0, 8),
      matrixTitle: 'Giao hàng công trình',
      matrix: context.projects.map((project, index) => ({ label: project.code, value: project.delivered + project.pending, color: colorAt(index) })).slice(0, 6),
      activities: context.projects.slice(0, 8).map((project) => ({ title: project.code, subtitle: `${project.name} · ${fmt(project.progress)}%`, time: dateTime(project.updatedAt) })),
      tableTitle: 'Danh sách dự án',
      tableHeaders: ['Mã', 'Dự án', 'Trạng thái', 'Tiến độ', 'Giá trị'],
      tableRows: context.projects.map((project) => [project.code, project.name, projectStatusLabel(project.status), `${fmt(project.progress)}%`, money(project.contractValue)]),
      summary: [
        { label: 'Dự án', value: fmt(context.projects.length) },
        { label: 'Hoạt động', value: fmt(context.activeProjects) },
        { label: 'Giá trị', value: money(context.projects.reduce((s, p) => s + p.contractValue, 0)) },
      ],
    },
    dispatch: {
      icon: PackageCheck,
      tone: 'emerald' as Tone,
      eyebrow: 'Phân tích giao nhận',
      title: 'Phân tích giao nhận',
      subtitle: 'Điều xe, bốc hàng, đang vận chuyển và hoàn tất giao hàng.',
      kpis: [
        { label: 'Chuyến hoạt động', value: fmt(context.dispatchActive), note: 'Đã lên kế hoạch / bốc hàng / đang giao' },
        { label: 'Tổng điều xe', value: fmt(context.dispatchOrders.length), note: 'Tổng lệnh giao nhận' },
        { label: 'Đã hoàn thành', value: fmt(context.dispatchOrders.filter((order) => ['RECEIVED', 'COMPLETED'].includes(order.status)).length), note: 'Đã nhận / hoàn thành' },
        { label: 'Đã hủy', value: fmt(context.dispatchOrders.filter((order) => order.status === 'CANCELLED').length), note: 'Cần rà soát' },
        { label: 'Xe đang dùng', value: fmt((context.dispatchDashboard?.vehicleUtilization ?? []).filter((row) => row.active > 0).length), note: 'Mức sử dụng phương tiện' },
      ],
      trendTitle: 'Xu hướng điều xe',
      trend: (context.dispatchDashboard?.trend ?? []).map((row) => ({ label: row.date.slice(5), value: row.total, secondary: row.completed })),
      distributionTitle: 'Trạng thái giao nhận',
      distributionTotal: fmt(context.dispatchOrders.length),
      distribution: dispatchDistribution(context.dispatchOrders),
      secondaryDistribution: [],
      rankingTitle: 'Xe theo mức sử dụng',
      ranking: (context.dispatchDashboard?.vehicleUtilization ?? []).map((row) => ({ label: row.vehicle, value: row.active })),
      matrixTitle: 'Trạng thái điều xe',
      matrix: dispatchDistribution(context.dispatchOrders),
      activities: context.dispatchOrders.slice(0, 8).map((order) => ({ title: order.code, subtitle: `${order.project?.name ?? 'Chưa rõ dự án'} · ${statusLabel[order.status]}`, time: dateTime(order.updatedAt || order.createdAt) })),
      tableTitle: 'Danh sách điều xe',
      tableHeaders: ['Mã', 'Dự án', 'Xe', 'Tài xế', 'Trạng thái'],
      tableRows: context.dispatchOrders.map((order) => [order.code, order.project?.name ?? '—', order.vehicle ?? '—', order.driver ?? '—', statusLabel[order.status]]),
      summary: [
        { label: 'Hoạt động', value: fmt(context.dispatchActive) },
        { label: 'Tổng lệnh', value: fmt(context.dispatchOrders.length) },
        { label: 'Xe', value: fmt(context.dispatchDashboard?.vehicleUtilization?.length ?? 0) },
      ],
    },
  }
  return base[domain]
}

function flowSpec(eyebrow: string, title: string, subtitle: string, tone: Tone, icon: LucideIcon, rows: RecordRow[], value: number) {
  return {
    icon,
    tone,
    eyebrow,
    title,
    subtitle,
    kpis: [
      { label: 'Tổng giá trị', value: money(value), note: 'Từ giao dịch Inventory' },
      { label: 'Số phiếu', value: fmt(rows.length), note: 'Mẫu đọc hiện tại' },
      { label: 'Số lượng', value: fmt(sumTransactionQuantity(rows)), note: 'Tổng quantity' },
      { label: 'Kho liên quan', value: fmt(uniqueCount(rows, 'warehouse')), note: 'Theo warehouse' },
      { label: 'Dòng gần nhất', value: rows[0] ? dateTime(str(rows[0].createdAt)) : '—', note: 'Giao dịch mới nhất' },
    ],
    trendTitle: 'Biến động giao dịch',
    trend: seriesByMonth(rows, ['totalAmount', 'amount', 'value', 'totalValue', 'quantity'], transactionAmount),
    distributionTitle: 'Phân bổ theo kho',
    distributionTotal: money(value),
    distribution: distributionByKey(rows, 'warehouse', ['totalAmount', 'amount', 'value', 'totalValue', 'quantity'], false, transactionAmount),
    secondaryDistribution: [],
    rankingTitle: 'Top vật tư theo giao dịch',
    ranking: topByKey(rows, 'itemCode', ['totalAmount', 'amount', 'value', 'totalValue', 'quantity'], transactionAmount),
    matrixTitle: 'Phân bổ loại giao dịch',
    matrix: distributionByKey(rows, 'type', ['totalAmount', 'amount', 'value', 'totalValue', 'quantity'], true),
    activities: rows.slice(0, 8).map(transactionActivity),
    tableTitle: 'Chi tiết giao dịch',
    tableHeaders: ['Mã', 'Vật tư', 'Kho', 'Số lượng', 'Ngày'],
    tableRows: rows.map((row) => [str(row.transactionNo) || str(row.code) || str(row.id), transactionMaterialLabel(row), transactionWarehouseLabel(row), fmt(transactionQuantity(row)), dateTime(rowDateString(row))]),
    summary: [
      { label: 'Giá trị', value: money(value) },
      { label: 'Phiếu', value: fmt(rows.length) },
      { label: 'Kho', value: fmt(uniqueCount(rows, 'warehouse')) },
    ],
  }
}

function DashboardWidgetModal({
  widget,
  onClose,
  inventoryValue,
  inventoryRows,
  inventoryValueByType,
  componentStatusRows,
  componentTotal,
  importExportTrend,
  projects,
  qcCockpit,
  dispatchOrders,
  alerts,
  lowStockItems,
  openNcr,
}: {
  widget: DashboardWidgetId
  onClose: () => void
  inventoryValue: number
  inventoryRows: RecordRow[]
  inventoryValueByType: DistributionPoint[]
  componentStatusRows: DistributionPoint[]
  componentTotal: number
  importExportTrend: SeriesPoint[]
  projects: ProjectRuntimeRow[]
  qcCockpit?: QcCockpit
  dispatchOrders: DispatchOrder[]
  alerts: AlertRow[]
  lowStockItems: RecordRow[]
  openNcr: number
}) {
  const title = widgetTitle(widget)
  const subtitle = widgetSubtitle(widget)
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/78 p-4 backdrop-blur-sm">
      <section className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-cyan-300/25 bg-[#07111f] shadow-[0_32px_120px_rgba(8,47,73,0.42)]">
        <header className="flex items-start justify-between gap-4 border-b border-cyan-300/12 p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-300">Chi tiết phân tích</p>
            <h2 className="mt-1 text-2xl font-medium text-white">{title}</h2>
            <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08]">
            <X size={18} />
          </button>
        </header>
        <div className="overflow-y-auto p-5">
          {widget === 'inventory-type' ? (
            <WidgetDetailGrid
              main={<LargeDonut rows={inventoryValueByType} total={compactCurrencyValue(inventoryValue)} valueFormatter={compactCurrencyValue} />}
              side={<DistributionInsight rows={inventoryValueByType} total={inventoryValue} valueFormatter={compactCurrencyValue} />}
              table={<InventoryValueTable rows={inventoryRows} groupBy="type" />}
            />
          ) : null}
          {widget === 'import-export' ? (
            <WidgetDetailGrid
              main={<ImportExportPeriodChart rows={importExportTrend} />}
              side={<ImportExportInsight rows={importExportTrend} />}
              table={<SeriesDetailTable rows={importExportTrend} />}
            />
          ) : null}
          {widget === 'components' ? (
            <WidgetDetailGrid
              main={<ComponentBarChart rows={componentStatusRows} total={componentTotal} large />}
              side={<ComponentInsight rows={componentStatusRows} total={componentTotal} />}
              table={<ComponentStatusTable rows={componentStatusRows} total={componentTotal} />}
            />
          ) : null}
          {widget === 'projects-progress' ? (
            <WidgetDetailGrid
              main={<LargeDonut rows={projectProgressDistribution(projects)} total={fmt(projects.length)} valueFormatter={(value) => fmt(value)} />}
              side={<ProjectInsight projects={projects} />}
              table={<ProjectDetailTable projects={projects} />}
            />
          ) : null}
          {widget === 'qc-status' ? (
            <WidgetDetailGrid
              main={<LargeDonut rows={qcDistribution(qcCockpit)} total={`${fmt(num(qcCockpit?.metrics, 'passRate'), 1)}%`} valueFormatter={(value) => fmt(value)} />}
              side={<QcInsight qcCockpit={qcCockpit} />}
              table={<QcDetailTable qcCockpit={qcCockpit} />}
            />
          ) : null}
          {widget === 'delivery-status' ? (
            <WidgetDetailGrid
              main={<LargeDonut rows={dispatchDistribution(dispatchOrders)} total={fmt(dispatchOrders.length)} valueFormatter={(value) => fmt(value)} />}
              side={<DispatchInsight orders={dispatchOrders} />}
              table={<DispatchDetailTable orders={dispatchOrders} />}
            />
          ) : null}
          {widget === 'alerts' ? (
            <div className="space-y-4">
              <AlertSummaryStrip
                lowStockCount={lowStockItems.filter((item) => (num(item, 'currentStock') || num(item, 'quantity')) >= 0).length}
                negativeStockCount={lowStockItems.filter((item) => (num(item, 'currentStock') || num(item, 'quantity')) < 0).length}
                openNcr={openNcr}
                lateDispatchCount={lateDispatchCount(dispatchOrders)}
              />
              {alerts.length ? <RiskTable rows={alerts} /> : <CockpitEmptyState title="Không có cảnh báo" description="Không phát hiện cảnh báo từ dữ liệu backend hiện tại." />}
              <LowStockDetailTable rows={lowStockItems} />
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}

function WidgetDetailGrid({ main, side, table }: { main: React.ReactNode; side: React.ReactNode; table: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="min-h-[420px] rounded-2xl border border-cyan-300/14 bg-slate-950/35 p-4">{main}</section>
        <section className="rounded-2xl border border-cyan-300/14 bg-slate-950/35 p-4">{side}</section>
      </div>
      <section className="rounded-2xl border border-cyan-300/14 bg-slate-950/35 p-4">{table}</section>
    </div>
  )
}

function widgetTitle(widget: DashboardWidgetId) {
  return {
    'inventory-type': 'Giá trị tồn kho theo loại vật tư',
    'import-export': 'Giá trị nhập - xuất trong kỳ',
    components: 'Cấu kiện',
    'projects-progress': 'Dự án theo tiến độ',
    'qc-status': 'Trạng thái chất lượng QC',
    'delivery-status': 'Giao hàng theo trạng thái',
    alerts: 'Cảnh báo & rủi ro hoạt động',
  }[widget]
}

function widgetSubtitle(widget: DashboardWidgetId) {
  return {
    'inventory-type': 'Phân tích sâu giá trị tồn theo loại/quy cách vật tư.',
    'import-export': 'So sánh giá trị nhập và xuất theo kỳ từ dữ liệu giao dịch thật.',
    components: 'Phân bổ cấu kiện theo trạng thái từ Components dashboard.',
    'projects-progress': 'Phân bổ dự án theo tiến độ và danh sách dự án liên quan.',
    'qc-status': 'Tổng hợp trạng thái kiểm tra, pass/fail/rework và phiếu QC gần đây.',
    'delivery-status': 'Tình trạng giao nhận theo chuyến, xe, tài xế và dự án.',
    alerts: 'Danh sách cảnh báo thật từ tồn kho, QC, giao nhận và dự án.',
  }[widget]
}

function LargeDonut({ rows, total, valueFormatter }: { rows: DistributionPoint[]; total: string; valueFormatter: (value: number) => string }) {
  const valid = rows.filter((row) => row.value > 0)
  if (!valid.length) return <CockpitEmptyState title="Dữ liệu chưa khả dụng" description="Backend chưa có dữ liệu thật để dựng biểu đồ chi tiết." />
  const sumValue = valid.reduce((sumValue, row) => sumValue + row.value, 0)
  let offset = 25
  return (
    <div className="grid h-full min-h-[390px] grid-cols-[320px_1fr] items-center gap-6">
      <div className="relative mx-auto grid h-72 w-72 place-items-center">
        <svg viewBox="0 0 42 42" className="-rotate-90 drop-shadow-[0_0_24px_rgba(34,211,238,0.16)]">
          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#1e293b" strokeWidth="5" />
          {valid.map((row) => {
            const percent = (row.value / sumValue) * 100
            const dashOffset = offset
            offset -= percent
            const segment = donutSegment(percent)
            return <circle key={row.label} cx="21" cy="21" r="15.915" fill="transparent" stroke={row.color} strokeWidth="5" strokeDasharray={`${segment} ${100 - segment}`} strokeDashoffset={dashOffset} strokeLinecap="butt" />
          })}
        </svg>
        <div className="absolute text-center">
          <p className="text-xs text-slate-500">Tổng</p>
          <p className="text-2xl font-medium text-white">{total}</p>
        </div>
      </div>
      <div className="space-y-3">
        {valid.slice(0, 10).map((row) => (
          <LegendMetricRow key={row.label} label={row.label} value={valueFormatter(row.value)} percent={`${fmt((row.value / sumValue) * 100, 1)}%`} color={row.color} />
        ))}
      </div>
    </div>
  )
}

function DistributionInsight({ rows, total, valueFormatter }: { rows: DistributionPoint[]; total: number; valueFormatter: (value: number) => string }) {
  const top = rows[0]
  const count = rows.filter((row) => row.value > 0).length
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-200">Tóm tắt</h3>
      <SummaryLine label="Tổng giá trị" value={valueFormatter(total)} />
      <SummaryLine label="Số nhóm có dữ liệu" value={fmt(count)} />
      <SummaryLine label="Nhóm lớn nhất" value={top ? top.label : '—'} />
      <SummaryLine label="Giá trị nhóm lớn nhất" value={top ? valueFormatter(top.value) : '—'} />
    </div>
  )
}

function ComponentBarChart({ rows, total, large = false }: { rows: DistributionPoint[]; total: number; large?: boolean }) {
  const valid = rows.filter((row) => row.value > 0)
  if (!valid.length) {
    return <CockpitEmptyState title="Dữ liệu cấu kiện chưa khả dụng" description="Backend chưa có statusCounts cấu kiện để dựng biểu đồ." />
  }
  const maxValue = Math.max(...valid.map((row) => row.value), 1)
  const chartRows = valid.slice(0, large ? 10 : 7)
  return (
    <div className={`grid h-full ${large ? 'min-h-[390px] grid-rows-[auto_1fr]' : 'grid-rows-[auto_1fr]'} gap-3`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-cyan-200">Phân bổ trạng thái</p>
          <p className="mt-1 text-xs text-slate-500">Dữ liệu từ Components dashboard</p>
        </div>
        <div className="rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-2 text-right">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">Tổng</p>
          <p className="text-lg font-medium text-white">{fmt(total)}</p>
        </div>
      </div>
      <div className={`flex min-h-0 items-end gap-2 ${large ? 'h-[320px]' : 'h-[128px]'}`}>
        {chartRows.map((row) => {
          const height = Math.max(12, (row.value / maxValue) * 100)
          return (
            <div key={row.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
              <div className="flex w-full flex-1 items-end justify-center rounded-t-xl border border-white/5 bg-white/[0.025] px-1">
                <div
                  className="w-full max-w-10 rounded-t-lg border shadow-[0_0_18px_rgba(56,189,248,0.18)]"
                  style={{
                    height: `${height}%`,
                    minHeight: large ? 18 : 10,
                    borderColor: `${row.color}99`,
                    background: `linear-gradient(180deg, ${row.color}, ${row.color}55)`,
                  }}
                />
              </div>
              <span className="max-w-full truncate text-[10px] font-medium text-slate-400">{row.label}</span>
              {large ? <span className="text-[11px] font-medium text-white">{fmt(row.value)}</span> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ComponentInsight({ rows, total }: { rows: DistributionPoint[]; total: number }) {
  const top = rows[0]
  const active = rows.filter((row) => row.value > 0).length
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-200">Cấu kiện</h3>
      <SummaryLine label="Tổng cấu kiện" value={fmt(total)} />
      <SummaryLine label="Số trạng thái có dữ liệu" value={fmt(active)} />
      <SummaryLine label="Trạng thái lớn nhất" value={top?.label ?? '—'} />
      <SummaryLine label="Số lượng lớn nhất" value={top ? fmt(top.value) : '—'} />
    </div>
  )
}

function ImportExportInsight({ rows }: { rows: SeriesPoint[] }) {
  const inbound = rows.reduce((sumValue, row) => sumValue + row.value, 0)
  const outbound = rows.reduce((sumValue, row) => sumValue + (row.secondary ?? 0), 0)
  const peak = rows.reduce<SeriesPoint | undefined>((best, row) => (!best || row.value + (row.secondary ?? 0) > best.value + (best.secondary ?? 0) ? row : best), undefined)
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-200">Chỉ tiêu</h3>
      <SummaryLine label="Nhập trong kỳ" value={money(inbound)} />
      <SummaryLine label="Xuất trong kỳ" value={money(outbound)} />
      <SummaryLine label="Chênh lệch" value={money(inbound - outbound)} />
      <SummaryLine label="Kỳ biến động lớn nhất" value={peak?.label ?? '—'} />
    </div>
  )
}

function ProjectInsight({ projects }: { projects: ProjectRuntimeRow[] }) {
  const avgProgress = avg(projects.map((project) => project.progress))
  const delayed = projects.filter((project) => project.delayedOrders > 0).length
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-200">Dự án</h3>
      <SummaryLine label="Tổng dự án" value={fmt(projects.length)} />
      <SummaryLine label="Tiến độ trung bình" value={`${fmt(avgProgress, 1)}%`} />
      <SummaryLine label="Dự án có cảnh báo" value={fmt(delayed)} />
      <SummaryLine label="Giá trị hợp đồng" value={money(projects.reduce((sumValue, project) => sumValue + project.contractValue, 0))} />
    </div>
  )
}

function QcInsight({ qcCockpit }: { qcCockpit?: QcCockpit }) {
  const metrics = qcCockpit?.metrics
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-200">QC</h3>
      <SummaryLine label="Tỷ lệ đạt" value={`${fmt(metrics?.passRate ?? 0, 1)}%`} />
      <SummaryLine label="Phiếu kiểm" value={fmt(metrics?.total ?? 0)} />
      <SummaryLine label="Không đạt / Rework" value={fmt((metrics?.failed ?? 0) + (metrics?.rework ?? 0))} />
      <SummaryLine label="NCR mở" value={fmt(metrics?.openNcrs ?? 0)} />
    </div>
  )
}

function DispatchInsight({ orders }: { orders: DispatchOrder[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-cyan-200">Giao nhận</h3>
      <SummaryLine label="Tổng chuyến" value={fmt(orders.length)} />
      <SummaryLine label="Đang vận chuyển" value={fmt(orders.filter((order) => order.status === 'IN_TRANSIT').length)} />
      <SummaryLine label="Hoàn thành" value={fmt(orders.filter((order) => ['RECEIVED', 'COMPLETED'].includes(order.status)).length)} />
      <SummaryLine label="Giao trễ" value={fmt(lateDispatchCount(orders))} />
    </div>
  )
}

function InventoryValueTable({ rows, groupBy }: { rows: RecordRow[]; groupBy: 'type' | 'group' }) {
  const tableRows = rows
    .map((row) => {
      const value = inventoryRowValue(row)
      return [
        str(row.materialCode) || str(row.code),
        str(row.materialName) || str(row.name),
        groupBy === 'type'
          ? str(row.materialType) || normalizeMaterialCategory(str(row.category) || str(row.materialName) || str(row.name))
          : normalizeMaterialCategory(str(row.category) || str(row.materialType) || str(row.materialName) || str(row.name)),
        fmt(num(row, 'currentStock') || num(row, 'quantity')),
        compactCurrencyValue(value),
      ]
    })
    .filter((row) => row[0] || row[1])
    .slice(0, 20)
  return <SimpleDetailTable title="Chi tiết vật tư" headers={['Mã', 'Tên vật tư', 'Loại / nhóm', 'Tồn', 'Giá trị']} rows={tableRows} />
}

function SeriesDetailTable({ rows }: { rows: SeriesPoint[] }) {
  return <SimpleDetailTable title="Chi tiết nhập - xuất theo kỳ" headers={['Kỳ', 'Nhập', 'Xuất', 'Chênh lệch']} rows={rows.map((row) => [row.label, money(row.value), money(row.secondary ?? 0), money(row.value - (row.secondary ?? 0))])} />
}

function ComponentStatusTable({ rows, total }: { rows: DistributionPoint[]; total: number }) {
  const valid = rows.filter((row) => row.value > 0)
  return (
    <SimpleDetailTable
      title="Chi tiết cấu kiện theo trạng thái"
      headers={['Trạng thái', 'Số lượng', 'Tỷ trọng']}
      rows={valid.map((row) => [row.label, fmt(row.value), `${fmt(total ? (row.value / total) * 100 : 0, 1)}%`])}
    />
  )
}

function ProjectDetailTable({ projects }: { projects: ProjectRuntimeRow[] }) {
  return <SimpleDetailTable title="Danh sách dự án" headers={['Mã', 'Dự án', 'Trạng thái', 'Tiến độ', 'Giá trị']} rows={projects.map((project) => [project.code, project.name, projectStatusLabel(project.status), `${fmt(project.progress, 1)}%`, money(project.contractValue)]).slice(0, 20)} />
}

function QcDetailTable({ qcCockpit }: { qcCockpit?: QcCockpit }) {
  return <SimpleDetailTable title="Phiếu kiểm tra gần đây" headers={['Phiếu', 'Dự án', 'Cấu kiện', 'Kết quả', 'Trạng thái']} rows={(qcCockpit?.inspections ?? []).map((row) => [row.inspectionNo, row.projectName, row.componentCode, qcResultLabel(row.result), qcStatusLabel(row.status)]).slice(0, 20)} />
}

function DispatchDetailTable({ orders }: { orders: DispatchOrder[] }) {
  return <SimpleDetailTable title="Danh sách giao nhận" headers={['Mã', 'Dự án', 'Xe', 'Tài xế', 'Trạng thái']} rows={orders.map((order) => [order.code, order.project?.name ?? '—', order.vehicle ?? '—', order.driver ?? '—', statusLabel[order.status]]).slice(0, 20)} />
}

function LowStockDetailTable({ rows }: { rows: RecordRow[] }) {
  return <SimpleDetailTable title="Vật tư cảnh báo tồn kho" headers={['Mã', 'Tên vật tư', 'Tồn hiện tại', 'Tồn tối thiểu', 'Cập nhật']} rows={rows.map((row) => [str(row.materialCode) || str(row.code), str(row.materialName) || str(row.name), fmt(num(row, 'currentStock') || num(row, 'quantity')), fmt(num(row, 'minimumStock') || num(row, 'minQuantity')), dateTime(str(row.updatedAt) || str(row.createdAt))]).slice(0, 20)} />
}

function SimpleDetailTable({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  if (!rows.length) return <CockpitEmptyState title="Chưa có dữ liệu chi tiết" description="Backend hiện chưa có bản ghi phù hợp cho bảng này." />
  return (
    <div>
      <h3 className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-cyan-200">{title}</h3>
      <CockpitTableShell className="max-h-[300px]">
        <table className="w-full min-w-[860px] text-left text-xs">
          <thead className="border-b border-cyan-400/10 text-slate-400">
            <tr>{headers.map((header) => <th key={header} className="px-3 py-2">{header}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.join('-')}-${index}`} className="border-b border-cyan-300/10 text-slate-300 hover:bg-cyan-300/[0.045]">
                {row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`} className={`px-3 py-2 font-medium ${detailCellClass(headers[cellIndex], cell)}`}>{cell || '—'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </CockpitTableShell>
    </div>
  )
}

function detailCellClass(header: string, value: string) {
  const text = `${header} ${value}`.toLowerCase()
  if (text.includes('cao') || text.includes('không đạt') || text.includes('bị chặn') || text.includes('đã hủy') || text.includes('tồn âm')) return 'text-red-300'
  if (text.includes('trung bình') || text.includes('cần') || text.includes('chậm') || text.includes('chênh lệch') && value.startsWith('-')) return 'text-amber-300'
  if (text.includes('đạt') || text.includes('hoàn thành') || text.includes('đúng tiến độ') || text.includes('nhập') || text.includes('giá trị') || text.includes('tiền')) return 'text-emerald-300'
  if (text.includes('%') || text.includes('tiến độ') || text.includes('xuất') || text.includes('tồn')) return 'text-cyan-200'
  if (header === 'Mã' || header.includes('Phiếu')) return 'text-white'
  return 'text-slate-300'
}

function RiskTable({ rows, onOpen }: { rows: AlertRow[]; onOpen?: () => void }) {
  return (
    <CockpitTableShell className="max-h-[220px]">
      <table className="w-full min-w-[980px] text-left text-xs">
        <thead className="border-b border-cyan-400/10 text-slate-400">
          <tr>{['Loại cảnh báo', 'Mức độ', 'Nội dung', 'Ảnh hưởng', 'Thời gian', 'Thao tác'].map((header) => <th key={header} className="px-3 py-2">{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-cyan-300/10 text-slate-300 hover:bg-cyan-300/[0.045]">
              <td className="px-3 py-2 font-semibold text-white"><AlertTriangle size={14} className="mr-2 inline text-amber-300" />{row.type}</td>
              <td className="px-3 py-2"><span className={`rounded px-2 py-0.5 text-[10px] font-medium ${row.level === 'Cao' ? 'bg-red-500/15 text-red-300' : 'bg-amber-500/15 text-amber-300'}`}>{row.level}</span></td>
              <td className="px-3 py-2">{row.content}</td>
              <td className="px-3 py-2 text-slate-400">{row.impact}</td>
              <td className="px-3 py-2 font-mono text-slate-400">{row.time}</td>
              <td className="px-3 py-2">{onOpen ? <button type="button" onClick={(event) => { event.stopPropagation(); onOpen() }} className="text-cyan-300 hover:text-cyan-100">Xem chi tiết</button> : <span className="text-slate-500">Đã mở</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </CockpitTableShell>
  )
}

function AlertSummaryStrip({
  lowStockCount,
  negativeStockCount,
  openNcr,
  lateDispatchCount,
}: {
  lowStockCount: number
  negativeStockCount: number
  openNcr: number
  lateDispatchCount: number
}) {
  const items = [
    { label: 'Vật tư thiếu', value: lowStockCount, tone: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-400/20' },
    { label: 'Tồn âm', value: negativeStockCount, tone: 'text-red-300', bg: 'bg-red-500/10', border: 'border-red-400/20' },
    { label: 'NCR mở', value: openNcr, tone: 'text-rose-300', bg: 'bg-rose-500/10', border: 'border-rose-400/20' },
    { label: 'Giao trễ', value: lateDispatchCount, tone: 'text-cyan-300', bg: 'bg-cyan-500/10', border: 'border-cyan-400/20' },
  ]
  return (
    <div className="mb-2 grid gap-2 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className={`rounded-xl border ${item.border} ${item.bg} px-3 py-2`}>
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">{item.label}</p>
          <p className={`mt-1 text-xl font-medium ${item.value > 0 ? item.tone : 'text-slate-400'}`}>{fmt(item.value)}</p>
        </div>
      ))}
    </div>
  )
}

function Sparkline({ values, stroke, fill }: { values: number[]; stroke: string; fill: string }) {
  if (values.length < 2 || values.every((value) => value === 0)) {
    return (
      <svg viewBox="0 0 100 36" preserveAspectRatio="none" className="mt-3 h-10 w-full opacity-40">
        <polyline points="0,26 100,26" fill="none" stroke={stroke} strokeWidth="1.5" strokeDasharray="4 5" vectorEffect="non-scaling-stroke" />
      </svg>
    )
  }
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = Math.max(1, max - min)
  const points = values.map((value, index) => `${(index / Math.max(1, values.length - 1)) * 100},${34 - ((value - min) / range) * 26 - 4}`).join(' ')
  return <svg viewBox="0 0 100 36" preserveAspectRatio="none" className="mt-3 h-10 w-full opacity-90"><polyline points={`0,36 ${points} 100,36`} fill={fill} /><polyline points={points} fill="none" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg>
}

function DonutChart({
  rows,
  total,
  centerLabel,
  emptyTitle,
  valueFormatter,
}: {
  rows: DistributionPoint[]
  total: string
  centerLabel: string
  emptyTitle: string
  valueFormatter?: (value: number) => string
}) {
  const valid = rows.filter((row) => row.value > 0)
  if (!valid.length) return <CockpitEmptyState title={emptyTitle} description="Không dựng biểu đồ khi backend chưa có dữ liệu thật." />
  const sumValue = valid.reduce((sum, row) => sum + row.value, 0)
  let offset = 25
  return (
    <div className="grid h-full grid-cols-[160px_1fr] items-center gap-4">
      <div className="relative mx-auto grid h-36 w-36 place-items-center">
        <svg viewBox="0 0 42 42" className="-rotate-90">
          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#1e293b" strokeWidth="4" />
          {valid.map((row) => {
            const percent = (row.value / sumValue) * 100
            const dashOffset = offset
            offset -= percent
            const segment = donutSegment(percent)
            return <circle key={row.label} cx="21" cy="21" r="15.915" fill="transparent" stroke={row.color} strokeWidth="4" strokeDasharray={`${segment} ${100 - segment}`} strokeDashoffset={dashOffset} strokeLinecap="butt" className="transition-all duration-200 hover:stroke-[4.6]" />
          })}
        </svg>
        <div className="absolute text-center"><p className="text-[10px] font-medium text-slate-500">{centerLabel}</p><p className="text-sm font-medium text-white">{total}</p></div>
      </div>
      <div className="space-y-2">
        {valid.slice(0, 7).map((row) => (
          <LegendMetricRow
            key={row.label}
            label={row.label}
            value={valueFormatter ? valueFormatter(row.value) : fmt(row.value, 1)}
            percent={`${fmt((row.value / sumValue) * 100, 1)}%`}
            color={row.color}
          />
        ))}
      </div>
    </div>
  )
}

function donutSegment(percent: number) {
  if (percent <= 0) return 0
  if (percent >= 99.2) return percent
  return Math.max(0.7, percent - 0.45)
}

function ImportExportPeriodChart({ rows }: { rows: SeriesPoint[] }) {
  const valid = rows.filter((row) => row.value > 0 || (row.secondary ?? 0) > 0)
  if (!valid.length) {
    return <CockpitEmptyState title="Dữ liệu lịch sử chưa khả dụng" description="Backend chưa có chuỗi nhập/xuất thật cho kỳ hiện tại." />
  }
  const displayRows = valid.slice(-10)
  const inboundTotal = displayRows.reduce((sumValue, row) => sumValue + row.value, 0)
  const outboundTotal = displayRows.reduce((sumValue, row) => sumValue + (row.secondary ?? 0), 0)
  const max = Math.max(1, ...displayRows.flatMap((row) => [row.value, row.secondary ?? 0]))
  const ticks = Array.from({ length: 5 }, (_, index) => max - (max / 4) * index)

  return (
    <div className="grid h-full grid-rows-[1fr_auto] gap-3">
      <div className="rounded-2xl border border-cyan-300/10 bg-slate-950/25 p-3">
        <div className="mb-3 flex justify-center gap-4 text-[11px] font-medium text-slate-300">
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-blue-400" />Nhập trong kỳ</span>
          <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-400" />Xuất trong kỳ</span>
        </div>
        <div className="grid h-[300px] grid-cols-[92px_1fr] gap-3">
          <div className="flex h-full flex-col justify-between text-right text-[10px] font-medium tabular-nums text-slate-400">
            {ticks.map((tick) => <span key={tick}>{formatAxisCurrency(tick)}</span>)}
          </div>
          <div className="relative border-b border-l border-slate-500/25">
            <div className="absolute inset-0 flex flex-col justify-between">
              {ticks.map((tick) => <span key={tick} className="border-t border-slate-700/45 first:border-t-0" />)}
            </div>
            <div className="relative flex h-full items-end gap-4 px-4">
              {displayRows.map((row, index) => (
                <div key={`${row.label}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-[260px] items-end gap-2">
                    <span className="w-5 rounded-t-lg border border-blue-400 bg-blue-500/20 shadow-[0_0_18px_rgba(59,130,246,0.3)]" style={{ height: `${Math.max(8, (row.value / max) * 256)}px` }} />
                    <span className="w-5 rounded-t-lg border border-emerald-400 bg-emerald-500/20 shadow-[0_0_18px_rgba(16,185,129,0.28)]" style={{ height: `${Math.max(8, ((row.secondary ?? 0) / max) * 256)}px` }} />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">{row.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-cyan-300/10 text-xs">
        <ImportExportMetric label="Nhập trong kỳ" value={money(inboundTotal)} note="Theo bộ lọc hiện tại" />
        <ImportExportMetric label="Xuất trong kỳ" value={money(outboundTotal)} note="Bao gồm xuất vật tư/cấu kiện" />
        <ImportExportMetric label="Chênh lệch" value={money(inboundTotal - outboundTotal)} note={inboundTotal >= outboundTotal ? 'Nhập lớn hơn xuất' : 'Xuất lớn hơn nhập'} />
      </div>
    </div>
  )
}

function ImportExportMiniTrend({ rows }: { rows: SeriesPoint[] }) {
  const valid = rows.filter((row) => row.value > 0 || (row.secondary ?? 0) > 0).slice(-12)
  if (!valid.length) {
    return <CockpitEmptyState title="Dữ liệu lịch sử chưa khả dụng" description="Backend chưa có chuỗi nhập/xuất thật cho kỳ hiện tại." />
  }
  const inboundTotal = valid.reduce((sumValue, row) => sumValue + row.value, 0)
  const outboundTotal = valid.reduce((sumValue, row) => sumValue + (row.secondary ?? 0), 0)
  const max = Math.max(1, ...valid.flatMap((row) => [row.value, row.secondary ?? 0]))
  const point = (value: number, index: number) => `${(index / Math.max(1, valid.length - 1)) * 100},${86 - (value / max) * 72}`
  const inboundPoints = valid.map((row, index) => point(row.value, index)).join(' ')
  const outboundPoints = valid.map((row, index) => point(row.secondary ?? 0, index)).join(' ')
  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto] gap-2">
      <div className="grid grid-cols-2 gap-2">
        <MiniTrendMetric label="Nhập" value={compactCurrencyValue(inboundTotal)} tone="text-blue-200" />
        <MiniTrendMetric label="Xuất" value={compactCurrencyValue(outboundTotal)} tone="text-emerald-200" />
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-cyan-300/10 bg-slate-950/25 p-3">
        <svg viewBox="0 0 100 92" preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <linearGradient id="inboundLineFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(59,130,246,0.24)" />
              <stop offset="100%" stopColor="rgba(59,130,246,0)" />
            </linearGradient>
            <linearGradient id="outboundLineFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(16,185,129,0.20)" />
              <stop offset="100%" stopColor="rgba(16,185,129,0)" />
            </linearGradient>
          </defs>
          {[22, 40, 58, 76].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="rgba(148,163,184,0.16)" strokeWidth="0.45" />)}
          <polyline points={`0,92 ${inboundPoints} 100,92`} fill="url(#inboundLineFill)" />
          <polyline points={`0,92 ${outboundPoints} 100,92`} fill="url(#outboundLineFill)" />
          <polyline points={inboundPoints} fill="none" stroke="#60a5fa" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
          <polyline points={outboundPoints} fill="none" stroke="#34d399" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="flex items-center justify-between text-[10px] font-medium text-slate-500">
        {valid.map((row, index) => <span key={`${row.label}-${index}`}>{row.label}</span>)}
      </div>
    </div>
  )
}

function MiniTrendMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-cyan-300/10 bg-slate-950/25 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-medium ${tone}`}>{value}</p>
    </div>
  )
}

function ImportExportMetric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="border-r border-cyan-300/10 p-2 last:border-r-0">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 font-medium text-slate-100">{value}</p>
      <p className="mt-1 text-[10px] text-slate-500">{note}</p>
    </div>
  )
}

function formatAxisCurrency(value: number) {
  if (value <= 0) return '0 đ'
  return `${compactCurrencyValue(value)} đ`
}

function DualBarChart({ rows, firstLabel, secondLabel, emptyTitle = 'Dữ liệu chưa khả dụng' }: { rows: SeriesPoint[]; firstLabel: string; secondLabel: string; emptyTitle?: string }) {
  const valid = rows.filter((row) => row.value > 0 || (row.secondary ?? 0) > 0)
  if (!valid.length) return <CockpitEmptyState title={emptyTitle} description="Không có chuỗi thời gian thật để hiển thị." />
  const max = Math.max(1, ...rows.flatMap((row) => [row.value, row.secondary ?? 0]))
  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex justify-end gap-3 text-[11px] text-slate-400"><LegendRow label={firstLabel} value="" color="#34d399" /><LegendRow label={secondLabel} value="" color="#a78bfa" /></div>
      <div className="flex flex-1 items-end gap-2">
        {rows.slice(-12).map((row) => <div key={row.label} className="group flex flex-1 flex-col items-center justify-end gap-1"><div className="flex h-32 items-end gap-1"><span className="w-2 rounded-t bg-emerald-400 transition group-hover:bg-emerald-200" style={{ height: `${Math.max(4, (row.value / max) * 120)}px` }} /><span className="w-2 rounded-t bg-purple-400 transition group-hover:bg-purple-200" style={{ height: `${Math.max(4, ((row.secondary ?? 0) / max) * 120)}px` }} /></div><span className="text-[10px] text-slate-500">{row.label}</span></div>)}
      </div>
    </div>
  )
}

function LineOrBarChart({ rows, tone, emptyTitle }: { rows: SeriesPoint[]; tone: Tone; emptyTitle: string }) {
  if (!rows.length) return <div className="grid h-72 place-items-center"><CockpitEmptyState title={emptyTitle} description="Không dựng dữ liệu tháng giả." /></div>
  const color = toneMap[tone].stroke
  const max = Math.max(1, ...rows.map((row) => row.value))
  return <div className="flex h-72 items-end gap-2">{rows.slice(-16).map((row) => <div key={row.label} className="group flex flex-1 flex-col items-center justify-end gap-2"><span className="w-full max-w-8 rounded-t transition group-hover:brightness-125" style={{ height: `${Math.max(8, (row.value / max) * 230)}px`, background: `linear-gradient(180deg, ${color}, rgba(15,23,42,0.35))` }} /><span className="text-[10px] text-slate-500">{row.label}</span></div>)}</div>
}

function RankingBars({ rows, tone }: { rows: SeriesPoint[]; tone: Tone }) {
  const valid = rows.filter((row) => row.value > 0).slice(0, 8)
  if (!valid.length) return <CockpitEmptyState title="Dữ liệu xếp hạng chưa khả dụng" description="Backend chưa có bản ghi đủ để xếp hạng." />
  const max = Math.max(1, ...valid.map((row) => row.value))
  return <div className="space-y-2">{valid.map((row, index) => <div key={`${row.label}-${index}`} className="grid grid-cols-[20px_1fr_90px] items-center gap-2 text-xs"><span className="text-slate-500">{index + 1}</span><div><div className="mb-1 truncate text-slate-300">{row.label || 'Chưa đặt tên'}</div><div className="h-2 rounded bg-white/10"><span className="block h-full rounded" style={{ width: `${Math.max(5, (row.value / max) * 100)}%`, backgroundColor: toneMap[tone].stroke }} /></div></div><span className="text-right font-mono text-cyan-300">{fmt(row.value, 1)}</span></div>)}</div>
}

function StatusMatrix({ rows }: { rows: DistributionPoint[] }) {
  const valid = rows.filter((row) => row.value > 0).slice(0, 8)
  if (!valid.length) return <CockpitEmptyState title="Dữ liệu ma trận chưa khả dụng" description="Không có trạng thái thật để hiển thị." />
  return <div className="grid grid-cols-2 gap-2">{valid.map((row) => <div key={row.label} className="rounded-xl border border-white/10 bg-white/[0.035] p-3"><p className="truncate text-xs text-slate-400">{row.label}</p><p className="mt-2 text-xl font-medium text-white">{fmt(row.value, 1)}</p><span className="mt-2 block h-1 rounded" style={{ backgroundColor: row.color }} /></div>)}</div>
}

function RecentActivity({ rows }: { rows: Array<{ title: string; subtitle: string; time: string }> }) {
  if (!rows.length) return <CockpitEmptyState title="Chưa có hoạt động gần đây" description="Dữ liệu sẽ xuất hiện khi phát sinh nghiệp vụ." />
  return <div className="space-y-2">{rows.slice(0, 7).map((row, index) => <div key={`${row.title}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-xs"><p className="font-semibold text-white">{row.title}</p><p className="mt-1 text-slate-400">{row.subtitle}</p><p className="mt-1 font-mono text-[10px] text-slate-500">{row.time}</p></div>)}</div>
}

function LegendRow({ label, value, color }: { label: string; value: string; color: string }) {
  return <div className="flex items-center justify-between gap-2 text-xs text-slate-300"><span className="flex min-w-0 items-center gap-2"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} /><span className="truncate">{label || 'Chưa phân loại'}</span></span>{value ? <span className="font-mono text-slate-400">{value}</span> : null}</div>
}

function LegendMetricRow({ label, value, percent, color }: { label: string; value: string; percent: string; color: string }) {
  return (
    <div className="grid grid-cols-[10px_1fr_82px_48px] items-center gap-2 text-xs text-slate-300">
      <i className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="truncate font-medium">{label || 'Chưa phân loại'}</span>
      <span className="text-right font-medium text-slate-200">{value}</span>
      <span className="text-right font-medium text-slate-500">{percent}</span>
    </div>
  )
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs"><span className="text-slate-400">{label}</span><span className="font-mono font-semibold text-white">{value}</span></div>
}

function asRows(value: unknown): RecordRow[] {
  if (Array.isArray(value)) return value.filter((row): row is RecordRow => typeof row === 'object' && row !== null)
  if (typeof value === 'object' && value !== null) {
    const record = value as RecordRow
    const candidates = [record.data, record.items, record.rows, record.transactions, record.results, record.records]
    for (const candidate of candidates) {
      const rows = asRows(candidate)
      if (rows.length) return rows
    }
  }
  return []
}

function resolveDateRange(timeRange: TimeRange, customStartDate: string, customEndDate: string, anchorTimestamp: number | null): DateRange {
  const now = anchorTimestamp ? new Date(anchorTimestamp) : new Date()
  const end = endOfDay(customEndDate ? new Date(customEndDate) : now)
  const start = (() => {
    if (timeRange === 'TODAY') return startOfDay(now)
    if (timeRange === '7D') {
      const date = startOfDay(now)
      date.setDate(date.getDate() - 6)
      return date
    }
    if (timeRange === 'CUSTOM' && customStartDate) return startOfDay(new Date(customStartDate))
    const date = startOfDay(now)
    date.setDate(date.getDate() - 29)
    return date
  })()
  return { start, end }
}

function latestTimestamp(rows: RecordRow[]): number | null {
  const values = rows.map(rowTimestamp).filter((value): value is number => value !== null)
  return values.length ? Math.max(...values) : null
}

function startOfDay(value: Date) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

function endOfDay(value: Date) {
  const date = new Date(value)
  date.setHours(23, 59, 59, 999)
  return date
}

function filterRowsByDate<T extends RecordRow>(rows: T[], range: DateRange): T[] {
  const datedRows = rows
    .map((row) => ({ row, timestamp: rowTimestamp(row) }))
    .filter((entry): entry is { row: T; timestamp: number } => entry.timestamp !== null)
  if (!datedRows.length) return rows
  return datedRows.filter(({ timestamp }) => {
    return timestamp !== null && timestamp >= range.start.getTime() && timestamp <= range.end.getTime()
  }).map(({ row }) => row)
}

function rowTimestamp(row: RecordRow): number | null {
  const raw = rowDateString(row)
  if (!raw) return null
  const timestamp = new Date(raw).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

function rowDateString(row: RecordRow): string {
  return str(row.transactionDate)
    || str(row.eventDate)
    || str(row.postedAt)
    || str(row.createdAt)
    || str(row.date)
    || str(row.updatedAt)
    || str(row.plannedAt)
    || str(row.plannedStartAt)
    || str(row.plannedEndAt)
    || str(row.completedAt)
    || str(row.issuedDate)
}

function asRecord(value: unknown): RecordRow {
  return typeof value === 'object' && value !== null ? value as RecordRow : {}
}

function str(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return ''
}

function num(source: unknown, key: string): number {
  const record = asRecord(source)
  const value = record[key]
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function sum(rows: RecordRow[], keys: string[]) {
  return rows.reduce((total, row) => total + firstNumber(row, keys), 0)
}

function sumTransactionQuantity(rows: RecordRow[]) {
  return rows.reduce((total, row) => total + transactionQuantity(row), 0)
}

function firstNumber(row: RecordRow, keys: string[]) {
  for (const key of keys) {
    const value = num(row, key)
    if (value) return value
  }
  return 0
}

function nestedLineRows(row: RecordRow): RecordRow[] {
  return [
    ...asRows(row.items),
    ...asRows(row.lines),
    ...asRows(row.transactionItems),
    ...asRows(row.materials),
  ]
}

function transactionAmount(row: RecordRow) {
  const direct = firstNumber(row, ['totalAmount', 'amount', 'value', 'totalValue', 'stockValue', 'inventoryValue'])
  if (direct) return direct

  return nestedLineRows(row).reduce((total, line) => {
    const lineTotal = firstNumber(line, ['totalAmount', 'amount', 'value', 'totalValue', 'lineTotal'])
    if (lineTotal) return total + lineTotal

    const quantity = firstNumber(line, ['quantity', 'qty', 'receivedQty', 'issuedQty'])
    const unitPrice = firstNumber(line, ['unitPrice', 'price', 'cost', 'averageCost'])
    return total + (quantity > 0 && unitPrice > 0 ? quantity * unitPrice : 0)
  }, 0)
}

function transactionQuantity(row: RecordRow) {
  const direct = firstNumber(row, ['quantity', 'totalQuantity', 'qty'])
  if (direct) return direct
  return nestedLineRows(row).reduce((total, line) => total + firstNumber(line, ['quantity', 'qty', 'receivedQty', 'issuedQty']), 0)
}

function avg(values: number[]) {
  const valid = values.filter((value) => Number.isFinite(value))
  return valid.length ? valid.reduce((sumValue, value) => sumValue + value, 0) / valid.length : 0
}

function transactionType(row: RecordRow) {
  const value = (str(row.type) || str(row.rawType) || str(row.direction) || str(row.transactionType)).toUpperCase()
  if (['IMPORT', 'INBOUND', 'RECEIVE', 'RECEIVED', 'RECEIPT', 'PURCHASE_RECEIPT', 'STOCK_IN', 'IN'].includes(value)) return 'INBOUND'
  if (['EXPORT', 'OUTBOUND', 'ISSUE', 'ISSUED', 'DISPATCH', 'SHIP', 'SHIPPED', 'STOCK_OUT', 'OUT'].includes(value)) return 'OUTBOUND'
  return value
}

function isActiveProductionOrder(status: string) {
  return ['READY', 'RELEASED', 'STARTED', 'RUNNING', 'IN_PROGRESS', 'ACTIVE', 'EXECUTING', 'PROCESSING'].includes(status.toUpperCase())
}

function monthKey(row: RecordRow) {
  const raw = rowDateString(row)
  return raw ? raw.slice(0, 7) : ''
}

function dayKey(row: RecordRow) {
  const raw = rowDateString(row)
  return raw ? raw.slice(0, 10) : ''
}

function dailySeries(rows: RecordRow[], keys: string[], countMode = false, valueResolver?: (row: RecordRow) => number): SeriesPoint[] {
  const anchor = latestTimestamp(rows)
  const now = anchor ? new Date(anchor) : new Date()
  const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(now)
    date.setDate(now.getDate() - (29 - index))
    const key = date.toISOString().slice(0, 10)
    return { key, label: key.slice(8), value: 0 }
  })
  const map = new Map(days.map((day) => [day.key, day]))
  rows.forEach((row) => {
    const key = dayKey(row)
    const current = map.get(key)
    if (!current) return
    current.value += countMode ? 1 : valueResolver ? valueResolver(row) : firstNumber(row, keys)
  })
  return days.map(({ label, value }) => ({ label, value }))
}

function seriesByMonth(rows: RecordRow[], keys: string[], valueResolver?: (row: RecordRow) => number): SeriesPoint[] {
  const map = new Map<string, number>()
  rows.forEach((row) => {
    const key = monthKey(row)
    if (!key) return
    map.set(key, (map.get(key) ?? 0) + (valueResolver ? valueResolver(row) : firstNumber(row, keys)))
  })
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label: label.slice(5), value }))
}

function deltaPercent(series: SeriesPoint[]) {
  const values = series.map((row) => row.value).filter((value) => value > 0)
  if (values.length < 2) return undefined
  const first = values[0]
  const last = values[values.length - 1]
  if (!first) return undefined
  return ((last - first) / first) * 100
}

function compactCurrencyValue(value: number) {
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `${fmt(value / 1_000_000_000, 1)} tỉ`
  if (abs >= 1_000_000) return `${fmt(value / 1_000_000, abs >= 100_000_000 ? 0 : 1)} triệu`
  return fmt(value)
}

function overviewMonthValue(month: RecordRow, direction: 'inbound' | 'outbound') {
  const directKey = direction === 'inbound' ? 'inboundValue' : 'outboundValue'
  const businessKey = direction === 'inbound' ? 'INBOUND' : 'OUTBOUND'
  const legacyKey = direction === 'inbound' ? 'IMPORT' : 'EXPORT'
  return num(month, directKey)
    || num(asRecord(month[businessKey]), 'value')
    || num(asRecord(month[legacyKey]), 'value')
}

function importExportValueTrend(overviewTrend: RecordRow[]): SeriesPoint[] {
  return overviewTrend
    .map((row) => ({
      label: trendLabel(str(row.date)),
      value: num(row, 'inboundValue'),
      secondary: num(row, 'outboundValue'),
    }))
    .filter((row) => row.label && (row.value > 0 || (row.secondary ?? 0) > 0))
}

function trendLabel(value: string) {
  if (!value) return ''
  if (value.length >= 7) return value.slice(5, 7)
  return value
}

function groupSeries(rows: RecordRow[], key: string, keys: string[]): SeriesPoint[] {
  return distributionByKey(rows, key, keys).map((row) => ({ label: row.label, value: row.value }))
}

function statusSeries(rows: RecordRow[]): SeriesPoint[] {
  return distributionByKey(rows, 'status', ['quantity', 'plannedQty', 'completedQty'], true).map((row) => ({ label: row.label, value: row.value }))
}

function distributionByKey(rows: RecordRow[], key: string, valueKeys: string[], countMode = false, valueResolver?: (row: RecordRow) => number): DistributionPoint[] {
  const map = new Map<string, number>()
  rows.forEach((row) => {
    const label = str(row[key]) || str(row[`${key}Name`]) || (key === 'warehouse' ? transactionWarehouseLabel(row) : '') || 'Chưa phân loại'
    const resolved = valueResolver ? valueResolver(row) : firstNumber(row, valueKeys)
    const value = countMode ? 1 : resolved || 1
    map.set(label, (map.get(label) ?? 0) + value)
  })
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).map(([label, value], index) => ({ label, value, color: colorAt(index) }))
}

function inventoryValueByMaterialType(rows: RecordRow[]): DistributionPoint[] {
  return inventoryValueDistribution(rows, (row) =>
    str(row.materialType) ||
    str(row.materialTypeName) ||
    normalizeMaterialCategory(str(row.category) || str(row.categoryName) || str(row.materialUsageType) || str(row.materialName) || str(row.name)),
  )
}

function componentStatusDistribution(source: unknown): DistributionPoint[] {
  const root = asRecord(source)
  const data = asRecord(root.data)
  const payload = asRecord(data.payload)
  let rows = asRows(payload.statusCounts)
  if (!rows.length) rows = asRows(asRecord(root.payload).statusCounts)
  if (!rows.length) rows = asRows(data.statusCounts)

  return rows
    .map((row, index) => ({
      label: componentStatusLabel(str(row.status) || str(row.label)),
      value: num(row, 'count') || num(row, 'value') || num(row, 'total'),
      color: colorAt(index),
    }))
    .filter((row) => row.label && row.value > 0)
    .sort((a, b) => b.value - a.value)
}

function componentTotalCount(source: unknown, rows: DistributionPoint[]) {
  const root = asRecord(source)
  const data = asRecord(root.data)
  const total = num(data, 'totalComponents') || num(root, 'totalComponents')
  return total || rows.reduce((sumValue, row) => sumValue + row.value, 0)
}

function componentStatusValue(rows: DistributionPoint[], label: string) {
  return rows.find((row) => row.label === label)?.value ?? 0
}

function componentStatusLabel(value: string) {
  const labels: Record<string, string> = {
    STOCK: 'Tồn kho',
    CUTTING: 'Đang cắt',
    WELDING: 'Đang hàn',
    PAINTING: 'Đang sơn',
    READY: 'Sẵn sàng',
    SHIPPED: 'Đã xuất',
    DELIVERED: 'Đã giao',
    INSTALLED: 'Đã lắp đặt',
  }
  return labels[value] ?? (value || 'Chưa rõ')
}

function inventoryValueDistribution(rows: RecordRow[], labelFor: (row: RecordRow) => string): DistributionPoint[] {
  const map = new Map<string, number>()
  rows.forEach((row) => {
    const value = inventoryRowValue(row)
    if (value <= 0) return
    const label = labelFor(row) || 'Khác'
    map.set(label, (map.get(label) ?? 0) + value)
  })
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], index) => ({ label, value, color: colorAt(index) }))
}

function inventoryRowValue(row: RecordRow) {
  const value = firstNumber(row, ['inventoryValue', 'stockValue', 'totalValue', 'value'])
  if (value > 0) return value
  const stock = firstNumber(row, ['currentStock', 'quantity', 'stockOnHand'])
  const averageCost = firstNumber(row, ['averageCost', 'unitPrice', 'cost'])
  return stock > 0 && averageCost > 0 ? stock * averageCost : 0
}

function normalizeMaterialCategory(value: string) {
  const text = value.toLowerCase()
  if (!text) return 'Khác'
  if (text.includes('tấm') || text.includes('plate')) return 'Thép tấm'
  if (text.includes('hình') || text.includes('beam') || text.includes('angle') || text.includes('channel')) return 'Thép hình'
  if (text.includes('hộp') || text.includes('box') || text.includes('tube') || text.includes('pipe')) return 'Thép hộp'
  if (text.includes('sơn') || text.includes('paint') || text.includes('coating')) return 'Sơn'
  if (text.includes('bulong') || text.includes('bolt') || text.includes('ốc') || text.includes('fastener')) return 'Bulong'
  if (text.includes('phụ') || text.includes('accessor') || text.includes('fitting')) return 'Phụ kiện'
  return value || 'Khác'
}

function abcDistribution(rows: RecordRow[]): DistributionPoint[] {
  const values = rows
    .map((row) => firstNumber(row, ['stockValue', 'inventoryValue', 'totalValue', 'value', 'quantity', 'currentStock']))
    .filter((value) => value > 0)
    .sort((a, b) => b - a)
  const total = values.reduce((sumValue, value) => sumValue + value, 0)
  if (!total) return []
  const buckets = { A: 0, B: 0, C: 0 }
  let running = 0
  values.forEach((value) => {
    running += value
    const share = running / total
    if (share <= 0.8) buckets.A += value
    else if (share <= 0.95) buckets.B += value
    else buckets.C += value
  })
  return [
    { label: 'A - Giá trị trọng yếu', value: buckets.A, color: '#8b5cf6' },
    { label: 'B - Giá trị trung bình', value: buckets.B, color: '#38bdf8' },
    { label: 'C - Giá trị thấp', value: buckets.C, color: '#94a3b8' },
  ].filter((row) => row.value > 0)
}

function inventoryAgingDistribution(rows: RecordRow[]): DistributionPoint[] {
  const buckets = [
    { label: '0-30 ngày', value: 0, color: '#34d399' },
    { label: '31-60 ngày', value: 0, color: '#38bdf8' },
    { label: '61-90 ngày', value: 0, color: '#f59e0b' },
    { label: '>90 ngày', value: 0, color: '#f87171' },
  ]
  const now = Date.now()
  rows.forEach((row) => {
    const raw = str(row.updatedAt) || str(row.createdAt) || str(row.lastMovementAt)
    if (!raw) return
    const timestamp = new Date(raw).getTime()
    if (!Number.isFinite(timestamp)) return
    const days = Math.max(0, Math.floor((now - timestamp) / 86_400_000))
    const value = firstNumber(row, ['stockValue', 'inventoryValue', 'totalValue', 'value', 'quantity', 'currentStock']) || 1
    if (days <= 30) buckets[0].value += value
    else if (days <= 60) buckets[1].value += value
    else if (days <= 90) buckets[2].value += value
    else buckets[3].value += value
  })
  return buckets.filter((row) => row.value > 0)
}

function distributionByProjectsStatus(projects: ProjectRuntimeRow[]): DistributionPoint[] {
  const rows = projects.map((project) => ({ status: project.status, value: 1 })) as RecordRow[]
  return distributionByKey(rows, 'status', ['value'])
}

function projectProgressDistribution(projects: ProjectRuntimeRow[]): DistributionPoint[] {
  const onTrack = projects.filter((project) => project.progress >= 70).length
  const watch = projects.filter((project) => project.progress > 0 && project.progress < 70).length
  const notStarted = projects.filter((project) => project.progress <= 0).length
  return [
    { label: 'Đúng tiến độ', value: onTrack, color: '#34d399' },
    { label: 'Cần theo dõi', value: watch, color: '#f59e0b' },
    { label: 'Chưa khởi động', value: notStarted, color: '#64748b' },
  ]
}

function qcDistribution(qc?: QcCockpit): DistributionPoint[] {
  if (!qc?.metrics) return []
  return [
    { label: 'Đạt', value: qc.metrics.passed, color: '#34d399' },
    { label: 'Không đạt', value: qc.metrics.failed, color: '#f87171' },
    { label: 'Rework', value: qc.metrics.rework, color: '#f59e0b' },
    { label: 'Đang kiểm', value: qc.metrics.inProgress, color: '#38bdf8' },
    { label: 'Chờ kiểm', value: qc.metrics.pending, color: '#94a3b8' },
  ]
}

function dispatchDistribution(orders: DispatchOrder[]): DistributionPoint[] {
  const rows = orders.map((order) => ({ status: statusLabel[order.status] ?? order.status, value: 1 })) as RecordRow[]
  return distributionByKey(rows, 'status', ['value'])
}

function topByKey(rows: RecordRow[], labelKey: string, valueKeys: string[], valueResolver?: (row: RecordRow) => number): SeriesPoint[] {
  const map = new Map<string, number>()
  rows.forEach((row) => {
    const label = str(row[labelKey]) || transactionMaterialLabel(row) || str(row.code) || str(row.name) || 'Chưa đặt tên'
    map.set(label, (map.get(label) ?? 0) + (valueResolver ? valueResolver(row) : firstNumber(row, valueKeys)))
  })
  return Array.from(map.entries()).filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, value]) => ({ label, value }))
}

function uniqueCount(rows: RecordRow[], key: string) {
  return new Set(rows.map((row) => str(row[key])).filter(Boolean)).size
}

function transactionActivity(row: RecordRow) {
  return {
    title: str(row.transactionNo) || str(row.code) || str(row.id) || 'Giao dịch',
    subtitle: `${transactionType(row) || 'Inventory'} · ${transactionMaterialLabel(row) || 'Vật tư'}`,
    time: dateTime(rowDateString(row)),
  }
}

function transactionMaterialLabel(row: RecordRow) {
  const direct = str(row.itemCode)
    || str(row.materialCode)
    || str(row.materialName)
    || str(row.itemName)
    || str(row.name)
  if (direct) return direct
  const firstLine = nestedLineRows(row)[0]
  if (!firstLine) return ''
  return str(firstLine.materialCode)
    || str(firstLine.itemCode)
    || str(asRecord(firstLine.material).code)
    || str(asRecord(firstLine.inventoryItem).code)
    || str(firstLine.materialName)
    || str(firstLine.itemName)
    || str(asRecord(firstLine.material).name)
    || str(asRecord(firstLine.inventoryItem).name)
}

function transactionWarehouseLabel(row: RecordRow) {
  const direct = str(row.warehouse)
    || str(row.warehouseName)
    || str(asRecord(row.warehouse).name)
    || str(asRecord(row.warehouse).code)
  if (direct) return direct
  const firstLine = nestedLineRows(row)[0]
  if (!firstLine) return ''
  return str(firstLine.warehouse)
    || str(firstLine.warehouseName)
    || str(asRecord(firstLine.warehouse).name)
    || str(asRecord(firstLine.warehouse).code)
}

function buildAlerts({ lowStockItems, dispatchOrders, openNcr, projects }: { lowStockItems: RecordRow[]; dispatchOrders: DispatchOrder[]; openNcr: number; projects: ProjectRuntimeRow[] }): AlertRow[] {
  const alerts: AlertRow[] = []
  const negative = lowStockItems.find((item) => (num(item, 'currentStock') || num(item, 'quantity')) < 0)
  if (negative) alerts.push({ id: 'negative-stock', type: 'Tồn kho âm', level: 'Cao', content: `${str(negative.materialCode) || str(negative.code) || str(negative.materialName) || str(negative.name)} đang có tồn âm`, impact: 'Cần kiểm tra ledger và giao dịch kho', time: dateTime(str(negative.updatedAt) || str(negative.createdAt)), domain: 'inventory' })
  const low = lowStockItems.find((item) => (num(item, 'currentStock') || num(item, 'quantity')) >= 0)
  if (low) alerts.push({ id: 'low-stock', type: 'Tồn kho thấp', level: 'Cao', content: `${str(low.materialCode) || str(low.code) || str(low.materialName) || str(low.name)} đang dưới ngưỡng tối thiểu`, impact: 'Có thể ảnh hưởng sản xuất/giao hàng', time: dateTime(str(low.updatedAt) || str(low.createdAt)), domain: 'inventory' })
  const now = Date.now()
  const lateDelivery = dispatchOrders.find((order) => ['PLANNED', 'LOADING', 'IN_TRANSIT'].includes(order.status) && order.plannedAt && new Date(order.plannedAt).getTime() < now)
  if (lateDelivery) alerts.push({ id: 'dispatch-late', type: 'Giao hàng trễ kế hoạch', level: 'Cao', content: `${lateDelivery.code} đã quá thời gian kế hoạch`, impact: 'Rủi ro trễ tiến độ công trình', time: dateTime(lateDelivery.plannedAt), domain: 'dispatch' })
  const cancelled = dispatchOrders.find((order) => order.status === 'CANCELLED')
  if (cancelled) alerts.push({ id: 'dispatch-cancelled', type: 'Điều xe bị hủy', level: 'Trung bình', content: `${cancelled.code} đã hủy`, impact: 'Cần kiểm tra lịch giao nhận', time: dateTime(cancelled.updatedAt || cancelled.createdAt), domain: 'dispatch' })
  if (openNcr > 0) alerts.push({ id: 'qc-ncr', type: 'QC / NCR mở', level: 'Cao', content: `Còn ${fmt(openNcr)} NCR chưa đóng`, impact: 'Có thể chặn chuyển bãi/giao hàng', time: dateTime(new Date().toISOString()), domain: 'qc' })
  const delayed = projects.find((project) => project.delayedOrders > 0)
  if (delayed) alerts.push({ id: 'project-delay', type: 'Dự án chậm tiến độ', level: 'Trung bình', content: `${delayed.name} có ${fmt(delayed.delayedOrders)} lệnh chậm`, impact: 'Rủi ro trễ hạn bàn giao', time: dateTime(delayed.updatedAt), domain: 'projects' })
  return alerts
}

function lateDispatchCount(orders: DispatchOrder[]) {
  const now = Date.now()
  return orders.filter((order) => ['PLANNED', 'LOADING', 'IN_TRANSIT'].includes(order.status) && order.plannedAt && new Date(order.plannedAt).getTime() < now).length
}

function colorAt(index: number) {
  return ['#38bdf8', '#34d399', '#f59e0b', '#a78bfa', '#f87171', '#818cf8', '#fb923c', '#94a3b8'][index % 8]
}
