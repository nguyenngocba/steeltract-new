export function ComponentsDashboardTab() {

  return (
    <div className="space-y-6">

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4">

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Total Components
          </p>

          <h2 className="mt-4 text-5xl font-bold text-cyan-400">
            12,842
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Fabricating
          </p>

          <h2 className="mt-4 text-5xl font-bold text-orange-400">
            1,248
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            QC Pending
          </p>

          <h2 className="mt-4 text-5xl font-bold text-red-400">
            84
          </h2>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Completed
          </p>

          <h2 className="mt-4 text-5xl font-bold text-emerald-400">
            9,812
          </h2>
        </div>

      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-3 gap-6">

        <div className="col-span-2 rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-xl font-bold text-white">
            Fabrication Runtime
          </h2>

          <div className="mt-5 h-[320px] rounded-2xl bg-zinc-950" />
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-xl font-bold text-white">
            Production Status
          </h2>

          <div className="mt-5 space-y-3">

            {[
              'Cutting',
              'Welding',
              'Painting',
              'Assembly',
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl bg-zinc-950 p-4"
              >
                <p className="text-sm font-medium text-white">
                  {item}
                </p>

                <div className="mt-3 h-2 rounded-full bg-zinc-800">
                  <div className="h-2 w-2/3 rounded-full bg-cyan-500" />
                </div>
              </div>
            ))}

          </div>
        </div>

      </div>

    </div>
  )
}
