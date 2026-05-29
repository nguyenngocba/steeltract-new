const automations = [
  {
    name: 'Auto Procurement',
    runtime: 'ONLINE',
  },

  {
    name: 'QC Escalation',
    runtime: 'ONLINE',
  },

  {
    name: 'Dispatch Sync',
    runtime: 'ONLINE',
  },

  {
    name: 'Inventory Balancing',
    runtime: 'WARNING',
  },
]

function getColor(status: string) {
  return status === 'ONLINE'
    ? 'bg-emerald-500'
    : 'bg-orange-500'
}

export function AutomationRuntimePanel() {
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
        <div className="text-xs uppercase tracking-[0.2em] text-lime-400">
          Automation Runtime
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Workflow execution engine
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {automations.map((automation) => (
          <div
            key={automation.name}
            className="
              flex
              items-center
              justify-between
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div className="text-sm text-white">
              {automation.name}
            </div>

            <div
              className={`
                rounded-full
                px-3
                py-1
                text-xs
                text-white
                ${getColor(automation.runtime)}
              `}
            >
              {automation.runtime}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
