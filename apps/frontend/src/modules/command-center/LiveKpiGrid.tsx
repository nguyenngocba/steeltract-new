import {
  AnimatedMetricCard,
} from './AnimatedMetricCard'

import type {
  CommandMetric,
} from './command-center.types'

interface LiveKpiGridProps {
  metrics: CommandMetric[]
}

export function LiveKpiGrid({
  metrics,
}: LiveKpiGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <AnimatedMetricCard
          key={metric.id}
          metric={metric}
        />
      ))}
    </div>
  )
}
