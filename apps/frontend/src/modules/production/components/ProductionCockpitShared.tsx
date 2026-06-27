import type { ReactNode } from 'react'
import { formatQuantity } from '@/shared/utils/number-format'
import {
  moduleInput,
  moduleMutedButton,
  modulePrimaryButton,
  moduleTableHead,
  moduleTableRow,
} from '@/shared/ui/modules'
import { CockpitChartCard, CockpitKpiCard, COCKPIT_SHELL } from '@/shared/ui/cockpit'

export const productionPanel = COCKPIT_SHELL

export const productionInput = moduleInput

export const productionMutedButton = moduleMutedButton

export const productionPrimaryButton = modulePrimaryButton

export const productionTableHead = moduleTableHead

export const productionTableRow = moduleTableRow

export function ProductionKpi({ label, value, note, tone = 'cyan', active, onClick }: {
  label: string; value: string; note?: string; tone?: any; active?: boolean; onClick?: () => void
}) {
  const mappedTone = tone === 'green' ? 'emerald' : tone
  return (
    <CockpitKpiCard
      title={label}
      value={value}
      note={note}
      tone={mappedTone}
      active={active}
      onClick={onClick}
      trend={[8, 12, 10, 15, 14, 18]}
    />
  )
}

export function ProductionPanel({ title, action, children, className = '' }: {
  title: string; action?: ReactNode; children: ReactNode; className?: string
}) {
  return (
    <CockpitChartCard title={title} action={action} className={className} heightClass="h-[170px]" chartHeightClass="h-[74px]">
      {children}
    </CockpitChartCard>
  )
}

export function StatusChip({ status }: { status: string }) {
  const key = status.toUpperCase()
  const tone = key.includes('COMPLETE') || key === 'ISSUED' ? 'border-emerald-700/70 bg-emerald-950/70 text-emerald-300'
    : key.includes('DELAY') || key.includes('CANCEL') ? 'border-red-700/70 bg-red-950/60 text-red-300'
      : key.includes('PROGRESS') || key === 'READY' ? 'border-blue-700/70 bg-blue-950/70 text-blue-300'
        : 'border-amber-700/70 bg-amber-950/60 text-amber-300'
  return <span className={`inline-flex rounded border px-2 py-1 text-[10px] font-semibold uppercase ${tone}`}>{status.replaceAll('_', ' ')}</span>
}

export function Meter({ value, tone = 'bg-cyan-500' }: { value: number; tone?: string }) {
  return <div className="h-2 overflow-hidden rounded-full bg-white/10">
    <div className={`h-full ${tone}`} style={{ width: `${Math.min(100, Math.max(4, value))}%` }} />
  </div>
}

export function ProductionDonut({
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

export function ProductionMiniBars({ values, tone = 'cyan' }: { values: number[]; tone?: 'cyan' | 'emerald' | 'amber' }) {
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
