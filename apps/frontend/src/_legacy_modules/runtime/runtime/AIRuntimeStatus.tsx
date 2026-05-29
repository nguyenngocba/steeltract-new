const models = [

  'Forecast AI',

  'OCR AI',

  'QC Detection AI',

  'Logistics AI',
]

export function AIRuntimeStatus() {

  return (
    <div className="rounded-3xl border border-violet-500/20 bg-zinc-950 p-6">

      <div className="mb-6 flex items-center justify-between">

        <div>

          <div className="text-xl font-bold text-white">
            AI Runtime Status
          </div>

          <div className="mt-1 text-xs text-zinc-500">
            Enterprise AI Runtime
          </div>

        </div>

        <div className="rounded-full bg-violet-500/10 px-3 py-1 text-xs text-violet-400">
          AI ONLINE
        </div>

      </div>

      <div className="space-y-4">

        {models.map((item) => (

          <div
            key={item}
            className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black px-4 py-4"
          >

            <div className="text-sm text-white">
              {item}
            </div>

            <div className="flex items-center gap-2">

              <div className="h-2 w-2 rounded-full bg-emerald-400" />

              <div className="text-xs text-emerald-400">
                ACTIVE
              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  )
}
