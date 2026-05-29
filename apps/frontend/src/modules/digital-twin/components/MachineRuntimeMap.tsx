const machines = Array.from({
  length: 20,
}).map((_, index) => {
  const states = [
    'RUNNING',
    'IDLE',
    'WARNING',
  ]

  const status =
    states[
      Math.floor(
        Math.random() *
          states.length,
      )
    ]

  return {
    id: `MC-${index + 1}`,

    status,
  }
})

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

export function MachineRuntimeMap() {
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
            <div>{machine.id}</div>

            <div className="mt-1 text-[10px]">
              {machine.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
