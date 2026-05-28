import {
  ChartContainer,
  EmptyState,
} from '../../components/ui-system'

import type {
  AnalyticsSnapshot,
} from './analytics.types'

interface TrendChartsProps {
  snapshot?: AnalyticsSnapshot
}

export function TrendCharts({
  snapshot,
}: TrendChartsProps) {
  const trends = snapshot?.trends ?? []

  if (trends.length === 0) {
    return (
      <ChartContainer title="Trends">
        <EmptyState
          title="No trend data"
          description="Generate snapshots to build historical trend lines."
        />
      </ChartContainer>
    )
  }

  return (
    <ChartContainer title="Trends">
      <div className="space-y-3">
        {trends.slice(0, 8).map((trend) => (
          <div key={trend.key}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="truncate text-zinc-300">
                {trend.key}
              </span>
              <span className="text-zinc-500">
                {trend.value}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-cyan-400"
                style={{
                  width: `${Math.min(Math.abs(trend.value), 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </ChartContainer>
  )
}
