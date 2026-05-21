import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Boxes,
  FolderKanban,
  Truck,
  FileBarChart,
} from 'lucide-react'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({
  children,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <h1 className="text-2xl font-bold text-cyan-400">
            SteelTrack
          </h1>
        </div>

        <nav className="p-4 space-y-2">
          <SidebarItem
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            to="/"
          />

          <SidebarItem
            icon={<FolderKanban size={18} />}
            label="Projects"
            to="/projects"
          />

          <SidebarItem
            icon={<Boxes size={18} />}
            label="Inventory"
            to="/inventory"
          />

          <SidebarItem
            icon={<Truck size={18} />}
            label="Suppliers"
            to="/suppliers"
          />

          <SidebarItem
            icon={<FileBarChart size={18} />}
            label="Reports"
            to="/reports"
          />
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1">
        {/* Topbar */}
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6">
          <h2 className="font-semibold text-lg">
            ERP Dashboard
          </h2>

          <div className="w-10 h-10 rounded-full bg-cyan-500" />
        </header>

        {/* Main */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

interface SidebarItemProps {
  icon: ReactNode
  label: string
  to: string
}

function SidebarItem({
  icon,
  label,
  to,
}: SidebarItemProps) {
  const location = useLocation()

  const active = location.pathname === to

  return (
    <Link
      to={to}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
        active
          ? 'bg-cyan-500 text-white'
          : 'hover:bg-zinc-800'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}