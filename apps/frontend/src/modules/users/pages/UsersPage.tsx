import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Eye, Lock, MoreHorizontal, Plus, RefreshCw, Search, ShieldCheck, UserCheck, UserRound, UserX } from 'lucide-react'

import { OperationalShell } from '@/shared/layouts/OperationalShell'
import { getUsers } from '../api/users.api'
import type { SystemUser } from '@/modules/system/api/system.api'

const panel = 'rounded border border-slate-800 bg-[#071321]'
const fmt = (value = 0) => new Intl.NumberFormat('vi-VN').format(value)
const date = (value?: string) => value ? new Date(value).toLocaleString('vi-VN') : '-'

export function UsersPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<SystemUser | null>(null)
  const { data = [], refetch } = useQuery<SystemUser[]>({ queryKey: ['system-users'], queryFn: getUsers })
  const filtered = useMemo(() => data.filter((user) => {
    if (status !== 'all' && user.status !== status) return false
    return `${user.username} ${user.fullName ?? ''} ${user.email ?? ''}`.toLowerCase().includes(query.toLowerCase())
  }), [data, query, status])
  const active = data.filter((user) => user.status === 'ACTIVE').length
  const blocked = data.filter((user) => user.status === 'BLOCKED').length
  const admins = data.filter((user) => user.roles.some((role) => role.name.toLowerCase().includes('admin') || role.name.toLowerCase().includes('quản trị'))).length

  return <OperationalShell>
    <main className="min-h-screen bg-[#020811] p-4 text-slate-100">
      <header className="flex flex-wrap items-end justify-between gap-3 pb-4">
        <div><h1 className="text-2xl font-semibold">Người dùng</h1><p className="mt-1 text-sm text-slate-500">Quản lý tài khoản người dùng và phân quyền trong hệ thống</p></div>
        <div className="flex gap-2"><button className="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm"><Plus size={16} />Thêm người dùng</button><button className="rounded bg-slate-900 px-4 py-2 text-sm">Xuất Excel</button></div>
      </header>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5"><Kpi icon={UserRound} title="Tổng người dùng" value={fmt(data.length)} note="100%" /><Kpi icon={UserCheck} title="Đang hoạt động" value={fmt(active)} note={`${data.length ? Math.round(active / data.length * 100) : 0}%`} tone="emerald" /><Kpi icon={UserX} title="Chưa kích hoạt" value={fmt(data.filter((u) => u.status === 'INACTIVE').length)} note="Tài khoản" tone="amber" /><Kpi icon={Lock} title="Đã khóa" value={fmt(blocked)} note="Tài khoản" tone="red" /><Kpi icon={ShieldCheck} title="Quản trị viên" value={fmt(admins)} note="Tài khoản" tone="purple" /></div>
      <section className={`${panel} mt-3 p-3`}><div className="flex flex-wrap gap-2"><div className="flex min-w-72 flex-1 items-center gap-2 rounded border border-slate-700 bg-[#050d18] px-3"><Search size={15} className="text-cyan-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm kiếm theo tên, email..." className="h-10 w-full bg-transparent text-sm outline-none" /></div><select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded border border-slate-700 bg-[#050d18] px-3 text-sm"><option value="all">Trạng thái: Tất cả</option><option value="ACTIVE">Đang hoạt động</option><option value="INACTIVE">Chưa kích hoạt</option><option value="BLOCKED">Đã khóa</option></select><button onClick={() => refetch()} className="inline-flex items-center gap-2 rounded bg-slate-900 px-4 text-sm"><RefreshCw size={15} />Làm mới</button></div></section>
      <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_360px]"><UserTable rows={filtered} selectedId={selected?.id} onSelect={setSelected} /><UserDetail user={selected ?? filtered[0] ?? null} /></div>
    </main>
  </OperationalShell>
}

