import {
  NavLink,
  Outlet,
} from 'react-router-dom'

const tabs = [

  {
    path:
      '/components',

    vi:
      'Tổng Quan',

    en:
      'Overview',
  },

  {
    path:
      '/components/fabrication',

    vi:
      'Gia Công',

    en:
      'Fabrication',
  },

  {
    path:
      '/components/welding',

    vi:
      'Hàn',

    en:
      'Welding',
  },

  {
    path:
      '/components/painting',

    vi:
      'Sơn',

    en:
      'Painting',
  },

  {
    path:
      '/components/assembly',

    vi:
      'Lắp Ráp',

    en:
      'Assembly',
  },

  {
    path:
      '/components/shipping',

    vi:
      'Xuất Hàng',

    en:
      'Shipping',
  },

  {
    path:
      '/components/qc',

    vi:
      'QC',

    en:
      'Quality Control',
  },
]

export function ComponentsLayout() {

  return (
    <div className="flex h-full flex-col overflow-hidden bg-zinc-950">

      {/* HEADER */}
      <div className="border-b border-zinc-800 px-8 py-6">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-3xl font-black tracking-wide text-cyan-400">
              COMPONENT RUNTIME
            </h1>

            <div className="mt-2 text-sm text-zinc-500">
              Quản lý cấu kiện / Fabrication Runtime
            </div>

          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-3 text-sm text-cyan-300">

            LIVE FACTORY RUNTIME

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
                '/components'
              }

              className={({ isActive }) => `rounded-2xl border px-5 py-3 transition ${
                isActive

                  ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'

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
