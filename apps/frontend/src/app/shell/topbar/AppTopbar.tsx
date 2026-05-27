import {
  Bell,
  Search,
  Activity,
} from 'lucide-react'

import { useAuthStore } from '../../../modules/auth/store/auth.store'

export function AppTopbar() {
  const user =
    useAuthStore((s) => s.user)

  return (
    <div className="flex h-[72px] items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6">

      {/* SEARCH */}
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-950 px-4">

        <Search
          size={18}
          className="text-zinc-500"
        />

        <input
          placeholder="Search..."
          className="h-11 w-[320px] bg-transparent text-sm text-white outline-none"
        />

      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">

        {/* LIVE */}
        <div className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2">

          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />

          <span className="text-xs font-medium text-emerald-400">
            LIVE
          </span>

        </div>

        {/* TELEMETRY */}
        <div className="rounded-xl bg-zinc-800 p-3">

          <Activity
            size={18}
            className="text-cyan-400"
          />

        </div>

        {/* ALERTS */}
        <div className="relative rounded-xl bg-zinc-800 p-3">

          <Bell
            size={18}
            className="text-orange-400"
          />

          <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />

        </div>

        {/* USER */}
        <div className="flex items-center gap-3 rounded-2xl bg-zinc-800 px-4 py-2">

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
            A
          </div>

          <div>

            <p className="text-sm font-medium text-white">
              {user?.fullName || 'Admin'}
            </p>

            <p className="text-xs text-zinc-500">
              {user?.role?.name || 'ADMIN'}
            </p>

          </div>

        </div>

      </div>

    </div>
  )
}
