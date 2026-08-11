import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/store/auth.store'

import {
  canAccessPath,
  hasAnyPermission,
  hasPermission,
} from './authorization'

type PermissionGateProps = {
  children: ReactNode
  permission?: string
  anyOf?: readonly string[]
  fallback?: ReactNode
}

export function usePermission(permission: string) {
  const permissions = useAuthStore((state) => state.user?.permissions)
  return hasPermission(permissions, permission)
}

export function useModuleAccess(module: string) {
  return usePermission(`${module}.view`)
}

export function PermissionGate({
  children,
  permission,
  anyOf,
  fallback = null,
}: PermissionGateProps) {
  const permissions = useAuthStore((state) => state.user?.permissions)
  const allowed = permission
    ? hasPermission(permissions, permission)
    : anyOf
      ? hasAnyPermission(permissions, anyOf)
      : true

  return allowed ? <>{children}</> : <>{fallback}</>
}

export const PermissionGuard = PermissionGate
export const ActionGuard = PermissionGate

export function RoutePermissionGuard({ children }: { children: ReactNode }) {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)

  if (!user) return null
  if (!canAccessPath(user, location.pathname)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
