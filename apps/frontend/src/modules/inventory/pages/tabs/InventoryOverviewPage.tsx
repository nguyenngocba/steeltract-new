import { useMemo, useState, useEffect } from 'react'
import {
  CockpitChartCard,
  CockpitKpiCard,
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
  CircleDot
} from 'lucide-react'

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
    { id: 'a1', timestamp: '14:15', severity: 'critical', title: 'Furnace #4 Temperature Exceeded Limit', message: 'Nhiệt độ lò cao vượt quá 1600°C' },
    { id: 'a2', timestamp: '13:58', severity: 'critical', title: 'Raw Material Scarcity Alert', message: 'Tồn kho quặng sắt dưới ngưỡng tối thiểu' },
    { id: 'a3', timestamp: '12:44', severity: 'critical', title: 'Machine Breakdown (CRANE #2)', message: 'Cẩu trục chính mất tín hiệu điều khiển' },
    { id: 'a4', timestamp: '14:22', severity: 'warning', title: 'Logistics Delay: Truck 789', message: 'Xe vận chuyển cấu kiện trễ 45 phút' },
    { id: 'a5', timestamp: '13:31', severity: 'warning', title: 'Inventory Level Low - Alloy Steel', message: 'Tồn thép hợp kim sắp hết' },
    { id: 'a6', timestamp: '12:01', severity: 'info', title: 'Upcoming QC Audit (EHS)', message: 'Đoàn kiểm định chất lượng sắp đến' }
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
// Sub-Components
// ----------------------------------------------------

function AreaForecastChart({ series }: { series: typeof mockDashboardData.forecast.series }) {
  const points = useMemo(() => {
    return series.map((s, idx) => {
      const x = (idx / (series.length - 1)) * 100
      const y = 90 - (s.currentStock / 40) * 70
      return `${x},${y}`
    }).join(' ')
  }, [series])

  const movementPoints = useMemo(() => {
    return series.map((s, idx) => {
      const x = (idx / (series.length - 1)) * 100
      const y = 90 - (s.dailyMovement / 40) * 70
      return `${x},${y}`
    }).join(' ')
  }, [series])

  return (
    <div className="relative h-[220px] w-full flex flex-col justify-between">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-[180px] w-full overflow-visible">
        {/* Grid Lines */}
        <line x1="0" y1="20" x2="100" y2="20" className="stroke-white/5" strokeWidth="0.5" />
        <line x1="0" y1="50" x2="100" y2="50" className="stroke-white/5" strokeWidth="0.5" />
        <line x1="0" y1="80" x2="100" y2="80" className="stroke-white/5" strokeWidth="0.5" />
        
        {/* Target Safety Zone */}
        <rect x="0" y="30" width="100" height="40" className="fill-cyan-500/[0.03]" />

        {/* Current Stock Area */}
        <polyline points={`0,100 ${points} 100,100`} fill="rgba(6,182,212,0.12)" stroke="none" />
        <polyline points={points} fill="none" stroke="#06b6d4" strokeWidth="2" vectorEffect="non-scaling-stroke" />

        {/* Daily Movement Line */}
        <polyline points={movementPoints} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />

        {/* Highlight Nodes */}
        {series.map((s, idx) => {
          const x = (idx / (series.length - 1)) * 100
          const y = 90 - (s.currentStock / 40) * 70
          return <circle key={idx} cx={x} cy={y} r="1.5" fill="#22d3ee" />
        })}
      </svg>
      <div className="grid grid-cols-5 gap-2 text-[10px] text-slate-500 mt-2">
        {series.map((s) => <span key={s.date} className="text-center">{s.date}</span>)}
      </div>
    </div>
  )
}

