import { api } from '@/lib/api'

export type SystemUser = {
  id: string
  username: string
  email?: string | null
  fullName?: string | null
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
  createdAt: string
  updatedAt: string
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
  activityLogs: () => api.get<ActivityLog[]>('/system/activity-logs').then((res) => res.data),
  workflow: () => api.get<WorkflowCheck>('/runtime/operational-workflow').then((res) => res.data),
}
