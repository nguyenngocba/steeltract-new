import {
  NavLink,
  Outlet,
} from 'react-router-dom'

const tabs = [

  {
    path:
      '/production/orders',

    vi:
      'Lệnh SX',

    en:
      'Production Orders',
  },

  {
    path:
      '/production/work-orders',

    vi:
      'Work Orders',

    en:
      'Work Orders',
  },

  {
    path:
      '/production/machines',

    vi:
      'Máy Móc',

    en:
      'Machines',
  },

  {
    path:
      '/production/operators',

    vi:
      'Công Nhân',

    en:
      'Operators',
  },

  {
    path:
      '/production/schedules',

    vi:
      'Kế Hoạch',

    en:
      'Schedules',
  },

  {
    path:
      '/production/telemetry',

    vi:
      'Realtime',

    en:
      'Telemetry',
  },
]

export function ProductionLayout() {

  return (
    <div className="flex h-full flex-col overflow-hidden bg-zinc-950">

      {/* HEADER */}
      <div className="border-b border-zinc-800 px-8 py-6">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-3xl font-black tracking-wide text-orange-400">
              PRODUCTION RUNTIME
            </h1>

            <div className="mt-2 text-sm text-zinc-500">
              Runtime sản xuất / Factory Production Runtime
            </div>

          </div>

          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-5 py-3 text-sm text-orange-300">

            LIVE FACTORY SYSTEM

          </div>

        </div>

      </div>

      {/* TABS */}
      <div className="flex gap-3 overflow-auto border-b border-zinc-800 px-6 py-4">

        {tabs.map(
          (tab) => (

            <NavLink

              key={tab.path}

              to={tab.path}

              end={
                tab.path ===
                '/production/orders'
              }

              className={({ isActive }) => `rounded-2xl border px-5 py-3 transition ${
                isActive

                  ? 'border-orange-500/30 bg-orange-500/10 text-orange-300'

                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white'
              }`}
            >

              <div className="text-sm font-semibold">
                {tab.vi}
              </div>

              <div className="mt-1 text-xs text-zinc-500">
                {tab.en}
              </div>

            </NavLink>

          ),
        )}

      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-auto p-6">

        <Outlet />

      </div>

    </div>
  )
}
