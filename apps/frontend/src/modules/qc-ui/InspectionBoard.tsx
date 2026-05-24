import {
  DataTable,
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'
import { qcStatusTone } from './qc-utils'

import type {
  QcInspection,
} from './qc.types'

interface InspectionBoardProps {
  inspections: QcInspection[]
  loading?: boolean
}

export function InspectionBoard({
  inspections,
  loading,
}: InspectionBoardProps) {
  return (
    <SectionCard title="Inspection board">
      <DataTable
        data={inspections}
        loading={loading}
        rowKey={(row) => row.id}
        empty="No QC inspections"
        density="compact"
        selectable
        savedViewName="Inspection queue"
        statusTone={(row) => qcStatusTone(row.status)}
        highlightedRowIds={inspections
          .filter((row) =>
            [
              'FAILED',
              'REWORK_REQUIRED',
              'REJECTED',
            ].includes(row.status),
          )
          .map((row) => row.id)}
        bulkActions={
          <>
            <button className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
              Approve
            </button>
            <button className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
              Escalate
            </button>
          </>
        }
        rowActions={(row) => (
          <button className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
            {row.status === 'READY'
              ? 'Start'
              : row.status === 'IN_PROGRESS'
                ? 'Review'
                : 'Open'}
          </button>
        )}
        contextMenu={(row) => (
          <div className="grid gap-1 text-left text-xs text-zinc-300">
            <button className="rounded px-2 py-1 text-left hover:bg-zinc-900">
              Evidence preview
            </button>
            <button className="rounded px-2 py-1 text-left hover:bg-zinc-900">
              Create NCR
            </button>
            <button className="rounded px-2 py-1 text-left hover:bg-zinc-900">
              Trace {row.inspectionNo}
            </button>
          </div>
        )}
        columns={[
          {
            key: 'inspection',
            header: 'Inspection',
            render: (row) => (
              <div>
                <p className="font-medium">
                  {row.inspectionNo}
                </p>
                <p className="text-xs text-zinc-500">
                  {row.componentId ??
                    row.productionOrderId ??
                    'unassigned'}
                </p>
              </div>
            ),
          },
          {
            key: 'checklist',
            header: 'Checklist',
            render: (row) =>
              row.checklist?.name ?? 'No checklist',
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
            key: 'issues',
            header: 'Issues',
            align: 'right',
            render: (row) =>
              row.issues?.length ?? 0,
          },
        ]}
      />
    </SectionCard>
  )
}
