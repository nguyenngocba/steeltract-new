import {
  NavLink,
  Outlet,
} from 'react-router-dom'

const tabs = [

  {
    path:
      '/qc/incoming',

    vi:
      'QC Đầu Vào',

    en:
      'Incoming QC',
  },

  {
    path:
      '/qc/welding',

    vi:
      'QC Hàn',

    en:
      'Welding QC',
  },

  {
    path:
      '/qc/painting',

    vi:
      'QC Sơn',

    en:
      'Painting QC',
  },

  {
    path:
      '/qc/ncr',

    vi:
      'NCR',

    en:
      'Non-Conformance',
  },

  {
    path:
      '/qc/defects',

    vi:
      'Lỗi',

    en:
      'Defects',
  },

  {
    path:
      '/qc/approvals',

    vi:
      'Phê Duyệt',

    en:
      'Approvals',
  },
]

export function QcLayout() {

  return (
    <div className="flex h-full flex-col overflow-hidden bg-zinc-950">

      {/* HEADER */}
      <div className="border-b border-zinc-800 px-8 py-6">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-3xl font-black tracking-wide text-emerald-400">
              QC RUNTIME
            </h1>

            <div className="mt-2 text-sm text-zinc-500">
              Runtime chất lượng / Quality Control Runtime
            </div>

          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 text-sm text-emerald-300">

            LIVE QC SYSTEM

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
                '/qc/incoming'
              }

              className={({ isActive }) => `rounded-2xl border px-5 py-3 transition ${
                isActive

                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'

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
