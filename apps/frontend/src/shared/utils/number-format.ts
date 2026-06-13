export function parseLocaleNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0

  const raw = String(value ?? '').trim()
  if (!raw) return 0

  const cleaned = raw.replace(/\s/g, '').replace(/[^\d,.-]/g, '')
  if (!cleaned || cleaned === '-' || cleaned === ',' || cleaned === '.') return 0

  const hasComma = cleaned.includes(',')
  const hasDot = cleaned.includes('.')
  let normalized = cleaned

  if (hasComma && hasDot) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  } else if (hasComma) {
    normalized = cleaned.replace(',', '.')
  } else if (hasDot) {
    const parts = cleaned.split('.')
    const last = parts.at(-1) ?? ''
    normalized =
      parts.length > 2 && last.length === 3
        ? parts.join('')
        : cleaned
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatQuantity(value: unknown, maximumFractionDigits = 3): string {
  const parsed = parseLocaleNumber(value)
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits,
  }).format(parsed)
}

export function formatQuantityInput(value: string): string {
  const raw = String(value ?? '')
  if (!raw.trim()) return ''
  if (/[,.\-]$/.test(raw.trim())) return raw
  return formatQuantity(raw)
}

export function formatCurrencyVnd(value: unknown): string {
  const parsed = Math.round(parseLocaleNumber(value))
  return `${new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(parsed)} đ`
}
