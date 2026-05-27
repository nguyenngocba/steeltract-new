import { useQuery } from '@tanstack/react-query'

import {
  getEmployees,
  getAttendance,
  getOperators,
} from '../api/hrm.api'

import { EmployeeCard } from '../components/EmployeeCard'
import { OperatorCard } from '../components/OperatorCard'

export function HrmPage() {

  const {
    data: employees,
  } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  })

  const {
    data: attendance,
  } = useQuery({
    queryKey: ['attendance'],
    queryFn: getAttendance,
  })

  const {
    data: operators,
  } = useQuery({
    queryKey: ['operators'],
    queryFn: getOperators,
  })

  return (
    <div className="flex h-full flex-col overflow-auto bg-zinc-950 p-6">

      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold text-white">
            HRM Runtime
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Shift + Attendance + Operator Runtime
          </p>

        </div>

        <div className="flex gap-3">

          <button className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-medium text-white">
            Check In
          </button>

          <button className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-medium text-white">
            Shift Scheduling
          </button>

        </div>

      </div>

      {/* KPI */}
      <div className="mb-6 grid grid-cols-4 gap-4">

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Employees
          </p>

          <h2 className="mt-4 text-5xl font-bold text-cyan-400">
            {employees?.length || 0}
          </h2>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Attendance
          </p>

          <h2 className="mt-4 text-5xl font-bold text-emerald-400">
            {attendance?.length || 0}
          </h2>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Operators
          </p>

          <h2 className="mt-4 text-5xl font-bold text-orange-400">
            {operators?.length || 0}
          </h2>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Active Shift
          </p>

          <h2 className="mt-4 text-5xl font-bold text-red-400">
            2
          </h2>

        </div>

      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-2 gap-6">

        {/* EMPLOYEES */}
        <div>

          <div className="mb-4">

            <h2 className="text-2xl font-bold text-white">
              Employees
            </h2>

          </div>

          <div className="space-y-4">

            {employees?.map((employee: any) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
              />
            ))}

          </div>

        </div>

        {/* OPERATORS */}
        <div>

          <div className="mb-4">

            <h2 className="text-2xl font-bold text-white">
              Machine Operators
            </h2>

          </div>

          <div className="space-y-4">

            {operators?.map((operator: any) => (
              <OperatorCard
                key={operator.id}
                operator={operator}
              />
            ))}

          </div>

        </div>

      </div>

    </div>
  )
}
