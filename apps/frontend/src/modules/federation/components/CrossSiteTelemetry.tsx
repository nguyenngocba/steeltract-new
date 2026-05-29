const metrics = [
  {
    label: 'Connected Plants',
    value: 6,
  },

  {
    label: 'Realtime Federation Nodes',
    value: 284,
  },

  {
    label: 'Global Throughput',
    value: '8,422T',
  },

  {
    label: 'Enterprise Health',
    value: '99.8%',
  },
]

export function CrossSiteTelemetry() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-900
            p-5
          "
        >
          <div className="text-sm text-zinc-500">
            {metric.label}
          </div>

          <div className="mt-4 text-3xl font-black text-white">
            {metric.value}
          </div>
        </div>
      ))}
    </div>
  )
}
