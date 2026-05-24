import {
  BadgeCheck,
  TimerReset,
} from 'lucide-react'

import {
  DataTable,
  PageLayout,
  SectionCard,
  StatCard,
  StatusBadge,
} from '../../components/ui-system'
import {
  WorkflowStatusBadge,
  useWorkflowDefinitionsQuery,
  useWorkflowInstancesQuery,
} from '../../lib/workflow'
import { asList } from './operations-data'
import {
  OperationalActivityPanel,
  StickyOpsToolbar,
} from './operations-utils'

export function WorkflowOperationsPage() {
  const instancesQuery = useWorkflowInstancesQuery({
    page: 1,
    limit: 50,
  })
  const definitionsQuery = useWorkflowDefinitionsQuery({
    page: 1,
    limit: 50,
  })
  const instances = asList(instancesQuery.data)
  const definitions = asList(definitionsQuery.data)
  const active = instances.filter((item) =>
    ['PENDING', 'IN_PROGRESS', 'ESCALATED'].includes(item.status),
  )

  return (
    <PageLayout
      title="Workflow Operations"
      description="Approval queues, SLA exposure, escalation readiness, and workflow audit trail."
    >
      <StickyOpsToolbar
        domain="workflow"
        quickFilters={
          <>
            <StatusBadge tone="info">
              active {active.length}
            </StatusBadge>
            <StatusBadge tone="warning">
              escalated{' '}
              {
                active.filter(
                  (item) => item.status === 'ESCALATED',
                ).length
              }
            </StatusBadge>
          </>
        }
        counters={
          <StatusBadge tone="neutral">
            definitions {definitions.length}
          </StatusBadge>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active workflows"
          value={active.length}
          icon={<BadgeCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Definitions"
          value={definitions.length}
          icon={<TimerReset className="h-5 w-5" />}
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <SectionCard title="Workflow queue">
          <DataTable
            data={instances}
            loading={instancesQuery.isLoading}
            rowKey={(row) => row.id}
            density="compact"
            selectable
            savedViewName="Approval queue"
            highlightedRowIds={instances
              .filter((row) => row.status === 'ESCALATED')
              .map((row) => row.id)}
            statusTone={(row) =>
              row.status === 'ESCALATED'
                ? 'warning'
                : row.status === 'REJECTED'
                  ? 'danger'
                  : row.status === 'COMPLETED'
                    ? 'success'
                    : 'info'
            }
            rowActions={(row) => (
              <button className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
                {row.status === 'PENDING'
                  ? 'Approve'
                  : 'Open'}
              </button>
            )}
            columns={[
              {
                key: 'ref',
                header: 'Reference',
                render: (row) =>
                  `${row.referenceModule} / ${row.referenceId}`,
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => (
                  <WorkflowStatusBadge status={row.status} />
                ),
              },
              {
                key: 'due',
                header: 'Due',
                render: (row) =>
                  row.dueAt
                    ? new Date(row.dueAt).toLocaleString()
                    : '-',
              },
            ]}
          />
        </SectionCard>
        <OperationalActivityPanel
          title="Workflow activity"
          items={instances.flatMap((instance) =>
            instance.actions.map((action) => ({
              id: action.id,
              label: action.type,
              detail: `${instance.referenceModule} / ${instance.referenceId}`,
              tone:
                action.type === 'REJECT'
                  ? 'danger'
                  : action.type === 'ESCALATE'
                    ? 'warning'
                    : 'success',
            })),
          )}
        />
      </div>
    </PageLayout>
  )
}
