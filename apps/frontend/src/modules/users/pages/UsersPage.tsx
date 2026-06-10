import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import {
  Download,
  Eye,
  Lock,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserRound,
  UserX,
} from 'lucide-react'

import { OperationalShell } from '@/shared/layouts/OperationalShell'
import {
  inventoryInput,
  inventoryMutedButton,
  inventoryPanel,
  inventoryTableHead,
  inventoryTableRow,
  inventoryTableShell,
} from '@/modules/inventory/components/InventoryVisuals'
import { getUsers } from '../api/users.api'
import type { SystemUser } from '@/modules/system/api/system.api'

const fmt = (value = 0) => new Intl.NumberFormat('vi-VN').format(value)
const date = (value?: string | null) => value ? new Date(value).toLocaleString('vi-VN') : '-'

const roleLabel = (user: SystemUser) => user.roles[0]?.name ?? 'Chưa gán vai trò'
const displayName = (user: SystemUser) => user.fullName ?? user.username

export function UsersPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [role, setRole] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data = [], refetch } = useQuery<SystemUser[]>({
    queryKey: ['system-users'],
    queryFn: getUsers,
    refetchInterval: 15000,
  })

  const roles = useMemo(
    () => Array.from(new Set(data.flatMap((user) => user.roles.map((item) => item.name)))).sort(),
    [data],
  )
  const filtered = useMemo(() => data.filter((user) => {
    if (status !== 'all' && user.status !== status) return false
    if (role !== 'all' && !user.roles.some((item) => item.name === role)) return false
    return `${user.username} ${user.fullName ?? ''} ${user.email ?? ''} ${roleLabel(user)}`
      .toLowerCase()
      .includes(query.toLowerCase())
  }), [data, query, role, status])
  const selected = filtered.find((user) => user.id === selectedId) ?? filtered[0] ?? null
  const active = data.filter((user) => user.status === 'ACTIVE').length
  const inactive = data.filter((user) => user.status === 'INACTIVE').length
  const blocked = data.filter((user) => user.status === 'BLOCKED').length
  const admins = data.filter((user) =>
    user.roles.some((item) => {
      const name = item.name.toLowerCase()
      return name.includes('admin') || name.includes('quản trị')
    }),
  ).length

  return (
    <OperationalShell>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_30%),linear-gradient(135deg,#06111e_0%,#081827_52%,#0b1220_100%)] p-4 text-slate-100">
        <header className="flex flex-wrap items-end justify-between gap-3 pb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Người dùng</h1>
            <p className="mt-1 text-sm text-slate-400">Quản lý tài khoản người dùng và phân quyền trong hệ thống</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500">
              <Plus size={16} /> Thêm người dùng
            </button>
            <button className={inventoryMutedButton}>
              <Download size={15} /> Xuất Excel
            </button>
            <button className={inventoryMutedButton}>
              <MoreHorizontal size={15} />
            </button>
          </div>
        </header>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <IconKpi icon={UserRound} title="Tổng người dùng" value={fmt(data.length)} note="Tài khoản hệ thống" />
          <IconKpi icon={UserCheck} title="Đang hoạt động" value={fmt(active)} note={`${data.length ? Math.round((active / data.length) * 100) : 0}%`} tone="emerald" />
          <IconKpi icon={UserX} title="Chưa kích hoạt" value={fmt(inactive)} note="Tài khoản" tone="amber" />
          <IconKpi icon={Lock} title="Đã khóa" value={fmt(blocked)} note="Tài khoản" tone="red" />
          <IconKpi icon={ShieldCheck} title="Quản trị viên" value={fmt(admins)} note="Có quyền quản trị" tone="purple" />
        </div>

        <section className={`${inventoryPanel} mt-3 p-3`}>
          <div className="flex flex-wrap gap-2">
            <div className="flex min-w-[280px] flex-1 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/45 px-3">
              <Search size={15} className="text-cyan-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm kiếm theo tên, email, vai trò..." className="h-9 w-full bg-transparent text-xs outline-none placeholder:text-slate-500" />
            </div>
            <select value={role} onChange={(event) => setRole(event.target.value)} className={inventoryInput}>
              <option value="all">Vai trò: Tất cả</option>
              {roles.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className={inventoryInput}>
              <option value="all">Trạng thái: Tất cả</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Chưa kích hoạt</option>
              <option value="BLOCKED">Đã khóa</option>
            </select>
            <button onClick={() => refetch()} className={inventoryMutedButton}>
              <RefreshCw size={15} /> Làm mới
            </button>
          </div>
        </section>

        <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_360px]">
          <UserTable rows={filtered} selectedId={selected?.id} onSelect={setSelectedId} />
          <UserDetail user={selected} />
        </div>
      </main>
    </OperationalShell>
  )
}

