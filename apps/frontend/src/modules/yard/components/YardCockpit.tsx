const metrics = [
  {
    label: 'Occupied Slots',
    value: 184,
  },

  {
    label: 'Dispatch Today',
    value: 28,
  },

  {
    label: 'Trucks Active',
    value: 12,
  },

  {
    label: 'Crane Runtime',
    value: '94%',
  },
]

export function YardCockpit() {
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
