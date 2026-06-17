function groupThousands(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return '0'

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function trimFraction(value: string): string {
  return value.replace(/0+$/, '').replace(/\.$/, '')
}

function isGroupedThousands(value: string, separator: string): boolean {
  const parts = value.split(separator)
  if (parts.length <= 1) return false
  if (!parts[0] || parts[0].length > 3) return false
  return parts.slice(1).every((part) => part.length === 3)
}

function normalizeNumberString(value: string): string {
  const cleaned = value.replace(/\s/g, '').replace(/[^\d,.-]/g, '')
  if (!cleaned || cleaned === '-' || cleaned === ',' || cleaned === '.') return ''

  const negative = cleaned.startsWith('-')
  const unsigned = cleaned.replace(/-/g, '')
  const lastComma = unsigned.lastIndexOf(',')
  const lastDot = unsigned.lastIndexOf('.')
  let normalized = unsigned

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.'
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ','
    normalized = unsigned
      .replace(new RegExp(`\\${thousandsSeparator}`, 'g'), '')
      .replace(decimalSeparator, '.')
  } else if (lastComma >= 0) {
    normalized = unsigned.replace(/\./g, '').replace(',', '.')
  } else if (lastDot >= 0) {
    normalized = isGroupedThousands(unsigned, '.')
      ? unsigned.replace(/\./g, '')
      : unsigned
  }

  return `${negative ? '-' : ''}${normalized}`
}

export function parseLocaleNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0

  const raw = String(value ?? '').trim()
  if (!raw) return 0

  const parsed = Number(normalizeNumberString(raw))
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatQuantity(value: unknown, maximumFractionDigits = 3): string {
  const parsed = parseLocaleNumber(value)
  const sign = parsed < 0 ? '-' : ''
  const absolute = Math.abs(parsed)
  const fixed = trimFraction(absolute.toFixed(maximumFractionDigits))
  const [integer = '0', fraction = ''] = fixed.split('.')
  const formattedInteger = groupThousands(integer)

  return `${sign}${formattedInteger}${fraction ? `,${fraction}` : ''}`
}

export function formatQuantityInput(value: string): string {
  const raw = String(value ?? '')
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (trimmed === '-') return trimmed

  const negative = trimmed.startsWith('-')
  const unsigned = trimmed.replace(/-/g, '')
  const normalized = normalizeNumberString(unsigned)
  const [integerRaw = '', decimalRaw = ''] = normalized.split('.')
  const integerDigits = integerRaw.replace(/\D/g, '')
  const decimalDigits = decimalRaw.replace(/\D/g, '')
  const sign = negative ? '-' : ''
  const hasDecimalInput = /[,\.]\d*$/.test(unsigned) && !isGroupedThousands(unsigned, '.')

  if (hasDecimalInput) {
    return `${sign}${integerDigits},${decimalDigits}`
  }

  return `${sign}${integerDigits}`
}

export function formatCurrencyInput(value: string): string {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return ''
  return groupThousands(digits)
}

export function formatCurrencyVnd(value: unknown): string {
  const parsed = Math.round(parseLocaleNumber(value))
  const sign = parsed < 0 ? '-' : ''
  return `${sign}${groupThousands(String(Math.abs(parsed)))} đ`
}

export function formatDateTime(value?: string | number | Date | null): string {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  const pad = (part: number) => String(part).padStart(2, '0')
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
