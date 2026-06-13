import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BarChart3, Building2, CalendarClock, CheckCircle2, Clock, FileBarChart, Layers, MapPin, PackageOpen, Search, TrendingUp, X, type LucideIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

import { OperationalShell } from '@/shared/layouts/OperationalShell'
import { createProject, deliverProjectComponent, getProjectsRuntime, installProjectComponent, type InstallProjectComponentPayload, type ProjectComponentRuntime, type ProjectComponentStatus, type ProjectMaterialRuntime, type ProjectRuntimeRow, type ProjectsRuntime, type ProjectStatus } from '../api/projects.api'

type ProjectTab = 'overview' | 'list' | 'progress' | 'materials' | 'components' | 'reports'

const panel = 'rounded-lg border border-white/10 bg-slate-950/55 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl'
const input = 'h-9 rounded-lg border border-white/10 bg-slate-950/65 px-3 text-xs text-slate-100 outline-none transition focus:border-blue-400'
const primaryButton = 'rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500'
const mutedButton = 'rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-200 hover:bg-white/[0.08]'
const tableHead = 'bg-white/[0.04] text-[10px] uppercase tracking-[0.12em] text-slate-400'
const tableRow = 'border-t border-white/10 text-slate-200 transition hover:bg-cyan-400/10'
const fmt = (value = 0) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value)
const money = (value = 0) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value / 1_000_000_000)
const date = (value?: string | null) => value ? new Date(value).toLocaleDateString('vi-VN') : '-'

const tabs: Array<[ProjectTab, string]> = [
  ['overview', 'Tổng quan'],
  ['list', 'Danh sách công trình'],
  ['progress', 'Tiến độ công trình'],
  ['materials', 'Vật tư theo công trình'],
  ['components', 'Cấu kiện công trình'],
  ['reports', 'Báo cáo công trình'],
]

