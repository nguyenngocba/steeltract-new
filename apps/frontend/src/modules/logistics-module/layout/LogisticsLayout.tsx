import {
  NavLink,
  Outlet,
} from 'react-router-dom'

const tabs = [

  {
    path:
      '/logistics',

    vi:
      'Tổng Quan',

    en:
      'Overview',
  },

  {
    path:
      '/logistics/shipments',

    vi:
      'Xuất Hàng',

    en:
      'Shipments',
  },

  {
    path:
      '/logistics/trucks',

    vi:
      'Xe Tải',

    en:
      'Truck Runtime',
  },

  {
    path:
      '/logistics/dispatch',

    vi:
      'Điều Phối',

    en:
      'Dispatch',
  },

  {
    path:
      '/logistics/fleet',

    vi:
      'Fleet',

    en:
      'Fleet Tracking',
  },

  {
    path:
      '/logistics/planning',

    vi:
      'Kế Hoạch',

    en:
      'Planning',
  },
]

export function LogisticsLayout() {

  return (
    <div className="flex h-full flex-col overflow-hidden bg-zinc-950">

      {/* HEADER */}
      <div className="border-b border-zinc-800 px-8 py-6">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-3xl font-black tracking-wide text-violet-400">
              LOGISTICS RUNTIME
            </h1>

            <div className="mt-2 text-sm text-zinc-500">
              Runtime logistics / Shipment Runtime
            </div>

          </div>

          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 px-5 py-3 text-sm text-violet-300">

            LIVE DELIVERY SYSTEM

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
                '/logistics'
              }

              className={({ isActive }) => `rounded-2xl border px-5 py-3 transition ${
                isActive

                  ? 'border-violet-500/30 bg-violet-500/10 text-violet-300'

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
