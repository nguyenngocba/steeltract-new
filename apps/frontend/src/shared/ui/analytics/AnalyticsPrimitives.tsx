import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'

import { CockpitEmptyState, CockpitTableShell, DataTablePagination } from '@/shared/ui/cockpit'
import type { DomainTheme } from './analytics-theme'

export type AnalyticsSeriesPoint = { label: string; value: number; secondary?: number }
export type AnalyticsDistributionPoint = { label: string; value: number; color: string }
export type AnalyticsActivityRow = { title: string; subtitle: string; time: string }

export function AnalyticsModuleKpiCard({
  Icon,
  title,
  value,
  unit,
  subtitle,
  deltaPercent,
  theme,
  series,
  onClick,
}: {
  Icon: LucideIcon
  title: string
  value: string
  unit?: string
  subtitle: string
  deltaPercent?: number
  theme: DomainTheme
  series: AnalyticsSeriesPoint[]
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative isolate min-h-[164px] overflow-hidden rounded-2xl border ${theme.border} bg-gradient-to-br ${theme.panel} p-3 text-left shadow-xl shadow-slate-950/30 transition duration-300 hover:-translate-y-1.5 hover:scale-[1.018] hover:shadow-2xl ${theme.glow} focus:outline-none focus:ring-1 focus:ring-cyan-300`}
    >
      <span className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-80" />
      <span className="absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl transition duration-300 group-hover:scale-125" style={{ backgroundColor: theme.halo }} />
      <span className="absolute -bottom-16 left-4 h-24 w-32 rounded-full blur-2xl opacity-60" style={{ backgroundColor: theme.fill }} />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-center gap-2">
          <span className={`grid h-8 w-8 shrink-0 place-items-center ${iconFrameClass(theme)} border ${theme.border} bg-slate-950/50 ${theme.text} shadow-lg transition duration-300 group-hover:rotate-3 group-hover:scale-105`}>
            <Icon size={15} />
          </span>
          <p className="min-w-0 text-[11px] font-medium leading-snug text-slate-200">{title}</p>
        </div>
        <div>
          <p className="mt-2 flex items-end gap-1.5 text-[1.65rem] font-medium leading-none tracking-tight text-white">
            <span>{value}</span>
            {unit ? <span className="pb-0.5 text-[10px] uppercase tracking-[0.12em] text-slate-400">{unit}</span> : null}
          </p>
          <p className={`mt-2 text-[11px] font-medium ${deltaPercent === undefined ? 'text-slate-500' : deltaPercent >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
            {deltaPercent === undefined ? '—' : `${deltaPercent >= 0 ? '▲' : '▼'} ${Math.abs(deltaPercent).toFixed(1)}%`}
          </p>
          {subtitle ? <p className="mt-0.5 text-[10px] text-slate-500">{subtitle}</p> : null}
        </div>
        <AnalyticsSparkline rows={series} stroke={theme.stroke} fill={theme.fill} />
      </div>
    </button>
  )
}

export function AnalyticsPortalShell({
  sidebar,
  children,
}: {
  sidebar: ReactNode
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100">
      <div className="grid min-h-screen xl:grid-cols-[290px_1fr]">
        <aside className="border-r border-cyan-300/10 bg-slate-950/55 p-4">{sidebar}</aside>
        <main className="max-h-screen overflow-y-auto p-5">{children}</main>
      </div>
    </div>
  )
}

export function AnalyticsHeader({
  Icon,
  theme,
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  Icon: LucideIcon
  theme: DomainTheme
  eyebrow: string
  title: string
  subtitle: string
  actions?: ReactNode
}) {
  return (
    <header className={`relative mb-4 overflow-hidden rounded-3xl border ${theme.border} bg-gradient-to-br ${theme.panel} p-4 shadow-[0_18px_46px_rgba(8,47,73,0.14)]`}>
      <span className="absolute -right-20 -top-24 h-44 w-44 rounded-full opacity-60 blur-3xl" style={{ backgroundColor: theme.halo }} />
      <DomainPattern theme={theme} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`relative grid h-14 w-14 place-items-center ${iconFrameClass(theme)} border ${theme.border} bg-slate-950/45 ${theme.text}`}>
            <Icon size={26} />
          </span>
          <div>
            <p className={`text-xs font-medium uppercase tracking-[0.18em] ${theme.text}`}>{eyebrow}</p>
            <h1 className="text-2xl font-medium tracking-tight text-white">{title}</h1>
            <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
          </div>
        </div>
        {actions}
      </div>
    </header>
  )
}

