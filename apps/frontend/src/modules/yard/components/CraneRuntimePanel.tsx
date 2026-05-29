const cranes = [
  {
    id: 'CR-01',
    status: 'RUNNING',
    load: 74,
  },

  {
    id: 'CR-02',
    status: 'IDLE',
    load: 12,
  },

  {
    id: 'CR-03',
    status: 'MAINTENANCE',
    load: 0,
  },
]

function getColor(status: string) {
  switch (status) {
    case 'RUNNING':
      return 'bg-emerald-500'

    case 'IDLE':
      return 'bg-orange-500'

    default:
      return 'bg-red-500'
  }
}

export function CraneRuntimePanel() {
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
        <div className="text-xs uppercase tracking-[0.2em] text-amber-400">
          Crane Runtime
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Yard crane operational monitoring
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {cranes.map((crane) => (
          <div
            key={crane.id}
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
                  {crane.id}
                </div>

                <div className="mt-1 text-xs text-zinc-500">
                  Operational Runtime
                </div>
              </div>

              <div
                className={`
                  rounded-full
                  px-3
                  py-1
                  text-xs
                  text-white
                  ${getColor(crane.status)}
                `}
              >
                {crane.status}
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-zinc-500">
                  Load Utilization
                </span>

                <span className="text-white">
                  {crane.load}%
                </span>
              </div>

              <div className="h-2 rounded-full bg-zinc-800">
                <div
                  style={{
                    width: `${crane.load}%`,
                  }}
                  className={`
                    h-full
                    rounded-full
                    ${getColor(crane.status)}
                  `}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
