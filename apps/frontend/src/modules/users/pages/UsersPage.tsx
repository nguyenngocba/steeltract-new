import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import { apiErrorMessage } from '@/shared/api/api-error-message'
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
import { systemApi, type SystemRole, type SystemUser } from '@/modules/system/api/system.api'
import { formatDateTime, formatQuantity } from '@/shared/utils/number-format'

const fmt = (value = 0) => formatQuantity(value, 0)
const date = (value?: string | null) => (value ? formatDateTime(value) : '—')

const roleLabel = (user: SystemUser) => user.roles[0]?.name ?? 'Chưa gán vai trò'
const displayName = (user: SystemUser) => user.fullName ?? user.username

type UserForm = {
  username: string
  fullName: string
  email: string
  password: string
  roleIds: string[]
  status: 'ACTIVE' | 'BLOCKED'
}

const emptyForm: UserForm = {
  username: '',
  fullName: '',
  email: '',
  password: '',
  roleIds: [],
  status: 'ACTIVE',
}

const USERNAME_MIN = 3
const PASSWORD_MIN = 8

export function UsersPage() {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [role, setRole] = useState('all')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState<UserForm>(emptyForm)
  const [resetPassword, setResetPassword] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data = [], isLoading, refetch } = useQuery<SystemUser[]>({
    queryKey: ['system-users'],
    queryFn: getUsers,
    refetchInterval: 15000,
  })
  const { data: roles = [] } = useQuery<SystemRole[]>({
    queryKey: ['system-roles'],
    queryFn: systemApi.roles,
  })
  const { data: selectedDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['system-user-detail', selectedUserId],
    queryFn: () => systemApi.userDetail(selectedUserId as string),
    enabled: Boolean(selectedUserId),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['system-users'] })
    queryClient.invalidateQueries({ queryKey: ['system-roles'] })
    if (selectedUserId) {
      queryClient.invalidateQueries({ queryKey: ['system-user-detail', selectedUserId] })
    }
  }

  const createUser = useMutation({
    mutationFn: async (payload: {
      username: string
      email?: string
      fullName?: string
      password: string
      roleIds: string[]
    }) => {
      const user = await systemApi.createUser(payload)
      if (form.status === 'BLOCKED') {
        return systemApi.updateUserStatus({ id: user.id, status: 'BLOCKED' })
      }
      return user
    },
    onSuccess: (user) => {
      invalidate()
      setCreateOpen(false)
      setForm(emptyForm)
      setSelectedUserId(user.id)
    },
  })

  const updateStatus = useMutation({
    mutationFn: systemApi.updateUserStatus,
    onSuccess: invalidate,
  })
  const replaceRoles = useMutation({
    mutationFn: systemApi.replaceUserRoles,
    onSuccess: invalidate,
  })
  const resetPasswordMutation = useMutation({
    mutationFn: systemApi.resetUserPassword,
    onSuccess: () => {
      invalidate()
      setResetPassword('')
    },
  })

  const roleNames = useMemo(
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
          <button className={modulePrimaryButton} type="button" onClick={() => setCreateOpen(true)}>
            <Plus size={14} /> Thêm người dùng
          </button>
        </div>
      }
    >
      <section className="grid gap-1 md:grid-cols-2 xl:grid-cols-4">
        <CockpitKpiCard title="Tổng người dùng" value={fmt(data.length)} note="Tài khoản hệ thống" icon={<UserRound size={18} />} tone="cyan" state={isLoading ? 'loading' : 'normal'} />
        <CockpitKpiCard title="Đang hoạt động" value={fmt(active)} note={`${data.length ? Math.round((active / data.length) * 100) : 0}% tỷ lệ kích hoạt`} icon={<UserCheck size={18} />} tone="emerald" state={isLoading ? 'loading' : 'normal'} />
        <CockpitKpiCard title="Chưa kích hoạt / Đã khóa" value={fmt(inactive + blocked)} note="Tài khoản cần lưu ý" icon={<UserX size={18} />} tone="amber" state={isLoading ? 'loading' : 'normal'} />
        <CockpitKpiCard title="Quản trị viên" value={fmt(admins)} note="Quyền quản trị cao nhất" icon={<ShieldCheck size={18} />} tone="purple" state={isLoading ? 'loading' : 'normal'} />
      </section>

      <section className="my-1 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-2">
        <div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/45 px-2">
          <Search size={14} className="text-cyan-300 shrink-0" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên, email, vai trò..." className="h-8 w-full bg-transparent text-xs text-slate-100 outline-none placeholder:text-slate-500" />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'ACTIVE', label: 'Hoạt động' },
            { id: 'INACTIVE', label: 'Chưa kích hoạt' },
            { id: 'BLOCKED', label: 'Đã khóa' },
          ].map((chip) => (
            <button key={chip.id} type="button" onClick={() => setStatus(chip.id)} className={`h-8 whitespace-nowrap rounded-lg px-2.5 text-xs transition ${status === chip.id ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 font-semibold' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/5'}`}>
              {chip.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select value={role} onChange={(event) => setRole(event.target.value)} className="h-8 rounded-lg border border-white/10 bg-slate-950/45 px-2 text-xs text-slate-200 outline-none focus:border-cyan-400">
            <option value="all">Tất cả vai trò</option>
            {roleNames.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          {isFiltered && (
            <button type="button" onClick={() => { setQuery(''); setStatus('all'); setRole('all') }} className="h-8 rounded-lg border border-red-500/30 bg-red-500/10 px-2 text-xs font-medium text-red-300 hover:bg-red-500/20 transition flex items-center gap-1 shrink-0" title="Xóa bộ lọc">
              <X size={12} /> Xóa lọc
            </button>
          )}
        </div>
      </section>

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
                      <tr key={user.id} onClick={() => setSelectedUserId(user.id)} className="cursor-pointer border-b border-cyan-300/10 text-slate-300 hover:bg-cyan-300/[0.055] transition">
                        <td className="px-3 py-2 text-slate-500 font-mono">{(page - 1) * pageSize + index + 1}</td>
                        <td className="px-3 py-2"><div className="flex items-center gap-2"><Avatar user={user} /><div className="truncate"><div className="font-semibold text-white">{displayName(user)}</div><div className="text-[11px] text-slate-500 font-mono">{user.username}</div></div></div></td>
                        <td className="px-3 py-2 text-slate-300 truncate">{user.email ?? '—'}</td>
                        <td className="px-3 py-2"><RoleBadge label={roleLabel(user)} /></td>
                        <td className="px-3 py-2"><StatusBadge value={user.status} /></td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-400">{date(user.lastActivityAt ?? user.updatedAt)}</td>
                        <td className="px-3 py-2 text-right">
                          <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedUserId(user.id) }} className="inline-flex items-center gap-0.5 rounded bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/20 transition">
                            Chi tiết <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <CockpitEmptyState title="Chưa có dữ liệu người dùng" description="Không tìm thấy người dùng thỏa mãn điều kiện lọc." />
              )}
            </CockpitTableShell>
          </div>

          {filtered.length > 0 && <DataTablePagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={setPageSize} pageSizeOptions={[10, 20, 50]} />}
        </section>

        <aside className="space-y-1">
          <CockpitChartCard title="Phân bố Vai trò">
            <CockpitStatusList items={roleNames.slice(0, 5).map((r) => ({ id: r, label: r, value: `${fmt(data.filter((u) => u.roles.some((x) => x.name === r)).length)} người dùng`, statusTone: 'cyan' }))} emptyMessage="Chưa có thông tin vai trò." />
          </CockpitChartCard>
          <CockpitChartCard title="Tỷ lệ Trạng thái Tài khoản">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300"><span>Hoạt động</span><span className="font-mono text-emerald-300 font-semibold">{fmt(active)}</span></div>
              <div className="flex justify-between text-slate-300"><span>Chưa kích hoạt</span><span className="font-mono text-amber-300 font-semibold">{fmt(inactive)}</span></div>
              <div className="flex justify-between text-slate-300"><span>Đã khóa</span><span className="font-mono text-red-300 font-semibold">{fmt(blocked)}</span></div>
            </div>
          </CockpitChartCard>
        </aside>
      </div>

      <CreateUserModal
        open={createOpen}
        form={form}
        roles={roles}
        saving={createUser.isPending}
        error={createUser.error}
        onClose={() => setCreateOpen(false)}
        onChange={setForm}
        onSubmit={() => createUser.mutate({ username: form.username, fullName: form.fullName || undefined, email: form.email || undefined, password: form.password, roleIds: form.roleIds })}
      />

      <UserDetailDrawer
        user={selectedDetail ?? null}
        loading={detailLoading}
        roles={roles}
        resetPassword={resetPassword}
        saving={updateStatus.isPending || replaceRoles.isPending || resetPasswordMutation.isPending}
        error={updateStatus.error || replaceRoles.error || resetPasswordMutation.error}
        onClose={() => setSelectedUserId(null)}
        onStatus={(nextStatus) => selectedDetail && updateStatus.mutate({ id: selectedDetail.id, status: nextStatus })}
        onRoles={(roleIds) => selectedDetail && replaceRoles.mutate({ id: selectedDetail.id, roleIds })}
        onResetPassword={() => selectedDetail && resetPasswordMutation.mutate({ id: selectedDetail.id, password: resetPassword })}
        onResetPasswordChange={setResetPassword}
      />
    </EnterpriseWorkspace>
  )
}

