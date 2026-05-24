import {
  Boxes,
  MapPinned,
  PackageCheck,
  Warehouse,
} from 'lucide-react'

import {
  StatCard,
  StatusBadge,
} from '../../components/ui-system'

import type {
  YardMetrics,
} from './yard.types'

interface UtilizationWidgetsProps {
  metrics?: YardMetrics
}

export function UtilizationWidgets({
  metrics,
}: UtilizationWidgetsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Yard zones"
        value={metrics?.zones ?? 0}
        icon={<Warehouse className="h-5 w-5" />}
      />
      <StatCard
        label="Slots"
        value={metrics?.totalSlots ?? 0}
        icon={<MapPinned className="h-5 w-5" />}
      />
      <StatCard
        label="Occupied slots"
        value={metrics?.occupiedSlots ?? 0}
        icon={<PackageCheck className="h-5 w-5" />}
        trend={
          <StatusBadge
            tone={
              (metrics?.occupancyRate ?? 0) > 85
                ? 'danger'
                : 'info'
            }
          >
            {`${metrics?.occupancyRate ?? 0}%`}
          </StatusBadge>
        }
      />
      <StatCard
        label="Active placements"
        value={metrics?.placements ?? 0}
        icon={<Boxes className="h-5 w-5" />}
      />
    </div>
  )
}
