import type { ReactNode } from 'react'

import { CockpitChartCard, CockpitKpiCard, DataTablePagination } from '@/shared/ui/cockpit'
import {
  ModuleAnalyticsPanel,
  ModuleLoadingState,
  type ModuleTone,
} from '@/shared/ui/modules'
import { formatQuantity } from '@/shared/utils/number-format'
import { enterpriseKpiClass, enterprisePanel } from './EnterpriseVisualTokens'

export function EnterpriseKpi({
  title,
  value,
  note,
  tone = 'blue',
}: {
  title: string
  value: string
  note?: string
  tone?: ModuleTone
}) {
  return <CockpitKpiCard title={title} value={value} note={note} tone={tone} className={enterpriseKpiClass} />
}

export function EnterprisePanel({
  title,
  children,
  className = '',
}: {
  title?: ReactNode
  children: ReactNode
  className?: string
}) {
  if (typeof title !== 'string' && title) {
    return (
      <section className={`${enterprisePanel} overflow-hidden ${className}`}>
        <div className="px-4 pt-3">{title}</div>
        <div className="p-3">{children}</div>
      </section>
    )
  }

  return (
    <ModuleAnalyticsPanel title={typeof title === 'string' ? title : undefined} className={className}>
      {children}
    </ModuleAnalyticsPanel>
  )
}

export function EnterpriseInsightPanel({
  title,
  children,
  className = '',
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <EnterprisePanel title={title} className={className}>
      <div className="space-y-3">{children}</div>
    </EnterprisePanel>
  )
}

export function EnterprisePagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
  containerClassName,
}: {
  page: number
  pageCount: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  containerClassName?: string
}) {
  void pageCount
  return (
    <DataTablePagination
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      className={containerClassName}
    />
  )
}

export function EnterpriseHorizontalBars({
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
            <span className="font-medium text-white">{valueFormatter ? valueFormatter(value) : formatQuantity(value, 0)}</span>
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

export function EnterpriseMiniBars({
  values,
  tone = 'blue',
  heightClass = 'h-36',
  gapClass = 'gap-2',
  roundedClass = 'rounded-t-lg',
}: {
  values: number[]
  tone?: 'blue' | 'cyan' | 'emerald' | 'amber'
  heightClass?: string
  gapClass?: string
  roundedClass?: string
}) {
  const max = Math.max(1, ...values)
  const color = tone === 'emerald'
    ? 'from-emerald-500 to-teal-300'
    : tone === 'amber'
      ? 'from-amber-500 to-orange-300'
      : 'from-blue-500 to-cyan-300'

  return (
    <div className={`flex ${heightClass} items-end ${gapClass}`}>
      {values.map((value, index) => (
        <div
          key={index}
          className={`flex-1 ${roundedClass} bg-gradient-to-t ${color}`}
          style={{ height: `${Math.max(8, (value / max) * 100)}%` }}
        />
      ))}
    </div>
  )
}

export function EnterpriseDonutSummary({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: Array<{ label: string; value: number; color: string }>
  centerValue: string
  centerLabel: string
}) {
  const total = Math.max(1, segments.reduce((sum, item) => sum + item.value, 0))
  const gradient = segments
    .map((item, index) => {
      const start = segments.slice(0, index).reduce((sum, segment) => sum + (segment.value / total) * 100, 0)
      const end = start + (item.value / total) * 100
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
              <span className="font-medium text-white">{formatQuantity(item.value, 0)} ({percent.toFixed(1)}%)</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function EnterpriseCompactDonut({
  segments,
  centerValue,
  centerLabel,
  showPercent = false,
  compact = false,
}: {
  segments: Array<{ label: string; value: number; color: string }>
  centerValue: string
  centerLabel: string
  showPercent?: boolean
  compact?: boolean
}) {
  const total = Math.max(1, segments.reduce((sum, item) => sum + item.value, 0))
  const gradient = segments
    .map((item, index) => {
      const start = segments.slice(0, index).reduce((sum, segment) => sum + (segment.value / total) * 100, 0)
      const end = start + (item.value / total) * 100
      return `${item.color} ${start}% ${end}%`
    })
    .join(', ')

  if (compact) {
    return (
      <div className="grid h-[74px] grid-cols-[74px_1fr] items-center gap-2 overflow-hidden">
        <div className="relative h-[68px] w-[68px] rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.2)]" style={{ background: `conic-gradient(${gradient})` }}>
          <div className="absolute inset-1.5 rounded-full bg-[#08111f]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-xs font-bold text-white">{centerValue}</div>
            <div className="scale-90 text-[7px] leading-none text-slate-500">{centerLabel}</div>
          </div>
        </div>
        <div className="space-y-0.5 overflow-hidden">
          {segments.slice(0, 3).map((item) => (
            <div key={item.label} className="grid grid-cols-[1fr_auto] items-center gap-1.5 text-[10px]">
              <span className="flex min-w-0 items-center gap-1 text-slate-350">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate font-sans">{item.label}</span>
              </span>
              <span className="whitespace-nowrap font-mono tabular-nums text-slate-300">{formatQuantity(item.value, 0)}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-[10px] grid-cols-[126px_1fr] items-center gap-3">
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
              <span className="whitespace-nowrap text-slate-300">
                {formatQuantity(item.value, 1)}
                {showPercent && ` (${percent.toFixed(1)}%)`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function EnterpriseChartCard({
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
    <section className={`${enterprisePanel} overflow-hidden p-2 ${className}`}>
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

export function EnterpriseProductionPanel({
  title,
  action,
  children,
  className = '',
}: {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <CockpitChartCard title={title} action={action} className={className} heightClass="h-[170px]" chartHeightClass="h-[74px]">
      {children}
    </CockpitChartCard>
  )
}

export function EnterpriseStatusBadge({ status }: { status: string }) {
  const key = status.toUpperCase()
  const tone = key.includes('COMPLETE') || key === 'ISSUED'
    ? 'border-emerald-700/70 bg-emerald-950/70 text-emerald-300'
    : key.includes('DELAY') || key.includes('CANCEL')
      ? 'border-red-700/70 bg-red-950/60 text-red-300'
      : key.includes('PROGRESS') || key === 'READY'
        ? 'border-blue-700/70 bg-blue-950/70 text-blue-300'
        : 'border-amber-700/70 bg-amber-950/60 text-amber-300'

  return <span className={`inline-flex rounded border px-2 py-1 text-[10px] font-semibold uppercase ${tone}`}>{status.replaceAll('_', ' ')}</span>
}

export function EnterpriseMeter({ value, tone = 'bg-cyan-500' }: { value: number; tone?: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div className={`h-full ${tone}`} style={{ width: `${Math.min(100, Math.max(4, value))}%` }} />
    </div>
  )
}

export function EnterpriseCompactTrendChart({
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
          <linearGradient id="enterpriseCompactTrendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1d7cff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1d7cff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={`0,100 ${points} 100,100`} fill="url(#enterpriseCompactTrendFill)" stroke="none" />
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

export const EnterpriseLoadingState = ModuleLoadingState
