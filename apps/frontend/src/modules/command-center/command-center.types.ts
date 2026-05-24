import type {
  ReactNode,
} from 'react'

export type CommandCenterMode =
  | 'management'
  | 'production'
  | 'qc'
  | 'logistics'

export type CommandSeverity =
  | 'normal'
  | 'info'
  | 'warning'
  | 'critical'

export interface CommandEvent {
  id: string
  event: string
  domain: string
  message: string
  severity: CommandSeverity
  occurredAt: string
}

export interface CommandMetric {
  id: string
  label: string
  value: ReactNode
  unit?: string
  severity?: CommandSeverity
  trend?: ReactNode
  description?: string
}
