export interface Paginated<T> {
  data: T[]
}

export function asList<T>(
  value: T[] | Paginated<T> | undefined,
) {
  if (!value) {
    return []
  }

  return Array.isArray(value)
    ? value
    : value.data
}
