import {
  ChartContainer,
  StatusBadge,
} from '../../components/ui-system'

import type {
  ProductionMetrics,
} from './production.types'

interface ProductionProgressVisualizationProps {
  metrics?: ProductionMetrics
}

export function ProductionProgressVisualization({
  metrics,
}: ProductionProgressVisualizationProps) {
  return (
    <ChartContainer title="Production Progress">
      <div className="space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-zinc-400">
              Completed orders
            </p>
            <p className="mt-2 text-4xl font-semibold text-cyan-300">
              {metrics?.completionRate ?? 0}%
            </p>
          </div>
          <StatusBadge tone="info">
            THROUGHPUT READY
          </StatusBadge>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full bg-cyan-500"
            style={{
              width: `${metrics?.completionRate ?? 0}%`,
            }}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
            <p className="text-xs text-zinc-500">
              Completed
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              {metrics?.completed ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
            <p className="text-xs text-zinc-500">
              Delayed
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              {metrics?.delayed ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
            <p className="text-xs text-zinc-500">
              Bottlenecks
            </p>
            <p className="mt-2 text-xl font-semibold text-white">
              {metrics?.bottlenecks.length ?? 0}
            </p>
          </div>
        </div>
      </div>
    </ChartContainer>
  )
}
