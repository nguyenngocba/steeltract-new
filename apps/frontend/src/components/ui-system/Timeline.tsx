import {
  Circle,
} from 'lucide-react'

import type {
  TimelineItem,
  Tone,
} from './types'

interface TimelineProps {
  items: TimelineItem[]
}

const toneClassName: Record<Tone, string> = {
  neutral: 'text-zinc-500',
  info: 'text-cyan-400',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  danger: 'text-red-400',
}

export function Timeline({ items }: TimelineProps) {
  return (
    <ol className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="flex gap-3">
          <Circle
            className={`mt-1 h-3 w-3 ${
              toneClassName[item.tone ?? 'neutral']
            }`}
            fill="currentColor"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-white">
                {item.title}
              </p>

              {item.time ? (
                <span className="text-xs text-zinc-500">
                  {item.time}
                </span>
              ) : null}
            </div>

            {item.description ? (
              <div className="mt-1 text-sm text-zinc-400">
                {item.description}
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
