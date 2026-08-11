import {

  ChevronDown,

} from 'lucide-react'

import {

  NavLink,
  useLocation,

} from 'react-router-dom'

import {

  useEffect,
  useLayoutEffect,
  useRef,
  useState,

} from 'react'

import {

  navigation,

} from '../../config/navigation.config'
import { useAuthStore } from '../../../store/auth.store'
import { canAccessPath, hasPermission } from '../../../shared/permissions/authorization'

type NavigationItem = {
  id?: string
  title: string
  path?: string
  children?: NavigationItem[]
  adminOnly?: boolean
}

export function EnterpriseSidebar() {
  const navRef = useRef<HTMLDivElement>(null)
  const user = useAuthStore((state) => state.user)

  const [opened, setOpened] = useState<
    Record<string, boolean>
  >(() => {
    try {
      const saved = window.localStorage.getItem('steeltrack-sidebar-opened')
      if (saved) return JSON.parse(saved)
    } catch {
      // Ignore unavailable storage and use defaults.
    }

    return {
      'TỔNG QUAN': true,
      'VẬT TƯ KHO': true,
      'CẤU KIỆN': true,
    }
  })

  useEffect(() => {
    window.localStorage.setItem('steeltrack-sidebar-opened', JSON.stringify(opened))
  }, [opened])

  useLayoutEffect(() => {
    const element = navRef.current
    if (!element) return

    const saved = Number(window.sessionStorage.getItem('steeltrack-sidebar-scroll') ?? 0)
    if (Number.isFinite(saved)) element.scrollTop = saved
  }, [])

  return (

    <div className="flex h-screen w-[340px] flex-col border-r border-zinc-800 bg-zinc-950">

      {/* HEADER */}

      <div className="border-b border-zinc-800 p-6">

        <div className="text-3xl font-black tracking-wide text-cyan-400">

          STEELTRACK

        </div>

        <div className="mt-2 text-xs uppercase tracking-[0.3em] text-zinc-500">

          Enterprise Operations Platform

        </div>

      </div>

      {/* NAVIGATION */}

      <div
        ref={navRef}
        onScroll={(event) => {
          window.sessionStorage.setItem('steeltrack-sidebar-scroll', String(event.currentTarget.scrollTop))
        }}
        className="flex-1 overflow-auto px-4 py-5"
      >

        <div className="space-y-4">

          {navigation.map((group) => {

            const Icon = group.icon
            const visibleChildren = group.children.filter((item) =>
              canAccessNavigationItem(item, user),
            )

            if (visibleChildren.length === 0) return null

            const isOpen =
              opened[group.title]

            return (

              <div
                key={group.title}
              >

                <button

                  onClick={() =>

                    setOpened((prev) => ({

                      ...prev,

                      [group.title]:
                        !prev[group.title],

                    }))
                  }

                  className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition hover:bg-zinc-900"
                >

                  <div className="flex items-center gap-3">

                    <Icon
                      size={18}
                      className="text-cyan-400"
                    />

                    <span className="text-sm font-bold tracking-wide text-zinc-200">

                      {group.title}

                    </span>

                  </div>

                  <ChevronDown

                    size={16}

                    className={`text-zinc-500 transition ${
                      isOpen
                        ? 'rotate-180'
                        : ''
                    }`}
                  />

                </button>

                {isOpen && (

                  <div className="mt-2 space-y-1 border-l border-zinc-800 pl-5">

                    {visibleChildren.map((item) => (
                      <EnterpriseSidebarItem
                        key={item.id ?? `${item.path ?? item.title}:${item.title}`}
                        item={item}
                        onNavigate={() => {
                          const element = navRef.current
                          if (element) {
                            window.sessionStorage.setItem('steeltrack-sidebar-scroll', String(element.scrollTop))
                          }
                        }}
                      />
                    ))}

                  </div>

                )}

              </div>

            )
          })}

        </div>

      </div>

    </div>
  )
}

function EnterpriseSidebarItem({
  item,
  onNavigate,
}: {
  item: NavigationItem
  onNavigate: () => void
}) {
  const user = useAuthStore((state) => state.user)
  if (!canAccessNavigationItem(item, user)) return null

  if (item.children?.length) {
    return (
      <EnterpriseSidebarNestedGroup
        item={item}
        onNavigate={onNavigate}
      />
    )
  }

  if (!item.path) return null

  return (
    <NavLink
      to={item.path}
      onMouseDown={(event) => {
        event.currentTarget.blur()
      }}
      onFocus={(event) => {
        event.currentTarget.blur()
      }}
      onClick={onNavigate}
      className={({ isActive }) => `block rounded-xl px-4 py-3 text-sm transition ${
        isActive
          ? 'bg-cyan-500/10 text-cyan-300'
          : 'text-zinc-500 hover:bg-zinc-900 hover:text-white'
      }`}
    >
      {item.title}
    </NavLink>
  )
}

function EnterpriseSidebarNestedGroup({
  item,
  onNavigate,
}: {
  item: NavigationItem
  onNavigate: () => void
}) {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const children = item.children?.filter((child) => canAccessNavigationItem(child, user)) ?? []
  const activeChild = children.some((child) => child.path === location.pathname)
  const storageKey = `steeltrack-sidebar-nested:${item.id ?? item.title}`

  const [open, setOpen] = useState(() => {
    try {
      const saved = window.sessionStorage.getItem(storageKey)
      if (saved !== null) return saved === 'true'
    } catch {
      // Ignore unavailable storage and derive from the active route.
    }
    return activeChild
  })

  useEffect(() => {
    if (activeChild) setOpen(true)
  }, [activeChild])

  useEffect(() => {
    window.sessionStorage.setItem(storageKey, String(open))
  }, [open, storageKey])

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-semibold text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
      >
        <span>{item.title}</span>
        <ChevronDown
          size={15}
          className={`text-zinc-500 transition ${open ? 'rotate-180 text-cyan-300' : ''}`}
        />
      </button>

      {open && (
        <div className="mt-1 space-y-1 border-l border-cyan-400/15 pl-3">
          {children.map((child) => (
            <EnterpriseSidebarItem
              key={child.id ?? `${child.path ?? child.title}:${child.title}`}
              item={child}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function canAccessNavigationItem(
  item: NavigationItem,
  user: ReturnType<typeof useAuthStore.getState>['user'],
) {
  if (!user) return false
  if (item.path && !canAccessPath(user, item.path)) return false
  return !item.adminOnly || hasPermission(user.permissions, 'permissions.view')
}
