import {
  Map,
} from 'lucide-react'

import {
  ChartContainer,
  EmptyState,
  StatusBadge,
} from '../../components/ui-system'
import {
  slotOccupancyPercent,
  statusTone,
} from './yard-utils'

import type {
  YardSlot,
  YardZone,
} from './yard.types'

interface YardMapProps {
  zones: YardZone[]
  slots?: YardSlot[]
}

export function YardMap({
  zones,
  slots,
}: YardMapProps) {
  const renderedSlots =
    slots ??
    zones.flatMap(
      (zone) => zone.slots ?? [],
    )

  if (
    zones.length === 0 ||
    renderedSlots.length === 0
  ) {
    return (
      <ChartContainer title="Yard map">
        <EmptyState
          title="No spatial layout"
          description="Coordinate slots will appear here after yard setup."
        />
      </ChartContainer>
    )
  }

  const maxX =
    Math.max(
      ...renderedSlots.map(
        (slot) => slot.x + slot.width,
      ),
      1,
    ) || 1
  const maxY =
    Math.max(
      ...renderedSlots.map(
        (slot) => slot.y + slot.height,
      ),
      1,
    ) || 1

  return (
    <ChartContainer title="Yard map">
      <div className="relative min-h-80 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
        <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-sm text-zinc-300">
          <Map className="h-4 w-4 text-cyan-300" />
          Backend spatial truth
        </div>

        {renderedSlots.map((slot) => {
          const left =
            (slot.x / maxX) * 100
          const top =
            (slot.y / maxY) * 100
          const width =
            Math.max(
              (slot.width / maxX) * 100,
              8,
            )
          const height =
            Math.max(
              (slot.height / maxY) * 100,
              8,
            )

          return (
            <div
              key={slot.id}
              className="absolute rounded-md border border-zinc-700 bg-zinc-900 p-2 shadow-sm"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${width}%`,
                height: `${height}%`,
              }}
            >
              <div className="flex h-full min-h-16 flex-col justify-between gap-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate text-xs font-medium text-white">
                    {slot.code}
                  </span>
                  <StatusBadge
                    tone={statusTone(
                      slot.status,
                    )}
                  >
                    {slot.status}
                  </StatusBadge>
                </div>

                <div className="h-1 rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-cyan-400"
                    style={{
                      width: `${slotOccupancyPercent(slot)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ChartContainer>
  )
}
