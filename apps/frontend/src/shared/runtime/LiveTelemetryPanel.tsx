import {
  useLiveTelemetry,
} from '../hooks/useLiveTelemetry'

export function LiveTelemetryPanel() {

  const {
    connected,
    telemetry,
  } = useLiveTelemetry()

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">

      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">

        <div>

          <div className="text-xl font-bold text-white">
            Live Runtime Feed
          </div>

          <div className="mt-1 text-xs text-zinc-500">
            Enterprise Telemetry Runtime
          </div>

        </div>

        <div className="flex items-center gap-2">

          <div className={`h-2 w-2 rounded-full ${
            connected

              ? 'bg-emerald-400'

              : 'bg-red-400'
          }`} />

          <div className={`text-xs ${
            connected

              ? 'text-emerald-400'

              : 'text-red-400'
          }`}>

            {connected
              ? 'CONNECTED'
              : 'DISCONNECTED'}

          </div>

        </div>

      </div>

      {/* EVENTS */}
      <div className="space-y-3">

        {telemetry.length === 0 && (

          <div className="rounded-2xl border border-zinc-800 bg-black p-5 text-sm text-zinc-500">

            Waiting realtime telemetry...

          </div>

        )}

        {telemetry.map(
          (item, index) => (

            <div
              key={index}
              className="rounded-2xl border border-zinc-800 bg-black p-4"
            >

              <div className="flex items-center justify-between">

                <div className="text-sm font-semibold text-white">

                  {item.title || 'Runtime Event'}

                </div>

                <div className="text-xs text-cyan-400">

                  LIVE

                </div>

              </div>

              <div className="mt-2 text-xs text-zinc-500">

                {item.description || 'Factory runtime update'}

              </div>

            </div>

          ),
        )}

      </div>

    </div>
  )
}
