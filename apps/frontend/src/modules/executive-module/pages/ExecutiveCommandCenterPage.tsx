const alerts = [

  {
    title:
      'Low Inventory Alert',

    description:
      'Steel Plate Inventory Below Threshold',

    level:
      'HIGH',
  },

  {
    title:
      'Machine Runtime Warning',

    description:
      'Laser CNC 02 Temperature Rising',

    level:
      'MEDIUM',
  },

  {
    title:
      'Truck Delayed',

    description:
      'Shipment SHIP-5004 Delayed 24 mins',

    level:
      'LOW',
  },
]

const telemetry = [

  {
    title:
      'Inventory Runtime',

    status:
      'ONLINE',
  },

  {
    title:
      'Production Runtime',

    status:
      'ONLINE',
  },

  {
    title:
      'QC Runtime',

    status:
      'ONLINE',
  },

  {
    title:
      'Yard Runtime',

    status:
      'ONLINE',
  },

  {
    title:
      'Logistics Runtime',

    status:
      'ONLINE',
  },
]

export function ExecutiveCommandCenterPage() {

  return (
    <div className="flex h-full flex-col overflow-auto bg-black">

      {/* HERO */}
      <div className="border-b border-zinc-800 bg-gradient-to-r from-cyan-950/40 via-zinc-950 to-violet-950/40 px-8 py-8">

        <div className="flex items-center justify-between">

          <div>

            <div className="text-sm uppercase tracking-[0.4em] text-cyan-500">
              SteelTrack Enterprise
            </div>

            <h1 className="mt-3 text-5xl font-black tracking-wide text-white">
              COMMAND CENTER
            </h1>

            <div className="mt-4 text-zinc-400">
              Factory Runtime / ERP / MES / WMS
            </div>

          </div>

          <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/10 px-8 py-6">

            <div className="text-xs uppercase tracking-[0.3em] text-cyan-500">
              Factory Status
            </div>

            <div className="mt-3 flex items-center gap-3">

              <div className="h-3 w-3 rounded-full bg-emerald-400" />

              <div className="text-2xl font-black text-emerald-400">
                ONLINE
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* KPI */}
      <div className="grid grid-cols-5 gap-6 p-6">

        {[
          {
            title: 'Inventory',
            value: '24,820',
            color: 'text-cyan-400',
          },

          {
            title: 'Production',
            value: '1,248',
            color: 'text-orange-400',
          },

          {
            title: 'QC Pass',
            value: '98.2%',
            color: 'text-emerald-400',
          },

          {
            title: 'Shipments',
            value: '84',
            color: 'text-violet-400',
          },

          {
            title: 'Efficiency',
            value: '93%',
            color: 'text-pink-400',
          },
        ].map((item) => (

          <div
            key={item.title}
            className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
          >

            <div className="text-sm text-zinc-500">
              {item.title}
            </div>

            <div className={`mt-4 text-5xl font-black ${item.color}`}>

              {item.value}

            </div>

          </div>

        ))}

      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-[1fr_420px] gap-6 px-6 pb-6">

        {/* TELEMETRY */}
        <div className="space-y-6">

          {/* FACTORY MAP */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">

            <div className="mb-6 flex items-center justify-between">

              <h2 className="text-2xl font-bold text-white">
                Factory Digital Runtime
              </h2>

              <div className="rounded-full bg-cyan-500/10 px-4 py-2 text-xs text-cyan-400">
                LIVE TELEMETRY
              </div>

            </div>

            <div className="grid grid-cols-3 gap-5">

              {[
                'Warehouse A',
                'Production Line',
                'QC Zone',
                'Yard Zone',
                'Logistics Hub',
                'Command Runtime',
              ].map((item, index) => (

                <div
                  key={item}
                  className="rounded-3xl border border-zinc-800 bg-black p-6"
                >

                  <div className="flex items-center justify-between">

                    <div className="text-sm font-semibold text-white">
                      {item}
                    </div>

                    <div className="h-2 w-2 rounded-full bg-emerald-400" />

                  </div>

                  <div className="mt-8 h-24 rounded-2xl border border-cyan-500/10 bg-gradient-to-br from-cyan-500/10 to-violet-500/5" />

                  <div className="mt-4 flex items-center justify-between">

                    <div className="text-xs text-zinc-500">
                      Runtime
                    </div>

                    <div className="text-xs text-cyan-400">
                      ACTIVE
                    </div>

                  </div>

                </div>

              ))}

            </div>

          </div>

          {/* AI FORECAST */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">

            <div className="mb-6 flex items-center justify-between">

              <h2 className="text-2xl font-bold text-white">
                AI Forecast Runtime
              </h2>

              <div className="rounded-full bg-violet-500/10 px-4 py-2 text-xs text-violet-400">
                AI ACTIVE
              </div>

            </div>

            <div className="grid grid-cols-3 gap-5">

              {[
                'Inventory Forecast',
                'Production Forecast',
                'Shipment Forecast',
              ].map((item) => (

                <div
                  key={item}
                  className="rounded-3xl border border-zinc-800 bg-black p-6"
                >

                  <div className="text-sm text-zinc-500">
                    {item}
                  </div>

                  <div className="mt-4 text-4xl font-black text-violet-400">
                    92%
                  </div>

                  <div className="mt-3 text-xs text-zinc-500">
                    Prediction Accuracy
                  </div>

                </div>

              ))}

            </div>

          </div>

        </div>

        {/* SIDE PANEL */}
        <div className="space-y-6">

          {/* LIVE SYSTEM */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">

            <h2 className="mb-6 text-xl font-bold text-white">
              Runtime Systems
            </h2>

            <div className="space-y-4">

              {telemetry.map((item) => (

                <div
                  key={item.title}
                  className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black px-4 py-4"
                >

                  <div className="text-sm text-white">
                    {item.title}
                  </div>

                  <div className="flex items-center gap-2">

                    <div className="h-2 w-2 rounded-full bg-emerald-400" />

                    <div className="text-xs text-emerald-400">
                      {item.status}
                    </div>

                  </div>

                </div>

              ))}

            </div>

          </div>

          {/* ALERTS */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">

            <h2 className="mb-6 text-xl font-bold text-white">
              Live Alerts
            </h2>

            <div className="space-y-4">

              {alerts.map((item) => (

                <div
                  key={item.title}
                  className="rounded-2xl border border-zinc-800 bg-black p-4"
                >

                  <div className="flex items-center justify-between">

                    <div className="text-sm font-semibold text-white">
                      {item.title}
                    </div>

                    <div className={`rounded-full px-2 py-1 text-xs ${
                      item.level === 'HIGH'

                        ? 'bg-red-500/20 text-red-400'

                        : item.level === 'MEDIUM'

                        ? 'bg-orange-500/20 text-orange-400'

                        : 'bg-cyan-500/20 text-cyan-400'
                    }`}>

                      {item.level}

                    </div>

                  </div>

                  <div className="mt-3 text-xs text-zinc-500">
                    {item.description}
                  </div>

                </div>

              ))}

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}
