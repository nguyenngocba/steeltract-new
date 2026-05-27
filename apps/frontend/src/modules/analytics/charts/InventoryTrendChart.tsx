import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

import {
  inventoryTrend,
} from '../mock-data/analytics.data'

export function InventoryTrendChart() {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

      <div className="mb-5">

        <h2 className="text-xl font-bold text-white">
          Inventory Trend
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Warehouse movement analytics
        </p>

      </div>

      <div className="h-[320px]">

        <ResponsiveContainer width="100%" height="100%">

          <LineChart data={inventoryTrend}>

            <CartesianGrid stroke="#27272a" />

            <XAxis
              dataKey="month"
              stroke="#71717a"
            />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="value"
              stroke="#38bdf8"
              strokeWidth={4}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

    </div>
  )
}
