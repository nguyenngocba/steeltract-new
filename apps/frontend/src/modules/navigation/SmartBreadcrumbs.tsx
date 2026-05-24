import {
  ChevronRight,
  Home,
} from 'lucide-react'
import {
  Link,
  useLocation,
} from 'react-router-dom'

import { findNavigationItemByPath } from './navigation.service'
import { workspaceRegistry } from './workspace-registry'

interface SmartBreadcrumbsProps {
  workspaceId: string
}

export function SmartBreadcrumbs({
  workspaceId,
}: SmartBreadcrumbsProps) {
  const location = useLocation()
  const item = findNavigationItemByPath(
    location.pathname,
  )
  const workspace =
    workspaceRegistry.find(
      (entry) => entry.id === workspaceId,
    ) ?? workspaceRegistry[0]

  return (
    <nav className="flex min-w-0 items-center gap-2 text-sm text-zinc-400">
      <Link
        to="/"
        className="inline-flex items-center gap-1 hover:text-white"
      >
        <Home className="h-3.5 w-3.5" />
        SteelTrack
      </Link>
      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">
        {workspace.label}
      </span>
      {item ? (
        <>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate text-zinc-200">
            {item.label}
          </span>
        </>
      ) : null}
    </nav>
  )
}
