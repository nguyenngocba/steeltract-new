import {
  ChartContainer,
  EmptyState,
} from '../../components/ui-system'

import type {
  YardSnapshot,
} from './yard.types'

interface YardHeatmapProps {
  snapshot?: YardSnapshot
}

export function YardHeatmap({
  snapshot,
}: YardHeatmapProps) {
  const heatmap = snapshot?.heatmap ?? []

  if (heatmap.length === 0) {
    return (
      <ChartContainer title="Occupancy heatmap">
        <EmptyState
          title="No heatmap snapshot"
          description="Generate a yard snapshot to populate heatmap cells."
        />
      </ChartContainer>
    )
  }

  return (
    <ChartContainer title="Occupancy heatmap">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {heatmap.slice(0, 24).map((cell) => (
          <div
            key={cell.slotId}
            className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-medium text-white">
                {cell.code}
              </p>
              <span className="text-xs text-zinc-400">
                {Math.round(
                  cell.occupancy * 100,
                )}
                %
              </span>
            </div>

            <div className="mt-3 h-14 rounded-md bg-zinc-900">
              <div
                className="h-full rounded-md bg-cyan-400/70"
                style={{
                  opacity: Math.max(
                    cell.occupancy,
                    0.12,
                  ),
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </ChartContainer>
  )
}