function DonutPipelineChart({ segments }: { segments: typeof mockDashboardData.pipeline.segments }) {
  const total = useMemo(() => segments.reduce((sum, s) => sum + s.value, 0), [segments])
  
  const paths = useMemo(() => {
    let cumulativePercent = 0
    return segments.map((s) => {
      const startPercent = cumulativePercent
      const endPercent = cumulativePercent + (s.value / total)
      cumulativePercent = endPercent
      return { ...s, startPercent, endPercent }
    })
  }, [segments, total])

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 h-full">
      <div className="relative h-32 w-32 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="h-full w-full">
          {paths.map((p, idx) => {
            const strokeDasharray = `${p.percentage} ${100 - p.percentage}`
            const strokeDashoffset = -p.startPercent * 100 + 25 // top start
            return (
              <circle
                key={idx}
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke={p.colorCode}
                strokeWidth="3.8"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500"
              />
            )
          })}
          <circle cx="18" cy="18" r="12" className="fill-[#08111f]" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-lg font-bold text-white">78.4k</div>
          <div className="text-[8px] uppercase tracking-wider text-slate-500">Tấn</div>
        </div>
      </div>
      <div className="flex-1 space-y-2 w-full">
        {segments.map((s) => (
          <div key={s.stage} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.colorCode }} />
              <span>{s.label}</span>
            </span>
            <span className="font-semibold text-white">{s.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PerformanceGauge({ value, label, tone = 'cyan' }: { value: number; label: string; tone?: 'cyan' | 'blue' }) {
  const radius = 16
  const strokeWidth = 2.5
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const strokeColor = tone === 'cyan' ? 'stroke-cyan-400' : 'stroke-blue-500'

  return (
    <div className="flex flex-col items-center justify-center p-1">
      <div className="relative h-14 w-14">
        <svg className="h-full w-full rotate-[-90deg]">
          <circle cx="18" cy="18" r={radius} className="stroke-white/5" strokeWidth={strokeWidth} fill="none" />
          <circle 
            cx="18" 
            cy="18" 
            r={radius} 
            className={`${strokeColor} transition-all duration-500`}
            strokeWidth={strokeWidth} 
            strokeDasharray={circumference} 
            strokeDashoffset={offset} 
            strokeLinecap="round" 
            fill="none" 
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white font-mono">{value}%</span>
      </div>
      <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mt-1 text-center truncate w-full">{label}</span>
    </div>
  )
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
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-5">
        {mockDashboardData.executiveKpis.map((kpi) => (
          <CockpitKpiCard
            key={kpi.id}
            title={kpi.title}
            value={kpi.value}
            subtitle={kpi.note}
            icon={kpi.icon}
            trend={kpi.trend}
            tone={kpi.tone}
          />
        ))}
      </div>

      {/* Row 2: Forecasting & Flow */}
      <div className="grid grid-cols-12 gap-1">
        <CockpitChartCard 
          title="Dự báo tồn kho & Sức chứa" 
          value="42 ngày bảo phủ"
          subtitle="Tồn kho hiện tại so với định mức nhu cầu"
          heightClass={COCKPIT_HEIGHTS.CHART_XL}
          className="col-span-12 xl:col-span-8"
        >
          <AreaForecastChart series={mockDashboardData.forecast.series} />
        </CockpitChartCard>
        
        <CockpitChartCard 
          title="Trạng thái Pipeline cấu kiện" 
          value="78,450 kiện"
          subtitle="Cân đối bán thành phẩm sản xuất"
          heightClass={COCKPIT_HEIGHTS.CHART_XL}
          className="col-span-12 xl:col-span-4"
        >
          <DonutPipelineChart segments={mockDashboardData.pipeline.segments} />
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
          <div className="grid grid-cols-2 gap-2 h-full py-1">
            {mockDashboardData.operationalPulse.metrics.map((m) => {
              const pct = Math.min(100, Math.round((m.volume / m.targetVolume) * 100))
              return (
                <div key={m.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5">
                      {m.icon}
                      <span>{m.label}</span>
                    </span>
                    <span className="font-mono text-cyan-300">{m.count} lệnh</span>
                  </div>
                  <div className="my-2">
                    <div className="text-xl font-bold text-white font-mono">{m.volume > 0 ? `+${m.volume}` : m.volume}t</div>
                    <div className="text-[10px] text-slate-500">Mục tiêu ca: {m.targetVolume}t</div>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </CockpitChartCard>

        <CockpitChartCard 
          title="Cảnh báo & Ngoại lệ" 
          value={`${mockDashboardData.alerts.filter(a => a.severity === 'critical').length} Lỗi nghiêm trọng`}
          subtitle="Vấn đề phát sinh trên chuỗi cung ứng"
          heightClass={COCKPIT_HEIGHTS.PANEL_MD}
          className="col-span-12 xl:col-span-6"
        >
          <div className="space-y-1.5 max-h-[220px] overflow-auto scrollbar-thin py-1">
            {mockDashboardData.alerts.map((a) => (
              <div 
                key={a.id} 
                className={`rounded-lg border px-3 py-2 flex items-start gap-2 text-xs transition duration-150 ${
                  a.severity === 'critical' 
                    ? 'border-red-950 bg-red-950/20 text-red-200' 
                    : a.severity === 'warning' 
                    ? 'border-amber-950 bg-amber-950/20 text-amber-200'
                    : 'border-blue-950 bg-blue-950/20 text-blue-200'
                }`}
              >
                <CircleDot className={`h-4 w-4 shrink-0 mt-0.5 ${
                  a.severity === 'critical' ? 'text-red-400' : a.severity === 'warning' ? 'text-amber-400' : 'text-blue-400'
                }`} />
                <div className="min-w-0 flex-1">
                  <div className="font-bold flex items-center justify-between">
                    <span className="truncate">{a.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">{a.timestamp}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">{a.message}</div>
                </div>
              </div>
            ))}
          </div>
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
          <div className="relative pl-4 border-l border-white/5 space-y-3.5 max-h-[190px] overflow-auto scrollbar-thin py-1">
            {mockDashboardData.activity.map((act) => (
              <div key={act.id} className="relative text-xs">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-[#050b14] bg-cyan-400" />
                <div className="flex items-center justify-between text-slate-400 font-medium">
                  <span className="text-cyan-300 font-semibold">{act.operatorName} ({act.module})</span>
                  <span className="text-[10px] font-mono text-slate-500">{act.timestamp}</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">{act.description}</div>
              </div>
            ))}
          </div>
        </CockpitChartCard>

        <CockpitChartCard 
          title="Hiệu suất nhà máy" 
          subtitle="OEE tổng thể và tỷ lệ tuân thủ lịch sản xuất"
          heightClass={COCKPIT_HEIGHTS.PANEL_SM}
          className="col-span-12 xl:col-span-5"
        >
          <div className="grid grid-cols-4 gap-1 h-full py-2 items-center justify-center">
            <PerformanceGauge value={mockDashboardData.performance.oee} label="OEE" tone="cyan" />
            <PerformanceGauge value={mockDashboardData.performance.scheduleCompliance} label="Tuân thủ" tone="blue" />
            <PerformanceGauge value={mockDashboardData.performance.availabilityRate} label="Sẵn sàng" tone="cyan" />
            <PerformanceGauge value={mockDashboardData.performance.qualityRate} label="Chất lượng" tone="blue" />
          </div>
        </CockpitChartCard>
      </div>
    </div>
  )
}
