import {
  SectionCard,
  Timeline,
} from '../../components/ui-system'

import type {
  QcIssue,
} from './qc.types'

interface ReworkTimelineProps {
  issues: QcIssue[]
}

export function ReworkTimeline({
  issues,
}: ReworkTimelineProps) {
  return (
    <SectionCard title="Rework timeline">
      <Timeline
        items={issues.map((issue) => ({
          id: issue.id,
          title: issue.title,
          description:
            issue.correctiveAction ??
            issue.description ??
            'Corrective action pending',
          time: issue.dueAt
            ? new Date(
                issue.dueAt,
              ).toLocaleDateString()
            : new Date(
                issue.createdAt,
              ).toLocaleDateString(),
          tone:
            issue.severity === 'CRITICAL'
              ? 'danger'
              : issue.severity === 'HIGH'
                ? 'warning'
                : 'info',
        }))}
      />
    </SectionCard>
  )
}
