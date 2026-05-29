import { useRuntimeEventStore }
  from '@/runtime/events/runtime-event.store'

export function GlobalRuntimeEventFeed() {
  const events =
    useRuntimeEventStore(
      (state) =>
        state.events,
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
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-400">
          Global Runtime Events
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Unified realtime industrial event stream
        </div>
      </div>

      <div className="mt-6 space-y-3">
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
            <div className="text-sm text-cyan-400">
              {event.type}
            </div>

            <div className="mt-2 text-xs text-zinc-500">
              {event.createdAt}
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div className="text-sm text-zinc-500">
            No runtime events
          </div>
        )}
      </div>
    </div>
  )
}
