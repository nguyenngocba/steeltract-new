import {
  Cpu,
} from 'lucide-react'

import {
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'

interface SystemHealthPanelProps {
  jobsQueued?: number
  jobsFailed?: number
  connected?: boolean
}

export function SystemHealthPanel({
  jobsQueued = 0,
  jobsFailed = 0,
  connected = true,
}: SystemHealthPanelProps) {
  return (
    <SectionCard
      title="System health"
      actions={
        <StatusBadge
          tone={connected ? 'success' : 'danger'}
        >
          {connected ? 'online' : 'offline'}
        </StatusBadge>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
          <Cpu className="h-4 w-4 text-cyan-300" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white">
              Realtime bridge
            </p>
            <p className="text-xs text-zinc-500">
              Domain event invalidation active
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-zinc-950/60 p-3">
            <p className="text-zinc-500">
              Queued jobs
            </p>
            <p className="mt-1 text-xl font-semibold text-white">
              {jobsQueued}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-950/60 p-3">
            <p className="text-zinc-500">
              Failed jobs
            </p>
            <p className="mt-1 text-xl font-semibold text-white">
              {jobsFailed}
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
