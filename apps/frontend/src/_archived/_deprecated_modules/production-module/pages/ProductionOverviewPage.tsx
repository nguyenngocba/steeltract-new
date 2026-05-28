const stats = [

  {
    title:
      'Production Orders',

    value:
      '248',

    color:
      'text-orange-400',
  },

  {
    title:
      'Running Machines',

    value:
      '42',

    color:
      'text-cyan-400',
  },

  {
    title:
      'Operators Online',

    value:
      '126',

    color:
      'text-emerald-400',
  },

  {
    title:
      'Production Efficiency',

    value:
      '93%',

    color:
      'text-violet-400',
  },
]

export function ProductionOverviewPage() {

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

        {/* ORDERS */}
        <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">

          <div className="border-b border-zinc-800 px-6 py-5">

            <h2 className="text-xl font-bold text-white">
              Production Orders Runtime
            </h2>

          </div>

          <div className="overflow-auto">

            <table className="w-full">

              <thead className="bg-zinc-950">

                <tr>

                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                    Order
                  </th>

                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                    Factory
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
                  length: 10,
                }).map((_, index) => (

                  <tr
                    key={index}
                    className="border-t border-zinc-800"
                  >

                    <td className="px-4 py-4 text-orange-400">
                      PROD-{3000 + index}
                    </td>

                    <td className="px-4 py-4 text-white">
                      FACTORY A
                    </td>

                    <td className="px-4 py-4">

                      <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs text-cyan-400">

                        RUNNING

                      </span>

                    </td>

                    <td className="px-4 py-4">

                      <div className="flex items-center gap-3">

                        <div className="h-2 flex-1 rounded-full bg-zinc-800">

                          <div
                            className="h-2 rounded-full bg-orange-500"
                            style={{
                              width:
                                `${55 + index * 3}%`,
                            }}
                          />

                        </div>

                        <div className="text-xs text-zinc-400">
                          {55 + index * 3}%
                        </div>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

        {/* MACHINE STATUS */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

          <h2 className="mb-6 text-xl font-bold text-white">
            Machine Runtime
          </h2>

          <div className="space-y-4">

            {[
              'Laser CNC 01',
              'Laser CNC 02',
              'Welding Robot A',
              'Painting Booth',
              'Assembly Line',
            ].map((item) => (

              <div
                key={item}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
              >

                <div className="flex items-center justify-between">

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

                <div className="mt-4 h-2 rounded-full bg-zinc-800">

                  <div
                    className="h-2 rounded-full bg-orange-500"
                    style={{
                      width:
                        `${70 + Math.random() * 20}%`,
                    }}
                  />

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>

    </div>
  )
}
