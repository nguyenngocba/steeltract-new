import {
  EnterpriseDataGrid,
} from '../../../shared/runtime/EnterpriseDataGrid'

const data = Array.from({
  length: 120,
}).map((_, index) => ({

  code:
    `MAT-${4000 + index}`,

  material:
    'Steel Plate',

  quantity:
    Math.floor(
      Math.random() * 500,
    ),

  location:
    'Warehouse A',

  status:
    index % 3 === 0

      ? 'LOW'

      : 'AVAILABLE',
}))

export function InventoryRuntimeGridPage() {

  return (
    <div className="bg-black p-6">

      <EnterpriseDataGrid

        title="Inventory Runtime"

        data={data}

        columns={[

          {
            key: 'code',
            label: 'Code',
          },

          {
            key: 'material',
            label: 'Material',
          },

          {
            key: 'quantity',
            label: 'Quantity',
          },

          {
            key: 'location',
            label: 'Location',
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
