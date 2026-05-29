import {
  NavLink,
} from 'react-router-dom'

import { navigation }
from '../../../app/config/navigation.config'

export function EnterpriseSidebar() {

  return (
    <div className="flex h-screen w-[320px] flex-col border-r border-zinc-800 bg-zinc-950">

      {/* LOGO */}
      <div className="border-b border-zinc-800 p-6">

        <h1 className="text-2xl font-black tracking-wide text-cyan-400">
          STEELTRACK
        </h1>

        <div className="mt-2 text-xs uppercase tracking-[0.3em] text-zinc-500">
          Enterprise Runtime
        </div>

      </div>

      {/* NAV */}
      <div className="flex-1 overflow-auto px-4 py-5">

        <div className="space-y-8">

          {navigation.map(
            (group) => (

              <div
                key={group.group}
              >

                <div className="mb-3 px-3 text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">

                  {group.group}

                </div>

                <div className="space-y-1">

                  {group.items.map(
                    (item) => (

                      <NavLink

                        key={item.key}

                        to={item.path}

                        className={({ isActive }) => `block rounded-2xl border px-4 py-3 transition ${
                          isActive

                            ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'

                            : 'border-transparent text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900 hover:text-white'
                        }`}
                      >

                        <div className="text-sm font-semibold">
                          {item.vi}
                        </div>

                        <div className="mt-1 text-xs text-zinc-500">
                          {item.label}
                        </div>

                      </NavLink>

                    ),
                  )}

                </div>

              </div>

            ),
          )}

        </div>

      </div>

    </div>
  )
}
