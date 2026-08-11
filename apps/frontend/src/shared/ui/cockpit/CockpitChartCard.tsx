import type { ReactNode } from 'react'
import { COCKPIT_SHELL } from './cockpit-shell'
import { COCKPIT_HEIGHTS } from './cockpit-tokens'

type CockpitChartCardProps = {
  title: string
  value?: ReactNode
  subtitle?: ReactNode
  delta?: ReactNode
  deltaColorClass?: string
  action?: ReactNode
  page?: number
  pageCount?: number
  onPrev?: () => void
  onNext?: () => void
  children: ReactNode
  className?: string
  heightClass?: string
  chartHeightClass?: string
  loading?: boolean
  empty?: boolean
  emptyLabel?: string
  realtime?: boolean
}

export function CockpitChartCard({
  title,
  value,
  subtitle,
  delta,
  deltaColorClass = 'text-slate-400',
  action,
  page,
  pageCount,
  onPrev,
  onNext,
  children,
  className = '',
  heightClass = '',
  chartHeightClass,
  loading = false,
  empty = false,
  emptyLabel = 'Chưa có dữ liệu',
  realtime = false,
}: CockpitChartCardProps) {
  const hasPages = Boolean(page && pageCount && pageCount > 1)
  const sizeClass = heightClass || className || COCKPIT_HEIGHTS.CHART_MD
  const isTableFocus = sizeClass.includes('520px') || sizeClass.includes('560px') || sizeClass.includes('580px') || sizeClass.includes('640px')
  const isLargeFocus = isTableFocus || sizeClass.includes('300px') || sizeClass.includes('390px')
  const isShorter = [COCKPIT_HEIGHTS.CHART_SM, COCKPIT_HEIGHTS.CHART_SM_ALT, COCKPIT_HEIGHTS.CHART_XXS].some((height) =>
    sizeClass.includes(height),
  )
  const hasMetricHeader = value !== undefined || delta !== undefined || Boolean(pageCount)
  const bodyClass = chartHeightClass
    ? `overflow-hidden shrink-0 ${chartHeightClass}`
    : 'min-h-0 flex-1 overflow-auto scrollbar-thin'

  return (
    <section aria-label={title} aria-busy={loading} className={`overflow-hidden ${COCKPIT_SHELL} text-left flex flex-col justify-between ${isShorter ? 'p-3' : isLargeFocus ? 'p-4' : 'p-3.5'} ${isLargeFocus ? 'ring-cyan-300/[0.085] shadow-[0_28px_90px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.07)]' : ''} ${heightClass} ${className}`}>
      <div className={`flex items-start justify-between gap-2 shrink-0 ${hasMetricHeader ? '' : isLargeFocus ? 'mb-3' : 'mb-2'}`}>
        <div className={`${hasMetricHeader ? COCKPIT_HEIGHTS.CHART_HEADER_METRIC : ''} flex min-w-0 flex-1 flex-col justify-start`}>
          <h3 className={`truncate ${hasMetricHeader ? 'text-[10px]' : isLargeFocus ? 'text-[13px]' : 'text-xs'} font-bold uppercase ${isLargeFocus ? 'tracking-[0.1em]' : 'tracking-[0.12em]'} ${hasMetricHeader ? 'text-slate-400' : 'text-white'}`}>{title}</h3>
          {value !== undefined ? <div className="mt-1 truncate text-2xl font-semibold leading-none text-white">{value}</div> : null}
          {delta !== undefined ? <div className={`mt-1 truncate text-[10px] ${deltaColorClass}`}>{delta}</div> : null}
          {subtitle ? <p className={`${isLargeFocus ? 'mt-1' : 'mt-0.5'} text-[11px] text-slate-500`}>{subtitle}</p> : null}
        </div>
        {action || hasPages || realtime ? (
          <div className="mt-1 flex shrink-0 items-center gap-2">
            {realtime ? <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />Realtime</span> : null}
            {action}
            {hasPages ? (
              <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                <button type="button" onClick={onPrev} className="rounded border border-white/10 px-1.5 py-0.5 text-slate-300 transition hover:bg-white/10">‹</button>
                <span>{page}/{pageCount}</span>
                <button type="button" onClick={onNext} className="rounded border border-white/10 px-1.5 py-0.5 text-slate-300 transition hover:bg-white/10">›</button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className={bodyClass}>
        {loading ? (
          <div className="flex h-full min-h-24 items-end gap-2 p-3" role="status" aria-label="Đang tải biểu đồ">
            {[42, 68, 54, 82, 61, 74].map((height) => <span key={height} className="flex-1 animate-pulse rounded-t bg-white/[0.07]" style={{ height: `${height}%` }} />)}
          </div>
        ) : empty ? (
          <div className="grid h-full min-h-24 place-items-center px-4 text-center text-xs font-medium text-slate-500">{emptyLabel}</div>
        ) : children}
      </div>
    </section>
  )
}
