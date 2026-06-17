import type { ReactNode } from 'react'
import { formatQuantity } from '@/shared/utils/number-format'
import {
  ModuleAnalyticsPanel,
  ModuleKpiCard,
  moduleInput,
  moduleMutedButton,
  modulePanel,
  modulePrimaryButton,
  moduleTableHead,
  moduleTableRow,
  type ModuleTone,
} from '@/shared/ui/modules'

export const productionPanel = modulePanel

export const productionInput = moduleInput

export const productionMutedButton = moduleMutedButton

export const productionPrimaryButton = modulePrimaryButton

export const productionTableHead = moduleTableHead

export const productionTableRow = moduleTableRow

export function ProductionKpi({ label, value, note, tone = 'cyan', active, onClick }: {
  label: string; value: string; note?: string; tone?: 'cyan' | 'green' | 'amber' | 'red' | 'purple' | 'blue'; active?: boolean; onClick?: () => void
}) {
  const mappedTone: ModuleTone = tone === 'green' ? 'emerald' : tone
  return <ModuleKpiCard title={label} value={value} note={note} tone={mappedTone} active={active} onClick={onClick} className="min-h-[104px]" />
}

export function ProductionPanel({ title, action, children, className = '' }: {
  title: string; action?: ReactNode; children: ReactNode; className?: string
}) {
  return <ModuleAnalyticsPanel title={title} action={action} className={className}>{children}</ModuleAnalyticsPanel>
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

export function ProductionMiniBars({ values, tone = 'cyan' }: { values: number[]; tone?: 'cyan' | 'emerald' | 'amber' }) {
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
