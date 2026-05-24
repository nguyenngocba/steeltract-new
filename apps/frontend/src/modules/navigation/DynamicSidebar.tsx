import {
  ChevronDown,
  Star,
} from 'lucide-react'
import {
  useState,
} from 'react'
import {
  Link,
  useLocation,
} from 'react-router-dom'
import clsx from 'clsx'

import type {
  NavigationItem,
  ResolvedNavigationGroup,
} from './navigation.types'

interface DynamicSidebarProps {
  groups: ResolvedNavigationGroup[]
  favoriteIds: string[]
  onToggleFavorite: (itemId: string) => void
  onNavigate: (item: NavigationItem) => void
}

export function DynamicSidebar({
  groups,
  favoriteIds,
  onToggleFavorite,
  onNavigate,
}: DynamicSidebarProps) {
  const location = useLocation()
  const [collapsedGroups, setCollapsedGroups] =
    useState<Set<string>>(() => new Set())

  return (
    <nav className="space-y-4">
      {groups.map((group) => {
        const collapsed =
          collapsedGroups.has(group.id)

        return (
          <section key={group.id}>
            <button
              type="button"
              onClick={() => {
                setCollapsedGroups((current) => {
                  const next = new Set(current)

                  if (next.has(group.id)) {
                    next.delete(group.id)
                  } else {
                    next.add(group.id)
                  }

                  return next
                })
              }}
              className="flex w-full items-center justify-between px-2 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-500"
            >
              {group.label}
              <ChevronDown
                className={clsx(
                  'h-3.5 w-3.5 transition-transform',
                  collapsed && '-rotate-90',
                )}
              />
            </button>

            {!collapsed ? (
              <div className="mt-1 space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active =
                    item.path === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(
                          item.path,
                        )

                  return (
                    <div
                      key={item.id}
                      className="group relative"
                    >
                      <Link
                        to={item.path}
                        onClick={() =>
                          onNavigate(item)
                        }
                        className={clsx(
                          'flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 pr-9 text-sm transition-colors',
                          active
                            ? 'bg-cyan-500 text-white'
                            : 'text-zinc-300 hover:bg-zinc-900 hover:text-white',
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">
                          {item.label}
                        </span>
                        {item.badge}
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          onToggleFavorite(item.id)
                        }
                        className={clsx(
                          'absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 opacity-0 transition hover:text-amber-300 group-hover:opacity-100',
                          favoriteIds.includes(item.id) &&
                            'text-amber-300 opacity-100',
                        )}
                        aria-label={`Favorite ${item.label}`}
                      >
                        <Star
                          className="h-3.5 w-3.5"
                          fill={
                            favoriteIds.includes(
                              item.id,
                            )
                              ? 'currentColor'
                              : 'none'
                          }
                        />
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : null}
          </section>
        )
      })}
    </nav>
  )
}
