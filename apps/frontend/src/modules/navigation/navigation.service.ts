import type {
  AuthUser,
} from '../../lib/auth/auth.types'
import { navigationRegistry } from './navigation-registry'
import { workspaceRegistry } from './workspace-registry'

import type {
  NavigationItem,
  ResolvedNavigationGroup,
  WorkspaceId,
} from './navigation.types'

export function isAdmin(user?: AuthUser | null) {
  return Boolean(
    user?.roles?.some(
      (role) => {
        const normalized = role
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')

        return (
          normalized === 'admin' ||
          normalized === 'administrator' ||
          normalized.includes('quan tri') ||
          normalized.includes('system admin')
        )
      },
    ),
  )
}

export function hasPermissions(
  user: AuthUser | null | undefined,
  permissions?: string[],
) {
  if (!permissions || permissions.length === 0) {
    return true
  }

  if (isAdmin(user)) {
    return true
  }

  return permissions.every((permission) =>
    user?.permissions?.includes(permission),
  )
}

export function getVisibleWorkspaces(
  user?: AuthUser | null,
) {
  return workspaceRegistry.filter((workspace) =>
    hasPermissions(
      user,
      workspace.permissions,
    ),
  )
}

export function getVisibleNavigationItems(
  user?: AuthUser | null,
  workspaceId?: WorkspaceId,
) {
  return navigationRegistry.filter((item) => {
    const workspaceMatch = workspaceId
      ? item.workspaceIds.includes(workspaceId)
      : true

    return (
      workspaceMatch &&
      hasPermissions(user, item.permissions)
    )
  })
}

export function groupNavigationItems(
  items: NavigationItem[],
): ResolvedNavigationGroup[] {
  const groupOrder = [
    'COMMAND CENTER',
    'MODULES',
    'MASTER DATA',
    'INTELLIGENCE',
    'SYSTEM',
  ]
  const itemOrder = [
    'dashboard',
    'executive',
    'inventory',
    'operations-warehouse',
    'master-data-center',
    'master-data-uom',
    'receiving',
    'dispatch',
    'return-workflow',
    'reservations',
    'operations-yard',
    'yard-map',
    'components',
    'operations-production',
    'schedule',
    'projects',
    'operations-projects',
    'suppliers',
    'operations-qc',
    'vehicles',
    'transactions',
    'qr-scan',
    'work-centers',
    'machines',
    'workers',
    'operators',
    'attendance',
    'equipment',
    'inspections',
    'ncr',
    'rework',
    'procurement',
    'purchase-orders',
    'material-requests',
    'workflow-operations',
    'site-logs',
    'analytics',
    'alerts',
    'reports',
    'anomalies',
    'boq',
    'ocr',
    'users',
    'roles',
    'system-logs',
    'administration',
    'backup',
    'jobs',
    'attachments',
    'simulation',
  ]
  const groups = new Map<
    string,
    NavigationItem[]
  >()

  items.forEach((item) => {
    groups.set(item.group, [
      ...(groups.get(item.group) ?? []),
      item,
    ])
  })

  return [...groups.entries()]
    .sort(([a], [b]) => {
      const aIndex = groupOrder.indexOf(a)
      const bIndex = groupOrder.indexOf(b)

      if (aIndex === -1 && bIndex === -1) {
        return a.localeCompare(b)
      }

      if (aIndex === -1) {
        return 1
      }

      if (bIndex === -1) {
        return -1
      }

      return aIndex - bIndex
    })
    .map(([label, groupItems]) => ({
      id: label
        .toLowerCase()
        .replaceAll(' ', '-'),
      label,
      items: [...groupItems].sort((a, b) => {
        const aIndex = itemOrder.indexOf(a.id)
        const bIndex = itemOrder.indexOf(b.id)

        if (aIndex === -1 && bIndex === -1) {
          return a.label.localeCompare(b.label)
        }

        if (aIndex === -1) {
          return 1
        }

        if (bIndex === -1) {
          return -1
        }

        return aIndex - bIndex
      }),
    }))
}

export function resolveWorkspaceFromPath(
  path: string,
): WorkspaceId {
  const item = navigationRegistry.find(
    (entry) => entry.path === path,
  )

  return item?.workspaceIds[0] ?? 'management'
}

export function findNavigationItemByPath(
  path: string,
) {
  return (
    navigationRegistry.find(
      (item) => item.path === path,
    ) ??
    navigationRegistry.find(
      (item) =>
        item.path !== '/' &&
        path.startsWith(item.path),
    )
  )
}

export function searchNavigationItems(
  items: NavigationItem[],
  query: string,
) {
  const normalized = query
    .trim()
    .toLowerCase()

  if (!normalized) {
    return items
  }

  return items.filter((item) => {
    const haystack = [
      item.label,
      item.description,
      item.group,
      item.path,
      ...(item.keywords ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalized)
  })
}
