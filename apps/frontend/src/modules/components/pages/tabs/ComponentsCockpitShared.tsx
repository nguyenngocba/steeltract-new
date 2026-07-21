import type { ReactNode } from 'react'
import {
  EnterpriseCompactDonut,
  EnterpriseMiniBars,
  EnterpriseProductionPanel,
  enterpriseInput,
  enterpriseModulePrimaryButton,
  enterpriseModuleTableHead,
  enterpriseModuleTableRow,
  enterpriseMutedButton,
  enterpriseTableShell,
} from '@/shared/ui/enterprise-components'
import { ModuleFilterBar } from '@/shared/ui/modules'
import { CockpitKpiCard, COCKPIT_SHELL } from '@/shared/ui/cockpit'

export const componentsPanel = COCKPIT_SHELL

export const componentsInput = enterpriseInput

export const componentsTableShell = enterpriseTableShell

export const componentsTableHead = enterpriseModuleTableHead

export const componentsTableRow = enterpriseModuleTableRow

export const componentsMutedButton = enterpriseMutedButton

export const componentsPrimaryButton = enterpriseModulePrimaryButton

type ComponentsTone = 'blue' | 'emerald' | 'cyan' | 'amber' | 'red' | 'purple' | 'indigo' | 'violet' | 'orange'

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
  tone?: ComponentsTone
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
  return <EnterpriseProductionPanel title={title} action={action}>{children}</EnterpriseProductionPanel>
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
  return <EnterpriseCompactDonut segments={segments} centerValue={centerValue} centerLabel={centerLabel} compact />
}

export function ComponentsMiniBars({ values, tone = 'cyan' }: { values: number[]; tone?: 'cyan' | 'emerald' | 'amber' }) {
  return <EnterpriseMiniBars values={values} tone={tone} heightClass="h-[74px]" gapClass="gap-1 px-1" roundedClass="rounded-t" />
}