function CreateUserModal({ open, form, roles, saving, error, onClose, onChange, onSubmit }: { open: boolean; form: UserForm; roles: SystemRole[]; saving: boolean; error: unknown; onClose: () => void; onChange: (form: UserForm) => void; onSubmit: () => void }) {
  const selectedRoles = roles.filter((role) => form.roleIds.includes(role.id))
  const effective = effectivePermissions(selectedRoles)
  const validation = validateUserCreateForm(form)
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-cyan-300/25 bg-[#07111f] shadow-2xl shadow-cyan-950/40">
        <header className="flex items-start justify-between border-b border-cyan-300/15 p-4">
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">Thêm người dùng</p><h2 className="mt-1 text-lg font-semibold text-white">Tạo tài khoản vận hành</h2></div>
          <button type="button" onClick={onClose} className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10"><X size={16} /></button>
        </header>
        <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto p-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-3">
            <FormSection title="Thông tin tài khoản">
              <Field label="Tên đăng nhập *" hint={`Tối thiểu ${USERNAME_MIN} ký tự`}><input className={inputClass} value={form.username} onChange={(event) => onChange({ ...form, username: event.target.value })} /></Field>
              <Field label="Tên hiển thị"><input className={inputClass} value={form.fullName} onChange={(event) => onChange({ ...form, fullName: event.target.value })} /></Field>
              <Field label="Email"><input className={inputClass} type="email" value={form.email} onChange={(event) => onChange({ ...form, email: event.target.value })} /></Field>
              <Field label="Mật khẩu khởi tạo *" hint={`Tối thiểu ${PASSWORD_MIN} ký tự`}><input className={inputClass} type="password" value={form.password} onChange={(event) => onChange({ ...form, password: event.target.value })} /></Field>
            </FormSection>
            <FormSection title="Profile / Vai trò">
              <div className="grid gap-2 md:grid-cols-2">
                {roles.map((role) => (
                  <label key={role.id} className="flex cursor-pointer items-start gap-2 rounded-xl border border-cyan-300/10 bg-slate-950/35 p-2 text-xs text-slate-300 hover:border-cyan-300/30">
                    <input type="checkbox" checked={form.roleIds.includes(role.id)} onChange={(event) => onChange({ ...form, roleIds: event.target.checked ? [...form.roleIds, role.id] : form.roleIds.filter((id) => id !== role.id) })} />
                    <span><b className="block text-white">{role.name}</b><span className="text-slate-500">{role.permissions.length} quyền - {role.description ?? 'Không có mô tả'}</span></span>
                  </label>
                ))}
              </div>
            </FormSection>
            <FormSection title="Trạng thái">
              <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={form.status === 'ACTIVE'} onChange={(event) => onChange({ ...form, status: event.target.checked ? 'ACTIVE' : 'BLOCKED' })} /> Enabled sau khi tạo</label>
            </FormSection>
          </div>
          <AccessPreview title="Quyền hiệu lực" roles={selectedRoles} permissions={effective} username={form.username} status={form.status} />
        </div>
        <footer className="flex items-center justify-between border-t border-cyan-300/15 p-4">
          <div className="min-w-0 flex-1">
            {validation ? <p className="text-xs text-amber-300">{validation}</p> : <ErrorText error={error} />}
          </div>
          <div className="flex gap-2"><button className={moduleMutedButton} type="button" onClick={onClose}>Hủy</button><button className={modulePrimaryButton} type="button" disabled={saving || Boolean(validation)} onClick={onSubmit}>{saving ? 'Đang tạo...' : 'Tạo người dùng'}</button></div>
        </footer>
      </div>
    </div>
  )
}

