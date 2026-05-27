import { useTelemetryStore } from '../../live-store/telemetry/telemetry.store'

export function RealtimeFeed() {
  const inventoryEvents =
    useTelemetryStore((s) => s.inventoryEvents)

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">

      <div className="mb-4 flex items-center justify-between">

        <h3 className="text-lg font-semibold text-white">
          Hoạt động realtime
        </h3>

        <div className="flex items-center gap-2">

          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />

          <span className="text-xs text-zinc-400">
            LIVE
          </span>

        </div>

      </div>

      <div className="space-y-3">

        {inventoryEvents.length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-500">
            Chưa có dữ liệu realtime
          </div>
        )}

        {inventoryEvents.map((event, index) => (
          <div
            key={index}
            className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-medium text-white">
                  {event.title || 'Inventory Event'}
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  {event.description || 'Realtime inventory activity'}
                </p>

              </div>

              <span className="text-xs text-zinc-500">
                now
              </span>

            </div>

          </div>
        ))}

      </div>

    </div>
  )
}
