import {
  Activity,
  Gauge,
  RadioTower,
} from 'lucide-react'

import {
  StatusBadge,
} from '../../components/ui-system'

interface IndustrialMotionStripProps {
  throughput?: number
  delayed?: number
  downtime?: number
  events?: number
  simulationRunning?: boolean
}

export function IndustrialMotionStrip({
  throughput = 0,
  delayed = 0,
  downtime = 0,
  events = 0,
  simulationRunning = false,
}: IndustrialMotionStripProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-cyan-500/20 bg-[linear-gradient(100deg,rgba(8,145,178,0.12),rgba(9,9,11,0.96)_38%,rgba(16,185,129,0.08))] p-3 shadow-[0_0_42px_rgba(8,145,178,0.12)]">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-[factory-shimmer_6s_cubic-bezier(0.4,0,0.2,1)_infinite] bg-gradient-to-r from-transparent via-cyan-400/14 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
      <div className="relative grid gap-3 md:grid-cols-4">
        {[
          {
            label: 'throughput motion',
            value: throughput,
            detail: 'fabrication pulse',
            Icon: Gauge,
            tone: 'success',
          },
          {
            label: 'delayed stages',
            value: delayed,
            detail: 'escalation watch',
            Icon: Activity,
            tone:
              delayed > 0 ? 'warning' : 'neutral',
          },
          {
            label: 'machine downtime',
            value: downtime,
            detail: 'maintenance pulse',
            Icon: RadioTower,
            tone:
              downtime > 0 ? 'danger' : 'success',
          },
          {
            label: 'event stream',
            value: events,
            detail: simulationRunning
              ? 'simulation pulse'
              : 'realtime idle',
            Icon: Activity,
            tone: simulationRunning
              ? 'info'
              : 'neutral',
          },
        ].map(({ label, value, detail, Icon, tone }) => (
          <div
            key={label}
            className={
              tone === 'danger'
                ? 'animate-pulse rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 shadow-[0_0_24px_rgba(239,68,68,0.12)]'
                : tone === 'warning'
                  ? 'rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 shadow-[0_0_18px_rgba(245,158,11,0.08)]'
                  : tone === 'success'
                    ? 'rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2'
                    : tone === 'info'
                      ? 'rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-2'
                      : 'rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2'
            }
          >
            <div className="flex items-center justify-between gap-2">
              <Icon className="h-4 w-4 text-cyan-300" />
              <StatusBadge
                tone={
                  tone as
                    | 'neutral'
                    | 'info'
                    | 'success'
                    | 'warning'
                    | 'danger'
                }
              >
                {value}
              </StatusBadge>
            </div>
            <p className="mt-2 text-xs uppercase tracking-wide text-zinc-500">
              {label}
            </p>
            <p className="mt-1 truncate text-xs text-zinc-300">
              {detail}
            </p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-900/80">
              <div
                className={
                  tone === 'danger'
                    ? 'h-full rounded-full bg-red-400'
                    : tone === 'warning'
                      ? 'h-full rounded-full bg-amber-400'
                      : 'h-full rounded-full bg-cyan-300'
                }
                style={{
                  width: `${Math.min(Number(value) * 8, 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
