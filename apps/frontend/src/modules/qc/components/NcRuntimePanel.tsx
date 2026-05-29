const ncrs = [
  {
    id: 'NCR-001',
    issue: 'Weld Defect',
    severity: 'HIGH',
  },

  {
    id: 'NCR-002',
    issue: 'Paint Scratch',
    severity: 'LOW',
  },

  {
    id: 'NCR-003',
    issue: 'Dimension Out',
    severity: 'CRITICAL',
  },
]

function getColor(severity: string) {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-500'

    case 'HIGH':
      return 'bg-orange-500'

    default:
      return 'bg-cyan-500'
  }
}

export function NcRuntimePanel() {
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
          NCR Runtime
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Non-conformance management
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {ncrs.map((ncr) => (
          <div
            key={ncr.id}
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
                  {ncr.id}
                </div>

                <div className="mt-1 text-sm text-zinc-500">
                  {ncr.issue}
                </div>
              </div>

              <div
                className={`
                  rounded-full
                  px-3
                  py-1
                  text-xs
                  text-white
                  ${getColor(ncr.severity)}
                `}
              >
                {ncr.severity}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
