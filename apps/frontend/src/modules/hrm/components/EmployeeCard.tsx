type Props = {
  employee: any
}

export function EmployeeCard({
  employee,
}: Props) {

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Employee
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            {employee.employeeCode}
          </h2>

        </div>

        <div className="rounded-full bg-emerald-500/20 px-4 py-2 text-xs font-medium text-emerald-400">
          {employee.status}
        </div>

      </div>

      <div className="mt-6 space-y-4">

        <div className="rounded-2xl bg-zinc-950 p-4">

          <p className="text-xs text-zinc-500">
            Full Name
          </p>

          <h3 className="mt-2 text-lg font-semibold text-white">
            {employee.fullName}
          </h3>

        </div>

        <div className="grid grid-cols-2 gap-4">

          <div className="rounded-2xl bg-zinc-950 p-4">

            <p className="text-xs text-zinc-500">
              Department
            </p>

            <h3 className="mt-2 text-sm font-medium text-cyan-400">
              {employee.department}
            </h3>

          </div>

          <div className="rounded-2xl bg-zinc-950 p-4">

            <p className="text-xs text-zinc-500">
              Shift
            </p>

            <h3 className="mt-2 text-sm font-medium text-orange-400">
              {employee.shiftGroup}
            </h3>

          </div>

        </div>

      </div>

    </div>
  )
}
