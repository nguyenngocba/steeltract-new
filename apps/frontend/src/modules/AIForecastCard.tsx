const predictions = [

  'Inventory shortage predicted in Warehouse B',

  'Production efficiency may increase tomorrow',

  'Fleet congestion risk detected',

  'QC rejection trend slightly increased',
]

export function AIForecastCard() {

  return (
    <div className="rounded-3xl border border-violet-500/20 bg-zinc-950 p-6">

      <div className="mb-6 flex items-center justify-between">

        <div>

          <div className="text-xl font-bold text-white">
            AI Forecast Engine
          </div>

          <div className="mt-1 text-xs text-zinc-500">
            Enterprise predictive runtime
          </div>

        </div>

        <div className="rounded-full bg-violet-500/10 px-3 py-1 text-xs text-violet-400">
          PREDICTIVE AI
        </div>

      </div>

      <div className="space-y-4">

        {predictions.map((item) => (

          <div
            key={item}
            className="rounded-2xl border border-zinc-800 bg-black p-4"
          >

            <div className="text-sm text-white">
              {item}
            </div>

          </div>

        ))}

      </div>

    </div>
  )
}
