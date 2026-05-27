type Props = {
  data: any
}

export function TelemetryCard({
  data,
}: Props) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Machine
          </p>

          <h2 className="mt-2 text-3xl font-bold text-white">
            {data.machineCode}
          </h2>

        </div>

        <div
          className={`rounded-full px-4 py-2 text-xs font-medium ${
            data.temperature > 80
              ? 'bg-red-500/20 text-red-400'
              : 'bg-emerald-500/20 text-emerald-400'
          }`}
        >
          {data.temperature > 80
            ? 'CRITICAL'
            : 'NORMAL'}
        </div>

      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">

        <div className="rounded-2xl bg-zinc-950 p-4">

          <p className="text-xs text-zinc-500">
            Temperature
          </p>

          <h3 className="mt-2 text-2xl font-bold text-orange-400">
            {data.temperature}°C
          </h3>

        </div>

        <div className="rounded-2xl bg-zinc-950 p-4">

          <p className="text-xs text-zinc-500">
            Load
          </p>

          <h3 className="mt-2 text-2xl font-bold text-cyan-400">
            {data.load}%
          </h3>

        </div>

        <div className="rounded-2xl bg-zinc-950 p-4">

          <p className="text-xs text-zinc-500">
            Power
          </p>

          <h3 className="mt-2 text-2xl font-bold text-emerald-400">
            {data.power}kw
          </h3>

        </div>

        <div className="rounded-2xl bg-zinc-950 p-4">

          <p className="text-xs text-zinc-500">
            Vibration
          </p>

          <h3 className="mt-2 text-2xl font-bold text-red-400">
            {data.vibration}
          </h3>

        </div>

      </div>

    </div>
  )
}
