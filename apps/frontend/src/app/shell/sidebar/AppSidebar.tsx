import { useLayoutEffect, useRef } from 'react'

import { navigation }
  from './navigation.config'

import { SidebarGroup }
  from './SidebarGroup'

export function AppSidebar() {
  const scrollRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const element = scrollRef.current
    if (!element) return

    const saved = Number(window.sessionStorage.getItem('steeltrack-app-sidebar-scroll') ?? 0)
    if (Number.isFinite(saved)) element.scrollTop = saved
  }, [])

  return (
    <aside
      className="
        flex
        h-screen
        w-[280px]
        flex-col
        border-r
        border-zinc-800
        bg-black
      "
    >
      <div
        ref={scrollRef}
        onScroll={(event) => {
          window.sessionStorage.setItem('steeltrack-app-sidebar-scroll', String(event.currentTarget.scrollTop))
        }}
        className="
          border-b
          border-zinc-800
          px-5
          py-4
        "
      >
        <div className="text-[11px] uppercase tracking-[0.32em] text-cyan-400">
          SteelTrack
        </div>

        <div className="mt-2 text-2xl font-black text-white">
          ERP Platform
        </div>

        <div className="mt-1 text-xs text-zinc-500">
          Smart Factory Operations
        </div>
      </div>

      <div
        className="
          flex-1
          space-y-8
          overflow-y-auto
          p-3
        "
      >
        {navigation.map((group) => (
          <SidebarGroup
            key={group.title}
            title={group.title}
            icon={group.icon}
            items={group.children}
          />
        ))}
      </div>

      <div
        className="
          border-t
          border-zinc-800
          p-3
        "
      >
        <div
          className="
            rounded-2xl
            border
            border-cyan-500/20
            bg-cyan-500/5
            p-4
          "
        >
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-400">
            Runtime Status
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div
              className="
                h-3
                w-3
                rounded-full
                bg-emerald-500
              "
            />

            <div className="text-sm text-white">
              Operational
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
