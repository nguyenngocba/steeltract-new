const workorders = [

  {
    no:
      'WO-1001',

    product:
      'Steel Structure A',

    qty:
      '120',

    status:
      'RELEASED',
  },

  {
    no:
      'WO-1002',

    product:
      'Pipe Assembly',

    qty:
      '80',

    status:
      'PLANNED',
  },
]

export function WorkOrderRuntimePage() {

  return (
    <div className="space-y-6 bg-black p-6">

      <div>

        <div className="text-sm uppercase tracking-[0.35em] text-orange-400">
          Production Runtime
        </div>

        <h1 className="mt-3 text-5xl font-black text-white">
          WORK ORDERS
        </h1>

      </div>

      <div className="space-y-4">

        {workorders.map((item) => (

          <div
            key={item.no}
            className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
          >

            <div className="flex items-center justify-between">

              <div>

                <div className="text-2xl font-black text-white">
                  {item.no}
                </div>

                <div className="mt-3 text-sm text-zinc-500">
                  {item.product}
                </div>

              </div>

              <div className="text-right">

                <div className="text-4xl font-black text-cyan-400">
                  {item.qty}
                </div>

                <div className="mt-2 text-xs text-zinc-500">
                  {item.status}
                </div>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  )
}
