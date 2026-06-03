import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CalendarClock, CheckCircle2, ClipboardCheck, FileBarChart, Gauge, ListChecks, RotateCcw, Search, ShieldCheck, SlidersHorizontal, XCircle, type LucideIcon } from 'lucide-react'

import { OperationalShell } from '@/shared/layouts/OperationalShell'
import { approveInspection, completeInspection, createInspection, getQcCockpit, startInspection, type QcCockpit, type QcInspectionRow, type QcProductionQueueRow } from '../api/qc.api'

type QcTab = 'overview' | 'inspections' | 'plan' | 'standards' | 'ncr' | 'calibration' | 'reports'

const tabs: Array<[QcTab, string]> = [
  ['overview', 'Tổng quan'],
  ['inspections', 'Phiếu kiểm tra'],
  ['plan', 'Kế hoạch QC'],
  ['standards', 'Tiêu chuẩn'],
  ['ncr', 'Không phù hợp (NCR)'],
  ['calibration', 'Hiệu chuẩn thiết bị'],
  ['reports', 'Báo cáo'],
]
const panel = 'rounded border border-slate-800 bg-[#071321]'
const input = 'h-10 rounded border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 outline-none focus:border-cyan-500'
const fmt = (value = 0) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value)
const date = (value?: string | null) => value ? new Date(value).toLocaleString('vi-VN') : '-'

