const zones = [

  {
    title:
      'Warehouse A',

    status:
      'ACTIVE',

    color:
      'bg-cyan-500',
  },

  {
    title:
      'Fabrication Line',

    status:
      'RUNNING',

    color:
      'bg-orange-500',
  },

  {
    title:
      'QC Inspection',

    status:
      'ONLINE',

    color:
      'bg-emerald-500',
  },

  {
    title:
      'Yard Zone B',

    status:
      'ACTIVE',

    color:
      'bg-violet-500',
  },

  {
    title:
      'Truck Queue',

    status:
      'MOVING',

    color:
      'bg-pink-500',
  },

  {
    title:
      'Command Runtime',

    status:
      'CONNECTED',

    color:
      'bg-cyan-400',
  },
]

const telemetry = [

  {
    machine:
      'Laser CNC 01',

    temperature:
      '64°C',

    runtime:
      '98%',
  },

  {
    machine:
      'Laser CNC 02',

    temperature:
      '69°C',

    runtime:
      '94%',
  },

  {
    machine:
      'Welding Robot A',

    temperature:
      '58°C',

    runtime:
      '97%',
  },

  {
    machine:
      'Painting Booth',

    temperature:
      '44°C',

    runtime:
      '92%',
  },
]

export function DigitalTwinPage() {

  return (
    <div className="flex h-full overflow-hidden bg-black">

      {/* LEFT */}
      <div className="flex-1 overflow-auto p-6">

        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between">

          <div>

            <div className="text-sm uppercase tracking-[0.35em] text-cyan-500">
              Smart Factory Runtime
            </div>

            <h1 className="mt-3 text-5xl font-black tracking-wide text-white">
              DIGITAL TWIN
            </h1>

          </div>

          <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/10 px-6 py-5">

            <div className="text-xs uppercase tracking-[0.3em] text-cyan-400">
              System State
            </div>

            <div className="mt-3 flex items-center gap-3">

              <div className="h-3 w-3 rounded-full bg-emerald-400" />

              <div className="text-2xl font-black text-emerald-400">
                SYNCHRONIZED
              </div>

            </div>

          </div>

        </div>

        {/* FACTORY MAP */}
        <div className="rounded-[32px] border border-zinc-800 bg-zinc-950 p-6">

          <div className="mb-6 flex items-center justify-between">

            <h2 className="text-2xl font-bold text-white">
              Factory Runtime Scene
            </h2>

            <div className="rounded-full bg-cyan-500/10 px-4 py-2 text-xs text-cyan-400">
              LIVE DIGITAL TWIN
            </div>

          </div>

          {/* SCENE */}
          <div className="grid grid-cols-3 gap-5">

            {zones.map((zone) => (

              <div
                key={zone.title}
                className="rounded-3xl border border-zinc-800 bg-black p-5"
              >

                <div className="flex items-center justify-between">

                  <div className="text-sm font-semibold text-white">
                    {zone.title}
                  </div>

                  <div className={`h-3 w-3 rounded-full ${zone.color}`} />

                </div>

                {/* MAP */}
                <div className="mt-5 flex h-40 items-center justify-center rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950">

                  <div className="relative h-24 w-24 rounded-full border border-cyan-500/20">

                    <div className={`absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full ${zone.color}`} />

                  </div>

                </div>

                <div className="mt-4 flex items-center justify-between">

                  <div className="text-xs text-zinc-500">
                    Runtime
                  </div>

                  <div className="text-xs text-cyan-400">
                    {zone.status}
                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>

      {/* RIGHT PANEL */}
      <div className="w-[420px] overflow-auto border-l border-zinc-800 bg-zinc-950 p-6">

        {/* TELEMETRY */}
        <div className="rounded-3xl border border-zinc-800 bg-black p-6">

          <div className="mb-6 flex items-center justify-between">

            <h2 className="text-xl font-bold text-white">
              Machine Telemetry
            </h2>

            <div className="rounded-full bg-orange-500/10 px-3 py-1 text-xs text-orange-400">
              LIVE
            </div>

          </div>

          <div className="space-y-4">

            {telemetry.map((item) => (

              <div
                key={item.machine}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
              >

                <div className="flex items-center justify-between">

                  <div className="text-sm font-semibold text-white">
                    {item.machine}
                  </div>

                  <div className="flex items-center gap-2">

                    <div className="h-2 w-2 rounded-full bg-emerald-400" />

                    <div className="text-xs text-emerald-400">
                      ONLINE
                    </div>

                  </div>

                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">

                  <div className="rounded-2xl border border-zinc-800 bg-black p-3">

                    <div className="text-xs text-zinc-500">
                      Temperature
                    </div>

                    <div className="mt-2 text-xl font-black text-orange-400">
                      {item.temperature}
                    </div>

                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-black p-3">

                    <div className="text-xs text-zinc-500">
                      Runtime
                    </div>

                    <div className="mt-2 text-xl font-black text-cyan-400">
                      {item.runtime}
                    </div>

                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>

        {/* ALERTS */}
        <div className="mt-6 rounded-3xl border border-zinc-800 bg-black p-6">

          <div className="mb-5 text-xl font-bold text-white">
            Runtime Events
          </div>

          <div className="space-y-4">

            {[
              'Truck entered yard zone',
              'Production queue updated',
              'Inventory synchronized',
              'QC approval completed',
              'Shipment dispatched',
            ].map((item, index) => (

              <div
                key={item}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
              >

                <div className="flex items-center gap-3">

                  <div className={`h-2 w-2 rounded-full ${
                    index % 2 === 0

                      ? 'bg-cyan-400'

                      : 'bg-emerald-400'
                  }`} />

                  <div className="text-sm text-white">
                    {item}
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
