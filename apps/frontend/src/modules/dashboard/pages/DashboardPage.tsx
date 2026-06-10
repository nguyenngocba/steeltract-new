import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, Bell, Boxes, CheckCircle2, ClipboardList, Factory, FileText, PackagePlus, Settings, Truck, Warehouse } from 'lucide-react'

import { OperationalShell } from '@/shared/layouts/OperationalShell'
import {
  CompactDonutSummary,
  CompactTrendChart,
  HorizontalBars,
  inventoryMutedButton,
  inventoryPanel,
} from '@/modules/inventory/components/InventoryVisuals'
import { getDashboardCockpit, type DashboardCockpit } from '@/services/api/dashboard.api'

const fmt = (value = 0) => new Intl.NumberFormat('vi-VN').format(value)
const colors = ['#1d7cff', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#38bdf8']

export function DashboardPage() {
  const { data } = useQuery<DashboardCockpit>({
    queryKey: ['dashboard-cockpit'],
    queryFn: getDashboardCockpit,
    refetchInterval: 10000,
  })
  const kpis = data?.kpis

  return (
    <OperationalShell>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_30%),linear-gradient(135deg,#06111e_0%,#081827_52%,#0b1220_100%)] p-4 text-slate-100">
        <header className="flex flex-wrap items-end justify-between gap-3 pb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Tổng quan</h1>
            <p className="mt-1 text-sm text-slate-400">Bảng điều hành dữ liệu thật từ vận hành SteelTrack</p>
          </div>
          <button className={inventoryMutedButton}><Settings size={15} /> Tùy chỉnh dashboard</button>
        </header>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Kpi icon={Boxes} title="Tổng dự án" value={fmt(kpis?.projects)} note={`Đang triển khai: ${fmt(kpis?.activeProjects)}`} />
          <Kpi icon={Factory} title="Đơn hàng sản xuất" value={fmt(kpis?.productionOrders)} note={`Đang sản xuất: ${fmt(kpis?.productionActive)}`} tone="emerald" />
          <Kpi icon={ClipboardList} title="Tổng cấu kiện" value={fmt(kpis?.components)} note={`Hoàn thành: ${kpis?.componentCompletionRate ?? 0}%`} tone="purple" />
          <Kpi icon={Truck} title="Hoạt động bãi/vận chuyển" value={fmt(kpis?.logisticsActive)} note={`Đang ở bãi: ${fmt(kpis?.yardActive)}`} tone="amber" />
          <Kpi icon={Warehouse} title="Tồn kho vật tư" value={fmt(kpis?.inventoryTotal)} note={`Nhập/Xuất: ${fmt(kpis?.inboundTransactions)}/${fmt(kpis?.outboundTransactions)}`} tone="cyan" />
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_1.35fr_1fr]">
          <section className={`${inventoryPanel} p-4`}>
            <h2 className="text-sm font-semibold text-white">Tiến độ sản xuất</h2>
            <div className="mt-4">
              <CompactDonutSummary
                segments={(data?.productionStatus ?? []).map((row, index) => ({ label: productionLabel(row.status), value: row.count, color: colors[index % colors.length] }))}
                centerValue={`${data?.productionSummary.completed ?? 0}`}
                centerLabel="Hoàn thành"
              />
            </div>
          </section>

          <section className={`${inventoryPanel} p-4`}>
            <h2 className="text-sm font-semibold text-white">Sản lượng giao dịch theo ngày</h2>
            <div className="mt-4">
              <CompactTrendChart rows={data?.movementTrend?.length ? data.movementTrend : [{ label: '-', value: 0 }]} />
            </div>
          </section>

          <section className={`${inventoryPanel} p-4`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-white">Tổng quan tồn kho</h2>
              <Link to="/inventory/materials" className="text-xs text-cyan-300 hover:text-cyan-200">Chi tiết</Link>
            </div>
            <div className="mt-4">
              <CompactDonutSummary
                segments={(data?.inventoryDistribution ?? []).map((row, index) => ({ label: row.label, value: row.value, color: colors[index % colors.length] }))}
                centerValue={fmt(kpis?.inventoryTotal)}
                centerLabel="Tổng vật tư"
              />
            </div>
          </section>
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-3">
          <section className={`${inventoryPanel} p-4`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-white">Dự án đang triển khai</h2>
              <Link to="/projects" className="text-xs text-cyan-300 hover:text-cyan-200">Xem tất cả</Link>
            </div>
            <div className="mt-4">
              <HorizontalBars rows={(data?.projects ?? []).map((project) => [`${project.code} - ${project.name}`, project.progress])} max={100} valueFormatter={(value) => `${value}%`} />
            </div>
          </section>

          <section className={`${inventoryPanel} p-4`}>
            <h2 className="text-sm font-semibold text-white">Hoạt động sản xuất</h2>
            <div className="mt-4 space-y-3">
              <MetricLine icon={Factory} label="Đang sản xuất" value={fmt(data?.productionSummary.active)} tone="emerald" />
              <MetricLine icon={ClipboardList} label="Chờ sản xuất" value={fmt(data?.productionSummary.waiting)} tone="amber" />
              <MetricLine icon={CheckCircle2} label="Đã hoàn thành" value={fmt(data?.productionSummary.completed)} tone="blue" />
              <MetricLine icon={AlertTriangle} label="Tạm dừng / trễ" value={fmt(data?.productionSummary.delayed)} tone="red" />
            </div>
          </section>

          <section className={`${inventoryPanel} p-4`}>
            <h2 className="text-sm font-semibold text-white">Truy cập nhanh</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <QuickLink icon={Boxes} label="Tạo dự án" to="/projects" />
              <QuickLink icon={Factory} label="Lệnh sản xuất" to="/production/orders" />
              <QuickLink icon={PackagePlus} label="Nhập vật tư" to="/inventory/inbound" />
              <QuickLink icon={FileText} label="Phiếu xuất" to="/inventory/outbound" />
              <QuickLink icon={Truck} label="Theo dõi bãi" to="/yard" />
              <QuickLink icon={ClipboardList} label="Báo cáo QC" to="/qc" />
              <QuickLink icon={Warehouse} label="Tồn kho" to="/inventory/materials" />
              <QuickLink icon={Settings} label="Cài đặt" to="/settings" />
            </div>
          </section>
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-3">
          <section className={`${inventoryPanel} p-4`}>
            <h2 className="text-sm font-semibold text-white">Cảnh báo</h2>
            <div className="mt-4 space-y-3">
              {(data?.alerts ?? []).map((alert) => (
                <div key={alert.code} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 text-slate-300"><AlertTriangle size={16} className="text-red-300" />{alert.title}</span>
                  <span className="font-semibold text-white">{fmt(alert.count)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={`${inventoryPanel} p-4 xl:col-span-2`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-white">Thông báo mới</h2>
              <Link to="/notifications" className="text-xs text-cyan-300 hover:text-cyan-200">Xem tất cả</Link>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {(data?.recentNotifications ?? []).slice(0, 6).map((item) => (
                <div key={item.id} className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
                  <div className="flex items-start gap-2">
                    <Bell size={16} className={item.isRead ? 'text-slate-500' : 'text-blue-300'} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{item.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-400">{item.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </OperationalShell>
  )
}

function Kpi({ icon: Icon, title, value, note, tone = 'blue' }: { icon: LucideIcon; title: string; value: string; note: string; tone?: 'blue' | 'emerald' | 'amber' | 'purple' | 'cyan' }) {
  const color = {
    blue: 'text-blue-300 bg-blue-500/15',
    emerald: 'text-emerald-300 bg-emerald-500/15',
    amber: 'text-amber-300 bg-amber-500/15',
    purple: 'text-purple-300 bg-purple-500/15',
    cyan: 'text-cyan-300 bg-cyan-500/15',
  }[tone]
  return (
    <section className={`${inventoryPanel} p-4`}>
      <div className={`mb-3 grid h-11 w-11 place-items-center rounded-xl ${color}`}><Icon size={22} /></div>
      <p className="text-xs text-slate-500">{title}</p>
      <h2 className="mt-1 text-2xl font-semibold text-white">{value}</h2>
      <p className="text-xs text-slate-500">{note}</p>
    </section>
  )
}

function MetricLine({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: string; tone: 'blue' | 'emerald' | 'amber' | 'red' }) {
  const color = {
    blue: 'text-blue-300 bg-blue-500/15',
    emerald: 'text-emerald-300 bg-emerald-500/15',
    amber: 'text-amber-300 bg-amber-500/15',
    red: 'text-red-300 bg-red-500/15',
  }[tone]
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2">
      <span className="flex items-center gap-2 text-sm text-slate-300"><span className={`grid h-8 w-8 place-items-center rounded-lg ${color}`}><Icon size={16} /></span>{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  )
}

function QuickLink({ icon: Icon, label, to }: { icon: LucideIcon; label: string; to: string }) {
  return (
    <Link to={to} className="rounded-xl border border-white/10 bg-slate-950/35 p-3 text-center text-xs text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200">
      <Icon size={19} className="mx-auto mb-2" />
      {label}
    </Link>
  )
}

function productionLabel(value: string) {
  const labels: Record<string, string> = {
    DRAFT: 'Nháp',
    PLANNED: 'Đã lên kế hoạch',
    RELEASED: 'Đã phát hành',
    IN_PROGRESS: 'Đang sản xuất',
    DELAYED: 'Trễ tiến độ',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
  }
  return labels[value] ?? value
}
