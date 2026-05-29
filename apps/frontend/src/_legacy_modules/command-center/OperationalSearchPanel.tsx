import {
  useMemo,
  useState,
} from 'react'
import {
  useQuery,
} from '@tanstack/react-query'

import {
  SearchInput,
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'
import { api } from '../../lib/api'
import {
  useComponentsQuery,
} from '../../hooks/query/useComponentQueries'
import {
  useProjectsQuery,
} from '../../hooks/query/useProjectQueries'
import {
  useProductionOrdersQuery,
} from '../production-ui'
import {
  useQcInspectionsQuery,
} from '../qc-ui'
import {
  useYardSearchQuery,
} from '../yard'
import {
  useWorkflowInstancesQuery,
} from '../../lib/workflow'

interface SupplierScore {
  id: string
  supplierName: string
  overall?: number
}

interface SearchItem {
  id: string
  type: string
  label: string
  detail?: string
  tone:
    | 'neutral'
    | 'info'
    | 'success'
    | 'warning'
    | 'danger'
}

function fuzzyMatch(
  value: string,
  query: string,
) {
  const normalizedValue =
    value.toLowerCase()
  const normalizedQuery =
    query.toLowerCase()

  if (
    normalizedValue.includes(normalizedQuery)
  ) {
    return true
  }

  let queryIndex = 0

  for (const char of normalizedValue) {
    if (
      char === normalizedQuery[queryIndex]
    ) {
      queryIndex += 1
    }

    if (
      queryIndex === normalizedQuery.length
    ) {
      return true
    }
  }

  return false
}

function asList<T>(
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

export function OperationalSearchPanel() {
  const [query, setQuery] = useState('')
  const [recent, setRecent] = useState<SearchItem[]>(
    [],
  )
  const projectsQuery = useProjectsQuery()
  const componentsQuery = useComponentsQuery()
  const productionQuery =
    useProductionOrdersQuery({
      limit: 25,
      page: 1,
    })
  const qcQuery = useQcInspectionsQuery({
    limit: 25,
    page: 1,
  })
  const workflowQuery =
    useWorkflowInstancesQuery({
      limit: 25,
      page: 1,
    })
  const yardQuery = useYardSearchQuery({
    limit: 25,
    page: 1,
    q: query,
  })
  const suppliersQuery = useQuery({
    queryKey: ['supplier-score', 'operations-search'],
    queryFn: async () => {
      const response =
        await api.get<SupplierScore[]>(
          '/supplier-score',
        )
      return response.data
    },
  })

  const items = useMemo<SearchItem[]>(() => {
    const projects = asList(projectsQuery.data).map(
      (project) => ({
        id: project.id,
        type: 'project',
        label: project.name,
        detail: project.code,
        tone: 'info' as const,
      }),
    )
    const components = asList(
      componentsQuery.data,
    ).map((component) => ({
      id: component.id,
      type: 'component',
      label: component.name,
      detail: component.code,
      tone: 'neutral' as const,
    }))
    const production = asList(
      productionQuery.data,
    ).map((order) => ({
      id: order.id,
      type: 'production',
      label: order.orderNo,
      detail: order.title,
      tone:
        order.status === 'DELAYED'
          ? ('warning' as const)
          : ('success' as const),
    }))
    const qc = asList(qcQuery.data).map(
      (inspection) => ({
        id: inspection.id,
        type: 'qc',
        label: inspection.inspectionNo,
        detail: inspection.status,
        tone:
          inspection.status === 'FAILED' ||
          inspection.status === 'REWORK_REQUIRED'
            ? ('danger' as const)
            : ('info' as const),
      }),
    )
    const workflow = asList(
      workflowQuery.data,
    ).map((item) => ({
      id: item.id,
      type: 'workflow',
      label: item.referenceModule,
      detail: item.status,
      tone: 'warning' as const,
    }))
    const yard = asList(yardQuery.data).map(
      (placement: any) => ({
        id: placement.id,
        type: 'yard slot',
        label: placement.itemCode,
        detail:
          placement.slot?.code ??
          placement.slotId,
        tone: placement.removedAt
          ? ('neutral' as const)
          : ('success' as const),
      }),
    )
    const suppliers = (
      suppliersQuery.data ?? []
    ).map((supplier) => ({
      id: supplier.id,
      type: 'supplier',
      label: supplier.supplierName,
      detail:
        supplier.overall !== undefined
          ? `${supplier.overall}% score`
          : undefined,
      tone: 'info' as const,
    }))

    const allItems = [
      ...projects,
      ...components,
      ...production,
      ...qc,
      ...workflow,
      ...yard,
      ...suppliers,
    ]
    const needle = query.trim().toLowerCase()

    if (!needle) {
      return [
        ...recent,
        ...allItems.filter(
          (item) =>
            !recent.some(
              (recentItem) =>
                recentItem.id === item.id &&
                recentItem.type === item.type,
            ),
        ),
      ].slice(0, 12)
    }

    return allItems
      .filter((item) =>
        fuzzyMatch(
          `${item.type} ${item.label} ${item.detail ?? ''}`,
          needle,
        ),
      )
      .slice(0, 20)
  }, [
    componentsQuery.data,
    projectsQuery.data,
    productionQuery.data,
    qcQuery.data,
    query,
    recent,
    suppliersQuery.data,
    workflowQuery.data,
    yardQuery.data,
  ])
  const grouped = useMemo(
    () =>
      items.reduce<
        Record<string, SearchItem[]>
      >((groups, item) => {
        groups[item.type] = [
          ...(groups[item.type] ?? []),
          item,
        ]
        return groups
      }, {}),
    [items],
  )
  const openItem = (item: SearchItem) => {
    setRecent((current) => [
      item,
      ...current.filter(
        (recentItem) =>
          recentItem.id !== item.id ||
          recentItem.type !== item.type,
      ),
    ].slice(0, 5))
  }

  return (
    <SectionCard
      title="Operational search"
      description="Cross-domain search foundation for orders, components, suppliers, projects, QC, workflows and yard slots."
      actions={
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search operations"
        />
      }
    >
      <div className="grid gap-3">
        {Object.entries(grouped).map(
          ([type, groupItems]) => (
            <div key={type}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {type}
                </p>
                <StatusBadge tone="neutral">
                  {groupItems.length}
                </StatusBadge>
              </div>
              <div className="grid gap-2">
                {groupItems.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/70 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {item.label}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {item.detail ??
                          'shortcut ready'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge tone={item.tone}>
                        {item.type}
                      </StatusBadge>
                      <button
                        type="button"
                        onClick={() => openItem(item)}
                        className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:border-cyan-500/40 hover:text-white"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ),
        )}
      </div>
    </SectionCard>
  )
}
