import { ChevronRight, Star } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import clsx from 'clsx'

import type {
  NavigationItem,
  ResolvedNavigationGroup,
} from './navigation.types'

const groupLabels: Record<string, string> = {
  'COMMAND CENTER': 'TỔNG QUAN',
  MODULES: 'MODULES',
  INTELLIGENCE: 'ĐIỀU HÀNH',
  SYSTEM: 'HỆ THỐNG',
}

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

  return (
    <nav className="space-y-5">
      {groups.map((group) => (
        <section key={group.id}>
          <div className="mb-2 px-2 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
            {groupLabels[group.label] ?? group.label}
          </div>
          <div className="space-y-1">
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
                    onClick={() => onNavigate(item)}
                    className={clsx(
                      'flex min-h-10 items-center gap-3 rounded-md border px-3 py-2 pr-8 text-sm transition-colors',
                      active
                        ? 'border-blue-400/45 bg-gradient-to-r from-blue-700/80 via-blue-600/45 to-blue-500/10 text-white shadow-[0_0_22px_rgba(37,99,235,0.22)]'
                        : 'border-transparent text-slate-300 hover:border-blue-500/20 hover:bg-blue-500/10 hover:text-white',
                    )}
                  >
                    <span
                      className={clsx(
                        'flex h-5 w-5 shrink-0 items-center justify-center',
                        active
                          ? 'text-blue-100'
                          : 'text-slate-400',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {item.label}
                    </span>
                    {item.badge ? (
                      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                    )}
                  </Link>

                  <button
                    type="button"
                    onClick={() =>
                      onToggleFavorite(item.id)
                    }
                    className={clsx(
                      'absolute right-7 top-1/2 hidden -translate-y-1/2 rounded p-1 text-slate-500 transition hover:text-amber-300 group-hover:block',
                      favoriteIds.includes(item.id) &&
                        'block text-amber-300',
                    )}
                    aria-label={`Favorite ${item.label}`}
                  >
                    <Star
                      className="h-3 w-3"
                      fill={
                        favoriteIds.includes(item.id)
                          ? 'currentColor'
                          : 'none'
                      }
                    />
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </nav>
  )
}