export function ProjectsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [tab, setTab] = useState<ProjectTab>('overview')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [selectedProject, setSelectedProject] = useState<ProjectRuntimeRow | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [installTarget, setInstallTarget] = useState<ProjectComponentRuntime | null>(null)
  const { data, isLoading } = useQuery({
    queryKey: ['projects-runtime'],
    queryFn: getProjectsRuntime,
    refetchInterval: 5000,
  })
  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: async () => {
      setCreateOpen(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['projects-runtime'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory-projects'] }),
      ])
    },
  })
  const deliverMutation = useMutation({
    mutationFn: deliverProjectComponent,
    onSuccess: async () => {
      toast.success('Đã xác nhận nhận hàng')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['projects-runtime'] }),
        queryClient.invalidateQueries({ queryKey: ['components'] }),
      ])
    },
    onError: () => {
      toast.error('Không thể xác nhận nhận hàng')
    },
  })
  const installMutation = useMutation({
    mutationFn: installProjectComponent,
    onSuccess: async () => {
      setInstallTarget(null)
      toast.success('Đã xác nhận lắp đặt')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['projects-runtime'] }),
        queryClient.invalidateQueries({ queryKey: ['components'] }),
      ])
    },
    onError: () => {
      toast.error('Không thể xác nhận lắp đặt')
    },
  })
  const pendingComponentId = deliverMutation.isPending
    ? deliverMutation.variables ?? null
    : installMutation.isPending
      ? installMutation.variables?.id ?? null
      : null
  const runtime = data ?? emptyRuntime()
  const rows = useMemo(() => runtime.projects.filter((project) => {
    if (status !== 'all' && project.status !== status) return false
    if (type !== 'all' && project.type !== type) return false
    return `${project.code} ${project.name} ${project.owner} ${project.location}`.toLowerCase().includes(query.toLowerCase())
  }), [query, runtime.projects, status, type])
  const projectTypes = Array.from(new Set(runtime.projects.map((project) => project.type)))

  return <OperationalShell>
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_30%),linear-gradient(135deg,#07111f_0%,#0f172a_46%,#111827_100%)] p-4 text-slate-100">
      <header className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400">Công trình</p>
          <h1 className="mt-1 text-2xl font-semibold">Công trình</h1>
          <p className="mt-1 text-xs text-slate-500">Project cockpit liên kết Project, Component, Production và Inventory theo projectId.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCreateOpen(true)} className={primaryButton}>+ Thêm công trình</button>
          <button className={mutedButton}>Xuất Excel</button>
          <button className={mutedButton}>Báo cáo</button>
        </div>
      </header>

      <nav className={`${panel} mb-3 flex gap-1 overflow-x-auto p-1`}>
        {tabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs transition ${tab === id ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/30' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'}`}>{label}</button>)}
      </nav>

      <FilterBar query={query} status={status} type={type} projectTypes={projectTypes} onQuery={setQuery} onStatus={setStatus} onType={setType} />
      {isLoading ? <div className={`${panel} mt-3 p-6 text-center text-sm text-slate-500`}>Đang tải dữ liệu công trình...</div> : null}

      {tab === 'overview' && <OverviewTab runtime={runtime} rows={rows} onOpen={setSelectedProject} />}
      {tab === 'list' && <ProjectListTab rows={rows} onOpen={setSelectedProject} />}
      {tab === 'progress' && <ProgressTab runtime={runtime} rows={rows} onOpen={setSelectedProject} />}
      {tab === 'materials' && <MaterialsTab rows={filterMaterials(runtime.materials, rows)} projects={runtime.projects} />}
      {tab === 'components' && <ProjectComponentsTab rows={filterComponents(runtime.components, rows)} projects={runtime.projects} pendingId={pendingComponentId} onDeliver={(component) => deliverMutation.mutate(component.id)} onInstall={setInstallTarget} onOpen={(component) => navigate('/components/list', { state: { componentId: component.id } })} />}
      {tab === 'reports' && <ReportsTab runtime={runtime} />}

      <ProjectDetailDialog project={selectedProject} materials={runtime.materials.filter((row) => row.projectId === selectedProject?.id)} onClose={() => setSelectedProject(null)} />
      <CreateProjectDialog open={createOpen} saving={createMutation.isPending} error={createMutation.error} onClose={() => setCreateOpen(false)} onSubmit={(payload) => createMutation.mutate(payload)} />
      <InstallComponentDialog key={installTarget?.id ?? 'install-empty'} component={installTarget} saving={installMutation.isPending} onClose={() => setInstallTarget(null)} onSubmit={(payload) => installTarget ? installMutation.mutate({ id: installTarget.id, payload }) : undefined} />
    </main>
  </OperationalShell>
}

function CreateProjectDialog({ open, saving, error, onClose, onSubmit }: { open: boolean; saving: boolean; error: unknown; onClose: () => void; onSubmit: (payload: { code: string; name: string; description?: string; status?: ProjectStatus }) => void }) {
  const [code, setCode] = useState(`CT-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`)
  const [name, setName] = useState('')
  const [owner, setOwner] = useState('')
  const [location, setLocation] = useState('')
  const [type, setType] = useState('Nhà xưởng')
  const [status, setStatus] = useState<ProjectStatus>('PLANNING')
  const [note, setNote] = useState('')

  if (!open) return null

  const submit = () => {
    if (!code.trim() || !name.trim()) return
    onSubmit({
      code: code.trim(),
      name: name.trim(),
      status,
      description: [
        owner.trim() ? `Chủ đầu tư: ${owner.trim()}` : '',
        location.trim() ? `Địa điểm: ${location.trim()}` : '',
        type.trim() ? `Loại: ${type.trim()}` : '',
        note.trim(),
      ].filter(Boolean).join('; '),
    })
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
    <section className="w-full max-w-3xl overflow-hidden rounded-xl border border-cyan-900 bg-[#061321] text-slate-100 shadow-2xl">
      <header className="flex items-start justify-between border-b border-slate-800 px-5 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400">Công trình</p>
          <h2 className="mt-1 text-xl font-semibold">Thêm công trình</h2>
          <p className="mt-1 text-xs text-slate-500">Công trình mới sẽ liên kết được với vật tư, cấu kiện, sản xuất và QC qua projectId.</p>
        </div>
        <button onClick={onClose} className="rounded border border-slate-700 p-2 text-slate-300"><X size={16} /></button>
      </header>
      <div className="grid gap-3 p-5 md:grid-cols-2">
        <label className="text-xs text-slate-400">Mã công trình<input value={code} onChange={(event) => setCode(event.target.value)} className={`${input} mt-2 w-full`} /></label>
        <label className="text-xs text-slate-400">Tên công trình<input value={name} onChange={(event) => setName(event.target.value)} className={`${input} mt-2 w-full`} placeholder="Nhà máy kết cấu thép..." /></label>
        <label className="text-xs text-slate-400">Chủ đầu tư<input value={owner} onChange={(event) => setOwner(event.target.value)} className={`${input} mt-2 w-full`} placeholder="Công ty / khách hàng" /></label>
        <label className="text-xs text-slate-400">Địa điểm<input value={location} onChange={(event) => setLocation(event.target.value)} className={`${input} mt-2 w-full`} placeholder="KCN, tỉnh/thành..." /></label>
        <label className="text-xs text-slate-400">Loại công trình<select value={type} onChange={(event) => setType(event.target.value)} className={`${input} mt-2 w-full`}>
          {['Nhà xưởng', 'Kho bãi', 'Tòa nhà', 'Hạ tầng', 'Văn phòng'].map((item) => <option key={item} value={item}>{item}</option>)}
        </select></label>
        <label className="text-xs text-slate-400">Trạng thái<select value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus)} className={`${input} mt-2 w-full`}>
          <option value="PLANNING">Chưa khởi công</option>
          <option value="ACTIVE">Đang thi công</option>
          <option value="ON_HOLD">Tạm dừng</option>
          <option value="COMPLETED">Hoàn thành</option>
        </select></label>
        <label className="text-xs text-slate-400 md:col-span-2">Ghi chú<textarea value={note} onChange={(event) => setNote(event.target.value)} className={`${input} mt-2 min-h-24 w-full py-2`} placeholder="Thông tin hợp đồng, phạm vi, yêu cầu riêng..." /></label>
        {error ? <p className="rounded border border-red-800 bg-red-950/30 px-3 py-2 text-xs text-red-200 md:col-span-2">Không thể tạo công trình. Vui lòng kiểm tra mã trùng hoặc dữ liệu nhập.</p> : null}
      </div>
      <footer className="flex justify-end gap-2 border-t border-slate-800 px-5 py-4">
        <button onClick={onClose} className="rounded border border-slate-700 px-4 py-2 text-xs text-slate-300">Hủy</button>
        <button disabled={saving || !code.trim() || !name.trim()} onClick={submit} className="rounded bg-blue-600 px-5 py-2 text-xs font-semibold text-white disabled:opacity-50">{saving ? 'Đang tạo...' : 'Tạo công trình'}</button>
      </footer>
    </section>
  </div>
}

function InstallComponentDialog({ component, saving, onClose, onSubmit }: { component: ProjectComponentRuntime | null; saving: boolean; onClose: () => void; onSubmit: (payload: InstallProjectComponentPayload) => void }) {
  const [form, setForm] = useState<InstallProjectComponentPayload>({
    installZone: '',
    installAxis: '',
    installLevel: '',
    installPosition: '',
  })

  if (!component) return null

  const canSubmit = Object.values(form).every((value) => value.trim())
  const update = (key: keyof InstallProjectComponentPayload, value: string) => setForm((current) => ({ ...current, [key]: value }))

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
    <section className="w-full max-w-2xl overflow-hidden rounded-xl border border-cyan-900 bg-[#061321] text-slate-100 shadow-2xl">
      <header className="flex items-start justify-between border-b border-slate-800 px-5 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400">Lắp đặt cấu kiện</p>
          <h2 className="mt-1 text-xl font-semibold">{component.code}</h2>
          <p className="mt-1 text-xs text-slate-500">{component.name} · {component.projectCode} · {component.projectName}</p>
        </div>
        <button onClick={onClose} className="rounded border border-slate-700 p-2 text-slate-300"><X size={16} /></button>
      </header>
      <div className="grid gap-3 p-5 md:grid-cols-2">
        <label className="text-xs text-slate-400">Khu vực<input value={form.installZone} onChange={(event) => update('installZone', event.target.value)} className={`${input} mt-2 w-full`} placeholder="Zone A" /></label>
        <label className="text-xs text-slate-400">Trục<input value={form.installAxis} onChange={(event) => update('installAxis', event.target.value)} className={`${input} mt-2 w-full`} placeholder="A-01" /></label>
        <label className="text-xs text-slate-400">Tầng<input value={form.installLevel} onChange={(event) => update('installLevel', event.target.value)} className={`${input} mt-2 w-full`} placeholder="L2" /></label>
        <label className="text-xs text-slate-400">Vị trí<input value={form.installPosition} onChange={(event) => update('installPosition', event.target.value)} className={`${input} mt-2 w-full`} placeholder="Grid A1-B1" /></label>
      </div>
      <footer className="flex justify-end gap-2 border-t border-slate-800 px-5 py-4">
        <button onClick={onClose} className="rounded border border-slate-700 px-4 py-2 text-xs text-slate-300">Hủy</button>
        <button disabled={!canSubmit || saving} onClick={() => onSubmit(form)} className="rounded bg-emerald-600 px-5 py-2 text-xs font-semibold text-white disabled:opacity-50">{saving ? 'Đang xác nhận...' : 'Xác nhận lắp đặt'}</button>
      </footer>
    </section>
  </div>
}

function FilterBar({ query, status, type, projectTypes, onQuery, onStatus, onType }: { query: string; status: string; type: string; projectTypes: string[]; onQuery: (value: string) => void; onStatus: (value: string) => void; onType: (value: string) => void }) {
  return <div className={`${panel} flex flex-wrap items-end gap-2 p-3`}>
    <div className="flex min-w-[320px] flex-1 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/65 px-3">
      <Search size={15} className="text-cyan-400" />
      <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Tìm kiếm công trình, chủ đầu tư, địa điểm..." className="h-9 w-full bg-transparent text-xs text-slate-100 outline-none" />
    </div>
    <select value={status} onChange={(event) => onStatus(event.target.value)} className={input}>
      <option value="all">Trạng thái: Tất cả</option>
      <option value="ACTIVE">Đang thi công</option>
      <option value="PLANNING">Chưa khởi công</option>
      <option value="COMPLETED">Hoàn thành</option>
      <option value="ON_HOLD">Tạm dừng</option>
    </select>
    <select value={type} onChange={(event) => onType(event.target.value)} className={input}>
      <option value="all">Loại công trình: Tất cả</option>
      {projectTypes.map((item) => <option key={item} value={item}>{item}</option>)}
    </select>
    <button className={mutedButton}>Làm mới</button>
  </div>
}

function OverviewTab({ runtime, rows, onOpen }: { runtime: ProjectsRuntime; rows: ProjectRuntimeRow[]; onOpen: (row: ProjectRuntimeRow) => void }) {
  const metrics = runtime.metrics
  return <div className="mt-3 space-y-4">
    <KpiStrip runtime={runtime} />
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <ProjectTable rows={rows.slice(0, 10)} onOpen={onOpen} />
      <aside className="space-y-4">
        <DonutPanel title="Tỷ lệ tiến độ theo trạng thái" center={`${metrics.totalProjects}`} note="Tổng" rows={[
          ['Đang thi công', metrics.activeProjects, 'bg-blue-500'],
          ['Chưa khởi công', metrics.planningProjects, 'bg-amber-400'],
          ['Hoàn thành', metrics.completedProjects, 'bg-emerald-500'],
        ]} />
        <DonutPanel title="Giá trị hợp đồng" center={money(metrics.contractValue)} note="Tỷ VNĐ" rows={runtime.reports.byType.map((row, index) => [row.type, row.value, ['bg-blue-500', 'bg-emerald-500', 'bg-amber-400', 'bg-purple-500'][index % 4]]) as any} />
        <TopProjects rows={runtime.reports.topByContract} />
      </aside>
    </div>
    <div className="grid gap-4 xl:grid-cols-3">
      <BarPanel title="Tiến độ trung bình theo công trình" rows={runtime.projects.map((row) => [row.code, row.progress])} suffix="%" />
      <BarPanel title="Giá trị thực hiện theo công trình" rows={runtime.projects.map((row) => [row.code, row.actualValue / 1_000_000_000])} suffix=" tỷ" />
      <RegionPanel rows={runtime.projects} />
    </div>
  </div>
}

function KpiStrip({ runtime }: { runtime: ProjectsRuntime }) {
  const m = runtime.metrics
  return <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
    <KpiCard icon={Building2} title="Tổng số công trình" value={fmt(m.totalProjects)} note="Công trình" tone="cyan" />
    <KpiCard icon={CheckCircle2} title="Công trình đang thi công" value={fmt(m.activeProjects)} note="Công trình" tone="emerald" />
    <KpiCard icon={Clock} title="Công trình chưa khởi công" value={fmt(m.planningProjects)} note="Công trình" tone="amber" />
    <KpiCard icon={Layers} title="Công trình hoàn thành" value={fmt(m.completedProjects)} note="Công trình" tone="purple" />
    <KpiCard icon={TrendingUp} title="Giá trị hợp đồng" value={money(m.contractValue)} note="Tỷ VNĐ" tone="cyan" />
    <KpiCard icon={BarChart3} title="Giá trị đã thực hiện" value={money(m.actualValue)} note="Tỷ VNĐ" tone="cyan" />
  </div>
}

function ProjectListTab({ rows, onOpen }: { rows: ProjectRuntimeRow[]; onOpen: (row: ProjectRuntimeRow) => void }) {
  return <div className="mt-3"><ProjectTable rows={rows} onOpen={onOpen} /></div>
}

function ProjectTable({ rows, onOpen }: { rows: ProjectRuntimeRow[]; onOpen: (row: ProjectRuntimeRow) => void }) {
  return <div className={`${panel} overflow-hidden`}>
    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><h2 className="text-sm font-semibold">Danh sách công trình</h2><span className="text-xs text-slate-500">Hiển thị {rows.length} kết quả</span></div>
    <div className="overflow-auto">
      <table className="w-full min-w-[1120px] text-left text-sm">
        <thead className={tableHead}><tr>{['Mã công trình', 'Tên công trình', 'Chủ đầu tư', 'Địa điểm', 'Loại', 'Giá trị HĐ', 'Tiến độ', 'Trạng thái', 'Ngày khởi công', 'Ngày hoàn thành'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id} onClick={() => onOpen(row)} className={`cursor-pointer ${tableRow}`}>
          <td className="px-4 py-3 font-semibold text-cyan-300">{row.code}</td><td className="px-4 py-3">{row.name}</td><td className="px-4 py-3">{row.owner}</td><td className="px-4 py-3">{row.location}</td><td className="px-4 py-3">{row.type}</td><td className="px-4 py-3">{money(row.contractValue)}</td><td className="px-4 py-3"><Progress value={row.progress} /></td><td className="px-4 py-3"><StatusBadge status={row.status} /></td><td className="px-4 py-3">{date(row.startedAt)}</td><td className="px-4 py-3">{date(row.plannedEndAt)}</td>
        </tr>)}</tbody>
      </table>
    </div>
    {!rows.length ? <Empty title="Không có công trình phù hợp bộ lọc." /> : null}
  </div>
}

function ProgressTab({ runtime, rows, onOpen }: { runtime: ProjectsRuntime; rows: ProjectRuntimeRow[]; onOpen: (row: ProjectRuntimeRow) => void }) {
  const avg = runtime.metrics.averageProgress
  return <div className="mt-3 space-y-4">
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <KpiCard icon={PackageOpen} title="Tổng tiến độ" value={`${fmt(avg)}%`} note="Hoàn thành" />
      <KpiCard icon={CheckCircle2} title="Khối lượng hoàn thành" value={fmt(rows.reduce((s, r) => s + r.delivered, 0))} note="Cấu kiện" tone="emerald" />
      <KpiCard icon={CalendarClock} title="Đúng tiến độ" value={fmt(rows.filter((r) => r.delayedOrders === 0).length)} note="Công trình" tone="purple" />
      <KpiCard icon={Clock} title="Chậm tiến độ" value={fmt(rows.filter((r) => r.delayedOrders > 0).length)} note="Công trình" tone="amber" />
      <KpiCard icon={BarChart3} title="Giá trị thực hiện" value={money(runtime.metrics.actualValue)} note="Tỷ VNĐ" />
      <KpiCard icon={TrendingUp} title="Tỷ lệ giá trị" value={`${fmt(runtime.metrics.contractValue ? runtime.metrics.actualValue / runtime.metrics.contractValue * 100 : 0)}%`} note="Actual / Contract" tone="emerald" />
    </div>
    <div className="grid gap-4 xl:grid-cols-[1fr_1.15fr_360px]">
      <div className={`${panel} overflow-hidden`}><div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold">Danh sách hạng mục</div><ProjectTable rows={rows.slice(0, 8)} onOpen={onOpen} /></div>
      <GanttPanel rows={rows} />
      <aside className="space-y-4">
        <DonutPanel title="Cơ cấu tiến độ theo trạng thái" center={`${fmt(runtime.metrics.averageProgress)}%`} note="Tổng tiến độ" rows={runtime.reports.byStatus.map((row, index) => [row.status, row.count, ['bg-blue-500', 'bg-amber-400', 'bg-emerald-500'][index % 3]]) as any} />
        <div className={`${panel} p-4`}><h3 className="text-sm font-semibold">Top công trình chậm tiến độ</h3><div className="mt-3 space-y-2">{rows.filter((r) => r.delayedOrders > 0).slice(0, 5).map((row) => <div key={row.id} className="flex justify-between rounded border border-slate-800 px-3 py-2 text-xs"><span className="text-slate-300">{row.name}</span><b className="text-red-300">{row.delayedOrders}</b></div>)}{!rows.some((r) => r.delayedOrders > 0) ? <p className="text-xs text-slate-500">Không có lệnh chậm tiến độ.</p> : null}</div></div>
      </aside>
    </div>
  </div>
}

function MaterialsTab({ rows, projects }: { rows: ProjectMaterialRuntime[]; projects: ProjectRuntimeRow[] }) {
  const [projectId, setProjectId] = useState('all')
  const filtered = rows.filter((row) => projectId === 'all' || row.projectId === projectId)
  const total = filtered.reduce((sum, row) => sum + Math.abs(row.totalAmount), 0)
  const issued = filtered.filter((row) => row.type === 'EXPORT').reduce((sum, row) => sum + Math.abs(row.totalAmount), 0)
  const inbound = filtered.filter((row) => row.type === 'IMPORT').reduce((sum, row) => sum + Math.abs(row.totalAmount), 0)
  return <div className="mt-3 space-y-4">
    <div className={`${panel} flex flex-wrap gap-2 p-3`}><select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={input}><option value="all">Tất cả công trình</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select><button className="rounded bg-blue-600 px-4 text-xs">Xuất Excel</button><button className="rounded border border-slate-700 px-4 text-xs">Bộ lọc</button></div>
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5"><KpiCard icon={PackageOpen} title="Tổng giá trị vật tư" value={`${money(total)} tỷ`} note="VND" /><KpiCard icon={CheckCircle2} title="Đã cấp về công trường" value={`${money(inbound)} tỷ`} note="Inbound" tone="emerald" /><KpiCard icon={Layers} title="Đang sử dụng" value={`${money(issued)} tỷ`} note="Outbound" /><KpiCard icon={Clock} title="Tồn kho tại công trường" value={`${money(Math.max(0, inbound - issued))} tỷ`} note="Derived" tone="amber" /><KpiCard icon={BarChart3} title="Dòng vật tư" value={fmt(filtered.length)} note="Transactions" tone="purple" /></div>
    <div className={`${panel} overflow-hidden`}><div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold">Vật tư theo công trình</div><div className="overflow-auto"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="bg-slate-900/70 text-[10px] uppercase text-slate-500"><tr>{['STT', 'Mã vật tư', 'Tên vật tư', 'Công trình', 'Đơn vị', 'Khối lượng', 'Đơn giá', 'Giá trị', 'Loại giao dịch', 'Ngày'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{filtered.map((row, index) => <tr key={row.id} className="border-t border-slate-800 text-slate-200"><td className="px-4 py-3 text-slate-500">{index + 1}</td><td className="px-4 py-3 text-cyan-300">{row.materialCode}</td><td className="px-4 py-3">{row.materialName}</td><td className="px-4 py-3">{row.projectName}</td><td className="px-4 py-3">{row.unit ?? '-'}</td><td className="px-4 py-3">{fmt(row.quantity)}</td><td className="px-4 py-3">{fmt(row.unitPrice)}</td><td className="px-4 py-3">{fmt(Math.abs(row.totalAmount))}</td><td className="px-4 py-3">{row.type}</td><td className="px-4 py-3">{date(row.date)}</td></tr>)}</tbody></table></div>{!filtered.length ? <Empty title="Chưa có vật tư theo công trình." /> : null}</div>
  </div>
}

const componentStatusOptions: Array<'ALL' | ProjectComponentStatus> = ['ALL', 'STOCK', 'READY', 'SHIPPED', 'DELIVERED', 'INSTALLED']

function ProjectComponentsTab({ rows, projects, pendingId, onDeliver, onInstall, onOpen }: { rows: ProjectComponentRuntime[]; projects: ProjectRuntimeRow[]; pendingId: string | null; onDeliver: (row: ProjectComponentRuntime) => void; onInstall: (row: ProjectComponentRuntime) => void; onOpen: (row: ProjectComponentRuntime) => void }) {
  const [projectId, setProjectId] = useState('all')
  const [status, setStatus] = useState<'ALL' | ProjectComponentStatus>('ALL')
  const filtered = rows.filter((row) => (projectId === 'all' || row.projectId === projectId) && (status === 'ALL' || row.status === status))
  const count = (value: ProjectComponentStatus) => filtered.filter((row) => row.status === value).length

  return <div className="mt-3 space-y-4">
    <div className={`${panel} flex flex-wrap gap-2 p-3`}>
      <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className={input}>
        <option value="all">Tất cả công trình</option>
        {projects.map((project) => <option key={project.id} value={project.id}>{project.code} · {project.name}</option>)}
      </select>
      <select value={status} onChange={(event) => setStatus(event.target.value as 'ALL' | ProjectComponentStatus)} className={input}>
        {componentStatusOptions.map((option) => <option key={option} value={option}>Trạng thái: {option}</option>)}
      </select>
      <button className="rounded bg-blue-600 px-4 text-xs">Xuất Excel</button>
      <button className="rounded border border-slate-700 px-4 text-xs">Bộ lọc</button>
    </div>
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
      <KpiCard icon={PackageOpen} title="Tổng cấu kiện" value={fmt(filtered.length)} note="Cấu kiện" />
      <KpiCard icon={CheckCircle2} title="READY" value={fmt(count('READY'))} note="Sẵn sàng" tone="emerald" />
      <KpiCard icon={Layers} title="SHIPPED" value={fmt(count('SHIPPED'))} note="Đã xuất bãi" tone="cyan" />
      <KpiCard icon={TrendingUp} title="DELIVERED" value={fmt(count('DELIVERED'))} note="Đã giao" tone="purple" />
      <KpiCard icon={CalendarClock} title="INSTALLED" value={fmt(count('INSTALLED'))} note="Đã lắp" tone="amber" />
    </div>
    <div className={`${panel} overflow-hidden`}>
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <h3 className="text-sm font-semibold">Cấu kiện công trình</h3>
        <span className="text-xs text-slate-500">{filtered.length.toLocaleString('vi-VN')} cấu kiện</span>
      </div>
      <div className="overflow-auto">
        <table className="w-full min-w-[1640px] text-left text-sm">
          <thead className="bg-slate-900/70 text-[10px] uppercase text-slate-500"><tr>{['Mã cấu kiện', 'Tên cấu kiện', 'Công trình', 'Trạng thái', 'Ngày kế hoạch', 'Ngày lắp đặt', 'Zone', 'Axis', 'Level', 'Position', 'Estimated Cost', 'Actual Cost', 'Thao tác'].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead>
          <tbody>{filtered.map((row) => <tr key={row.id} onClick={() => onOpen(row)} className={`cursor-pointer ${tableRow}`}>
            <td className="px-4 py-3 font-semibold text-cyan-300">{row.code}</td>
            <td className="px-4 py-3">{row.name}</td>
            <td className="px-4 py-3">{row.projectCode} · {row.projectName}</td>
            <td className="px-4 py-3"><ComponentStatusBadge status={row.status} /></td>
            <td className="px-4 py-3">{date(row.plannedDate)}</td>
            <td className="px-4 py-3">{date(row.installedDate)}</td>
            <td className="px-4 py-3">{row.installZone ?? '-'}</td>
            <td className="px-4 py-3">{row.installAxis ?? '-'}</td>
            <td className="px-4 py-3">{row.installLevel ?? '-'}</td>
            <td className="px-4 py-3">{row.installPosition ?? '-'}</td>
            <td className="px-4 py-3">{fmt(row.estimatedCost)}</td>
            <td className="px-4 py-3">{fmt(row.actualCost)}</td>
            <td className="px-4 py-3">
              <ComponentProjectAction row={row} pending={pendingId === row.id} onDeliver={onDeliver} onInstall={onInstall} />
            </td>
          </tr>)}</tbody>
        </table>
      </div>
      {!filtered.length ? <Empty title="Chưa có cấu kiện theo bộ lọc công trình." /> : null}
    </div>
  </div>
}

function ComponentProjectAction({ row, pending, onDeliver, onInstall }: { row: ProjectComponentRuntime; pending: boolean; onDeliver: (row: ProjectComponentRuntime) => void; onInstall: (row: ProjectComponentRuntime) => void }) {
  if (row.status === 'SHIPPED') {
    return <button type="button" disabled={pending} onClick={(event) => { event.preventDefault(); event.stopPropagation(); onDeliver(row) }} className="rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-200 hover:bg-purple-500/20 disabled:opacity-50">{pending ? 'Đang xác nhận...' : 'Xác nhận nhận hàng'}</button>
  }

  if (row.status === 'DELIVERED') {
    return <button type="button" disabled={pending} onClick={(event) => { event.preventDefault(); event.stopPropagation(); onInstall(row) }} className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50">{pending ? 'Đang xác nhận...' : 'Xác nhận lắp đặt'}</button>
  }

  return <span className="text-xs text-slate-500">-</span>
}

function ReportsTab({ runtime }: { runtime: ProjectsRuntime }) {
  const m = runtime.metrics
  return <div className="mt-3 space-y-4">
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6"><KpiCard icon={Building2} title="Tổng số công trình" value={fmt(m.totalProjects)} note="Công trình" /><KpiCard icon={TrendingUp} title="Doanh thu dự kiến" value={money(m.contractValue)} note="Tỷ VNĐ" /><KpiCard icon={FileBarChart} title="Giá trị hợp đồng" value={money(m.contractValue)} note="Tỷ VNĐ" tone="emerald" /><KpiCard icon={Layers} title="Giá trị thực hiện" value={money(m.actualValue)} note="Tỷ VNĐ" tone="purple" /><KpiCard icon={BarChart3} title="Tỷ lệ thực hiện" value={`${fmt(m.contractValue ? m.actualValue / m.contractValue * 100 : 0)}%`} note="Actual" /><KpiCard icon={TrendingUp} title="Lợi nhuận ước tính" value={money(Math.max(0, m.contractValue - m.actualValue))} note="Tỷ VNĐ" tone="amber" /></div>
    <div className="grid gap-4 xl:grid-cols-3"><DonutPanel title="Tình hình thực hiện theo trạng thái" center={money(m.contractValue)} note="Tỷ VNĐ" rows={runtime.reports.byStatus.map((r, i) => [r.status, r.count, ['bg-blue-500', 'bg-amber-400', 'bg-emerald-500'][i % 3]]) as any} /><BarPanel title="Giá trị thực hiện theo tháng" rows={runtime.projects.map((r) => [r.code, r.actualValue / 1_000_000_000])} suffix=" tỷ" /><TopProjects rows={runtime.reports.topByContract} /></div>
    <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]"><ProjectTable rows={runtime.projects.slice(0, 6)} onOpen={() => undefined} /><div className={`${panel} p-4`}><h3 className="text-sm font-semibold">Nhận xét và đánh giá</h3><div className="mt-4 space-y-2 text-xs text-slate-300"><p><span className="text-emerald-400">●</span> Tổng giá trị thực hiện đạt {fmt(m.contractValue ? m.actualValue / m.contractValue * 100 : 0)}% so với giá trị hợp đồng.</p><p><span className="text-blue-400">●</span> {m.activeProjects} công trình đang thi công, {m.completedProjects} công trình hoàn thành.</p><p><span className="text-amber-400">●</span> Vật tư theo công trình đang lấy từ Inventory transactions có projectId.</p></div></div></div>
  </div>
}

function ProjectDetailDialog({ project, materials, onClose }: { project: ProjectRuntimeRow | null; materials: ProjectMaterialRuntime[]; onClose: () => void }) {
  if (!project) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
    <section className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded border border-cyan-900 bg-[#061321] shadow-2xl">
      <header className="flex items-start justify-between border-b border-slate-800 p-5"><div><p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400">Chi tiết công trình</p><h2 className="mt-1 text-2xl font-semibold text-white">{project.name}</h2><p className="mt-1 text-xs text-slate-500">Mã dự án: {project.code} · Chủ đầu tư: {project.owner} · {project.location}</p></div><button onClick={onClose} className="rounded border border-slate-700 p-2 text-slate-300"><X size={16} /></button></header>
      <div className="grid gap-4 p-5 xl:grid-cols-3"><div className={`${panel} p-4`}><h3 className="text-sm font-semibold">Thông tin công trình</h3><Info k="Tên công trình" v={project.name} /><Info k="Địa điểm" v={project.location} /><Info k="Chủ đầu tư" v={project.owner} /><Info k="Loại" v={project.type} /><Info k="Giá trị hợp đồng" v={`${money(project.contractValue)} tỷ VNĐ`} /><Info k="Trạng thái" v={project.status} /></div><div className={`${panel} p-4`}><h3 className="text-sm font-semibold">Tiến độ tổng quan</h3><div className="mt-5 flex items-center justify-center"><Ring value={project.progress} label="Hoàn thành" /></div><Info k="Ngày bắt đầu" v={date(project.startedAt)} /><Info k="Ngày hoàn thành kế hoạch" v={date(project.plannedEndAt)} /></div><div className={`${panel} p-4`}><h3 className="text-sm font-semibold">Giá trị & chi phí</h3><div className="mt-5 flex items-center justify-center"><Ring value={project.contractValue ? project.actualValue / project.contractValue * 100 : 0} label="Đã thực hiện" /></div><Info k="Giá trị hợp đồng" v={`${fmt(project.contractValue)} VND`} /><Info k="Giá trị thực hiện" v={`${fmt(project.actualValue)} VND`} /></div></div>
      <div className="grid gap-4 p-5 xl:grid-cols-[1fr_.9fr]"><div className={`${panel} overflow-hidden`}><div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold">Vật tư liên quan</div><div className="max-h-80 overflow-auto"><table className="w-full text-left text-xs"><thead className="text-slate-500"><tr>{['Mã', 'Tên', 'SL', 'Giá trị'].map((h) => <th className="px-3 py-2" key={h}>{h}</th>)}</tr></thead><tbody>{materials.slice(0, 12).map((row) => <tr key={row.id} className="border-t border-slate-800"><td className="px-3 py-2 text-cyan-300">{row.materialCode}</td><td className="px-3 py-2">{row.materialName}</td><td className="px-3 py-2">{fmt(row.quantity)}</td><td className="px-3 py-2">{fmt(row.totalAmount)}</td></tr>)}</tbody></table>{!materials.length ? <Empty title="Chưa có vật tư theo công trình này." /> : null}</div></div><div className={`${panel} p-4`}><h3 className="text-sm font-semibold">Công việc sắp tới</h3><div className="mt-3 space-y-2 text-xs">{['Hoàn tất cấu kiện còn lại', 'Kiểm tra QC tổng thể', 'Cập nhật vật tư theo công trình', 'Xuất báo cáo tiến độ'].map((task, index) => <div key={task} className="flex justify-between rounded border border-slate-800 px-3 py-2"><span>{task}</span><span className="text-amber-300">T+{index + 1}</span></div>)}</div></div></div>
    </section>
  </div>
}

function KpiCard({ icon: Icon, title, value, note, tone = 'cyan' }: { icon: LucideIcon; title: string; value: string; note: string; tone?: 'cyan' | 'emerald' | 'amber' | 'purple' }) {
  const color = tone === 'emerald' ? 'from-emerald-500 to-teal-400 text-emerald-200' : tone === 'amber' ? 'from-amber-500 to-orange-400 text-amber-200' : tone === 'purple' ? 'from-purple-500 to-fuchsia-400 text-purple-200' : 'from-blue-500 to-cyan-400 text-cyan-200'
  return <div className={`${panel} relative overflow-hidden p-4`}>
    <div className={`absolute left-0 top-0 h-1 w-full bg-gradient-to-r ${color}`} />
    <div className="flex items-center justify-between gap-3">
      <span className={`grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br ${color} bg-opacity-15 text-white shadow-lg shadow-black/20`}><Icon size={20} /></span>
      <span className="text-right text-[10px] uppercase tracking-[0.16em] text-slate-500">{note}</span>
    </div>
    <div className="mt-4 text-[10px] uppercase tracking-[0.16em] text-slate-400">{title}</div>
    <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
  </div>
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === 'ACTIVE' ? 'bg-blue-950 text-blue-300' : status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-300' : status === 'PLANNING' ? 'bg-amber-950 text-amber-300' : 'bg-slate-900 text-slate-300'
  const label = status === 'ACTIVE' ? 'Đang thi công' : status === 'COMPLETED' ? 'Hoàn thành' : status === 'PLANNING' ? 'Chưa khởi công' : status
  return <span className={`rounded px-2 py-1 text-[10px] ${tone}`}>{label}</span>
}

function ComponentStatusBadge({ status }: { status: ProjectComponentStatus }) {
  const tone = status === 'SHIPPED' ? 'bg-cyan-950 text-cyan-300' : status === 'DELIVERED' ? 'bg-purple-950 text-purple-300' : status === 'INSTALLED' ? 'bg-emerald-950 text-emerald-300' : status === 'READY' ? 'bg-blue-950 text-blue-300' : status === 'STOCK' ? 'bg-amber-950 text-amber-300' : 'bg-slate-900 text-slate-300'
  return <span className={`rounded px-2 py-1 text-[10px] ${tone}`}>{status}</span>
}

function Progress({ value }: { value: number }) {
  return <div className="grid grid-cols-[42px_1fr] items-center gap-2"><span>{fmt(value)}%</span><span className="h-2 rounded bg-slate-800"><i className={`block h-full rounded ${value >= 70 ? 'bg-emerald-500' : value >= 35 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></span></div>
}

function Ring({ value, label }: { value: number; label: string }) {
  return <div className="flex h-40 w-40 items-center justify-center rounded-full border-[18px] border-blue-600 bg-slate-950 text-center"><div><div className="text-3xl font-semibold">{fmt(value)}%</div><div className="mt-1 text-xs text-slate-400">{label}</div></div></div>
}

function DonutPanel({ title, center, note, rows }: { title: string; center: string; note: string; rows: Array<[string, number, string]> }) {
  return <div className={`${panel} p-4`}><h3 className="text-sm font-semibold">{title}</h3><div className="mt-4 grid grid-cols-[130px_1fr] items-center gap-4"><div className="grid aspect-square place-items-center rounded-full bg-[conic-gradient(#2563eb_0_35%,#10b981_35%_62%,#f59e0b_62%_82%,#8b5cf6_82%_100%)] p-4"><div className="grid h-full w-full place-items-center rounded-full bg-slate-950 text-center"><div><div className="text-xl font-semibold">{center}</div><div className="text-xs text-slate-500">{note}</div></div></div></div><div className="space-y-2">{rows.map(([label, value, color]) => <div key={label} className="flex items-center justify-between gap-2 text-xs"><span className="flex items-center gap-2"><i className={`h-2 w-2 rounded-full ${color}`} />{label}</span><b>{fmt(value)}</b></div>)}</div></div></div>
}

function BarPanel({ title, rows, suffix }: { title: string; rows: Array<[string, number]>; suffix: string }) {
  const max = Math.max(1, ...rows.map(([, value]) => value))
  return <div className={`${panel} p-4`}><h3 className="text-sm font-semibold">{title}</h3><div className="mt-4 flex h-44 items-end gap-2 rounded-lg border border-white/10 bg-slate-950/35 px-3 pb-3">{rows.slice(0, 10).map(([label, value]) => <div key={label} className="flex flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] text-slate-300">{fmt(value)}{suffix}</span><div className="w-full rounded-t bg-gradient-to-t from-blue-700 to-cyan-400" style={{ height: `${Math.max(4, value / max * 100)}%` }} /><span className="max-w-16 truncate text-[9px] text-slate-500">{label}</span></div>)}</div></div>
}

function GanttPanel({ rows }: { rows: ProjectRuntimeRow[] }) {
  return <div className={`${panel} p-4`}><h3 className="text-sm font-semibold">Biểu đồ tiến độ</h3><div className="mt-4 space-y-3">{rows.slice(0, 10).map((row, index) => <div key={row.id} className="grid grid-cols-[130px_1fr_45px] items-center gap-3 text-xs"><span className="truncate text-slate-300">{row.name}</span><span className="h-5 rounded bg-slate-800"><i className={`block h-full rounded ${index % 3 === 0 ? 'bg-amber-500' : 'bg-blue-600'}`} style={{ width: `${Math.max(5, row.progress)}%` }} /></span><b>{fmt(row.progress)}%</b></div>)}</div></div>
}

function TopProjects({ rows }: { rows: ProjectRuntimeRow[] }) {
  const max = Math.max(1, ...rows.map((row) => row.contractValue))
  return <div className={`${panel} p-4`}><h3 className="text-sm font-semibold">Top 5 công trình theo giá trị hợp đồng</h3><div className="mt-4 space-y-3">{rows.map((row) => <div key={row.id} className="grid grid-cols-[1fr_120px_55px] items-center gap-3 text-xs"><span className="truncate">{row.name}</span><span className="h-2 rounded bg-slate-800"><i className="block h-full rounded bg-blue-600" style={{ width: `${row.contractValue / max * 100}%` }} /></span><b className="text-right">{money(row.contractValue)}</b></div>)}</div></div>
}

function RegionPanel({ rows }: { rows: ProjectRuntimeRow[] }) {
  return <div className={`${panel} p-4`}><h3 className="text-sm font-semibold">Tổng quan theo khu vực</h3><div className="mt-4 space-y-2">{rows.slice(0, 8).map((row) => <div key={row.id} className="flex justify-between rounded border border-slate-800 px-3 py-2 text-xs"><span className="flex items-center gap-2"><MapPin size={12} className="text-cyan-300" />{row.location}</span><span className="text-slate-400">{row.code}</span></div>)}</div></div>
}

function Info({ k, v }: { k: string; v: string }) {
  return <div className="mt-3 flex justify-between gap-4 text-xs"><span className="text-slate-500">{k}</span><span className="text-right text-slate-200">{v}</span></div>
}

function Empty({ title }: { title: string }) {
  return <div className="p-8 text-center text-sm text-slate-500">{title}</div>
}

function filterMaterials(materials: ProjectMaterialRuntime[], projects: ProjectRuntimeRow[]) {
  const ids = new Set(projects.map((project) => project.id))
  return materials.filter((row) => row.projectId && ids.has(row.projectId))
}

function filterComponents(components: ProjectComponentRuntime[], projects: ProjectRuntimeRow[]) {
  const ids = new Set(projects.map((project) => project.id))
  return components.filter((row) => row.projectId && ids.has(row.projectId))
}

function emptyRuntime(): ProjectsRuntime {
  return {
    metrics: { totalProjects: 0, activeProjects: 0, planningProjects: 0, completedProjects: 0, contractValue: 0, actualValue: 0, averageProgress: 0, readyComponents: 0, shippedComponents: 0, deliveredComponents: 0, installedComponents: 0 },
    projects: [],
    progress: [],
    materials: [],
    components: [],
    reports: { byStatus: [], byType: [], topByContract: [] },
  }
}
