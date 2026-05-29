const alerts = [
  {
    severity: 'CRITICAL',
    message: 'Low stock detected in Warehouse A',
  },

  {
    severity: 'HIGH',
    message: 'Supplier delivery delayed',
  },

  {
    severity: 'MEDIUM',
    message: 'QC anomaly pattern detected',
  },

  {
    severity: 'LOW',
    message: 'Machine utilization dropping',
  },
]

function getColor(level: string) {
  switch (level) {
    case 'CRITICAL':
      return 'bg-red-500'

    case 'HIGH':
      return 'bg-orange-500'

    case 'MEDIUM':
      return 'bg-cyan-500'

    default:
      return 'bg-zinc-500'
  }
}

export function GlobalAlertPanel() {
  return (
    <div
      className="
        rounded-2xl
        border
        border-red-500/20
        bg-zinc-900
        p-6
      "
    >
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-red-400">
          Global Alerts
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Operational risk monitoring
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {alerts.map((alert, index) => (
          <div
            key={index}
            className="
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div className="flex items-center gap-3">
              <div
                className={`
                  rounded-full
                  px-3
                  py-1
                  text-xs
                  text-white
                  ${getColor(alert.severity)}
                `}
              >
                {alert.severity}
              </div>

              <div className="text-sm text-white">
                {alert.message}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
