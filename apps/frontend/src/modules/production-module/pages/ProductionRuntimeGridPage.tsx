import {
  EnterpriseDataGrid,
} from '../../../shared/runtime/EnterpriseDataGrid'

const data = Array.from({
  length: 70,
}).map((_, index) => ({

  workorder:
    `WO-${5000 + index}`,

  machine:
    `CNC-${index % 8}`,

  operator:
    `OP-${index % 20}`,

  efficiency:
    `${80 + index % 20}%`,

  status:
    'RUNNING',
}))

export function ProductionRuntimeGridPage() {

  return (
    <div className="bg-black p-6">

      <EnterpriseDataGrid

        title="Production Runtime"

        data={data}

        columns={[

          {
            key: 'workorder',
            label: 'Work Order',
          },

          {
            key: 'machine',
            label: 'Machine',
          },

          {
            key: 'operator',
            label: 'Operator',
          },

          {
            key: 'efficiency',
            label: 'Efficiency',
          },

          {
            key: 'status',
            label: 'Status',
          },
        ]}
      />

    </div>
  )
}
