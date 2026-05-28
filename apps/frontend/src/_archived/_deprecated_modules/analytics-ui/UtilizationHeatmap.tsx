import {
  ChartContainer,
} from '../../components/ui-system'
import { metricTone } from './analytics-utils'

import type {
  AnalyticsMetric,
} from './analytics.types'

interface UtilizationHeatmapProps {
  metrics: AnalyticsMetric[]
}

export function UtilizationHeatmap({
  metrics,
}: UtilizationHeatmapProps) {
  const utilization = metrics.filter(
    (metric) =>
      metric.type === 'UTILIZATION' ||
      metric.key.includes('rate'),
  )

  return (
    <ChartContainer title="Utilization heatmap">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {utilization.map((metric) => (
          <div
            key={metric.key}
            className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-medium text-white">
                {metric.label}
              </p>
              <span className="text-sm text-zinc-400">
                {metric.value}
                {metric.unit ?? ''}
              </span>
            </div>
            <div className="mt-3 h-16 rounded-md bg-zinc-900">
              <div
                className={
                  metricTone(metric) === 'danger'
                    ? 'h-full rounded-md bg-red-400/70'
                    : metricTone(metric) ===
                        'warning'
                      ? 'h-full rounded-md bg-amber-400/70'
                      : 'h-full rounded-md bg-cyan-400/70'
                }
                style={{
                  opacity: Math.max(
                    Math.min(metric.value / 100, 1),
                    0.15,
                  ),
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </ChartContainer>
  )
}
