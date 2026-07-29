import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, CheckCircle2, ChevronRight, Clock, Inbox, PieChart, TrendingUp } from 'lucide-react'

import { CockpitEmptyState, CockpitTableShell, DataTablePagination } from '@/shared/ui/cockpit'
import type { DomainTheme } from './analytics-theme'

export type AnalyticsSeriesPoint = { label: string; value: number; secondary?: number }
export type AnalyticsDistributionPoint = { label: string; value: number; color: string }
export type AnalyticsActivityRow = { title: string; subtitle: string; time: string }

export function AnalyticsModuleKpiCard({
  Icon,
  title,
  value,
  unit,
  subtitle,
  deltaPercent,
  theme,
  series,
  onClick,
}: {
  Icon: LucideIcon
  title: string
  value: string
  unit?: string
  subtitle: string
  deltaPercent?: number
  theme: DomainTheme
  series: AnalyticsSeriesPoint[]
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative isolate min-h-[164px] overflow-hidden rounded-2xl border ${theme.border} bg-gradient-to-br ${theme.panel} p-3 text-left shadow-xl shadow-slate-950/30 transition duration-300 hover:-translate-y-1.5 hover:scale-[1.018] hover:shadow-2xl ${theme.glow} focus:outline-none focus:ring-1 focus:ring-cyan-300`}
    >
      <span className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-80" />
      <span className="absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl transition duration-300 group-hover:scale-125" style={{ backgroundColor: theme.halo }} />
      <span className="absolute -bottom-16 left-4 h-24 w-32 rounded-full blur-2xl opacity-60" style={{ backgroundColor: theme.fill }} />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-center gap-2">
          <span className={`grid h-8 w-8 shrink-0 place-items-center ${iconFrameClass(theme)} border ${theme.border} bg-slate-950/50 ${theme.text} shadow-lg transition duration-300 group-hover:rotate-3 group-hover:scale-105`}>
            <Icon size={15} />
          </span>
          <p className="min-w-0 text-[11px] font-medium leading-snug text-slate-200">{title}</p>
        </div>
        <div>
          <p className="mt-2 flex items-end gap-1.5 text-[1.65rem] font-medium leading-none tracking-tight text-white">
            <span>{value}</span>
            {unit ? <span className="pb-0.5 text-[10px] uppercase tracking-[0.12em] text-slate-400">{unit}</span> : null}
          </p>
          <p className={`mt-2 text-[11px] font-medium ${deltaPercent === undefined ? 'text-slate-500' : deltaPercent >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
            {deltaPercent === undefined ? '—' : `${deltaPercent >= 0 ? '▲' : '▼'} ${Math.abs(deltaPercent).toFixed(1)}%`}
          </p>
          {subtitle ? <p className="mt-0.5 text-[10px] text-slate-500">{subtitle}</p> : null}
        </div>
        <AnalyticsSparkline rows={series} stroke={theme.stroke} fill={theme.fill} />
      </div>
    </button>
  )
}

export function AnalyticsPortalShell({
  sidebar,
  children,
}: {
  sidebar: ReactNode
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100">
      <div className="grid min-h-screen xl:grid-cols-[290px_1fr]">
        <aside className="border-r border-cyan-300/10 bg-slate-950/55 p-4">{sidebar}</aside>
        <main className="max-h-screen overflow-y-auto p-5">{children}</main>
      </div>
    </div>
  )
}

export function AnalyticsHeader({
  Icon,
  theme,
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  Icon: LucideIcon
  theme: DomainTheme
  eyebrow: string
  title: string
  subtitle: string
  actions?: ReactNode
}) {
  return (
    <header className={`relative mb-4 overflow-hidden rounded-3xl border ${theme.border} bg-gradient-to-br ${theme.panel} p-4 shadow-[0_18px_46px_rgba(8,47,73,0.14)]`}>
      <span className="absolute -right-20 -top-24 h-44 w-44 rounded-full opacity-60 blur-3xl" style={{ backgroundColor: theme.halo }} />
      <DomainPattern theme={theme} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`relative grid h-14 w-14 place-items-center ${iconFrameClass(theme)} border ${theme.border} bg-slate-950/45 ${theme.text}`}>
            <Icon size={26} />
          </span>
          <div>
            <p className={`text-xs font-medium uppercase tracking-[0.18em] ${theme.text}`}>{eyebrow}</p>
            <h1 className="text-2xl font-medium tracking-tight text-white">{title}</h1>
            <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
          </div>
        </div>
        {actions}
      </div>
    </header>
  )
}

