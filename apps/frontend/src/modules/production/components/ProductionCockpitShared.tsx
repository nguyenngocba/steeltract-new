import type { ReactNode } from 'react'

export const productionPanel =
  'rounded-2xl border border-white/10 bg-slate-950/45 shadow-[0_22px_70px_rgba(0,0,0,0.24)] ring-1 ring-white/[0.025] backdrop-blur-2xl'

export const productionInput =
  'h-8 rounded-lg border border-white/10 bg-slate-950/45 px-2 text-xs text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-950/65'

export const productionMutedButton =
  'rounded-xl border border-white/10 bg-white/[0.055] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40'

export const productionPrimaryButton =
  'rounded-xl border border-blue-400/30 bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500'

export const productionTableHead =
  'bg-white/[0.055] text-[11px] uppercase tracking-[0.08em] text-slate-400'

export const productionTableRow =
  'border-t border-white/10 text-slate-200 transition hover:bg-white/[0.055]'

export function ProductionKpi({ label, value, note, tone = 'cyan' }: {
  label: string; value: string; note?: string; tone?: 'cyan' | 'green' | 'amber' | 'red' | 'purple' | 'blue'
}) {
  const toneClass = {
    cyan: 'from-cyan-500 to-blue-400',
    green: 'from-emerald-500 to-teal-400',
    amber: 'from-amber-500 to-orange-400',
    red: 'from-red-500 to-rose-400',
    purple: 'from-purple-500 to-indigo-400',
    blue: 'from-blue-500 to-sky-400',
  }[tone]

  return <div className={`${productionPanel} min-h-[104px] p-3`}>
    <div className={`mb-2 h-1 w-14 rounded-full bg-gradient-to-r ${toneClass}`} />
    <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400">{label}</div>
    <div className="mt-1 text-xl font-semibold tracking-tight text-white">{value}</div>
    {note ? <div className="mt-1 text-[11px] text-slate-500">{note}</div> : null}
  </div>
}

export function ProductionPanel({ title, action, children, className = '' }: {
  title: string; action?: ReactNode; children: ReactNode; className?: string
}) {
  return <section className={`${productionPanel} overflow-hidden ${className}`}>
    <header className="flex items-center justify-between gap-3 px-4 pt-3">
      <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-white">{title}</h2>
      {action}
    </header>
    <div className="p-3">{children}</div>
  </section>
}

export function StatusChip({ status }: { status: string }) {
  const key = status.toUpperCase()
  const tone = key.includes('COMPLETE') || key === 'ISSUED' ? 'border-emerald-700/70 bg-emerald-950/70 text-emerald-300'
    : key.includes('DELAY') || key.includes('CANCEL') ? 'border-red-700/70 bg-red-950/60 text-red-300'
      : key.includes('PROGRESS') || key === 'READY' ? 'border-blue-700/70 bg-blue-950/70 text-blue-300'
        : 'border-amber-700/70 bg-amber-950/60 text-amber-300'
  return <span className={`inline-flex rounded border px-2 py-1 text-[10px] font-semibold uppercase ${tone}`}>{status.replaceAll('_', ' ')}</span>
}

export function Meter({ value, tone = 'bg-cyan-500' }: { value: number; tone?: string }) {
  return <div className="h-2 overflow-hidden rounded-full bg-white/10">
    <div className={`h-full ${tone}`} style={{ width: `${Math.min(100, Math.max(4, value))}%` }} />
  </div>
}

export function ProductionDonut({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: Array<{ label: string; value: number; color: string }>
  centerValue: string
  centerLabel: string
}) {
  const total = Math.max(1, segments.reduce((sum, item) => sum + item.value, 0))
  let cursor = 0
  const gradient = segments
    .map((item) => {
      const start = cursor
      const end = cursor + (item.value / total) * 100
      cursor = end
      return `${item.color} ${start}% ${end}%`
    })
    .join(', ')

  return (
    <div className="grid min-h-[148px] grid-cols-[120px_1fr] items-center gap-3">
      <div className="relative h-28 w-28 rounded-full shadow-[0_18px_45px_rgba(0,0,0,0.2)]" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="absolute inset-3 rounded-full bg-[#08111f]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-xl font-semibold text-white">{centerValue}</div>
          <div className="text-[10px] text-slate-500">{centerLabel}</div>
        </div>
      </div>
      <div className="space-y-1.5 overflow-hidden">
        {segments.map((item) => (
          <div key={item.label} className="grid grid-cols-[1fr_auto] items-center gap-2 text-[11px]">
            <span className="flex min-w-0 items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="whitespace-nowrap text-slate-300">{item.value.toLocaleString('vi-VN')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProductionMiniBars({ values, tone = 'cyan' }: { values: number[]; tone?: 'cyan' | 'emerald' | 'amber' }) {
  const max = Math.max(1, ...values)
  const color = tone === 'emerald' ? 'from-emerald-500 to-teal-300' : tone === 'amber' ? 'from-amber-500 to-orange-300' : 'from-blue-500 to-cyan-300'
  return (
    <div className="flex h-32 items-end gap-2">
      {values.map((value, index) => (
        <div key={index} className={`flex-1 rounded-t-lg bg-gradient-to-t ${color}`} style={{ height: `${Math.max(8, (value / max) * 100)}%` }} />
      ))}
    </div>
  )
}
