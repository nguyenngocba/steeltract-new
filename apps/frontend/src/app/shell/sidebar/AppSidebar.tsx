import { navigation }
  from './navigation.config'

import { SidebarGroup }
  from './SidebarGroup'

export function AppSidebar() {
  return (
    <aside
      className="
        flex
        h-screen
        w-[320px]
        flex-col
        border-r
        border-zinc-800
        bg-black
      "
    >
      <div
        className="
          border-b
          border-zinc-800
          px-6
          py-6
        "
      >
        <div className="text-xs uppercase tracking-[0.4em] text-cyan-400">
          SteelTrack
        </div>

        <div className="mt-3 text-3xl font-black text-white">
          Industrial Runtime
        </div>

        <div className="mt-2 text-sm text-zinc-500">
          MES / WMS Operational Cockpit
        </div>
      </div>

      <div
        className="
          flex-1
          space-y-8
          overflow-y-auto
          p-4
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
          p-4
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