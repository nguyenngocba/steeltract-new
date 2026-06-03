import { useQuery } from '@tanstack/react-query'

import { productionApi } from '@/modules/production/api/production.api'

function getColor(status: string) {
  switch (status) {
    case 'AVAILABLE':
    case 'RUNNING':
      return 'bg-emerald-500'

    case 'OFFLINE':
    case 'IDLE':
      return 'bg-orange-500'

    default:
      return 'bg-red-500'
  }
}

export function MachineRuntimeMap() {
  const { data: machines = [] } =
    useQuery({
      queryKey: ['digital-twin', 'machine-runtime-map'],
      queryFn: productionApi.machines,
      refetchInterval: 5000,
    })

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
        <div className="text-xs uppercase tracking-[0.2em] text-indigo-400">
          Machine Runtime Map
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Live equipment states
        </div>
      </div>

      <div className="mt-8 grid grid-cols-5 gap-3">
        {machines.map((machine) => (
          <div
            key={machine.id}
            className={`
              flex
              aspect-square
              flex-col
              items-center
              justify-center
              rounded-xl
              text-xs
              font-bold
              text-white
              ${getColor(machine.status)}
            `}
          >
            <div>{machine.code}</div>

            <div className="mt-1 text-[10px]">
              {machine.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
