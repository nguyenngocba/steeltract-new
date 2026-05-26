import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

export interface OperationalWorkspaceFilters {
  search: string
  status?: string
  site?: string
  shift?: string
  timeRange?: string
  quickFilter?: string
}

interface UseOperationalWorkspaceStateOptions<TSelection> {
  workspaceId: string
  defaultFilters?: Partial<OperationalWorkspaceFilters>
  persistFilters?: boolean
  selectionKey?: (selection: TSelection) => string
}

const defaultWorkspaceFilters: OperationalWorkspaceFilters = {
  search: '',
  status: 'all',
  site: 'all',
  shift: 'current',
  timeRange: '24h',
  quickFilter: 'all',
}

function readPersistedFilters(
  workspaceId: string,
): Partial<OperationalWorkspaceFilters> {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(
      `steeltrack.workspace.${workspaceId}.filters`,
    )

    return raw
      ? (JSON.parse(raw) as Partial<OperationalWorkspaceFilters>)
      : {}
  } catch {
    return {}
  }
}

export function useOperationalWorkspaceState<TSelection>({
  workspaceId,
  defaultFilters,
  persistFilters = true,
  selectionKey,
}: UseOperationalWorkspaceStateOptions<TSelection>) {
  const initialFilters = useMemo(
    () => ({
      ...defaultWorkspaceFilters,
      ...(persistFilters ? readPersistedFilters(workspaceId) : {}),
      ...defaultFilters,
    }),
    [defaultFilters, persistFilters, workspaceId],
  )
  const [filters, setFilters] =
    useState<OperationalWorkspaceFilters>(initialFilters)
  const [selectedEntity, setSelectedEntity] =
    useState<TSelection | null>(null)
  const [contextOpen, setContextOpen] = useState(false)
  const selectedId = selectedEntity
    ? (selectionKey?.(selectedEntity) ?? String(selectedEntity))
    : null

  useEffect(() => {
    if (!persistFilters || typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(
      `steeltrack.workspace.${workspaceId}.filters`,
      JSON.stringify(filters),
    )
  }, [filters, persistFilters, workspaceId])

  const updateFilter = useCallback(
    <TKey extends keyof OperationalWorkspaceFilters>(
      key: TKey,
      value: OperationalWorkspaceFilters[TKey],
    ) => {
      setFilters((current) => ({
        ...current,
        [key]: value,
      }))
    },
    [],
  )

  const resetFilters = useCallback(() => {
    setFilters({
      ...defaultWorkspaceFilters,
      ...defaultFilters,
    })
  }, [defaultFilters])

  const selectEntity = useCallback((entity: TSelection) => {
    setSelectedEntity(entity)
    setContextOpen(true)
  }, [])

  const clearSelection = useCallback(() => {
    setContextOpen(false)
    setSelectedEntity(null)
  }, [])

  return {
    workspaceId,
    filters,
    updateFilter,
    resetFilters,
    selectedEntity,
    selectedId,
    selectEntity,
    clearSelection,
    contextOpen,
    setContextOpen,
  }
}
