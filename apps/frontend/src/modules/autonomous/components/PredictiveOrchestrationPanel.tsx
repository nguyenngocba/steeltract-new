const orchestrations = [
  {
    runtime: 'Production Runtime',
    optimization:
      'Shift workload to Plant B',
  },

  {
    runtime: 'Inventory Runtime',
    optimization:
      'Increase procurement volume by 12%',
  },

  {
    runtime: 'Dispatch Runtime',
    optimization:
      'Optimize truck loading sequence',
  },

  {
    runtime: 'QC Runtime',
    optimization:
      'Escalate anomaly inspection workflow',
  },
]

export function PredictiveOrchestrationPanel() {
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
          Predictive Orchestration
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          AI runtime optimization engine
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {orchestrations.map((item) => (
          <div
            key={item.runtime}
            className="
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div className="text-sm font-bold text-white">
              {item.runtime}
            </div>

            <div className="mt-2 text-sm text-zinc-500">
              {item.optimization}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
