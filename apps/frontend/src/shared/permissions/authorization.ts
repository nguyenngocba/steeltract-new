import type { AuthUser } from '@/lib/auth/auth.types'

const LEGACY_GRANTS: Record<string, readonly string[]> = {
  'dashboard.view': ['analytics.read'],
  'dashboard.executive': ['analytics.read'],
  'settings.view': ['master-data.read', 'rbac.read'],
  'settings.edit': ['master-data.write', 'rbac.write'],
  'users.view': ['rbac.read'],
  'users.create': ['rbac.write'],
  'users.edit': ['rbac.write'],
  'users.disable': ['rbac.write'],
  'roles.view': ['rbac.read'],
  'roles.edit': ['rbac.write'],
  'permissions.view': ['rbac.read'],
  'suppliers.view': ['master-data.read'],
  'suppliers.edit': ['master-data.write'],
  'planning.view': ['production.read', 'projects.read'],
}

export function hasPermission(
  permissions: readonly string[] | undefined,
  requiredPermission: string,
) {
  const permissionSet = new Set(permissions ?? [])
  if (permissionSet.has('*') || permissionSet.has(requiredPermission)) return true

  const [moduleKey, action] = requiredPermission.split('.')
  const legacyModule =
    moduleKey === 'users' || moduleKey === 'roles' || moduleKey === 'permissions'
      ? 'rbac'
      : moduleKey === 'settings' || moduleKey === 'suppliers'
        ? 'master-data'
        : moduleKey
  const broadPermission =
    action === 'view' ? `${legacyModule}.read` : `${legacyModule}.write`

  return (
    permissionSet.has(broadPermission) ||
    (LEGACY_GRANTS[requiredPermission] ?? []).some((permission) =>
      permissionSet.has(permission),
    )
  )
}

export function hasAnyPermission(
  permissions: readonly string[] | undefined,
  requiredPermissions: readonly string[],
) {
  return requiredPermissions.some((permission) =>
    hasPermission(permissions, permission),
  )
}

export function canAccessPath(user: AuthUser | null, pathname: string) {
  if (!user) return false
  const required = permissionsForPath(pathname)
  return required.length === 0 || hasAnyPermission(user.permissions, required)
}

export function permissionsForPath(pathname: string): readonly string[] {
  const path = pathname.split('?')[0]

  if (path === '/unauthorized') return []
  if (path === '/') return ['dashboard.view']
  if (path === '/history') return ['dashboard.executive']
  if (path.startsWith('/inventory') || path.startsWith('/warehouse-realtime') || path.startsWith('/material-movements')) {
    return ['inventory.view']
  }
  if (path.startsWith('/components')) return ['components.view']
  if (path.startsWith('/production')) return ['production.view']
  if (path.startsWith('/qc')) return ['qc.view']
  if (path.startsWith('/projects')) return ['projects.view']
  if (path.startsWith('/yard')) return ['yard.view']
  if (path.startsWith('/logistics')) return ['logistics.view']
  if (path.startsWith('/planning')) return ['planning.view']
  if (path.startsWith('/suppliers') || path.startsWith('/procurement')) return ['suppliers.view']
  if (path.startsWith('/users')) return ['users.view']
  if (path.startsWith('/roles')) return ['roles.view']
  if (path.startsWith('/settings')) return ['settings.view']
  if (path.startsWith('/system-logs')) return ['permissions.view']
  if (path.startsWith('/notifications')) return ['dashboard.view']
  if (path.startsWith('/operations-center')) return ['settings.view', 'dashboard.executive']

  return ['dashboard.executive']
}
