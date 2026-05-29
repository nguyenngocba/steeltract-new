const metrics = [
  {
    label: 'Cognitive Signals',
    value: 884,
  },

  {
    label: 'Unified Runtimes',
    value: 28,
  },

  {
    label: 'AI Cognition',
    value: 'ACTIVE',
  },

  {
    label: 'Industrial Brain',
    value: 'ONLINE',
  },
]

export function GlobalCognitionGrid() {
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
