import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const data = [
  {
    day: 'Mon',
    quantity: 120,
  },
  {
    day: 'Tue',
    quantity: 210,
  },
  {
    day: 'Wed',
    quantity: 180,
  },
  {
    day: 'Thu',
    quantity: 340,
  },
  {
    day: 'Fri',
    quantity: 280,
  },
]

export function InventoryTelemetryChart() {
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
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-400">
          Inventory Telemetry
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Inventory movement analytics
        </div>
      </div>

      <div className="mt-6 h-[320px]">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <AreaChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
            />

            <XAxis dataKey="day" />

            <YAxis />

            <Tooltip />

            <Area
              type="monotone"
              dataKey="quantity"
              stroke="#06b6d4"
              fill="#06b6d4"
              fillOpacity={0.15}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
