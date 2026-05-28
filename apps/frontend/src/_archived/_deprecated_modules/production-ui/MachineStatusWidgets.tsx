import {
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'

import type {
  Machine,
} from './production.types'

interface MachineStatusWidgetsProps {
  machines?: Machine[]
}

function machineTone(status: string) {
  if (status === 'AVAILABLE') return 'success'
  if (status === 'RUNNING') return 'info'
  if (status === 'MAINTENANCE') return 'warning'
  return 'danger'
}

export function MachineStatusWidgets({
  machines = [],
}: MachineStatusWidgetsProps) {
  return (
    <SectionCard
      title="Machine Status"
      description="Utilization placeholders for future IoT telemetry"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {machines.map((machine) => (
          <div
            key={machine.id}
            className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium text-white">
                {machine.name}
              </p>
              <StatusBadge tone={machineTone(machine.status)}>
                {machine.status}
              </StatusBadge>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {machine.code}
            </p>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full bg-cyan-500"
                style={{
                  width: `${machine.utilization}%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              Utilization {machine.utilization}%
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
