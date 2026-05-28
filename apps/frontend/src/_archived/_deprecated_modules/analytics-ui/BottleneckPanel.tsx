import {
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'

import type {
  AnalyticsSnapshot,
} from './analytics.types'

interface BottleneckPanelProps {
  snapshot?: AnalyticsSnapshot
}

export function BottleneckPanel({
  snapshot,
}: BottleneckPanelProps) {
  const bottlenecks =
    snapshot?.bottlenecks ?? {}

  return (
    <SectionCard title="Bottlenecks">
      <div className="grid gap-3 md:grid-cols-3">
        {Object.entries(bottlenecks).map(
          ([key, value]) => (
            <div
              key={key}
              className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-white">
                  {key}
                </p>
                <StatusBadge tone="warning">
                  watch
                </StatusBadge>
              </div>
              <pre className="mt-3 max-h-28 overflow-auto text-xs text-zinc-400">
                {JSON.stringify(
                  value,
                  null,
                  2,
                )}
              </pre>
            </div>
          ),
        )}
      </div>
    </SectionCard>
  )
}
