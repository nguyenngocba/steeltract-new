const favoritesKey =
  'steeltrack.navigation.favorites'
const recentKey =
  'steeltrack.navigation.recent'

export function readStoredList(key: string) {
  try {
    const raw = window.localStorage.getItem(key)

    return raw
      ? (JSON.parse(raw) as string[])
      : []
  } catch {
    return []
  }
}

export function writeStoredList(
  key: string,
  value: string[],
) {
  window.localStorage.setItem(
    key,
    JSON.stringify(value),
  )
}

export function readFavoriteIds() {
  return readStoredList(favoritesKey)
}

export function writeFavoriteIds(
  ids: string[],
) {
  writeStoredList(favoritesKey, ids)
}

export function readRecentIds() {
  return readStoredList(recentKey)
}

export function writeRecentIds(ids: string[]) {
  writeStoredList(recentKey, ids.slice(0, 8))
}
