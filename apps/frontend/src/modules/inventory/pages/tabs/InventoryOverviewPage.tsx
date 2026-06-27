import { useState, useEffect } from 'react'
import {
  CockpitChartCard,
  COCKPIT_HEIGHTS,
} from '@/shared/ui/cockpit'
import {
  Warehouse,
  Activity,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Inbox,
  Send,
  GitCompare,
  SlidersHorizontal,
  Clock,
} from 'lucide-react'

// Sub-components imports
import { ExecutiveKpiRow } from '../../components/dashboard/ExecutiveKpiRow'
import { ForecastAreaChart } from '../../components/dashboard/ForecastAreaChart'
import { PipelineDonut } from '../../components/dashboard/PipelineDonut'
import { OperationalPulse } from '../../components/dashboard/OperationalPulse'
import { AlertsPanel } from '../../components/dashboard/AlertsPanel'
import { ActivityTimeline } from '../../components/dashboard/ActivityTimeline'
import { PerformanceGaugesGrid } from '../../components/dashboard/PerformanceGauge'

// ----------------------------------------------------
// Mock Data Model
// ----------------------------------------------------
const mockDashboardData = {
  executiveKpis: [
    { id: 'inventory_days', title: 'Inventory Days', value: '42d', note: 'Ngày tồn kho trung bình', changePercent: -5.2, trend: [45, 44, 43, 42, 42, 42], tone: 'cyan' as const, icon: <Warehouse className="h-5 w-5" /> },
    { id: 'production_active', title: 'Production Active', value: '18 lines', note: 'Lò cao & dây chuyền chạy', changePercent: 89, trend: [15, 16, 17, 18, 18, 18], tone: 'cyan' as const, icon: <Activity className="h-5 w-5" /> },
    { id: 'component_pipeline', title: 'Component Pipeline', value: '256k t', note: 'Cấu kiện trong pipeline', changePercent: 12, trend: [240, 248, 252, 256, 256], tone: 'blue' as const, icon: <Layers className="h-5 w-5" /> },
    { id: 'qc_pass_rate', title: 'QC Pass Rate', value: '96.8%', note: 'Tỷ lệ đạt kiểm định QC', changePercent: 2, trend: [95.1, 95.8, 96.2, 96.8, 96.8], tone: 'emerald' as const, icon: <ShieldCheck className="h-5 w-5" /> },
    { id: 'open_alerts', title: 'Open Alerts', value: '7', note: 'Cảnh báo vận hành hoạt động', changePercent: 3, trend: [9, 8, 7, 7, 7], tone: 'orange' as const, icon: <AlertTriangle className="h-5 w-5" /> },
  ],
  forecast: {
    daysOfCover: 42,
    targetRangeMin: 10,
    targetRangeMax: 100,
    series: [
      { date: '26 Oct', currentStock: 18, dailyMovement: 12, demandForecast: 20 },
      { date: '28 Oct', currentStock: 16, dailyMovement: 14, demandForecast: 22 },
      { date: '02 Nov', currentStock: 22, dailyMovement: 15, demandForecast: 24 },
      { date: '08 Nov', currentStock: 28, dailyMovement: 19, demandForecast: 28 },
      { date: '14 Nov', currentStock: 32, dailyMovement: 24, demandForecast: 30 },
    ]
  },
  pipeline: {
    totalComponents: 78450,
    totalWeightTons: 256,
    segments: [
      { stage: 'raw_material', label: 'Nguyên liệu thô', value: 27457, percentage: 35, colorCode: '#06b6d4' },
      { stage: 'work_in_progress', label: 'Bán thành phẩm', value: 31380, percentage: 40, colorCode: '#3b82f6' },
      { stage: 'finished_goods', label: 'Thành phẩm', value: 15690, percentage: 20, colorCode: '#10b981' },
      { stage: 'scrap', label: 'Phế phẩm / Hao hụt', value: 3923, percentage: 5, colorCode: '#ef4444' }
    ]
  },
  operationalPulse: {
    shiftId: 'SHIFT-A',
    metrics: [
      { id: 'inbound', label: 'Today Inbound', count: 15, volume: 140, targetVolume: 200, icon: <Inbox className="h-4 w-4" /> },
      { id: 'outbound', label: 'Today Outbound', count: 12, volume: 98, targetVolume: 120, icon: <Send className="h-4 w-4" /> },
      { id: 'transfers', label: 'Transfers', count: 19, volume: 45, targetVolume: 50, icon: <GitCompare className="h-4 w-4" /> },
      { id: 'adjustments', label: 'Adjustments', count: 3, volume: -2, targetVolume: 5, icon: <SlidersHorizontal className="h-4 w-4" /> }
    ]
  },
  alerts: [
    { id: 'a1', timestamp: '14:15', severity: 'critical' as const, title: 'Furnace #4 Temperature Exceeded Limit', message: 'Nhiệt độ lò cao vượt quá 1600°C' },
    { id: 'a2', timestamp: '13:58', severity: 'critical' as const, title: 'Raw Material Scarcity Alert', message: 'Tồn kho quặng sắt dưới ngưỡng tối thiểu' },
    { id: 'a3', timestamp: '12:44', severity: 'critical' as const, title: 'Machine Breakdown (CRANE #2)', message: 'Cẩu trục chính mất tín hiệu điều khiển' },
    { id: 'a4', timestamp: '14:22', severity: 'warning' as const, title: 'Logistics Delay: Truck 789', message: 'Xe vận chuyển cấu kiện trễ 45 phút' },
    { id: 'a5', timestamp: '13:31', severity: 'warning' as const, title: 'Inventory Level Low - Alloy Steel', message: 'Tồn thép hợp kim sắp hết' },
    { id: 'a6', timestamp: '12:01', severity: 'info' as const, title: 'Upcoming QC Audit (EHS)', message: 'Đoàn kiểm định chất lượng sắp đến' }
  ],
  activity: [
    { id: 'e1', timestamp: '14:28', operatorName: 'Nguyen Van A', module: 'production', description: 'Production Order #P-7740 started' },
    { id: 'e2', timestamp: '14:19', operatorName: 'Tran Van B', module: 'qc', description: 'QC Check Passed: Heat #H-521 (98.2%)' },
    { id: 'e3', timestamp: '14:03', operatorName: 'Le Van C', module: 'warehouse', description: 'Inbound Shipment #I-3301 arrived' },
    { id: 'e4', timestamp: '13:47', operatorName: 'Le Van C', module: 'warehouse', description: 'Inventory Adjustment: Finished Rebar' }
  ],
  performance: {
    oee: 84,
    scheduleCompliance: 91,
    availabilityRate: 97,
    qualityRate: 89
  }
}

