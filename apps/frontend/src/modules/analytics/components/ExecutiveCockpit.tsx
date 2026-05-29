const metrics = [
  {
    label: 'Operational Efficiency',
    value: '92%',
  },

  {
    label: 'Production Output',
    value: '1,284T',
  },

  {
    label: 'Inventory Accuracy',
    value: '99.2%',
  },

  {
    label: 'On-Time Delivery',
    value: '96%',
  },
]

export function ExecutiveCockpit() {
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