function UserDetailDrawer({ user, loading, roles, resetPassword, saving, error, onClose, onStatus, onRoles, onResetPassword, onResetPasswordChange }: { user: SystemUser | null; loading: boolean; roles: SystemRole[]; resetPassword: string; saving: boolean; error: unknown; onClose: () => void; onStatus: (status: 'ACTIVE' | 'BLOCKED') => void; onRoles: (roleIds: string[]) => void; onResetPassword: () => void; onResetPasswordChange: (value: string) => void }) {
  const [localRoleIds, setLocalRoleIds] = useState<string[]>([])
  useEffect(() => { setLocalRoleIds(user?.roles.map((role) => role.id) ?? []) }, [user])
  if (!user && !loading) return null
  const selectedRoles = roles.filter((role) => localRoleIds.includes(role.id))

  return (
    <ModuleDetailDrawer open={Boolean(user) || loading} onClose={onClose} title={user ? `Người dùng ${user.username}` : 'Đang tải'} subtitle={user ? displayName(user) : 'Đọc hồ sơ người dùng'} size="md">
      {loading || !user ? <ModuleLoadingState label="Đang đọc chi tiết người dùng" /> : (
        <div className="space-y-3 text-sm text-slate-300">
          <div className="flex items-center gap-3 rounded-xl border border-cyan-300/10 bg-slate-950/35 p-3"><Avatar user={user} large /><div><h3 className="font-semibold text-white">{displayName(user)}</h3><p className="text-xs text-slate-400">{roleLabel(user)}</p></div></div>
          <section className="grid gap-2 md:grid-cols-2"><Info label="Email" value={user.email} /><Info label="Username" value={user.username} /><Info label="Trạng thái" value={statusText(user.status)} /><Info label="Tạo ngày" value={date(user.createdAt)} /><Info label="Hoạt động cuối" value={date(user.lastActivityAt)} /><Info label="Module gần đây" value={user.lastActivityModule} /></section>
          <section className="rounded-2xl border border-cyan-300/10 bg-slate-950/25 p-3 space-y-2"><h4 className="text-xs font-semibold text-white uppercase tracking-wider">Assigned profiles</h4><div className="grid gap-2">{roles.map((role) => <label key={role.id} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={localRoleIds.includes(role.id)} onChange={(event) => setLocalRoleIds(event.target.checked ? [...localRoleIds, role.id] : localRoleIds.filter((id) => id !== role.id))} /><span>{role.name}</span><span className="text-slate-500">({role.permissions.length})</span></label>)}</div><button className={moduleMutedButton} type="button" disabled={saving} onClick={() => onRoles(localRoleIds)}>Lưu vai trò</button></section>
          <AccessPreview title="Effective permissions" roles={selectedRoles} permissions={effectivePermissions(selectedRoles)} username={user.username} status={user.status} compact />
          <section className="rounded-2xl border border-cyan-300/10 bg-slate-950/25 p-3 space-y-2"><h4 className="text-xs font-semibold text-white uppercase tracking-wider">Tác vụ tài khoản</h4><div className="flex flex-wrap gap-2"><button className={moduleMutedButton} type="button" disabled={saving} onClick={() => onStatus(user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE')}>{user.status === 'ACTIVE' ? 'Disable' : 'Enable'}</button></div><div className="flex gap-2"><input className={inputClass} type="password" value={resetPassword} placeholder="Mật khẩu mới" onChange={(event) => onResetPasswordChange(event.target.value)} /><button className={moduleMutedButton} type="button" disabled={saving || resetPassword.length < 8} onClick={onResetPassword}><Lock size={14} /> Reset</button></div></section>
          <ErrorText error={error} />
          <footer className="sticky bottom-0 -mx-1 flex justify-end gap-2 border-t border-cyan-300/10 bg-[#07111f]/95 px-1 py-3 backdrop-blur"><button className={moduleMutedButton} onClick={onClose} type="button">Đóng</button></footer>
        </div>
      )}
    </ModuleDetailDrawer>
  )
}

function AccessPreview({ title, roles, permissions, username, status, compact = false }: { title: string; roles: SystemRole[]; permissions: string[]; username: string; status: string; compact?: boolean }) {
  const modules = Array.from(new Set(permissions.map((permission) => permission.split('.')[0]))).sort()
  const readCount = permissions.filter((permission) => permission.endsWith('.read')).length
  const writeCount = permissions.filter((permission) => permission.endsWith('.write')).length
  const adminCount = permissions.filter((permission) => permission.startsWith('rbac.') || permission.includes('approve')).length
  return (
    <aside className={`rounded-2xl border border-cyan-300/10 bg-slate-950/35 p-3 ${compact ? '' : 'space-y-3'}`}>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <div className="grid grid-cols-2 gap-2 text-xs"><Info label="User" value={username || '—'} /><Info label="Trạng thái" value={status === 'ACTIVE' ? 'Enabled' : 'Disabled'} /><Info label="Modules" value={fmt(modules.length)} /><Info label="Roles" value={fmt(roles.length)} /><Info label="Quyền đọc" value={fmt(readCount)} /><Info label="Quyền thao tác" value={fmt(writeCount)} /><Info label="Admin/duyệt" value={fmt(adminCount)} /><Info label="Tổng quyền" value={fmt(permissions.length)} /></div>
      <div className="mt-3 space-y-1 text-xs">{modules.length ? modules.map((module) => <div key={module} className="flex justify-between border-b border-cyan-300/10 py-1"><span className="capitalize text-slate-300">{module}</span><span className="text-cyan-300">{permissions.some((p) => p === `${module}.write`) ? 'Xem / Thao tác' : 'Xem'}</span></div>) : <p className="text-slate-500">Chưa chọn profile.</p>}</div>
    </aside>
  )
}

function effectivePermissions(roles: SystemRole[]) {
  return Array.from(new Set(roles.flatMap((role) => role.permissions.map((permission) => permission.name)))).sort()
}

const inputClass = 'h-9 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-xs text-slate-100 outline-none focus:border-cyan-400'

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-cyan-300/10 bg-slate-950/25 p-3"><h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{title}</h3><div className="grid gap-3 md:grid-cols-2">{children}</div></section>
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="space-y-1 text-xs text-slate-400"><span className="flex items-center justify-between gap-2 font-medium text-slate-300">{label}{hint && <span className="font-normal text-slate-500">{hint}</span>}</span>{children}</label>
}

function ErrorText({ error }: { error: unknown }) {
  if (!error) return <span />
  return <p className="text-xs text-red-300">{apiErrorMessage(error)}</p>
}

function validateUserCreateForm(form: UserForm) {
  if (form.username.trim().length < USERNAME_MIN) return `Tên đăng nhập phải có ít nhất ${USERNAME_MIN} ký tự.`
  if (form.password.length < PASSWORD_MIN) return `Mật khẩu phải có ít nhất ${PASSWORD_MIN} ký tự.`
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Email không đúng định dạng.'
  if (form.roleIds.length === 0) return 'Vui lòng chọn ít nhất một vai trò.'
  return ''
}

function Avatar({ user, large = false }: { user: SystemUser; large?: boolean }) {
  const initials = displayName(user).slice(0, 2).toUpperCase()
  return <div className={`grid ${large ? 'h-12 w-12 text-base' : 'h-8 w-8 text-xs'} shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 font-semibold text-white shadow`}>{initials}</div>
}

function StatusBadge({ value }: { value: SystemUser['status'] }) {
  const cls = value === 'ACTIVE' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : value === 'BLOCKED' ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
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
  return <div className="rounded-lg border border-cyan-300/10 bg-slate-950/35 px-3 py-2"><p className="text-[11px] text-slate-500">{label}</p><p className="mt-1 text-xs text-white font-medium">{value || '—'}</p></div>
}
