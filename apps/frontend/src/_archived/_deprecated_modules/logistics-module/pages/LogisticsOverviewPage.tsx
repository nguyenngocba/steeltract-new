const stats = [

  {
    title:
      'Shipments Today',

    value:
      '84',

    color:
      'text-violet-400',
  },

  {
    title:
      'Trucks Running',

    value:
      '26',

    color:
      'text-cyan-400',
  },

  {
    title:
      'Ready Dispatch',

    value:
      '14',

    color:
      'text-emerald-400',
  },

  {
    title:
      'Delayed Shipments',

    value:
      '3',

    color:
      'text-red-400',
  },
]

export function LogisticsOverviewPage() {

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

        {/* SHIPMENT TABLE */}
        <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">

          <div className="border-b border-zinc-800 px-6 py-5">

            <h2 className="text-xl font-bold text-white">
              Shipment Runtime
            </h2>

          </div>

          <div className="overflow-auto">

            <table className="w-full">

              <thead className="bg-zinc-950">

                <tr>

                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                    Shipment
                  </th>

                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                    Destination
                  </th>

                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                    Truck
                  </th>

                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                    Status
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

                    <td className="px-4 py-4 text-violet-400">
                      SHIP-{5000 + index}
                    </td>

                    <td className="px-4 py-4 text-white">
                      Ho Chi Minh
                    </td>

                    <td className="px-4 py-4 text-zinc-400">
                      51D-{100 + index}
                    </td>

                    <td className="px-4 py-4">

                      <span className={`rounded-full px-3 py-1 text-xs ${
                        index % 4 === 0

                          ? 'bg-orange-500/20 text-orange-400'

                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>

                        {index % 4 === 0
                          ? 'LOADING'
                          : 'ON ROUTE'}

                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

        {/* TRUCK STATUS */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

          <h2 className="mb-6 text-xl font-bold text-white">
            Fleet Tracking
          </h2>

          <div className="space-y-4">

            {[
              'Truck 51D-100',
              'Truck 51D-101',
              'Truck 51D-102',
              'Truck 51D-103',
              'Truck 51D-104',
            ].map((item, index) => (

              <div
                key={item}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
              >

                <div className="flex items-center justify-between">

                  <div className="text-sm text-white">
                    {item}
                  </div>

                  <div className={`rounded-full px-2 py-1 text-xs ${
                    index % 2 === 0

                      ? 'bg-emerald-500/20 text-emerald-400'

                      : 'bg-orange-500/20 text-orange-400'
                  }`}>

                    {index % 2 === 0
                      ? 'MOVING'
                      : 'LOADING'}

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
