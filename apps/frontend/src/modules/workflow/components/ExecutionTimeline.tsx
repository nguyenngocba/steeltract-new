const executions = [
  {
    workflow: 'Purchase Approval',
    event: 'Approved by Manager',
  },

  {
    workflow: 'QC Escalation',
    event: 'NCR workflow opened',
  },

  {
    workflow: 'Dispatch Workflow',
    event: 'Truck loading started',
  },

  {
    workflow: 'Inventory Sync',
    event: 'Warehouse stock updated',
  },
]

export function ExecutionTimeline() {
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
          Workflow Execution Timeline
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Operational automation events
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {executions.map((execution, index) => (
          <div
            key={index}
            className="
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div className="text-sm font-bold text-white">
              {execution.workflow}
            </div>

            <div className="mt-2 text-sm text-zinc-500">
              {execution.event}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
