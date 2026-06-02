import type { ReactNode } from 'react'

export function ComponentsKpiCard({
  title,
  value,
  sub,
}: {
  title: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-[#071323]/80 p-4">
      <div className="text-[11px] uppercase tracking-[0.12em] text-slate-400">{title}</div>
      <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
      {sub ? <div className="mt-1 text-xs text-emerald-300">{sub}</div> : null}
    </div>
  )
}

export function ComponentsPanel({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-800/70 bg-[#071323]/85">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="text-sm font-semibold text-white">{title}</div>
        {action ? <div className="text-xs text-cyan-300">{action}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

export function ComponentsFilterBar({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-800/70 bg-[#071323]/80 p-3">
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-12">{children}</div>
    </div>
  )
}

export function ComponentsSelect({
  value,
  onChange,
  children,
  className = '',
}: {
  value: string
  onChange: (value: string) => void
  children: ReactNode
  className?: string
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 ${className}`}
    >
      {children}
    </select>
  )
}

