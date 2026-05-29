import {
  LayoutDashboard,
  Boxes,
  Map,
  Factory,
  Settings,
  Users,
  Shield,
  BarChart3,
  BellRing,
  Bot,
  Cpu,
  ClipboardList,
  Wrench,
} from 'lucide-react'

import { NavLink } from 'react-router-dom'

const items = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  {
    label: 'Kho vật tư',
    icon: Boxes,
    path: '/inventory',
  },
  {
    label: 'Bãi tập kết',
    icon: Map,
    path: '/yard',
  },
  {
    label: 'Cấu kiện',
    icon: Factory,
    path: '/components',
  },
  {
    label: 'Người dùng',
    icon: Users,
    path: '/users',
  },
  {
    label: 'Phân quyền',
    icon: Shield,
  BarChart3,
  BellRing,
  Bot,
  Cpu,
  ClipboardList,
  Wrench,
    path: '/roles',
  },
  {
    label: 'Analytics',
    icon: BarChart3,
  BellRing,
  Bot,
  Cpu,
  ClipboardList,
  Wrench,
    path: '/analytics',
  },
  {
    label: 'Hệ thống',
    icon: Settings,
    path: '/settings',
  },
]

  return (
    <div className="flex w-[280px] flex-col border-r border-zinc-800 bg-zinc-900">

      {/* LOGO */}
      <div className="border-b border-zinc-800 px-6 py-6">

        <h1 className="text-3xl font-bold text-white">
          SteelTrack
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Smart Factory Platform
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
                  `flex items-center gap-4 rounded-2xl px-4 py-3 transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`
                }
              >

                <Icon size={20} />

                <span className="font-medium">
                  {item.label}
                </span>

              </NavLink>
            )
          })}

        </div>

      </div>

      {/* FOOTER */}
      <div className="border-t border-zinc-800 p-4">

        <div className="rounded-2xl bg-zinc-800 p-4">

          <p className="text-sm font-medium text-white">
            Enterprise Runtime
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            Operational Cockpit Active
          </p>

        </div>

      </div>

    </div>
  )
}
