import {
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'

import type {
  WorkCenter,
} from './production.types'

interface WorkCenterCardsProps {
  workCenters?: WorkCenter[]
}

export function WorkCenterCards({
  workCenters = [],
}: WorkCenterCardsProps) {
  return (
    <SectionCard
      title="Work Centers"
      description="Capacity and machine grouping"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {workCenters.map((center) => (
          <div
            key={center.id}
            className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-white">
                  {center.name}
                </p>
                <p className="text-xs text-zinc-500">
                  {center.code}
                </p>
              </div>
              <StatusBadge tone="success">
                {center.status}
              </StatusBadge>
            </div>

            <p className="mt-4 text-sm text-zinc-400">
              Capacity{' '}
              {center.capacityPerDay ?? 'not set'}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Machines {center.machines?.length ?? 0}
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
