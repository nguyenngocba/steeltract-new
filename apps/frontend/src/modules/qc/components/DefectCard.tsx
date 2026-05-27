type Props = {
  defect: any
}

export function DefectCard({
  defect,
}: Props) {

  const severityColor = {
    high:
      'bg-red-500/20 text-red-400',

    medium:
      'bg-orange-500/20 text-orange-400',

    low:
      'bg-emerald-500/20 text-emerald-400',
  }

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Defect
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            {defect.defectCode}
          </h2>

        </div>

        <div
          className={`rounded-full px-4 py-2 text-xs font-medium ${
            severityColor[
              defect.severity as keyof typeof severityColor
            ]
          }`}
        >
          {defect.severity}
        </div>

      </div>

      <div className="mt-6 space-y-4">

        <div className="rounded-2xl bg-zinc-950 p-4">

          <p className="text-xs text-zinc-500">
            Type
          </p>

          <h3 className="mt-2 text-lg font-semibold text-cyan-400">
            {defect.defectType}
          </h3>

        </div>

        <div className="rounded-2xl bg-zinc-950 p-4">

          <p className="text-xs text-zinc-500">
            Description
          </p>

          <h3 className="mt-2 text-sm text-zinc-300">
            {defect.description}
          </h3>

        </div>

      </div>

    </div>
  )
}
