import {
  Boxes,
  Package,
  Map,
  Settings,
} from 'lucide-react'

import { NavLink }
from 'react-router-dom'

const items = [
  {
    label: 'Inventory',
    path: '/inventory',
    icon: Package,
  },

  {
    label: 'Components',
    path: '/components',
    icon: Boxes,
  },

  {
    label: 'Yard',
    path: '/yard',
    icon: Map,
  },

  {
    label: 'Settings',
    path: '/settings',
    icon: Settings,
  },
]

export function AppSidebar() {

  return (
    <div className="flex h-full w-[280px] flex-col border-r border-zinc-800 bg-zinc-950">

      {/* LOGO */}
      <div className="border-b border-zinc-800 px-6 py-5">

        <h1 className="text-2xl font-bold text-white">
          SteelTrack
        </h1>

        <p className="mt-1 text-xs text-zinc-500">
          Smart Factory Runtime
        </p>

      </div>

      {/* MENU */}
      <div className="flex-1 overflow-auto p-4">

        <div className="space-y-2">

          {items.map((item) => {

            const Icon = item.icon

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                    isActive
                      ? 'bg-cyan-600 text-white'
                      : 'bg-zinc-900 text-zinc-400'
                  }`
                }
              >

                <Icon size={20} />

                <span className="text-sm font-medium">
                  {item.label}
                </span>

              </NavLink>
            )
          })}

        </div>

      </div>

    </div>
  )
}
