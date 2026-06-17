import type { ReactNode } from 'react'
import { formatQuantity } from '@/shared/utils/number-format'
import {
  ModuleAnalyticsPanel,
  ModuleFilterBar,
  ModuleKpiCard,
  moduleInput,
  moduleMutedButton,
  modulePanel,
  modulePrimaryButton,
  moduleTableHead,
  moduleTableRow,
  moduleTableShell,
  type ModuleTone,
} from '@/shared/ui/modules'

export const componentsPanel = modulePanel

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
  tone?: ModuleTone
  active?: boolean
  onClick?: () => void
}) {
  return <ModuleKpiCard title={title} value={value} sub={sub} tone={tone} active={active} onClick={onClick} className="min-h-[104px]" />
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
    <ModuleAnalyticsPanel title={title} action={action}>
      {children}
    </ModuleAnalyticsPanel>
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
    <div className="grid min-h-[148px] grid-cols-[120px_1fr] items-center gap-3">
      <div className="relative h-28 w-28 rounded-full shadow-[0_18px_45px_rgba(0,0,0,0.2)]" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="absolute inset-3 rounded-full bg-[#08111f]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-xl font-semibold text-white">{centerValue}</div>
          <div className="text-[10px] text-slate-500">{centerLabel}</div>
        </div>
      </div>
      <div className="space-y-1.5 overflow-hidden">
        {segments.map((item) => (
          <div key={item.label} className="grid grid-cols-[1fr_auto] items-center gap-2 text-[11px]">
            <span className="flex min-w-0 items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="whitespace-nowrap text-slate-300">{formatQuantity(item.value, 0)}</span>
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
    <div className="flex h-32 items-end gap-2">
      {values.map((value, index) => (
        <div key={index} className={`flex-1 rounded-t-lg bg-gradient-to-t ${color}`} style={{ height: `${Math.max(8, (value / max) * 100)}%` }} />
      ))}
    </div>
  )
}
