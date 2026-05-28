import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from 'lucide-react'
import {
  useState,
} from 'react'

import {
  StatusBadge,
  Timeline,
} from '../../components/ui-system'

import type {
  SimulationStatus,
} from './simulation.types'

interface RealtimeScenarioTimelineProps {
  status?: SimulationStatus
}

export function RealtimeScenarioTimeline({
  status,
}: RealtimeScenarioTimelineProps) {
  const [playing, setPlaying] = useState(
    status?.running ?? false,
  )
  const [position, setPosition] = useState(0)
  const maxPosition = Math.max(
    (status?.tick ?? 0) % 12,
    1,
  )

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              replay ribbon
            </p>
            <p className="mt-1 text-sm font-medium text-white">
              Shift playback foundation / tick {status?.tick ?? 0}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setPosition((current) =>
                  Math.max(current - 1, 0),
                )
              }
              className="rounded-md border border-zinc-700 p-1.5 text-zinc-300"
              aria-label="Replay back"
            >
              <SkipBack className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() =>
                setPlaying((current) => !current)
              }
              className="rounded-md border border-cyan-500/40 bg-cyan-500/10 p-1.5 text-cyan-200"
              aria-label="Replay play"
            >
              {playing ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() =>
                setPosition((current) =>
                  Math.min(current + 1, maxPosition),
                )
              }
              className="rounded-md border border-zinc-700 p-1.5 text-zinc-300"
              aria-label="Replay forward"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </button>
            <StatusBadge tone={playing ? 'success' : 'neutral'}>
              {playing ? 'playing' : 'paused'}
            </StatusBadge>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={maxPosition}
          value={position}
          onChange={(event) =>
            setPosition(Number(event.target.value))
          }
          className="mt-3 w-full accent-cyan-400"
        />
      </div>
      <Timeline
        items={[
          {
            id: 'bootstrap',
            title: status?.bootstrapped
              ? 'Demo ecosystem ready'
              : 'Waiting for bootstrap',
            description:
              'Seed suppliers, inventory, production, QC, yard and analytics.',
            tone: status?.bootstrapped
              ? 'success'
              : 'neutral',
          },
          {
            id: 'scenario',
            title:
              status?.scenarioId ??
              'No active scenario',
            description:
              status?.lastEvent ??
              'Run a scenario to emit live domain events.',
            tone: status?.running
              ? 'info'
              : 'neutral',
          },
          {
            id: 'snapshot-step',
            title: `Historical snapshot step ${position}`,
            description:
              'Timeline scrubber foundation for shift replay and operational reconstruction.',
            tone: playing ? 'info' : 'neutral',
          },
        ]}
      />
    </div>
  )
}
