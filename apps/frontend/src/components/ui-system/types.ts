import type {
  ReactNode,
} from 'react'

export type Tone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'

export interface NavigationItem {
  label: string
  to: string
  icon?: ReactNode
}

export interface TimelineItem {
  id: string
  title: string
  description?: ReactNode
  time?: ReactNode
  tone?: Tone
}

export interface DataTableColumn<T> {
  key: string
  header: ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
  render: (row: T) => ReactNode
}
