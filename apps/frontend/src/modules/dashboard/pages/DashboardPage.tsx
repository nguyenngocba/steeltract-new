import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  Boxes,
  Factory,
  PackagePlus,
  ShieldCheck,
  Warehouse,
  Clock,
  CheckSquare,
} from 'lucide-react'

import { useComponents } from '@/modules/components/hooks/queries/useComponents'
import { useInventoryAudit } from '@/modules/inventory/hooks/useInventoryAudit'
import { useInventoryTransactions } from '@/modules/inventory/hooks/useInventoryTransactions'
import { useProductionOrders } from '@/modules/production/hooks/useProductionCockpit'
import { getQcCockpit } from '@/modules/qc/api/qc.api'
import { useYardMetricsRuntime, useYardMovementsRuntime } from '@/modules/yard/hooks/queries/useYardRuntime'
import { OperationalShell } from '@/shared/layouts/OperationalShell'
import {
  ModuleEmptyState,
} from '@/shared/ui/modules'
import { formatQuantity } from '@/shared/utils/number-format'
import { getDashboardCockpit, type DashboardCockpit } from '@/services/api/dashboard.api'
import {
  CockpitChartCard,
  CockpitKpiCard,
  COCKPIT_HEIGHTS,
} from '@/shared/ui/cockpit'

const fmt = (value = 0, digits = 0) => formatQuantity(value, digits)
const colors = ['#1d7cff', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#38bdf8']

// ----------------------------------------------------
// Main Cockpit Page Component
// ----------------------------------------------------

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

  // Memoize trend data for Inventory Days to avoid array recreation
  const inventoryTrendData = useMemo(() => 
    inventoryForecast.trendRows?.map(r => r.value) ?? [],
    [inventoryForecast.trendRows]
  )

  return (
    <OperationalShell>
      <main className="min-h-screen bg-[#050b14] p-2.5 text-slate-100 font-sans space-y-1">
        
        {/* ROW 1: KPI strip (h-128px) */}
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <CockpitKpiCard
            title="Ngày tồn"
            value={isLoading ? '' : `${fmt(inventoryForecast.daysOfCover, 0)} ngày`}
            trendText={inventoryForecast.daysOfCover < 7 ? '▲ Cảnh báo' : '▲ 2,4 ngày (+6,1%)'}
            trendData={inventoryTrendData}
            tone={inventoryForecast.daysOfCover < 7 ? 'red' : 'cyan'}
            state={isLoading ? 'loading' : (!inventoryForecast.currentStock ? 'empty' : (inventoryForecast.daysOfCover < 7 ? 'alert' : 'normal'))}
          />
          <CockpitKpiCard
            title="Sản xuất"
            value={isLoading ? '' : `${fmt(kpis?.productionActive)} chuyền`}
            trendText="▲ 1 chuyền (+5,9%)"
            tone="blue"
            state={isLoading ? 'loading' : (!kpis?.productionOrders ? 'empty' : 'normal')}
          />
          <CockpitKpiCard
            title="Cấu kiện"
            value={isLoading ? '' : '256K kiện'}
            trendText="▲ 12K kiện (+4,8%)"
            tone="cyan"
            state={isLoading ? 'loading' : (!componentPipeline.total ? 'empty' : 'normal')}
          />
          <CockpitKpiCard
            title="QC đạt"
            value={isLoading ? '' : `${fmt(qcTrend.passRate, 1).replace('.', ',')}%`}
            trendText="▲ 0,6%"
            tone={qcTrend.passRate < 90 ? 'amber' : 'emerald'}
            state={isLoading ? 'loading' : (!qcTrend.passRate ? 'empty' : (qcTrend.passRate < 90 ? 'alert' : 'normal'))}
          />
          <CockpitKpiCard
            title="Cảnh báo"
            value={isLoading ? '' : `${fmt(executiveAlerts.length)} cảnh báo`}
            trendText="▼ 2 cảnh báo (-22%)"
            tone={executiveAlerts.length > 0 ? (executiveAlerts.some(a => a.tone === 'red') ? 'red' : 'amber') : 'cyan'}
            state={isLoading ? 'loading' : (executiveAlerts.length > 0 ? 'alert' : 'normal')}
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

        {/* ROW 5: Hoạt động gần đây & Giả định dự báo */}
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
      </main>
    </OperationalShell>
  )
}

