import {
  Activity,
  Bookmark,
  Filter,
  RadioTower,
} from 'lucide-react'
import type {
  ReactNode,
} from 'react'

import {
  EmptyState,
  FilterBar,
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'

export function StickyOpsToolbar({
  domain,
  filters,
  actions,
  quickFilters,
  counters,
  shiftSelector,
  siteSelector,
  workCenterSelector,
  timeControls,
}: {
  domain: string
  filters?: ReactNode
  actions?: ReactNode
  quickFilters?: ReactNode
  counters?: ReactNode
  shiftSelector?: ReactNode
  siteSelector?: ReactNode
  workCenterSelector?: ReactNode
  timeControls?: ReactNode
}) {
  return (
    <FilterBar
      sticky
      compact
      realtime
      quickFilters={
        <>
          <StatusBadge tone="info">
            realtime
          </StatusBadge>
          <StatusBadge tone="neutral">
            {domain}
          </StatusBadge>
          {quickFilters}
          <span className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400">
            <RadioTower className="h-4 w-4 text-emerald-300" />
            batched events
          </span>
          <span className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400">
            <Filter className="h-4 w-4" />
            quick filters
          </span>
          <span className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400">
            <Bookmark className="h-4 w-4" />
            saved views ready
          </span>
        </>
      }
      filters={filters}
      actions={actions}
      counters={counters}
      shiftSelector={shiftSelector}
      siteSelector={siteSelector}
      workCenterSelector={workCenterSelector}
      timeControls={timeControls}
    />
  )
}

export function OpsLane({
  title,
  value,
  detail,
  tone = 'neutral',
}: {
  title: string
  value: ReactNode
  detail?: ReactNode
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger'
}) {
  const toneClass = {
    neutral: 'border-zinc-800 bg-zinc-950/70',
    info: 'border-cyan-500/30 bg-cyan-500/10',
    success: 'border-emerald-500/30 bg-emerald-500/10',
    warning: 'border-amber-500/30 bg-amber-500/10',
    danger: 'border-red-500/30 bg-red-500/10',
  }[tone]

  return (
    <div
      className={`rounded-lg border p-3 ${toneClass}`}
    >
      <p className="text-xs uppercase tracking-wide text-zinc-500">
        {title}
      </p>
      <div className="mt-1 text-lg font-semibold text-white">
        {value}
      </div>
      {detail ? (
        <div className="mt-1 text-xs text-zinc-400">
          {detail}
        </div>
      ) : null}
    </div>
  )
}

export function OperationalWorkspaceHero({
  eyebrow,
  title,
  description,
  metrics,
  actions,
}: {
  eyebrow: string
  title: string
  description: string
  metrics: Array<{
    label: string
    value: ReactNode
    tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger'
  }>
  actions?: ReactNode
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-[linear-gradient(135deg,rgba(8,145,178,0.14),rgba(9,9,11,0.96)_48%,rgba(16,185,129,0.08))] p-4 shadow-[0_0_44px_rgba(34,211,238,0.08)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.035)_1px,transparent_1px)] bg-[size:36px_36px]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 animate-[ops-hero-sweep_6s_linear_infinite] bg-gradient-to-r from-transparent via-cyan-300/10 to-transparent" />
      <div className="relative grid gap-4 xl:grid-cols-[1fr_0.9fr] xl:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">
            {title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            {description}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-lg border border-zinc-800 bg-zinc-950/75 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs uppercase tracking-wide text-zinc-500">
                  {metric.label}
                </p>
                <StatusBadge tone={metric.tone ?? 'info'}>
                  live
                </StatusBadge>
              </div>
              <div className="mt-2 truncate text-lg font-semibold text-white">
                {metric.value}
              </div>
            </div>
          ))}
        </div>
      </div>
      {actions ? (
        <div className="relative mt-4 flex flex-wrap gap-2 border-t border-zinc-800/80 pt-3">
          {actions}
        </div>
      ) : null}
      <style>
        {`
          @keyframes ops-hero-sweep {
            0% { transform: translateX(-150%); opacity: 0; }
            22% { opacity: 1; }
            78% { opacity: 1; }
            100% { transform: translateX(430%); opacity: 0; }
          }
        `}
      </style>
    </section>
  )
}

export function OperationalActivityPanel({
  title = 'Realtime operational activity',
  items,
}: {
  title?: string
  items: Array<{
    id: string
    label: string
    detail?: string
    tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger'
  }>
}) {
  return (
    <SectionCard title={title}>
      {items.length === 0 ? (
        <EmptyState
          title="No recent activity"
          description="Start the simulation or wait for domain events to populate this lane."
        />
      ) : (
        <div className="space-y-2">
          {items.slice(0, 12).map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3"
            >
              <Activity className="mt-0.5 h-4 w-4 text-cyan-300" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium text-white">
                    {item.label}
                  </p>
                  <StatusBadge tone={item.tone ?? 'info'}>
                    {item.tone ?? 'event'}
                  </StatusBadge>
                </div>
                {item.detail ? (
                  <p className="mt-1 text-xs text-zinc-500">
                    {item.detail}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

export function OpsGrid({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
      {children}
    </div>
  )
}
