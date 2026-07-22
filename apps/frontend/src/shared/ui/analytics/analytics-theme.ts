export type AnalyticsDomain =
  | 'inventory'
  | 'inbound'
  | 'outbound'
  | 'production'
  | 'qc'
  | 'projects'
  | 'dispatch'

export type AnalyticsTone =
  | 'blue'
  | 'emerald'
  | 'cyan'
  | 'amber'
  | 'red'
  | 'purple'
  | 'indigo'
  | 'orange'

export type DomainTheme = {
  id: AnalyticsDomain
  name: string
  tone: AnalyticsTone
  border: string
  glow: string
  text: string
  soft: string
  panel: string
  gradient: string
  halo: string
  pattern: string
  stroke: string
  fill: string
}

export const domainThemes: Record<AnalyticsDomain, DomainTheme> = {
  inventory: {
    id: 'inventory',
    name: 'Warehouse Management',
    tone: 'purple',
    border: 'border-violet-300/35',
    glow: 'hover:shadow-violet-500/25',
    text: 'text-violet-200',
    soft: 'bg-violet-500/10',
    panel: 'from-violet-500/18 via-blue-500/8 to-slate-950/40',
    gradient: 'from-violet-400 via-blue-400 to-cyan-300',
    halo: 'rgba(139,92,246,0.34)',
    pattern: 'warehouse',
    stroke: '#8b5cf6',
    fill: 'rgba(139,92,246,0.18)',
  },
  inbound: {
    id: 'inbound',
    name: 'Receiving Control',
    tone: 'emerald',
    border: 'border-emerald-300/35',
    glow: 'hover:shadow-emerald-500/25',
    text: 'text-emerald-200',
    soft: 'bg-emerald-500/10',
    panel: 'from-emerald-500/18 via-teal-500/8 to-slate-950/40',
    gradient: 'from-emerald-300 via-teal-300 to-cyan-300',
    halo: 'rgba(52,211,153,0.32)',
    pattern: 'dock',
    stroke: '#34d399',
    fill: 'rgba(52,211,153,0.18)',
  },
  outbound: {
    id: 'outbound',
    name: 'Delivery Flow',
    tone: 'orange',
    border: 'border-orange-300/35',
    glow: 'hover:shadow-orange-500/25',
    text: 'text-orange-200',
    soft: 'bg-orange-500/10',
    panel: 'from-orange-500/18 via-amber-500/8 to-slate-950/40',
    gradient: 'from-orange-300 via-amber-300 to-yellow-200',
    halo: 'rgba(251,146,60,0.34)',
    pattern: 'route',
    stroke: '#fb923c',
    fill: 'rgba(251,146,60,0.18)',
  },
  production: {
    id: 'production',
    name: 'Manufacturing Execution',
    tone: 'cyan',
    border: 'border-cyan-300/35',
    glow: 'hover:shadow-cyan-500/25',
    text: 'text-cyan-200',
    soft: 'bg-cyan-500/10',
    panel: 'from-cyan-500/18 via-sky-500/8 to-slate-950/40',
    gradient: 'from-cyan-300 via-sky-300 to-blue-300',
    halo: 'rgba(34,211,238,0.32)',
    pattern: 'factory',
    stroke: '#22d3ee',
    fill: 'rgba(34,211,238,0.18)',
  },
  qc: {
    id: 'qc',
    name: 'Quality Intelligence',
    tone: 'red',
    border: 'border-rose-300/35',
    glow: 'hover:shadow-rose-500/25',
    text: 'text-rose-200',
    soft: 'bg-rose-500/10',
    panel: 'from-rose-500/18 via-fuchsia-500/8 to-slate-950/40',
    gradient: 'from-rose-300 via-fuchsia-300 to-purple-300',
    halo: 'rgba(251,113,133,0.34)',
    pattern: 'quality',
    stroke: '#fb7185',
    fill: 'rgba(251,113,133,0.18)',
  },
  projects: {
    id: 'projects',
    name: 'Project Delivery',
    tone: 'amber',
    border: 'border-amber-300/35',
    glow: 'hover:shadow-amber-500/25',
    text: 'text-amber-200',
    soft: 'bg-amber-500/10',
    panel: 'from-amber-500/18 via-yellow-500/8 to-slate-950/40',
    gradient: 'from-amber-300 via-yellow-200 to-lime-200',
    halo: 'rgba(245,158,11,0.34)',
    pattern: 'milestone',
    stroke: '#f59e0b',
    fill: 'rgba(245,158,11,0.18)',
  },
  dispatch: {
    id: 'dispatch',
    name: 'Dispatch Tower',
    tone: 'blue',
    border: 'border-blue-300/35',
    glow: 'hover:shadow-blue-500/25',
    text: 'text-blue-200',
    soft: 'bg-blue-500/10',
    panel: 'from-blue-500/18 via-indigo-500/8 to-slate-950/40',
    gradient: 'from-blue-300 via-indigo-300 to-violet-300',
    halo: 'rgba(96,165,250,0.34)',
    pattern: 'fleet',
    stroke: '#60a5fa',
    fill: 'rgba(96,165,250,0.18)',
  },
}

export const analyticsPalette = [
  '#38bdf8',
  '#34d399',
  '#f59e0b',
  '#a78bfa',
  '#f87171',
  '#818cf8',
  '#fb923c',
  '#94a3b8',
]

export function analyticsColorAt(index: number) {
  return analyticsPalette[index % analyticsPalette.length]
}
