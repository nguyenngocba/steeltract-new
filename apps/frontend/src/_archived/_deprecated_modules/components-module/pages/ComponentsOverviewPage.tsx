const stats = [

  {
    title:
      'Total Components',

    value:
      '12,480',

    color:
      'text-cyan-400',
  },

  {
    title:
      'In Fabrication',

    value:
      '1,245',

    color:
      'text-orange-400',
  },

  {
    title:
      'Ready Shipping',

    value:
      '846',

    color:
      'text-emerald-400',
  },

  {
    title:
      'QC Pending',

    value:
      '132',

    color:
      'text-red-400',
  },
]

export function ComponentsOverviewPage() {

  return (
    <div className="space-y-6">

      {/* KPI */}
      <div className="grid grid-cols-4 gap-6">

        {stats.map(
          (item) => (

            <div
              key={item.title}
              className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6"
            >

              <div className="text-sm text-zinc-500">
                {item.title}
              </div>

              <div className={`mt-3 text-4xl font-black ${item.color}`}>

                {item.value}

              </div>

            </div>

          ),
        )}

      </div>

      {/* GRID */}
      <div className="grid grid-cols-[1fr_420px] gap-6">

        {/* LIVE TABLE */}
        <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">

          <div className="border-b border-zinc-800 px-6 py-5">

            <h2 className="text-xl font-bold text-white">
              Live Component Runtime
            </h2>

          </div>

          <div className="overflow-auto">

            <table className="w-full">

              <thead className="bg-zinc-950">

                <tr>

                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                    Component
                  </th>

                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                    Project
                  </th>

                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                    Status
                  </th>

                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                    Progress
                  </th>

                </tr>

              </thead>

              <tbody>

                {Array.from({
                  length: 12,
                }).map((_, index) => (

                  <tr
                    key={index}
                    className="border-t border-zinc-800"
                  >

                    <td className="px-4 py-4 text-cyan-400">
                      CMP-{1000 + index}
                    </td>

                    <td className="px-4 py-4 text-white">
                      FACTORY A
                    </td>

                    <td className="px-4 py-4">

                      <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs text-orange-400">

                        FABRICATION

                      </span>

                    </td>

                    <td className="px-4 py-4">

                      <div className="flex items-center gap-3">

                        <div className="h-2 flex-1 rounded-full bg-zinc-800">

                          <div
                            className="h-2 rounded-full bg-cyan-500"
                            style={{
                              width:
                                `${40 + index * 4}%`,
                            }}
                          />

                        </div>

                        <div className="text-xs text-zinc-400">
                          {40 + index * 4}%
                        </div>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

        {/* TELEMETRY */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

          <h2 className="mb-6 text-xl font-bold text-white">
            Factory Telemetry
          </h2>

          <div className="space-y-4">

            {[
              'Laser CNC Active',
              'Welding Line Running',
              'Painting Booth Stable',
              'Assembly Runtime Active',
              'Shipment Queue Ready',
            ].map((item) => (

              <div
                key={item}
                className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4"
              >

                <div className="text-sm text-white">
                  {item}
                </div>

                <div className="flex items-center gap-2">

                  <div className="h-2 w-2 rounded-full bg-emerald-400" />

                  <div className="text-xs text-emerald-400">
                    ONLINE
                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>

    </div>
  )
}
