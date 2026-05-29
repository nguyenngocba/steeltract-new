import clsx from 'clsx'

import {
  StatusBadge,
} from '../../components/ui-system'
import type {
  OperatorAction,
} from './operator-action.types'

interface OperatorActionMenuProps {
  actions: OperatorAction[]
  compact?: boolean
}

export function OperatorActionMenu({
  actions,
  compact = false,
}: OperatorActionMenuProps) {
  return (
    <div
      className={clsx(
        'grid gap-2',
        compact && 'text-xs',
      )}
    >
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          disabled={action.disabled}
          onClick={() => action.run?.()}
          className={clsx(
            'flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors',
            action.disabled
              ? 'cursor-not-allowed border-zinc-900 bg-zinc-950/50 text-zinc-600'
              : 'border-zinc-800 bg-zinc-950/70 text-zinc-300 hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-white',
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            {action.icon}
            <span className="min-w-0">
              <span className="block truncate font-medium">
                {action.label}
              </span>
              {!compact ? (
                <span className="block truncate text-xs text-zinc-500">
                  {action.disabled
                    ? 'select context or permission required'
                    : action.description}
                </span>
              ) : null}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            {action.shortcut ? (
              <kbd className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400">
                {action.shortcut}
              </kbd>
            ) : null}
            <StatusBadge tone="neutral">
              {action.domain}
            </StatusBadge>
          </span>
        </button>
      ))}
    </div>
  )
}
