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
        border-white/10
        bg-[linear-gradient(180deg,#07111f_0%,#0c1423_52%,#08101d_100%)]
        shadow-[18px_0_50px_rgba(0,0,0,0.22)]
      "
    >
      <div
        className="
          border-b
          border-white/10
          px-5
          py-4
        "
      >
        <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-300">
          SteelTrack
        </div>

        <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
          ERP Platform
        </div>

        <div className="mt-1 text-xs text-slate-500">
          Smart Factory Operations
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={(event) => {
          window.sessionStorage.setItem('steeltrack-app-sidebar-scroll', String(event.currentTarget.scrollTop))
        }}
        className="
          flex-1
          space-y-5
          overflow-y-auto
          p-3
          [scrollbar-color:rgba(148,163,184,0.35)_transparent]
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
          border-white/10
          p-3
        "
      >
        <div
          className="
            rounded-xl
            border
            border-white/10
            bg-white/[0.055]
            p-4
            shadow-[0_14px_34px_rgba(0,0,0,0.18)]
            backdrop-blur-xl
          "
        >
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
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

            <div className="text-sm font-medium text-white">
              Operational
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
