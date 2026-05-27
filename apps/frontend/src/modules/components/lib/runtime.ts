export function statusTone(status: string) {
  switch (status) {
    case 'completed':
      return 'emerald'

    case 'in_progress':
      return 'cyan'

    case 'pending':
      return 'amber'

    case 'qc_hold':
      return 'rose'

    default:
      return 'zinc'
  }
}

export function componentWeight(
  length: number,
  quantity: number,
) {
  return Math.round(length * quantity * 12.4)
}

export function progressFromComponent(
  status: string,
) {
  switch (status) {
    case 'completed':
      return 100

    case 'in_progress':
      return 72

    case 'pending':
      return 28

    case 'qc_hold':
      return 54

    default:
      return 0
  }
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value)
}

export function statusCount(
  items: Array<{
    status: string
  }>,
  status: string,
) {
  return items.filter(
    (item) => item.status === status,
  ).length
}
