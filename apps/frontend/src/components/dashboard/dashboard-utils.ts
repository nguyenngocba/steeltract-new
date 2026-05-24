export function asList<T>(
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

export function formatDateTime(value?: string | null) {
  if (!value) return ''

  return new Date(value).toLocaleString()
}
