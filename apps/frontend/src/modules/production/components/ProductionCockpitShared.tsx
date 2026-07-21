import type { ReactNode } from 'react'
import {
  EnterpriseCompactDonut,
  EnterpriseMeter,
  EnterpriseMiniBars,
  EnterpriseProductionPanel,
  EnterpriseStatusBadge,
  enterpriseInput,
  enterpriseModulePrimaryButton,
  enterpriseModuleTableHead,
  enterpriseModuleTableRow,
  enterpriseMutedButton,
} from '@/shared/ui/enterprise-components'
import { CockpitKpiCard, COCKPIT_SHELL } from '@/shared/ui/cockpit'

export const productionPanel = COCKPIT_SHELL

export const productionInput = enterpriseInput

export const productionMutedButton = enterpriseMutedButton

export const productionPrimaryButton = enterpriseModulePrimaryButton

export const productionTableHead = enterpriseModuleTableHead

export const productionTableRow = enterpriseModuleTableRow

type ProductionKpiTone = 'blue' | 'emerald' | 'cyan' | 'amber' | 'red' | 'purple' | 'indigo' | 'violet' | 'orange' | 'green'

export function ProductionKpi({ label, value, note, tone = 'cyan', active, onClick }: {
  label: string; value: string; note?: string; tone?: ProductionKpiTone; active?: boolean; onClick?: () => void
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
    />
  )
}

export function ProductionPanel({ title, action, children, className = '' }: {
  title: string; action?: ReactNode; children: ReactNode; className?: string
}) {
  return <EnterpriseProductionPanel title={title} action={action} className={className}>{children}</EnterpriseProductionPanel>
}

export function StatusChip({ status }: { status: string }) {
  return <EnterpriseStatusBadge status={status} />
}

export function Meter({ value, tone = 'bg-cyan-500' }: { value: number; tone?: string }) {
  return <EnterpriseMeter value={value} tone={tone} />
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
  return <EnterpriseCompactDonut segments={segments} centerValue={centerValue} centerLabel={centerLabel} compact />
}

export function ProductionMiniBars({ values, tone = 'cyan' }: { values: number[]; tone?: 'cyan' | 'emerald' | 'amber' }) {
  return <EnterpriseMiniBars values={values} tone={tone} heightClass="h-[74px]" gapClass="gap-1 px-1" roundedClass="rounded-t" />
}
