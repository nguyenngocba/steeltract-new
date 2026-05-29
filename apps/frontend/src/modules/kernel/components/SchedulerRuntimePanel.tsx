const tasks = [
  {
    task: 'Kernel Heartbeat',
    interval: '5s',
  },

  {
    task: 'Realtime Sync',
    interval: '2s',
  },

  {
    task: 'AI Analysis',
    interval: '10s',
  },

  {
    task: 'Telemetry Aggregation',
    interval: '15s',
  },
]

export function SchedulerRuntimePanel() {
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
        <div className="text-xs uppercase tracking-[0.2em] text-emerald-400">
          Runtime Scheduler
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Industrial task orchestration runtime
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {tasks.map((task) => (
          <div
            key={task.task}
            className="
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div className="flex items-center justify-between">
              <div className="text-sm text-white">
                {task.task}
              </div>

              <div
                className="
                  rounded-full
                  bg-cyan-500
                  px-3
                  py-1
                  text-xs
                  text-black
                "
              >
                {task.interval}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
