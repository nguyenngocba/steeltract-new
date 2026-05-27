type Props = {
  machine: any
}

export function MachineCard({
  machine,
}: Props) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Machine
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            {machine.machineCode}
          </h2>

        </div>

        <div
          className={`rounded-full px-4 py-2 text-xs font-medium ${
            machine.status === 'running'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-orange-500/20 text-orange-400'
          }`}
        >
          {machine.status}
        </div>

      </div>

      <div className="mt-6 space-y-4">

        <div className="rounded-2xl bg-zinc-950 p-4">

          <p className="text-xs text-zinc-500">
            Machine Name
          </p>

          <h3 className="mt-2 text-lg font-semibold text-white">
            {machine.machineName}
          </h3>

        </div>

        <div className="grid grid-cols-2 gap-4">

          <div className="rounded-2xl bg-zinc-950 p-4">

            <p className="text-xs text-zinc-500">
              Category
            </p>

            <h3 className="mt-2 text-lg font-bold text-cyan-400">
              {machine.category}
            </h3>

          </div>

          <div className="rounded-2xl bg-zinc-950 p-4">

            <p className="text-xs text-zinc-500">
              Health Score
            </p>

            <h3 className="mt-2 text-lg font-bold text-orange-400">
              {machine.healthScore}%
            </h3>

          </div>

        </div>

      </div>

    </div>
  )
}