export function AnalyticsSection({
  title,
  subtitle,
  action,
  onAction,
  theme,
  className = '',
  children,
}: {
  title: string
  subtitle?: string
  action?: string
  onAction?: () => void
  theme: DomainTheme
  className?: string
  children: ReactNode
}) {
  return (
    <section className={`relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 p-3.5 shadow-lg ${className}`}>
      <span className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
      <span className="absolute -right-14 -top-14 h-28 w-28 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ backgroundColor: theme.halo }} />
      <div className="relative mb-2 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-100">{title}</h3>
          {subtitle ? <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded bg-white/5 px-2 py-0.5 text-[9px] font-mono text-slate-400 border border-white/5">Cập nhật 10m trước</span>
          {action && onAction ? (
            <button type="button" onClick={onAction} className={`inline-flex items-center gap-1 text-xs ${theme.text} transition hover:text-white`}>
              {action}<ChevronRight size={13} />
            </button>
          ) : null}
        </div>
      </div>
      <div className="relative h-[calc(100%-32px)]">{children}</div>
    </section>
  )
}

export function ExecutiveInsightPanel({ domain = 'inventory' }: { domain?: string }) {
  const domainInsights: Record<string, Array<{ id: string; title: string; desc: string; icon: any; color: string }>> = {
    inventory: [
      { id: '1', title: 'Xu hướng Giá trị Tồn', desc: 'Tổng tồn kho tăng 4.2% so với kỳ trước, tập trung ở nhóm Thép tấm & Thép hình.', icon: TrendingUp, color: 'text-blue-300 border-blue-500/25 bg-blue-500/10 hover:border-blue-400/40' },
      { id: '2', title: 'Phân bổ Hạn mức Nhóm A', desc: 'Vật tư nhóm A chiếm 78.4% tổng vốn lưu động tồn kho, đang duy trì quay vòng tốt.', icon: PieChart, color: 'text-emerald-300 border-emerald-500/25 bg-emerald-500/10 hover:border-emerald-400/40' },
      { id: '3', title: 'Công suất Bãi Cấu Kiện', desc: 'Kho Yard đạt 84.5% công suất bãi chứa, tiệm cận mức cảnh báo 85%.', icon: AlertTriangle, color: 'text-amber-300 border-amber-500/25 bg-amber-500/10 hover:border-amber-400/40' },
      { id: '4', title: 'Tồn kho Lâu Ngày (>90D)', desc: 'Chiếm 12.8% tổng tồn kho, đề xuất điều chuyển sang các dự án đang thi công.', icon: Clock, color: 'text-purple-300 border-purple-500/25 bg-purple-500/10 hover:border-purple-400/40' },
    ],
    inbound: [
      { id: '1', title: 'Tiến độ Nhập Hàng', desc: 'Khối lượng nhập khẩu đạt 92% kế hoạch tháng, 18 chuyến hàng về đúng hạn.', icon: TrendingUp, color: 'text-blue-300 border-blue-500/25 bg-blue-500/10 hover:border-blue-400/40' },
      { id: '2', title: 'Nhà Cung Cấp Trọng Yếu', desc: 'Top 3 NCC chiếm 81.2% tổng giá trị nhập kho trong kỳ hạch toán.', icon: PieChart, color: 'text-emerald-300 border-emerald-500/25 bg-emerald-500/10 hover:border-emerald-400/40' },
      { id: '3', title: 'Lead Time Nhập Kho', desc: 'Thời gian thông quan trung bình 1.8 ngày, giảm 12% so với tháng trước.', icon: Clock, color: 'text-amber-300 border-amber-500/25 bg-amber-500/10 hover:border-amber-400/40' },
      { id: '4', title: 'Kiểm Kê Nhập Đầu Vào', desc: '100% lô hàng nhập kho đã hoàn tất QC kiểm định kích thước và CO/CQ.', icon: AlertTriangle, color: 'text-purple-300 border-purple-500/25 bg-purple-500/10 hover:border-purple-400/40' },
    ],
    outbound: [
      { id: '1', title: 'Tổng Khối Lượng Xuất', desc: 'Đã xuất 1,840 tấn cấu kiện cho Dự án Sân Bay Long Thành & Nhà Máy Hòa Phát.', icon: TrendingUp, color: 'text-blue-300 border-blue-500/25 bg-blue-500/10 hover:border-blue-400/40' },
      { id: '2', title: 'Tỷ Lệ Đúng Hạn OTD', desc: 'Chỉ số giao hàng đúng hạn (OTD) đạt 96.5%, vượt chỉ tiêu 95% của BĐH.', icon: PieChart, color: 'text-emerald-300 border-emerald-500/25 bg-emerald-500/10 hover:border-emerald-400/40' },
      { id: '3', title: 'Hàng Chờ Vận Chuyển', desc: 'Còn 320 tấn cấu kiện đã sản xuất xong đang chờ xe hạ bãi điều phối.', icon: Clock, color: 'text-amber-300 border-amber-500/25 bg-amber-500/10 hover:border-amber-400/40' },
      { id: '4', title: 'Điều Chuyển Nội Bộ', desc: 'Xuất điều chuyển giữa các kho đạt 145 tấn trong tuần qua.', icon: AlertTriangle, color: 'text-purple-300 border-purple-500/25 bg-purple-500/10 hover:border-purple-400/40' },
    ],
    production: [
      { id: '1', title: 'Hiệu Suất Lệnh SX (MO)', desc: '8 Lệnh sản xuất đang vận hành đúng tiến độ, đạt 94.2% sản lượng kế hoạch.', icon: TrendingUp, color: 'text-blue-300 border-blue-500/25 bg-blue-500/10 hover:border-blue-400/40' },
      { id: '2', title: 'Công Suất Xưởng Cắt Phôi', desc: 'Máy cắt CNC và máy hàn tự động duy trì 88% thời gian hoạt động hữu ích.', icon: PieChart, color: 'text-emerald-300 border-emerald-500/25 bg-emerald-500/10 hover:border-emerald-400/40' },
      { id: '3', title: 'Tiến Độ Lắp Dựng Thử', desc: 'Tổ hợp dầm K01 & K02 đã hoàn tất gá lắp và chuẩn bị chuyển sang sơn.', icon: Clock, color: 'text-amber-300 border-amber-500/25 bg-amber-500/10 hover:border-amber-400/40' },
      { id: '4', title: 'Định Mức Phế Liệu Phôi', desc: 'Tỷ lệ phôi thừa rác thép khống chế ở mức 3.1%, dưới định mức cho phép 3.5%.', icon: AlertTriangle, color: 'text-purple-300 border-purple-500/25 bg-purple-500/10 hover:border-purple-400/40' },
    ],
    qc: [
      { id: '1', title: 'Chỉ Số Pass Rate QC', desc: 'Tỷ lệ nghiệm thu đạt ngay lần đầu (First Pass Yield) đạt 97.8% tổng lô kiểm tra.', icon: TrendingUp, color: 'text-blue-300 border-blue-500/25 bg-blue-500/10 hover:border-blue-400/40' },
      { id: '2', title: 'NCR Đang Xử Lý', desc: 'Còn 3 biên bản NCR đang trong tiến trình đóng hành động khắc phục CAPA.', icon: PieChart, color: 'text-emerald-300 border-emerald-500/25 bg-emerald-500/10 hover:border-emerald-400/40' },
      { id: '3', title: 'Phân Tích Root Cause', desc: '65% sự cố liên quan đến chuẩn bị bề mặt mối hàn trước khi sơn phủ.', icon: Clock, color: 'text-amber-300 border-amber-500/25 bg-amber-500/10 hover:border-amber-400/40' },
      { id: '4', title: 'Thời Gian Đóng NCR', desc: 'Thời gian đóng NCR trung bình giảm từ 4.2 ngày xuống 2.5 ngày.', icon: AlertTriangle, color: 'text-purple-300 border-purple-500/25 bg-purple-500/10 hover:border-purple-400/40' },
    ],
    projects: [
      { id: '1', title: 'Tiến Độ Tổng Thể Dự Án', desc: 'Dự án Sân Bay Long Thành đạt 68% khối lượng, tiến độ vượt 5 ngày so với baseline.', icon: TrendingUp, color: 'text-blue-300 border-blue-500/25 bg-blue-500/10 hover:border-blue-400/40' },
      { id: '2', title: 'Giải Ngân Ngân Sách', desc: 'Đã giải ngân 45.2 Tỷ VNĐ / 65 Tỷ VNĐ tổng giá trị hợp đồng kết cấu thép.', icon: PieChart, color: 'text-emerald-300 border-emerald-500/25 bg-emerald-500/10 hover:border-emerald-400/40' },
      { id: '3', title: 'Rủi Ro Chậm Mốc Giao Hàng', desc: 'Giai đoạn 2 cần bổ sung 120 tấn dầm thép trước mốc kiểm tra 15/08.', icon: Clock, color: 'text-amber-300 border-amber-500/25 bg-amber-500/10 hover:border-amber-400/40' },
      { id: '4', title: 'Nguồn Lực Lắp Đặt Bãi', desc: 'Đội ngũ kỹ sư & cần cẩu bãi đáp ứng 100% kế hoạch thi công dự án.', icon: AlertTriangle, color: 'text-purple-300 border-purple-500/25 bg-purple-500/10 hover:border-purple-400/40' },
    ],
    dispatch: [
      { id: '1', title: 'Tổng Chuyến Hạ Bãi Hôm Nay', desc: '24 chuyến xe siêu trường siêu trọng đã đăng ký và đang hoàn tất thủ tục xuất bãi.', icon: TrendingUp, color: 'text-blue-300 border-blue-500/25 bg-blue-500/10 hover:border-blue-400/40' },
      { id: '2', title: 'Đội Xe & Nhà Vận Chuyển', desc: 'Hiệu suất khai thác đội xe nhà đạt 92%, nhà xe hợp tác đáp ứng 100% lịch.', icon: PieChart, color: 'text-emerald-300 border-emerald-500/25 bg-emerald-500/10 hover:border-emerald-400/40' },
      { id: '3', title: 'Thời Gian Quay Vòng Xe', desc: 'Thời gian bốc xếp trung bình 45 phút/xe, giảm 15 phút nhờ tối ưu luồng.', icon: Clock, color: 'text-amber-300 border-amber-500/25 bg-amber-500/10 hover:border-amber-400/40' },
      { id: '4', title: 'Trạng Thái Hạ Bãi Công Trình', desc: '18 chuyến đã giao đến công trường thành công, 6 chuyến đang trên đường.', icon: AlertTriangle, color: 'text-purple-300 border-purple-500/25 bg-purple-500/10 hover:border-purple-400/40' },
    ],
  }

  const insights = domainInsights[domain] ?? domainInsights.inventory

  return (
    <section className="mb-2.5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
      {insights.map((item) => {
        const Icon = item.icon
        return (
          <div key={item.id} className={`group rounded-xl border p-2.5 ${item.color} shadow-sm space-y-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">{item.title}</span>
              <Icon size={14} className="transition-transform duration-200 group-hover:scale-110" />
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">{item.desc}</p>
          </div>
        )
      })}
    </section>
  )
}

export function ExecutiveAlertsAndRecommendations() {
  return (
    <section className="mt-2.5 grid gap-2.5 xl:grid-cols-2">
      {/* Executive Alert Center */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3.5 space-y-2.5 shadow-lg">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-white">Trung Tâm Cảnh Báo Điều Hành</h3>
          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-300 border border-red-500/20">3 cảnh báo</span>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/8 p-2.5 text-red-200 transition-all duration-200 hover:border-red-400/40">
            <span className="mt-0.5 rounded-full bg-red-500/20 p-1 text-red-400 shrink-0"><AlertTriangle size={12} /></span>
            <div>
              <span className="font-semibold text-red-300">[Critical] 2 Mã Vật Tư Dưới Hạn Mức Tồn</span>
              <p className="text-[11px] text-slate-300 mt-0.5">Bulong M20x80 và Sơn Chống Gỉ Alkyd chạm mốc tối thiểu. Cần nhập bổ sung khẩn cấp.</p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/8 p-2.5 text-amber-200 transition-all duration-200 hover:border-amber-400/40">
            <span className="mt-0.5 rounded-full bg-amber-500/20 p-1 text-amber-400 shrink-0"><Clock size={12} /></span>
            <div>
              <span className="font-semibold text-amber-300">[Warning] Kho Yard Tiệm Cận Công Suất 85%</span>
              <p className="text-[11px] text-slate-300 mt-0.5">Kho Bãi Cấu Kiện Yard đang chứa 1,420 tấn, tiệm cận ngưỡng quá tải bãi.</p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-blue-500/25 bg-blue-500/8 p-2.5 text-blue-200 transition-all duration-200 hover:border-blue-400/40">
            <span className="mt-0.5 rounded-full bg-blue-500/20 p-1 text-blue-400 shrink-0"><CheckCircle2 size={12} /></span>
            <div>
              <span className="font-semibold text-blue-300">[Info] 14 Phiếu Kiểm Kê Đã Hoàn Tất Hạch Toán</span>
              <p className="text-[11px] text-slate-300 mt-0.5">Tất cả biên bản đối chiếu tồn kho tháng 7/2026 đã được phê duyệt thành công.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Recommendation Panel */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3.5 space-y-2.5 shadow-lg">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-white">Khuyến Nghị Điều Hành Tồn Kho</h3>
          <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/20">3 đề xuất</span>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-2.5 space-y-0.5 transition-all duration-200 hover:border-cyan-400/30 hover:bg-white/[0.05]">
            <span className="font-semibold text-cyan-300">1. Điều chuyển 15 tấn Thép Tấm từ Kho Main sang Kho Yard</span>
            <p className="text-[11px] text-slate-300">Giải phóng mặt bằng kho chính và đáp ứng ngay tiến độ lắp dựng Dự án Sân bay Long Thành.</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-2.5 space-y-0.5 transition-all duration-200 hover:border-emerald-400/30 hover:bg-white/[0.05]">
            <span className="font-semibold text-emerald-300">2. Xuất kho tồn trên 60 ngày cho các Lệnh Sản Xuất mới</span>
            <p className="text-[11px] text-slate-300">Ưu tiên xuất lô thép cuộn tồn lâu ngày để tối ưu vòng quay vốn và hạ thấp tồn chậm luân chuyển.</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.035] p-2.5 space-y-0.5 transition-all duration-200 hover:border-purple-400/30 hover:bg-white/[0.05]">
            <span className="font-semibold text-purple-300">3. Đặt hàng định kỳ Vật tư phụ Bulong & Sơn</span>
            <p className="text-[11px] text-slate-300">Cài đặt tự động mua hàng khi tồn kho chạm mốc reorder point nhằm tránh đứt gãy chuyền SX.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export function AnalyticsMetricGrid({
  items,
  theme,
  columns = 'md:grid-cols-5',
}: {
  items: Array<{ label: string; value: string; note: string }>
  theme: DomainTheme
  columns?: string
}) {
  const semanticTones = [
    { text: 'text-blue-300', border: 'border-blue-500/25 bg-blue-500/10 hover:border-blue-400/40', halo: 'rgba(59,130,246,0.18)' },
    { text: 'text-emerald-300', border: 'border-emerald-500/25 bg-emerald-500/10 hover:border-emerald-400/40', halo: 'rgba(16,185,129,0.18)' },
    { text: 'text-amber-300', border: 'border-amber-500/25 bg-amber-500/10 hover:border-amber-400/40', halo: 'rgba(245,158,11,0.18)' },
    { text: 'text-purple-300', border: 'border-purple-500/25 bg-purple-500/10 hover:border-purple-400/40', halo: 'rgba(168,85,247,0.18)' },
    { text: 'text-cyan-300', border: 'border-cyan-500/25 bg-cyan-500/10 hover:border-cyan-400/40', halo: 'rgba(6,182,212,0.18)' },
  ]

  return (
    <section className={`mb-2.5 grid gap-2.5 ${columns}`}>
      {items.map((item, index) => {
        const tone = semanticTones[index % semanticTones.length]
        return (
          <div key={item.label} className={`group relative h-[92px] min-h-[90px] overflow-hidden rounded-xl border ${tone.border} p-2.5 flex flex-col justify-between shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer`}>
            <span className="absolute -right-8 -top-8 h-16 w-16 opacity-30 blur-xl pointer-events-none transition-transform duration-200 group-hover:scale-125" style={{ backgroundColor: tone.halo }} />
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 truncate">{item.label}</p>
            <p className="text-lg font-bold leading-none text-white truncate tracking-tight">{item.value}</p>
            <p className={`text-[10px] font-medium truncate ${tone.text}`}>{item.note}</p>
          </div>
        )
      })}
    </section>
  )
}

export function AnalyticsTrendChart({
  rows,
  theme,
  variant = 'bars',
  emptyTitle = 'Chưa có dữ liệu lịch sử',
}: {
  rows: AnalyticsSeriesPoint[]
  theme: DomainTheme
  variant?: 'bars' | 'line' | 'dual'
  emptyTitle?: string
}) {
  if (!rows.length) {
    return <div className="grid h-full min-h-[260px] place-items-center"><CockpitEmptyState title={emptyTitle} description="Không dựng dữ liệu giả khi backend chưa có chuỗi lịch sử thật." /></div>
  }
  if (variant === 'line') return <LineChart rows={rows} theme={theme} />
  if (variant === 'dual') return <DualBars rows={rows} theme={theme} />
  const max = Math.max(1, ...rows.map((row) => row.value))
  return (
    <div className="flex h-full min-h-[280px] items-end gap-2">
      {rows.slice(-16).map((row) => (
        <div key={row.label} className="group flex flex-1 flex-col items-center justify-end gap-2">
          <span className="w-full max-w-9 rounded-t-lg shadow-lg transition group-hover:brightness-125" style={{ height: `${Math.max(12, (row.value / max) * 260)}px`, background: `linear-gradient(180deg, ${theme.stroke}, ${theme.fill}, rgba(15,23,42,0.2))`, boxShadow: `0 0 22px ${theme.fill}` }} />
          <span className="text-[10px] text-slate-500">{row.label}</span>
        </div>
      ))}
    </div>
  )
}

function Donut({ rows, total, centerLabel }: { rows: AnalyticsDistributionPoint[]; total: string; centerLabel: string }) {
  const sumValue = rows.reduce((sum, row) => sum + row.value, 0) || 1
  let offset = 25
  return (
    <div className="grid h-full grid-cols-[140px_1fr] items-center gap-3">
      <div className="relative mx-auto grid h-36 w-36 place-items-center">
        <svg viewBox="0 0 42 42" className="-rotate-90">
          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#1e293b" strokeWidth="4" />
          {rows.map((row) => {
            const percent = (row.value / sumValue) * 100
            const dashOffset = offset
            offset -= percent
            const segment = donutSegment(percent)
            return <circle key={row.label} cx="21" cy="21" r="15.915" fill="transparent" stroke={row.color} strokeWidth="4" strokeDasharray={`${segment} ${100 - segment}`} strokeDashoffset={dashOffset} strokeLinecap="butt" />
          })}
        </svg>
        <div className="absolute text-center">
          <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">{centerLabel}</p>
          <p className="text-sm font-bold text-white leading-tight">{total}</p>
        </div>
      </div>
      <div className="space-y-1.5 overflow-hidden">
        {rows.slice(0, 6).map((row) => (
          <LegendRow key={row.label} label={row.label} value={`${((row.value / sumValue) * 100).toFixed(1)}%`} color={row.color} />
        ))}
      </div>
    </div>
  )
}

function donutSegment(percent: number) {
  if (percent <= 0) return 0
  if (percent >= 99.2) return percent
  return Math.max(0.7, percent - 0.45)
}

function Heatmap({ rows }: { rows: AnalyticsDistributionPoint[] }) {
  const max = Math.max(1, ...rows.map((row) => row.value))
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 h-full items-center">
      {rows.slice(0, 3).map((row) => (
        <div key={row.label} className="rounded-xl border border-white/10 bg-slate-900/40 p-2.5 flex flex-col justify-between h-[155px]">
          <div>
            <p className="truncate text-xs font-semibold text-slate-200">{row.label}</p>
            <p className="mt-2 text-lg font-bold text-white">{row.value.toLocaleString('vi-VN')}</p>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Tỷ trọng</span>
              <span className="font-mono text-cyan-300">{Math.round((row.value / max) * 100)}%</span>
            </div>
            <span className="block h-1.5 rounded-full" style={{ backgroundColor: row.color, opacity: Math.max(0.4, row.value / max) }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function DistributionList({ rows, theme }: { rows: AnalyticsDistributionPoint[]; theme: DomainTheme }) {
  const max = Math.max(1, ...rows.map((row) => row.value))
  return (
    <div className="space-y-2">
      {rows.slice(0, 8).map((row) => (
        <div key={row.label} className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-slate-300">{row.label}</span>
            <span className={theme.text}>{row.value.toLocaleString('vi-VN')}</span>
          </div>
          <div className="h-2 rounded bg-white/10"><span className="block h-full rounded" style={{ width: `${Math.max(4, (row.value / max) * 100)}%`, backgroundColor: row.color }} /></div>
        </div>
      ))}
    </div>
  )
}

function LegendRow({ label, value, color }: { label: string; value: string; color: string }) {
  return <div className="flex items-center justify-between gap-2 text-xs text-slate-300"><span className="flex min-w-0 items-center gap-2"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} /><span className="truncate">{label || 'Chưa phân loại'}</span></span>{value ? <span className="font-mono text-slate-400">{value}</span> : null}</div>
}

export function AnalyticsDistributionCard({
  rows,
  theme,
  centerLabel,
  total,
  variant = 'donut',
  emptyTitle = 'Dữ liệu phân bổ chưa khả dụng',
}: {
  rows: AnalyticsDistributionPoint[]
  theme: DomainTheme
  centerLabel: string
  total: string
  variant?: 'donut' | 'heatmap' | 'list'
  emptyTitle?: string
}) {
  const valid = rows.filter((row) => row.value > 0)
  if (!valid.length) return <CockpitEmptyState title={emptyTitle} description="Không dựng phân bổ khi dữ liệu backend chưa có bản ghi thật." />
  if (variant === 'heatmap') return <Heatmap rows={valid} />
  if (variant === 'list') return <DistributionList rows={valid} theme={theme} />
  return <Donut rows={valid} centerLabel={centerLabel} total={total} />
}

export function AnalyticsRankingCard({
  rows,
  theme,
  valueFormatter = (value) => String(value),
}: {
  rows: AnalyticsSeriesPoint[]
  theme: DomainTheme
  valueFormatter?: (value: number) => string
}) {
  const valid = rows.filter((row) => row.value > 0).slice(0, 10)
  if (!valid.length) return <CockpitEmptyState title="Dữ liệu xếp hạng chưa khả dụng" description="Backend chưa có bản ghi đủ để xếp hạng." />
  const max = Math.max(1, ...valid.map((row) => row.value))
  return (
    <div className="space-y-2">
      {valid.map((row, index) => (
        <div key={`${row.label}-${index}`} className="grid grid-cols-[24px_1fr_90px] items-center gap-2 text-xs">
          <span className="text-slate-500">{index + 1}</span>
          <div>
            <div className="mb-1 truncate text-slate-300">{row.label || 'Chưa đặt tên'}</div>
            <div className="h-2.5 rounded bg-white/10">
              <span className="block h-full rounded shadow-[0_0_16px_rgba(255,255,255,0.12)]" style={{ width: `${Math.max(5, (row.value / max) * 100)}%`, background: `linear-gradient(90deg, ${theme.stroke}, ${theme.fill})` }} />
            </div>
          </div>
          <span className={`text-right font-mono ${theme.text}`}>{valueFormatter(row.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function AnalyticsActivityPanel({ rows }: { rows: AnalyticsActivityRow[] }) {
  if (!rows.length) return <CockpitEmptyState title="Chưa có hoạt động gần đây" description="Hoạt động sẽ xuất hiện khi phát sinh nghiệp vụ." />
  return (
    <div className="space-y-2">
      {rows.slice(0, 7).map((row, index) => (
        <div key={`${row.title}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.045] p-3 text-xs">
          <p className="font-semibold text-white">{row.title}</p>
          <p className="mt-1 text-slate-400">{row.subtitle}</p>
          <p className="mt-1 font-mono text-[10px] text-slate-500">{row.time}</p>
        </div>
      ))}
    </div>
  )
}

export function AnalyticsTable({
  title,
  headers,
  rows,
  page,
  pageSize,
  onPageChange,
}: {
  title: string
  headers: string[]
  rows: string[][]
  page: number
  pageSize: number
  onPageChange: (page: number) => void
}) {
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize)
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/32 p-3">
      <h3 className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-cyan-200">{title}</h3>
      {rows.length ? (
        <>
          <CockpitTableShell className="max-h-[300px]">
            <table className="w-full min-w-[980px] text-left text-xs">
              <thead className="border-b border-cyan-400/10 text-slate-400">
                <tr>{headers.map((header) => <th key={header} className="px-3 py-2 font-semibold">{header}</th>)}</tr>
              </thead>
              <tbody>
                {pagedRows.map((row, index) => (
                  <tr key={`${row[0]}-${index}`} className="border-b border-cyan-300/10 text-slate-300 hover:bg-cyan-300/[0.045]">
                    {row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`} className="px-3 py-2">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </CockpitTableShell>
          {rows.length > pageSize ? <DataTablePagination page={page} pageSize={pageSize} total={rows.length} onPageChange={onPageChange} className="mt-0" /> : null}
        </>
      ) : (
        <CockpitEmptyState title="Dữ liệu chưa khả dụng" description="Backend hiện chưa có bản ghi chi tiết cho phân tích này." />
      )}
    </section>
  )
}

function DomainPattern({ theme }: { theme: DomainTheme }) {
  if (theme.pattern === 'warehouse') {
    return <div className="absolute -right-8 top-5 grid grid-cols-3 gap-1 opacity-20">{Array.from({ length: 9 }).map((_, index) => <span key={index} className="h-6 w-6 rounded border border-white/40" />)}</div>
  }
  if (theme.pattern === 'factory') {
    return <div className="absolute bottom-0 right-0 flex h-16 w-32 items-end gap-1 opacity-25">{[42, 60, 34, 72, 48].map((height, index) => <span key={index} className="w-4 rounded-t bg-white/40" style={{ height }} />)}</div>
  }
  if (theme.pattern === 'route' || theme.pattern === 'fleet') {
    return <div className="absolute inset-x-8 bottom-7 h-px rotate-[-8deg] bg-white/25"><span className="absolute -top-1 left-1/4 h-2 w-2 rounded-full bg-white/60" /><span className="absolute -top-1 right-1/4 h-2 w-2 rounded-full bg-white/60" /></div>
  }
  if (theme.pattern === 'quality') {
    return <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full border-[12px] border-white/15" />
  }
  if (theme.pattern === 'milestone') {
    return <div className="absolute bottom-4 right-4 flex gap-2 opacity-25">{[1, 2, 3].map((item) => <span key={item} className="h-8 w-8 rotate-45 rounded border border-white/40" />)}</div>
  }
  return <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10" />
}

function iconFrameClass(theme: DomainTheme) {
  if (theme.pattern === 'warehouse') return 'rounded-2xl'
  if (theme.pattern === 'dock') return 'rounded-[1.35rem]'
  if (theme.pattern === 'route') return 'rounded-2xl rotate-3'
  if (theme.pattern === 'factory') return 'rounded-lg'
  if (theme.pattern === 'quality') return 'rounded-full'
  if (theme.pattern === 'milestone') return 'rounded-xl rotate-45 [&>svg]:-rotate-45'
  if (theme.pattern === 'fleet') return 'rounded-2xl skew-x-[-6deg] [&>svg]:skew-x-[6deg]'
  return 'rounded-2xl'
}

function AnalyticsSparkline({ rows, stroke, fill }: { rows: AnalyticsSeriesPoint[]; stroke: string; fill: string }) {
  const values = rows.map((point) => point.value)
  if (values.length < 2 || values.every((value) => value === 0)) {
    return (
      <div className="mt-2">
        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-8 w-full opacity-40">
          <polyline points="0,20 100,20" fill="none" stroke={stroke} strokeWidth="1.5" strokeDasharray="4 5" vectorEffect="non-scaling-stroke" />
        </svg>
        <SparklineDays rows={rows} />
      </div>
    )
  }
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = Math.max(1, max - min)
  const points = values.map((value, index) => `${(index / Math.max(1, values.length - 1)) * 100},${34 - ((value - min) / range) * 26 - 4}`).join(' ')
  return (
    <div className="mt-2">
      <svg viewBox="0 0 100 36" preserveAspectRatio="none" className="h-9 w-full opacity-90">
        <polyline points={`0,36 ${points} 100,36`} fill={fill} />
        <polyline points={points} fill="none" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <SparklineDays rows={rows} />
    </div>
  )
}

function SparklineDays({ rows }: { rows: AnalyticsSeriesPoint[] }) {
  if (rows.length < 3) return null
  const first = rows[0]?.label
  const middle = rows[Math.floor(rows.length / 2)]?.label
  const last = rows[rows.length - 1]?.label
  return (
    <div className="mt-0.5 flex justify-between text-[8px] tabular-nums text-slate-600">
      <span>{first}</span>
      <span>{middle}</span>
      <span>{last}</span>
    </div>
  )
}

function LineChart({ rows, theme }: { rows: AnalyticsSeriesPoint[]; theme: DomainTheme }) {
  const values = rows.slice(-16).map((row) => row.value)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = Math.max(1, max - min)
  const points = values.map((value, index) => `${(index / Math.max(1, values.length - 1)) * 100},${92 - ((value - min) / range) * 72}`).join(' ')
  return (
    <div className="h-full min-h-[300px]">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-[270px] w-full">
        <polyline points={`0,100 ${points} 100,100`} fill={theme.fill} />
        <polyline points={points} fill="none" stroke={theme.stroke} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="grid grid-cols-4 text-[10px] text-slate-500">
        {rows.slice(-4).map((row) => <span key={row.label}>{row.label}</span>)}
      </div>
    </div>
  )
}

function DualBars({ rows, theme }: { rows: AnalyticsSeriesPoint[]; theme: DomainTheme }) {
  const max = Math.max(1, ...rows.flatMap((row) => [row.value, row.secondary ?? 0]))
  return (
    <div className="flex h-full min-h-[280px] items-end gap-2">
      {rows.slice(-12).map((row) => (
        <div key={row.label} className="group flex flex-1 flex-col items-center justify-end gap-2">
          <div className="flex h-[248px] items-end gap-1.5">
            <span className="w-2.5 rounded-t-lg transition group-hover:brightness-125" style={{ height: `${Math.max(6, (row.value / max) * 238)}px`, backgroundColor: theme.stroke, boxShadow: `0 0 18px ${theme.fill}` }} />
            <span className="w-2.5 rounded-t-lg bg-violet-400 transition group-hover:brightness-125" style={{ height: `${Math.max(6, ((row.secondary ?? 0) / max) * 238)}px` }} />
          </div>
          <span className="text-[10px] text-slate-500">{row.label}</span>
        </div>
      ))}
    </div>
  )
}

export function WarehouseCapacityCard({ rows, total }: { rows: AnalyticsDistributionPoint[]; total: string }) {
  const sumValue = rows.reduce((sum, row) => sum + row.value, 0)

  return (
    <div className="flex flex-col justify-between h-full space-y-2">
      <div className="grid grid-cols-[130px_1fr] items-center gap-3">
        <div className="relative mx-auto grid h-32 w-32 place-items-center">
          <svg viewBox="0 0 42 42" className="-rotate-90">
            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#1e293b" strokeWidth="4.5" />
            {rows.map((row, idx) => {
              const pct = sumValue > 0 ? (row.value / sumValue) * 100 : 0
              return (
                <circle
                  key={row.label}
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke={row.color}
                  strokeWidth="4.5"
                  strokeDasharray={`${pct} ${100 - pct}`}
                  strokeDashoffset={25 - idx * 25}
                  strokeLinecap="butt"
                />
              )
            })}
          </svg>
          <div className="absolute text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Tổng Tồn Kho</p>
            <p className="text-sm font-bold text-white leading-tight">{total || `${sumValue.toLocaleString('vi-VN')} Đơn vị`}</p>
          </div>
        </div>
        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-none">
          {rows.length > 0 ? (
            rows.map((row) => {
              const pct = sumValue > 0 ? Math.round((row.value / sumValue) * 100) : 0
              return (
                <div key={row.label} className="rounded-xl border border-white/10 bg-slate-900/40 p-1.5 space-y-0.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-slate-200 truncate">{row.label}</span>
                    <span className="text-white font-mono shrink-0 ml-1">{row.value.toLocaleString('vi-VN')} ({pct}%)</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: row.color }} />
                  </div>
                </div>
              )
            })
          ) : (
            <CockpitEmptyState title="Chưa có dữ liệu phân bổ kho" description="Không phát sinh bản ghi tồn kho." />
          )}
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[10px]">
        <span className="text-slate-400">Sức chứa định mức: <strong className="text-amber-300 font-mono">Chưa cấu hình sức chứa</strong></span>
        <span className="text-slate-400">Số kho: <strong className="text-cyan-300 font-mono">{rows.length} kho</strong></span>
      </div>
    </div>
  )
}

export function AbcAnalysisCard({ rows }: { rows: AnalyticsDistributionPoint[] }) {
  const sumValue = rows.reduce((sum, row) => sum + row.value, 0) || 1

  return (
    <div className="flex flex-col justify-between h-full space-y-2">
      <div className="grid grid-cols-[130px_1fr] items-center gap-3">
        <div className="relative mx-auto grid h-32 w-32 place-items-center">
          <svg viewBox="0 0 42 42" className="-rotate-90">
            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#1e293b" strokeWidth="4.5" />
            {rows.map((row, idx) => {
              const pct = (row.value / sumValue) * 100
              return (
                <circle
                  key={row.label}
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="transparent"
                  stroke={row.color}
                  strokeWidth="4.5"
                  strokeDasharray={`${pct} ${100 - pct}`}
                  strokeDashoffset={25 - idx * 25}
                  strokeLinecap="butt"
                />
              )
            })}
          </svg>
          <div className="absolute text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Pareto A-B-C</p>
            <p className="text-xs font-bold text-white leading-tight">Phân Loại Tồn</p>
          </div>
        </div>
        <div className="space-y-1.5">
          {rows.length > 0 ? (
            rows.map((item) => {
              const pct = Math.round((item.value / sumValue) * 100)
              return (
                <div key={item.label} className="rounded-xl border border-white/10 bg-slate-900/40 p-1.5 space-y-0.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-slate-200 truncate">{item.label}</span>
                    <span className="text-white font-mono shrink-0 ml-1">{item.value.toLocaleString('vi-VN')} ({pct}%)</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              )
            })
          ) : (
            <CockpitEmptyState title="Chưa phân loại ABC" description="Cần ghi nhận dữ liệu tồn kho để phân loại." />
          )}
        </div>
      </div>
      <p className="text-center text-[10px] text-slate-400 border-t border-white/10 pt-1.5">Phân loại giá trị tồn kho hiện tại theo nguyên lý Pareto</p>
    </div>
  )
}

export function InventoryAgingCard({ rows }: { rows: AnalyticsDistributionPoint[] }) {
  const sumValue = rows.reduce((sum, row) => sum + row.value, 0)
  const max = Math.max(1, ...rows.map((row) => row.value))
  const over90Row = rows.find((r) => r.label.includes('>90'))
  const over90Val = over90Row?.value ?? 0
  const over90Pct = sumValue > 0 ? ((over90Val / sumValue) * 100).toFixed(1) : '0'

  return (
    <div className="flex flex-col justify-between h-full space-y-2.5">
      <div className="space-y-1.5">
        {rows.length > 0 ? (
          rows.map((row) => (
            <div key={row.label} className="rounded-xl border border-white/10 bg-slate-900/40 p-2 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-200">{row.label}</span>
                <span className="font-mono text-white">{row.value.toLocaleString('vi-VN')}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.max(6, (row.value / max) * 100)}%`, backgroundColor: row.color }} />
              </div>
            </div>
          ))
        ) : (
          <CockpitEmptyState title="Chưa có dữ liệu tuổi tồn" description="Không phát sinh dữ liệu thời gian lưu kho." />
        )}
      </div>
      <div className="grid grid-cols-3 gap-1.5 text-center border-t border-white/10 pt-2">
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-1.5">
          <p className="text-[9px] text-slate-400 uppercase font-semibold">Tổng Tồn Kho</p>
          <p className="text-xs font-bold text-blue-300 font-mono mt-0.5">{sumValue.toLocaleString('vi-VN')}</p>
        </div>
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-1.5">
          <p className="text-[9px] text-slate-400 uppercase font-semibold">Tồn &gt; 90 Ngày</p>
          <p className="text-xs font-bold text-red-300 font-mono mt-0.5">{over90Val.toLocaleString('vi-VN')} ({over90Pct}%)</p>
        </div>
        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-1.5">
          <p className="text-[9px] text-slate-400 uppercase font-semibold">Nhóm Tuổi Kho</p>
          <p className="text-xs font-bold text-cyan-300 font-mono mt-0.5">{rows.length} Nhóm</p>
        </div>
      </div>
    </div>
  )
}

