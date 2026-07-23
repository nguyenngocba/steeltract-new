import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import {
  getWarehouseRealtimeMaterials,
  getWarehouseRealtimeOverview,
  getWarehouseRealtimeTransactions,
  type WarehouseRealtimeMaterial,
  type WarehouseRealtimeTransaction,
} from '../api/warehouse-realtime.api'

const realtimeInterval = 5_000
const emptyMaterials: WarehouseRealtimeMaterial[] = []
const emptyTransactions: WarehouseRealtimeTransaction[] = []

export function useWarehouseRealtime() {
  const overviewQuery = useQuery({
    queryKey: ['warehouse-realtime', 'overview'],
    queryFn: ({ signal }) => getWarehouseRealtimeOverview(signal),
    refetchInterval: realtimeInterval,
    staleTime: 2_000,
  })

  const materialsQuery = useQuery({
    queryKey: ['warehouse-realtime', 'materials'],
    queryFn: ({ signal }) => getWarehouseRealtimeMaterials(signal),
    refetchInterval: realtimeInterval,
    staleTime: 2_000,
  })

  const transactionsQuery = useQuery({
    queryKey: ['warehouse-realtime', 'transactions'],
    queryFn: ({ signal }) => getWarehouseRealtimeTransactions(signal),
    refetchInterval: realtimeInterval,
    staleTime: 2_000,
  })

  const materials = materialsQuery.data?.items ?? emptyMaterials
  const transactions =
    transactionsQuery.data?.items ??
    transactionsQuery.data?.data ??
    emptyTransactions

  const metrics = useMemo(() => {
    const summary = overviewQuery.data?.summary
    const totalInventory = Number(summary?.totalStock ?? 0)
    const lowStock = Number(summary?.lowStock ?? 0)
    const outOfStock = Number(summary?.outOfStock ?? 0)
    const reserved = sumMaterials(materials, 'reservedQuantity')
    const available =
      sumMaterials(materials, 'availableQuantity') ||
      Math.max(0, totalInventory - reserved)

    return {
      totalInventory,
      reserved,
      available,
      lowStock,
      outOfStock,
      totalValue: Number(summary?.totalValue ?? 0),
    }
  }, [materials, overviewQuery.data])

  const alerts = useMemo(
    () => buildAlerts(materials, overviewQuery.data?.summary),
    [materials, overviewQuery.data],
  )

  return {
    overviewQuery,
    materialsQuery,
    transactionsQuery,
    metrics,
    materials,
    transactions,
    alerts,
    isLoading:
      overviewQuery.isLoading ||
      materialsQuery.isLoading ||
      transactionsQuery.isLoading,
    isError:
      overviewQuery.isError ||
      materialsQuery.isError ||
      transactionsQuery.isError,
    refetchAll: () => {
      void overviewQuery.refetch()
      void materialsQuery.refetch()
      void transactionsQuery.refetch()
    },
  }
}

function sumMaterials(
  rows: WarehouseRealtimeMaterial[],
  key: 'availableQuantity' | 'reservedQuantity',
) {
  return rows.reduce((sum, row) => sum + Number(row[key] ?? 0), 0)
}

function buildAlerts(
  materials: WarehouseRealtimeMaterial[],
  summary: { lowStock?: number; outOfStock?: number } | undefined,
) {
  const negative = materials.filter(
    (row) => Number(row.currentStock ?? row.quantity ?? 0) < 0,
  )
  const low = Number(summary?.lowStock ?? 0)
  const out = Number(summary?.outOfStock ?? 0)
  const unassigned = materials.filter((row) => !row.warehouseCode)

  return [
    ...negative.map((row) => ({
      severity: 'critical' as const,
      title: 'Tồn kho âm',
      detail: `${row.code ?? 'Vật tư'} đang có số lượng ${Number(row.currentStock ?? row.quantity ?? 0)}`,
    })),
    ...(out > 0
      ? [
          {
            severity: 'critical' as const,
            title: 'Hết tồn',
            detail: `${out} vật tư đang ở trạng thái hết tồn`,
          },
        ]
      : []),
    ...(low > 0
      ? [
          {
            severity: 'warning' as const,
            title: 'Tồn thấp',
            detail: `${low} vật tư cần bổ sung hoặc kiểm tra định mức`,
          },
        ]
      : []),
    ...unassigned.slice(0, 3).map((row) => ({
      severity: 'warning' as const,
      title: 'Chưa gán kho',
      detail: `${row.code ?? 'Vật tư'} chưa có mã kho hiển thị`,
    })),
  ]
}

export function transactionTimestamp(row: WarehouseRealtimeTransaction) {
  return row.transactionDate ?? row.createdAt ?? ''
}
