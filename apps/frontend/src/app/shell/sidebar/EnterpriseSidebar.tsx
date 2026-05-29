import {

  ChevronDown,

} from 'lucide-react'

import {

  NavLink,

} from 'react-router-dom'

import {

  useState,

} from 'react'

import {

  navigation,

} from '../../config/navigation.config'

export function EnterpriseSidebar() {

  const [opened, setOpened] = useState<
    Record<string, boolean>
  >({

    'TỔNG QUAN': true,
    'VẬT TƯ KHO': true,
    'CẤU KIỆN': true,
  })

  return (

    <div className="flex h-screen w-[340px] flex-col border-r border-zinc-800 bg-zinc-950">

      {/* HEADER */}

      <div className="border-b border-zinc-800 p-6">

        <div className="text-3xl font-black tracking-wide text-cyan-400">

          STEELTRACK

        </div>

        <div className="mt-2 text-xs uppercase tracking-[0.3em] text-zinc-500">

          Industrial Runtime Platform

        </div>

      </div>

      {/* NAVIGATION */}

      <div className="flex-1 overflow-auto px-4 py-5">

        <div className="space-y-4">

          {navigation.map((group) => {

            const Icon = group.icon

            const isOpen =
              opened[group.title]

            return (

              <div
                key={group.title}
              >

                <button

                  onClick={() =>

                    setOpened((prev) => ({

                      ...prev,

                      [group.title]:
                        !prev[group.title],

                    }))
                  }

                  className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition hover:bg-zinc-900"
                >

                  <div className="flex items-center gap-3">

                    <Icon
                      size={18}
                      className="text-cyan-400"
                    />

                    <span className="text-sm font-bold tracking-wide text-zinc-200">

                      {group.title}

                    </span>

                  </div>

                  <ChevronDown

                    size={16}

                    className={`text-zinc-500 transition ${
                      isOpen
                        ? 'rotate-180'
                        : ''
                    }`}
                  />

                </button>

                {isOpen && (

                  <div className="mt-2 space-y-1 border-l border-zinc-800 pl-5">

                    {group.children.map((item) => (

                      <NavLink

                        key={item.path}

                        to={item.path}

                        className={({ isActive }) => `block rounded-xl px-4 py-3 text-sm transition ${
                          isActive

                            ? 'bg-cyan-500/10 text-cyan-300'

                            : 'text-zinc-500 hover:bg-zinc-900 hover:text-white'
                        }`}
                      >

                        {item.title}

                      </NavLink>

                    ))}

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
