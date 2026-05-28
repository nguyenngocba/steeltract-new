import {
  Activity,
  Clock,
  Gauge,
} from 'lucide-react'

import {
  StatusBadge,
} from '../../components/ui-system'

import type {
  SimulationStatus,
} from './simulation.types'

interface LiveFactoryStatusProps {
  status?: SimulationStatus
}

export function LiveFactoryStatus({
  status,
}: LiveFactoryStatusProps) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Activity className="h-4 w-4" />
          Factory state
        </div>
        <div className="mt-2">
          <StatusBadge
            tone={
              status?.running ? 'success' : 'neutral'
            }
          >
            {status?.running ? 'running' : 'stopped'}
          </StatusBadge>
        </div>
      </div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Gauge className="h-4 w-4" />
          Speed
        </div>
        <p className="mt-2 text-lg font-semibold text-white">
          {status?.speed ?? 1}x
        </p>
      </div>
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Clock className="h-4 w-4" />
          Tick
        </div>
        <p className="mt-2 text-lg font-semibold text-white">
          {status?.tick ?? 0}
        </p>
      </div>
    </div>
  )
}
