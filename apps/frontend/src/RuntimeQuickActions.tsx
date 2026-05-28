const actions = [

  'Create Inventory',
  'Create Shipment',
  'Create QC',
  'Create Production Order',
  'Open Digital Twin',
  'Open Analytics',
]

export function RuntimeQuickActions() {

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">

      <div className="mb-6 flex items-center justify-between">

        <div>

          <div className="text-xl font-bold text-white">
            Quick Actions
          </div>

          <div className="mt-1 text-xs text-zinc-500">
            Enterprise shortcuts
          </div>

        </div>

        <div className="rounded-full bg-violet-500/10 px-3 py-1 text-xs text-violet-400">
          FAST ACCESS
        </div>

      </div>

      <div className="grid grid-cols-2 gap-4">

        {actions.map((item) => (

          <button
            key={item}
            className="rounded-2xl border border-zinc-800 bg-black px-5 py-4 text-left transition hover:border-cyan-500/30 hover:bg-cyan-500/5"
          >

            <div className="text-sm font-semibold text-white">
              {item}
            </div>

          </button>

        ))}

      </div>

    </div>
  )
}
