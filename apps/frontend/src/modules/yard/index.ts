export function useYardMetricsQuery(_: any = {}) {

  return {

    data: {
      occupancyRate: 78,
      occupiedSlots: 312,
      totalSlots: 400,
    },

    isLoading: false,

    refetch: async () => {},
  }
}

export function useYardSearchQuery(_: any = {}) {

  return {

    data: [],

    isLoading: false,
  }
}

export function useYardMovementsQuery(_: any = {}) {

  return {

    data: [],

    isLoading: false,
  }
}

export function useYardSlotsQuery(_: any = {}) {

  return {

    data: [],

    isLoading: false,
  }
}

export function useYardZonesQuery(_: any = {}) {

  return {

    data: [],

    isLoading: false,
  }
}

export function useMoveYardItemMutation() {

  return {

    mutate: async (_: any = {}) => {},

    mutateAsync: async (_: any = {}) => {},
  }
}

type YardPixiCanvasProps = {

  compact?: boolean
}

export function YardPixiCanvas({
  compact,
}: YardPixiCanvasProps) {

  return null
}
