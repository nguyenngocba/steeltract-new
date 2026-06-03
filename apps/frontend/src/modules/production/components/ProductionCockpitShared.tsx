import type { ReactNode } from 'react'

export function ProductionKpi({ label, value, note, tone = 'cyan' }: {
  label: string; value: string; note?: string; tone?: 'cyan' | 'green' | 'amber' | 'red'
}) {
  const tones = { cyan: 'text-cyan-300', green: 'text-emerald-300', amber: 'text-amber-300', red: 'text-red-300' }
  return <div className="min-h-28 rounded-lg border border-slate-800 bg-[#071321] p-4">
    <div className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${tones[tone]}`}>{label}</div>
    <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
    <div className="mt-2 text-[11px] text-slate-400">{note}</div>
  </div>
}

export function ProductionPanel({ title, action, children, className = '' }: {
  title: string; action?: ReactNode; children: ReactNode; className?: string
}) {
  return <section className={`rounded-lg border border-slate-800 bg-[#071321]/95 ${className}`}>
    <header className="flex min-h-12 items-center justify-between border-b border-slate-800 px-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-100">{title}</h2>
      {action}
    </header>
    <div className="p-4">{children}</div>
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
  return <div className="h-2 overflow-hidden rounded bg-slate-900">
    <div className={`h-full ${tone}`} style={{ width: `${Math.min(100, Math.max(4, value))}%` }} />
  </div>
}
