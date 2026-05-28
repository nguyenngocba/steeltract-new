import {
  NavLink,
  Outlet,
} from 'react-router-dom'

const tabs = [

  {
    path:
      '/admin/users',

    vi:
      'Người Dùng',

    en:
      'Users',
  },

  {
    path:
      '/admin/roles',

    vi:
      'Phân Quyền',

    en:
      'Roles & Permissions',
  },

  {
    path:
      '/admin/audit',

    vi:
      'Audit Logs',

    en:
      'Audit Logs',
  },

  {
    path:
      '/admin/settings',

    vi:
      'Cấu Hình',

    en:
      'System Settings',
  },

  {
    path:
      '/admin/monitoring',

    vi:
      'Giám Sát',

    en:
      'Monitoring',
  },
]

export function AdminLayout() {

  return (
    <div className="flex h-full flex-col overflow-hidden bg-zinc-950">

      {/* HEADER */}
      <div className="border-b border-zinc-800 px-8 py-6">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-3xl font-black tracking-wide text-red-400">
              ADMIN RUNTIME
            </h1>

            <div className="mt-2 text-sm text-zinc-500">
              Quản trị hệ thống / Enterprise Administration
            </div>

          </div>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-3 text-sm text-red-300">

            ROOT CONTROL CENTER

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

              className={({ isActive }) => `rounded-2xl border px-5 py-3 transition ${
                isActive

                  ? 'border-red-500/30 bg-red-500/10 text-red-300'

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
