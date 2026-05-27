import { useQuery } from '@tanstack/react-query'

import {
  getInspections,
  getDefects,
  getNcr,
} from '../api/qc.api'

import { InspectionCard } from '../components/InspectionCard'
import { DefectCard } from '../components/DefectCard'

export function QcPage() {

  const {
    data: inspections,
  } = useQuery({
    queryKey: ['inspections'],
    queryFn: getInspections,
  })

  const {
    data: defects,
  } = useQuery({
    queryKey: ['defects'],
    queryFn: getDefects,
  })

  const {
    data: ncr,
  } = useQuery({
    queryKey: ['ncr'],
    queryFn: getNcr,
  })

  return (
    <div className="flex h-full flex-col overflow-auto bg-zinc-950 p-6">

      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold text-white">
            QC / QA Runtime
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Quality Control + Defect + NCR Runtime
          </p>

        </div>

        <div className="flex gap-3">

          <button className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-medium text-white">
            New Inspection
          </button>

          <button className="rounded-xl bg-red-600 px-5 py-3 text-sm font-medium text-white">
            Report Defect
          </button>

        </div>

      </div>

      {/* KPI */}
      <div className="mb-6 grid grid-cols-4 gap-4">

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Inspections
          </p>

          <h2 className="mt-4 text-5xl font-bold text-cyan-400">
            {inspections?.length || 0}
          </h2>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Defects
          </p>

          <h2 className="mt-4 text-5xl font-bold text-red-400">
            {defects?.length || 0}
          </h2>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            NCR
          </p>

          <h2 className="mt-4 text-5xl font-bold text-orange-400">
            {ncr?.length || 0}
          </h2>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Pass Rate
          </p>

          <h2 className="mt-4 text-5xl font-bold text-emerald-400">
            92%
          </h2>

        </div>

      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-2 gap-6">

        {/* INSPECTIONS */}
        <div>

          <div className="mb-4">

            <h2 className="text-2xl font-bold text-white">
              Inspections
            </h2>

          </div>

          <div className="space-y-4">

            {inspections?.map((inspection: any) => (
              <InspectionCard
                key={inspection.id}
                inspection={inspection}
              />
            ))}

          </div>

        </div>

        {/* DEFECTS */}
        <div>

          <div className="mb-4">

            <h2 className="text-2xl font-bold text-white">
              Defects
            </h2>

          </div>

          <div className="space-y-4">

            {defects?.map((defect: any) => (
              <DefectCard
                key={defect.id}
                defect={defect}
              />
            ))}

          </div>

        </div>

      </div>

    </div>
  )
}
