import {
  Activity,
  GitBranch,
  RadioTower,
} from 'lucide-react'
import type {
  ReactNode,
} from 'react'

import {
  SectionCard,
  StatusBadge,
  Timeline,
} from '../../../components/ui-system'

export interface ContextInsightItem {
  id: string
  title: string
  description?: string
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger'
}

export function ContextInsightPanel({
  title,
  subtitle,
  selectedLabel,
  metrics,
  timeline,
  actions,
}: {
  title: string
  subtitle?: string
  selectedLabel?: string
  metrics?: Array<{
    label: string
    value: ReactNode
    tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger'
  }>
  timeline?: ContextInsightItem[]
  actions?: ReactNode
}) {
  return (
    <SectionCard
      title={title}
      description={subtitle}
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-3">
          <div className="flex items-start gap-3">
            <RadioTower className="mt-0.5 h-4 w-4 text-cyan-300" />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-cyan-200">
                active context
              </p>
              <p className="mt-1 truncate text-sm font-medium text-white">
                {selectedLabel ?? 'No entity selected'}
              </p>
            </div>
          </div>
        </div>

        {metrics?.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs uppercase tracking-wide text-zinc-500">
                    {metric.label}
                  </p>
                  <StatusBadge tone={metric.tone ?? 'info'}>
                    state
                  </StatusBadge>
                </div>
                <div className="mt-2 text-sm font-semibold text-white">
                  {metric.value}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {timeline?.length ? (
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <Activity className="h-3.5 w-3.5 text-cyan-300" />
              context timeline
            </div>
            <Timeline items={timeline} />
          </div>
        ) : null}

        {actions ? (
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <GitBranch className="h-3.5 w-3.5 text-cyan-300" />
              action surface
            </div>
            {actions}
          </div>
        ) : null}
      </div>
    </SectionCard>
  )
}
