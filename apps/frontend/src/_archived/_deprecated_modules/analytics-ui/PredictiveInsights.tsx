import {
  Brain,
  Gauge,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import type {
  LucideIcon,
} from 'lucide-react'

import {
  EmptyState,
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'

import type {
  AnalyticsPrediction,
} from './analytics.types'

interface PredictiveInsightsProps {
  predictions: AnalyticsPrediction[]
}

function insightTone(
  prediction: AnalyticsPrediction,
) {
  const confidence =
    prediction.confidence ?? 0

  if (
    prediction.status === 'CRITICAL' ||
    confidence >= 0.85
  ) {
    return 'danger' as const
  }

  if (
    prediction.status === 'WARNING' ||
    confidence >= 0.65
  ) {
    return 'warning' as const
  }

  return 'info' as const
}

function recommendationFor(
  prediction: AnalyticsPrediction,
) {
  if (prediction.domain === 'PRODUCTION') {
    return 'Check bottleneck lane, rebalance work centers, and prepare stage advance actions.'
  }

  if (prediction.domain === 'MACHINE') {
    return 'Review downtime risk, assign maintenance window, and protect critical path jobs.'
  }

  if (prediction.domain === 'QC') {
    return 'Prioritize high severity inspections, attach evidence, and prepare NCR escalation.'
  }

  if (prediction.domain === 'YARD') {
    return 'Review congestion hotspots, crane allocation, and outbound movement queue.'
  }

  if (prediction.domain === 'WORKFLOW') {
    return 'Escalate aging approvals before SLA breach and notify approver role.'
  }

  if (prediction.domain === 'INVENTORY') {
    return 'Check low-stock strip, dispatch reservations, and create material request if needed.'
  }

  return 'Review operational context and assign owner from command center.'
}

export function PredictiveInsights({
  predictions,
}: PredictiveInsightsProps) {
  const critical = predictions.filter(
    (prediction) =>
      insightTone(prediction) === 'danger',
  )
  const warning = predictions.filter(
    (prediction) =>
      insightTone(prediction) === 'warning',
  )
  const summaryCards: Array<{
    label: string
    value: number
    detail: string
    Icon: LucideIcon
    tone:
      | 'neutral'
      | 'info'
      | 'success'
      | 'warning'
      | 'danger'
  }> = [
    {
      label: 'Anomaly severity',
      value: critical.length,
      detail: 'critical signals',
      Icon: ShieldAlert,
      tone:
        critical.length > 0
          ? 'danger'
          : 'success',
    },
    {
      label: 'Bottleneck warnings',
      value: predictions.filter(
        (item) =>
          item.key.includes('bottleneck') ||
          item.domain === 'PRODUCTION',
      ).length,
      detail: 'production risk',
      Icon: Gauge,
      tone: 'warning',
    },
    {
      label: 'AI suggestions',
      value: predictions.length,
      detail: 'operator actions',
      Icon: Sparkles,
      tone: 'info',
    },
  ]

  return (
    <SectionCard
      title="AI operational insights"
      description="Recommendation lane for anomalies, bottlenecks, downtime risk, SLA exposure, congestion and shortage warnings."
      actions={
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="danger">
            critical {critical.length}
          </StatusBadge>
          <StatusBadge tone="warning">
            warning {warning.length}
          </StatusBadge>
          <StatusBadge tone="info">
            AI assist
          </StatusBadge>
        </div>
      }
    >
      {predictions.length === 0 ? (
        <EmptyState
          title="No AI insights yet"
          description="Analytics snapshots and simulation events will populate this recommendation lane."
        />
      ) : null}

      <div className="grid gap-3 xl:grid-cols-3">
        {summaryCards.map(({ label, value, detail, Icon, tone }) => (
          <div
            key={label}
            className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <Icon className="h-4 w-4 text-cyan-300" />
              <StatusBadge tone={tone}>
                {value}
              </StatusBadge>
            </div>
            <p className="mt-2 text-sm font-medium text-white">
              {label}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {detail}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {predictions.map((prediction) => (
          <div
            key={prediction.id}
            className={
              insightTone(prediction) === 'danger'
                ? 'rounded-lg border border-red-500/30 bg-red-500/10 p-3 shadow-[0_0_24px_rgba(239,68,68,0.08)]'
                : insightTone(prediction) === 'warning'
                  ? 'rounded-lg border border-amber-500/30 bg-amber-500/10 p-3'
                  : 'rounded-lg border border-zinc-800 bg-zinc-950/60 p-3'
            }
          >
            <div className="flex items-start gap-3">
              <Brain className="mt-0.5 h-4 w-4 text-cyan-300" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-white">
                    {prediction.title}
                  </p>
                  <StatusBadge tone="info">
                    {prediction.domain}
                  </StatusBadge>
                  <StatusBadge tone={insightTone(prediction)}>
                    {prediction.status}
                  </StatusBadge>
                </div>
                <p className="mt-1 text-sm text-zinc-400">
                  {prediction.horizon ??
                    'forecasting foundation'}
                  {prediction.confidence
                    ? ` - ${Math.round(prediction.confidence * 100)}% confidence`
                    : ''}
                </p>
                <div className="mt-3 rounded-md border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-xs text-zinc-300">
                  {recommendationFor(prediction)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
