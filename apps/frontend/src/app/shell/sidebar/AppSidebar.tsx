import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { navigation }
  from './navigation.config'

import { SidebarGroup }
  from './SidebarGroup'
import { useAuthStore } from '@/store/auth.store'

type NavigationItem = {
  id?: string
  title: string
  path?: string
  children?: NavigationItem[]
  adminOnly?: boolean
}

type NavigationGroup = {
  title: string
  icon?: LucideIcon
  children: NavigationItem[]
}

type Props = {
  collapsed?: boolean
  onToggleCollapsed?: () => void
}

export function AppSidebar({ collapsed = false, onToggleCollapsed }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeFlyout, setActiveFlyout] = useState<{ title: string; top: number } | null>(null)
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const visibleNavigation = useMemo(
    () => (navigation as NavigationGroup[]).map((group) => ({
      ...group,
      children: filterNavigationItems(group.children, user),
    })).filter((group) => group.children.length > 0),
    [user],
  )

  useLayoutEffect(() => {
    const element = scrollRef.current
    if (!element) return

    const saved = Number(window.sessionStorage.getItem('steeltrack-app-sidebar-scroll') ?? 0)
    if (Number.isFinite(saved)) element.scrollTop = saved
  }, [])

  useEffect(() => {
    if (!collapsed || !activeFlyout) return

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement | null
      if (target?.closest('[data-mini-sidebar-root="true"]')) return
      if (target?.closest('[data-mini-sidebar-flyout="true"]')) return
      setActiveFlyout(null)
    }

    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [activeFlyout, collapsed])

  useEffect(() => {
    setActiveFlyout(null)
  }, [location.pathname])

  if (collapsed) {
    return (
      <aside data-mini-sidebar-root="true" className="relative z-40 flex h-screen w-16 flex-col items-center border-r border-white/10 bg-[#07111f] py-3 shadow-[12px_0_34px_rgba(0,0,0,0.22)]">
        <button
          type="button"
          onClick={onToggleCollapsed}
          title="Hiện sidebar"
          className="rounded-xl border border-white/10 bg-white/[0.06] p-2 text-cyan-300 transition hover:bg-white/10 hover:text-cyan-100"
        >
          <PanelLeftOpen size={18} />
        </button>
        <div className="mt-3 h-px w-9 bg-white/10" />

        <div className="mt-3 flex w-full flex-1 flex-col items-center gap-2 overflow-y-auto px-2">
          {visibleNavigation.map((group) => {
            const Icon = group.icon
            const active = groupHasActiveRoute(group, location.pathname)
            const flyoutOpen = activeFlyout?.title === group.title

            return (
              <div key={group.title} className="relative">
                <button
                  type="button"
                  title={group.title}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    const rect = event.currentTarget.getBoundingClientRect()
                    setActiveFlyout((current) =>
                      current?.title === group.title
                        ? null
                        : {
                            title: group.title,
                            top: clampFlyoutTop(rect.top),
                          },
                    )
                  }}
                  className={`group relative grid h-10 w-10 cursor-pointer place-items-center rounded-xl border transition pointer-events-auto ${
                    active
                      ? 'border-cyan-300/40 bg-blue-600/90 text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)]'
                      : 'border-white/10 bg-white/[0.055] text-slate-400 hover:border-cyan-400/35 hover:bg-cyan-400/10 hover:text-cyan-200'
                  }`}
                >
                  {Icon ? <Icon size={18} /> : <span className="text-xs font-semibold">{group.title.slice(0, 1)}</span>}
                  <span className="pointer-events-none absolute left-12 top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-slate-950 px-2 py-1 text-[11px] font-semibold text-slate-200 opacity-0 shadow-xl transition group-hover:opacity-100">
                    {group.title}
                  </span>
                </button>

                {flyoutOpen && (
                  <MiniSidebarFlyout
                    group={group}
                    activePath={location.pathname}
                    top={activeFlyout.top}
                    onNavigate={() => setActiveFlyout(null)}
                  />
                )}
              </div>
            )
          })}
        </div>
      </aside>
    )
  }

  return (
    <aside
      className="
        flex
        h-screen
        w-[280px]
        flex-col
        border-r
        border-white/10
        bg-[linear-gradient(180deg,#07111f_0%,#0c1423_52%,#08101d_100%)]
        shadow-[18px_0_50px_rgba(0,0,0,0.22)]
      "
    >
      <div
        className="
          border-b
          border-white/10
          px-5
          py-4
        "
      >
        <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-300">
          SteelTrack
        </div>

        <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
          ERP Platform
        </div>

        <div className="mt-1 text-xs text-slate-500">
          Smart Factory Operations
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={(event) => {
          window.sessionStorage.setItem('steeltrack-app-sidebar-scroll', String(event.currentTarget.scrollTop))
        }}
        className="
          flex-1
          space-y-5
          overflow-y-auto
          p-3
          [scrollbar-color:rgba(148,163,184,0.35)_transparent]
        "
      >
        {visibleNavigation.map((group) => (
          <SidebarGroup
            key={group.title}
            title={group.title}
            icon={group.icon}
            items={group.children}
          />
        ))}
      </div>

      <div
        className="
          border-t
          border-white/10
          p-3
        "
      >
        <div
          className="
            rounded-xl
            border
            border-white/10
            bg-white/[0.055]
            p-4
            shadow-[0_14px_34px_rgba(0,0,0,0.18)]
            backdrop-blur-xl
          "
        >
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.055] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200"
          >
            <PanelLeftClose size={15} />
            Ẩn sidebar
          </button>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Trạng thái hệ thống
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div
              className="
                h-3
                w-3
                rounded-full
                bg-emerald-500
              "
            />

            <div className="text-sm font-medium text-white">
              Operational
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

function MiniSidebarFlyout({
  group,
  activePath,
  top,
  onNavigate,
}: {
  group: NavigationGroup
  activePath: string
  top: number
  onNavigate: () => void
}) {
  return (
    <div
      data-mini-sidebar-flyout="true"
      className="pointer-events-auto fixed left-16 z-[1000] w-72 rounded-2xl border border-cyan-300/15 bg-slate-950/95 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.45)] ring-1 ring-cyan-400/10 backdrop-blur-xl"
      style={{ top }}
    >
      <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
        {group.title}
      </div>
      <div className="space-y-1">
        {group.children.map((item) => (
          <MiniSidebarItem
            key={item.id ?? `${item.path ?? item.title}:${item.title}`}
            item={item}
            activePath={activePath}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  )
}

function clampFlyoutTop(top: number) {
  const viewportHeight = window.innerHeight || 720
  const estimatedFlyoutHeight = 420
  const maxTop = Math.max(12, viewportHeight - estimatedFlyoutHeight - 12)
  return Math.min(Math.max(12, top), maxTop)
}

function MiniSidebarItem({
  item,
  activePath,
  onNavigate,
  depth = 0,
}: {
  item: NavigationItem
  activePath: string
  onNavigate: () => void
  depth?: number
}) {
  if (item.children?.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-1">
        <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          {item.title}
        </div>
        <div className="space-y-1">
          {item.children.map((child) => (
            <MiniSidebarItem
              key={child.id ?? `${child.path ?? child.title}:${child.title}`}
              item={child}
              activePath={activePath}
              onNavigate={onNavigate}
              depth={depth + 1}
            />
          ))}
        </div>
      </div>
    )
  }

  if (!item.path) return null

  const active = isRouteActive(item.path, activePath)

  return (
    <Link
      to={item.path}
      onClick={onNavigate}
      className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? 'bg-blue-600/95 text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)]'
          : 'text-slate-400 hover:bg-white/[0.07] hover:text-white'
      } ${depth ? 'ml-1' : ''}`}
    >
      {item.title}
    </Link>
  )
}

function filterNavigationItems(items: NavigationItem[], user: ReturnType<typeof useAuthStore.getState>['user']): NavigationItem[] {
  return items.flatMap((item) => {
    if (!canAccessNavigationItem(item, user)) return []
    const children = item.children ? filterNavigationItems(item.children, user) : undefined
    if (item.children && !children?.length) return []
    return [{ ...item, children }]
  })
}

function canAccessNavigationItem(item: NavigationItem, user: ReturnType<typeof useAuthStore.getState>['user']) {
  if (!item.adminOnly) return true
  if (!user) return false

  const roles = user.roles?.map((role) => role.toLowerCase()) ?? []
  const permissions = user.permissions ?? []

  return (
    roles.some((role) => role.includes('admin') || role.includes('quản trị')) ||
    permissions.includes('*') ||
    permissions.includes('admin.read') ||
    permissions.includes('admin.write')
  )
}

function groupHasActiveRoute(group: NavigationGroup, activePath: string) {
  return group.children.some((item) => itemHasActiveRoute(item, activePath))
}

function itemHasActiveRoute(item: NavigationItem, activePath: string): boolean {
  if (item.path && isRouteActive(item.path, activePath)) return true
  return item.children?.some((child) => itemHasActiveRoute(child, activePath)) ?? false
}

function isRouteActive(path: string, activePath: string) {
  const normalizedPath = path.split('?')[0].split('#')[0]
  if (normalizedPath === '/') return activePath === '/'
  return activePath === normalizedPath || activePath.startsWith(`${normalizedPath}/`)
}