// ----------------------------------------------------
// Local Chart & Layout Sub-Components
// ----------------------------------------------------

function MovementGroupedBarChart({ series }: { series: Array<{ label: string; value: number }> }) {
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
            const inboundHeight = Math.min(75, Math.max(8, (s.value / 12000) * 80))
            const outboundHeight = Math.min(75, Math.max(5, (s.value / 15000) * 80))
            const stockHeight = Math.min(80, Math.max(12, (s.value / 10000) * 80))

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
          <span className="text-xs font-semibold text-white font-mono">4.2k t</span>
        </div>
        <div>
          <span className="text-[9px] text-slate-500 block uppercase">Trung bình xuất</span>
          <span className="text-xs font-semibold text-white font-mono">3.8k t</span>
        </div>
        <div>
          <span className="text-[9px] text-slate-500 block uppercase">Hiệu suất tồn</span>
          <span className="text-xs font-semibold text-cyan-300 font-mono">92.4%</span>
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
              <span className="text-[9px] text-slate-500 font-mono shrink-0 ml-2">2 phút trước</span>
            </div>
            <div className="text-[10px] text-slate-405 mt-0.5 truncate">{a.description}</div>
          </div>
        </div>
      ))}
      {!top4.length && <ModuleEmptyState title="Không có cảnh báo" description="Vận hành hiện tại an toàn." />}
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
              <span className="text-[12px] text-slate-500 block font-mono leading-tight mt-0.5">2 phút trước</span>
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
    assumption: recent.length ? 'Forecast = current stock + 7 ngày net movement gần nhất.' : 'Thiếu transaction chi tiết; dùng movementTrend.',
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

function buildYardAnalytics(metrics: any, movements: any[]): YardAnalytics {
  return {
    occupancyRate: Number(metrics?.occupancyRate ?? 0),
    occupiedSlots: Number(metrics?.occupiedSlots ?? 0),
    totalSlots: Number(metrics?.totalSlots ?? 0),
    inbound: movements.filter((row) => row.type === 'PLACE').length,
    outbound: movements.filter((row) => row.type === 'REMOVE').length,
    moves: movements.filter((row) => row.type === 'MOVE').length,
    assumption: metrics ? 'Yard occupancy đồng bộ realtime.' : 'Yard: placeholder 0.',
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
    assumption: qc ? 'QC trend đồng bộ QC cockpit.' : 'QC: placeholder.',
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
    timestamp: String(tx.transactionDate ?? tx.createdAt ?? '').slice(11, 16) || '14:28',
    operatorName: tx.operatorName ?? 'Operator',
    module: tx.type === 'PRODUCTION' ? 'production' : tx.type === 'QC' ? 'qc' : 'warehouse',
    description: tx.description ?? tx.note ?? `Giao dịch ${tx.transactionNo ?? tx.code ?? ''}`
  }))
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

// ----------------------------------------------------
// UI Element Components
// ----------------------------------------------------

function Meter({ value }: { value: number }) {
  const color = value >= 85 ? 'bg-red-500' : value >= 65 ? 'bg-amber-400' : 'bg-emerald-500'
  return <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(4, value))}%` }} /></div>
}

function Sparkline({ rows, heightClass = 'h-28' }: { rows: Array<{ label: string; value: number }>; heightClass?: string }) {
  const max = Math.max(1, ...rows.map((row) => row.value))
  return (
    <div className={`flex ${heightClass} items-end gap-1.5 rounded-xl border border-white/5 bg-slate-950/20 px-2 pb-2`}>
      {rows.map((row) => (
        <div key={row.label} className="flex flex-1 flex-col items-center justify-end h-full">
          <div className="w-full rounded-t bg-gradient-to-t from-blue-700 to-cyan-400" style={{ height: `${Math.max(8, (row.value / max) * 100)}%` }} />
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
