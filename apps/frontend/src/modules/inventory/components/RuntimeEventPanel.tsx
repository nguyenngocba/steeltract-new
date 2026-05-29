import { useRuntimeEvents } from '../store/useRuntimeEvents'

export function RuntimeEventPanel() {
  const events =
    useRuntimeEvents(
      (state) => state.events,
    )

  return (
    <div
      className="
        rounded-2xl
        border
        border-zinc-800
        bg-zinc-900
        p-6
      "
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-400">
            Runtime Events
          </div>

          <div className="mt-1 text-sm text-zinc-500">
            Live operational event stream
          </div>
        </div>

        <div
          className="
            rounded-full
            bg-emerald-500/10
            px-3
            py-1
            text-xs
            text-emerald-400
          "
        >
          STREAMING
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {events.length === 0 && (
          <div className="text-sm text-zinc-500">
            No runtime events yet
          </div>
        )}

        {events.map((event) => (
          <div
            key={event.id}
            className="
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-cyan-400">
                  {event.type}
                </div>

                <div className="mt-1 text-sm text-white">
                  {event.message}
                </div>
              </div>

              <div className="text-xs text-zinc-500">
                {event.timestamp}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
