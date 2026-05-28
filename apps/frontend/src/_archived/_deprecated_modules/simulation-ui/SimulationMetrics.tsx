import type {
  SimulationStatus,
} from './simulation.types'

interface SimulationMetricsProps {
  status?: SimulationStatus
}

export function SimulationMetrics({
  status,
}: SimulationMetricsProps) {
  const metrics = [
    ['Scenario', status?.scenarioId ?? 'none'],
    ['Mode', status?.mode ?? 'deterministic'],
    ['Last event', status?.lastEvent ?? 'none'],
    ['Updated', status?.updatedAt ?? 'not yet'],
  ]

  return (
    <div className="grid gap-2 text-sm md:grid-cols-2">
      {metrics.map(([label, value]) => (
        <div
          key={label}
          className="rounded-lg bg-zinc-950/60 px-3 py-2"
        >
          <div className="text-xs text-zinc-500">
            {label}
          </div>
          <div className="mt-1 truncate text-zinc-100">
            {value}
          </div>
        </div>
      ))}
    </div>
  )
}
