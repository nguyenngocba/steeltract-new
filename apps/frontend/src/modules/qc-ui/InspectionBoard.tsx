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
