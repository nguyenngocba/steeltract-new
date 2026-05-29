const kpis = [
  {
    title: 'Production Throughput',
    value: '+18%',
    trend: 'UP',
  },

  {
    title: 'QC Failure Rate',
    value: '-4%',
    trend: 'DOWN',
  },

  {
    title: 'Dispatch Speed',
    value: '+12%',
    trend: 'UP',
  },

  {
    title: 'Supplier Delay',
    value: '-7%',
    trend: 'DOWN',
  },
]

function getColor(trend: string) {
  return trend === 'UP'
    ? 'text-emerald-400'
    : 'text-red-400'
}

export function KpiRuntimeGrid() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.title}
          className="
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-900
            p-5
          "
        >
          <div className="text-sm text-zinc-500">
            {kpi.title}
          </div>

          <div
            className={`
              mt-4
              text-3xl
              font-black
              ${getColor(kpi.trend)}
            `}
          >
            {kpi.value}
          </div>
        </div>
      ))}
    </div>
  )
}
