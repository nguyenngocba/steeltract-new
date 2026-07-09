import { keepPreviousData, useQuery } from '@tanstack/react-query'

import {
  getInventoryMaterials,
  getInventoryOverview,
  getMaterialTransactions,
  type InventoryMaterialQuery,
} from '../api/endpoints/inventory.endpoint'

export function useInventoryMaterials(query: InventoryMaterialQuery) {
  return useQuery({
    queryKey: ['inventory', 'materials', query],
    queryFn: ({ signal }) => getInventoryMaterials(query, signal),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  })
}

export function useInventoryOverview(
  query: Omit<InventoryMaterialQuery, 'page' | 'pageSize' | 'sortBy' | 'sortOrder'>,
) {
  return useQuery({
    queryKey: ['inventory', 'overview', query],
    queryFn: ({ signal }) => getInventoryOverview(query, signal),
    staleTime: 10_000,
  })
}

export function useMaterialTransactions(
  materialId: string | undefined,
  page: number,
  pageSize: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['inventory', 'material-transactions', materialId, page, pageSize],
    queryFn: ({ signal }) =>
      getMaterialTransactions(materialId as string, page, pageSize, signal),
    enabled: Boolean(materialId) && enabled,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  })
}
