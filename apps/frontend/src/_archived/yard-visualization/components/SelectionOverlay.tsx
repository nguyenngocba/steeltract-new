import {
  useMemo,
} from 'react'

import {
  worldToScreen,
} from '../renderer/viewport-manager'

import type {
  YardSelectionState,
  YardViewportState,
  YardWorldSlot,
} from '../renderer/yard-visualization.types'

interface SelectionOverlayProps {
  selection: YardSelectionState
  slots: YardWorldSlot[]
  viewport: YardViewportState
}

export function SelectionOverlay({
  selection,
  slots,
  viewport,
}: SelectionOverlayProps) {
  const slot = useMemo(
    () =>
      slots.find(
        (item) =>
          item.id === selection.hoveredSlotId ||
          item.id === selection.selectedSlotId,
      ),
    [
      selection.hoveredSlotId,
      selection.selectedSlotId,
      slots,
    ],
  )

  if (!slot) {
    return null
  }

  const point = worldToScreen(
    slot.x + slot.width / 2,
    slot.y,
    viewport,
  )

  return (
    <div
      className="absolute z-20 min-w-56 rounded-lg border border-cyan-400/30 bg-zinc-950/90 px-3 py-2 text-xs text-zinc-200 shadow-xl backdrop-blur"
      style={{
        left: Math.min(
          Math.max(point.x + 12, 8),
          Math.max(viewport.width - 190, 8),
        ),
        top: Math.min(
          Math.max(point.y - 12, 8),
          Math.max(viewport.height - 98, 8),
        ),
      }}
    >
      <div className="font-semibold text-white">
        {slot.code}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-900">
        <div
          className={
            slot.occupancy >= 0.85
              ? 'h-full rounded-full bg-red-400'
              : slot.occupancy >= 0.65
                ? 'h-full rounded-full bg-amber-400'
                : 'h-full rounded-full bg-cyan-400'
          }
          style={{
            width: `${Math.min(slot.occupancy * 100, 100)}%`,
          }}
        />
      </div>
      <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-zinc-400">
        <span>Status</span>
        <span className="text-right text-zinc-200">
          {slot.status}
        </span>
        <span>Stack</span>
        <span className="text-right text-zinc-200">
          {slot.stackLevel}/{slot.maxStackLevel}
        </span>
        <span>Occupancy</span>
        <span className="text-right text-zinc-200">
          {Math.round(slot.occupancy * 100)}%
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button className="rounded border border-zinc-700 px-2 py-1 text-left text-[11px] text-zinc-300 hover:border-cyan-500/40 hover:text-white">
          Move item
        </button>
        <button className="rounded border border-zinc-700 px-2 py-1 text-left text-[11px] text-zinc-300 hover:border-cyan-500/40 hover:text-white">
          Trace stack
        </button>
      </div>
    </div>
  )
}
