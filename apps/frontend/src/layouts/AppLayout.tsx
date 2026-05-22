import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import {
  LayoutDashboard,
  Boxes,
  FolderKanban,
  Truck,
  FileBarChart,
  ArrowLeftRight,
  Map,
  CalendarDays,
  QrCode,
  ClipboardList,
  Users,
  BarChart3,
  ShoppingCart,
  ScanText,
  FileSearch,
  ShieldAlert,
  HardHat,
  Warehouse,
  NotebookPen,
  ShieldCheck,
  BadgeCheck,
  Brain,
} from 'lucide-react'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({
  children,
}: AppLayoutProps) {
  const user =
    useAuthStore(
      (state) => state.user,
    )
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Sidebar */}
            <aside
        className="
          hidden
          md:block
          w-64
          border-r
          border-zinc-800
          bg-zinc-900
        "
>
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
            icon={
              <QrCode size={18} />
            }
            label="QR Scan"
            to="/qr-scan"
          />

          <SidebarItem
            icon={
              <Brain size={18} />
            }
            label="AI Analytics"
            to="/analytics"
          />
          <SidebarItem
            icon={
              <Users size={18} />
            }
            label="Attendance"
            to="/attendance"
          />
          <SidebarItem
            icon={
              <Users size={18} />
            }
            label="Workers"
            to="/workers"
          />
          <SidebarItem
            icon={
              <ClipboardList
                size={18}
              />
            }
            label="Tasks"
            to="/tasks"
          />
          <SidebarItem
            icon={
              <BadgeCheck
                size={18}
              />
            }
            label="Approvals"
            to="/approvals"
          />
          <SidebarItem
            icon={
              <ClipboardList
                size={18}
              />
            }
            label="Material Requests"
            to="/material-requests"
          />
          <SidebarItem
            icon={
              <Truck size={18} />
            }
            label="Vehicles"
            to="/vehicles"
          />
          <SidebarItem
            icon={
              <Warehouse
                size={18}
              />
            }
            label="Zones"
            to="/zones"
          />

          <SidebarItem
            icon={
              <FileSearch
                size={18}
              />
            }
            label="BOQ AI"
            to="/boq"
          />
          <SidebarItem
            icon={
              <NotebookPen
                size={18}
              />
            }
            label="Site Logs"
            to="/site-logs"
          />

          <SidebarItem
            icon={
              <BarChart3
                size={18}
              />
            }
            label="Executive"
            to="/executive"
          />
          <SidebarItem
            icon={
              <CalendarDays
                size={18}
              />
            }
            label="Schedule"
            to="/schedule"
          />
          <SidebarItem
            icon={
              <ShoppingCart
                size={18}
              />
            }
            label="Procurement"
            to="/procurement"
          />

          <SidebarItem
            icon={
              <ShoppingCart
                size={18}
              />
            }
            label="Purchase Orders"
            to="/purchase-orders"
          />
          <SidebarItem
            icon={
              <HardHat
                size={18}
              />
            }
            label="Equipment"
            to="/equipment"
          />
          <SidebarItem
            icon={
              <ScanText
                size={18}
              />
            }
            label="OCR"
            to="/ocr"
          />
          <SidebarItem
            icon={
              <ShieldCheck
                size={18}
              />
            }
            label="Safety"
            to="/safety"
          />
          
          <SidebarItem
            icon={
              <ShieldAlert
                size={18}
              />
            }
            label="AI Alerts"
            to="/anomalies"
          />

          <SidebarItem
            icon={<Boxes size={18} />}
            label="Inventory"
            to="/inventory"
          />
          <SidebarItem
            icon={<Boxes size={18} />}
            label="Components"
            to="/components"
          />
          <SidebarItem
            icon={<Map size={18} />}
            label="Yard Map"
            to="/yard-map"
          />
          <SidebarItem
            icon={
              <ArrowLeftRight size={18} />
            }
            label="Transactions"
            to="/transactions"
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
          <header
            className="
              h-16
              border-b
              border-zinc-800
              flex
              items-center
              justify-between
              px-4 md:px-6
            "
          >          
          <h2 className="font-semibold text-lg">
            ERP Dashboard
          </h2>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium">
                {user?.username}
              </p>

              <p className="text-xs text-zinc-400">
                Administrator
              </p>
            </div>

            <div className="w-10 h-10 rounded-full bg-cyan-500" />
          </div>
        </header>

        {/* Main */}
        <main className="p-4 md:p-6">
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