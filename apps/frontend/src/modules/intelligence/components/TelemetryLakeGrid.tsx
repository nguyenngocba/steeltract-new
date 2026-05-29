const metrics = [
  {
    label: 'Telemetry Events',
    value: '14.8M',
  },

  {
    label: 'Realtime Streams',
    value: 482,
  },

  {
    label: 'Historical Replay',
    value: 'ACTIVE',
  },

  {
    label: 'AI Training Data',
    value: 'READY',
  },
]

export function TelemetryLakeGrid() {
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
