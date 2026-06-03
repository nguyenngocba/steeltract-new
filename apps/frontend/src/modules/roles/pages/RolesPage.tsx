import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Edit, MoreHorizontal, Plus, RefreshCw, Search, Shield, ShieldCheck, UserCheck, UserRound } from 'lucide-react'

import { OperationalShell } from '@/shared/layouts/OperationalShell'
import { getRoles } from '../api/roles.api'
import type { SystemRole } from '@/modules/system/api/system.api'

const panel = 'rounded border border-slate-800 bg-[#071321]'
const fmt = (value = 0) => new Intl.NumberFormat('vi-VN').format(value)
const modules = ['Tổng quan', 'Dự án', 'Quản lý cấu kiện', 'Sản xuất', 'Kho vật tư', 'Bãi tập kết', 'Vận chuyển', 'Chất lượng (QC)', 'Báo cáo', 'Cài đặt hệ thống']
const actions = ['view', 'create', 'update', 'delete', 'export']

export function RolesPage() {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data = [], refetch } = useQuery<SystemRole[]>({ queryKey: ['system-roles'], queryFn: getRoles })
  const rows = useMemo(() => data.filter((role) => `${role.name} ${role.description ?? ''}`.toLowerCase().includes(query.toLowerCase())), [data, query])
  const selected = rows.find((role) => role.id === selectedId) ?? rows[0] ?? null
  const inUse = data.filter((role) => role.userCount > 0).length

  return <OperationalShell>
    <main className="min-h-screen bg-[#020811] p-4 text-slate-100">
      <header className="flex flex-wrap items-end justify-between gap-3 pb-4">
        <div><h1 className="text-2xl font-semibold">Vai trò & Phân quyền</h1><p className="mt-1 text-sm text-slate-500">Quản lý vai trò và quyền truy cập hệ thống</p></div>
        <button className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm"><Plus size={16} />Thêm vai trò</button>
      </header>
      <div className="grid gap-3 md:grid-cols-4"><Kpi icon={Shield} title="Tổng vai trò" value={fmt(data.length)} /><Kpi icon={UserCheck} title="Đang sử dụng" value={fmt(inUse)} tone="emerald" /><Kpi icon={UserRound} title="Chưa sử dụng" value={fmt(data.length - inUse)} tone="amber" /><Kpi icon={ShieldCheck} title="Tổng quyền" value={fmt(data.reduce((sum, role) => sum + role.permissions.length, 0))} tone="purple" /></div>
      <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_420px]">
        <section className={`${panel} overflow-hidden`}><div className="flex flex-wrap gap-2 border-b border-slate-800 p-3"><div className="flex min-w-72 flex-1 items-center gap-2 rounded border border-slate-700 bg-[#050d18] px-3"><Search size={15} className="text-cyan-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm vai trò..." className="h-10 w-full bg-transparent text-sm outline-none" /></div><button onClick={() => refetch()} className="inline-flex items-center gap-2 rounded bg-slate-900 px-4 text-sm"><RefreshCw size={15} />Làm mới</button></div><table className="w-full text-sm"><thead className="bg-slate-900/60 text-xs text-slate-400"><tr><th className="px-4 py-3 text-left">#</th><th className="px-4 py-3 text-left">Vai trò</th><th className="px-4 py-3 text-left">Mô tả</th><th className="px-4 py-3 text-left">Người dùng</th><th className="px-4 py-3 text-left">Quyền</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead><tbody>{rows.map((role, index) => <tr key={role.id} onClick={() => setSelectedId(role.id)} className={`cursor-pointer border-t border-slate-800 hover:bg-cyan-950/20 ${selected?.id === role.id ? 'bg-blue-950/30' : ''}`}><td className="px-4 py-3">{index + 1}</td><td className="px-4 py-3 font-semibold text-cyan-300">{role.name}</td><td className="px-4 py-3 text-slate-400">{role.description ?? '-'}</td><td className="px-4 py-3">{role.userCount}</td><td className="px-4 py-3">{role.permissions.length}</td><td className="px-4 py-3 text-right"><button className="rounded bg-slate-900 p-2"><Edit size={15} /></button><button className="ml-1 rounded bg-slate-900 p-2"><MoreHorizontal size={15} /></button></td></tr>)}</tbody></table></section>
        <RoleDetail role={selected} />
      </div>
    </main>
  </OperationalShell>
}

function RoleDetail({ role }: { role: SystemRole | null }) {
  if (!role) return <aside className={`${panel} p-4 text-sm text-slate-500`}>Chưa có vai trò.</aside>
  const permissionSet = new Set(role.permissions.map((permission) => permission.name.toLowerCase()))
  const allowed = (module: string, action: string) => {
    const key = module.toLowerCase().replaceAll(' ', '.')
    return permissionSet.has('*') || permissionSet.has(`${key}.${action}`) || permissionSet.has(`${action}.${key}`) || role.name.toLowerCase().includes('admin')
  }
  return <aside className={`${panel} p-4`}><div className="flex items-start justify-between"><div><h2 className="font-semibold">Chi tiết vai trò</h2><p className="mt-2 text-xl text-cyan-300">{role.name}</p><p className="mt-1 text-sm text-slate-500">{role.description ?? 'Chưa có mô tả'}</p></div><button className="rounded bg-slate-900 px-3 py-2 text-xs">Chỉnh sửa</button></div><div className="mt-4 grid grid-cols-2 gap-2 text-sm"><Info k="Số người dùng" v={fmt(role.userCount)} /><Info k="Số quyền" v={fmt(role.permissions.length)} /></div><div className="mt-4 overflow-auto"><table className="w-full text-xs"><thead className="text-slate-500"><tr><th className="py-2 text-left">Module</th>{actions.map((action) => <th key={action} className="px-2 py-2 text-center">{action}</th>)}</tr></thead><tbody>{modules.map((module) => <tr key={module} className="border-t border-slate-800"><td className="py-2 text-slate-300">{module}</td>{actions.map((action) => <td key={action} className="px-2 text-center"><span className={`inline-block h-4 w-4 rounded ${allowed(module, action) ? 'bg-blue-600' : 'bg-slate-700'}`} /></td>)}</tr>)}</tbody></table></div></aside>
}

function Kpi({ icon: Icon, title, value, tone = 'blue' }: { icon: any; title: string; value: string; tone?: string }) {
  const color: Record<string, string> = { blue: 'text-blue-400 bg-blue-500/15', emerald: 'text-emerald-400 bg-emerald-500/15', amber: 'text-amber-400 bg-amber-500/15', purple: 'text-purple-400 bg-purple-500/15' }
  return <section className={`${panel} p-4`}><div className={`mb-3 grid h-11 w-11 place-items-center rounded ${color[tone]}`}><Icon size={22} /></div><p className="text-xs text-slate-500">{title}</p><h2 className="mt-1 text-2xl font-semibold">{value}</h2></section>
}

function Info({ k, v }: { k: string; v: string }) {
  return <div className="rounded border border-slate-800 bg-slate-950/40 p-3"><p className="text-xs text-slate-500">{k}</p><p className="mt-1 font-semibold">{v}</p></div>
}
