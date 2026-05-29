import {
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from 'lucide-react'
import {
  useMemo,
  useState,
} from 'react'

import {
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'

import type {
  SimulationStatus,
} from '../simulation-ui'

interface DigitalTwinReplayPanelProps {
  status?: SimulationStatus
  events: Array<{
    id: string
    title?: string
    message?: string
    event?: string
    description?: string
    domain?: string
  }>
}

function formatClock(status?: SimulationStatus) {
  if (!status?.startedAt) {
    return '00:00:00'
  }

  const startedAt = new Date(status.startedAt).getTime()
  const updatedAt = status.updatedAt
    ? new Date(status.updatedAt).getTime()
    : Date.now()
  const elapsed = Math.max(
    Math.floor((updatedAt - startedAt) / 1000),
    0,
  )
  const hours = String(
    Math.floor(elapsed / 3600),
  ).padStart(2, '0')
  const minutes = String(
    Math.floor((elapsed % 3600) / 60),
  ).padStart(2, '0')
  const seconds = String(elapsed % 60).padStart(2, '0')

  return `${hours}:${minutes}:${seconds}`
}

export function DigitalTwinReplayPanel({
  status,
  events,
}: DigitalTwinReplayPanelProps) {
  const [playback, setPlayback] =
    useState(status?.running ?? false)
  const [position, setPosition] =
    useState(0)
  const clock = formatClock(status)
  const progress = Math.min(
    ((status?.tick ?? 0) % 100),
    100,
  )
  const replayEvents = useMemo(
    () => events.slice(0, 8),
    [events],
  )

  return (
    <SectionCard
      title="Digital twin replay"
      description="Simulation clock, shift replay foundation, event scrubber and historical snapshot stepping."
      actions={
        <div className="flex flex-wrap gap-2">
          <StatusBadge
            tone={status?.running ? 'success' : 'neutral'}
          >
            {status?.running ? 'live twin' : 'replay ready'}
          </StatusBadge>
          <StatusBadge tone="info">
            {status?.speed ?? 1}x
          </StatusBadge>
        </div>
      }
    >
      <div className="grid gap-3 xl:grid-cols-[220px_1fr]">
        <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-4 shadow-[0_0_28px_rgba(34,211,238,0.08)]">
          <p className="text-xs uppercase tracking-wide text-cyan-200">
            simulation clock
          </p>
          <p className="mt-2 font-mono text-3xl font-semibold text-white">
            {clock}
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            tick {status?.tick ?? 0} / {status?.mode ?? 'deterministic'}
          </p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-900">
            <div
              className="h-full rounded-full bg-cyan-300 transition-all duration-500"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setPosition((current) =>
                    Math.max(current - 1, 0),
                  )
                }
                className="rounded-md border border-zinc-700 p-2 text-zinc-300 hover:text-white"
                aria-label="Step back"
              >
                <SkipBack className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setPlayback((current) => !current)
                }
                className="rounded-md border border-cyan-500/40 bg-cyan-500/10 p-2 text-cyan-200"
                aria-label="Toggle replay"
              >
                {playback ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() =>
                  setPosition((current) =>
                    Math.min(
                      current + 1,
                      Math.max(replayEvents.length - 1, 0),
                    ),
                  )
                }
                className="rounded-md border border-zinc-700 p-2 text-zinc-300 hover:text-white"
                aria-label="Step forward"
              >
                <SkipForward className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPosition(0)}
                className="rounded-md border border-zinc-700 p-2 text-zinc-300 hover:text-white"
                aria-label="Reset replay"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
            <StatusBadge tone={playback ? 'success' : 'neutral'}>
              {playback ? 'playing' : 'paused'}
            </StatusBadge>
          </div>

          <input
            type="range"
            min={0}
            max={Math.max(replayEvents.length - 1, 0)}
            value={position}
            onChange={(event) =>
              setPosition(Number(event.target.value))
            }
            className="mt-4 w-full accent-cyan-400"
          />

          <div className="mt-3 grid gap-2">
            {replayEvents.map((event, index) => (
              <div
                key={event.id}
                className={
                  index === position
                    ? 'rounded-md border border-cyan-500/40 bg-cyan-500/10 px-3 py-2'
                    : 'rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2'
                }
              >
                <p className="truncate text-sm font-medium text-white">
                  {event.title ??
                    event.message ??
                    event.event ??
                    event.id}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {event.description ??
                    event.domain ??
                    'domain event'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
