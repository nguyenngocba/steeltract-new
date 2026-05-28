import type {
  Tone,
} from '../../components/ui-system'

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

export function qcStatusTone(
  status: string,
): Tone {
  if (
    [
      'PASSED',
      'APPROVED',
      'PASS',
      'CLOSED',
      'VERIFIED',
    ].includes(status)
  ) {
    return 'success'
  }

  if (
    [
      'IN_PROGRESS',
      'READY',
      'UNDER_REVIEW',
      'PENDING',
    ].includes(status)
  ) {
    return 'info'
  }

  if (
    [
      'REWORK_REQUIRED',
      'OPEN',
      'CORRECTIVE_ACTION_ASSIGNED',
      'MEDIUM',
      'HIGH',
    ].includes(status)
  ) {
    return 'warning'
  }

  if (
    [
      'FAILED',
      'REJECTED',
      'FAIL',
      'CRITICAL',
    ].includes(status)
  ) {
    return 'danger'
  }

  return 'neutral'
}
