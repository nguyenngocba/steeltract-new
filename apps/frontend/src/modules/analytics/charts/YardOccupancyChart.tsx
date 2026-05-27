import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts'

import {
  yardOccupancy,
} from '../mock-data/analytics.data'

const colors = [
  '#38bdf8',
  '#22c55e',
  '#f97316',
  '#ef4444',
  '#a855f7',
]

export function YardOccupancyChart() {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

      <div className="mb-5">

        <h2 className="text-xl font-bold text-white">
          Yard Occupancy
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Zone utilization analytics
        </p>

      </div>

      <div className="h-[320px]">

        <ResponsiveContainer width="100%" height="100%">

          <PieChart>

            <Pie
              data={yardOccupancy}
              dataKey="value"
              nameKey="zone"
              outerRadius={120}
            >

              {yardOccupancy.map((_, index) => (
                <Cell
                  key={index}
                  fill={colors[index]}
                />
              ))}

            </Pie>

            <Tooltip />

          </PieChart>

        </ResponsiveContainer>

      </div>

    </div>
  )
}
