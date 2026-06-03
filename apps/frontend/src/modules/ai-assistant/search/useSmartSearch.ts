import Fuse from 'fuse.js'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { getInventoryItems } from '@/modules/inventory/api/inventory.api'
import { productionApi } from '@/modules/production/api/production.api'
import { yardApi } from '@/modules/yard/services/api/yard.api'

type SearchableRecord = {
  id: string
  type: string
  title: string
  description: string
}

type InventoryItem = {
  id: string
  code: string
  name: string
  quantity?: number
  unit?: string
}

export function useSmartSearch(
  keyword: string
) {
  const { data: materials = [] } =
    useQuery({
      queryKey: ['smart-search', 'materials'],
      queryFn: getInventoryItems,
      refetchInterval: 10000,
    })
  const { data: components = [] } =
    useQuery({
      queryKey: ['smart-search', 'components'],
      queryFn: productionApi.components,
      refetchInterval: 10000,
    })
  const { data: slots = [] } =
    useQuery({
      queryKey: ['smart-search', 'yard-slots'],
      queryFn: yardApi.slots,
      refetchInterval: 10000,
    })
  const searchableData =
    useMemo<SearchableRecord[]>(() => [
      ...(materials as InventoryItem[]).map((item) => ({
        id: item.id,
        type: 'inventory',
        title: item.code,
        description:
          `${item.name} ${item.quantity ?? 0} ${item.unit ?? ''}`.trim(),
      })),
      ...components.map((component) => ({
        id: component.id,
        type: 'component',
        title: component.code,
        description:
          `${component.name} ${component.project?.name ?? ''}`.trim(),
      })),
      ...slots.map((slot) => ({
        id: slot.id,
        type: 'yard',
        title: slot.code,
        description:
          `${slot.zone.code} ${slot.status} ${slot.currentStackLevel}/${slot.maxStackLevel}`,
      })),
    ], [components, materials, slots])
  const fuse =
    useMemo(
      () =>
        new Fuse(searchableData, {
          keys: [
            'title',
            'description',
            'type',
          ],

          threshold: 0.4,
        }),
      [searchableData],
    )

  if (!keyword) return []

  return fuse.search(keyword)
}
