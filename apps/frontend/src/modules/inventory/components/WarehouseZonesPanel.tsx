const zones = [
  {
    id: 'A',
    name: 'Zone A',
    occupancy: 92,
    status: 'CRITICAL',
  },

  {
    id: 'B',
    name: 'Zone B',
    occupancy: 64,
    status: 'NORMAL',
  },

  {
    id: 'C',
    name: 'Zone C',
    occupancy: 34,
    status: 'LOW',
  },

  {
    id: 'D',
    name: 'Zone D',
    occupancy: 81,
    status: 'HIGH',
  },
]

function getColor(status: string) {
  switch (status) {
    case 'CRITICAL':
      return 'bg-red-500'

    case 'HIGH':
      return 'bg-orange-500'

    case 'NORMAL':
      return 'bg-emerald-500'

    default:
      return 'bg-cyan-500'
  }
}

export function WarehouseZonesPanel() {
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
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-400">
            Warehouse Runtime
          </div>

          <div className="mt-1 text-sm text-zinc-500">
            Zone occupancy & operational health
          </div>
        </div>

        <div
          className="
            rounded-full
            bg-cyan-500/10
            px-3
            py-1
            text-xs
            text-cyan-400
          "
        >
          LIVE
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {zones.map((zone) => (
          <div
            key={zone.id}
            className="
              rounded-2xl
              border
              border-zinc-800
              bg-zinc-950
              p-5
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-white">
                  {zone.name}
                </div>

                <div className="mt-1 text-xs text-zinc-500">
                  Occupancy Runtime
                </div>
              </div>

              <div
                className={`
                  h-4
                  w-4
                  rounded-full
                  ${getColor(zone.status)}
                `}
              />
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-500">
                  Capacity
                </div>

                <div className="text-sm font-semibold text-white">
                  {zone.occupancy}%
                </div>
              </div>

              <div className="mt-2 h-3 overflow-hidden rounded-full bg-zinc-800">
                <div
                  style={{
                    width: `${zone.occupancy}%`,
                  }}
                  className={`
                    h-full
                    rounded-full
                    ${getColor(zone.status)}
                  `}
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="text-xs text-zinc-500">
                Runtime Status
              </div>

              <div
                className={`
                  rounded-full
                  px-3
                  py-1
                  text-xs
                  text-white
                  ${getColor(zone.status)}
                `}
              >
                {zone.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
