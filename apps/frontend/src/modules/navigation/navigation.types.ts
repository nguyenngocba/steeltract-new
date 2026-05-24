import type {
  ComponentType,
  ReactNode,
} from 'react'

export type WorkspaceId =
  | 'management'
  | 'production'
  | 'warehouse'
  | 'qc'
  | 'logistics'

export interface NavigationItem {
  id: string
  label: string
  path: string
  group: string
  workspaceIds: WorkspaceId[]
  icon: ComponentType<{
    className?: string
    size?: number
  }>
  permissions?: string[]
  keywords?: string[]
  description?: string
  badge?: ReactNode
}

export interface WorkspaceDefinition {
  id: WorkspaceId
  label: string
  description: string
  defaultPath: string
  permissions?: string[]
}

export interface ResolvedNavigationGroup {
  id: string
  label: string
  items: NavigationItem[]
}