export function AnalyticsSection({
  title,
  action,
  onAction,
  theme,
  className = '',
  children,
}: {
  title: string
  action?: string
  onAction?: () => void
  theme: DomainTheme
  className?: string
  children: ReactNode
}) {
  return (
    <section className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/55 via-slate-950/28 to-slate-900/18 p-4 shadow-[0_20px_60px_rgba(8,47,73,0.12)] ${className}`}>
      <span className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
      <span className="absolute -right-14 -top-14 h-28 w-28 rounded-full opacity-25 blur-3xl" style={{ backgroundColor: theme.halo }} />
      <div className="relative mb-3 flex items-start justify-between gap-3">
        <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-slate-100">{title}</h3>
        {action && onAction ? (
          <button type="button" onClick={onAction} className={`inline-flex items-center gap-1 text-xs ${theme.text} transition hover:text-white`}>
            {action}<ChevronRight size={13} />
          </button>
        ) : null}
      </div>
      <div className="relative">{children}</div>
    </section>
  )
}

export function AnalyticsMetricGrid({
  items,
  theme,
  columns = 'md:grid-cols-5',
}: {
  items: Array<{ label: string; value: string; note: string }>
  theme: DomainTheme
  columns?: string
}) {
  return (
    <section className={`mb-3 grid gap-2 ${columns}`}>
      {items.map((item) => (
        <div key={item.label} className={`relative min-h-[118px] overflow-hidden rounded-2xl border ${theme.border} bg-gradient-to-br ${theme.panel} p-3`}>
          <span className="absolute inset-y-3 left-0 w-1 rounded-r-full opacity-50" style={{ backgroundColor: theme.stroke }} />
          <span className="absolute -right-10 -top-10 h-20 w-20 opacity-45 blur-2xl" style={{ backgroundColor: theme.halo }} />
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
          <p className="mt-3 text-xl font-medium text-white">{item.value}</p>
          <p className={`mt-1 text-[11px] ${theme.text}`}>{item.note}</p>
        </div>
      ))}
    </section>
  )
}

export function AnalyticsTrendChart({
  rows,
  theme,
  variant = 'bars',
  emptyTitle = 'Chưa có dữ liệu lịch sử',
}: {
  rows: AnalyticsSeriesPoint[]
  theme: DomainTheme
  variant?: 'bars' | 'line' | 'dual'
  emptyTitle?: string
}) {
  if (!rows.length) {
    return <div className="grid h-full min-h-[260px] place-items-center"><CockpitEmptyState title={emptyTitle} description="Không dựng dữ liệu giả khi backend chưa có chuỗi lịch sử thật." /></div>
  }
  if (variant === 'line') return <LineChart rows={rows} theme={theme} />
  if (variant === 'dual') return <DualBars rows={rows} theme={theme} />
  const max = Math.max(1, ...rows.map((row) => row.value))
  return (
    <div className="flex h-full min-h-[280px] items-end gap-2">
      {rows.slice(-16).map((row) => (
        <div key={row.label} className="group flex flex-1 flex-col items-center justify-end gap-2">
          <span className="w-full max-w-9 rounded-t-lg shadow-lg transition group-hover:brightness-125" style={{ height: `${Math.max(12, (row.value / max) * 260)}px`, background: `linear-gradient(180deg, ${theme.stroke}, ${theme.fill}, rgba(15,23,42,0.2))`, boxShadow: `0 0 22px ${theme.fill}` }} />
          <span className="text-[10px] text-slate-500">{row.label}</span>
        </div>
      ))}
    </div>
  )
}

export function AnalyticsDistributionCard({
  rows,
  theme,
  centerLabel,
  total,
  variant = 'donut',
  emptyTitle = 'Dữ liệu phân bổ chưa khả dụng',
}: {
  rows: AnalyticsDistributionPoint[]
  theme: DomainTheme
  centerLabel: string
  total: string
  variant?: 'donut' | 'heatmap' | 'list'
  emptyTitle?: string
}) {
  const valid = rows.filter((row) => row.value > 0)
  if (!valid.length) return <CockpitEmptyState title={emptyTitle} description="Không dựng phân bổ khi dữ liệu backend chưa có bản ghi thật." />
  if (variant === 'heatmap') return <Heatmap rows={valid} />
  if (variant === 'list') return <DistributionList rows={valid} theme={theme} />
  return <Donut rows={valid} centerLabel={centerLabel} total={total} />
}

export function AnalyticsRankingCard({
  rows,
  theme,
  valueFormatter = (value) => String(value),
}: {
  rows: AnalyticsSeriesPoint[]
  theme: DomainTheme
  valueFormatter?: (value: number) => string
}) {
  const valid = rows.filter((row) => row.value > 0).slice(0, 10)
  if (!valid.length) return <CockpitEmptyState title="Dữ liệu xếp hạng chưa khả dụng" description="Backend chưa có bản ghi đủ để xếp hạng." />
  const max = Math.max(1, ...valid.map((row) => row.value))
  return (
    <div className="space-y-2">
      {valid.map((row, index) => (
        <div key={`${row.label}-${index}`} className="grid grid-cols-[24px_1fr_90px] items-center gap-2 text-xs">
          <span className="text-slate-500">{index + 1}</span>
          <div>
            <div className="mb-1 truncate text-slate-300">{row.label || 'Chưa đặt tên'}</div>
            <div className="h-2.5 rounded bg-white/10">
              <span className="block h-full rounded shadow-[0_0_16px_rgba(255,255,255,0.12)]" style={{ width: `${Math.max(5, (row.value / max) * 100)}%`, background: `linear-gradient(90deg, ${theme.stroke}, ${theme.fill})` }} />
            </div>
          </div>
          <span className={`text-right font-mono ${theme.text}`}>{valueFormatter(row.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function AnalyticsActivityPanel({ rows }: { rows: AnalyticsActivityRow[] }) {
  if (!rows.length) return <CockpitEmptyState title="Chưa có hoạt động gần đây" description="Hoạt động sẽ xuất hiện khi phát sinh nghiệp vụ." />
  return (
    <div className="space-y-2">
      {rows.slice(0, 7).map((row, index) => (
        <div key={`${row.title}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.045] p-3 text-xs">
          <p className="font-semibold text-white">{row.title}</p>
          <p className="mt-1 text-slate-400">{row.subtitle}</p>
          <p className="mt-1 font-mono text-[10px] text-slate-500">{row.time}</p>
        </div>
      ))}
    </div>
  )
}

