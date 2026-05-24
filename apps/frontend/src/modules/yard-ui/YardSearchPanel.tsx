import {
  DataTable,
  SearchInput,
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'
import {
  statusTone,
} from './yard-utils'

import type {
  YardItemPlacement,
} from './yard.types'

interface YardSearchPanelProps {
  value?: string
  onChange?: (value: string) => void
  results: YardItemPlacement[]
  loading?: boolean
}

export function YardSearchPanel({
  value,
  onChange,
  results,
  loading,
}: YardSearchPanelProps) {
  return (
    <SectionCard
      title="Yard search"
      actions={
        <SearchInput
          value={value ?? ''}
          onChange={(nextValue) => onChange?.(nextValue)}
          placeholder="Search code, material, component"
        />
      }
    >
      <DataTable
        data={results}
        loading={loading}
        rowKey={(row) => row.id}
        empty="No matching yard items"
        columns={[
          {
            key: 'item',
            header: 'Item',
            render: (row) => (
              <div>
                <p className="font-medium">
                  {row.itemCode}
                </p>
                <p className="text-xs text-zinc-500">
                  {row.itemName ??
                    row.itemId}
                </p>
              </div>
            ),
          },
          {
            key: 'type',
            header: 'Type',
            render: (row) => (
              <StatusBadge tone="info">
                {row.itemType}
              </StatusBadge>
            ),
          },
          {
            key: 'slot',
            header: 'Slot',
            render: (row) =>
              row.slot?.code ?? row.slotId,
          },
          {
            key: 'status',
            header: 'Status',
            render: (row) => (
              <StatusBadge
                tone={statusTone(
                  row.removedAt
                    ? 'REMOVED'
                    : 'OCCUPIED',
                )}
              >
                {row.removedAt
                  ? 'REMOVED'
                  : 'OCCUPIED'}
              </StatusBadge>
            ),
          },
        ]}
      />
    </SectionCard>
  )
}
