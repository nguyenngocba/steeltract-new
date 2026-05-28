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
        density="compact"
        selectable
        savedViewName="NCR escalation"
        statusTone={(row) =>
          row.severity === 'CRITICAL'
            ? 'danger'
            : qcStatusTone(row.status)
        }
        highlightedRowIds={ncrs
          .filter((row) =>
            ['HIGH', 'CRITICAL'].includes(
              row.severity,
            ),
          )
          .map((row) => row.id)}
        rowActions={(row) => (
          <button className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
            {row.status === 'OPEN'
              ? 'Review'
              : 'Open'}
          </button>
        )}
        contextMenu={(row) => (
          <div className="grid gap-1 text-left text-xs text-zinc-300">
            <button className="rounded px-2 py-1 text-left hover:bg-zinc-900">
              Escalate NCR
            </button>
            <button className="rounded px-2 py-1 text-left hover:bg-zinc-900">
              Assign corrective action
            </button>
            <button className="rounded px-2 py-1 text-left hover:bg-zinc-900">
              Trace {row.ncrNo}
            </button>
          </div>
        )}
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
