import { LucideIcon } from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { useAuthStore } from '@/store/auth.store'

import { SidebarItem }
  from './SidebarItem'

type Item = {
  id?: string

  title: string

  path?: string

  children?: Item[]

  adminOnly?: boolean
}

type Props = {
  title: string

  icon?: LucideIcon

  items: Item[]
}

export function SidebarGroup({
  title,
  icon: Icon,
  items,
}: Props) {
  const user = useAuthStore((state) => state.user)
  const visibleItems =
    items.filter((item) => canAccessSidebarItem(item, user))

  const [open, setOpen] = useState(() => {
    try {
      const saved = window.localStorage.getItem(`steeltrack-app-sidebar-group:${title}`)
      if (saved !== null) return saved === 'true'
    } catch {
      // Ignore storage errors and keep the default open state.
    }
    return true
  })

  useEffect(() => {
    window.localStorage.setItem(`steeltrack-app-sidebar-group:${title}`, String(open))
  }, [open, title])

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="
          mb-2
          flex
          items-center
          justify-between
          gap-2
          w-full
          rounded-xl
          px-3 py-2
          text-xs
          font-semibold
          uppercase
          tracking-[0.18em]
          text-slate-500
          transition
          hover:bg-white/[0.06]
          hover:text-slate-300
        "
      >
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon
              size={14}
              className="text-cyan-400"
            />
          )}
          <span>{title}</span>
        </div>
        <ChevronDown
          size={14}
          className={`transition ${open ? 'rotate-180 text-cyan-300' : 'text-slate-600'}`}
        />
      </button>

      {open && (
        <div className="space-y-1 border-l border-white/10 pl-2">
          {visibleItems.map((item) => (
            <SidebarNavigationItem
              key={item.id ?? `${item.path ?? item.title}:${item.title}`}
              item={item}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SidebarNavigationItem({ item }: { item: Item }) {
  if (item.children?.length) {
    return (
      <SidebarNestedGroup
        item={item}
      />
    )
  }

  if (!item.path) return null

  return (
    <SidebarItem
      label={item.title}
      path={item.path}
    />
  )
}

function SidebarNestedGroup({ item }: { item: Item }) {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const children =
    item.children?.filter((child) => canAccessSidebarItem(child, user)) ?? []

  const activeChild =
    children.some((child) => {
      if (!child.path) return false
      return location.pathname === child.path
    })

  const storageKey =
    `steeltrack-app-sidebar-nested:${item.id ?? item.title}`

  const [open, setOpen] = useState(() => {
    try {
      const saved = window.sessionStorage.getItem(storageKey)
      if (saved !== null) return saved === 'true'
    } catch {
      // Ignore storage errors and derive from active route.
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
        className="
          flex
          w-full
          items-center
          justify-between
          rounded-lg
          px-3
          py-2.5
          text-sm
          font-semibold
          text-slate-300
          transition
          hover:bg-white/[0.07]
          hover:text-white
        "
      >
        <span>{item.title}</span>
        <ChevronDown
          size={14}
          className={`transition ${open ? 'rotate-180 text-cyan-300' : 'text-slate-600'}`}
        />
      </button>

      {open && (
        <div className="mt-1 space-y-1 border-l border-cyan-400/15 pl-2">
          {children.map((child) => (
            <SidebarNavigationItem
              key={child.id ?? `${child.path ?? child.title}:${child.title}`}
              item={child}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function canAccessSidebarItem(item: Item, user: ReturnType<typeof useAuthStore.getState>['user']) {
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
