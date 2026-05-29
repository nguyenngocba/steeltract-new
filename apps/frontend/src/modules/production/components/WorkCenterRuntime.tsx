const machines = [
  {
    id: 'MC-01',
    status: 'RUNNING',
    utilization: 92,
  },

  {
    id: 'MC-02',
    status: 'IDLE',
    utilization: 24,
  },

  {
    id: 'MC-03',
    status: 'MAINTENANCE',
    utilization: 0,
  },

  {
    id: 'MC-04',
    status: 'RUNNING',
    utilization: 74,
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

export function WorkCenterRuntime() {
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
          Work Center Runtime
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Live machine utilization
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {machines.map((machine) => (
          <div
            key={machine.id}
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
                <div className="text-lg font-bold text-white">
                  {machine.id}
                </div>

                <div className="mt-1 text-xs text-zinc-500">
                  Utilization Runtime
                </div>
              </div>

              <div
                className={`
                  rounded-full
                  px-3
                  py-1
                  text-xs
                  text-white
                  ${getColor(machine.status)}
                `}
              >
                {machine.status}
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-500">
                  Utilization
                </div>

                <div className="text-sm text-white">
                  {machine.utilization}%
                </div>
              </div>

              <div className="mt-2 h-3 overflow-hidden rounded-full bg-zinc-800">
                <div
                  style={{
                    width: `${machine.utilization}%`,
                  }}
                  className={`
                    h-full
                    rounded-full
                    ${getColor(machine.status)}
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
