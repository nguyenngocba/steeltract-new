import {
  Factory,
  Gauge,
  TimerReset,
  TriangleAlert,
} from 'lucide-react'

import {
  StatCard,
} from '../../components/ui-system'

import type {
  ProductionMetrics,
} from './production.types'

interface ProductionKpiCardsProps {
  metrics?: ProductionMetrics
}

export function ProductionKpiCards({
  metrics,
}: ProductionKpiCardsProps) {
  return (
    <div className="enterprise-grid">
      <StatCard
        label="Orders"
        value={metrics?.totalOrders ?? 0}
        icon={<Factory size={20} />}
      />
      <StatCard
        label="In Progress"
        value={metrics?.inProgress ?? 0}
        icon={<Gauge size={20} />}
      />
      <StatCard
        label="Delayed"
        value={metrics?.delayed ?? 0}
        icon={<TriangleAlert size={20} />}
      />
      <StatCard
        label="Completion Rate"
        value={`${metrics?.completionRate ?? 0}%`}
        icon={<TimerReset size={20} />}
      />
    </div>
  )
}
