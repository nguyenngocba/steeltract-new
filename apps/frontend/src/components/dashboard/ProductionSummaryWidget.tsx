import {
  ChartContainer,
  EmptyState,
  StatusBadge,
} from '../ui-system'

export function ProductionSummaryWidget() {
  return (
    <ChartContainer title="Production Summary">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-400">
            Manufacturing metrics
          </p>
          <StatusBadge tone="neutral">
            INTEGRATION SLOT
          </StatusBadge>
        </div>

        <EmptyState
          title="Production analytics pending"
          description="This widget is reserved for production throughput, QC pass rate, and station bottlenecks once the analytics engine exposes those metrics."
        />
      </div>
    </ChartContainer>
  )
}
