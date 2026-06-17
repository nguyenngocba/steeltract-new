import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, MapPin, PackageCheck, RefreshCw, Route, Search, Truck, type LucideIcon } from 'lucide-react'

import { OperationalShell } from '@/shared/layouts/OperationalShell'
import { formatQuantity } from '@/shared/utils/number-format'

type LogisticsTab = 'overview' | 'routes' | 'gps'

const panel = 'rounded-lg border border-white/10 bg-slate-950/55 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl'
const input = 'h-9 rounded-lg border border-white/10 bg-slate-950/65 px-3 text-xs text-slate-100 outline-none transition focus:border-blue-400'
const primaryButton = 'rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500'
const mutedButton = 'rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-200 hover:bg-white/[0.08]'
const fmt = (value = 0) => formatQuantity(value, 0)

const tabs: Array<[LogisticsTab, string]> = [
  ['overview', 'Tổng quan'],
  ['routes', 'Tuyến giao hàng'],
  ['gps', 'GPS / Phương tiện'],
]

const shipments = [
  { id: 'VC-2506-031', project: 'Nhà máy sản xuất A', component: 'BEAM H450x200', qty: 18, truck: '51C-246.18', driver: 'Nguyễn Văn Bình', status: 'Đang giao', progress: 68, eta: '14:30' },
  { id: 'VC-2506-030', project: 'Cầu trục 02', component: 'COLUMN H300x300', qty: 12, truck: '51D-884.22', driver: 'Trần Minh Đức', status: 'Hoàn thành', progress: 100, eta: 'Đã giao' },
  { id: 'VC-2506-029', project: 'Khu công nghiệp J', component: 'PLATE 20mm', qty: 24, truck: '50H-116.72', driver: 'Lê Minh Cường', status: 'Chờ bốc hàng', progress: 25, eta: '16:10' },
  { id: 'VC-2506-028', project: 'Nhà xưởng G', component: 'BRACE L100x100', qty: 10, truck: '51C-782.90', driver: 'Phạm Quốc Huy', status: 'Cảnh báo', progress: 42, eta: 'Trễ 35p' },
]

