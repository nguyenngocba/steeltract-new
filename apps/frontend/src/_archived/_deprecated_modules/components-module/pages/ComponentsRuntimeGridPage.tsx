import {
  EnterpriseDataGrid,
} from '../../../shared/runtime/EnterpriseDataGrid'

const data = Array.from({
  length: 80,
}).map((_, index) => ({

  component:
    `COMP-${1000 + index}`,

  drawing:
    `DWG-${2000 + index}`,

  phase:
    index % 2 === 0

      ? 'WELDING'

      : 'PAINTING',

  progress:
    `${60 + index % 40}%`,

  status:
    'ACTIVE',
}))

export function ComponentsRuntimeGridPage() {

  return (
    <div className="bg-black p-6">

      <EnterpriseDataGrid

        title="Components Runtime"

        data={data}

        columns={[

          {
            key: 'component',
            label: 'Component',
          },

          {
            key: 'drawing',
            label: 'Drawing',
          },

          {
            key: 'phase',
            label: 'Phase',
          },

          {
            key: 'progress',
            label: 'Progress',
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
