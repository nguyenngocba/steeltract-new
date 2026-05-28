import {
  DataTable,
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'
import {
  statusTone,
} from './yard-utils'

import type {
  YardSnapshot,
} from './yard.types'

interface YardSnapshotViewerProps {
  snapshots: YardSnapshot[]
}

export function YardSnapshotViewer({
  snapshots,
}: YardSnapshotViewerProps) {
  return (
    <SectionCard title="Yard snapshots">
      <DataTable
        data={snapshots}
        rowKey={(row) => row.id}
        empty="No snapshots generated"
        columns={[
          {
            key: 'name',
            header: 'Snapshot',
            render: (row) => (
              <div>
                <p className="font-medium">
                  {row.name}
                </p>
                <p className="text-xs text-zinc-500">
                  {new Date(
                    row.createdAt,
                  ).toLocaleString()}
                </p>
              </div>
            ),
          },
          {
            key: 'slots',
            header: 'Slots',
            render: (row) =>
              `${row.occupiedSlots}/${row.totalSlots}`,
          },
          {
            key: 'occupancy',
            header: 'Occupancy',
            render: (row) => (
              <StatusBadge
                tone={statusTone(
                  row.occupancyRate > 85
                    ? 'HIGH'
                    : 'NORMAL',
                )}
              >
                {`${row.occupancyRate}%`}
              </StatusBadge>
            ),
          },
        ]}
      />
    </SectionCard>
  )
}
