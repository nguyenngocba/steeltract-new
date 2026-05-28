import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  RotateCcw,
} from 'lucide-react'

import {
  StatCard,
  StatusBadge,
} from '../../components/ui-system'

import type {
  QcMetrics,
} from './qc.types'

interface QualityMetricsWidgetsProps {
  metrics?: QcMetrics
}

export function QualityMetricsWidgets({
  metrics,
}: QualityMetricsWidgetsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Inspections"
        value={metrics?.total ?? 0}
        icon={<ClipboardCheck className="h-5 w-5" />}
      />
      <StatCard
        label="Pass rate"
        value={`${metrics?.passRate ?? 0}%`}
        icon={<CheckCircle2 className="h-5 w-5" />}
        trend={
          <StatusBadge
            tone={
              (metrics?.passRate ?? 0) >= 90
                ? 'success'
                : 'warning'
            }
          >
            quality
          </StatusBadge>
        }
      />
      <StatCard
        label="Open issues"
        value={metrics?.openIssues ?? 0}
        icon={<AlertTriangle className="h-5 w-5" />}
      />
      <StatCard
        label="Rework"
        value={metrics?.rework ?? 0}
        icon={<RotateCcw className="h-5 w-5" />}
      />
    </div>
  )
}
