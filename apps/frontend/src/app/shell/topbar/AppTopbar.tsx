import {
  Activity,
  Bell,
  ChevronDown,
  LogOut,
  Search,
} from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuthStore } from '../../../store/auth.store'
import { InventoryGlobalActionBar } from '../../../modules/inventory/components/InventoryGlobalActionBar'

export function AppTopbar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [openUserMenu, setOpenUserMenu] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const moduleTitle = getModuleTitle(location.pathname)
  const workspaceTitle = getWorkspaceTitle(location.pathname)
  const isInventoryRoute = location.pathname.startsWith('/inventory')

  function handleLogout() {
    logout()
    setOpenUserMenu(false)
    navigate('/login')
  }

  return (
    <div className="flex h-[50px] items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase leading-none tracking-[0.16em] text-cyan-300">{moduleTitle}</p>
        <h1 className="mt-0.5 truncate text-[22px] font-semibold leading-none tracking-tight text-white">{workspaceTitle}</h1>
      </div>

      <div className="flex items-center gap-2">
        {isInventoryRoute ? <InventoryGlobalActionBar /> : null}

        <div className="hidden items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-2.5 lg:flex">
          <Search size={15} className="text-zinc-500" />
          <input
            placeholder="Tìm kiếm nhanh..."
            className="h-8 w-[240px] bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
          />
        </div>

        <div className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1.5">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-xs font-medium text-emerald-400">
            LIVE
          </span>
        </div>

        <div className="rounded-xl bg-zinc-800 p-2">
          <Activity size={16} className="text-cyan-400" />
        </div>

        <div className="relative rounded-xl bg-zinc-800 p-2">
          <Bell size={16} className="text-orange-400" />
          <div className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenUserMenu((prev) => !prev)}
            className="flex items-center gap-2 rounded-2xl bg-zinc-800 px-2.5 py-1.5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              A
            </div>
            <div className="hidden text-left xl:block">
              <p className="text-xs font-medium text-white">
                {user?.fullName || 'Admin'}
              </p>
              <p className="text-[10px] text-zinc-500">
                {user?.roles?.[0] || 'ADMIN'}
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
                Quyền: {user?.roles?.[0] || 'ADMIN'}
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

export function getModuleTitle(pathname: string) {
  if (pathname === '/' || pathname.startsWith('/dashboard')) return 'TỔNG QUAN'
  if (pathname.startsWith('/inventory')) return 'VẬT TƯ KHO'
  if (pathname.startsWith('/components')) return 'CẤU KIỆN'
  if (pathname.startsWith('/production')) return 'SẢN XUẤT'
  if (pathname.startsWith('/yard')) return 'BÃI TẬP KẾT'
  if (pathname.startsWith('/projects')) return 'CÔNG TRÌNH'
  if (pathname.startsWith('/suppliers')) return 'NHÀ CUNG CẤP'
  if (pathname.startsWith('/qc')) return 'CHẤT LƯỢNG QC'
  if (pathname.startsWith('/logistics')) return 'VẬN CHUYỂN'
  if (pathname.startsWith('/procurement')) return 'MUA HÀNG'
  if (pathname.startsWith('/documents')) return 'CHỨNG TỪ'
  if (pathname.startsWith('/analytics')) return 'PHÂN TÍCH'
  if (pathname.startsWith('/reports') || pathname.startsWith('/reporting')) return 'BÁO CÁO'
  if (pathname.startsWith('/notifications')) return 'THÔNG BÁO'
  if (pathname.startsWith('/master-data')) return 'DANH MỤC HỆ THỐNG'
  if (pathname.startsWith('/ai') || pathname.startsWith('/copilot')) return 'AI ASSISTANT'
  if (pathname.startsWith('/settings')) return 'CÀI ĐẶT HỆ THỐNG'
  if (pathname.startsWith('/users')) return 'NGƯỜI DÙNG'
  if (pathname.startsWith('/roles')) return 'VAI TRÒ & PHÂN QUYỀN'
  if (pathname.startsWith('/system-logs')) return 'NHẬT KÝ HỆ THỐNG'
  if (pathname.startsWith('/backup')) return 'SAO LƯU DỮ LIỆU'
  return 'STEELTRACK'
}

export function getWorkspaceTitle(pathname: string) {
  if (pathname === '/' || pathname.startsWith('/dashboard')) return 'Bảng KPI chính'

  if (pathname === '/inventory') return 'Tổng quan kho'
  if (pathname.startsWith('/inventory/materials/')) return 'Chi tiết vật tư'
  if (pathname === '/inventory/materials') return 'Vật tư & Tồn kho'
  if (pathname === '/inventory/transactions') return 'Giao dịch'
  if (pathname === '/inventory/returns') return 'Phiếu trả vật tư'
  if (pathname === '/inventory/locations') return 'Vị trí kho'
  if (pathname === '/inventory/inbound') return 'Nhập kho'
  if (pathname === '/inventory/outbound') return 'Xuất kho'
  if (pathname === '/inventory/transfer') return 'Điều chuyển'
  if (pathname === '/inventory/stock-take') return 'Kiểm kê'
  if (pathname === '/inventory/adjustments') return 'Điều chỉnh'
  if (pathname === '/inventory/alerts') return 'Cảnh báo'
  if (pathname === '/inventory/audit') return 'Audit'

  if (pathname.startsWith('/components')) return 'Workspace cấu kiện'
  if (pathname.startsWith('/production')) return 'Workspace sản xuất'
  if (pathname.startsWith('/yard')) return 'Workspace bãi tập kết'
  if (pathname.startsWith('/projects')) return 'Workspace công trình'
  if (pathname.startsWith('/suppliers')) return 'Workspace nhà cung cấp'
  if (pathname.startsWith('/qc')) return 'Workspace chất lượng'
  if (pathname.startsWith('/logistics')) return 'Workspace vận chuyển'
  if (pathname.startsWith('/settings')) return 'Cấu hình'
  if (pathname.startsWith('/users')) return 'Danh sách người dùng'
  if (pathname.startsWith('/roles')) return 'Vai trò & quyền hạn'
  if (pathname.startsWith('/system-logs')) return 'Nhật ký hệ thống'
  if (pathname.startsWith('/notifications')) return 'Thông báo'
  return 'Workspace'
}
