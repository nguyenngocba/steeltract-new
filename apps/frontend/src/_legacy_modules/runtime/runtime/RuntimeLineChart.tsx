import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

const data = [

  { day: 'Mon', value: 82 },
  { day: 'Tue', value: 86 },
  { day: 'Wed', value: 91 },
  { day: 'Thu', value: 88 },
  { day: 'Fri', value: 95 },
  { day: 'Sat', value: 92 },
]

export function RuntimeLineChart() {

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">

      <div className="mb-6 flex items-center justify-between">

        <div>

          <div className="text-xl font-bold text-white">
            Production Efficiency
          </div>

          <div className="mt-1 text-xs text-zinc-500">
            Runtime Analytics
          </div>

        </div>

        <div className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-400">
          LIVE KPI
        </div>

      </div>

      <div className="h-[300px]">

        <ResponsiveContainer width="100%" height="100%">

          <LineChart data={data}>

            <CartesianGrid stroke="#27272a" />

            <XAxis
              dataKey="day"
              stroke="#71717a"
            />

            <YAxis
              stroke="#71717a"
            />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="value"
              stroke="#22d3ee"
              strokeWidth={3}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

    </div>
  )
}
