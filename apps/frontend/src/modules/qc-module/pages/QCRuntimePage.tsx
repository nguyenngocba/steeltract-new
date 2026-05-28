const inspections = [

  {
    no:
      'QC-1001',

    workorder:
      'WO-1001',

    result:
      'PASS',

    defect:
      '0',
  },

  {
    no:
      'QC-1002',

    workorder:
      'WO-1002',

    result:
      'FAIL',

    defect:
      '3',
  },
]

export function QCRuntimePage() {

  return (
    <div className="space-y-6 bg-black p-6">

      <div>

        <div className="text-sm uppercase tracking-[0.35em] text-red-400">
          QC Runtime
        </div>

        <h1 className="mt-3 text-5xl font-black text-white">
          QC INSPECTIONS
        </h1>

      </div>

      <div className="space-y-4">

        {inspections.map((item) => (

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
                  {item.workorder}
                </div>

              </div>

              <div className="text-right">

                <div className={`text-3xl font-black ${
                  item.result === 'PASS'

                    ? 'text-emerald-400'

                    : 'text-red-400'
                }`}>

                  {item.result}

                </div>

                <div className="mt-2 text-xs text-zinc-500">
                  Defect: {item.defect}
                </div>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  )
}
