const workloads = [
  {
    project: 'Factory Expansion',
    production: 74,
    qc: 12,
    logistics: 8,
  },

  {
    project: 'Warehouse Structure',
    production: 52,
    qc: 18,
    logistics: 22,
  },

  {
    project: 'Bridge Steel Package',
    production: 34,
    qc: 26,
    logistics: 40,
  },
]

export function ProjectWorkload() {
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
        <div className="text-xs uppercase tracking-[0.2em] text-violet-400">
          Project Workload
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Operational resource allocation
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {workloads.map((workload) => (
          <div
            key={workload.project}
            className="
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div className="text-sm font-bold text-white">
              {workload.project}
            </div>

            <div className="mt-5 space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-zinc-500">
                    Production
                  </span>

                  <span className="text-white">
                    {workload.production}%
                  </span>
                </div>

                <div className="h-2 rounded-full bg-zinc-800">
                  <div
                    style={{
                      width: `${workload.production}%`,
                    }}
                    className="h-full rounded-full bg-orange-500"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-zinc-500">
                    QC
                  </span>

                  <span className="text-white">
                    {workload.qc}%
                  </span>
                </div>

                <div className="h-2 rounded-full bg-zinc-800">
                  <div
                    style={{
                      width: `${workload.qc}%`,
                    }}
                    className="h-full rounded-full bg-red-500"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-zinc-500">
                    Logistics
                  </span>

                  <span className="text-white">
                    {workload.logistics}%
                  </span>
                </div>

                <div className="h-2 rounded-full bg-zinc-800">
                  <div
                    style={{
                      width: `${workload.logistics}%`,
                    }}
                    className="h-full rounded-full bg-cyan-500"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