export function AnalyticsTable({
  title,
  headers,
  rows,
  page,
  pageSize,
  onPageChange,
}: {
  title: string
  headers: string[]
  rows: string[][]
  page: number
  pageSize: number
  onPageChange: (page: number) => void
}) {
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize)
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/32 p-3">
      <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-cyan-200">{title}</h3>
      {rows.length ? (
        <>
          <CockpitTableShell className="max-h-[300px]">
            <table className="w-full min-w-[980px] text-left text-xs">
              <thead className="border-b border-cyan-400/10 text-slate-400">
                <tr>{headers.map((header) => <th key={header} className="px-3 py-2 font-semibold">{header}</th>)}</tr>
              </thead>
              <tbody>
                {pagedRows.map((row, index) => (
                  <tr key={`${row[0]}-${index}`} className="border-b border-cyan-300/10 text-slate-300 hover:bg-cyan-300/[0.045]">
                    {row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`} className="px-3 py-2">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </CockpitTableShell>
          {rows.length > pageSize ? <DataTablePagination page={page} pageSize={pageSize} total={rows.length} onPageChange={onPageChange} className="mt-0" /> : null}
        </>
      ) : (
        <CockpitEmptyState title="Dữ liệu chưa khả dụng" description="Backend hiện chưa có bản ghi chi tiết cho phân tích này." />
      )}
    </section>
  )
}

function DomainPattern({ theme }: { theme: DomainTheme }) {
  if (theme.pattern === 'warehouse') {
    return <div className="absolute -right-8 top-5 grid grid-cols-3 gap-1 opacity-20">{Array.from({ length: 9 }).map((_, index) => <span key={index} className="h-6 w-6 rounded border border-white/40" />)}</div>
  }
  if (theme.pattern === 'factory') {
    return <div className="absolute bottom-0 right-0 flex h-16 w-32 items-end gap-1 opacity-25">{[42, 60, 34, 72, 48].map((height, index) => <span key={index} className="w-4 rounded-t bg-white/40" style={{ height }} />)}</div>
  }
  if (theme.pattern === 'route' || theme.pattern === 'fleet') {
    return <div className="absolute inset-x-8 bottom-7 h-px rotate-[-8deg] bg-white/25"><span className="absolute -top-1 left-1/4 h-2 w-2 rounded-full bg-white/60" /><span className="absolute -top-1 right-1/4 h-2 w-2 rounded-full bg-white/60" /></div>
  }
  if (theme.pattern === 'quality') {
    return <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full border-[12px] border-white/15" />
  }
  if (theme.pattern === 'milestone') {
    return <div className="absolute bottom-4 right-4 flex gap-2 opacity-25">{[1, 2, 3].map((item) => <span key={item} className="h-8 w-8 rotate-45 rounded border border-white/40" />)}</div>
  }
  return <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10" />
}

function iconFrameClass(theme: DomainTheme) {
  if (theme.pattern === 'warehouse') return 'rounded-2xl'
  if (theme.pattern === 'dock') return 'rounded-[1.35rem]'
  if (theme.pattern === 'route') return 'rounded-2xl rotate-3'
  if (theme.pattern === 'factory') return 'rounded-lg'
  if (theme.pattern === 'quality') return 'rounded-full'
  if (theme.pattern === 'milestone') return 'rounded-xl rotate-45 [&>svg]:-rotate-45'
  if (theme.pattern === 'fleet') return 'rounded-2xl skew-x-[-6deg] [&>svg]:skew-x-[6deg]'
  return 'rounded-2xl'
}

function AnalyticsSparkline({ rows, stroke, fill }: { rows: AnalyticsSeriesPoint[]; stroke: string; fill: string }) {
  const values = rows.map((point) => point.value)
  if (values.length < 2 || values.every((value) => value === 0)) {
    return (
      <div className="mt-2">
        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-8 w-full opacity-40">
          <polyline points="0,20 100,20" fill="none" stroke={stroke} strokeWidth="1.5" strokeDasharray="4 5" vectorEffect="non-scaling-stroke" />
        </svg>
        <SparklineDays rows={rows} />
      </div>
    )
  }
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = Math.max(1, max - min)
  const points = values.map((value, index) => `${(index / Math.max(1, values.length - 1)) * 100},${34 - ((value - min) / range) * 26 - 4}`).join(' ')
  return (
    <div className="mt-2">
      <svg viewBox="0 0 100 36" preserveAspectRatio="none" className="h-9 w-full opacity-90">
        <polyline points={`0,36 ${points} 100,36`} fill={fill} />
        <polyline points={points} fill="none" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <SparklineDays rows={rows} />
    </div>
  )
}

function SparklineDays({ rows }: { rows: AnalyticsSeriesPoint[] }) {
  if (rows.length < 3) return null
  const first = rows[0]?.label
  const middle = rows[Math.floor(rows.length / 2)]?.label
  const last = rows[rows.length - 1]?.label
  return (
    <div className="mt-0.5 flex justify-between text-[8px] tabular-nums text-slate-600">
      <span>{first}</span>
      <span>{middle}</span>
      <span>{last}</span>
    </div>
  )
}

function LineChart({ rows, theme }: { rows: AnalyticsSeriesPoint[]; theme: DomainTheme }) {
  const values = rows.slice(-16).map((row) => row.value)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = Math.max(1, max - min)
  const points = values.map((value, index) => `${(index / Math.max(1, values.length - 1)) * 100},${92 - ((value - min) / range) * 72}`).join(' ')
  return (
    <div className="h-full min-h-[300px]">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-[270px] w-full">
        <polyline points={`0,100 ${points} 100,100`} fill={theme.fill} />
        <polyline points={points} fill="none" stroke={theme.stroke} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="grid grid-cols-4 text-[10px] text-slate-500">
        {rows.slice(-4).map((row) => <span key={row.label}>{row.label}</span>)}
      </div>
    </div>
  )
}

function DualBars({ rows, theme }: { rows: AnalyticsSeriesPoint[]; theme: DomainTheme }) {
  const max = Math.max(1, ...rows.flatMap((row) => [row.value, row.secondary ?? 0]))
  return (
    <div className="flex h-full min-h-[280px] items-end gap-2">
      {rows.slice(-12).map((row) => (
        <div key={row.label} className="group flex flex-1 flex-col items-center justify-end gap-2">
          <div className="flex h-[248px] items-end gap-1.5">
            <span className="w-2.5 rounded-t-lg transition group-hover:brightness-125" style={{ height: `${Math.max(6, (row.value / max) * 238)}px`, backgroundColor: theme.stroke, boxShadow: `0 0 18px ${theme.fill}` }} />
            <span className="w-2.5 rounded-t-lg bg-violet-400 transition group-hover:brightness-125" style={{ height: `${Math.max(6, ((row.secondary ?? 0) / max) * 238)}px` }} />
          </div>
          <span className="text-[10px] text-slate-500">{row.label}</span>
        </div>
      ))}
    </div>
  )
}

function Donut({ rows, total, centerLabel }: { rows: AnalyticsDistributionPoint[]; total: string; centerLabel: string }) {
  const sumValue = rows.reduce((sum, row) => sum + row.value, 0)
  let offset = 25
  return (
    <div className="grid h-full grid-cols-[190px_1fr] items-center gap-4">
      <div className="relative mx-auto grid h-44 w-44 place-items-center">
        <svg viewBox="0 0 42 42" className="-rotate-90">
          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#1e293b" strokeWidth="4.5" />
          {rows.map((row) => {
            const percent = (row.value / sumValue) * 100
            const dashOffset = offset
            offset -= percent
            const segment = donutSegment(percent)
            return <circle key={row.label} cx="21" cy="21" r="15.915" fill="transparent" stroke={row.color} strokeWidth="4.5" strokeDasharray={`${segment} ${100 - segment}`} strokeDashoffset={dashOffset} strokeLinecap="butt" />
          })}
        </svg>
        <div className="absolute text-center"><p className="text-[10px] text-slate-500">{centerLabel}</p><p className="text-base font-medium text-white">{total}</p></div>
      </div>
      <div className="space-y-2">
        {rows.slice(0, 7).map((row) => <LegendRow key={row.label} label={row.label} value={`${((row.value / sumValue) * 100).toFixed(1)}%`} color={row.color} />)}
      </div>
    </div>
  )
}

function donutSegment(percent: number) {
  if (percent <= 0) return 0
  if (percent >= 99.2) return percent
  return Math.max(0.7, percent - 0.45)
}

function Heatmap({ rows }: { rows: AnalyticsDistributionPoint[] }) {
  const max = Math.max(1, ...rows.map((row) => row.value))
  return (
    <div className="grid grid-cols-2 gap-2">
      {rows.slice(0, 8).map((row) => (
        <div key={row.label} className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
          <p className="truncate text-xs text-slate-400">{row.label}</p>
          <p className="mt-2 text-xl font-medium text-white">{row.value.toLocaleString('vi-VN')}</p>
          <span className="mt-2 block h-1 rounded" style={{ backgroundColor: row.color, opacity: Math.max(0.35, row.value / max) }} />
        </div>
      ))}
    </div>
  )
}

function DistributionList({ rows, theme }: { rows: AnalyticsDistributionPoint[]; theme: DomainTheme }) {
  const max = Math.max(1, ...rows.map((row) => row.value))
  return (
    <div className="space-y-2">
      {rows.slice(0, 8).map((row) => (
        <div key={row.label} className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-slate-300">{row.label}</span>
            <span className={theme.text}>{row.value.toLocaleString('vi-VN')}</span>
          </div>
          <div className="h-2 rounded bg-white/10"><span className="block h-full rounded" style={{ width: `${Math.max(4, (row.value / max) * 100)}%`, backgroundColor: row.color }} /></div>
        </div>
      ))}
    </div>
  )
}

function LegendRow({ label, value, color }: { label: string; value: string; color: string }) {
  return <div className="flex items-center justify-between gap-2 text-xs text-slate-300"><span className="flex min-w-0 items-center gap-2"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} /><span className="truncate">{label || 'Chưa phân loại'}</span></span>{value ? <span className="font-mono text-slate-400">{value}</span> : null}</div>
}
