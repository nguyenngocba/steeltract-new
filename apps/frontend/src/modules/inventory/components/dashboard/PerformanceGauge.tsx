export function PerformanceGauge({ value, label, tone = 'cyan' }: { value: number; label: string; tone?: 'cyan' | 'blue' }) {
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

export function PerformanceGaugesGrid({
  performance
}: {
  performance: { oee: number; scheduleCompliance: number; availabilityRate: number; qualityRate: number }
}) {
  return (
    <div className="grid grid-cols-4 gap-1 h-full py-2 items-center justify-center">
      <PerformanceGauge value={performance.oee} label="OEE" tone="cyan" />
      <PerformanceGauge value={performance.scheduleCompliance} label="Tuân thủ" tone="blue" />
      <PerformanceGauge value={performance.availabilityRate} label="Sẵn sàng" tone="cyan" />
      <PerformanceGauge value={performance.qualityRate} label="Chất lượng" tone="blue" />
    </div>
  )
}
