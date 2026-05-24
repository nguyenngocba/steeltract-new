import {
  DataTable,
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'
import { qcStatusTone } from './qc-utils'

import type {
  QcResult,
} from './qc.types'

interface InspectionResultPanelProps {
  results: QcResult[]
}

export function InspectionResultPanel({
  results,
}: InspectionResultPanelProps) {
  return (
    <SectionCard title="Inspection results">
      <DataTable
        data={results}
        rowKey={(row) => row.id}
        empty="No inspection results"
        columns={[
          {
            key: 'point',
            header: 'Check point',
            render: (row) =>
              row.checklistItem?.title ??
              row.category,
          },
          {
            key: 'measured',
            header: 'Measured',
            render: (row) =>
              row.measuredValue ?? '-',
          },
          {
            key: 'expected',
            header: 'Expected',
            render: (row) =>
              row.expectedValue ??
              row.checklistItem?.expectedValue ??
              '-',
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
        ]}
      />
    </SectionCard>
  )
}
