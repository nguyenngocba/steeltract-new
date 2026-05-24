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
} from '../yard-ui'
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
  import('../yard-visualization').then(
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
            yard?.occupancyRate ??
              yardOccupancy?.value,
            '%',
          ),
          severity:
            (yard?.occupancyRate ?? 0) > 85
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
      yard?.occupancyRate,
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

        <AlertTicker alerts={alerts} />

        <motion.div
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <LiveKpiGrid metrics={metrics} />

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
                  yard?.occupancyRate
                }
                occupiedSlots={
                  yard?.occupiedSlots
                }
                totalSlots={yard?.totalSlots}
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

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <RealtimeActivityStream
              events={events}
            />
            <div className="space-y-6">
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
        </motion.div>

        <div className="hidden">
          <Factory />
          <FlaskConical />
          <Map />
          <Monitor />
          <Activity />
        </div>
      </PageLayout>
    </div>
  )
}
