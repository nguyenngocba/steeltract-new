import {
  Play,
} from 'lucide-react'

import type {
  SimulationMode,
  SimulationScenarioId,
} from './simulation.types'

interface ScenarioRunnerProps {
  scenarios: SimulationScenarioId[]
  selectedScenario: SimulationScenarioId
  speed: number
  mode: SimulationMode
  busy?: boolean
  onScenarioChange: (
    scenario: SimulationScenarioId,
  ) => void
  onRun: () => void
}

export function ScenarioRunner({
  scenarios,
  selectedScenario,
  speed,
  mode,
  busy,
  onScenarioChange,
  onRun,
}: ScenarioRunnerProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end">
      <label className="min-w-0 flex-1 text-sm text-zinc-300">
        Scenario
        <select
          value={selectedScenario}
          onChange={(event) =>
            onScenarioChange(
              event.target
                .value as SimulationScenarioId,
            )
          }
          className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white"
        >
          {scenarios.map((scenario) => (
            <option
              key={scenario}
              value={scenario}
            >
              {scenario}
            </option>
          ))}
        </select>
      </label>
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300">
        {speed}x / {mode}
      </div>
      <button
        type="button"
        onClick={onRun}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Play className="h-4 w-4" />
        Run once
      </button>
    </div>
  )
}
