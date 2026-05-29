import { LucideIcon } from 'lucide-react'

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
  return (
    <div>
      <div
        className="
          mb-3
          flex
          items-center
          gap-2
          px-2
          text-xs
          uppercase
          tracking-[0.25em]
          text-zinc-600
        "
      >
        {Icon && (
          <Icon
            size={14}
            className="text-cyan-500"
          />
        )}

        <span>
          {title}
        </span>
      </div>

      <div className="space-y-1">
        {items.map((item) => (
          <SidebarItem
            key={item.path}
            label={item.title}
            path={item.path}
          />
        ))}
      </div>
    </div>
  )
}