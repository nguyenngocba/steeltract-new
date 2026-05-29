import { useInventoryMetrics } from '../hooks/useInventoryMetrics'

export function InventoryKpiGrid() {
  const {
    metrics,
  } = useInventoryMetrics()

  const cards = [
    {
      label: 'Inventory Items',
      value: metrics.totalItems,
    },

    {
      label: 'Low Stock',
      value: metrics.lowStock,
    },

    {
      label: 'Critical',
      value: metrics.critical,
    },

    {
      label: 'Total Quantity',
      value: metrics.totalQuantity,
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-900
            p-5
          "
        >
          <div className="text-sm text-zinc-500">
            {card.label}
          </div>

          <div className="mt-4 text-3xl font-black text-white">
            {card.value}
          </div>
        </div>
      ))}
    </div>
  )
}
