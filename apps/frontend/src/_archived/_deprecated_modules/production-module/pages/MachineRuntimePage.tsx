const machines = [

  {
    code:
      'CNC-01',

    type:
      'Laser CNC',

    status:
      'RUNNING',

    efficiency:
      '96%',
  },

  {
    code:
      'WELD-02',

    type:
      'Welding Robot',

    status:
      'IDLE',

    efficiency:
      '82%',
  },

  {
    code:
      'PAINT-01',

    type:
      'Paint Line',

    status:
      'RUNNING',

    efficiency:
      '91%',
  },
]

export function MachineRuntimePage() {

  return (
    <div className="space-y-6 bg-black p-6">

      <div>

        <div className="text-sm uppercase tracking-[0.35em] text-orange-400">
          Machine Runtime
        </div>

        <h1 className="mt-3 text-5xl font-black text-white">
          MACHINE CENTER
        </h1>

      </div>

      <div className="grid grid-cols-3 gap-6">

        {machines.map((item) => (

          <div
            key={item.code}
            className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
          >

            <div className="text-2xl font-black text-cyan-400">
              {item.code}
            </div>

            <div className="mt-4 text-white">
              {item.type}
            </div>

            <div className="mt-6 flex items-center justify-between">

              <div className="text-sm text-zinc-500">
                {item.status}
              </div>

              <div className="text-2xl font-black text-orange-400">
                {item.efficiency}
              </div>

            </div>

          </div>

        ))}

      </div>

    </div>
  )
}
