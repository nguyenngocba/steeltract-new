import {
  LineChart as RechartsLineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  Tooltip,
} from 'recharts'

const data = [
  { time: '08:00', value: 24 },
  { time: '09:00', value: 42 },
  { time: '10:00', value: 38 },
  { time: '11:00', value: 61 },
  { time: '12:00', value: 55 },
]

export function LineChart() {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">

      <h3 className="mb-4 text-lg font-semibold text-white">
        Luồng vật tư realtime
      </h3>

      <div className="h-[260px]">

        <ResponsiveContainer width="100%" height="100%">

          <RechartsLineChart data={data}>

            <XAxis
              dataKey="time"
              stroke="#71717a"
            />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="value"
              stroke="#38bdf8"
              strokeWidth={3}
            />

          </RechartsLineChart>

        </ResponsiveContainer>

      </div>

    </div>
  )
}
