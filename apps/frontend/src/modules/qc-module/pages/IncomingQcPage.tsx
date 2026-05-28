const stats = [

  {
    title:
      'Incoming Today',

    value:
      '482',

    color:
      'text-cyan-400',
  },

  {
    title:
      'QC Passed',

    value:
      '451',

    color:
      'text-emerald-400',
  },

  {
    title:
      'QC Failed',

    value:
      '31',

    color:
      'text-red-400',
  },

  {
    title:
      'Pending Approval',

    value:
      '12',

    color:
      'text-orange-400',
  },
]

export function IncomingQcPage() {

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

        {/* QC TABLE */}
        <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">

          <div className="border-b border-zinc-800 px-6 py-5">

            <h2 className="text-xl font-bold text-white">
              Incoming QC Runtime
            </h2>

          </div>

          <div className="overflow-auto">

            <table className="w-full">

              <thead className="bg-zinc-950">

                <tr>

                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                    Material
                  </th>

                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                    Supplier
                  </th>

                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                    Status
                  </th>

                  <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                    Inspector
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

                    <td className="px-4 py-4 text-cyan-400">
                      MAT-{4000 + index}
                    </td>

                    <td className="px-4 py-4 text-white">
                      Supplier A
                    </td>

                    <td className="px-4 py-4">

                      <span className={`rounded-full px-3 py-1 text-xs ${
                        index % 3 === 0

                          ? 'bg-red-500/20 text-red-400'

                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>

                        {index % 3 === 0
                          ? 'FAILED'
                          : 'PASSED'}

                      </span>

                    </td>

                    <td className="px-4 py-4 text-zinc-400">
                      QC-0{index}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

        {/* ALERTS */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

          <h2 className="mb-6 text-xl font-bold text-white">
            QC Alerts
          </h2>

          <div className="space-y-4">

            {[
              'Welding Defect Detected',
              'Paint Thickness Warning',
              'Incoming Material Failed',
              'QC Approval Pending',
              'Shipment QC Hold',
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
                    index < 2

                      ? 'bg-red-500/20 text-red-400'

                      : 'bg-orange-500/20 text-orange-400'
                  }`}>

                    ALERT

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
