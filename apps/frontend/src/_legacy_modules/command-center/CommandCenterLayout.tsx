import {
  motion,
} from 'framer-motion'
import {
  Activity,
  Factory,
  FlaskConical,
  Map,
  Monitor,
} from 'lucide-react'
import {
  Suspense,
  useEffect,
  lazy,
  useMemo,
  useState,
} from 'react'

import {
  LoadingState,
  PageLayout,
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'
import {
  useAnalyticsAlertsQuery,
  useAnalyticsOverviewQuery,
  useAnalyticsPredictionsQuery,
} from '../analytics-ui'
import {
  useJobsQuery,
} from '../../lib/jobs'
import {
  useProductionMetricsQuery,
} from '../production-ui'
import {
  useQcMetricsQuery,
} from '../qc-ui'
import {
  useWorkflowInstancesQuery,
} from '../../lib/workflow'
import {
  useAdaptiveRefreshInterval,
  usePerformanceMonitor,
} from '../../lib/performance'
import {
  useYardMetricsQuery,
} from '../yard'
import { AlertTicker } from './AlertTicker'
import { LiveKpiGrid } from './LiveKpiGrid'
import { LiveNotificationStack } from './LiveNotificationStack'
import { LiveProductionPulse } from './LiveProductionPulse'
import { LiveQcPulse } from './LiveQcPulse'
import { RealtimeActivityStream } from './RealtimeActivityStream'
import { SystemHealthPanel } from './SystemHealthPanel'
import { WorkflowSlaWarnings } from './WorkflowSlaWarnings'
import { YardCongestionPanel } from './YardCongestionPanel'
import { FullscreenTvMode } from './FullscreenTvMode'
import { useCommandCenterEvents } from './useCommandCenterEvents'
import {
  alertToEvent,
  formatMetricValue,
  metricSeverity,
} from './command-center-utils'
import { PredictiveInsights } from '../analytics-ui/PredictiveInsights'
import {
  useSimulationStatusQuery,
} from '../simulation-ui'
import { OperationalSearchPanel } from './OperationalSearchPanel'
import {
  OperatorQuickActionsPanel,
} from '../operator-actions'
import { AiCopilotPanel } from './AiCopilotPanel'
import { DigitalTwinReplayPanel } from './DigitalTwinReplayPanel'
import { IndustrialMotionStrip } from './IndustrialMotionStrip'
import { TelemetryAtmosphere } from './TelemetryAtmosphere'

import type {
  CommandCenterMode,
  CommandMetric,
} from './command-center.types'

const modes: Array<{
  id: CommandCenterMode
  label: string
}> = [
  { id: 'management', label: 'Management overview' },
  { id: 'production', label: 'Production operations' },
  { id: 'qc', label: 'QC operations' },
  { id: 'logistics', label: 'Logistics operations' },
]

const YardPixiCanvas = lazy(() =>
  import('../yard').then(
    (module) => ({
      default: module.YardPixiCanvas,
    }),
  ),
)

const SimulationControlPanel = lazy(() =>
  import('../simulation-ui').then((module) => ({
    default: module.SimulationControlPanel,
  })),
)

export function CommandCenterLayout() {
  const [mode, setMode] =
    useState<CommandCenterMode>('management')
  const [tvMode, setTvMode] =
    useState(false)
  const analyticsQuery =
    useAnalyticsOverviewQuery()
  const alertsQuery =
    useAnalyticsAlertsQuery({
      limit: 10,
      status: 'OPEN',
    })
  const predictionsQuery =
    useAnalyticsPredictionsQuery()
  const productionQuery =
    useProductionMetricsQuery()
  const qcQuery = useQcMetricsQuery()
  const yardQuery = useYardMetricsQuery()
  const workflowQuery =
    useWorkflowInstancesQuery({
      status: 'IN_PROGRESS',
      limit: 20,
      page: 1,
    })
  const jobsQuery = useJobsQuery({
    limit: 20,
    page: 1,
  })
  const realtimeEvents =
    useCommandCenterEvents()
  const simulationQuery =
    useSimulationStatusQuery()
  const refreshInterval =
    useAdaptiveRefreshInterval({
      activeMs: 20_000,
      hiddenMs: false,
    })
  const performanceSample =
    usePerformanceMonitor()

  useEffect(() => {
    if (!refreshInterval) {
      return
    }

    const intervalId = window.setInterval(
      () => {
        void analyticsQuery.refetch()
        void alertsQuery.refetch()
        void productionQuery.refetch()
        void qcQuery.refetch()
        void yardQuery.refetch()
        void workflowQuery.refetch()
        void jobsQuery.refetch()
      },
      refreshInterval,
    )

    return () =>
      window.clearInterval(intervalId)
  }, [
    alertsQuery,
    analyticsQuery,
    jobsQuery,
    productionQuery,
    qcQuery,
    refreshInterval,
    workflowQuery,
    yardQuery,
  ])

  const snapshot = analyticsQuery.data
  const snapshotMetrics = useMemo(
    () =>
      snapshot?.metricRecords ??
      snapshot?.metrics ??
      [],
    [snapshot?.metricRecords, snapshot?.metrics],
  )
  const alerts =
    alertsQuery.data?.data ??
    snapshot?.alerts ??
    snapshot?.anomalies ??
    []
  const predictions =
    predictionsQuery.data ??
    snapshot?.predictions ??
    []
  const production =
    productionQuery.data
  const qc = qcQuery.data
  const yard = yardQuery.data
  const workflowItems =
    Array.isArray(workflowQuery.data)
      ? workflowQuery.data
      : workflowQuery.data?.data ?? []
  const jobs = Array.isArray(jobsQuery.data)
    ? jobsQuery.data
    : jobsQuery.data?.data ?? []
  const jobsQueued = jobs.filter(
    (job) => job.status === 'QUEUED',
  ).length
  const jobsFailed = jobs.filter(
    (job) => job.status === 'FAILED',
  ).length
  const simulationStatus =
    simulationQuery.data
  const alertEvents = alerts.map(alertToEvent)
  const events = [
    ...alertEvents,
    ...realtimeEvents,
  ].slice(0, 30)
  const machineUtilizationValue =
    production?.machineUtilization?.length
      ? Math.round(
          production.machineUtilization.reduce(
            (sum, machine) =>
              sum + machine.utilization,
            0,
          ) /
            production.machineUtilization
              .length,
        )
      : snapshotMetrics.find(
          (metric) =>
            metric.key ===
            'machine.utilization.avg',
        )?.value
  const bottlenecks =
    production?.bottlenecks ?? []
  const machineDowntime =
    production?.machineUtilization?.filter(
      (machine) =>
        ['MAINTENANCE', 'OFFLINE'].includes(
          machine.status,
        ),
    ) ?? []
  const topWorkflow =
    workflowItems.find(
      (item) => item.status === 'ESCALATED',
    ) ?? workflowItems[0]
  const workflowEscalations =
    workflowItems.filter(
      (item) => item.status === 'ESCALATED',
    ).length
  const executiveSummary = [
    `${production?.inProgress ?? 0} production orders active`,
    `${qc?.openIssues ?? 0} QC issues open`,
    `${Math.round((yard as any)?.occupancyRate ?? 0)}% yard occupancy`,
    `${jobsFailed} failed jobs`,
  ].join(' / ')

  const metrics = useMemo<CommandMetric[]>(
    () => {
      const metricByKey = (key: string) =>
        snapshotMetrics.find(
          (metric) => metric.key === key,
        )

      const productionOrders =
        metricByKey(
          'production.orders.total',
        )
      const qcPassRate = metricByKey(
        'qc.pass.rate',
      )
      const yardOccupancy = metricByKey(
        'yard.occupancy.rate',
      )
      const machineUtilization =
        metricByKey(
          'machine.utilization.avg',
        )

      const base: CommandMetric[] = [
        {
          id: 'production',
          label: 'Production orders',
          value:
            production?.totalOrders ??
            productionOrders?.value ??
            0,
          severity: metricSeverity(
            productionOrders,
          ),
          description:
            'Live fabrication demand',
        },
        {
          id: 'qc',
          label: 'QC pass rate',
          value: formatMetricValue(
            qc?.passRate ??
              qcPassRate?.value,
            '%',
          ),
          severity: metricSeverity(qcPassRate),
          description:
            'Inspection quality signal',
        },
        {
          id: 'yard',
          label: 'Yard occupancy',
          value: formatMetricValue(
            (yard as any)?.occupancyRate ??
              yardOccupancy?.value,
            '%',
          ),
          severity:
            ((yard as any)?.occupancyRate ?? 0) > 85
              ? 'critical'
              : metricSeverity(yardOccupancy),
          description:
            'Storage congestion',
        },
        {
          id: 'machine',
          label: 'Machine utilization',
          value: formatMetricValue(
            machineUtilizationValue,
            '%',
          ),
          severity: metricSeverity(
            machineUtilization,
          ),
          description:
            'Factory load signal',
        },
      ]

      if (mode === 'production') {
        return base.filter((item) =>
          [
            'production',
            'machine',
            'yard',
          ].includes(item.id),
        )
      }

      if (mode === 'qc') {
        return base.filter((item) =>
          ['qc', 'production'].includes(
            item.id,
          ),
        )
      }

      if (mode === 'logistics') {
        return base.filter((item) =>
          ['yard', 'production'].includes(
            item.id,
          ),
        )
      }

      return base
    },
    [
      mode,
      machineUtilizationValue,
      production?.totalOrders,
      qc?.passRate,
      snapshotMetrics,
      (yard as any)?.occupancyRate,
    ],
  )

  const isLoading =
    analyticsQuery.isLoading &&
    !snapshot

  if (isLoading) {
    return (
      <PageLayout
        title="Command Center"
        description="Loading realtime operational intelligence"
      >
        <LoadingState label="Initializing command center" />
      </PageLayout>
    )
  }

  return (
    <div
      className={
        tvMode
          ? 'fixed inset-0 z-50 overflow-auto bg-zinc-950 p-6 text-white'
          : ''
      }
    >
      <PageLayout
        title="Industrial Command Center"
        description="Realtime operating picture for production, QC, warehouse, logistics and workflow risk."
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="success">
              realtime
            </StatusBadge>
            <StatusBadge
              tone={
                performanceSample.fps < 30
                  ? 'warning'
                  : 'info'
              }
            >
              {`${performanceSample.fps || 0} fps`}
            </StatusBadge>
            <FullscreenTvMode
              active={tvMode}
              onToggle={() =>
                setTvMode((current) => !current)
              }
            />
          </div>
        }
      >
        <div className="flex flex-wrap gap-2">
          {modes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={
                mode === item.id
                  ? 'rounded-lg border border-cyan-500 bg-cyan-500 px-3 py-2 text-sm font-medium text-white'
                  : 'rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 hover:text-white'
              }
            >
              {item.label}
            </button>
          ))}
        </div>

        <motion.div
          className="relative -mx-2 overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-3 shadow-[0_0_60px_rgba(8,145,178,0.1)] md:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <TelemetryAtmosphere />
          <div className="relative space-y-5">
            <AlertTicker alerts={alerts} />

            <div className="grid gap-5 xl:grid-cols-[1.45fr_0.55fr]">
              <div className="space-y-5">
                <SectionCard
                  title="Executive operational summary"
                  description="Dense wallboard ribbon for shift handoff, executive scan and smart-factory status."
                  actions={
                    <StatusBadge tone="info">
                      digital twin online
                    </StatusBadge>
                  }
                >
                  <div className="relative overflow-hidden rounded-lg border border-cyan-500/20 bg-[linear-gradient(135deg,rgba(8,145,178,0.18),rgba(9,9,11,0.94)_58%,rgba(16,185,129,0.1))] px-4 py-4 shadow-[0_0_42px_rgba(34,211,238,0.12)]">
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 animate-[factory-shimmer_6s_linear_infinite] bg-gradient-to-r from-transparent via-cyan-300/14 to-transparent" />
                    <div className="relative flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">
                          smart factory wallboard
                        </p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {executiveSummary}
                        </p>
                      </div>
                      <p className="text-xs text-zinc-400">
                        realtime batching / adaptive refresh / operator action chain ready
                      </p>
                    </div>
                  </div>
                </SectionCard>

                <LiveKpiGrid metrics={metrics} />
                <IndustrialMotionStrip
                  throughput={production?.throughput}
                  delayed={production?.delayed}
                  downtime={machineDowntime.length}
                  events={events.length}
                  simulationRunning={simulationStatus?.running}
                />
              </div>

              <div className="space-y-5 xl:-ml-2 xl:pt-10">
                <AiCopilotPanel
                  alerts={alerts}
                  predictions={predictions}
                  delayedOrders={production?.delayed}
                  machineDowntime={machineDowntime.length}
                  yardOccupancy={(yard as any)?.occupancyRate}
                  workflowEscalations={workflowEscalations}
                />
                <DigitalTwinReplayPanel
                  status={simulationStatus}
                  events={events}
                />
              </div>
            </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            {[
              [
                'Active shift',
                'Shift A',
                'realtime roster ready',
                'info',
              ],
              [
                'Throughput',
                String(production?.throughput ?? 0),
                'orders / period',
                'success',
              ],
              [
                'Bottleneck',
                bottlenecks[0]?.stage ?? 'clear',
                `${bottlenecks[0]?.count ?? 0} queued`,
                bottlenecks.length > 0
                  ? 'warning'
                  : 'neutral',
              ],
              [
                'Downtime',
                String(machineDowntime.length),
                machineDowntime[0]?.code ??
                  'machines online',
                machineDowntime.length > 0
                  ? 'danger'
                  : 'success',
              ],
              [
                'Simulation speed',
                `${simulationStatus?.speed ?? 1}x`,
                simulationStatus?.running
                  ? 'scenario live'
                  : 'idle',
                simulationStatus?.running
                  ? 'success'
                  : 'neutral',
              ],
              [
                'Event ribbon',
                String(events.length),
                'batched realtime events',
                'info',
              ],
            ].map(([label, value, detail, tone]) => (
              <div
                key={label}
                className={`rounded-lg border p-3 ${
                  tone === 'danger'
                    ? 'border-red-500/30 bg-red-500/10'
                    : tone === 'warning'
                      ? 'border-amber-500/30 bg-amber-500/10'
                      : tone === 'success'
                        ? 'border-emerald-500/30 bg-emerald-500/10'
                        : tone === 'info'
                          ? 'border-cyan-500/30 bg-cyan-500/10'
                          : 'border-zinc-800 bg-zinc-950/70'
                }`}
              >
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  {label}
                </p>
                <p className="mt-1 truncate text-lg font-semibold text-white">
                  {value}
                </p>
                <p className="mt-1 truncate text-xs text-zinc-400">
                  {detail}
                </p>
              </div>
            ))}
          </div>

          <SectionCard
            title="AI recommendation lane"
            description="Operational assistant summary for bottlenecks, downtime, SLA exposure, congestion and simulation anomalies."
            actions={
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone="warning">
                  anomalies {alerts.length}
                </StatusBadge>
                <StatusBadge tone="info">
                  predictions {predictions.length}
                </StatusBadge>
              </div>
            }
          >
            <div className="grid gap-3 xl:grid-cols-4">
              {[
                {
                  title: 'Production throughput',
                  detail:
                    (production?.delayed ?? 0) > 0
                      ? 'Delayed orders require stage triage.'
                      : 'Throughput is within current command signal.',
                  tone:
                    (production?.delayed ?? 0) > 0
                      ? 'warning'
                      : 'success',
                },
                {
                  title: 'Predictive maintenance',
                  detail:
                    machineDowntime.length > 0
                      ? `${machineDowntime[0]?.code} needs downtime review.`
                      : 'No machine downtime alert in current strip.',
                  tone:
                    machineDowntime.length > 0
                      ? 'danger'
                      : 'success',
                },
                {
                  title: 'Workflow SLA',
                  detail:
                    topWorkflow?.status === 'ESCALATED'
                      ? `${topWorkflow.referenceModule} escalated.`
                      : 'Approval lane is available for escalation watch.',
                  tone:
                    topWorkflow?.status === 'ESCALATED'
                      ? 'warning'
                      : 'info',
                },
                {
                  title: 'Simulation anomaly',
                  detail:
                    simulationStatus?.lastEvent ??
                    'Waiting for simulation events.',
                  tone: simulationStatus?.running
                    ? 'info'
                    : 'neutral',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className={
                    item.tone === 'danger'
                      ? 'animate-pulse rounded-lg border border-red-500/30 bg-red-500/10 p-3'
                      : item.tone === 'warning'
                        ? 'rounded-lg border border-amber-500/30 bg-amber-500/10 p-3'
                        : item.tone === 'success'
                          ? 'rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3'
                          : 'rounded-lg border border-zinc-800 bg-zinc-950/70 p-3'
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white">
                      {item.title}
                    </p>
                    <StatusBadge
                      tone={
                        item.tone as
                          | 'neutral'
                          | 'info'
                          | 'success'
                          | 'warning'
                          | 'danger'
                      }
                    >
                      AI
                    </StatusBadge>
                  </div>
                  <p className="mt-2 text-xs text-zinc-400">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Operational simulation state"
            description="Global factory scenario driver feeding production, QC, yard, analytics, workflow and jobs."
            actions={
              <div className="flex flex-wrap gap-2">
                <StatusBadge
                  tone={
                    simulationStatus?.running
                      ? 'success'
                      : 'neutral'
                  }
                >
                  {simulationStatus?.running
                    ? 'simulation live'
                    : 'simulation idle'}
                </StatusBadge>
                <StatusBadge tone="info">
                  {simulationStatus?.scenarioId ??
                    'no scenario'}
                </StatusBadge>
              </div>
            }
          >
            <div className="grid gap-3 md:grid-cols-4">
              {[
                [
                  'Tick',
                  String(simulationStatus?.tick ?? 0),
                ],
                [
                  'Speed',
                  `${simulationStatus?.speed ?? 1}x`,
                ],
                [
                  'Mode',
                  simulationStatus?.mode ??
                    'deterministic',
                ],
                [
                  'Last event',
                  simulationStatus?.lastEvent ??
                    'waiting',
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-zinc-800 bg-zinc-950/70 px-4 py-3"
                >
                  <p className="text-xs text-zinc-500">
                    {label}
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-white">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          <Suspense
            fallback={
              <LoadingState label="Loading simulation controls" />
            }
          >
            <SimulationControlPanel />
          </Suspense>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <LiveProductionPulse
                total={production?.totalOrders}
                delayed={production?.delayed}
                utilization={machineUtilizationValue}
              />
              <YardCongestionPanel
                occupancyRate={
                  (yard as any)?.occupancyRate
                }
                occupiedSlots={
                  (yard as any)?.occupiedSlots
                }
                totalSlots={(yard as any)?.totalSlots}
              />
              <Suspense
                fallback={
                  <LoadingState label="Loading PixiJS yard renderer" />
                }
              >
                <YardPixiCanvas compact />
              </Suspense>
            </div>

            <div className="space-y-6">
              <LiveQcPulse
                passRate={qc?.passRate}
                openIssues={qc?.openIssues}
                openNcrs={qc?.openNcrs}
              />
              <WorkflowSlaWarnings
                active={workflowItems.length}
                overdue={
                  snapshot?.slaViolations
                    ?.workflow ?? 0
                }
              />
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <SectionCard
              title="Production lane"
              description="Live order pressure and throughput signal"
            >
              <div className="space-y-3">
                {[
                  ['Total', production?.totalOrders ?? 0],
                  ['In progress', production?.inProgress ?? 0],
                  ['Delayed', production?.delayed ?? 0],
                  [
                    'Completion',
                    `${production?.completionRate ?? 0}%`,
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-lg bg-zinc-950/70 px-3 py-2 text-sm"
                  >
                    <span className="text-zinc-400">
                      {label}
                    </span>
                    <span className="font-semibold text-white">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard
              title="QC alert lane"
              description="Defect and rework pressure"
            >
              <div className="space-y-3">
                {[
                  ['Pass rate', `${qc?.passRate ?? 0}%`],
                  ['Open issues', qc?.openIssues ?? 0],
                  ['Open NCRs', qc?.openNcrs ?? 0],
                  ['Rework', qc?.rework ?? 0],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-lg bg-zinc-950/70 px-3 py-2 text-sm"
                  >
                    <span className="text-zinc-400">
                      {label}
                    </span>
                    <span className="font-semibold text-white">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard
              title="Workflow SLA lane"
              description="Approvals and escalation exposure"
            >
              <div className="space-y-3">
                {[
                  ['Active', workflowItems.length],
                  [
                    'Overdue',
                    snapshot?.slaViolations?.workflow ?? 0,
                  ],
                  ['Queued jobs', jobsQueued],
                  ['Failed jobs', jobsFailed],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-lg bg-zinc-950/70 px-3 py-2 text-sm"
                  >
                    <span className="text-zinc-400">
                      {label}
                    </span>
                    <span className="font-semibold text-white">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <RealtimeActivityStream
              events={events}
            />
            <div className="space-y-6">
              <OperatorQuickActionsPanel
                title="Command quick actions"
                domains={[
                  'production',
                  'qc',
                  'yard',
                  'workflow',
                  'inventory',
                  'procurement',
                ]}
                context={{
                  workflowInstanceId:
                    topWorkflow?.id,
                }}
              />
              <OperationalSearchPanel />
              <SystemHealthPanel
                jobsQueued={jobsQueued}
                jobsFailed={jobsFailed}
              />
              <LiveNotificationStack />
            </div>
          </div>

          <PredictiveInsights
            predictions={predictions}
          />
          </div>
        </motion.div>

        <div className="hidden">
          <Factory />
          <FlaskConical />
          <Map />
          <Monitor />
          <Activity />
        </div>
        <style>
          {`
            @keyframes factory-shimmer {
              0% { transform: translateX(-140%); opacity: 0; }
              18% { opacity: 1; }
              82% { opacity: 1; }
              100% { transform: translateX(340%); opacity: 0; }
            }
            @keyframes telemetry-sweep {
              0% { transform: translateY(-20%); opacity: 0; }
              18% { opacity: 0.8; }
              100% { transform: translateY(86vh); opacity: 0; }
            }
            @keyframes telemetry-dot {
              0%, 100% { transform: scale(0.72); opacity: 0.35; }
              45% { transform: scale(1.35); opacity: 0.9; }
            }
          `}
        </style>
      </PageLayout>
    </div>
  )
}
