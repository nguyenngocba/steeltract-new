import type {
  ReactNode,
} from 'react'

interface FilterBarProps {
  search?: ReactNode
  filters?: ReactNode
  actions?: ReactNode
  quickFilters?: ReactNode
  counters?: ReactNode
  presets?: ReactNode
  shiftSelector?: ReactNode
  siteSelector?: ReactNode
  workCenterSelector?: ReactNode
  timeControls?: ReactNode
  sticky?: boolean
  compact?: boolean
  realtime?: boolean
}

export function FilterBar({
  search,
  filters,
  actions,
  quickFilters,
  counters,
  presets,
  shiftSelector,
  siteSelector,
  workCenterSelector,
  timeControls,
  sticky = false,
  compact = false,
  realtime = false,
}: FilterBarProps) {
  return (
    <div
      className={[
        'rounded-xl border border-zinc-800 bg-zinc-950/95 shadow-sm backdrop-blur',
        sticky ? 'sticky top-0 z-30' : '',
        compact ? 'p-2' : 'p-3',
      ].join(' ')}
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {realtime ? (
            <span className="rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-300">
              live
            </span>
          ) : null}
          {search}
          {quickFilters}
          {shiftSelector}
          {siteSelector}
          {workCenterSelector}
          {timeControls}
          {presets}
        </div>

        {filters ? (
          <div className="flex flex-wrap gap-2">
            {filters}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {counters}
          {actions}
        </div>
      </div>
    </div>
  )
}
