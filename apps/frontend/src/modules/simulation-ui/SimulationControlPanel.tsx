import {
  Pause,
  Play,
  RefreshCcw,
  RotateCcw,
} from 'lucide-react'
import {
  useState,
} from 'react'

import {
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'
import { LiveFactoryStatus } from './LiveFactoryStatus'
import { RealtimeScenarioTimeline } from './RealtimeScenarioTimeline'
import { ScenarioRunner } from './ScenarioRunner'
import { SimulationMetrics } from './SimulationMetrics'
import {
  useBootstrapSimulationMutation,
  useResetSimulationMutation,
  useRunSimulationScenarioMutation,
  useSimulationStatusQuery,
  useStartSimulationMutation,
  useStopSimulationMutation,
} from './simulation-hooks'

import type {
  SimulationMode,
  SimulationScenarioId,
} from './simulation.types'

const defaultScenarios: SimulationScenarioId[] = [
  'normal-operations',
  'congestion',
  'qc-failure-spike',
  'delayed-production',
  'high-throughput-day',
  'machine-downtime',
]

export function SimulationControlPanel() {
  const statusQuery = useSimulationStatusQuery()
  const bootstrapMutation =
    useBootstrapSimulationMutation()
  const startMutation =
    useStartSimulationMutation()
  const stopMutation =
    useStopSimulationMutation()
  const resetMutation =
    useResetSimulationMutation()
  const runScenarioMutation =
    useRunSimulationScenarioMutation()
  const [scenario, setScenario] =
    useState<SimulationScenarioId>(
      'normal-operations',
    )
  const [mode, setMode] =
    useState<SimulationMode>('deterministic')
  const [speed, setSpeed] = useState(1)

  const status = statusQuery.data
  const scenarios =
    status?.scenarios ?? defaultScenarios
  const busy =
    bootstrapMutation.isPending ||
    startMutation.isPending ||
    stopMutation.isPending ||
    resetMutation.isPending ||
    runScenarioMutation.isPending

  return (
    <SectionCard
      title="Factory simulation"
      description="Drive real demo data, domain events and realtime command center updates."
      actions={
        <StatusBadge
          tone={
            status?.running ? 'success' : 'neutral'
          }
        >
          {status?.running ? 'live' : 'idle'}
        </StatusBadge>
      }
    >
      <div className="space-y-4">
        <LiveFactoryStatus status={status} />

        <div className="grid gap-3 md:grid-cols-[1fr_160px_160px]">
          <label className="text-sm text-zinc-300">
            Mode
            <select
              value={mode}
              onChange={(event) =>
                setMode(
                  event.target.value as SimulationMode,
                )
              }
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white"
            >
              <option value="deterministic">
                deterministic
              </option>
              <option value="randomized">
                randomized
              </option>
            </select>
          </label>
          <label className="text-sm text-zinc-300">
            Speed
            <input
              type="number"
              min={0.25}
              max={20}
              step={0.25}
              value={speed}
              onChange={(event) =>
                setSpeed(Number(event.target.value))
              }
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white"
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              bootstrapMutation.mutate({
                reset: false,
                mode,
              })
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-100 disabled:opacity-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Bootstrap
          </button>
        </div>

        <ScenarioRunner
          scenarios={scenarios}
          selectedScenario={scenario}
          speed={speed}
          mode={mode}
          busy={busy}
          onScenarioChange={setScenario}
          onRun={() =>
            runScenarioMutation.mutate({
              scenarioId: scenario,
              payload: { speed, mode },
            })
          }
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              startMutation.mutate({
                scenarioId: scenario,
                speed,
                mode,
              })
            }
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            Start
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => stopMutation.mutate()}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-100 disabled:opacity-50"
          >
            <Pause className="h-4 w-4" />
            Stop
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => resetMutation.mutate()}
            className="inline-flex items-center gap-2 rounded-lg border border-red-800/70 px-3 py-2 text-sm text-red-200 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>

        <SimulationMetrics status={status} />
        <RealtimeScenarioTimeline status={status} />
      </div>
    </SectionCard>
  )
}
