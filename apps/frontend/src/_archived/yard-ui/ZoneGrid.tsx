import {
  EmptyState,
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'
import { SlotCard } from './SlotCard'
import {
  statusTone,
} from './yard-utils'

import type {
  YardZone,
} from './yard.types'

interface ZoneGridProps {
  zones: YardZone[]
}

export function ZoneGrid({
  zones,
}: ZoneGridProps) {
  if (zones.length === 0) {
    return (
      <EmptyState
        title="No yard zones"
        description="Create zones and slots before rendering yard occupancy."
      />
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {zones.map((zone) => (
        <SectionCard
          key={zone.id}
          title={`${zone.code} - ${zone.name}`}
          actions={
            <StatusBadge
              tone={statusTone(zone.status)}
            >
              {zone.status}
            </StatusBadge>
          }
        >
          <div className="mb-4 grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-zinc-500">
                Origin
              </p>
              <p className="font-medium text-zinc-100">
                {zone.originX}, {zone.originY}
              </p>
            </div>
            <div>
              <p className="text-zinc-500">
                Size
              </p>
              <p className="font-medium text-zinc-100">
                {zone.width} x {zone.height}
              </p>
            </div>
            <div>
              <p className="text-zinc-500">
                Slots
              </p>
              <p className="font-medium text-zinc-100">
                {zone.slots?.length ?? 0}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(zone.slots ?? []).slice(0, 12).map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
              />
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  )
}
