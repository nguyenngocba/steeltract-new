import { useQuery }
  from '@tanstack/react-query'

import axios from 'axios'

export function RealtimeTelemetryPanel() {
  const {
    data = [],
  } = useQuery({
    queryKey: [
      'telemetry',
    ],

    queryFn: async () => {
      const response =
        await axios.get(
          'http://172.168.53.116:3000/telemetry',
        )

      return response.data
    },

    refetchInterval: 2000,
  })

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
        <div className="text-xs uppercase tracking-[0.2em] text-emerald-400">
          Runtime Telemetry
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Live runtime metrics & industrial observability
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {data.map((metric: any) => (
          <div
            key={metric.id}
            className="
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div className="text-sm text-emerald-300">
              {metric.metric}
            </div>

            <div className="mt-2 text-2xl font-black text-white">
              {metric.value}
            </div>

            <div className="mt-2 text-xs text-zinc-500">
              {metric.timestamp}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
