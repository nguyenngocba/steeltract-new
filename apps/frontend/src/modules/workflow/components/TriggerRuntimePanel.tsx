const triggers = [
  {
    trigger: 'Low Stock',
    action: 'Create Purchase Request',
    status: 'ACTIVE',
  },

  {
    trigger: 'QC Failure',
    action: 'Open NCR Workflow',
    status: 'ACTIVE',
  },

  {
    trigger: 'Production Delay',
    action: 'Notify Supervisor',
    status: 'ACTIVE',
  },

  {
    trigger: 'Truck Arrival',
    action: 'Open Dispatch Runtime',
    status: 'WAITING',
  },
]

function getColor(status: string) {
  return status === 'ACTIVE'
    ? 'bg-emerald-500'
    : 'bg-orange-500'
}

export function TriggerRuntimePanel() {
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
          Trigger Runtime
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Operational automation triggers
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {triggers.map((trigger) => (
          <div
            key={trigger.trigger}
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
                <div className="text-sm font-bold text-white">
                  {trigger.trigger}
                </div>

                <div className="mt-1 text-sm text-zinc-500">
                  {trigger.action}
                </div>
              </div>

              <div
                className={`
                  rounded-full
                  px-3
                  py-1
                  text-xs
                  text-white
                  ${getColor(trigger.status)}
                `}
              >
                {trigger.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
