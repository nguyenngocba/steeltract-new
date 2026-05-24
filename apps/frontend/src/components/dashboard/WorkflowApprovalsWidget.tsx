import {
  EmptyState,
  SectionCard,
  StatusBadge,
  Timeline,
} from '../ui-system'
import {
  formatDateTime,
} from './dashboard-utils'

import type {
  WorkflowInstance,
} from '../../lib/workflow'

interface WorkflowApprovalsWidgetProps {
  instances: WorkflowInstance[]
}

export function WorkflowApprovalsWidget({
  instances,
}: WorkflowApprovalsWidgetProps) {
  const pending = instances.filter((item) =>
    ['PENDING', 'IN_PROGRESS', 'ESCALATED'].includes(
      item.status,
    ),
  )

  return (
    <SectionCard
      title="Pending Approvals"
      description="Workflow instances waiting for action"
      actions={
        <StatusBadge tone={pending.length > 0 ? 'info' : 'neutral'}>
          {String(pending.length)}
        </StatusBadge>
      }
    >
      {pending.length === 0 ? (
        <EmptyState
          title="No pending approvals"
          description="Approval workflows will appear here once modules start workflow instances."
        />
      ) : (
        <Timeline
          items={pending.slice(0, 6).map((item) => ({
            id: item.id,
            title: item.definition.name,
            description: `${item.referenceModule}:${item.referenceId}`,
            time: item.dueAt
              ? `Due ${formatDateTime(item.dueAt)}`
              : formatDateTime(item.updatedAt),
            tone:
              item.status === 'ESCALATED'
                ? 'warning'
                : 'info',
          }))}
        />
      )}
    </SectionCard>
  )
}
