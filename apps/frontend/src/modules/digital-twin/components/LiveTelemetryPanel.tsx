import {
  useDigitalTwinStore,
} from '../store/digitalTwin.store'

export function LiveTelemetryPanel() {

  const machine =
    useDigitalTwinStore(
      (s) => s.selectedMachine
    )

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

      <div className="mb-5 flex items-center justify-between">

        <div>

          <h2 className="text-2xl font-bold text-white">
            Live Telemetry
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Realtime machine analytics
          </p>

        </div>

        <div className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2">

          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />

          <span className="text-xs font-medium text-emerald-400">
            LIVE
          </span>

        </div>

      </div>

      {!machine && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-500">

          Select a machine in 3D map

        </div>
      )}

      {machine && (
        <div className="space-y-4">

          <div className="rounded-2xl bg-zinc-950 p-4">

            <p className="text-xs text-zinc-500">
              Machine ID
            </p>

            <h3 className="mt-2 text-3xl font-bold text-white">
              {machine.id}
            </h3>

          </div>

          <div className="grid grid-cols-2 gap-4">

            <div className="rounded-2xl bg-zinc-950 p-4">

              <p className="text-xs text-zinc-500">
                Temperature
              </p>

              <h3 className="mt-2 text-2xl font-bold text-orange-400">
                {machine.temperature}°C
              </h3>

            </div>

            <div className="rounded-2xl bg-zinc-950 p-4">

              <p className="text-xs text-zinc-500">
                Status
              </p>

              <h3 className="mt-2 text-2xl font-bold text-emerald-400">
                {machine.status}
              </h3>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}
