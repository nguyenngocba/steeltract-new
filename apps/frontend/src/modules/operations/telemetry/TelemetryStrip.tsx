import type {
  ReactNode,
} from 'react'

import {
  StatusBadge,
} from '../../../components/ui-system'

export interface TelemetryStripItem {
  label: string
  value: ReactNode
  detail?: ReactNode
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger'
  progress?: number
}

export function TelemetryStrip({
  items,
  dense = false,
}: {
  items: TelemetryStripItem[]
  dense?: boolean
}) {
  return (
    <div
      className={[
        'grid gap-3',
        dense
          ? 'sm:grid-cols-2 xl:grid-cols-6'
          : 'sm:grid-cols-2 xl:grid-cols-4',
      ].join(' ')}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="group relative overflow-hidden rounded-xl border border-cyan-500/10 bg-[#071321]/90 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_0_28px_rgba(14,165,233,0.06)]"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent opacity-70" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[11px] uppercase tracking-[0.14em] text-cyan-100/55">
                {item.label}
              </p>
              <div className="mt-1 truncate text-xl font-semibold text-white">
                {item.value}
              </div>
            </div>
            <StatusBadge tone={item.tone ?? 'info'}>
              live
            </StatusBadge>
          </div>
          {item.detail ? (
            <div className="mt-2 text-xs text-zinc-400">
              {item.detail}
            </div>
          ) : null}
          {typeof item.progress === 'number' ? (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-900">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 transition-all duration-500"
                style={{
                  width: `${Math.min(Math.max(item.progress, 0), 100)}%`,
                }}
              />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
