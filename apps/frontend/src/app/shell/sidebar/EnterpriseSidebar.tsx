import {
  NavLink,
} from 'react-router-dom'

import {
  ChevronDown,
  Package,
  Building2,
  Boxes,
  Map,
  Settings,
  Database,
  LayoutDashboard,
} from 'lucide-react'

import {
  useState,
} from 'react'

import {
  navigation,
} from '../../config/navigation.config'

const icons: Record<string, any> = {

  CORE: LayoutDashboard,
  INVENTORY: Package,
  PROJECTS: Building2,
  SUPPLIERS: Database,
  COMPONENTS: Boxes,
  YARD: Map,
  'MASTER DATA': Database,
  SYSTEM: Settings,
}

export function EnterpriseSidebar() {

  const [opened, setOpened] = useState<
    Record<string, boolean>
  >({

    INVENTORY: true,
    PROJECTS: true,
    COMPONENTS: true,
    YARD: true,
  })

  return (

    <div className="flex h-screen w-[320px] flex-col border-r border-zinc-800 bg-zinc-950">

      <div className="border-b border-zinc-800 p-6">

        <div className="text-3xl font-black tracking-wide text-cyan-400">
          STEELTRACK
        </div>

        <div className="mt-2 text-xs uppercase tracking-[0.3em] text-zinc-500">
          Manufacturing OS
        </div>

      </div>

      <div className="flex-1 overflow-auto p-4">

        <div className="space-y-5">

          {navigation.map((group) => {

            const Icon =
              icons[group.group]

            const isOpen =
              opened[group.group]

            return (

              <div
                key={group.group}
              >

                <button

                  onClick={() =>
                    setOpened((prev) => ({
                      ...prev,
                      [group.group]:
                        !prev[group.group],
                    }))
                  }

                  className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-bold text-zinc-300 transition hover:bg-zinc-900"
                >

                  <div className="flex items-center gap-3">

                    <Icon
                      size={18}
                    />

                    <span>
                      {group.group}
                    </span>

                  </div>

                  <ChevronDown
                    size={16}
                    className={`transition ${
                      isOpen
                        ? 'rotate-180'
                        : ''
                    }`}
                  />

                </button>

                {isOpen && (

                  <div className="mt-2 space-y-1 border-l border-zinc-800 pl-4">

                    {group.items.map(
                      (item) => (

                        <NavLink

                          key={item.key}

                          to={item.path}

                          className={({ isActive }) => `block rounded-xl px-4 py-3 text-sm transition ${
                            isActive

                              ? 'bg-cyan-500/10 text-cyan-300'

                              : 'text-zinc-500 hover:bg-zinc-900 hover:text-white'
                          }`}
                        >

                          <div className="font-semibold">
                            {item.vi}
                          </div>

                          <div className="mt-1 text-[10px] uppercase tracking-[0.25em] opacity-60">
                            {item.label}
                          </div>

                        </NavLink>

                      ),
                    )}

                  </div>

                )}

              </div>

            )
          })}

        </div>

      </div>

    </div>
  )
}
