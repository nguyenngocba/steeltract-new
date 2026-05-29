const inspections = [
  {
    id: 'QC-001',
    stage: 'Welding',
    inspector: 'Nguyen Van A',
    status: 'PASS',
  },

  {
    id: 'QC-002',
    stage: 'Assembly',
    inspector: 'Tran Van B',
    status: 'FAIL',
  },

  {
    id: 'QC-003',
    stage: 'Painting',
    inspector: 'Le Van C',
    status: 'PENDING',
  },
]

function getColor(status: string) {
  switch (status) {
    case 'PASS':
      return 'bg-emerald-500'

    case 'FAIL':
      return 'bg-red-500'

    default:
      return 'bg-orange-500'
  }
}

export function InspectionRuntime() {
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
        <div className="text-xs uppercase tracking-[0.2em] text-red-400">
          Inspection Runtime
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Live inspection monitoring
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {inspections.map((inspection) => (
          <div
            key={inspection.id}
            className="
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">
                  {inspection.id}
                </div>

                <div className="mt-1 text-sm text-zinc-500">
                  {inspection.stage}
                </div>

                <div className="mt-1 text-xs text-zinc-600">
                  {inspection.inspector}
                </div>
              </div>

              <div
                className={`
                  rounded-full
                  px-3
                  py-1
                  text-xs
                  text-white
                  ${getColor(inspection.status)}
                `}
              >
                {inspection.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
