import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, BarChart3, Boxes, CheckCircle2, Factory, PackagePlus, ShieldCheck, TrendingDown, TrendingUp, Truck, Warehouse } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { useComponents } from '@/modules/components/hooks/queries/useComponents'
import { useInventoryAudit } from '@/modules/inventory/hooks/useInventoryAudit'
import { useInventoryTransactions } from '@/modules/inventory/hooks/useInventoryTransactions'
import { useProductionOrders } from '@/modules/production/hooks/useProductionCockpit'
import { getQcCockpit } from '@/modules/qc/api/qc.api'
import { useYardMetricsRuntime, useYardMovementsRuntime } from '@/modules/yard/hooks/queries/useYardRuntime'
import { OperationalShell } from '@/shared/layouts/OperationalShell'
import {
  ModuleAnalyticsPanel,
  ModuleEmptyState,
  ModuleKpiCard,
  ModuleKpiStrip,
  ModuleLoadingState,
  ModulePageHeader,
  moduleMutedButton,
  type ModuleTone,
} from '@/shared/ui/modules'
import { formatQuantity } from '@/shared/utils/number-format'
import { getDashboardCockpit, type DashboardCockpit } from '@/services/api/dashboard.api'

const fmt = (value = 0, digits = 0) => formatQuantity(value, digits)
const colors = ['#1d7cff', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#38bdf8']

export function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardCockpit>({
    queryKey: ['dashboard-cockpit'],
    queryFn: getDashboardCockpit,
    refetchInterval: 10000,
  })
  const { data: transactionsRaw = [] } = useInventoryTransactions({})
  const { data: inventoryRows = [] } = useInventoryAudit()
  const { data: components = [] } = useComponents()
  const { data: productionOrders = [] } = useProductionOrders()
  const { data: yardMetrics } = useYardMetricsRuntime()
  const { data: yardMovements = [] } = useYardMovementsRuntime()
  const { data: qc } = useQuery({ queryKey: ['qc-cockpit'], queryFn: getQcCockpit, refetchInterval: 10000 })

  const transactions = normalizeRows(transactionsRaw)
  const materialRecommendations = useMemo(() => buildMaterialRecommendations(inventoryRows, transactions), [inventoryRows, transactions])
  const inventoryForecast = useMemo(() => buildInventoryForecast(data, inventoryRows, transactions), [data, inventoryRows, transactions])
  const componentPipeline = useMemo(() => buildComponentPipeline(components, productionOrders), [components, productionOrders])
  const componentForecast = useMemo(() => buildComponentForecast(componentPipeline, productionOrders), [componentPipeline, productionOrders])
  const yardAnalytics = useMemo(() => buildYardAnalytics(yardMetrics, yardMovements), [yardMetrics, yardMovements])
  const qcTrend = useMemo(() => buildQcTrend(qc), [qc])
  const executiveAlerts = useMemo(
    () => buildExecutiveAlerts(data, inventoryForecast, componentPipeline, yardAnalytics, qcTrend, materialRecommendations, componentForecast),
    [data, inventoryForecast, componentPipeline, yardAnalytics, qcTrend, materialRecommendations, componentForecast],
  )
  const kpis = data?.kpis

  return (
    <OperationalShell>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_30%),linear-gradient(135deg,#06111e_0%,#081827_52%,#0b1220_100%)] p-4 text-slate-100">
        <ModulePageHeader
          eyebrow="Executive Dashboard"
          title="Tổng quan điều hành"
          description="Inventory forecast, component pipeline, yard occupancy, QC quality trend và executive alerts từ dữ liệu vận hành hiện có."
          action={<button className={moduleMutedButton}>Cập nhật mỗi 10 giây</button>}
        />

        {isLoading ? <ModuleLoadingState variant="kpi" label="Đang tải dashboard..." /> : (
          <ModuleKpiStrip className="md:grid-cols-2 xl:grid-cols-5">
            <ExecutiveKpi icon={Warehouse} title="Inventory pressure" value={`${fmt(inventoryForecast.daysOfCover, 1)} ngày`} note={inventoryForecast.assumption} tone={inventoryForecast.daysOfCover < 7 ? 'red' : 'cyan'} />
            <ExecutiveKpi icon={Factory} title="Production active" value={fmt(kpis?.productionActive)} note={`${fmt(kpis?.productionOrders)} MO tổng`} tone="emerald" />
            <ExecutiveKpi icon={Boxes} title="Component pipeline" value={fmt(componentPipeline.total)} note={`${fmt(componentPipeline.ready + componentPipeline.shipped)} ready/shipped`} tone="purple" />
            <ExecutiveKpi icon={Truck} title="Yard occupancy" value={`${fmt(yardAnalytics.occupancyRate, 1)}%`} note={`${fmt(yardAnalytics.occupiedSlots)}/${fmt(yardAnalytics.totalSlots)} slot`} tone={yardAnalytics.occupancyRate >= 85 ? 'red' : 'amber'} />
            <ExecutiveKpi icon={ShieldCheck} title="QC pass rate" value={`${fmt(qcTrend.passRate, 1)}%`} note={`${fmt(qcTrend.openIssues)} open issues`} tone={qcTrend.passRate < 90 ? 'amber' : 'emerald'} />
          </ModuleKpiStrip>
        )}

        <div className="mt-3 grid gap-3 xl:grid-cols-[1.1fr_1.1fr_.8fr]">
          <InventoryForecastPanel forecast={inventoryForecast} />
          <ComponentPipelinePanel pipeline={componentPipeline} />
          <ExecutiveAlertsPanel alerts={executiveAlerts} />
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-[1.25fr_.75fr]">
          <MaterialReplenishmentPanel recommendations={materialRecommendations} />
          <ComponentForecastPanel forecast={componentForecast} />
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-[.95fr_.95fr_1.1fr]">
          <YardOccupancyPanel analytics={yardAnalytics} />
          <QcTrendPanel trend={qcTrend} />
          <ProductionSignalPanel data={data} productionOrders={productionOrders} />
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-[1.1fr_.9fr]">
          <ModuleAnalyticsPanel title="Dự án điều hành" note="Tiến độ từ dashboard cockpit hiện có">
            <HorizontalBars rows={(data?.projects ?? []).map((project) => ({ label: `${project.code} - ${project.name}`, value: project.progress }))} max={100} suffix="%" />
          </ModuleAnalyticsPanel>
          <ModuleAnalyticsPanel title="Assumptions" note="Không dùng AI/ML, chỉ dùng tính toán tuyến tính đơn giản">
            <div className="space-y-2 text-xs text-slate-300">
              {[
                inventoryForecast.assumption,
                componentPipeline.assumption,
                yardAnalytics.assumption,
                qcTrend.assumption,
              ].map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2">{item}</div>
              ))}
            </div>
          </ModuleAnalyticsPanel>
        </div>
      </main>
    </OperationalShell>
  )
}

