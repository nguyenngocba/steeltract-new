import type { ReactNode } from 'react'

export interface PulseMetric {
  id: string
  label: string
  count: number
  volume: number
  targetVolume: number
  icon: ReactNode
}

export function OperationalPulse({ metrics }: { metrics: PulseMetric[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 h-full py-1">
      {metrics.map((m) => {
        const pct = Math.min(100, Math.round((m.volume / m.targetVolume) * 100))
        return (
          <div key={m.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                {m.icon}
                <span>{m.label}</span>
              </span>
              <span className="font-mono text-cyan-300">{m.count} lệnh</span>
            </div>
            <div className="my-2">
              <div className="text-xl font-bold text-white font-mono">{m.volume > 0 ? `+${m.volume}` : m.volume}t</div>
              <div className="text-[10px] text-slate-500">Mục tiêu ca: {m.targetVolume}t</div>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
