import clsx from 'clsx'
import type {
  ReactNode,
} from 'react'

import type {
  Tone,
} from './types'

interface StatusBadgeProps {
  children: ReactNode
  tone?: Tone
}

const toneClassName: Record<Tone, string> = {
  neutral: 'bg-zinc-700 text-zinc-100',
  info: 'bg-cyan-500/15 text-cyan-300',
  success: 'bg-emerald-500/15 text-emerald-300',
  warning: 'bg-amber-500/15 text-amber-300',
  danger: 'bg-red-500/15 text-red-300',
}

export function StatusBadge({
  children,
  tone = 'neutral',
}: StatusBadgeProps) {
  const content =
    typeof children === 'string' ||
    typeof children === 'number'
      ? String(children).replaceAll('_', ' ')
      : children

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium',
        toneClassName[tone],
      )}
    >
      {content}
    </span>
  )
}
