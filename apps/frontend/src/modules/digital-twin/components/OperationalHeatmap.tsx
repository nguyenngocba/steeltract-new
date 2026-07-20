import { useQuery } from '@tanstack/react-query'

import { productionApi } from '@/modules/production/api/production.api'
import { yardApi } from '@/modules/yard/services/api/yard.api'

const cellCount = 48

function getColor(value: number) {
  if (value > 80) {
    return 'bg-red-500'
  }

  if (value > 50) {
    return 'bg-orange-500'
  }

  if (value > 25) {
    return 'bg-cyan-500'
  }

  return 'bg-zinc-800'
}

export function OperationalHeatmap() {
  const { data: machines = [] } =
    useQuery({
      queryKey: ['digital-twin', 'heatmap-machines'],
      queryFn: productionApi.machines,
      refetchInterval: 5000,
    })
  const { data: yardMetrics } =
    useQuery({
      queryKey: ['digital-twin', 'heatmap-yard'],
      queryFn: yardApi.metrics,
      refetchInterval: 5000,
    })
  const values = [
    ...machines.map((machine) => machine.utilization),
    ...(yardMetrics?.zoneUtilization.map((zone) => zone.occupancyRate) ?? []),
  ]
  const cells =
    Array.from({ length: cellCount }, (_, index) =>
      values.length
        ? Math.round(values[index % values.length])
        : 0,
    )

  return (
    <div
      className="
        rounded-2xl
        border
        border-zinc-800
        bg-zinc-900
        p-6
      "
    >
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-indigo-400">
          Operational Heatmap
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Cường độ vận hành
        </div>
      </div>

      <div
        className="
          mt-8
          grid
          grid-cols-24
          gap-1
        "
      >
        {cells.map((value, index) => (
          <div
            key={index}
            className={`
              aspect-square
              rounded
              ${getColor(value)}
            `}
          />
        ))}
      </div>
    </div>
  )
}
