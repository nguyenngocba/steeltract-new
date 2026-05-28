import {
  DataTable,
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'
import { qcStatusTone } from './qc-utils'

import type {
  QcIssue,
} from './qc.types'

interface IssueTrackerProps {
  issues: QcIssue[]
}

export function IssueTracker({
  issues,
}: IssueTrackerProps) {
  return (
    <SectionCard title="Issue tracker">
      <DataTable
        data={issues}
        rowKey={(row) => row.id}
        empty="No QC issues"
        columns={[
          {
            key: 'issue',
            header: 'Issue',
            render: (row) => (
              <div>
                <p className="font-medium">
                  {row.title}
                </p>
                <p className="text-xs text-zinc-500">
                  {row.code ?? row.id}
                </p>
              </div>
            ),
          },
          {
            key: 'severity',
            header: 'Severity',
            render: (row) => (
              <StatusBadge
                tone={qcStatusTone(
                  row.severity,
                )}
              >
                {row.severity}
              </StatusBadge>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => (
              <StatusBadge
                tone={qcStatusTone(row.status)}
              >
                {row.status}
              </StatusBadge>
            ),
          },
          {
            key: 'action',
            header: 'Corrective action',
            render: (row) =>
              row.correctiveAction ?? '-',
          },
        ]}
      />
    </SectionCard>
  )
}
