import {
  Star,
} from 'lucide-react'
import {
  Link,
} from 'react-router-dom'

import type {
  NavigationItem,
} from './navigation.types'

interface FavoriteModulesPanelProps {
  items: NavigationItem[]
  onNavigate: (item: NavigationItem) => void
}

export function FavoriteModulesPanel({
  items,
  onNavigate,
}: FavoriteModulesPanelProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        <Star className="h-3.5 w-3.5 text-amber-300" />
        Favorites
      </div>
      <div className="space-y-1">
        {items.slice(0, 5).map((item) => {
          const Icon = item.icon

          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => onNavigate(item)}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white"
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="truncate">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