function UserTable({ rows, selectedId, onSelect }: { rows: SystemUser[]; selectedId?: string; onSelect: (id: string) => void }) {
  return (
    <section className={inventoryTableShell}>
      <table className="w-full text-sm">
        <thead className={inventoryTableHead}>
          <tr>
            <th className="px-4 py-3 text-left">STT</th>
            <th className="px-4 py-3 text-left">Họ và tên</th>
            <th className="px-4 py-3 text-left">Email</th>
            <th className="px-4 py-3 text-left">Vai trò</th>
            <th className="px-4 py-3 text-left">Trạng thái</th>
            <th className="px-4 py-3 text-left">Hoạt động cuối</th>
            <th className="px-4 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((user, index) => (
            <tr key={user.id} onClick={() => onSelect(user.id)} className={`${inventoryTableRow} cursor-pointer ${selectedId === user.id ? 'bg-blue-500/10' : ''}`}>
              <td className="px-4 py-3 text-slate-400">{index + 1}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar user={user} />
                  <div>
                    <div className="font-medium text-white">{displayName(user)}</div>
                    <div className="text-xs text-slate-500">{user.username}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-300">{user.email ?? '-'}</td>
              <td className="px-4 py-3"><RoleBadge label={roleLabel(user)} /></td>
              <td className="px-4 py-3"><Status value={user.status} /></td>
              <td className="px-4 py-3 text-slate-400">{date(user.lastActivityAt ?? user.updatedAt)}</td>
              <td className="px-4 py-3 text-right">
                <button className="rounded-lg bg-white/[0.055] p-2 text-slate-300 hover:text-cyan-200"><Eye size={15} /></button>
                <button className="ml-1 rounded-lg bg-white/[0.055] p-2 text-slate-300 hover:text-cyan-200"><MoreHorizontal size={15} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-white/10 px-4 py-3 text-xs text-slate-400">Hiển thị 1 - {rows.length}/{rows.length} người dùng</div>
    </section>
  )
}

function UserDetail({ user }: { user: SystemUser | null }) {
  if (!user) return <aside className={`${inventoryPanel} p-4 text-sm text-slate-500`}>Chưa có người dùng.</aside>

  return (
    <aside className={`${inventoryPanel} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar user={user} large />
          <div>
            <h2 className="font-semibold text-white">{displayName(user)}</h2>
            <p className="text-xs text-slate-500">{roleLabel(user)}</p>
          </div>
        </div>
        <Status value={user.status} />
      </div>

      <div className="mt-5 space-y-3">
        <Info k="Email" v={user.email ?? '-'} />
        <Info k="Tên đăng nhập" v={user.username} />
        <Info k="Ngày tạo" v={date(user.createdAt)} />
        <Info k="Cập nhật cuối" v={date(user.updatedAt)} />
        <Info k="Hoạt động cuối" v={date(user.lastActivityAt)} />
      </div>

      <section className="mt-4 rounded-xl border border-white/10 bg-slate-950/35 p-3">
        <h3 className="text-sm font-semibold text-white">Vai trò & Quyền hạn</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {user.roles.length ? user.roles.map((role) => <RoleBadge key={role.id} label={role.name} />) : <span className="text-xs text-slate-500">Chưa gán vai trò</span>}
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-400">{user.roles[0]?.description ?? 'Quyền truy cập được tính từ vai trò đang gán cho tài khoản.'}</p>
      </section>

      <section className="mt-4 rounded-xl border border-white/10 bg-slate-950/35 p-3">
        <h3 className="text-sm font-semibold text-white">Trạng thái tài khoản</h3>
        <div className="mt-3 space-y-2 text-sm">
          <Info k="Trạng thái" v={statusText(user.status)} />
          <Info k="Module cuối" v={user.lastActivityModule ?? '-'} />
          <Info k="Hành động cuối" v={user.lastActivityAction ?? '-'} />
        </div>
      </section>
    </aside>
  )
}

function IconKpi({ icon: Icon, title, value, note, tone = 'blue' }: { icon: LucideIcon; title: string; value: string; note: string; tone?: 'blue' | 'emerald' | 'amber' | 'red' | 'purple' }) {
  const color = {
    blue: 'text-blue-300 bg-blue-500/15',
    emerald: 'text-emerald-300 bg-emerald-500/15',
    amber: 'text-amber-300 bg-amber-500/15',
    red: 'text-red-300 bg-red-500/15',
    purple: 'text-purple-300 bg-purple-500/15',
  }[tone]
  return (
    <section className={`${inventoryPanel} p-4`}>
      <div className={`mb-3 grid h-11 w-11 place-items-center rounded-xl ${color}`}>
        <Icon size={22} />
      </div>
      <p className="text-xs text-slate-500">{title}</p>
      <h2 className="mt-1 text-2xl font-semibold text-white">{value}</h2>
      <p className="text-xs text-slate-500">{note}</p>
    </section>
  )
}

function Avatar({ user, large = false }: { user: SystemUser; large?: boolean }) {
  const initials = displayName(user).slice(0, 2).toUpperCase()
  return <div className={`grid ${large ? 'h-14 w-14 text-lg' : 'h-9 w-9 text-xs'} place-items-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 font-semibold text-white`}>{initials}</div>
}

function Status({ value }: { value: SystemUser['status'] }) {
  const cls = value === 'ACTIVE'
    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
    : value === 'BLOCKED'
      ? 'border-red-500/40 bg-red-500/10 text-red-300'
      : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
  return <span className={`rounded-lg border px-2 py-1 text-xs ${cls}`}>{statusText(value)}</span>
}

function statusText(value: SystemUser['status']) {
  if (value === 'ACTIVE') return 'Đang hoạt động'
  if (value === 'BLOCKED') return 'Đã khóa'
  return 'Chưa kích hoạt'
}

function RoleBadge({ label }: { label: string }) {
  return <span className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-300">{label}</span>
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-white/10 pb-2 text-sm">
      <span className="text-slate-500">{k}</span>
      <span className="text-right text-slate-200">{v}</span>
    </div>
  )
}
