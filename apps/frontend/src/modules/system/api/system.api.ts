import { api } from '@/lib/api'

export type SystemUser = {
  id: string
  username: string
  email?: string | null
  fullName?: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
  createdAt: string
  updatedAt: string
  lastActivityAt?: string | null
  lastActivityAction?: string | null
  lastActivityModule?: string | null
  roles: Array<{ id: string; name: string; description?: string | null }>
}

export type SystemRole = {
  id: string
  name: string
  description?: string | null
  userCount: number
  permissions: Array<{ id: string; name: string; description?: string | null }>
  createdAt: string
  updatedAt: string
}

export type ActivityLog = {
  id: string
  action: string
  entity: string
  entityId?: string | null
  module?: string | null
  userId?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string
  user?: { username: string; fullName?: string | null; email?: string | null } | null
}

export type ActivitySummary = {
  total: number
  byAction: Record<string, number>
  byModule: Record<string, number>
  byDay: Record<string, number>
}

export type RoleMatrix = {
  modules: Array<{ key: string; label: string }>
  actions: string[]
  permissionCount: number
}

export type SystemNotification = {
  id: string
  title: string
  message: string
  type?: string | null
  severity?: string | null
  link?: string | null
  userId?: string | null
  isRead: boolean
  createdAt: string
  updatedAt: string
}

export type SystemNotificationsResponse = {
  summary: {
    total: number
    unread: number
    read: number
    highPriority: number
  }
  bySeverity: Record<string, number>
  byType: Record<string, number>
  items: SystemNotification[]
}

export type SystemOverview = {
  company: Record<string, string>
  system: Record<string, string>
  documents: Record<string, string | number>
  notifications: Record<string, boolean>
  integrations: Array<{ name: string; status: string }>
  backup: { enabled: boolean; frequency: string; retentionDays: number; storagePath: string }
  stats: Record<string, number>
  recentActivities: ActivityLog[]
}

export type WorkflowCheck = {
  generatedAt: string
  summary: Record<string, number>
  steps: Array<{ code: string; name: string; status: 'OK' | 'WARN' | 'BLOCKED'; detail: string }>
  blockers: Array<{ code: string; name: string; status: string; detail: string }>
  warnings: Array<{ code: string; name: string; status: string; detail: string }>
  samples: Record<string, unknown[]>
}

export const systemApi = {
  overview: () => api.get<SystemOverview>('/system/overview').then((res) => res.data),
  users: () => api.get<SystemUser[]>('/system/users').then((res) => res.data),
  roles: () => api.get<SystemRole[]>('/system/roles').then((res) => res.data),
  roleMatrix: () => api.get<RoleMatrix>('/system/role-matrix').then((res) => res.data),
  activityLogs: () => api.get<ActivityLog[]>('/system/activity-logs').then((res) => res.data),
  activitySummary: () => api.get<ActivitySummary>('/system/activity-summary').then((res) => res.data),
  notifications: () => api.get<SystemNotificationsResponse>('/system/notifications').then((res) => res.data),
  workflow: () => api.get<WorkflowCheck>('/runtime/operational-workflow').then((res) => res.data),
}
