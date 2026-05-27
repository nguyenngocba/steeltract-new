type Props = {
  costing: any
}

export function CostingCard({
  costing,
}: Props) {

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

      <div>

        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Costing
        </p>

        <h2 className="mt-2 text-2xl font-bold text-white">
          {costing.costingCode}
        </h2>

      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">

        <div className="rounded-2xl bg-zinc-950 p-4">

          <p className="text-xs text-zinc-500">
            Material
          </p>

          <h3 className="mt-2 text-lg font-bold text-cyan-400">
            {costing.materialCost.toLocaleString()}
          </h3>

        </div>

        <div className="rounded-2xl bg-zinc-950 p-4">

          <p className="text-xs text-zinc-500">
            Labor
          </p>

          <h3 className="mt-2 text-lg font-bold text-orange-400">
            {costing.laborCost.toLocaleString()}
          </h3>

        </div>

        <div className="rounded-2xl bg-zinc-950 p-4">

          <p className="text-xs text-zinc-500">
            Machine
          </p>

          <h3 className="mt-2 text-lg font-bold text-red-400">
            {costing.machineCost.toLocaleString()}
          </h3>

        </div>

        <div className="rounded-2xl bg-zinc-950 p-4">

          <p className="text-xs text-zinc-500">
            Total
          </p>

          <h3 className="mt-2 text-lg font-bold text-emerald-400">
            {costing.totalCost.toLocaleString()}
          </h3>

        </div>

      </div>

    </div>
  )
}
