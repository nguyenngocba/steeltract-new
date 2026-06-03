import { type ReactNode, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bell, Building2, CheckCircle2, DatabaseBackup, FileDigit, Globe2, Link2, Save, Settings, ShieldCheck, SlidersHorizontal, Workflow, XCircle } from 'lucide-react'

import { OperationalShell } from '@/shared/layouts/OperationalShell'
import { systemApi, type WorkflowCheck } from '@/modules/system/api/system.api'

type Tab = 'overview' | 'general' | 'permissions' | 'master' | 'integrations' | 'notifications' | 'backup' | 'logs'

const tabs: Array<[Tab, string]> = [
  ['overview', 'Tổng quan'],
  ['general', 'Cấu hình chung'],
  ['permissions', 'Phân quyền'],
  ['master', 'Danh mục'],
  ['integrations', 'Tích hợp'],
  ['notifications', 'Thông báo'],
  ['backup', 'Sao lưu & Phục hồi'],
  ['logs', 'Nhật ký cấu hình'],
]
const panel = 'rounded border border-slate-800 bg-[#071321]'
const fmt = (value = 0) => new Intl.NumberFormat('vi-VN').format(value)
const date = (value?: string) => value ? new Date(value).toLocaleString('vi-VN') : '-'

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const { data } = useQuery({ queryKey: ['system-overview'], queryFn: systemApi.overview, refetchInterval: 10000 })
  const { data: workflow } = useQuery({ queryKey: ['operational-workflow'], queryFn: systemApi.workflow, refetchInterval: 10000 })
  const stats = data?.stats ?? {}
  const category = useMemo(() => [
    ['Thông tin công ty', Building2],
    ['Cấu hình hệ thống', Settings],
    ['Đơn vị & Quy đổi', SlidersHorizontal],
    ['Mã vật tư', FileDigit],
    ['Trạng thái & Loại', ShieldCheck],
    ['Kho & Vị trí', DatabaseBackup],
    ['Số chứng từ', FileDigit],
    ['Email & SMTP', Bell],
    ['Tích hợp hệ thống', Link2],
    ['Giao diện & Hiển thị', Globe2],
  ] as const, [])

  return <OperationalShell>
    <main className="min-h-screen bg-[#020811] p-4 text-slate-100">
      <header className="flex flex-wrap items-end justify-between gap-3 pb-4">
        <div><h1 className="text-2xl font-semibold">Cài đặt hệ thống</h1><p className="mt-1 text-sm text-slate-500">Quản lý toàn bộ cấu hình và thiết lập hệ thống</p></div>
        <button className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-semibold"><Save size={16} />Lưu thay đổi</button>
      </header>
      <nav className="mb-3 flex gap-1 overflow-x-auto rounded border border-slate-800 bg-[#06101b] p-1">{tabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`whitespace-nowrap rounded px-4 py-2 text-sm ${tab === id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>{label}</button>)}</nav>
      {tab === 'overview' && <Overview data={data} workflow={workflow} category={category} stats={stats} />}
      {tab === 'general' && <ConfigGrid title="Cấu hình chung" values={data?.system} />}
      {tab === 'permissions' && <ConfigGrid title="Tổng quan phân quyền" values={{ users: fmt(stats.totalUsers), activeUsers: fmt(stats.activeUsers), roles: fmt(stats.roles), permissions: fmt(stats.permissions) }} />}
      {tab === 'master' && <ConfigGrid title="Danh mục dữ liệu" values={{ inventoryItems: fmt(stats.masterDataTotal), operationalRecords: fmt(stats.operationalRecords) }} />}
      {tab === 'integrations' && <Integrations rows={data?.integrations ?? []} />}
      {tab === 'notifications' && <Toggles rows={data?.notifications ?? {}} />}
      {tab === 'backup' && <ConfigGrid title="Sao lưu dữ liệu" values={data?.backup} />}
      {tab === 'logs' && <Activities rows={data?.recentActivities ?? []} />}
    </main>
  </OperationalShell>
}

function Overview({ data, workflow, category, stats }: { data: any; workflow?: WorkflowCheck; category: ReadonlyArray<readonly [string, any]>; stats: Record<string, number> }) {
  return <div className="grid gap-3 xl:grid-cols-[300px_1fr]">
    <aside className={`${panel} p-4`}><h2 className="text-sm font-semibold">Danh mục cài đặt</h2><div className="mt-3 space-y-1">{category.map(([label, Icon], index) => <div key={label} className={`flex items-center gap-3 rounded px-3 py-2 text-sm ${index === 0 ? 'bg-blue-600/30 text-blue-200' : 'text-slate-400'}`}><Icon size={16} />{label}</div>)}</div></aside>
    <section className="grid gap-3 xl:grid-cols-2">
      <Card title="Thông tin công ty" icon={Building2}><Info k="Tên công ty" v={data?.company?.name || 'STEELTRACK'} /><Info k="Mã số thuế" v={data?.company?.taxCode || '-'} /><Info k="Địa chỉ" v={data?.company?.address || '-'} /><Info k="Điện thoại" v={data?.company?.phone || '-'} /><Info k="Email" v={data?.company?.email || '-'} /></Card>
      <Card title="Cấu hình hệ thống" icon={Settings}>{Object.entries(data?.system ?? {}).map(([k, v]) => <Info key={k} k={label(k)} v={String(v)} />)}</Card>
      <Card title="Cấu hình chứng từ" icon={FileDigit}>{Object.entries(data?.documents ?? {}).map(([k, v]) => <Info key={k} k={label(k)} v={String(v)} />)}</Card>
      <Card title="Kiểm tra workflow vận hành" icon={Workflow}><WorkflowPanel workflow={workflow} /></Card>
      <Card title="Tích hợp hệ thống" icon={Link2}>{(data?.integrations ?? []).map((row: any) => <Info key={row.name} k={row.name} v={row.status} tone={row.status === 'ENABLED' || row.status === 'CONNECTED' ? 'ok' : 'warn'} />)}</Card>
      <Card title="Thống kê hệ thống" icon={DatabaseBackup}><Info k="Tổng người dùng" v={fmt(stats.totalUsers)} /><Info k="Tổng vai trò" v={fmt(stats.roles)} /><Info k="Tổng quyền" v={fmt(stats.permissions)} /><Info k="Tổng nhật ký" v={fmt(stats.activityTotal)} /></Card>
    </section>
  </div>
}

function WorkflowPanel({ workflow }: { workflow?: WorkflowCheck }) {
  if (!workflow) return <p className="text-sm text-slate-500">Đang kiểm tra workflow...</p>
  return <div className="space-y-2">{workflow.steps.map((step) => <div key={step.code} className="grid grid-cols-[22px_1fr] gap-2 rounded border border-slate-800 bg-slate-950/40 p-2 text-xs"><span className={step.status === 'OK' ? 'text-emerald-400' : step.status === 'WARN' ? 'text-amber-400' : 'text-red-400'}>{step.status === 'OK' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}</span><span><b className="block text-slate-200">{step.name}</b><span className="text-slate-500">{step.detail}</span></span></div>)}</div>
}

function Card({ title, icon: Icon, children }: { title: string; icon: any; children: ReactNode }) {
  return <section className={`${panel} p-4`}><div className="mb-3 flex items-center justify-between"><h2 className="inline-flex items-center gap-2 text-sm font-semibold"><Icon size={16} className="text-cyan-400" />{title}</h2><button className="rounded bg-slate-900 px-3 py-1 text-xs text-slate-400">Chỉnh sửa</button></div>{children}</section>
}

function ConfigGrid({ title, values }: { title: string; values?: Record<string, unknown> }) {
  return <section className={`${panel} p-4`}><h2 className="mb-4 text-sm font-semibold">{title}</h2><div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{Object.entries(values ?? {}).map(([k, v]) => <div key={k} className="rounded border border-slate-800 bg-slate-950/40 p-3"><p className="text-xs text-slate-500">{label(k)}</p><p className="mt-2 text-sm font-semibold">{String(v)}</p></div>)}</div></section>
}

function Integrations({ rows }: { rows: Array<{ name: string; status: string }> }) {
  return <section className={`${panel} p-4`}><h2 className="mb-4 text-sm font-semibold">Tích hợp hệ thống</h2><div className="space-y-2">{rows.map((row) => <Info key={row.name} k={row.name} v={row.status} tone={row.status === 'ENABLED' || row.status === 'CONNECTED' ? 'ok' : 'warn'} />)}</div></section>
}

function Toggles({ rows }: { rows: Record<string, boolean> }) {
  return <section className={`${panel} p-4`}><h2 className="mb-4 text-sm font-semibold">Cài đặt thông báo</h2><div className="grid gap-2 md:grid-cols-2">{Object.entries(rows).map(([k, enabled]) => <div key={k} className="flex items-center justify-between rounded border border-slate-800 bg-slate-950/40 p-3 text-sm"><span>{label(k)}</span><span className={`h-5 w-9 rounded-full p-1 ${enabled ? 'bg-blue-600' : 'bg-slate-700'}`}><span className={`block h-3 w-3 rounded-full bg-white ${enabled ? 'ml-4' : ''}`} /></span></div>)}</div></section>
}

function Activities({ rows }: { rows: any[] }) {
  return <section className={`${panel} overflow-hidden`}><h2 className="border-b border-slate-800 px-4 py-3 text-sm font-semibold">Nhật ký cấu hình gần đây</h2><div className="divide-y divide-slate-800">{rows.map((row) => <div key={row.id} className="grid gap-2 px-4 py-3 text-xs md:grid-cols-[170px_140px_140px_1fr]"><span className="text-slate-500">{date(row.createdAt)}</span><span className="text-cyan-300">{row.module ?? '-'}</span><span>{row.action}</span><span className="text-slate-400">{row.entity} {row.entityId ?? ''}</span></div>)}</div></section>
}

function Info({ k, v, tone }: { k: string; v: string; tone?: 'ok' | 'warn' }) {
  return <div className="flex items-center justify-between gap-3 border-b border-slate-800/70 py-2 text-sm last:border-0"><span className="text-slate-500">{k}</span><span className={tone === 'ok' ? 'text-emerald-400' : tone === 'warn' ? 'text-amber-400' : 'text-slate-100'}>{v}</span></div>
}

function label(value: string) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
}
