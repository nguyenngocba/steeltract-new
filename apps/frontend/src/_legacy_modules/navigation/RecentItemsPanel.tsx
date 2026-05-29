import {
  Clock,
} from 'lucide-react'
import {
  Link,
} from 'react-router-dom'

import type {
  NavigationItem,
} from './navigation.types'

interface RecentItemsPanelProps {
  items: NavigationItem[]
  onNavigate: (item: NavigationItem) => void
}

export function RecentItemsPanel({
  items,
  onNavigate,
}: RecentItemsPanelProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        <Clock className="h-3.5 w-3.5 text-cyan-300" />
        Recent
      </div>
      <div className="space-y-1">
        {items.slice(0, 5).map((item) => (
          <Link
            key={item.id}
            to={item.path}
            onClick={() => onNavigate(item)}
            className="block truncate rounded-md px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  )
}
