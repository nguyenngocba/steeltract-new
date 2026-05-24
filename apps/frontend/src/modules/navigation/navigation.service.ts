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
      (role) =>
        role.toLowerCase() === 'admin' ||
        role.toLowerCase() ===
          'administrator',
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

  return [...groups.entries()].map(
    ([label, groupItems]) => ({
      id: label
        .toLowerCase()
        .replaceAll(' ', '-'),
      label,
      items: groupItems,
    }),
  )
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
