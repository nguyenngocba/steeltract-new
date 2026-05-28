import { Layers } from 'lucide-react'

import {
  StatusBadge,
} from '../../components/ui-system'
import {
  slotOccupancyPercent,
  statusTone,
} from './yard-utils'

import type {
  YardSlot,
} from './yard.types'

interface SlotCardProps {
  slot: YardSlot
}

export function SlotCard({
  slot,
}: SlotCardProps) {
  const occupancy =
    slotOccupancyPercent(slot)

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">
            {slot.code}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            x{slot.x} y{slot.y}
          </p>
        </div>

        <StatusBadge
          tone={statusTone(slot.status)}
        >
          {slot.status}
        </StatusBadge>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
        <span className="inline-flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" />
          {slot.currentStackLevel}/
          {slot.maxStackLevel}
        </span>
        <span>{occupancy}%</span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-cyan-400"
          style={{
            width: `${occupancy}%`,
          }}
        />
      </div>
    </div>
  )
}
