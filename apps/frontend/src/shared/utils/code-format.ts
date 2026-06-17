export function compactDate(value = new Date()) {
  const year = String(value.getFullYear()).slice(-2)
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

export function nextCodeSequence(existingCodes: Array<string | null | undefined>, prefix: string, value = new Date()) {
  const dayPrefix = `${prefix}-${compactDate(value)}-`
  const max = existingCodes.reduce((currentMax, code) => {
    const text = String(code ?? '')
    if (!text.startsWith(dayPrefix)) return currentMax
    const suffix = Number(text.slice(dayPrefix.length))
    return Number.isFinite(suffix) ? Math.max(currentMax, suffix) : currentMax
  }, 0)
  return `${dayPrefix}${String(max + 1).padStart(3, '0')}`
}

export function nextCodeFromCount(prefix: string, count: number, value = new Date()) {
  return `${prefix}-${compactDate(value)}-${String(Math.max(1, count + 1)).padStart(3, '0')}`
}

export function nextLocalCode(prefix: string, value = new Date()) {
  const date = compactDate(value)
  const key = `steeltrack-code:${prefix}:${date}`
  if (typeof window === 'undefined') return nextCodeFromCount(prefix, 0, value)
  const current = Number(window.localStorage.getItem(key) ?? 0)
  const next = Number.isFinite(current) ? current + 1 : 1
  window.localStorage.setItem(key, String(next))
  return nextCodeFromCount(prefix, next - 1, value)
}