function UserTable({ rows, selectedId, onSelect }: { rows: SystemUser[]; selectedId?: string; onSelect: (row: SystemUser) => void }) {
  return <section className={`${panel} overflow-hidden`}><table className="w-full text-sm"><thead className="bg-slate-900/60 text-xs text-slate-400"><tr><th className="px-4 py-3 text-left">STT</th><th className="px-4 py-3 text-left">Họ và tên</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Vai trò</th><th className="px-4 py-3 text-left">Trạng thái</th><th className="px-4 py-3 text-left">Cập nhật</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead><tbody>{rows.map((user, index) => <tr key={user.id} onClick={() => onSelect(user)} className={`cursor-pointer border-t border-slate-800 hover:bg-cyan-950/20 ${selectedId === user.id ? 'bg-blue-950/30' : ''}`}><td className="px-4 py-3">{index + 1}</td><td className="px-4 py-3"><span className="font-medium">{user.fullName ?? user.username}</span><span className="block text-xs text-slate-500">{user.username}</span></td><td className="px-4 py-3 text-slate-300">{user.email ?? '-'}</td><td className="px-4 py-3">{user.roles[0]?.name ?? '-'}</td><td className="px-4 py-3"><Status value={user.status} /></td><td className="px-4 py-3 text-slate-500">{date(user.updatedAt)}</td><td className="px-4 py-3 text-right"><button className="rounded bg-slate-900 p-2"><Eye size={15} /></button><button className="ml-1 rounded bg-slate-900 p-2"><MoreHorizontal size={15} /></button></td></tr>)}</tbody></table></section>
}

function UserDetail({ user }: { user: SystemUser | null }) {
  if (!user) return <aside className={`${panel} p-4 text-sm text-slate-500`}>Chưa có người dùng.</aside>
  return <aside className={`${panel} p-4`}><div className="flex items-center gap-3"><div className="grid h-14 w-14 place-items-center rounded-full bg-blue-600 text-lg font-semibold">{(user.fullName ?? user.username).slice(0, 2).toUpperCase()}</div><div><h2 className="font-semibold">{user.fullName ?? user.username}</h2><p className="text-xs text-slate-500">{user.username}</p></div></div><div className="mt-4 space-y-2 text-sm"><Info k="Email" v={user.email ?? '-'} /><Info k="Trạng thái" v={user.status} /><Info k="Ngày tạo" v={date(user.createdAt)} /><Info k="Cập nhật" v={date(user.updatedAt)} /></div><div className="mt-4 rounded border border-slate-800 bg-slate-950/40 p-3"><h3 className="text-sm font-semibold">Vai trò & Quyền hạn</h3><div className="mt-2 flex flex-wrap gap-2">{user.roles.map((role) => <span key={role.id} className="rounded border border-blue-500/50 bg-blue-500/10 px-2 py-1 text-xs text-blue-300">{role.name}</span>)}</div></div></aside>
}

function Kpi({ icon: Icon, title, value, note, tone = 'blue' }: { icon: any; title: string; value: string; note: string; tone?: string }) {
  const color: Record<string, string> = { blue: 'text-blue-400 bg-blue-500/15', emerald: 'text-emerald-400 bg-emerald-500/15', amber: 'text-amber-400 bg-amber-500/15', red: 'text-red-400 bg-red-500/15', purple: 'text-purple-400 bg-purple-500/15' }
  return <section className={`${panel} p-4`}><div className={`mb-3 grid h-11 w-11 place-items-center rounded ${color[tone]}`}><Icon size={22} /></div><p className="text-xs text-slate-500">{title}</p><h2 className="mt-1 text-2xl font-semibold">{value}</h2><p className="text-xs text-slate-500">{note}</p></section>
}

function Status({ value }: { value: string }) {
  const cls = value === 'ACTIVE' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : value === 'BLOCKED' ? 'border-red-500/40 bg-red-500/10 text-red-400' : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
  return <span className={`rounded border px-2 py-1 text-xs ${cls}`}>{value}</span>
}

function Info({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-3 border-b border-slate-800 pb-2"><span className="text-slate-500">{k}</span><span>{v}</span></div>
}
