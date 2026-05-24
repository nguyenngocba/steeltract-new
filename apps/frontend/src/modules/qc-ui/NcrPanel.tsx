import {
  DataTable,
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'
import { qcStatusTone } from './qc-utils'

import type {
  NonConformanceReport,
} from './qc.types'

interface NcrPanelProps {
  ncrs: NonConformanceReport[]
}

export function NcrPanel({
  ncrs,
}: NcrPanelProps) {
  return (
    <SectionCard title="Non-conformance reports">
      <DataTable
        data={ncrs}
        rowKey={(row) => row.id}
        empty="No NCR records"
        columns={[
          {
            key: 'ncr',
            header: 'NCR',
            render: (row) => (
              <div>
                <p className="font-medium">
                  {row.ncrNo}
                </p>
                <p className="text-xs text-zinc-500">
                  {row.title}
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
            key: 'disposition',
            header: 'Disposition',
            render: (row) =>
              row.disposition ?? '-',
          },
        ]}
      />
    </SectionCard>
  )
}