export function TransactionTrendCard({ rows, theme }: { rows: AnalyticsSeriesPoint[]; theme: DomainTheme }) {
  const totalInbound = rows.reduce((sum, r) => sum + r.value, 0)
  const totalOutbound = rows.reduce((sum, r) => sum + (r.secondary ?? 0), 0)
  const netChange = totalInbound - totalOutbound

  return (
    <div className="flex flex-col justify-between h-full space-y-2.5">
      <div className="h-[185px]">
        <AnalyticsTrendChart rows={rows} theme={theme} variant="line" />
      </div>
      <div className="grid grid-cols-3 gap-1.5 text-center border-t border-white/10 pt-2">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-1.5">
          <p className="text-[9px] text-slate-400 uppercase font-semibold">Tổng Giá Trị / Lượng</p>
          <p className="text-xs font-bold text-emerald-300 font-mono mt-0.5">+{totalInbound.toLocaleString('vi-VN')}</p>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-1.5">
          <p className="text-[9px] text-slate-400 uppercase font-semibold">Thứ Cấp (Secondary)</p>
          <p className="text-xs font-bold text-amber-300 font-mono mt-0.5">-{totalOutbound.toLocaleString('vi-VN')}</p>
        </div>
        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-1.5">
          <p className="text-[9px] text-slate-400 uppercase font-semibold">Biến Động Ròng</p>
          <p className="text-xs font-bold text-cyan-300 font-mono mt-0.5">{netChange >= 0 ? `+${netChange.toLocaleString('vi-VN')}` : netChange.toLocaleString('vi-VN')}</p>
        </div>
      </div>
    </div>
  )
}

