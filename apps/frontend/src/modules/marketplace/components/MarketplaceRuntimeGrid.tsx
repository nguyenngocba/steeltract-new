const metrics = [
  {
    label: 'Installed Plugins',
    value: 28,
  },

  {
    label: 'Runtime Extensions',
    value: 14,
  },

  {
    label: 'Marketplace Status',
    value: 'ONLINE',
  },

  {
    label: 'Dynamic Modules',
    value: 'ACTIVE',
  },
]

export function MarketplaceRuntimeGrid() {
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
