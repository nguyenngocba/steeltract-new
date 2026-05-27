type Props = {
  inspection: any
}

export function InspectionCard({
  inspection,
}: Props) {

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Inspection
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            {inspection.inspectionCode}
          </h2>

        </div>

        <div
          className={`rounded-full px-4 py-2 text-xs font-medium ${
            inspection.status === 'passed'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-red-500/20 text-red-400'
          }`}
        >
          {inspection.status}
        </div>

      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">

        <div className="rounded-2xl bg-zinc-950 p-4">

          <p className="text-xs text-zinc-500">
            Inspector
          </p>

          <h3 className="mt-2 text-lg font-semibold text-white">
            {inspection.inspector}
          </h3>

        </div>

        <div className="rounded-2xl bg-zinc-950 p-4">

          <p className="text-xs text-zinc-500">
            Score
          </p>

          <h3 className="mt-2 text-lg font-bold text-orange-400">
            {inspection.score}
          </h3>

        </div>

      </div>

    </div>
  )
}
