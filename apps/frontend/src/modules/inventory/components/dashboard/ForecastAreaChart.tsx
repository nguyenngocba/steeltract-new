import { useMemo } from 'react'

export interface ForecastPoint {
  date: string
  currentStock: number
  dailyMovement: number
  demandForecast: number
}

export function ForecastAreaChart({ series }: { series: ForecastPoint[] }) {
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
