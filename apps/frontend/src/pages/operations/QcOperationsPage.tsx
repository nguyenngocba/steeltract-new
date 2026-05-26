import {
  useState,
} from 'react'

import {
  PageLayout,
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'
import {
  ContextualOperationDrawer,
  OperatorQuickActionsPanel,
} from '../../modules/operator-actions'
import {
  InspectionBoard,
  IssueTracker,
  NcrPanel,
  QualityMetricsWidgets,
  ReworkTimeline,
  useNcrsQuery,
  useQcInspectionsQuery,
  useQcMetricsQuery,
} from '../../modules/qc-ui'
import { asList } from './operations-data'
import {
  OpsLane,
  OperationalModuleTabs,
  OperationalSurface,
  OperationalWorkspaceHero,
  StickyOpsToolbar,
  WorkspaceSplit,
} from './operations-utils'

export function QcOperationsPage() {
  const [detailOpen, setDetailOpen] =
    useState(false)
  const metricsQuery = useQcMetricsQuery()
  const inspectionsQuery = useQcInspectionsQuery({
    page: 1,
    limit: 50,
  })
  const ncrQuery = useNcrsQuery({
    page: 1,
    limit: 50,
  })
  const inspections = asList(inspectionsQuery.data)
  const ncrs = asList(ncrQuery.data)
  const issues = inspections.flatMap(
    (inspection) => inspection.issues ?? [],
  )
  const queue = inspections.filter((inspection) =>
    ['READY', 'IN_PROGRESS'].includes(
      inspection.status,
    ),
  )
  const failedInspections = inspections.filter((inspection) =>
    [
      'FAILED',
      'REWORK_REQUIRED',
      'REJECTED',
    ].includes(inspection.status),
  )
  const criticalIssues = issues.filter((issue) =>
    ['HIGH', 'CRITICAL'].includes(issue.severity),
  )
  const escalatedNcrs = ncrs.filter((ncr) =>
    ['OPEN', 'UNDER_REVIEW', 'REWORK_REQUIRED'].includes(
      ncr.status,
    ),
  )
  const activeInspection =
    queue[0] ?? failedInspections[0] ?? inspections[0]
  const qcContext = {
    qcInspectionId: activeInspection?.id,
  }

  return (
    <PageLayout
      title="QC Operations"
      description="Inspection board, NCR lane, defect tracking, and rework lifecycle."
    >
      <OperationalWorkspaceHero
        eyebrow="quality control / inspection command"
        title="QC Operations Center"
        description="Inspection throughput, NCR escalation, rework pressure, defect severity and evidence review in one quality command workspace."
        metrics={[
          {
            label: 'Inspections',
            value: inspections.length,
            tone: 'info',
          },
          {
            label: 'Queue',
            value: queue.length,
            tone: 'info',
          },
          {
            label: 'NCR',
            value: escalatedNcrs.length,
            tone: escalatedNcrs.length > 0 ? 'warning' : 'success',
          },
          {
            label: 'Critical',
            value: criticalIssues.length,
            tone: criticalIssues.length > 0 ? 'danger' : 'success',
          },
        ]}
        actions={
          <>
            <StatusBadge tone="info">
              evidence review
            </StatusBadge>
            <StatusBadge tone="warning">
              NCR escalation
            </StatusBadge>
            <StatusBadge tone="success">
              quality health
            </StatusBadge>
          </>
        }
      />
      <OperationalSurface>
        <OperationalModuleTabs
          items={[
            'Overview',
            'Inspections',
            'QC plan',
            'Standards',
            'NCR',
            'Calibration',
            'Reports',
          ]}
        />
        <StickyOpsToolbar
          domain="qc"
          quickFilters={
            <>
              <StatusBadge tone="info">
                queue {queue.length}
              </StatusBadge>
              <StatusBadge tone="danger">
                critical {criticalIssues.length}
              </StatusBadge>
            </>
          }
          counters={
            <>
              <StatusBadge tone="success">
                pass {metricsQuery.data?.passRate ?? 0}%
              </StatusBadge>
              <StatusBadge tone="warning">
                NCR {metricsQuery.data?.openNcrs ?? 0}
              </StatusBadge>
            </>
          }
          actions={
            <button
              type="button"
              onClick={() => setDetailOpen(true)}
              className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200"
            >
              Open context
            </button>
          }
          shiftSelector={
            <select className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-300">
              <option>Inspection shift</option>
              <option>Day shift</option>
              <option>Night shift</option>
            </select>
          }
        />
        <QualityMetricsWidgets metrics={metricsQuery.data} />
        <WorkspaceSplit
          main={
            <>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <OpsLane title="Inspection queue" value={queue.length} detail="ready / in progress" tone="info" />
                <OpsLane title="Failed lane" value={failedInspections.length} detail="requires disposition" tone={failedInspections.length > 0 ? 'danger' : 'success'} />
                <OpsLane title="NCR escalation" value={escalatedNcrs.length} detail={escalatedNcrs[0]?.ncrNo ?? 'clear'} tone={escalatedNcrs.length > 0 ? 'warning' : 'neutral'} />
                <OpsLane title="Rework lane" value={metricsQuery.data?.rework ?? 0} detail="open rework count" tone="warning" />
                <OpsLane title="Evidence queue" value={issues.length} detail="issue-linked records" tone="neutral" />
              </div>
              <InspectionBoard inspections={inspections} loading={inspectionsQuery.isLoading} />
              <div className="grid gap-4 xl:grid-cols-2">
                <NcrPanel ncrs={ncrs} />
                <ReworkTimeline issues={issues} />
              </div>
            </>
          }
          side={
            <>
              <SectionCard title="Latest inspection">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">
                      {activeInspection?.inspectionNo ?? 'No inspection'}
                    </span>
                    <StatusBadge tone="success">
                      {activeInspection?.status ?? 'idle'}
                    </StatusBadge>
                  </div>
                  <div className="grid gap-2 text-xs text-zinc-400">
                    <div className="flex justify-between gap-3">
                      <span>Checklist</span>
                      <span className="text-white">{activeInspection?.checklist?.name ?? '-'}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Issues</span>
                      <span className="text-white">{activeInspection?.issues?.length ?? 0}</span>
                    </div>
                  </div>
                </div>
              </SectionCard>
              <IssueTracker issues={issues} />
              <OperatorQuickActionsPanel domains={['qc']} context={qcContext} title="QC operator actions" />
            </>
          }
          bottom={
            <SectionCard
              title="QC pulse lane"
              description="Severity, evidence, and approval queue composition for tablet-ready inspection operations."
            >
              <div className="grid gap-3 md:grid-cols-3">
                {['Dimensional', 'Welding', 'Coating'].map((lane) => (
                  <div key={lane} className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-white">{lane}</span>
                      <StatusBadge tone="info">evidence ready</StatusBadge>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500">
                      Attachment-first inspection evidence lane.
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          }
        />
      </OperationalSurface>
      <ContextualOperationDrawer
        open={detailOpen}
        title={
          activeInspection
            ? `Inspection ${activeInspection.inspectionNo}`
            : 'QC context'
        }
        subtitle={
          activeInspection
            ? `${activeInspection.status} / ${activeInspection.checklist?.name ?? 'no checklist'}`
            : 'Select an inspection to enable QC actions.'
        }
        context={qcContext}
        domains={['qc']}
        onClose={() => setDetailOpen(false)}
      />
    </PageLayout>
  )
}