function ExecutiveKpi({ icon: Icon, title, value, note, tone }: { icon: LucideIcon; title: string; value: string; note: string; tone: ModuleTone }) {
  return <ModuleKpiCard icon={<Icon size={18} />} title={title} value={value} note={note} tone={tone} className="h-[112px]" />
}

function InventoryForecastPanel({ forecast }: { forecast: InventoryForecast }) {
  return (
    <ModuleAnalyticsPanel title="Inventory Forecast" note="Dự báo tuyến tính từ tồn hiện tại và movement gần đây">
      <div className="grid gap-3 md:grid-cols-[170px_1fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-center">
          <div className={forecast.trendDirection === 'down' ? 'text-red-300' : 'text-emerald-300'}>
            {forecast.trendDirection === 'down' ? <TrendingDown className="mx-auto" size={28} /> : <TrendingUp className="mx-auto" size={28} />}
          </div>
          <div className="mt-3 text-3xl font-semibold text-white">{fmt(forecast.projectedStock, 1)}</div>
          <div className="mt-1 text-xs text-slate-500">Projected stock / 7 ngày</div>
        </div>
        <div className="space-y-3">
          <MetricLine label="Tồn hiện tại" value={fmt(forecast.currentStock, 1)} />
          <MetricLine label="Net movement/ngày" value={fmt(forecast.netDailyMovement, 2)} tone={forecast.netDailyMovement < 0 ? 'red' : 'emerald'} />
          <MetricLine label="Days of cover" value={`${fmt(forecast.daysOfCover, 1)} ngày`} tone={forecast.daysOfCover < 7 ? 'red' : 'cyan'} />
          <Sparkline rows={forecast.trendRows} />
        </div>
      </div>
    </ModuleAnalyticsPanel>
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
  return (
    <ModuleAnalyticsPanel title="Component Pipeline" note="Lifecycle cấu kiện từ dữ liệu components hiện có">
      <div className="grid gap-3 md:grid-cols-[150px_1fr]">
        <Donut rows={rows} center={fmt(pipeline.total)} label="cấu kiện" />
        <HorizontalBars rows={rows.map((row) => ({ label: row.label, value: row.value }))} max={Math.max(1, ...rows.map((row) => row.value))} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
        <MetricLine label="Open MO" value={fmt(pipeline.openProduction)} />
        <MetricLine label="Completion" value={`${fmt(pipeline.completionRate, 1)}%`} tone="emerald" />
        <MetricLine label="In transit" value={fmt(pipeline.shipped)} tone="cyan" />
        <MetricLine label="Installed" value={fmt(pipeline.installed)} tone="blue" />
      </div>
    </ModuleAnalyticsPanel>
  )
}

function MaterialReplenishmentPanel({ recommendations }: { recommendations: MaterialRecommendation[] }) {
  const urgent = recommendations.filter((row) => row.recommendedQty > 0)
  const bars = urgent.slice(0, 6).map((row) => ({ label: row.code, value: row.recommendedQty }))
  return (
    <ModuleAnalyticsPanel title="Dự báo cần mua / nhập vật tư" note="Ước tính từ tồn hiện tại, tồn tối thiểu và xuất kho gần đây">
      <div className="grid gap-3 lg:grid-cols-[.9fr_1.35fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-white"><PackagePlus size={16} />Top đề xuất nhập</span>
            <span className="text-xs text-slate-500">{fmt(urgent.length)} mã</span>
          </div>
          <div className="mt-3">
            {bars.length ? <HorizontalBars rows={bars} max={Math.max(1, ...bars.map((row) => row.value))} /> : (
              <ModuleEmptyState title="Chưa có vật tư cần nhập" description="Các mã đang trên ngưỡng tồn tối thiểu theo dữ liệu hiện có." />
            )}
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40">
          <div className="grid grid-cols-[1.4fr_.7fr_.8fr_.8fr_.95fr] gap-2 border-b border-white/10 px-3 py-2 text-[11px] uppercase tracking-wide text-slate-500">
            <span>Vật tư</span>
            <span className="text-right">Tồn</span>
            <span className="text-right">7 ngày</span>
            <span className="text-right">Đề xuất</span>
            <span>Hành động</span>
          </div>
          <div className="divide-y divide-white/10">
            {recommendations.slice(0, 7).map((row) => (
              <div key={row.key} className="grid grid-cols-[1.4fr_.7fr_.8fr_.8fr_.95fr] items-center gap-2 px-3 py-2 text-xs">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-100">{row.code}</div>
                  <div className="truncate text-[11px] text-slate-500">{row.name}</div>
                </div>
                <span className="text-right text-slate-200">{fmt(row.currentStock, 3)} {row.unit}</span>
                <span className={`text-right ${row.projected7d <= row.minimumStock ? 'text-red-300' : 'text-emerald-300'}`}>{fmt(row.projected7d, 3)}</span>
                <span className="text-right text-amber-200">{row.recommendedQty > 0 ? fmt(row.recommendedQty, 3) : '-'}</span>
                <span className={`rounded-lg border px-2 py-1 text-[11px] ${row.tone === 'red' ? 'border-red-500/30 bg-red-500/10 text-red-200' : row.tone === 'amber' ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200'}`}>
                  {row.action}
                </span>
              </div>
            ))}
            {!recommendations.length && <ModuleEmptyState title="Chưa có dữ liệu vật tư" description="Dashboard sẽ hiển thị dự báo khi Inventory Audit có dữ liệu." />}
          </div>
        </div>
      </div>
    </ModuleAnalyticsPanel>
  )
}

function ComponentForecastPanel({ forecast }: { forecast: ComponentForecast }) {
  return (
    <ModuleAnalyticsPanel title="Dự báo cấu kiện 7 ngày" note="Dựa trên pipeline cấu kiện và MO đang mở">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <MiniMetric label="Ready hiện tại" value={fmt(forecast.readyNow)} tone="emerald" />
          <MiniMetric label="Dự báo ready" value={fmt(forecast.forecastReady7d)} tone="amber" />
        </div>
        <Sparkline rows={forecast.rows} />
        <MetricLine label="MO đang mở" value={fmt(forecast.activeProduction)} tone="cyan" />
        <MetricLine label="Chờ bàn giao" value={fmt(forecast.shippedBacklog)} tone={forecast.shippedBacklog > 0 ? 'amber' : 'emerald'} />
        <MetricLine label="Chờ lắp đặt" value={fmt(forecast.installBacklog)} tone={forecast.installBacklog > 0 ? 'amber' : 'emerald'} />
        <div className="rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-xs text-slate-400">{forecast.assumption}</div>
      </div>
    </ModuleAnalyticsPanel>
  )
}

function YardOccupancyPanel({ analytics }: { analytics: YardAnalytics }) {
  return (
    <ModuleAnalyticsPanel title="Yard Occupancy" note="Từ Yard runtime metrics và movements">
      <div className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-4xl font-semibold text-white">{fmt(analytics.occupancyRate, 1)}%</div>
            <div className="mt-1 text-xs text-slate-500">occupied slots</div>
          </div>
          <div className={`rounded-xl border px-3 py-2 text-xs ${analytics.occupancyRate >= 85 ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'}`}>
            {analytics.occupancyRate >= 85 ? 'High pressure' : 'Normal'}
          </div>
        </div>
        <Meter value={analytics.occupancyRate} />
        <MetricLine label="Inbound" value={fmt(analytics.inbound)} tone="emerald" />
        <MetricLine label="Outbound" value={fmt(analytics.outbound)} tone="amber" />
        <MetricLine label="Internal moves" value={fmt(analytics.moves)} tone="cyan" />
      </div>
    </ModuleAnalyticsPanel>
  )
}

function QcTrendPanel({ trend }: { trend: QcTrend }) {
  return (
    <ModuleAnalyticsPanel title="QC Quality Trend" note="Pass/rework/fail từ QC cockpit hiện có">
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <MiniMetric label="Pass" value={fmt(trend.passed)} tone="emerald" />
          <MiniMetric label="Rework" value={fmt(trend.rework)} tone="amber" />
          <MiniMetric label="Failed" value={fmt(trend.failed)} tone="red" />
        </div>
        <Sparkline rows={trend.rows} />
        <MetricLine label="Pass rate" value={`${fmt(trend.passRate, 1)}%`} tone={trend.passRate < 90 ? 'amber' : 'emerald'} />
        <MetricLine label="NCR mở" value={fmt(trend.openNcrs)} tone={trend.openNcrs > 0 ? 'red' : 'emerald'} />
      </div>
    </ModuleAnalyticsPanel>
  )
}

function ProductionSignalPanel({ data, productionOrders }: { data?: DashboardCockpit; productionOrders: any[] }) {
  const statusRows = (data?.productionStatus ?? []).map((row, index) => ({
    label: productionLabel(row.status),
    value: row.count,
    color: colors[index % colors.length],
  }))
  const overdue = productionOrders.filter((row) => row.status === 'DELAYED').length
  return (
    <ModuleAnalyticsPanel title="Production Signal" note="Manufacturing Orders và trạng thái sản xuất hiện có">
      <div className="grid gap-3 md:grid-cols-[150px_1fr]">
        <Donut rows={statusRows.length ? statusRows : [{ label: 'No data', value: 1, color: '#334155' }]} center={fmt(data?.kpis.productionOrders)} label="MO" />
        <div className="space-y-2">
          <MetricLine label="Active" value={fmt(data?.productionSummary.active)} tone="emerald" />
          <MetricLine label="Waiting" value={fmt(data?.productionSummary.waiting)} tone="amber" />
          <MetricLine label="Completed" value={fmt(data?.productionSummary.completed)} tone="blue" />
          <MetricLine label="Delayed" value={fmt(overdue || data?.productionSummary.delayed)} tone={(overdue || data?.productionSummary.delayed) ? 'red' : 'emerald'} />
        </div>
      </div>
    </ModuleAnalyticsPanel>
  )
}

function ExecutiveAlertsPanel({ alerts }: { alerts: ExecutiveAlert[] }) {
  return (
    <ModuleAnalyticsPanel title="Executive Alerts" note="Rules-based, không dùng AI/ML">
      <div className="space-y-2">
        {alerts.length ? alerts.map((alert) => (
          <div key={alert.code} className={`rounded-xl border px-3 py-2 text-xs ${alert.tone === 'red' ? 'border-red-500/30 bg-red-500/10 text-red-100' : alert.tone === 'amber' ? 'border-amber-500/30 bg-amber-500/10 text-amber-100' : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100'}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 font-semibold"><AlertTriangle size={14} />{alert.title}</span>
              <span>{alert.value}</span>
            </div>
            <div className="mt-1 text-slate-300">{alert.description}</div>
          </div>
        )) : <ModuleEmptyState title="Không có cảnh báo điều hành" description="Các rule hiện tại chưa phát hiện rủi ro nổi bật." />}
      </div>
    </ModuleAnalyticsPanel>
  )
}

function MetricLine({ label, value, tone = 'cyan' }: { label: string; value: string; tone?: ModuleTone | 'red' }) {
  const color = tone === 'red' ? 'text-red-300' : tone === 'emerald' ? 'text-emerald-300' : tone === 'amber' ? 'text-amber-300' : tone === 'blue' ? 'text-blue-300' : 'text-cyan-300'
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-xs">
      <span className="text-slate-400">{label}</span>
      <b className={color}>{value}</b>
    </div>
  )
}

function MiniMetric({ label, value, tone }: { label: string; value: string; tone: 'emerald' | 'amber' | 'red' }) {
  const color = tone === 'emerald' ? 'text-emerald-300' : tone === 'amber' ? 'text-amber-300' : 'text-red-300'
  return <div className="rounded-xl border border-white/10 bg-slate-950/35 p-3"><div className={`text-lg font-semibold ${color}`}>{value}</div><div className="text-[11px] text-slate-500">{label}</div></div>
}

function Meter({ value }: { value: number }) {
  const color = value >= 85 ? 'bg-red-500' : value >= 65 ? 'bg-amber-400' : 'bg-emerald-500'
  return <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(4, value))}%` }} /></div>
}

function Sparkline({ rows }: { rows: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...rows.map((row) => row.value))
  return (
    <div className="flex h-28 items-end gap-2 rounded-xl border border-white/10 bg-slate-950/35 px-3 pb-3">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-1 flex-col items-center justify-end gap-1">
          <div className="w-full rounded-t bg-gradient-to-t from-blue-700 to-cyan-400" style={{ height: `${Math.max(6, (row.value / max) * 100)}%` }} />
          <span className="max-w-14 truncate text-[9px] text-slate-500">{row.label}</span>
        </div>
      ))}
    </div>
  )
}

function HorizontalBars({ rows, max, suffix = '' }: { rows: Array<{ label: string; value: number }>; max: number; suffix?: string }) {
  if (!rows.length) return <ModuleEmptyState title="Chưa có dữ liệu" description="Panel sẽ tự cập nhật khi có dữ liệu vận hành." />
  return (
    <div className="space-y-2">
      {rows.slice(0, 8).map((row) => (
        <div key={row.label} className="grid grid-cols-[minmax(110px,1fr)_120px_54px] items-center gap-3 text-xs">
          <span className="truncate text-slate-300">{row.label}</span>
          <span className="h-2 rounded bg-slate-800"><i className="block h-full rounded bg-cyan-500" style={{ width: `${Math.max(4, Math.min(100, (row.value / Math.max(1, max)) * 100))}%` }} /></span>
          <b className="text-right text-slate-200">{fmt(row.value, 1)}{suffix}</b>
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
    <div className="grid grid-cols-[116px_1fr] items-center gap-3">
      <div className="relative h-28 w-28 rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="absolute inset-3 rounded-full bg-[#08111f]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center"><div className="text-xl font-semibold">{center}</div><div className="text-[10px] text-slate-500">{label}</div></div>
      </div>
      <div className="space-y-1.5 overflow-hidden text-[11px]">
        {rows.slice(0, 5).map((row) => <div key={row.label} className="flex justify-between gap-2"><span className="flex min-w-0 items-center gap-1.5 text-slate-300"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} /> <span className="truncate">{row.label}</span></span><b>{fmt(row.value)}</b></div>)}
      </div>
    </div>
  )
}

type InventoryForecast = {
  currentStock: number
  inboundDaily: number
  outboundDaily: number
  netDailyMovement: number
  projectedStock: number
  daysOfCover: number
  trendDirection: 'up' | 'down'
  trendRows: Array<{ label: string; value: number }>
  assumption: string
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

function buildInventoryForecast(data: DashboardCockpit | undefined, inventoryRows: any[], transactions: any[]): InventoryForecast {
  const currentStock = inventoryRows.reduce((sum, row) => sum + Number(row.currentStock ?? row.quantity ?? 0), 0)
  const trendRows = data?.movementTrend?.length ? data.movementTrend.map((row) => ({ label: row.label, value: Number(row.value ?? 0) })) : lastSevenRows(transactions)
  const recent = transactions.slice(0, 80)
  const inbound = recent.filter((tx) => isInbound(tx)).reduce((sum, tx) => sum + transactionQuantity(tx), 0)
  const outbound = recent.filter((tx) => isOutbound(tx)).reduce((sum, tx) => sum + transactionQuantity(tx), 0)
  const days = Math.max(1, Math.min(14, trendRows.length || 7))
  const inboundDaily = inbound / days
  const outboundDaily = outbound / days
  const fallbackNet = trendRows.length >= 2 ? (trendRows.at(-1)!.value - trendRows[0].value) / Math.max(1, trendRows.length - 1) : 0
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
    trendRows: trendRows.length ? trendRows : [{ label: 'No data', value: 0 }],
    assumption: recent.length ? 'Forecast = current stock + 7 ngày net movement gần nhất.' : 'Thiếu transaction chi tiết; dùng movementTrend dashboard hoặc placeholder.',
  }
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
    assumption: 'Pipeline lấy trực tiếp từ Component.status; completion = INSTALLED / tổng cấu kiện.',
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
    assumption: 'Forecast +7d = READY hiện tại + một phần MO đang mở theo tốc độ hoàn thành gần đúng.',
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
    assumption: metrics ? 'Occupancy lấy từ Yard runtime metrics; movement count lấy từ Yard movements hiện có.' : 'Thiếu Yard metrics; hiển thị placeholder 0.',
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
    assumption: qc ? 'QC trend dùng QC cockpit aggregate hiện có; chưa có time-series QC theo ngày.' : 'Thiếu QC cockpit; hiển thị placeholder.',
  }
}

function buildExecutiveAlerts(data: DashboardCockpit | undefined, inventory: InventoryForecast, components: ComponentPipeline, yard: YardAnalytics, qc: QcTrend, materials: MaterialRecommendation[], componentForecast: ComponentForecast): ExecutiveAlert[] {
  const alerts: ExecutiveAlert[] = []
  materials.filter((row) => row.recommendedQty > 0).slice(0, 3).forEach((row) => {
    alerts.push({
      code: `material-${row.key}`,
      title: row.action,
      value: `${row.code}: ${fmt(row.recommendedQty, 3)} ${row.unit}`,
      description: `Tồn ${fmt(row.currentStock, 3)}; dự báo 7 ngày còn ${fmt(row.projected7d, 3)}.`,
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

function lastSevenRows(transactions: any[]) {
  const map = new Map<string, number>()
  transactions.forEach((tx) => {
    const label = String(tx.transactionDate ?? tx.createdAt ?? '').slice(5, 10) || '-'
    map.set(label, (map.get(label) ?? 0) + transactionQuantity(tx))
  })
  return Array.from(map.entries()).slice(-7).map(([label, value]) => ({ label, value }))
}

function productionLabel(value: string) {
  const labels: Record<string, string> = {
    DRAFT: 'Nháp',
    PLANNED: 'Đã lên kế hoạch',
    RELEASED: 'Đã phát hành',
    IN_PROGRESS: 'Đang sản xuất',
    DELAYED: 'Trễ tiến độ',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
  }
  return labels[value] ?? value
}
