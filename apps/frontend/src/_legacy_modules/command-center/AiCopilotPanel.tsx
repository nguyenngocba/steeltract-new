import {
  BrainCircuit,
  Cpu,
  FileWarning,
  Lightbulb,
  Route,
} from 'lucide-react'

import {
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'

import type {
  AnalyticsAlert,
  AnalyticsPrediction,
} from '../analytics-ui'

interface AiCopilotPanelProps {
  alerts: AnalyticsAlert[]
  predictions: AnalyticsPrediction[]
  delayedOrders?: number
  machineDowntime?: number
  yardOccupancy?: number
  workflowEscalations?: number
}

export function AiCopilotPanel({
  alerts,
  predictions,
  delayedOrders = 0,
  machineDowntime = 0,
  yardOccupancy = 0,
  workflowEscalations = 0,
}: AiCopilotPanelProps) {
  const reasoning = [
    {
      title: 'Bottleneck explanation',
      detail:
        delayedOrders > 0
          ? `${delayedOrders} delayed orders indicate stage queue pressure.`
          : 'Production flow is not currently signaling delayed stage pressure.',
      Icon: Route,
      tone:
        delayedOrders > 0 ? 'warning' : 'success',
    },
    {
      title: 'Maintenance assistant',
      detail:
        machineDowntime > 0
          ? `${machineDowntime} machine signals need maintenance review.`
          : 'Machine downtime risk remains within current threshold.',
      Icon: Cpu,
      tone:
        machineDowntime > 0 ? 'danger' : 'success',
    },
    {
      title: 'Procurement risk',
      detail:
        alerts.some((alert) => alert.domain === 'INVENTORY')
          ? 'Inventory alert detected; prepare material request workflow.'
          : 'No active shortage alert in analytics lane.',
      Icon: FileWarning,
      tone: alerts.some((alert) => alert.domain === 'INVENTORY')
        ? 'warning'
        : 'neutral',
    },
    {
      title: 'Workflow suggestion',
      detail:
        workflowEscalations > 0
          ? 'Escalate aging approvals and notify responsible role.'
          : 'Approval queue is ready for normal operator review.',
      Icon: Lightbulb,
      tone:
        workflowEscalations > 0 ? 'warning' : 'info',
    },
  ] as const

  return (
    <SectionCard
      title="AI copilot"
      description="Contextual recommendations, anomaly reasoning, maintenance guidance and workflow suggestions."
      actions={
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="info">
            {predictions.length} predictions
          </StatusBadge>
          <StatusBadge tone="warning">
            {alerts.length} alerts
          </StatusBadge>
        </div>
      }
    >
      <div className="mb-4 rounded-lg border border-cyan-500/25 bg-[linear-gradient(135deg,rgba(8,145,178,0.16),rgba(15,23,42,0.72))] p-4 shadow-[0_0_30px_rgba(34,211,238,0.08)]">
        <div className="flex items-start gap-3">
          <BrainCircuit className="mt-0.5 h-5 w-5 text-cyan-300" />
          <div>
            <p className="text-sm font-semibold text-white">
              Operational assistant summary
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-400">
              Watch production delay pressure, machine downtime,
              yard occupancy at {Math.round(yardOccupancy)}%, and
              workflow escalation exposure before the next shift handoff.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {reasoning.map(({ title, detail, Icon, tone }) => (
          <div
            key={title}
            className={
              tone === 'danger'
                ? 'animate-pulse rounded-lg border border-red-500/30 bg-red-500/10 p-3'
                : tone === 'warning'
                  ? 'rounded-lg border border-amber-500/30 bg-amber-500/10 p-3'
                  : tone === 'success'
                    ? 'rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3'
                    : 'rounded-lg border border-zinc-800 bg-zinc-950/70 p-3'
            }
          >
            <div className="flex items-center justify-between gap-2">
              <Icon className="h-4 w-4 text-cyan-300" />
              <StatusBadge tone={tone}>
                {tone}
              </StatusBadge>
            </div>
            <p className="mt-2 text-sm font-medium text-white">
              {title}
            </p>
            <p className="mt-1 text-xs leading-5 text-zinc-400">
              {detail}
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
