import {
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'
import {
  statusTone,
} from './yard-utils'

import type {
  Crane,
} from './yard.types'

interface CraneStatusPanelProps {
  cranes: Crane[]
}

export function CraneStatusPanel({
  cranes,
}: CraneStatusPanelProps) {
  return (
    <SectionCard title="Crane status">
      <div className="space-y-3">
        {cranes.map((crane) => (
          <div
            key={crane.id}
            className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">
                  {crane.code} - {crane.name}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  x{crane.currentX} y
                  {crane.currentY}
                </p>
              </div>
              <StatusBadge
                tone={statusTone(
                  crane.status,
                )}
              >
                {crane.status}
              </StatusBadge>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
              <span>Utilization</span>
              <span>{crane.utilization}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{
                  width: `${crane.utilization}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
