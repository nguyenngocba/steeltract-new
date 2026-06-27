import type { ReactNode } from 'react'
import { COCKPIT_SHELL } from './cockpit-shell'
import { COCKPIT_HEIGHTS } from './cockpit-tokens'

type CockpitTone = 'blue' | 'emerald' | 'cyan' | 'amber' | 'red' | 'purple' | 'indigo' | 'violet' | 'orange'
type KpiCardState = 'loading' | 'empty' | 'normal' | 'alert'

type CockpitKpiCardProps = {
  title: string
  value: ReactNode
  subtitle?: ReactNode
  note?: ReactNode
  noteClassName?: string
  icon?: ReactNode
  trend?: number[]
  tone?: CockpitTone
  active?: boolean
  onClick?: () => void
  className?: string
  // Executive Dashboard specific props
  state?: KpiCardState
  trendText?: string
  trendData?: number[]
  statusText?: string
}

const toneClasses: Record<CockpitTone, { text: string; bg: string; line: string; fill: string; note: string }> = {
  blue: { text: 'text-blue-300', bg: 'bg-blue-500/10', line: '#1d7cff', fill: 'rgba(29,124,255,0.12)', note: 'text-emerald-400' },
  emerald: { text: 'text-emerald-300', bg: 'bg-emerald-500/10', line: '#10b981', fill: 'rgba(16,185,129,0.12)', note: 'text-emerald-400' },
  cyan: { text: 'text-cyan-300', bg: 'bg-cyan-500/10', line: '#06b6d4', fill: 'rgba(6,182,212,0.12)', note: 'text-emerald-400' },
  amber: { text: 'text-amber-300', bg: 'bg-amber-500/10', line: '#f59e0b', fill: 'rgba(245,158,11,0.10)', note: 'text-red-400' },
  red: { text: 'text-red-300', bg: 'bg-red-500/10', line: '#ef4444', fill: 'rgba(239,68,68,0.10)', note: 'text-red-400' },
  purple: { text: 'text-purple-300', bg: 'bg-purple-500/10', line: '#a855f7', fill: 'rgba(168,85,247,0.10)', note: 'text-emerald-400' },
  indigo: { text: 'text-indigo-300', bg: 'bg-indigo-500/10', line: '#6366f1', fill: 'rgba(99,102,241,0.12)', note: 'text-emerald-400' },
  violet: { text: 'text-violet-300', bg: 'bg-violet-500/10', line: '#8b5cf6', fill: 'rgba(139,92,246,0.12)', note: 'text-emerald-400' },
  orange: { text: 'text-orange-300', bg: 'bg-orange-500/10', line: '#f97316', fill: 'rgba(249,115,22,0.12)', note: 'text-red-400' },
}