// ----------------------------------------------------
// Main Cockpit Page Component
// ----------------------------------------------------

export function InventoryOverviewPage() {
  const [timeStr, setTimeStr] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTimeStr(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + now.toLocaleDateString('vi-VN'))
    }
    updateTime()
    const timer = setInterval(updateTime, 60000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="w-full min-w-0 flex-1 space-y-1 bg-[#050b14] text-slate-100 font-sans p-2">
      {/* Cockpit Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-white">SteelTrack Executive Cockpit</h2>
          <span className="inline-flex items-center gap-1 rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            VẬN HÀNH TRỰC TUYẾN
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock className="h-3.5 w-3.5" />
          <span className="font-mono">{timeStr}</span>
        </div>
      </div>

      {/* Row 1: Executive KPIs (5 Cards Strip) */}
      <ExecutiveKpiRow kpis={mockDashboardData.executiveKpis} />

      {/* Row 2: Forecasting & Flow */}
      <div className="grid grid-cols-12 gap-1">
        <CockpitChartCard 
          title="Dự báo tồn kho & Sức chứa" 
          value="42 ngày bảo phủ"
          subtitle="Tồn kho hiện tại so với định mức nhu cầu"
          heightClass={COCKPIT_HEIGHTS.CHART_XL}
          className="col-span-12 xl:col-span-8"
        >
          <ForecastAreaChart series={mockDashboardData.forecast.series} />
        </CockpitChartCard>
        
        <CockpitChartCard 
          title="Trạng thái Pipeline cấu kiện" 
          value="78,450 kiện"
          subtitle="Cân đối bán thành phẩm sản xuất"
          heightClass={COCKPIT_HEIGHTS.CHART_XL}
          className="col-span-12 xl:col-span-4"
        >
          <PipelineDonut segments={mockDashboardData.pipeline.segments} />
        </CockpitChartCard>
      </div>

      {/* Row 3: Pulse & Exception registry */}
      <div className="grid grid-cols-12 gap-1">
        <CockpitChartCard 
          title="Nhịp độ vận hành" 
          value={`Ca hiện tại: ${mockDashboardData.operationalPulse.shiftId}`}
          subtitle="Giao dịch kho và điều chuyển vật tư trong ngày"
          heightClass={COCKPIT_HEIGHTS.PANEL_MD}
          className="col-span-12 xl:col-span-6"
        >
          <OperationalPulse metrics={mockDashboardData.operationalPulse.metrics} />
        </CockpitChartCard>

        <CockpitChartCard 
          title="Cảnh báo & Ngoại lệ" 
          value={`${mockDashboardData.alerts.filter(a => a.severity === 'critical').length} Lỗi nghiêm trọng`}
          subtitle="Vấn đề phát sinh trên chuỗi cung ứng"
          heightClass={COCKPIT_HEIGHTS.PANEL_MD}
          className="col-span-12 xl:col-span-6"
        >
          <AlertsPanel alerts={mockDashboardData.alerts} />
        </CockpitChartCard>
      </div>

      {/* Row 4: Chronology & efficiency */}
      <div className="grid grid-cols-12 gap-1">
        <CockpitChartCard 
          title="Nhật ký vận hành" 
          subtitle="Các sự kiện nhà máy, QC và điều chuyển kho"
          heightClass={COCKPIT_HEIGHTS.PANEL_SM}
          className="col-span-12 xl:col-span-7"
        >
          <ActivityTimeline activities={mockDashboardData.activity} />
        </CockpitChartCard>

        <CockpitChartCard 
          title="Hiệu suất nhà máy" 
          subtitle="OEE tổng thể và tỷ lệ tuân thủ lịch sản xuất"
          heightClass={COCKPIT_HEIGHTS.PANEL_SM}
          className="col-span-12 xl:col-span-5"
        >
          <PerformanceGaugesGrid performance={mockDashboardData.performance} />
        </CockpitChartCard>
      </div>
    </div>
  )
}
