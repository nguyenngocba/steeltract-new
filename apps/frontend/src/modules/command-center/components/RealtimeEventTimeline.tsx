const events = [
  {
    type: 'INVENTORY',
    message: 'Inbound steel material received',
  },

  {
    type: 'PRODUCTION',
    message: 'Work order WO-2026-001 completed',
  },

  {
    type: 'QC',
    message: 'QC failure detected in welding stage',
  },

  {
    type: 'YARD',
    message: 'Truck dispatch started',
  },

  {
    type: 'AI',
    message: 'Anomaly detected in stock movement',
  },
]

function getColor(type: string) {
  switch (type) {
    case 'INVENTORY':
      return 'bg-cyan-500'

    case 'PRODUCTION':
      return 'bg-orange-500'

    case 'QC':
      return 'bg-red-500'

    case 'YARD':
      return 'bg-amber-500'

    default:
      return 'bg-pink-500'
  }
}

export function RealtimeEventTimeline() {
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
          Realtime Event Timeline
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

            <div>
              <div className="text-xs text-zinc-500">
                {event.type}
              </div>

              <div className="mt-1 text-sm text-white">
                {event.message}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
