import { useMemo } from 'react'

import { useInventoryItems } from './useInventoryItems'

export function useInventoryMetrics() {
  const {
    data,
    isLoading,
  } = useInventoryItems()

  const metrics = useMemo(() => {
    if (!data) {
      return {
        totalItems: 0,
        lowStock: 0,
        critical: 0,
        totalQuantity: 0,
      }
    }

    let lowStock = 0
    let critical = 0
    let totalQuantity = 0

    data.forEach((item: any) => {

      totalQuantity +=
        item.quantity ?? 0

      if (
        item.quantity <= 5
      ) {

        critical++

      } else if (
        item.quantity <= 25
      ) {

        lowStock++
      }
    })

    return {
      totalItems: data.length,
      lowStock,
      critical,
      totalQuantity,
    }
  }, [data])

  return {
    metrics,
    isLoading,
  }
}
