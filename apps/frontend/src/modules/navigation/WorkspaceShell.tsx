import {
  Menu,
  Search,
  X,
} from 'lucide-react'
import {
  useMemo,
  useState,
} from 'react'
import type {
  ReactNode,
} from 'react'
import {
  useNavigate,
} from 'react-router-dom'

import {
  CommandPalette,
} from '../../components/ui-system'
import { useCurrentUser } from '../../lib/auth/useCurrentUser'
import { useAuthStore } from '../../store/auth.store'
import { DynamicSidebar } from './DynamicSidebar'
import { FavoriteModulesPanel } from './FavoriteModulesPanel'
import { NotificationCenter } from './NotificationCenter'
import { QuickActionsPanel } from './QuickActionsPanel'
import { RecentItemsPanel } from './RecentItemsPanel'
import { SmartBreadcrumbs } from './SmartBreadcrumbs'
import { WorkspaceSwitcher } from './WorkspaceSwitcher'
import {
  getVisibleNavigationItems,
  getVisibleWorkspaces,
  groupNavigationItems,
  resolveWorkspaceFromPath,
  searchNavigationItems,
} from './navigation.service'
import {
  readFavoriteIds,
  readRecentIds,
  writeFavoriteIds,
  writeRecentIds,
} from './navigation-storage'
import { workspaceRegistry } from './workspace-registry'

import type {
  NavigationItem,
  WorkspaceId,
} from './navigation.types'

interface WorkspaceShellProps {
  children: ReactNode
}

export function WorkspaceShell({
  children,
}: WorkspaceShellProps) {
  const navigate = useNavigate()
  const storeUser = useAuthStore(
    (state) => state.user,
  )
  const { data: currentUser } =
    useCurrentUser()
  const user = currentUser ?? storeUser
  const [activeWorkspaceId, setActiveWorkspaceId] =
    useState<WorkspaceId>(() =>
      resolveWorkspaceFromPath(
        window.location.pathname,
      ),
    )
  const [favoriteIds, setFavoriteIds] =
    useState<string[]>(readFavoriteIds)
  const [recentIds, setRecentIds] =
    useState<string[]>(readRecentIds)
  const [mobileOpen, setMobileOpen] =
    useState(false)
  const [
    commandPaletteOpen,
    setCommandPaletteOpen,
  ] = useState(false)
  const [commandQuery, setCommandQuery] =
    useState('')

  const workspaces = useMemo(
    () => getVisibleWorkspaces(user),
    [user],
  )
  const activeWorkspace =
    workspaces.find(
      (workspace) =>
        workspace.id === activeWorkspaceId,
    ) ??
    workspaces[0] ??
    workspaceRegistry[0]
  const workspaceItems = useMemo(
    () =>
      getVisibleNavigationItems(
        user,
        activeWorkspace.id,
      ),
    [activeWorkspace.id, user],
  )
  const allVisibleItems = useMemo(
    () => getVisibleNavigationItems(user),
    [user],
  )
  const groups = useMemo(
    () => groupNavigationItems(workspaceItems),
    [workspaceItems],
  )
  const favoriteItems = useMemo(
    () =>
      favoriteIds
        .map((id) =>
          allVisibleItems.find(
            (item) => item.id === id,
          ),
        )
        .filter(
          (item): item is NavigationItem =>
            Boolean(item),
        ),
    [allVisibleItems, favoriteIds],
  )
  const recentItems = useMemo(
    () =>
      recentIds
        .map((id) =>
          allVisibleItems.find(
            (item) => item.id === id,
          ),
        )
        .filter(
          (item): item is NavigationItem =>
            Boolean(item),
        ),
    [allVisibleItems, recentIds],
  )
  function handleWorkspaceChange(
    workspaceId: WorkspaceId,
  ) {
    const workspace =
      workspaceRegistry.find(
        (item) => item.id === workspaceId,
      ) ?? workspaceRegistry[0]
    const firstVisibleItem =
      getVisibleNavigationItems(
        user,
        workspaceId,
      )[0]

    setActiveWorkspaceId(workspaceId)
    navigate(
      firstVisibleItem?.path ??
        workspace.defaultPath,
    )
  }

  function handleToggleFavorite(
    itemId: string,
  ) {
    setFavoriteIds((current) => {
      const next = current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [itemId, ...current]

      writeFavoriteIds(next)

      return next
    })
  }

  function handleNavigate(item: NavigationItem) {
    setActiveWorkspaceId(item.workspaceIds[0])
    setMobileOpen(false)
    setRecentIds((current) => {
      const next = [
        item.id,
        ...current.filter(
          (id) => id !== item.id,
        ),
      ].slice(0, 8)

      writeRecentIds(next)

      return next
    })
  }

  const commandItems = searchNavigationItems(
    allVisibleItems,
    commandQuery,
  ).map((item) => ({
    id: item.id,
    label: item.label,
    description: item.description ?? item.path,
    onSelect: () => {
      handleNavigate(item)
      navigate(item.path)
    },
  }))

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-zinc-800 px-4 py-4">
        <h1 className="text-xl font-bold text-cyan-400">
          SteelTrack
        </h1>
        <p className="mt-1 text-xs text-zinc-500">
          Enterprise ERP workspace
        </p>
        <div className="mt-4">
          <WorkspaceSwitcher
            workspaces={workspaces}
            activeWorkspaceId={
              activeWorkspace.id
            }
            onChange={handleWorkspaceChange}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <FavoriteModulesPanel
          items={favoriteItems}
          onNavigate={handleNavigate}
        />
        <DynamicSidebar
          groups={groups}
          favoriteIds={favoriteIds}
          onToggleFavorite={
            handleToggleFavorite
          }
          onNavigate={handleNavigate}
        />
        <RecentItemsPanel
          items={recentItems}
          onNavigate={handleNavigate}
        />
        <QuickActionsPanel
          items={workspaceItems}
          onOpenCommandPalette={() =>
            setCommandPaletteOpen(true)
          }
          onNavigate={handleNavigate}
        />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--color-app)] text-white md:flex">
      <aside className="hidden w-72 shrink-0 border-r border-zinc-800 bg-zinc-950/95 md:block">
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-full w-80 max-w-[85vw] border-r border-zinc-800 bg-zinc-950">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute right-3 top-3 rounded-lg border border-zinc-800 p-2 text-zinc-300"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-950/90 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 text-zinc-300 md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <SmartBreadcrumbs
                workspaceId={
                  activeWorkspace.id
                }
              />
              <p className="mt-1 truncate text-sm text-zinc-500">
                {activeWorkspace.description}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setCommandPaletteOpen(true)
              }
              className="hidden h-10 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-300 hover:text-white lg:inline-flex"
            >
              <Search className="h-4 w-4" />
              Search modules
            </button>
            <NotificationCenter />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-white">
                {user?.fullName ??
                  user?.username ??
                  'User'}
              </p>
              <p className="text-xs text-zinc-500">
                {user?.roles?.[0] ??
                  'Operator'}
              </p>
            </div>
            <div
              className="h-9 w-9 rounded-full bg-cyan-500"
              aria-hidden="true"
            />
          </div>
        </header>

        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>

      <CommandPalette
        open={commandPaletteOpen}
        query={commandQuery}
        items={commandItems}
        onQueryChange={setCommandQuery}
        onClose={() =>
          setCommandPaletteOpen(false)
        }
      />
    </div>
  )
}
