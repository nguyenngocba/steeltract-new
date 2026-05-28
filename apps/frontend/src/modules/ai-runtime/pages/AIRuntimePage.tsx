const insights = [

  {
    title:
      'Inventory Forecast',

    description:
      'Steel plate inventory may run low in 4 days',

    type:
      'warning',
  },

  {
    title:
      'Production Optimization',

    description:
      'Laser CNC runtime can improve by 12%',

    type:
      'info',
  },

  {
    title:
      'Shipment Prediction',

    description:
      '2 trucks may be delayed due to congestion',

    type:
      'warning',
  },

  {
    title:
      'QC AI Detection',

    description:
      'Possible welding defect trend detected',

    type:
      'error',
  },
]

export function AIRuntimePage() {

  return (
    <div className="space-y-6 bg-black p-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">

        <div>

          <div className="text-sm uppercase tracking-[0.35em] text-violet-400">
            Enterprise AI Runtime
          </div>

          <h1 className="mt-3 text-5xl font-black text-white">
            AI COMMAND CENTER
          </h1>

        </div>

        <div className="rounded-3xl border border-violet-500/20 bg-violet-500/10 px-6 py-5">

          <div className="text-xs uppercase tracking-[0.3em] text-violet-400">
            AI Runtime
          </div>

          <div className="mt-2 text-2xl font-black text-violet-400">
            ACTIVE
          </div>

        </div>

      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-6">

        {[
          {
            title: 'AI Models',
            value: '12',
            color: 'text-violet-400',
          },

          {
            title: 'Predictions',
            value: '842',
            color: 'text-cyan-400',
          },

          {
            title: 'OCR Runtime',
            value: 'LIVE',
            color: 'text-orange-400',
          },

          {
            title: 'Forecast',
            value: '93%',
            color: 'text-emerald-400',
          },
        ].map((item) => (

          <div
            key={item.title}
            className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
          >

            <div className="text-sm text-zinc-500">
              {item.title}
            </div>

            <div className={`mt-4 text-5xl font-black ${item.color}`}>
              {item.value}
            </div>

          </div>

        ))}

      </div>

      {/* AI INSIGHTS */}
      <div className="grid grid-cols-2 gap-6">

        {insights.map((item) => (

          <div
            key={item.title}
            className={`rounded-3xl border p-6 ${
              item.type === 'error'

                ? 'border-red-500/20 bg-red-500/5'

                : item.type === 'warning'

                ? 'border-orange-500/20 bg-orange-500/5'

                : 'border-violet-500/20 bg-violet-500/5'
            }`}
          >

            <div className="text-xl font-bold text-white">
              {item.title}
            </div>

            <div className="mt-4 text-sm text-zinc-400">
              {item.description}
            </div>

          </div>

        ))}

      </div>

    </div>
  )
}
