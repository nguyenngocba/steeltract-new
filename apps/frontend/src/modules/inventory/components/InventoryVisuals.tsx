import type { ReactNode } from 'react'

export const inventoryPanel =
  'rounded-2xl border border-white/10 bg-slate-950/45 shadow-[0_22px_70px_rgba(0,0,0,0.24)] ring-1 ring-white/[0.025] backdrop-blur-2xl'

export const inventoryInput =
  'h-8 rounded-lg border border-white/10 bg-slate-950/45 px-2 text-xs text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-950/65'

export const inventoryPageStack = 'space-y-3'

export const inventoryGridGap = 'gap-3'

export const inventoryTableShell =
  'overflow-hidden rounded-2xl border border-white/10 bg-slate-950/35'

export const inventoryTable =
  'w-full text-sm'

export const inventoryTableHead =
  'bg-white/[0.055] text-xs uppercase tracking-[0.08em] text-slate-400'

export const inventoryTableRow =
  'border-t border-white/10 text-slate-200 transition hover:bg-white/[0.055]'

export const inventoryMutedButton =
  'rounded-xl border border-white/10 bg-white/[0.055] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40'

export function InventoryKpi({
  title,
  value,
  note,
  tone = 'blue',
}: {
  title: string
  value: string
  note?: string
  tone?: 'blue' | 'emerald' | 'amber' | 'red' | 'purple' | 'cyan'
}) {
  const toneClass = {
    blue: 'from-blue-500 to-sky-400',
    emerald: 'from-emerald-500 to-teal-400',
    amber: 'from-amber-500 to-orange-400',
    red: 'from-red-500 to-rose-400',
    purple: 'from-purple-500 to-indigo-400',
    cyan: 'from-cyan-500 to-blue-400',
  }[tone]
  return (
    <section className={`${inventoryPanel} p-3`}>
      <div className={`mb-2 h-1 w-14 rounded-full bg-gradient-to-r ${toneClass}`} />
      <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400">{title}</p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">{value}</h2>
      {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
    </section>
  )
}

export function InventoryPanel({
  title,
  children,
  className = '',
}: {
  title?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`${inventoryPanel} overflow-hidden ${className}`}>
      {title && <h3 className="px-4 pt-3 text-xs font-bold uppercase tracking-[0.12em] text-white">{title}</h3>}
      <div className="p-3">{children}</div>
    </section>
  )
}

export function InventoryInsightPanel({
  title,
  children,
  className = '',
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <InventoryPanel title={title} className={className}>
      <div className="space-y-3">{children}</div>
    </InventoryPanel>
  )
}

export function InventoryPagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
}: {
  page: number
  pageCount: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}) {
  const safePageCount = Math.max(1, pageCount)
  const safePage = Math.min(Math.max(1, page), safePageCount)
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const end = Math.min(safePage * pageSize, total)
  const windowSize = 5
  const firstPage = Math.max(1, Math.min(safePage - 2, safePageCount - windowSize + 1))
  const pages = Array.from({ length: Math.min(windowSize, safePageCount) }, (_, index) => firstPage + index)

  return (
    <div className="grid grid-cols-1 items-center gap-3 border-t border-white/10 px-5 py-4 text-xs text-slate-400 md:grid-cols-3">
      <div>
        Hiển thị {start}-{end}/{total.toLocaleString('vi-VN')} kết quả
      </div>
      <div className="flex justify-center gap-2">
        {pages[0] > 1 && <span className="px-1 py-2 text-slate-500">...</span>}
        {pages.map((pageNo) => (
          <button
            key={pageNo}
            onClick={() => onPageChange(pageNo)}
            className={`h-8 min-w-8 rounded-xl border px-2 transition ${
              safePage === pageNo
                ? 'border-blue-400 bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'border-white/10 bg-white/[0.045] text-slate-300 hover:border-cyan-400/40 hover:bg-cyan-400/10'
            }`}
          >
            {pageNo}
          </button>
        ))}
        {pages[pages.length - 1] < safePageCount && <span className="px-1 py-2 text-slate-500">...</span>}
      </div>
      <div className="flex justify-start gap-2 md:justify-end">
        <button disabled={safePage <= 1} onClick={() => onPageChange(Math.max(1, safePage - 1))} className={inventoryMutedButton}>
          Trước
        </button>
        <button disabled={safePage >= safePageCount} onClick={() => onPageChange(Math.min(safePageCount, safePage + 1))} className={inventoryMutedButton}>
          Sau
        </button>
      </div>
    </div>
  )
}

