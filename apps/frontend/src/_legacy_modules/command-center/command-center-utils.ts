import type {
  AnalyticsAlert,
  AnalyticsMetric,
} from '../analytics-ui'
import type {
  CommandEvent,
  CommandSeverity,
} from './command-center.types'

export function severityTone(
  severity?: CommandSeverity | string,
) {
  if (
    severity === 'critical' ||
    severity === 'CRITICAL'
  ) {
    return 'danger' as const
  }

  if (
    severity === 'warning' ||
    severity === 'WARNING'
  ) {
    return 'warning' as const
  }

  if (
    severity === 'info' ||
    severity === 'INFO'
  ) {
    return 'info' as const
  }

  return 'success' as const
}

export function metricSeverity(
  metric?: AnalyticsMetric,
): CommandSeverity {
  if (!metric) {
    return 'normal'
  }

  if (
    metric.threshold !== undefined &&
    metric.threshold !== null
  ) {
    if (
      metric.key === 'qc.pass.rate' &&
      metric.value < metric.threshold
    ) {
      return 'critical'
    }

    if (metric.value > metric.threshold) {
      return 'warning'
    }
  }

  return 'normal'
}

export function alertToEvent(
  alert: AnalyticsAlert,
): CommandEvent {
  return {
    id: alert.id,
    event: alert.key,
    domain: alert.domain,
    message: alert.message,
    severity:
      alert.severity === 'CRITICAL'
        ? 'critical'
        : alert.severity === 'WARNING'
          ? 'warning'
          : 'info',
    occurredAt: alert.createdAt,
  }
}

export function formatMetricValue(
  value: number | undefined,
  unit?: string | null,
) {
  return `${value ?? 0}${unit ?? ''}`
}
