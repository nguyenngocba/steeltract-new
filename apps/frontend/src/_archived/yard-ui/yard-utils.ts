import type {
  Tone,
} from '../../components/ui-system'
import type {
  CraneStatus,
  YardSlot,
  YardSlotStatus,
  YardZoneStatus,
} from './yard.types'

export function normalizeList<T>(
  value:
    | T[]
    | {
        data: T[]
      }
    | undefined,
) {
  if (!value) {
    return []
  }

  return Array.isArray(value) ? value : value.data
}

export function slotOccupancyPercent(
  slot: YardSlot,
) {
  if (!slot.maxStackLevel) {
    return 0
  }

  return Math.round(
    (slot.currentStackLevel /
      slot.maxStackLevel) *
      100,
  )
}

export function statusTone(
  status:
    | YardSlotStatus
    | YardZoneStatus
    | CraneStatus
    | string,
): Tone {
  if (
    [
      'AVAILABLE',
      'ACTIVE',
      'COMPLETED',
    ].includes(status)
  ) {
    return 'success'
  }

  if (
    [
      'OCCUPIED',
      'ASSIGNED',
      'RESERVED',
    ].includes(status)
  ) {
    return 'info'
  }

  if (
    [
      'MAINTENANCE',
      'INACTIVE',
    ].includes(status)
  ) {
    return 'warning'
  }

  if (
    [
      'BLOCKED',
      'OFFLINE',
      'HIGH',
    ].includes(status)
  ) {
    return 'danger'
  }

  return 'neutral'
}
