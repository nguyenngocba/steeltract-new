export function InventoryDashboardTab() {

  return (
    <div className="space-y-6">

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4">

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Total Materials
          </p>

          <h2 className="mt-4 text-5xl font-bold text-cyan-400">
            2,842
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Low Stock
          </p>

          <h2 className="mt-4 text-5xl font-bold text-red-400">
            18
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Inbound Today
          </p>

          <h2 className="mt-4 text-5xl font-bold text-emerald-400">
            124
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Outbound Today
          </p>

          <h2 className="mt-4 text-5xl font-bold text-orange-400">
            87
          </h2>
        </div>

      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-3 gap-6">

        <div className="col-span-2 rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-xl font-bold text-white">
            Inventory Movement
          </h2>

          <div className="mt-5 h-[320px] rounded-2xl bg-zinc-950" />
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-xl font-bold text-white">
            Low Stock Alerts
          </h2>

          <div className="mt-5 space-y-3">

            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-zinc-950 p-4"
              >
                <p className="text-sm font-medium text-white">
                  VT-00{i + 1}
                </p>

                <p className="mt-1 text-xs text-red-400">
                  Quantity below threshold
                </p>
              </div>
            ))}

          </div>
        </div>

      </div>

    </div>
  )
}
