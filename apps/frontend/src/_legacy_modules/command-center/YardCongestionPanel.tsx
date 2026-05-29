import {
  ChartContainer,
  StatusBadge,
} from '../../components/ui-system'

interface YardCongestionPanelProps {
  occupancyRate?: number
  occupiedSlots?: number
  totalSlots?: number
}

export function YardCongestionPanel({
  occupancyRate = 0,
  occupiedSlots = 0,
  totalSlots = 0,
}: YardCongestionPanelProps) {
  return (
    <ChartContainer title="Yard congestion">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-4xl font-semibold text-white">
            {occupancyRate}%
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            {occupiedSlots}/{totalSlots} slots occupied
          </p>
        </div>
        <StatusBadge
          tone={
            occupancyRate > 85
              ? 'danger'
              : occupancyRate > 70
                ? 'warning'
                : 'success'
          }
        >
          {occupancyRate > 85
            ? 'congested'
            : 'normal'}
        </StatusBadge>
      </div>
      <div className="mt-6 h-3 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-cyan-400"
          style={{
            width: `${Math.min(occupancyRate, 100)}%`,
          }}
        />
      </div>
    </ChartContainer>
  )
}
