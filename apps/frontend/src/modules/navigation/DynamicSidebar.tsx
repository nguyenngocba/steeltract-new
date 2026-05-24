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
    <nav className="space-y-3">
      {groups.map((group) => {
        const collapsed =
          collapsedGroups.has(group.id)

        return (
          <section
            key={group.id}
            className="rounded-xl border border-zinc-800/80 bg-zinc-950/55 p-2"
          >
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
              className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 hover:bg-zinc-900/70 hover:text-zinc-300"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.75)]" />
                <span className="truncate">{group.label}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                  {group.items.length}
                </span>
                <ChevronDown
                  className={clsx(
                    'h-3.5 w-3.5 transition-transform',
                    collapsed && '-rotate-90',
                  )}
                />
              </span>
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
                          'flex min-h-10 items-center gap-3 rounded-lg border px-3 py-2 pr-9 text-sm transition-colors',
                          active
                            ? 'border-cyan-500/50 bg-cyan-500/15 text-white shadow-[0_0_24px_rgba(34,211,238,0.12)]'
                            : 'border-transparent text-zinc-300 hover:border-zinc-800 hover:bg-zinc-900 hover:text-white',
                        )}
                      >
                        <span
                          className={clsx(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border',
                            active
                              ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-200'
                              : 'border-zinc-800 bg-zinc-950 text-zinc-400',
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {item.label}
                        </span>
                        {item.badge ?? (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
                        )}
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
