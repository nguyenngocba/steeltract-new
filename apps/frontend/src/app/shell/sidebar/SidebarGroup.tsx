import { LucideIcon } from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'

import { SidebarItem }
  from './SidebarItem'

type Item = {
  id?: string

  title: string

  path: string
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
          {items.map((item) => (
            <SidebarItem
              key={item.id ?? `${item.path}:${item.title}`}
              label={item.title}
              path={item.path}
            />
          ))}
        </div>
      )}
    </div>
  )
}
