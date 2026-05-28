const bոմs = [

  {
    no:
      'BOM-1001',

    product:
      'Steel Frame',

    version:
      'V1',
  },

  {
    no:
      'BOM-1002',

    product:
      'Pipe Support',

    version:
      'V3',
  },
]

export function BOMRuntimePage() {

  return (
    <div className="space-y-6 bg-black p-6">

      <div>

        <div className="text-sm uppercase tracking-[0.35em] text-violet-400">
          BOM Runtime
        </div>

        <h1 className="mt-3 text-5xl font-black text-white">
          BILL OF MATERIALS
        </h1>

      </div>

      <div className="grid grid-cols-2 gap-6">

        {bոմs.map((item) => (

          <div
            key={item.no}
            className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
          >

            <div className="text-2xl font-black text-cyan-400">
              {item.no}
            </div>

            <div className="mt-4 text-white">
              {item.product}
            </div>

            <div className="mt-2 text-xs text-zinc-500">
              {item.version}
            </div>

          </div>

        ))}

      </div>

    </div>
  )
}
