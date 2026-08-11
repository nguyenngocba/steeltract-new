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
  roles: Array<{
    id: string
    name: string
    description?: string | null
    permissions?: Array<{ id: string; name: string; description?: string | null }>
  }>
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
  modules: Array<{
    key: string
    label: string
    permissions: Array<{
      id: string
      name: string
      action: string
      capability: string
      description?: string | null
    }>
  }>
  actions: string[]
  permissionCount: number
  permissions: Array<{ id: string; name: string; description?: string | null }>
  presets: Array<{
    key: string
    label: string
    permissions: string[]
  }>
}

export type SystemSettingsCatalog = {
  generatedAt: string
  categories: Array<{
    key: string
    label: string
    status: 'REAL_EDITABLE' | 'REAL_READ_ONLY' | 'ENV_READ_ONLY' | 'NOT_IMPLEMENTED'
    source: string
    editable: boolean
    count: number
    metadata?: Record<string, unknown>
  }>
  safeRuntime: {
    application: string
    environment: string
    timezone: string
    serverTime: string
  }
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
  userDetail: (id: string) => api.get<SystemUser>(`/system/users/${id}`).then((res) => res.data),
  createUser: (payload: {
    username: string
    email?: string
    fullName?: string
    password: string
    roleIds: string[]
  }) => api.post<SystemUser>('/system/users', payload).then((res) => res.data),
  updateUser: ({ id, payload }: { id: string; payload: { username?: string; email?: string; fullName?: string | null } }) =>
    api.patch<SystemUser>(`/system/users/${id}`, payload).then((res) => res.data),
  replaceUserRoles: ({ id, roleIds }: { id: string; roleIds: string[] }) =>
    api.put<SystemUser>(`/system/users/${id}/roles`, { roleIds }).then((res) => res.data),
  updateUserStatus: ({ id, status }: { id: string; status: 'ACTIVE' | 'BLOCKED' }) =>
    api.post<SystemUser>(`/system/users/${id}/status`, { status }).then((res) => res.data),
  resetUserPassword: ({ id, password }: { id: string; password: string }) =>
    api.post<SystemUser>(`/system/users/${id}/reset-password`, { password }).then((res) => res.data),
  roles: () => api.get<SystemRole[]>('/system/roles').then((res) => res.data),
  permissions: () => api.get<Array<{ id: string; name: string; description?: string | null }>>('/system/permissions').then((res) => res.data),
  createRole: (payload: { name: string; description?: string; permissionIds: string[] }) =>
    api.post<SystemRole>('/system/roles', payload).then((res) => res.data),
  updateRole: ({ id, payload }: { id: string; payload: { name?: string; description?: string | null } }) =>
    api.patch<SystemRole>(`/system/roles/${id}`, payload).then((res) => res.data),
  replaceRolePermissions: ({ id, permissionIds }: { id: string; permissionIds: string[] }) =>
    api.put<SystemRole>(`/system/roles/${id}/permissions`, { permissionIds }).then((res) => res.data),
  roleMatrix: () => api.get<RoleMatrix>('/system/role-matrix').then((res) => res.data),
  settingsCatalog: () => api.get<SystemSettingsCatalog>('/system/settings-catalog').then((res) => res.data),
  activityLogs: () => api.get<ActivityLog[]>('/system/activity-logs').then((res) => res.data),
  activitySummary: () => api.get<ActivitySummary>('/system/activity-summary').then((res) => res.data),
  notifications: () => api.get<SystemNotificationsResponse>('/system/notifications').then((res) => res.data),
  workflow: () => api.get<WorkflowCheck>('/runtime/operational-workflow').then((res) => res.data),
}
