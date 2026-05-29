const events = [
  {
    runtime: 'Inventory Runtime',
    fix: 'Cache synchronization restored',
  },

  {
    runtime: 'Realtime Bus',
    fix: 'Socket reconnection completed',
  },

  {
    runtime: 'Workflow Runtime',
    fix: 'Execution deadlock resolved',
  },

  {
    runtime: 'Analytics Runtime',
    fix: 'Telemetry recovery completed',
  },
]

export function SelfHealingPanel() {
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
        <div className="text-xs uppercase tracking-[0.2em] text-orange-400">
          Self-Healing Runtime
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Autonomous runtime recovery engine
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {events.map((event) => (
          <div
            key={event.runtime}
            className="
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div className="text-sm font-bold text-white">
              {event.runtime}
            </div>

            <div className="mt-2 text-sm text-zinc-500">
              {event.fix}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
