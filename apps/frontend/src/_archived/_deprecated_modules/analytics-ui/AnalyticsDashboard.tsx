import {
  Activity,
  AlertTriangle,
  Brain,
  Gauge,
} from 'lucide-react'

import {
  StatCard,
} from '../../components/ui-system'
import { metricTone } from './analytics-utils'

import type {
  AnalyticsSnapshot,
} from './analytics.types'

interface AnalyticsDashboardProps {
  snapshot?: AnalyticsSnapshot
}

export function AnalyticsDashboard({
  snapshot,
}: AnalyticsDashboardProps) {
  const metrics =
    snapshot?.metricRecords ??
    snapshot?.metrics ??
    []
  const alerts =
    snapshot?.alerts ??
    snapshot?.anomalies ??
    []
  const criticalAlerts = alerts.filter(
    (alert) => alert.severity === 'CRITICAL',
  ).length
  const kpis = metrics.slice(0, 4)

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((metric) => (
        <StatCard
          key={metric.key}
          label={metric.label}
          value={`${metric.value}${metric.unit ?? ''}`}
          icon={<Gauge className="h-5 w-5" />}
          trend={
            <span
              className={
                metricTone(metric) === 'danger'
                  ? 'text-red-300'
                  : metricTone(metric) ===
                      'warning'
                    ? 'text-amber-300'
                    : 'text-cyan-300'
              }
            >
              {metric.domain}
            </span>
          }
        />
      ))}

      {kpis.length === 0 ? (
        <>
          <StatCard
            label="Realtime metrics"
            value="0"
            icon={<Activity className="h-5 w-5" />}
          />
          <StatCard
            label="Critical alerts"
            value={criticalAlerts}
            icon={<AlertTriangle className="h-5 w-5" />}
          />
          <StatCard
            label="AI predictions"
            value={
              snapshot?.predictions?.length ?? 0
            }
            icon={<Brain className="h-5 w-5" />}
          />
        </>
      ) : null}
    </div>
  )
}
