import type { ReactNode } from 'react'
import { formatQuantity } from '@/shared/utils/number-format'
import {
  ModuleFilterBar,
  moduleInput,
  moduleMutedButton,
  modulePrimaryButton,
  moduleTableHead,
  moduleTableRow,
  moduleTableShell,
} from '@/shared/ui/modules'
import { CockpitChartCard, CockpitKpiCard, COCKPIT_SHELL } from '@/shared/ui/cockpit'

export const componentsPanel = COCKPIT_SHELL

export const componentsInput = moduleInput

export const componentsTableShell = moduleTableShell

export const componentsTableHead = moduleTableHead

export const componentsTableRow = moduleTableRow

export const componentsMutedButton = moduleMutedButton

export const componentsPrimaryButton = modulePrimaryButton

export function ComponentsKpiCard({
  title,
  value,
  sub,
  tone = 'cyan',
  active,
  onClick,
}: {
  title: string
  value: string
  sub?: string
  tone?: any
  active?: boolean
  onClick?: () => void
}) {
  return (
    <CockpitKpiCard
      title={title}
      value={value}
      note={sub}
      tone={tone}
      active={active}
      onClick={onClick}
      trend={[10, 15, 12, 18, 14, 22]}
    />
  )
}

export function ComponentsPanel({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <CockpitChartCard title={title} action={action} heightClass="h-[170px]" chartHeightClass="h-[74px]">
      {children}
    </CockpitChartCard>
  )
}

export function ComponentsFilterBar({
  children,
}: {
  children: ReactNode
}) {
  return (
    <ModuleFilterBar>
      {children}
    </ModuleFilterBar>
  )
}

export function ComponentsSelect({
  value,
  onChange,
  children,
  className = '',
}: {
  value: string
  onChange: (value: string) => void
  children: ReactNode
  className?: string
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`${componentsInput} ${className}`}
    >
      {children}
    </select>
  )
}

export function ComponentsDonut({
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
    <div className="grid h-[74px] grid-cols-[74px_1fr] items-center gap-2 overflow-hidden">
      <div className="relative h-[68px] w-[68px] rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.2)]" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="absolute inset-1.5 rounded-full bg-[#08111f]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-xs font-bold text-white">{centerValue}</div>
          <div className="text-[7px] text-slate-500 scale-90 leading-none">{centerLabel}</div>
        </div>
      </div>
      <div className="space-y-0.5 overflow-hidden">
        {segments.slice(0, 3).map((item) => (
          <div key={item.label} className="grid grid-cols-[1fr_auto] items-center gap-1.5 text-[10px]">
            <span className="flex min-w-0 items-center gap-1 text-slate-350">
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="truncate font-sans">{item.label}</span>
            </span>
            <span className="whitespace-nowrap font-mono tabular-nums text-slate-300">{formatQuantity(item.value, 0)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ComponentsMiniBars({ values, tone = 'cyan' }: { values: number[]; tone?: 'cyan' | 'emerald' | 'amber' }) {
  const max = Math.max(1, ...values)
  const color = tone === 'emerald' ? 'from-emerald-500 to-teal-300' : tone === 'amber' ? 'from-amber-500 to-orange-300' : 'from-blue-500 to-cyan-300'
  return (
    <div className="flex h-[74px] items-end gap-1 px-1">
      {values.map((value, index) => (
        <div key={index} className={`flex-1 rounded-t bg-gradient-to-t ${color}`} style={{ height: `${Math.max(8, (value / max) * 100)}%` }} />
      ))}
    </div>
  )
}
