const forecasts = [
  {
    title: 'Steel Consumption Forecast',
    value: '+14%',
  },

  {
    title: 'Production Load Forecast',
    value: '+22%',
  },

  {
    title: 'Truck Dispatch Forecast',
    value: '+8%',
  },

  {
    title: 'Inventory Replenishment',
    value: '3 DAYS',
  },
]

export function ForecastPanel() {
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
        <div className="text-xs uppercase tracking-[0.2em] text-pink-400">
          Forecast Runtime
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Predictive operational intelligence
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {forecasts.map((forecast) => (
          <div
            key={forecast.title}
            className="
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div className="text-sm text-zinc-500">
              {forecast.title}
            </div>

            <div className="mt-2 text-2xl font-black text-white">
              {forecast.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
