import type { ReactNode } from 'react'

export const inventoryPanel =
  'rounded-xl border border-white/10 bg-white/[0.055] shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur-xl'

export const inventoryInput =
  'h-10 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400'

export function InventoryKpi({
  title,
  value,
  note,
  tone = 'blue',
}: {
  title: string
  value: string
  note?: string
  tone?: 'blue' | 'emerald' | 'amber' | 'red' | 'purple' | 'cyan'
}) {
  const toneClass = {
    blue: 'from-blue-500 to-sky-400',
    emerald: 'from-emerald-500 to-teal-400',
    amber: 'from-amber-500 to-orange-400',
    red: 'from-red-500 to-rose-400',
    purple: 'from-purple-500 to-indigo-400',
    cyan: 'from-cyan-500 to-blue-400',
  }[tone]
  return (
    <section className={`${inventoryPanel} p-4`}>
      <div className={`mb-3 h-1.5 w-16 rounded-full bg-gradient-to-r ${toneClass}`} />
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{title}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</h2>
      {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
    </section>
  )
}

export function InventoryPanel({
  title,
  children,
  className = '',
}: {
  title?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`${inventoryPanel} overflow-hidden ${className}`}>
      {title && <h3 className="border-b border-white/10 px-4 py-3 text-sm font-semibold text-white">{title}</h3>}
      <div className="p-4">{children}</div>
    </section>
  )
}

export function HorizontalBars({
  rows,
  max,
  valueFormatter,
}: {
  rows: Array<[string, number]>
  max?: number
  valueFormatter?: (value: number) => string
}) {
  const top = max ?? Math.max(1, ...rows.map(([, value]) => value))
  return (
    <div className="space-y-3">
      {rows.map(([label, value], index) => (
        <div key={`${label}-${index}`}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="truncate text-slate-300">{label}</span>
            <span className="font-medium text-white">{valueFormatter ? valueFormatter(value) : value.toLocaleString('vi-VN')}</span>
          </div>
          <div className="h-2 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400"
              style={{ width: `${Math.min(100, Math.max(4, (value / top) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function MiniBars({
  values,
  tone = 'blue',
}: {
  values: number[]
  tone?: 'blue' | 'emerald' | 'amber'
}) {
  const max = Math.max(1, ...values)
  const color = tone === 'emerald' ? 'from-emerald-500 to-teal-300' : tone === 'amber' ? 'from-amber-500 to-orange-300' : 'from-blue-500 to-cyan-300'
  return (
    <div className="flex h-36 items-end gap-2">
      {values.map((value, index) => (
        <div key={index} className={`flex-1 rounded-t-lg bg-gradient-to-t ${color}`} style={{ height: `${Math.max(8, (value / max) * 100)}%` }} />
      ))}
    </div>
  )
}

export function DonutSummary({
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
    <div className="grid items-center gap-4 sm:grid-cols-[150px_1fr]">
      <div className="relative mx-auto h-36 w-36 rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="absolute inset-4 rounded-full bg-[#0b1424]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-semibold text-white">{centerValue}</div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{centerLabel}</div>
        </div>
      </div>
      <div className="space-y-2">
        {segments.map((item) => {
          const percent = (item.value / total) * 100
          return (
            <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="font-medium text-white">{item.value.toLocaleString('vi-VN')} ({percent.toFixed(1)}%)</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
