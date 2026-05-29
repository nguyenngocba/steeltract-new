import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const data = [
  {
    warehouse: 'WH-A',
    stock: 248,
  },

  {
    warehouse: 'WH-B',
    stock: 124,
  },

  {
    warehouse: 'WH-C',
    stock: 48,
  },

  {
    warehouse: 'YARD-A',
    stock: 88,
  },
]

export function InventoryTelemetry() {
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
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-400">
            Warehouse Telemetry
          </div>

          <div className="mt-2 text-sm text-zinc-500">
            Stock distribution overview
          </div>
        </div>

        <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
          LIVE
        </div>
      </div>

      <div className="mt-6 h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />

            <XAxis
              dataKey="warehouse"
              stroke="#71717a"
            />

            <YAxis stroke="#71717a" />

            <Tooltip />

            <Bar
              dataKey="stock"
              fill="#06b6d4"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