function KpiSparkline({ values, line, fill, opacity = 'opacity-95' }: { values: number[]; line: string; fill: string; opacity?: string }) {
  const rows = values.length ? values : [0, 0, 0, 0, 0, 0]
  const min = Math.min(...rows)
  const max = Math.max(...rows)
  const range = Math.max(1, max - min)
  const points = rows
    .map((value, index) => {
      const x = rows.length <= 1 ? 0 : (index / (rows.length - 1)) * 100
      const y = 34 - ((value - min) / range) * 24 - 5
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg viewBox="0 0 100 34" preserveAspectRatio="none" className={`absolute inset-x-3 bottom-1 h-9 w-[calc(100%-24px)] ${opacity}`}>
      <polyline points={`0,34 ${points} 100,34`} fill={fill} stroke="none" />
      <polyline points={points} fill="none" stroke={line} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function CockpitKpiCard({
  title,
  value,
  subtitle,
  note,
  noteClassName,
  icon,
  trend,
  tone = 'blue',
  active,
  onClick,
  className = '',
  state,
  trendText,
  trendData,
  statusText,
}: CockpitKpiCardProps) {
  const item = toneClasses[tone] || toneClasses.blue

  // 1. Executive Presentation Layout
  if (state !== undefined) {
    if (state === 'loading') {
      return (
        <section className={`relative ${COCKPIT_HEIGHTS.KPI_EXEC} overflow-hidden bg-slate-950/60 border border-white/5 p-4 rounded-2xl flex flex-col justify-between animate-pulse ${className}`}>
          <div className="flex items-center justify-between">
            <div className="h-5 w-5 rounded bg-slate-800" />
            <div className="h-3 w-10 rounded bg-slate-800" />
          </div>
          <div className="h-8 w-24 rounded bg-slate-800 my-1" />
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 rounded bg-slate-800" />
            <div className="h-3 w-8 rounded bg-slate-800" />
          </div>
        </section>
      )
    }

    if (state === 'empty') {
      return (
        <section className={`relative ${COCKPIT_HEIGHTS.KPI_EXEC} overflow-hidden bg-slate-950/20 border border-white/5 p-4 rounded-2xl flex flex-col justify-between text-left opacity-40 select-none ${className}`}>
          <div className="flex items-center justify-between">
            {icon ? <div className="text-slate-600">{icon}</div> : <div />}
            <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
          </div>
          <div className="text-3xl lg:text-4xl font-extrabold text-slate-600 font-mono">—</div>
          <div className="flex items-center justify-between text-[10px] text-slate-600">
            <span className="uppercase tracking-wider truncate">{title}</span>
            <span>—</span>
          </div>
        </section>
      )
    }

    // Normal or Alert Executive presentation
    const glowColor = tone === 'red' ? 'rgba(239,68,68,0.04)' : tone === 'amber' || tone === 'orange' ? 'rgba(245,158,11,0.04)' : tone === 'blue' ? 'rgba(59,130,246,0.04)' : 'rgba(6,182,212,0.04)'
    
    // Critical alert uses red badge only, do not tint card red. Warning alert (amber) tint card amber.
    const isAmberAlert = state === 'alert' && (tone === 'amber' || tone === 'orange')
    const borderClass = isAmberAlert 
      ? 'border-amber-500/12' 
      : tone === 'red' 
      ? 'border-red-500/12'
      : tone === 'blue' 
      ? 'border-blue-500/12' 
      : tone === 'emerald'
      ? 'border-emerald-500/12'
      : 'border-cyan-400/12'

    const containerStyle = {
      boxShadow: `0 0 12px ${glowColor}`,
    }

    const execContent = (
      <>
        <div className="relative z-10 flex flex-col justify-between h-full w-full">
          {/* Top Line */}
          <div className="flex items-center justify-between">
            {icon ? <div className="text-slate-400">{icon}</div> : <div />}
            {statusText ? (
              <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                tone === 'red'
                  ? 'bg-red-450 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                  : tone === 'amber' || tone === 'orange'
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                  : tone === 'blue'
                  ? 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                  : tone === 'emerald'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                  : 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
              }`} />
            ) : null}
          </div>

          {/* Center Line */}
          <div className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-none my-1 font-mono">
            {value}
          </div>

          {/* Bottom Line */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span className="uppercase tracking-wider truncate mr-2">{title}</span>
            {trendText ? (
              <span className={`font-semibold font-mono ${
                tone === 'red' || tone === 'orange' ? 'text-red-400' : 'text-emerald-400'
              }`}>
                {trendText}
              </span>
            ) : null}
          </div>
        </div>

        {/* Subtle background sparkline if trendData is provided */}
        {trendData ? (
          <KpiSparkline values={trendData} line={item.line} fill={item.fill} opacity="opacity-30 pointer-events-none" />
        ) : null}
      </>
    )

    const execShell = `relative ${COCKPIT_HEIGHTS.KPI_EXEC} overflow-hidden ${COCKPIT_SHELL} p-4 text-left transition select-none ${borderClass} ${
      onClick ? 'cursor-pointer hover:border-cyan-400/25 hover:bg-white/[0.04]' : ''
    } ${className}`

    if (onClick) {
      return (
        <button type="button" onClick={onClick} className={execShell} style={containerStyle}>
          {execContent}
        </button>
      )
    }

    return (
      <section className={execShell} style={containerStyle}>
        {execContent}
      </section>
    )
  }

  // 2. Legacy Presentation Layout (Backward Compatible)
  const noteContent = note ?? subtitle
  const shell = `relative ${COCKPIT_HEIGHTS.KPI} overflow-hidden ${COCKPIT_SHELL} p-4 text-left transition ${
    active ? 'border-cyan-400/55 bg-cyan-400/10' : ''
  } ${onClick ? 'cursor-pointer hover:border-cyan-400/35 hover:bg-white/[0.055]' : ''} ${className}`

  const content = (
    <>
      <div className="relative z-10 flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{title}</div>
          <div className="mt-1 truncate text-2xl font-semibold leading-none text-white">{value}</div>
          {noteContent ? <div className={`mt-1 truncate text-[10px] font-semibold ${noteClassName ?? item.note}`}>{noteContent}</div> : null}
        </div>
        {icon ? <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${item.bg} ${item.text}`}>{icon}</div> : null}
      </div>
      {trend ? <KpiSparkline values={trend} line={item.line} fill={item.fill} /> : null}
    </>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={shell}>
        {content}
      </button>
    )
  }

  return <section className={shell}>{content}</section>
}
