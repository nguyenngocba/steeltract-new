import type {
  Tone,
} from '../../components/ui-system'
import type {
  AnalyticsAlertSeverity,
  AnalyticsMetric,
} from './analytics.types'

export function alertTone(
  severity: AnalyticsAlertSeverity | string,
): Tone {
  if (severity === 'CRITICAL') {
    return 'danger'
  }

  if (severity === 'WARNING') {
    return 'warning'
  }

  return 'info'
}

export function metricTone(
  metric: AnalyticsMetric,
): Tone {
  if (
    metric.threshold !== undefined &&
    metric.threshold !== null
  ) {
    if (
      metric.key === 'qc.pass.rate' &&
      metric.value < metric.threshold
    ) {
      return 'danger'
    }

    if (metric.value > metric.threshold) {
      return 'warning'
    }
  }

  if (
    metric.target !== undefined &&
    metric.target !== null &&
    metric.value >= metric.target
  ) {
    return 'success'
  }

  return 'info'
}
