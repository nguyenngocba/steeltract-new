import { useRuntimeStore } from '@/core/realtime/runtime.store'

function getColor(type: string) {
  switch (type) {
    case 'INVENTORY':
      return 'bg-cyan-500'

    case 'PRODUCTION':
      return 'bg-orange-500'

    case 'QC':
      return 'bg-red-500'

    default:
      return 'bg-emerald-500'
  }
}

export function LiveEventFeed() {
  const events =
    useRuntimeStore(
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
          Live Runtime Feed
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Global operational events
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {events.map((event, index) => (
          <div
            key={index}
            className="
              flex
              gap-4
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div
              className={`
                mt-1
                h-3
                w-3
                rounded-full
                ${getColor(event.type)}
              `}
            />

            <div className="flex-1">
              <div className="text-xs text-zinc-500">
                {event.type}
              </div>

              <div className="mt-1 text-sm text-white">
                {event.message}
              </div>

              <div className="mt-2 text-xs text-zinc-600">
                {event.createdAt}
              </div>
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div className="text-sm text-zinc-500">
            Waiting for realtime events...
          </div>
        )}
      </div>
    </div>
  )
}