export function HorizontalBars({
  rows,
  max,
  valueFormatter,
}: {
  rows: Array<[string, number]>
  max?: number
  valueFormatter?: (value: number) => string
}) {
  const top = max ?? Math.max(1, ...rows.map(([, value]) => value))
  return (
    <div className="space-y-3">
      {rows.map(([label, value], index) => (
        <div key={`${label}-${index}`}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="truncate text-slate-300">{label}</span>
            <span className="font-medium text-white">{valueFormatter ? valueFormatter(value) : value.toLocaleString('vi-VN')}</span>
          </div>
          <div className="h-2 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400"
              style={{ width: `${Math.min(100, Math.max(4, (value / top) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function MiniBars({
  values,
  tone = 'blue',
}: {
  values: number[]
  tone?: 'blue' | 'emerald' | 'amber'
}) {
  const max = Math.max(1, ...values)
  const color = tone === 'emerald' ? 'from-emerald-500 to-teal-300' : tone === 'amber' ? 'from-amber-500 to-orange-300' : 'from-blue-500 to-cyan-300'
  return (
    <div className="flex h-36 items-end gap-2">
      {values.map((value, index) => (
        <div key={index} className={`flex-1 rounded-t-lg bg-gradient-to-t ${color}`} style={{ height: `${Math.max(8, (value / max) * 100)}%` }} />
      ))}
    </div>
  )
}

export function DonutSummary({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: Array<{ label: string; value: number; color: string }>
  centerValue: string
  centerLabel: string
}) {
  const total = Math.max(1, segments.reduce((sum, item) => sum + item.value, 0))
  let cursor = 0
  const gradient = segments
    .map((item) => {
      const start = cursor
      const end = cursor + (item.value / total) * 100
      cursor = end
      return `${item.color} ${start}% ${end}%`
    })
    .join(', ')

  return (
    <div className="grid items-center gap-5 2xl:grid-cols-[160px_1fr]">
      <div className="relative mx-auto h-40 w-40 rounded-full shadow-[0_20px_55px_rgba(0,0,0,0.18)]" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="absolute inset-4 rounded-full bg-[#08111f]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-semibold text-white">{centerValue}</div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{centerLabel}</div>
        </div>
      </div>
      <div className="space-y-2">
        {segments.map((item) => {
          const percent = (item.value / total) * 100
          return (
            <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="font-medium text-white">{item.value.toLocaleString('vi-VN')} ({percent.toFixed(1)}%)</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function InventoryChartCard({
  title,
  note,
  action,
  children,
  className = '',
}: {
  title: string
  note?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`${inventoryPanel} overflow-hidden p-3 ${className}`}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-xs font-bold uppercase tracking-[0.12em] text-white">{title}</h3>
          {note ? <p className="mt-0.5 text-[11px] text-slate-500">{note}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  )
}

export function CompactDonutSummary({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: Array<{ label: string; value: number; color: string }>
  centerValue: string
  centerLabel: string
}) {
  const total = Math.max(1, segments.reduce((sum, item) => sum + item.value, 0))
  let cursor = 0
  const gradient = segments
    .map((item) => {
      const start = cursor
      const end = cursor + (item.value / total) * 100
      cursor = end
      return `${item.color} ${start}% ${end}%`
    })
    .join(', ')

  return (
    <div className="grid min-h-[150px] grid-cols-[126px_1fr] items-center gap-3">
      <div className="relative h-28 w-28 rounded-full shadow-[0_18px_45px_rgba(0,0,0,0.2)]" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="absolute inset-3 rounded-full bg-[#08111f]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-xl font-semibold text-white">{centerValue}</div>
          <div className="text-[10px] text-slate-500">{centerLabel}</div>
        </div>
      </div>
      <div className="space-y-1.5 overflow-hidden">
        {segments.slice(0, 6).map((item) => {
          const percent = (item.value / total) * 100
          return (
            <div key={item.label} className="grid grid-cols-[1fr_auto] items-center gap-2 text-[11px]">
              <span className="flex min-w-0 items-center gap-1.5 text-slate-300">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.label}</span>
              </span>
              <span className="whitespace-nowrap text-slate-300">{item.value.toLocaleString('vi-VN')}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function CompactTrendChart({
  rows,
}: {
  rows: Array<{ label: string; value: number }>
}) {
  const max = Math.max(1, ...rows.map((row) => row.value))
  const points = rows
    .map((row, index) => {
      const x = rows.length <= 1 ? 0 : (index / (rows.length - 1)) * 100
      const y = 94 - (row.value / max) * 78
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="h-[150px]">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-[118px] w-full overflow-visible">
        <defs>
          <linearGradient id="inventoryCompactTrendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1d7cff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1d7cff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={`0,100 ${points} 100,100`} fill="url(#inventoryCompactTrendFill)" stroke="none" />
        <polyline points={points} fill="none" stroke="#1d7cff" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
        {rows.map((row, index) => {
          const x = rows.length <= 1 ? 0 : (index / (rows.length - 1)) * 100
          const y = 94 - (row.value / max) * 78
          return <circle key={row.label} cx={x} cy={y} r="1.5" fill="#38bdf8" />
        })}
      </svg>
      <div className="grid grid-cols-6 gap-2 text-[10px] text-slate-500">
        {rows.slice(0, 6).map((row) => <span key={row.label}>{row.label}</span>)}
      </div>
    </div>
  )
}
