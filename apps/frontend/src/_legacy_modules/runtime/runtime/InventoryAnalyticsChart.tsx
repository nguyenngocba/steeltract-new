import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from 'recharts'

const data = [

  {
    name: 'Steel',
    value: 420,
  },

  {
    name: 'Bolt',
    value: 310,
  },

  {
    name: 'Plate',
    value: 510,
  },

  {
    name: 'Pipe',
    value: 280,
  },

  {
    name: 'Paint',
    value: 190,
  },
]

export function InventoryAnalyticsChart() {

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">

      <div className="mb-6 flex items-center justify-between">

        <div>

          <div className="text-xl font-bold text-white">
            Inventory Analytics
          </div>

          <div className="mt-1 text-xs text-zinc-500">
            Warehouse Runtime
          </div>

        </div>

        <div className="rounded-full bg-orange-500/10 px-3 py-1 text-xs text-orange-400">
          STOCK
        </div>

      </div>

      <div className="h-[300px]">

        <ResponsiveContainer width="100%" height="100%">

          <BarChart data={data}>

            <CartesianGrid stroke="#27272a" />

            <XAxis
              dataKey="name"
              stroke="#71717a"
            />

            <YAxis
              stroke="#71717a"
            />

            <Tooltip />

            <Bar
              dataKey="value"
              fill="#f97316"
              radius={[8, 8, 0, 0]}
            />

          </BarChart>

        </ResponsiveContainer>

      </div>

    </div>
  )
}
