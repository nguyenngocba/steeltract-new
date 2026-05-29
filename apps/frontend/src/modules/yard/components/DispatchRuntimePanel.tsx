const dispatches = [
  {
    truck: '51D-88231',
    project: 'Factory Expansion',
    status: 'LOADING',
  },

  {
    truck: '61C-11822',
    project: 'Bridge Package',
    status: 'IN_TRANSIT',
  },

  {
    truck: '50H-22991',
    project: 'Warehouse Steel',
    status: 'QUEUED',
  },
]

function getColor(status: string) {
  switch (status) {
    case 'LOADING':
      return 'bg-orange-500'

    case 'IN_TRANSIT':
      return 'bg-emerald-500'

    default:
      return 'bg-cyan-500'
  }
}

export function DispatchRuntimePanel() {
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
          Dispatch Runtime
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Truck scheduling & delivery execution
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {dispatches.map((dispatch) => (
          <div
            key={dispatch.truck}
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
                  {dispatch.truck}
                </div>

                <div className="mt-1 text-sm text-zinc-500">
                  {dispatch.project}
                </div>
              </div>

              <div
                className={`
                  rounded-full
                  px-3
                  py-1
                  text-xs
                  text-white
                  ${getColor(dispatch.status)}
                `}
              >
                {dispatch.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
