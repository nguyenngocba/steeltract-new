import type { ReactNode } from 'react'
import { COCKPIT_SHELL } from './cockpit-shell'
import { COCKPIT_HEIGHTS } from './cockpit-tokens'

type CockpitTone = 'blue' | 'emerald' | 'cyan' | 'amber' | 'red' | 'purple' | 'indigo' | 'violet' | 'orange'

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
}

const toneClasses: Record<CockpitTone, { text: string; bg: string; line: string; fill: string; note: string }> = {
  blue: { text: 'text-blue-300', bg: 'bg-blue-500/10', line: '#1d7cff', fill: 'rgba(29,124,255,0.24)', note: 'text-emerald-400' },
  emerald: { text: 'text-emerald-300', bg: 'bg-emerald-500/10', line: '#10b981', fill: 'rgba(16,185,129,0.22)', note: 'text-emerald-400' },
  cyan: { text: 'text-cyan-300', bg: 'bg-cyan-500/10', line: '#06b6d4', fill: 'rgba(6,182,212,0.22)', note: 'text-emerald-400' },
  amber: { text: 'text-amber-300', bg: 'bg-amber-500/10', line: '#f59e0b', fill: 'rgba(245,158,11,0.18)', note: 'text-red-400' },
  red: { text: 'text-red-300', bg: 'bg-red-500/10', line: '#ef4444', fill: 'rgba(239,68,68,0.18)', note: 'text-red-400' },
  purple: { text: 'text-purple-300', bg: 'bg-purple-500/10', line: '#a855f7', fill: 'rgba(168,85,247,0.18)', note: 'text-emerald-400' },
  indigo: { text: 'text-indigo-300', bg: 'bg-indigo-500/10', line: '#6366f1', fill: 'rgba(99,102,241,0.22)', note: 'text-emerald-400' },
  violet: { text: 'text-violet-300', bg: 'bg-violet-500/10', line: '#8b5cf6', fill: 'rgba(139,92,246,0.22)', note: 'text-emerald-400' },
  orange: { text: 'text-orange-300', bg: 'bg-orange-500/10', line: '#f97316', fill: 'rgba(249,115,22,0.22)', note: 'text-red-400' },
}

function KpiSparkline({ values, line, fill }: { values: number[]; line: string; fill: string }) {
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
    <svg viewBox="0 0 100 34" preserveAspectRatio="none" className="absolute inset-x-3 bottom-1 h-9 w-[calc(100%-24px)] opacity-95">
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
}: CockpitKpiCardProps) {
  const item = toneClasses[tone] || toneClasses.blue
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
