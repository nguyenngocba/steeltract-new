import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

import {
  productionTrend,
} from '../mock-data/analytics.data'

export function ProductionChart() {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

      <div className="mb-5">

        <h2 className="text-xl font-bold text-white">
          Production Analytics
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Fabrication output monitoring
        </p>

      </div>

      <div className="h-[320px]">

        <ResponsiveContainer width="100%" height="100%">

          <BarChart data={productionTrend}>

            <CartesianGrid stroke="#27272a" />

            <XAxis
              dataKey="month"
              stroke="#71717a"
            />

            <Tooltip />

            <Bar
              dataKey="value"
              fill="#22c55e"
              radius={[8,8,0,0]}
            />

          </BarChart>

        </ResponsiveContainer>

      </div>

    </div>
  )
}
