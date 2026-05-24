import {
  ChartContainer,
  EmptyState,
  StatusBadge,
} from '../ui-system'

import type {
  ConstructionProgress,
} from '../../services/api/dashboard.api'

interface ProjectProgressWidgetProps {
  progress: ConstructionProgress | null
}

export function ProjectProgressWidget({
  progress,
}: ProjectProgressWidgetProps) {
  if (!progress) {
    return (
      <ChartContainer title="Project Progress">
        <EmptyState
          title="No progress data"
          description="Component installation progress will appear when project component data is available."
        />
      </ChartContainer>
    )
  }

  const segments = [
    {
      label: 'Installed',
      value: progress.installed,
      color: 'bg-emerald-500',
    },
    {
      label: 'Delivered',
      value: progress.delivered,
      color: 'bg-cyan-500',
    },
    {
      label: 'Stock',
      value: progress.stock,
      color: 'bg-amber-500',
    },
  ]

  return (
    <ChartContainer title="Project Progress">
      <div className="flex flex-col gap-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-400">
              Installed components
            </p>
            <p className="mt-2 text-4xl font-semibold text-cyan-300">
              {progress.progress}%
            </p>
          </div>
          <StatusBadge tone="info">
            {`${progress.total} TOTAL`}
          </StatusBadge>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-cyan-500 transition-all"
            style={{
              width: `${progress.progress}%`,
            }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {segments.map((segment) => (
            <div
              key={segment.label}
              className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${segment.color}`}
                />
                <p className="text-xs text-zinc-400">
                  {segment.label}
                </p>
              </div>
              <p className="mt-2 text-xl font-semibold text-white">
                {segment.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </ChartContainer>
  )
}
