import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

import { useProductionOrders } from '@/modules/production/hooks/useProductionCockpit'

export function ProductionChart() {
  const { data: orders = [] } =
    useProductionOrders()
  const productionTrend =
    Object.entries(
      orders.reduce<Record<string, number>>((acc, order) => {
        const label =
          order.status
        acc[label] =
          (acc[label] ?? 0) + 1

        return acc
      }, {}),
    ).map(([month, value]) => ({
      month,
      value,
    }))

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