export function QcPage() {
  const [tab, setTab] = useState<QcTab>('overview')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selectedInspection, setSelectedInspection] = useState<QcInspectionRow | null>(null)
  const [selectedQueue, setSelectedQueue] = useState<QcProductionQueueRow | null>(null)
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['qc-cockpit'], queryFn: getQcCockpit, refetchInterval: 5000 })
  const runtime = data ?? emptyRuntime()
  const filteredInspections = useMemo(() => runtime.inspections.filter((row) => {
    if (status !== 'all' && row.status !== status) return false
    return `${row.inspectionNo} ${row.projectName} ${row.componentCode} ${row.productionOrderNo}`.toLowerCase().includes(query.toLowerCase())
  }), [query, runtime.inspections, status])
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['qc-cockpit'] })
  const createMutation = useMutation({
    mutationFn: async (row: QcProductionQueueRow) => createInspection({
      productionOrderId: row.id,
      componentId: row.componentId,
      projectId: row.projectId,
      status: 'READY',
      metadata: { source: 'qc-cockpit', orderNo: row.orderNo },
    }),
    onSuccess: invalidate,
  })
  const startMutation = useMutation({ mutationFn: startInspection, onSuccess: invalidate })
  const passMutation = useMutation({
    mutationFn: async (id: string) => {
      await startInspection(id).catch(() => undefined)
      await completeInspection(id, 'PASSED')
      return approveInspection(id)
    },
    onSuccess: invalidate,
  })
  const failMutation = useMutation({
    mutationFn: async (id: string) => {
      await startInspection(id).catch(() => undefined)
      return completeInspection(id, 'REWORK_REQUIRED')
    },
    onSuccess: invalidate,
  })

  return <OperationalShell>
    <main className="min-h-screen bg-[#020811] p-4 text-slate-100">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-800 pb-3">
        <div><p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400">Chất lượng (QC)</p><h1 className="mt-1 text-2xl font-semibold">Chất lượng (QC)</h1><p className="mt-1 text-xs text-slate-500">QC móc nối sản xuất và cấu kiện. Thành phẩm chỉ được chuyển bãi khi QC đạt hoặc đã duyệt.</p></div>
        <div className="flex gap-2"><button onClick={() => setTab('inspections')} className="rounded bg-blue-600 px-4 py-2 text-xs font-semibold">+ Tạo phiếu kiểm tra</button><button className="rounded border border-slate-700 bg-slate-900 px-4 py-2 text-xs">Xuất Excel</button><button className="rounded border border-slate-700 bg-slate-900 px-4 py-2 text-xs">Báo cáo</button></div>
      </header>
      <nav className="my-3 flex gap-1 overflow-x-auto rounded bg-[#06101b] p-1">{tabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`whitespace-nowrap rounded px-3 py-2 text-xs ${tab === id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>{label}</button>)}</nav>
      <FilterBar query={query} status={status} onQuery={setQuery} onStatus={setStatus} />
      {isLoading ? <div className={`${panel} mt-3 p-6 text-center text-sm text-slate-500`}>Đang tải QC cockpit...</div> : null}
      {tab === 'overview' && <Overview runtime={runtime} rows={filteredInspections} queue={runtime.productionQueue} onOpen={setSelectedInspection} onQueue={setSelectedQueue} onCreate={(row) => createMutation.mutate(row)} />}
      {tab === 'inspections' && <Inspections rows={filteredInspections} queue={runtime.productionQueue} onOpen={setSelectedInspection} onQueue={setSelectedQueue} onCreate={(row) => createMutation.mutate(row)} onPass={(row) => passMutation.mutate(row.id)} onFail={(row) => failMutation.mutate(row.id)} />}
      {tab === 'plan' && <Plan queue={runtime.productionQueue} onCreate={(row) => createMutation.mutate(row)} />}
      {tab === 'standards' && <Standards runtime={runtime} />}
      {tab === 'ncr' && <Ncr runtime={runtime} />}
      {tab === 'calibration' && <Calibration />}
      {tab === 'reports' && <Reports runtime={runtime} />}
      <InspectionDetail inspection={selectedInspection} onClose={() => setSelectedInspection(null)} onStart={(id) => startMutation.mutate(id)} onPass={(id) => passMutation.mutate(id)} onFail={(id) => failMutation.mutate(id)} />
      <QueueDetail row={selectedQueue} onClose={() => setSelectedQueue(null)} onCreate={(row) => createMutation.mutate(row)} />
    </main>
  </OperationalShell>
}

function FilterBar({ query, status, onQuery, onStatus }: { query: string; status: string; onQuery: (value: string) => void; onStatus: (value: string) => void }) {
  return <div className={`${panel} flex flex-wrap items-center gap-2 p-3`}>
    <div className="flex min-w-72 flex-1 items-center gap-2 rounded border border-slate-700 bg-[#050d18] px-3"><Search size={15} className="text-cyan-400" /><input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Tìm mã phiếu, MO, cấu kiện, dự án..." className="h-10 w-full bg-transparent text-sm outline-none" /></div>
    <select value={status} onChange={(e) => onStatus(e.target.value)} className={input}><option value="all">Trạng thái: Tất cả</option><option value="READY">Chờ xử lý</option><option value="IN_PROGRESS">Đang kiểm</option><option value="PASSED">Đạt</option><option value="APPROVED">Đã duyệt</option><option value="REWORK_REQUIRED">NCR/Rework</option><option value="FAILED">Không đạt</option></select>
    <button className="h-10 rounded bg-blue-600 px-4 text-sm">Tìm kiếm</button><button className="h-10 rounded border border-slate-700 px-4 text-sm">Làm mới</button>
  </div>
}

function Overview({ runtime, rows, queue, onOpen, onQueue, onCreate }: { runtime: QcCockpit; rows: QcInspectionRow[]; queue: QcProductionQueueRow[]; onOpen: (row: QcInspectionRow) => void; onQueue: (row: QcProductionQueueRow) => void; onCreate: (row: QcProductionQueueRow) => void }) {
  const m = runtime.metrics
  return <div className="mt-3 space-y-4">
    <KpiStrip runtime={runtime} />
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]"><InspectionTable rows={rows.slice(0, 10)} onOpen={onOpen} /><aside className="space-y-4"><Latest rows={rows} onOpen={onOpen} /><Donut title="Thống kê theo loại kiểm tra" center={fmt(m.total)} rows={runtime.byCategory.map((r, i) => [r.category, r.count, ['bg-blue-500', 'bg-emerald-500', 'bg-amber-400', 'bg-purple-500'][i % 4]]) as any} /><NcrSummary runtime={runtime} /></aside></div>
    <div className="grid gap-4 xl:grid-cols-2"><Trend rows={rows} /><ByProject rows={runtime.byProject} /></div>
    <ProductionQueue rows={queue.slice(0, 8)} onOpen={onQueue} onCreate={onCreate} />
  </div>
}

function KpiStrip({ runtime }: { runtime: QcCockpit }) {
  const m = runtime.metrics
  return <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6"><Kpi icon={ClipboardCheck} title="Tổng phiếu kiểm tra" value={fmt(m.total)} note="Trong hệ thống" /><Kpi icon={CheckCircle2} title="Đạt" value={fmt(m.passed)} note={`${fmt(m.passRate)}%`} tone="emerald" /><Kpi icon={XCircle} title="Không đạt" value={fmt(m.failed + m.rework)} note="Rework/Failed" tone="red" /><Kpi icon={CalendarClock} title="Chờ xử lý" value={fmt(runtime.inspections.filter((i) => ['READY', 'DRAFT'].includes(i.status)).length)} note="Phiếu" tone="amber" /><Kpi icon={FileBarChart} title="NCR mở" value={fmt(m.openNcrs)} note="Trong tổng số" tone="purple" /><Kpi icon={ShieldCheck} title="MO chờ QC" value={fmt(runtime.productionQueue.filter((q) => q.qcStatus !== 'APPROVED').length)} note="Chặn xuất bãi" tone="cyan" /></div>
}

function Inspections({ rows, queue, onOpen, onQueue, onCreate, onPass, onFail }: { rows: QcInspectionRow[]; queue: QcProductionQueueRow[]; onOpen: (row: QcInspectionRow) => void; onQueue: (row: QcProductionQueueRow) => void; onCreate: (row: QcProductionQueueRow) => void; onPass: (row: QcInspectionRow) => void; onFail: (row: QcInspectionRow) => void }) {
  return <div className="mt-3 grid gap-4 xl:grid-cols-[1fr_360px]"><InspectionTable rows={rows} onOpen={onOpen} onPass={onPass} onFail={onFail} /><aside className="space-y-4"><ProductionQueue rows={queue} onOpen={onQueue} onCreate={onCreate} compact /></aside></div>
}

function InspectionTable({ rows, onOpen, onPass, onFail }: { rows: QcInspectionRow[]; onOpen: (row: QcInspectionRow) => void; onPass?: (row: QcInspectionRow) => void; onFail?: (row: QcInspectionRow) => void }) {
  return <div className={`${panel} overflow-hidden`}><div className="flex justify-between border-b border-slate-800 px-4 py-3"><h2 className="text-sm font-semibold">Danh sách phiếu kiểm tra</h2><span className="text-xs text-slate-500">{rows.length} phiếu</span></div><div className="overflow-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-slate-900/70 text-[10px] uppercase text-slate-500"><tr>{['Mã phiếu', 'Ngày kiểm tra', 'Dự án', 'Cấu kiện', 'MO', 'Loại kiểm tra', 'Kết quả', 'Trạng thái', 'Thao tác'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} onClick={() => onOpen(row)} className="cursor-pointer border-t border-slate-800 text-slate-200 hover:bg-cyan-950/20"><td className="px-4 py-3 text-cyan-300">{row.inspectionNo}</td><td className="px-4 py-3">{date(row.date)}</td><td className="px-4 py-3">{row.projectName}</td><td className="px-4 py-3">{row.componentCode}</td><td className="px-4 py-3">{row.productionOrderNo}</td><td className="px-4 py-3">{row.category}</td><td className="px-4 py-3"><ResultBadge value={row.result} /></td><td className="px-4 py-3"><StatusBadge value={row.status} /></td><td className="px-4 py-3"><div className="flex gap-1"><button onClick={(e) => { e.stopPropagation(); onPass?.(row) }} className="rounded border border-emerald-700 px-2 py-1 text-[10px] text-emerald-300">Đạt</button><button onClick={(e) => { e.stopPropagation(); onFail?.(row) }} className="rounded border border-red-700 px-2 py-1 text-[10px] text-red-300">NCR</button></div></td></tr>)}</tbody></table></div>{!rows.length ? <Empty title="Chưa có phiếu kiểm tra." /> : null}</div>
}

function ProductionQueue({ rows, onOpen, onCreate, compact = false }: { rows: QcProductionQueueRow[]; onOpen: (row: QcProductionQueueRow) => void; onCreate: (row: QcProductionQueueRow) => void; compact?: boolean }) {
  return <div className={`${panel} overflow-hidden`}><div className="border-b border-slate-800 px-4 py-3"><h2 className="text-sm font-semibold">MO hoàn thành chờ QC</h2></div><div className={`${compact ? 'max-h-[520px]' : 'max-h-80'} overflow-auto`}>{rows.map((row) => <div key={row.id} onClick={() => onOpen(row)} className="grid cursor-pointer grid-cols-[1fr_auto] gap-3 border-b border-slate-800 px-4 py-3 text-xs hover:bg-cyan-950/20"><span><b className="text-cyan-300">{row.orderNo}</b><span className="mt-1 block text-slate-300">{row.componentCode} · {row.componentName}</span><span className="mt-1 block text-slate-500">{row.title}</span></span><span className="space-y-2 text-right"><StatusBadge value={row.qcStatus === 'APPROVED' ? 'APPROVED' : row.qcStatus === 'REWORK_REQUIRED' ? 'REWORK_REQUIRED' : 'READY'} />{row.qcStatus !== 'APPROVED' ? <button onClick={(e) => { e.stopPropagation(); onCreate(row) }} className="block rounded bg-blue-600 px-3 py-1 text-[10px] text-white">Tạo QC</button> : null}</span></div>)}{!rows.length ? <Empty title="Chưa có MO hoàn thành chờ QC." /> : null}</div></div>
}

function Plan({ queue, onCreate }: { queue: QcProductionQueueRow[]; onCreate: (row: QcProductionQueueRow) => void }) {
  return <div className="mt-3"><ProductionQueue rows={queue} onOpen={() => undefined} onCreate={onCreate} /></div>
}

function Standards({ runtime }: { runtime: QcCockpit }) {
  return <div className="mt-3 grid gap-4 xl:grid-cols-2">{runtime.checklists.map((item) => <div key={item.id} className={`${panel} p-4`}><div className="flex justify-between"><h3 className="text-sm font-semibold text-cyan-300">{item.code} · {item.name}</h3><span className="rounded bg-slate-900 px-2 py-1 text-[10px]">{item.type}</span></div><p className="mt-2 text-xs text-slate-500">Revision {item.revision} · {item.items.length} tiêu chí · {item.isActive ? 'Đang dùng' : 'Ngưng dùng'}</p></div>)}{!runtime.checklists.length ? <Empty title="Chưa có bộ tiêu chuẩn QC." /> : null}</div>
}

function Ncr({ runtime }: { runtime: QcCockpit }) {
  return <div className="mt-3 grid gap-4 xl:grid-cols-[1fr_360px]"><div className={`${panel} overflow-hidden`}><div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold">Không phù hợp (NCR)</div><table className="w-full min-w-[860px] text-left text-sm"><thead className="bg-slate-900/70 text-[10px] uppercase text-slate-500"><tr>{['NCR', 'Tiêu đề', 'Mức độ', 'Trạng thái', 'Cập nhật'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{runtime.ncrs.map((row) => <tr key={row.id} className="border-t border-slate-800"><td className="px-4 py-3 text-cyan-300">{row.ncrNo}</td><td className="px-4 py-3">{row.title}</td><td className="px-4 py-3">{row.severity}</td><td className="px-4 py-3">{row.status}</td><td className="px-4 py-3">{date(row.updatedAt)}</td></tr>)}</tbody></table>{!runtime.ncrs.length ? <Empty title="Chưa có NCR." /> : null}</div><NcrSummary runtime={runtime} /></div>
}

function Calibration() {
  return <div className="mt-3 grid gap-4 xl:grid-cols-3">{['Máy đo kích thước', 'Máy siêu âm UT', 'Máy đo sơn phủ', 'Cân tải trọng', 'Thước đo laser', 'Thiết bị đo độ thẳng'].map((name, index) => <div key={name} className={`${panel} p-4`}><Gauge className="text-cyan-300" size={22} /><h3 className="mt-3 text-sm font-semibold">{name}</h3><p className="mt-2 text-xs text-slate-500">Trạng thái hiệu chuẩn: {index % 4 === 0 ? 'Sắp hết hạn' : 'Còn hiệu lực'}</p><Progress value={index % 4 === 0 ? 78 : 42} /></div>)}</div>
}

function Reports({ runtime }: { runtime: QcCockpit }) {
  return <div className="mt-3 space-y-4"><KpiStrip runtime={runtime} /><div className="grid gap-4 xl:grid-cols-3"><Trend rows={runtime.inspections} /><ByProject rows={runtime.byProject} /><Donut title="Cơ cấu lỗi theo mức độ" center={fmt(runtime.metrics.openIssues)} rows={runtime.metrics.defects.map((d, i) => [d.severity, d._count, ['bg-red-500', 'bg-amber-400', 'bg-blue-500'][i % 3]]) as any} /></div></div>
}

function Latest({ rows, onOpen }: { rows: QcInspectionRow[]; onOpen: (row: QcInspectionRow) => void }) {
  const latest = rows[0]
  return <div className={`${panel} p-4`}><div className="flex justify-between"><h3 className="text-sm font-semibold">Phiếu kiểm tra mới nhất</h3><button className="text-xs text-cyan-300">Xem tất cả</button></div>{latest ? <button onClick={() => onOpen(latest)} className="mt-3 w-full rounded border border-slate-800 p-3 text-left text-xs hover:border-cyan-600"><div className="flex justify-between"><b className="text-cyan-300">{latest.inspectionNo}</b><StatusBadge value={latest.status} /></div><div className="mt-3 grid grid-cols-2 gap-2 text-slate-400"><span>Dự án</span><span className="text-right text-slate-200">{latest.projectName}</span><span>Cấu kiện</span><span className="text-right text-slate-200">{latest.componentCode}</span><span>Kết quả</span><span className="text-right"><ResultBadge value={latest.result} /></span><span>Tỷ lệ đạt</span><span className="text-right text-emerald-300">{fmt(latest.passRate)}%</span></div></button> : <Empty title="Chưa có phiếu kiểm tra." />}</div>
}

function NcrSummary({ runtime }: { runtime: QcCockpit }) {
  return <div className={`${panel} p-4`}><h3 className="text-sm font-semibold">NCR (Không phù hợp)</h3><div className="mt-3 space-y-2 text-xs"><Info k="NCR mở" v={fmt(runtime.metrics.openNcrs)} /><Info k="Issue mở" v={fmt(runtime.metrics.openIssues)} /><Info k="Không đạt/Rework" v={fmt(runtime.metrics.failed + runtime.metrics.rework)} /></div><div className="mt-4 rounded bg-red-950/30 p-4 text-center text-red-300"><AlertTriangle className="mx-auto" /></div></div>
}

function Trend({ rows }: { rows: QcInspectionRow[] }) {
  const pass = rows.filter((r) => r.result === 'PASS').length
  const fail = rows.filter((r) => r.result === 'FAIL').length
  return <div className={`${panel} p-4`}><h3 className="text-sm font-semibold">Xu hướng kết quả QC</h3><div className="mt-4 grid h-48 grid-cols-6 items-end gap-3 border-b border-l border-slate-800 px-3 pb-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="flex flex-col items-center gap-2"><div className="w-6 rounded-t bg-emerald-500" style={{ height: `${Math.max(8, pass * 8 + i * 5)}px` }} /><div className="w-6 rounded-t bg-red-500" style={{ height: `${Math.max(6, fail * 8 + i * 2)}px` }} /><span className="text-[10px] text-slate-500">0{i + 1}/06</span></div>)}</div></div>
}

function ByProject({ rows }: { rows: QcCockpit['byProject'] }) {
  return <div className={`${panel} p-4`}><h3 className="text-sm font-semibold">Thống kê theo dự án</h3><div className="mt-4 space-y-3">{rows.slice(0, 7).map((row) => <div key={row.projectName} className="grid grid-cols-[130px_1fr_70px] items-center gap-3 text-xs"><span className="truncate">{row.projectName}</span><Progress value={row.passRate} /><span className="text-right text-slate-400">{row.passed}/{row.total}</span></div>)}{!rows.length ? <p className="text-xs text-slate-500">Chưa có dữ liệu dự án.</p> : null}</div></div>
}

function Kpi({ icon: Icon, title, value, note, tone = 'cyan' }: { icon: LucideIcon; title: string; value: string; note: string; tone?: 'cyan' | 'emerald' | 'red' | 'amber' | 'purple' }) {
  const color = tone === 'emerald' ? 'text-emerald-300 bg-emerald-950' : tone === 'red' ? 'text-red-300 bg-red-950' : tone === 'amber' ? 'text-amber-300 bg-amber-950' : tone === 'purple' ? 'text-purple-300 bg-purple-950' : 'text-cyan-300 bg-cyan-950'
  return <div className={`${panel} p-4`}><span className={`inline-flex rounded p-3 ${color}`}><Icon size={20} /></span><div className="mt-3 text-[10px] uppercase text-slate-500">{title}</div><div className="mt-2 text-2xl font-semibold text-white">{value}</div><div className="mt-1 text-xs text-slate-500">{note}</div></div>
}

function Donut({ title, center, rows }: { title: string; center: string; rows: Array<[string, number, string]> }) {
  return <div className={`${panel} p-4`}><h3 className="text-sm font-semibold">{title}</h3><div className="mt-4 grid grid-cols-[120px_1fr] items-center gap-4"><div className="flex aspect-square items-center justify-center rounded-full border-[18px] border-blue-600 bg-slate-950 text-center"><div><div className="text-xl font-semibold">{center}</div><div className="text-xs text-slate-500">Tổng</div></div></div><div className="space-y-2">{rows.map(([label, value, color]) => <div key={label} className="flex justify-between gap-2 text-xs"><span className="flex items-center gap-2"><i className={`h-2 w-2 rounded-full ${color}`} />{label}</span><b>{fmt(value)}</b></div>)}</div></div></div>
}

function InspectionDetail({ inspection, onClose, onStart, onPass, onFail }: { inspection: QcInspectionRow | null; onClose: () => void; onStart: (id: string) => void; onPass: (id: string) => void; onFail: (id: string) => void }) {
  if (!inspection) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><section className="w-full max-w-4xl rounded border border-cyan-900 bg-[#061321] p-5"><div className="flex justify-between"><div><p className="text-xs text-cyan-300">{inspection.inspectionNo}</p><h2 className="mt-1 text-xl font-semibold">{inspection.componentCode} · {inspection.componentName}</h2></div><button onClick={onClose}><XCircle /></button></div><div className="mt-5 grid gap-3 md:grid-cols-2"><Info k="Dự án" v={inspection.projectName} /><Info k="MO" v={inspection.productionOrderNo} /><Info k="Loại kiểm tra" v={inspection.category} /><Info k="Checklist" v={inspection.checklistName} /><Info k="Kết quả" v={inspection.result} /><Info k="Trạng thái" v={inspection.status} /></div><div className="mt-5 flex justify-end gap-2"><button onClick={() => onStart(inspection.id)} className="rounded border border-slate-700 px-4 py-2 text-xs">Bắt đầu</button><button onClick={() => onFail(inspection.id)} className="rounded bg-red-600 px-4 py-2 text-xs">Không đạt / NCR</button><button onClick={() => onPass(inspection.id)} className="rounded bg-emerald-600 px-4 py-2 text-xs">Chấm đạt & duyệt</button></div></section></div>
}

function QueueDetail({ row, onClose, onCreate }: { row: QcProductionQueueRow | null; onClose: () => void; onCreate: (row: QcProductionQueueRow) => void }) {
  if (!row) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><section className="w-full max-w-3xl rounded border border-cyan-900 bg-[#061321] p-5"><div className="flex justify-between"><div><p className="text-xs text-cyan-300">{row.orderNo}</p><h2 className="mt-1 text-xl font-semibold">{row.componentCode} · {row.componentName}</h2></div><button onClick={onClose}><XCircle /></button></div><div className="mt-5 space-y-2 text-sm"><Info k="Lệnh sản xuất" v={row.title} /><Info k="Trạng thái sản xuất" v={row.status} /><Info k="Trạng thái QC" v={row.qcStatus} /><Info k="Số phiếu QC" v={fmt(row.inspectionCount)} /></div><div className="mt-5 flex justify-end"><button onClick={() => onCreate(row)} className="rounded bg-blue-600 px-4 py-2 text-xs">Tạo phiếu QC</button></div></section></div>
}

function StatusBadge({ value }: { value: string }) {
  const tone = ['APPROVED', 'PASSED'].includes(value) ? 'bg-emerald-950 text-emerald-300' : ['FAILED', 'REWORK_REQUIRED', 'REJECTED'].includes(value) ? 'bg-red-950 text-red-300' : value === 'IN_PROGRESS' ? 'bg-blue-950 text-blue-300' : 'bg-amber-950 text-amber-300'
  return <span className={`rounded px-2 py-1 text-[10px] ${tone}`}>{value}</span>
}

function ResultBadge({ value }: { value: string }) {
  const tone = value === 'PASS' ? 'text-emerald-300' : value === 'FAIL' ? 'text-red-300' : 'text-amber-300'
  return <span className={tone}>{value}</span>
}

function Progress({ value }: { value: number }) {
  return <span className="block h-2 rounded bg-slate-800"><i className="block h-full rounded bg-emerald-500" style={{ width: `${Math.max(4, Math.min(100, value))}%` }} /></span>
}

function Info({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-4 rounded border border-slate-800 px-3 py-2 text-xs"><span className="text-slate-500">{k}</span><span className="text-right text-slate-200">{v}</span></div>
}

function Empty({ title }: { title: string }) {
  return <div className="p-8 text-center text-sm text-slate-500">{title}</div>
}

function emptyRuntime(): QcCockpit {
  return { metrics: { total: 0, inProgress: 0, passed: 0, failed: 0, rework: 0, openIssues: 0, openNcrs: 0, passRate: 0, defects: [] }, inspections: [], productionQueue: [], checklists: [], ncrs: [], byCategory: [], byProject: [] }
}
