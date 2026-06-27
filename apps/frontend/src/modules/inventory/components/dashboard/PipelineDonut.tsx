import { useMemo } from 'react'

export interface PipelineSegment {
  stage: string
  label: string
  value: number
  percentage: number
  colorCode: string
}

export function PipelineDonut({ segments }: { segments: PipelineSegment[] }) {
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
