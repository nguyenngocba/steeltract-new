import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronRight,
  Filter,
  Lock,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  UserRound,
  UserX,
  X,
} from 'lucide-react'

import { EnterpriseWorkspace } from '@/shared/ui/enterprise'
import {
  CockpitChartCard,
  CockpitEmptyState,
  CockpitKpiCard,
  CockpitStatusList,
  CockpitTableShell,
  DataTablePagination,
} from '@/shared/ui/cockpit'
import {
  ModuleDetailDrawer,
  ModuleLoadingState,
  moduleMutedButton,
  modulePrimaryButton,
} from '@/shared/ui/modules'
import { getUsers } from '../api/users.api'
import type { SystemUser } from '@/modules/system/api/system.api'
import { formatDateTime, formatQuantity } from '@/shared/utils/number-format'

const fmt = (value = 0) => formatQuantity(value, 0)
const date = (value?: string | null) => (value ? formatDateTime(value) : '—')

const roleLabel = (user: SystemUser) => user.roles[0]?.name ?? 'Chưa gán vai trò'
const displayName = (user: SystemUser) => user.fullName ?? user.username

export function UsersPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [role, setRole] = useState('all')
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data = [], isLoading, refetch } = useQuery<SystemUser[]>({
    queryKey: ['system-users'],
    queryFn: getUsers,
    refetchInterval: 15000,
  })

  const roles = useMemo(
    () => Array.from(new Set(data.flatMap((user) => user.roles.map((item) => item.name)))).sort(),
    [data],
  )

  const filtered = useMemo(
    () =>
      data.filter((user) => {
        if (status !== 'all' && user.status !== status) return false
        if (role !== 'all' && !user.roles.some((item) => item.name === role)) return false
        return `${user.username} ${user.fullName ?? ''} ${user.email ?? ''} ${roleLabel(user)}`
          .toLowerCase()
          .includes(query.toLowerCase())
      }),
    [data, query, role, status],
  )

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const active = data.filter((user) => user.status === 'ACTIVE').length
  const inactive = data.filter((user) => user.status === 'INACTIVE').length
  const blocked = data.filter((user) => user.status === 'BLOCKED').length
  const admins = data.filter((user) =>
    user.roles.some((item) => {
      const name = item.name.toLowerCase()
      return name.includes('admin') || name.includes('quản trị')
    }),
  ).length

  const isFiltered = Boolean(query || status !== 'all' || role !== 'all')

  return (
    <EnterpriseWorkspace
      eyebrow="Quản trị"
      title="Người dùng"
      description="Quản lý tài khoản người dùng và phân quyền trong hệ thống."
      breadcrumbs={['Quản trị', 'Người dùng']}
      actions={
        <div className="flex items-center gap-2">
          <button className={moduleMutedButton} onClick={() => refetch()} type="button">
            <RefreshCw size={14} /> Làm mới
          </button>
          <button className={modulePrimaryButton} type="button">
            <Plus size={14} /> Thêm người dùng
          </button>
        </div>
      }
    >
      {/* 1. Operational KPIs */}
      <section className="grid gap-1 md:grid-cols-2 xl:grid-cols-4">
        <CockpitKpiCard
          title="Tổng người dùng"
          value={fmt(data.length)}
          note="Tài khoản hệ thống"
          icon={<UserRound size={18} />}
          tone="cyan"
          state={isLoading ? 'loading' : 'normal'}
        />
        <CockpitKpiCard
          title="Đang hoạt động"
          value={fmt(active)}
          note={`${data.length ? Math.round((active / data.length) * 100) : 0}% tỷ lệ kích hoạt`}
          icon={<UserCheck size={18} />}
          tone="emerald"
          state={isLoading ? 'loading' : 'normal'}
        />
        <CockpitKpiCard
          title="Chưa kích hoạt / Đã khóa"
          value={fmt(inactive + blocked)}
          note="Tài khoản cần lưu ý"
          icon={<UserX size={18} />}
          tone="amber"
          state={isLoading ? 'loading' : 'normal'}
        />
        <CockpitKpiCard
          title="Quản trị viên"
          value={fmt(admins)}
          note="Quyền quản trị cao nhất"
          icon={<ShieldCheck size={18} />}
          tone="purple"
          state={isLoading ? 'loading' : 'normal'}
        />
      </section>

      {/* 2. Toolbar & Quick Filters */}
      <section className="my-1 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-2">
        <div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/45 px-2">
          <Search size={14} className="text-cyan-300 shrink-0" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo tên, email, vai trò..."
            className="h-8 w-full bg-transparent text-xs text-slate-100 outline-none placeholder:text-slate-500"
          />
        </div>

        {/* Quick Status Chips */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'ACTIVE', label: 'Hoạt động' },
            { id: 'INACTIVE', label: 'Chưa kích hoạt' },
            { id: 'BLOCKED', label: 'Đã khóa' },
          ].map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setStatus(chip.id)}
              className={`h-8 whitespace-nowrap rounded-lg px-2.5 text-xs transition ${
                status === chip.id
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 font-semibold'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/5'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Filter size={14} className="text-slate-400" />
          </div>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="h-8 rounded-lg border border-white/10 bg-slate-950/45 px-2 text-xs text-slate-200 outline-none focus:border-cyan-400"
          >
            <option value="all">Tất cả vai trò</option>
            {roles.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          {isFiltered && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setStatus('all')
                setRole('all')
              }}
              className="h-8 rounded-lg border border-red-500/30 bg-red-500/10 px-2 text-xs font-medium text-red-300 hover:bg-red-500/20 transition flex items-center gap-1 shrink-0"
              title="Xóa bộ lọc"
            >
              <X size={12} /> Xóa lọc
            </button>
          )}
        </div>
      </section>

      {/* 3. Hero Table & Supporting Analytics */}
      <div className="grid gap-1 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3 flex flex-col justify-between">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Danh sách người dùng hệ thống</h2>
              <span className="text-xs text-slate-500">{fmt(filtered.length)} tài khoản</span>
            </div>

            <CockpitTableShell className="min-h-[480px]">
              {filtered.length > 0 ? (
                <table className="w-full min-w-[850px] table-fixed text-[13px]">
                  <thead className="border-b border-cyan-400/10 bg-transparent text-slate-300">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium w-12">#</th>
                      <th className="px-3 py-2 text-left font-medium">Họ và tên / Username</th>
                      <th className="px-3 py-2 text-left font-medium">Email</th>
                      <th className="px-3 py-2 text-left font-medium">Vai trò</th>
                      <th className="px-3 py-2 text-left font-medium">Trạng thái</th>
                      <th className="px-3 py-2 text-left font-medium">Hoạt động cuối</th>
                      <th className="px-3 py-2 text-right font-medium">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((user, index) => (
                      <tr
                        key={user.id}
                        onClick={() => setSelectedUser(user)}
                        className="cursor-pointer border-b border-cyan-300/10 text-slate-300 hover:bg-cyan-300/[0.055] transition"
                      >
                        <td className="px-3 py-2 text-slate-500 font-mono">{(page - 1) * pageSize + index + 1}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Avatar user={user} />
                            <div className="truncate">
                              <div className="font-semibold text-white">{displayName(user)}</div>
                              <div className="text-[11px] text-slate-500 font-mono">{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-slate-300 truncate">{user.email ?? '—'}</td>
                        <td className="px-3 py-2">
                          <RoleBadge label={roleLabel(user)} />
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge value={user.status} />
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-400">{date(user.lastActivityAt ?? user.updatedAt)}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedUser(user)
                            }}
                            className="inline-flex items-center gap-0.5 rounded bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
                          >
                            Chi tiết <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <CockpitEmptyState
                  title="Chưa có dữ liệu người dùng"
                  description="Không tìm thấy người dùng thỏa mãn điều kiện lọc."
                />
              )}
            </CockpitTableShell>
          </div>

          {filtered.length > 0 && (
            <DataTablePagination
              page={page}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 20, 50]}
            />
          )}
        </section>

        <aside className="space-y-1">
          <CockpitChartCard title="Phân bố Vai trò">
            <CockpitStatusList
              items={roles.slice(0, 5).map((r) => ({
                id: r,
                label: r,
                value: `${fmt(data.filter((u) => u.roles.some((x) => x.name === r)).length)} người dùng`,
                statusTone: 'cyan',
              }))}
              emptyMessage="Chưa có thông tin vai trò."
            />
          </CockpitChartCard>

          <CockpitChartCard title="Tỷ lệ Trạng thái Tài khoản">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Hoạt động</span>
                <span className="font-mono text-emerald-300 font-semibold">{fmt(active)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Chưa kích hoạt</span>
                <span className="font-mono text-amber-300 font-semibold">{fmt(inactive)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Đã khóa</span>
                <span className="font-mono text-red-300 font-semibold">{fmt(blocked)}</span>
              </div>
            </div>
          </CockpitChartCard>
        </aside>
      </div>

      {/* Detail Drawer */}
      <UserDetailDrawer user={selectedUser} onClose={() => setSelectedUser(null)} />
    </EnterpriseWorkspace>
  )
}

function UserDetailDrawer({ user, onClose }: { user: SystemUser | null; onClose: () => void }) {
  if (!user) return null

  return (
    <ModuleDetailDrawer
      open={Boolean(user)}
      onClose={onClose}
      title={`Người dùng ${user.username}`}
      subtitle={displayName(user)}
      size="md"
    >
      <div className="space-y-3 text-sm text-slate-300">
        <div className="flex items-center gap-3 rounded-xl border border-cyan-300/10 bg-slate-950/35 p-3">
          <Avatar user={user} large />
          <div>
            <h3 className="font-semibold text-white">{displayName(user)}</h3>
            <p className="text-xs text-slate-400">{roleLabel(user)}</p>
          </div>
        </div>

        <section className="grid gap-2 md:grid-cols-2">
          <Info label="Email" value={user.email} />
          <Info label="Username" value={user.username} />
          <Info label="Trạng thái" value={statusText(user.status)} />
          <Info label="Tạo ngày" value={date(user.createdAt)} />
          <Info label="Hoạt động cuối" value={date(user.lastActivityAt)} />
          <Info label="Module gần đây" value={user.lastActivityModule} />
        </section>

        <section className="rounded-2xl border border-cyan-300/10 bg-slate-950/25 p-3 space-y-2">
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Danh sách vai trò</h4>
          <div className="flex flex-wrap gap-1">
            {user.roles.map((r) => (
              <RoleBadge key={r.id} label={r.name} />
            ))}
          </div>
        </section>

        <footer className="sticky bottom-0 -mx-1 flex justify-end gap-2 border-t border-cyan-300/10 bg-[#07111f]/95 px-1 py-3 backdrop-blur">
          <button className={moduleMutedButton} onClick={onClose} type="button">
            Đóng
          </button>
        </footer>
      </div>
    </ModuleDetailDrawer>
  )
}

function Avatar({ user, large = false }: { user: SystemUser; large?: boolean }) {
  const initials = displayName(user).slice(0, 2).toUpperCase()
  return (
    <div
      className={`grid ${large ? 'h-12 w-12 text-base' : 'h-8 w-8 text-xs'} shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 font-semibold text-white shadow`}
    >
      {initials}
    </div>
  )
}

function StatusBadge({ value }: { value: SystemUser['status'] }) {
  const cls =
    value === 'ACTIVE'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      : value === 'BLOCKED'
        ? 'border-red-500/30 bg-red-500/10 text-red-300'
        : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
  return <span className={`rounded-lg border px-2 py-0.5 text-[11px] ${cls}`}>{statusText(value)}</span>
}

function statusText(value: SystemUser['status']) {
  if (value === 'ACTIVE') return 'Đang hoạt động'
  if (value === 'BLOCKED') return 'Đã khóa'
  return 'Chưa kích hoạt'
}

function RoleBadge({ label }: { label: string }) {
  return <span className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-300">{label}</span>
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg border border-cyan-300/10 bg-slate-950/35 px-3 py-2">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 text-xs text-white font-medium">{value || '—'}</p>
    </div>
  )
}