export function LogisticsPage() {
  const [tab, setTab] = useState<LogisticsTab>('overview')
  const [query, setQuery] = useState('')
  const rows = useMemo(() => shipments.filter((row) => `${row.id} ${row.project} ${row.component} ${row.truck}`.toLowerCase().includes(query.toLowerCase())), [query])
  const completed = shipments.filter((row) => row.status === 'Hoàn thành').length
  const warning = shipments.filter((row) => row.status === 'Cảnh báo').length

  return <OperationalShell>
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_30%),linear-gradient(135deg,#07111f_0%,#0f172a_46%,#111827_100%)] p-4 text-slate-100">
      <header className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400">SteelTrack ERP</p>
          <h1 className="mt-1 text-2xl font-semibold">Vận chuyển</h1>
          <p className="mt-1 text-xs text-slate-500">Theo dõi chuyển cấu kiện từ bãi tập kết ra công trình và cảnh báo tuyến giao hàng.</p>
        </div>
        <div className="flex gap-2"><button className={primaryButton}>+ Tạo chuyến</button><button className={mutedButton}>Xuất Excel</button><button className={mutedButton}>Báo cáo</button></div>
      </header>

      <nav className={`${panel} mb-3 flex gap-1 overflow-x-auto p-1`}>
        {tabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs transition ${tab === id ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/30' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'}`}>{label}</button>)}
      </nav>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <Kpi icon={Truck} title="Tổng chuyến" value={fmt(shipments.length)} note="Trong ngày" />
        <Kpi icon={CheckCircle2} title="Đã giao" value={fmt(completed)} note="Hoàn tất" tone="emerald" />
        <Kpi icon={Clock} title="Đang giao" value={fmt(shipments.length - completed - warning)} note="Theo dõi GPS" tone="amber" />
        <Kpi icon={AlertTriangle} title="Cảnh báo" value={fmt(warning)} note="Cần xử lý" tone="red" />
        <Kpi icon={PackageCheck} title="Cấu kiện" value={fmt(shipments.reduce((sum, row) => sum + row.qty, 0))} note="Đang vận chuyển" tone="purple" />
        <Kpi icon={Route} title="Tuyến hoạt động" value="3" note="Miền Nam" tone="cyan" />
      </div>

      <section className={`${panel} mt-3 flex flex-wrap items-end gap-2 p-3`}>
        <select className={input}><option>Tuyến: Tất cả</option><option>Bãi chính → Nhà máy A</option><option>Bãi chính → Cầu trục 02</option></select>
        <select className={input}><option>Trạng thái: Tất cả</option><option>Đang giao</option><option>Hoàn thành</option><option>Cảnh báo</option></select>
        <div className="flex min-w-[320px] flex-1 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/65 px-3"><Search size={15} className="text-cyan-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã chuyến, công trình, xe..." className="h-9 w-full bg-transparent text-xs outline-none" /></div>
        <button className={primaryButton}>Tìm kiếm</button><button className={mutedButton}><RefreshCw size={14} />Làm mới</button>
      </section>

      {tab === 'overview' && <Overview rows={rows} />}
      {tab === 'routes' && <RoutesTab rows={rows} />}
      {tab === 'gps' && <GpsTab rows={rows} />}
    </main>
  </OperationalShell>
}

function Overview({ rows }: { rows: typeof shipments }) {
  return <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_360px]">
    <ShipmentTable rows={rows} />
    <aside className="space-y-3">
      <Donut title="Cơ cấu chuyến" center={fmt(rows.length)} rows={[['Đang giao', rows.filter((r) => r.status === 'Đang giao').length, 'bg-blue-500'], ['Hoàn thành', rows.filter((r) => r.status === 'Hoàn thành').length, 'bg-emerald-500'], ['Chờ bốc', rows.filter((r) => r.status === 'Chờ bốc hàng').length, 'bg-amber-400'], ['Cảnh báo', rows.filter((r) => r.status === 'Cảnh báo').length, 'bg-red-500']]} />
      <Trend title="Hiệu suất giao hàng" />
      <WarningList rows={rows.filter((row) => row.status === 'Cảnh báo')} />
    </aside>
  </div>
}

function RoutesTab({ rows }: { rows: typeof shipments }) {
  return <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_360px]"><ShipmentTable rows={rows} /><Trend title="Tải tuyến theo giờ" /></div>
}

function GpsTab({ rows }: { rows: typeof shipments }) {
  return <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_360px]">
    <section className={`${panel} min-h-[480px] p-4`}>
      <h2 className="text-sm font-semibold">Bản đồ vận chuyển 2D</h2>
      <div className="relative mt-4 h-[420px] overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(circle_at_30%_20%,rgba(14,165,233,0.18),transparent_22%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(2,6,23,0.95))]">
        {rows.map((row, index) => <div key={row.id} className="absolute" style={{ left: `${18 + index * 18}%`, top: `${24 + (index % 2) * 28}%` }}><MapPin className={row.status === 'Cảnh báo' ? 'text-red-400' : 'text-cyan-300'} /><span className="mt-1 block rounded bg-slate-950/80 px-2 py-1 text-[10px]">{row.truck}</span></div>)}
      </div>
    </section>
    <WarningList rows={rows} />
  </div>
}

function ShipmentTable({ rows }: { rows: typeof shipments }) {
  return <section className={`${panel} overflow-hidden`}>
    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><h2 className="text-sm font-semibold">Danh sách chuyến vận chuyển</h2><span className="text-xs text-slate-500">1 - {rows.length} / {rows.length} kết quả</span></div>
    <div className="overflow-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.12em] text-slate-400"><tr>{['Mã chuyến', 'Công trình', 'Cấu kiện', 'SL', 'Xe', 'Tài xế', 'ETA', 'Tiến độ', 'Trạng thái'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-white/10 text-slate-200 hover:bg-cyan-400/10"><td className="px-4 py-3 font-semibold text-cyan-300">{row.id}</td><td className="px-4 py-3">{row.project}</td><td className="px-4 py-3">{row.component}</td><td className="px-4 py-3">{row.qty}</td><td className="px-4 py-3">{row.truck}</td><td className="px-4 py-3">{row.driver}</td><td className="px-4 py-3">{row.eta}</td><td className="px-4 py-3"><Progress value={row.progress} /></td><td className="px-4 py-3"><Status value={row.status} /></td></tr>)}</tbody></table></div>
  </section>
}

function Kpi({ icon: Icon, title, value, note, tone = 'cyan' }: { icon: LucideIcon; title: string; value: string; note: string; tone?: 'cyan' | 'emerald' | 'amber' | 'red' | 'purple' }) {
  const color = tone === 'emerald' ? 'from-emerald-500 to-teal-400' : tone === 'amber' ? 'from-amber-500 to-orange-400' : tone === 'red' ? 'from-red-500 to-rose-400' : tone === 'purple' ? 'from-purple-500 to-fuchsia-400' : 'from-blue-500 to-cyan-400'
  return <section className={`${panel} relative overflow-hidden p-4`}><div className={`absolute left-0 top-0 h-1 w-full bg-gradient-to-r ${color}`} /><span className={`grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br ${color} text-white`}><Icon size={20} /></span><p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-slate-400">{title}</p><h2 className="mt-1 text-2xl font-semibold">{value}</h2><p className="text-xs text-slate-500">{note}</p></section>
}

function Donut({ title, center, rows }: { title: string; center: string; rows: Array<[string, number, string]> }) {
  return <section className={`${panel} p-4`}><h3 className="text-sm font-semibold">{title}</h3><div className="mt-4 grid grid-cols-[120px_1fr] items-center gap-4"><div className="grid aspect-square place-items-center rounded-full bg-[conic-gradient(#2563eb_0_38%,#10b981_38%_66%,#f59e0b_66%_84%,#ef4444_84%_100%)] p-4"><div className="grid h-full w-full place-items-center rounded-full bg-slate-950 text-center"><div><div className="text-xl font-semibold">{center}</div><div className="text-xs text-slate-500">Chuyến</div></div></div></div><div className="space-y-2">{rows.map(([label, value, color]) => <div key={label} className="flex justify-between text-xs"><span className="flex items-center gap-2"><i className={`h-2 w-2 rounded-full ${color}`} />{label}</span><b>{value}</b></div>)}</div></div></section>
}

function Trend({ title }: { title: string }) {
  return <section className={`${panel} p-4`}><h3 className="text-sm font-semibold">{title}</h3><div className="mt-4 flex h-36 items-end gap-2 rounded-lg border border-white/10 bg-slate-950/35 px-3 pb-3">{[38, 42, 55, 51, 63, 72, 68, 81].map((value, index) => <span key={index} className="flex-1 rounded-t bg-gradient-to-t from-blue-700 to-cyan-400" style={{ height: `${value}%` }} />)}</div></section>
}

function WarningList({ rows }: { rows: typeof shipments }) {
  return <section className={`${panel} p-4`}><h3 className="text-sm font-semibold">Cảnh báo vận chuyển</h3><div className="mt-3 space-y-2">{rows.map((row) => <div key={row.id} className="rounded-lg border border-white/10 bg-red-500/5 px-3 py-2 text-xs"><b className="text-red-300">{row.id}</b><span className="block text-slate-400">{row.project} · {row.eta}</span></div>)}{!rows.length ? <p className="text-xs text-slate-500">Không có cảnh báo.</p> : null}</div></section>
}

function Progress({ value }: { value: number }) {
  return <span className="block h-2 rounded bg-white/10"><i className="block h-full rounded bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${value}%` }} /></span>
}

function Status({ value }: { value: string }) {
  const tone = value === 'Hoàn thành' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : value === 'Cảnh báo' ? 'border-red-500/40 bg-red-500/10 text-red-300' : value === 'Đang giao' ? 'border-blue-500/40 bg-blue-500/10 text-blue-300' : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
  return <span className={`rounded border px-2 py-1 text-[10px] ${tone}`}>{value}</span>
}