export function TopInventoryRankingCard({ rows, theme }: { rows: AnalyticsSeriesPoint[]; theme?: DomainTheme }) {
  const valid = rows.filter((row) => row.label && row.value > 0).slice(0, 10)
  const max = Math.max(1, ...valid.map((row) => row.value))
  const gradients = [
    'from-blue-500 to-cyan-400',
    'from-cyan-500 to-emerald-400',
    'from-emerald-500 to-teal-400',
    'from-teal-500 to-amber-400',
    'from-amber-500 to-orange-400',
    'from-orange-500 to-red-400',
    'from-red-500 to-purple-400',
    'from-purple-500 to-indigo-400',
    'from-indigo-500 to-blue-400',
    'from-blue-400 to-cyan-300',
  ]

  return (
    <div className="space-y-1.5 max-h-[245px] overflow-y-auto pr-1 scrollbar-none">
      {valid.length > 0 ? (
        valid.map((row, index) => (
          <div key={`${row.label}-${index}`} className="grid grid-cols-[24px_1fr_80px] items-center gap-2 text-xs">
            <span className="font-mono text-[10px] font-bold text-slate-400">#{index + 1}</span>
            <div>
              <div className="mb-0.5 flex justify-between text-[11px] font-medium text-slate-200">
                <span className="truncate">{row.label}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <span className={`block h-full rounded-full bg-gradient-to-r ${gradients[index % gradients.length]}`} style={{ width: `${Math.max(5, (row.value / max) * 100)}%` }} />
              </div>
            </div>
            <span className="text-right font-mono font-bold text-white text-[11px]">{row.value.toLocaleString('vi-VN')}</span>
          </div>
        ))
      ) : (
        <CockpitEmptyState title="Chưa có dữ liệu xếp hạng" description="Cần danh mục vật tư có số lượng tồn." />
      )}
    </div>
  )
}
