const metrics = [

  {
    label:
      'CPU',

    value:
      '28%',
  },

  {
    label:
      'RAM',

    value:
      '4.2GB',
  },

  {
    label:
      'Websocket',

    value:
      '42',
  },

  {
    label:
      'Requests',

    value:
      '128/s',
  },
]

export function RuntimePerformanceCard() {

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">

      <div className="mb-6 flex items-center justify-between">

        <div>

          <div className="text-xl font-bold text-white">
            Runtime Performance
          </div>

          <div className="mt-1 text-xs text-zinc-500">
            Enterprise metrics
          </div>

        </div>

        <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
          OPTIMIZED
        </div>

      </div>

      <div className="grid grid-cols-2 gap-4">

        {metrics.map((item) => (

          <div
            key={item.label}
            className="rounded-2xl border border-zinc-800 bg-black p-5"
          >

            <div className="text-xs text-zinc-500">
              {item.label}
            </div>

            <div className="mt-3 text-3xl font-black text-cyan-400">
              {item.value}
            </div>

          </div>

        ))}

      </div>

    </div>
  )
}
