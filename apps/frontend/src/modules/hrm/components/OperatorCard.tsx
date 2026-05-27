type Props = {
  operator: any
}

export function OperatorCard({
  operator,
}: Props) {

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Machine Assignment
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            {operator.machineCode}
          </h2>

        </div>

        <div className="rounded-full bg-cyan-500/20 px-4 py-2 text-xs font-medium text-cyan-400">
          {operator.assignedShift}
        </div>

      </div>

      <div className="mt-6 rounded-2xl bg-zinc-950 p-4">

        <p className="text-xs text-zinc-500">
          Operator
        </p>

        <h3 className="mt-2 text-lg font-semibold text-white">
          {operator.employeeCode}
        </h3>

      </div>

    </div>
  )
}
