import {
  Activity,
  Bell,
  ChevronDown,
  LogOut,
  Search,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '../../../modules/auth/store/auth.store'

export function AppTopbar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [openUserMenu, setOpenUserMenu] = useState(false)
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    setOpenUserMenu(false)
    navigate('/login')
  }

  return (
    <div className="flex h-[64px] items-center justify-between border-b border-zinc-800 bg-zinc-900 px-5">
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-950 px-4">
        <Search size={18} className="text-zinc-500" />
        <input
          placeholder="Tìm kiếm nhanh..."
          className="h-10 w-[300px] bg-transparent text-sm text-white outline-none"
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-xs font-medium text-emerald-400">
            LIVE
          </span>
        </div>

        <div className="rounded-xl bg-zinc-800 p-2.5">
          <Activity size={18} className="text-cyan-400" />
        </div>

        <div className="relative rounded-xl bg-zinc-800 p-2.5">
          <Bell size={18} className="text-orange-400" />
          <div className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenUserMenu((prev) => !prev)}
            className="flex items-center gap-3 rounded-2xl bg-zinc-800 px-3 py-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
              A
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">
                {user?.fullName || 'Admin'}
              </p>
              <p className="text-xs text-zinc-500">
                {user?.role?.name || 'ADMIN'}
              </p>
            </div>
            <ChevronDown size={14} className="text-zinc-500" />
          </button>

          {openUserMenu && (
            <div className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-zinc-700 bg-zinc-900 p-3 shadow-2xl">
              <div className="border-b border-zinc-800 pb-2">
                <div className="text-sm font-semibold text-white">
                  {user?.fullName || 'Admin'}
                </div>
                <div className="text-xs text-zinc-500">
                  {user?.email || 'admin@steeltrack.local'}
                </div>
              </div>
              <div className="py-2 text-xs text-zinc-400">
                Quyền: {user?.role?.name || 'ADMIN'}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg border border-red-700/40 px-3 py-2 text-sm text-red-300 hover:bg-red-900/20"
              >
                <LogOut size={14} />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

