import { LucideIcon } from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { SidebarItem }
  from './SidebarItem'

type Item = {
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
  const [open, setOpen] = useState(true)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="
          mb-3
          flex
          items-center
          justify-between
          gap-2
          w-full
          rounded-lg
          px-2 py-1
          text-xs
          uppercase
          tracking-[0.25em]
          text-zinc-500
          hover:bg-zinc-900
        "
      >
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon
              size={14}
              className="text-cyan-500"
            />
          )}
          <span>{title}</span>
        </div>
        <ChevronDown
          size={14}
          className={`transition ${open ? 'rotate-180 text-cyan-400' : 'text-zinc-600'}`}
        />
      </button>

      {open && (
        <div className="space-y-1">
          {items.map((item) => (
            <SidebarItem
              key={item.path}
              label={item.title}
              path={item.path}
            />
          ))}
        </div>
      )}
    </div>
  )
}
