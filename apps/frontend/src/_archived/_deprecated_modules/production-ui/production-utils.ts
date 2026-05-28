export function asProductionList<T>(
  value:
    | T[]
    | {
        data: T[]
      }
    | undefined,
) {
  if (!value) return []

  return Array.isArray(value) ? value : value.data
}

export function stageTone(status: string) {
  if (status === 'COMPLETED') return 'success'
  if (status === 'IN_PROGRESS') return 'info'
  if (status === 'BLOCKED') return 'danger'
  if (status === 'READY') return 'warning'

  return 'neutral'
}
