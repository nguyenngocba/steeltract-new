import {
  CircleHelp,
  Menu,
  RadioTower,
  Search,
  ShieldCheck,
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
import { LanguageSwitcher } from './LanguageSwitcher'
import { NotificationCenter } from './NotificationCenter'
import { SmartBreadcrumbs } from './SmartBreadcrumbs'
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

const sidebarCoreItemIds = new Set([
  'dashboard',
  'inventory',
  'components',
  'operations-production',
  'schedule',
  'operations-yard',
  'projects',
  'suppliers',
  'operations-qc',
  'vehicles',
  'users',
  'roles',
  'system-logs',
  'administration',
  'backup',
])

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
  const [, setRecentIds] =
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
  const allVisibleItems = useMemo(
    () => getVisibleNavigationItems(user),
    [user],
  )
  const sidebarItems = useMemo(
    () =>
      allVisibleItems.filter((item) =>
        sidebarCoreItemIds.has(item.id),
      ),
    [allVisibleItems],
  )
  const groups = useMemo(
    () => groupNavigationItems(sidebarItems),
    [sidebarItems],
  )
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
    <div className="flex h-full flex-col bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.15),transparent_34%),linear-gradient(180deg,rgba(9,18,31,0.98),rgba(3,7,18,0.98))]">
      <div className="relative overflow-hidden border-b border-cyan-500/15 px-4 py-4">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.045)_1px,transparent_1px)] bg-[size:28px_28px]" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/10 shadow-[0_0_32px_rgba(37,99,235,0.22)]">
            <ShieldCheck className="h-5 w-5 text-blue-200" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold uppercase tracking-wide text-white">
              SteelTrack
            </h1>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.22em] text-cyan-200/80">
              ERP Platform
            </p>
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-wide">
          <span className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-center text-emerald-300">
            live
          </span>
          <span className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-2 py-1 text-center text-cyan-300">
            MES
          </span>
          <span className="rounded-lg border border-blue-500/25 bg-blue-500/10 px-2 py-1 text-center text-blue-200">
            ERP
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <DynamicSidebar
          groups={groups}
          favoriteIds={favoriteIds}
          onToggleFavorite={
            handleToggleFavorite
          }
          onNavigate={handleNavigate}
        />
        <div className="mt-5 rounded-lg border border-cyan-500/10 bg-[#06111f]/80 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-100/60">
            workspace command
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-wide">
            <button
              type="button"
              onClick={() =>
                setCommandPaletteOpen(true)
              }
              className="rounded-lg border border-blue-500/25 bg-blue-500/10 px-2 py-2 text-blue-200 hover:bg-blue-500/20"
            >
              search
            </button>
            <span className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2 py-2 text-center text-emerald-300">
              live
            </span>
            <span className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-2 py-2 text-center text-amber-200">
              shift
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(14,165,233,0.12),transparent_30%),linear-gradient(135deg,#020617,#07111f_52%,#020617)] text-white md:flex">
      <aside className="hidden w-[264px] shrink-0 border-r border-cyan-500/10 bg-zinc-950/95 md:block">
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
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-4 border-b border-cyan-500/10 bg-[#06111f]/95 px-4 py-3 shadow-[0_14px_40px_rgba(0,0,0,0.22)] backdrop-blur md:px-6">
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
              className="hidden h-10 min-w-64 items-center justify-between gap-8 rounded-lg border border-cyan-500/15 bg-zinc-950/70 px-3 text-sm text-zinc-400 shadow-inner hover:border-cyan-500/35 hover:text-white lg:inline-flex"
            >
              <span className="inline-flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search operations
              </span>
              <span className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-500">
                Ctrl K
              </span>
            </button>
            <span className="hidden items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-2 text-xs text-emerald-300 xl:inline-flex">
              <RadioTower className="h-3.5 w-3.5" />
              live
            </span>
            <NotificationCenter />
            <button
              className="hidden h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950/70 text-zinc-300 lg:inline-flex"
              aria-label="Operational help"
              type="button"
            >
              <CircleHelp className="h-4 w-4" />
            </button>
            <LanguageSwitcher />
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
              className="h-9 w-9 rounded-full border border-cyan-300/30 bg-gradient-to-br from-blue-500 to-violet-600 shadow-[0_0_24px_rgba(59,130,246,0.28)]"
              aria-hidden="true"
            />
          </div>
        </header>

        <main className="p-3 md:p-4 xl:p-5">
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
