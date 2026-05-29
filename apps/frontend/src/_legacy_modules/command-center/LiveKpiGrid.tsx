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
    <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {metrics.map((metric, index) => (
        <AnimatedMetricCard
          key={metric.id}
          metric={metric}
          emphasis={index === 0}
        />
      ))}
    </div>
  )
}
