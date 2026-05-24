import {
  Command,
  Plus,
  Zap,
} from 'lucide-react'
import {
  Link,
} from 'react-router-dom'

import type {
  NavigationItem,
} from './navigation.types'
import {
  OperatorActionMenu,
  useOperatorActions,
} from '../operator-actions'

interface QuickActionsPanelProps {
  items: NavigationItem[]
  onOpenCommandPalette: () => void
  onNavigate: (item: NavigationItem) => void
}

export function QuickActionsPanel({
  items,
  onOpenCommandPalette,
  onNavigate,
}: QuickActionsPanelProps) {
  const operatorActions = useOperatorActions({
    domains: [
      'production',
      'qc',
      'yard',
      'inventory',
      'workflow',
      'procurement',
    ],
  })

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        <Zap className="h-3.5 w-3.5 text-cyan-300" />
        Quick actions
      </div>

      <div className="grid gap-2">
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-800 px-2 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white"
        >
          <Command className="h-3.5 w-3.5" />
          Command palette
        </button>

        {items.slice(0, 3).map((item) => (
          <Link
            key={item.id}
            to={item.path}
            onClick={() => onNavigate(item)}
            className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        ))}

        <div className="mt-1 border-t border-zinc-800 pt-2">
          <OperatorActionMenu
            compact
            actions={operatorActions.slice(0, 6)}
          />
        </div>
      </div>
    </section>
  )
}
