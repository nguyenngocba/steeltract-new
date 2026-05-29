const metrics = [
  {
    label: 'AI Runtime',
    value: 'ONLINE',
  },

  {
    label: 'Operational Insights',
    value: 284,
  },

  {
    label: 'Realtime Analysis',
    value: 'ACTIVE',
  },

  {
    label: 'Prediction Engine',
    value: 'READY',
  },
]

export function RuntimeAssistantStatus() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="
            rounded-2xl
            border
            border-fuchsia-500/20
            bg-zinc-900
            p-5
          "
        >
          <div className="text-sm text-zinc-500">
            {metric.label}
          </div>

          <div className="mt-4 text-2xl font-black text-white">
            {metric.value}
          </div>
        </div>
      ))}
    </div>
  )
}
