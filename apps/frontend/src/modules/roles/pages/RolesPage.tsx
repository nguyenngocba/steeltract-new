import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  ChevronRight,
  Copy,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  UserCheck,
  UserRound,
  X,
} from 'lucide-react'

import { EnterpriseWorkspace } from '@/shared/ui/enterprise'
import {
  CockpitEmptyState,
  CockpitKpiCard,
  CockpitTableShell,
  DataTablePagination,
} from '@/shared/ui/cockpit'
import {
  ModuleDetailDrawer,
  moduleMutedButton,
  modulePrimaryButton,
} from '@/shared/ui/modules'
import { systemApi, type RoleMatrix, type SystemRole } from '@/modules/system/api/system.api'
import { getRoles } from '../api/roles.api'
import { formatQuantity } from '@/shared/utils/number-format'
import { ActionGuard, usePermission } from '@/shared/permissions/PermissionGuard'

const fmt = (value = 0) => formatQuantity(value, 0)

type RoleForm = {
  name: string
  description: string
  permissionIds: string[]
}

const emptyRoleForm: RoleForm = {
  name: '',
  description: '',
  permissionIds: [],
}

export function RolesPage() {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selectedRole, setSelectedRole] = useState<SystemRole | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState<RoleForm>(emptyRoleForm)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const canManageRoles = usePermission('roles.edit')

  const { data = [], isLoading, refetch } = useQuery<SystemRole[]>({
    queryKey: ['system-roles'],
    queryFn: getRoles,
    refetchInterval: 15000,
  })
  const { data: matrix } = useQuery<RoleMatrix>({
    queryKey: ['system-role-matrix'],
    queryFn: systemApi.roleMatrix,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['system-roles'] })
    queryClient.invalidateQueries({ queryKey: ['system-role-matrix'] })
    queryClient.invalidateQueries({ queryKey: ['system-users'] })
  }

  const createRole = useMutation({
    mutationFn: systemApi.createRole,
    onSuccess: (role) => {
      invalidate()
      setSelectedRole(role)
      setCreateOpen(false)
      setForm(emptyRoleForm)
    },
  })
  const replacePermissions = useMutation({
    mutationFn: systemApi.replaceRolePermissions,
    onSuccess: (role) => {
      invalidate()
      setSelectedRole(role)
    },
  })

  const filtered = useMemo(
    () =>
      data.filter((role) => {
        if (status === 'used' && role.userCount <= 0) return false
        if (status === 'unused' && role.userCount > 0) return false
        return `${role.name} ${role.description ?? ''}`.toLowerCase().includes(query.toLowerCase())
      }),
    [data, query, status],
  )

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const inUse = data.filter((role) => role.userCount > 0).length
  const systemRoles = data.filter((role) => role.permissions.some((permission) => permission.name === 'rbac.write')).length
  const permissionTotal = matrix?.permissionCount ?? new Set(data.flatMap((role) => role.permissions.map((permission) => permission.name))).size

  const isFiltered = Boolean(query || status !== 'all')

  return (
    <EnterpriseWorkspace
      eyebrow="Quản trị"
      title="Vai trò / Profile phân quyền"
      description="Quản lý profile phân quyền tái sử dụng từ catalog permission thật."
      breadcrumbs={['Quản trị', 'Vai trò & Phân quyền']}
      actions={
        <div className="flex items-center gap-2">
          <button className={moduleMutedButton} onClick={() => refetch()} type="button">
            <RefreshCw size={14} /> Làm mới
          </button>
          <ActionGuard permission="roles.edit">
            <button className={modulePrimaryButton} type="button" onClick={() => { setForm(emptyRoleForm); setCreateOpen(true) }}>
              <Plus size={14} /> Thêm vai trò
            </button>
          </ActionGuard>
        </div>
      }
    >
      <section className="grid gap-1 md:grid-cols-2 xl:grid-cols-4">
        <CockpitKpiCard title="Tổng profile" value={fmt(data.length)} note="Vai trò được khai báo" icon={<Shield size={18} />} tone="cyan" state={isLoading ? 'loading' : 'normal'} />
        <CockpitKpiCard title="Đang sử dụng" value={fmt(inUse)} note="Đã gán cho người dùng" icon={<UserCheck size={18} />} tone="emerald" state={isLoading ? 'loading' : 'normal'} />
        <CockpitKpiCard title="Chưa sử dụng" value={fmt(data.length - inUse)} note="Chưa có user" icon={<UserRound size={18} />} tone="amber" state={isLoading ? 'loading' : 'normal'} />
        <CockpitKpiCard title="Profile quản trị" value={fmt(systemRoles)} note={`${fmt(permissionTotal)} quyền thực tế`} icon={<ShieldCheck size={18} />} tone="purple" state={isLoading ? 'loading' : 'normal'} />
      </section>

      <section className="my-1 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-2">
        <div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/45 px-2">
          <Search size={14} className="text-cyan-300 shrink-0" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên vai trò, mô tả..." className="h-8 w-full bg-transparent text-xs text-slate-100 outline-none placeholder:text-slate-500" />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {[{ id: 'all', label: 'Tất cả' }, { id: 'used', label: 'Đang sử dụng' }, { id: 'unused', label: 'Chưa sử dụng' }].map((chip) => (
            <button key={chip.id} type="button" onClick={() => setStatus(chip.id)} className={`h-8 whitespace-nowrap rounded-lg px-2.5 text-xs transition ${status === chip.id ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 font-semibold' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/5'}`}>
              {chip.label}
            </button>
          ))}
        </div>

        {isFiltered && <button type="button" onClick={() => { setQuery(''); setStatus('all') }} className="h-8 rounded-lg border border-red-500/30 bg-red-500/10 px-2 text-xs font-medium text-red-300 hover:bg-red-500/20 transition flex items-center gap-1 shrink-0" title="Xóa bộ lọc"><X size={12} /> Xóa lọc</button>}
      </section>

      <div className="grid gap-1 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3 flex flex-col justify-between">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Danh sách profile phân quyền</h2>
              <span className="text-xs text-slate-500">{fmt(filtered.length)} profile</span>
            </div>
            <CockpitTableShell className="min-h-[480px]">
              {filtered.length > 0 ? (
                <table className="w-full min-w-[760px] table-fixed text-[13px]">
                  <thead className="border-b border-cyan-400/10 bg-transparent text-slate-300"><tr><th className="px-3 py-2 text-left font-medium w-12">#</th><th className="px-3 py-2 text-left font-medium">Tên profile</th><th className="px-3 py-2 text-left font-medium">Mô tả</th><th className="px-3 py-2 text-center font-medium">Users</th><th className="px-3 py-2 text-center font-medium">Permissions</th><th className="px-3 py-2 text-left font-medium">Trạng thái</th><th className="px-3 py-2 text-right font-medium">Thao tác</th></tr></thead>
                  <tbody>
                    {paginated.map((role, index) => (
                      <tr key={role.id} onClick={() => setSelectedRole(role)} className="cursor-pointer border-b border-cyan-300/10 text-slate-300 hover:bg-cyan-300/[0.055] transition">
                        <td className="px-3 py-2 text-slate-500 font-mono">{(page - 1) * pageSize + index + 1}</td>
                        <td className="px-3 py-2 font-medium text-white"><RoleCode name={role.name} /></td>
                        <td className="px-3 py-2 text-slate-400 truncate">{role.description ?? '—'}</td>
                        <td className="px-3 py-2 text-center font-mono text-cyan-300 font-semibold">{fmt(role.userCount)}</td>
                        <td className="px-3 py-2 text-center font-mono text-slate-300">{fmt(role.permissions.length)}</td>
                        <td className="px-3 py-2"><StatusBadge used={role.userCount > 0} /></td>
                        <td className="px-3 py-2 text-right"><button type="button" onClick={(e) => { e.stopPropagation(); setSelectedRole(role) }} className="inline-flex items-center gap-0.5 rounded bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/20 transition">Chi tiết <ChevronRight size={12} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <CockpitEmptyState title="Chưa có dữ liệu vai trò" description="Không tìm thấy vai trò thỏa mãn điều kiện lọc." />}
            </CockpitTableShell>
          </div>
          {filtered.length > 0 && <DataTablePagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={setPageSize} pageSizeOptions={[10, 20, 50]} />}
        </section>

        <aside className="space-y-1">
          <RoleDetailPanel
            role={selectedRole ?? data[0] ?? null}
            matrix={matrix}
            saving={replacePermissions.isPending}
            error={replacePermissions.error}
            canManage={canManageRoles}
            onClone={(role) => {
              setForm({
                name: `${role.name} Copy`,
                description: role.description ?? '',
                permissionIds: role.permissions.map((permission) => permission.id),
              })
              setCreateOpen(true)
            }}
            onReplacePermissions={(roleId, permissionIds) => replacePermissions.mutate({ id: roleId, permissionIds })}
          />
        </aside>
      </div>

      <CreateRoleModal open={createOpen} form={form} matrix={matrix} saving={createRole.isPending} error={createRole.error} onClose={() => setCreateOpen(false)} onChange={setForm} onSubmit={() => createRole.mutate({ name: form.name, description: form.description || undefined, permissionIds: form.permissionIds })} />
    </EnterpriseWorkspace>
  )
}

function CreateRoleModal({ open, form, matrix, saving, error, onClose, onChange, onSubmit }: { open: boolean; form: RoleForm; matrix?: RoleMatrix; saving: boolean; error: unknown; onClose: () => void; onChange: (form: RoleForm) => void; onSubmit: () => void }) {
  if (!open) return null
  const permissions = matrix?.permissions ?? []
  const selected = permissions.filter((permission) => form.permissionIds.includes(permission.id))
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-cyan-300/25 bg-[#07111f] shadow-2xl shadow-cyan-950/40">
        <header className="flex items-start justify-between border-b border-cyan-300/15 p-4"><div><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">Thêm vai trò</p><h2 className="mt-1 text-lg font-semibold text-white">Tạo profile phân quyền</h2></div><button type="button" onClick={onClose} className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10"><X size={16} /></button></header>
        <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto p-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-3">
            <FormSection title="Thông tin profile"><Field label="Tên profile *"><input className={inputClass} value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} /></Field><Field label="Mô tả"><input className={inputClass} value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} /></Field></FormSection>
            <FormSection title="Preset ERP">
              <Field label="Khởi tạo từ profile chuẩn">
                <select
                  className={inputClass}
                  defaultValue=""
                  onChange={(event) => {
                    const preset = matrix?.presets.find((item) => item.key === event.target.value)
                    if (!preset) return
                    const permissionNames = new Set(preset.permissions)
                    onChange({
                      ...form,
                      permissionIds: permissions
                        .filter((permission) => permissionNames.has(permission.name))
                        .map((permission) => permission.id),
                    })
                  }}
                >
                  <option value="">Chọn preset...</option>
                  {(matrix?.presets ?? []).map((preset) => (
                    <option key={preset.key} value={preset.key}>{preset.label}</option>
                  ))}
                </select>
              </Field>
            </FormSection>
            <PermissionPicker matrix={matrix} selectedIds={form.permissionIds} onChange={(permissionIds) => onChange({ ...form, permissionIds })} />
          </div>
          <EffectiveRolePreview permissions={selected.map((permission) => permission.name)} roleName={form.name} />
        </div>
        <footer className="flex items-center justify-between border-t border-cyan-300/15 p-4"><ErrorText error={error} /><div className="flex gap-2"><button className={moduleMutedButton} type="button" onClick={onClose}>Hủy</button><button className={modulePrimaryButton} type="button" disabled={saving || !form.name || form.permissionIds.length === 0} onClick={onSubmit}>{saving ? 'Đang tạo...' : 'Tạo profile'}</button></div></footer>
      </div>
    </div>
  )
}

function RoleDetailPanel({ role, matrix, saving, error, canManage, onClone, onReplacePermissions }: { role: SystemRole | null; matrix?: RoleMatrix; saving: boolean; error: unknown; canManage: boolean; onClone: (role: SystemRole) => void; onReplacePermissions: (roleId: string, permissionIds: string[]) => void }) {
  const [permissionIds, setPermissionIds] = useState<string[]>([])
  useEffect(() => {
    setPermissionIds(role?.permissions.map((permission) => permission.id) ?? [])
  }, [role])
  if (!role) return <aside className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-4 text-xs text-slate-500">Chưa chọn vai trò.</aside>
  return (
    <div className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3 space-y-3">
      <div className="flex items-start justify-between gap-2 border-b border-cyan-300/10 pb-2"><div><h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chi tiết Profile</h3><div className="mt-1 font-bold text-white text-base">{role.name}</div><p className="mt-1 text-xs text-slate-400">{role.description ?? 'Chưa có mô tả cho profile này.'}</p></div><StatusBadge used={role.userCount > 0} /></div>
      <div className="grid grid-cols-2 gap-2 text-xs"><Info label="Số người dùng" value={fmt(role.userCount)} /><Info label="Số quyền trực tiếp" value={fmt(role.permissions.length)} /></div>
      <PermissionPicker matrix={matrix} selectedIds={permissionIds} onChange={setPermissionIds} compact readOnly={!canManage} />
      <EffectiveRolePreview permissions={(matrix?.permissions ?? []).filter((permission) => permissionIds.includes(permission.id)).map((permission) => permission.name)} roleName={role.name} compact />
      <ErrorText error={error} />
      {canManage && (
        <div className="flex gap-2">
          <button className={moduleMutedButton} type="button" onClick={() => onClone(role)}><Copy size={14} /> Clone</button>
          <button className={modulePrimaryButton} type="button" disabled={saving} onClick={() => onReplacePermissions(role.id, permissionIds)}>{saving ? 'Đang lưu...' : 'Lưu permission matrix'}</button>
        </div>
      )}
    </div>
  )
}

function PermissionPicker({ matrix, selectedIds, onChange, compact = false, readOnly = false }: { matrix?: RoleMatrix; selectedIds: string[]; onChange: (ids: string[]) => void; compact?: boolean; readOnly?: boolean }) {
  const modules = matrix?.modules ?? []
  const actions = matrix?.actions ?? []
  const toggleMany = (ids: string[]) => {
    if (readOnly) return
    const allSelected = ids.every((id) => selectedIds.includes(id))
    onChange(allSelected
      ? selectedIds.filter((id) => !ids.includes(id))
      : Array.from(new Set([...selectedIds, ...ids])))
  }
  return (
    <FormSection title="Permission Matrix">
      <div className={`md:col-span-2 space-y-2 ${compact ? 'max-h-[280px]' : 'max-h-[420px]'} overflow-y-auto pr-1`}>
        {!compact && !readOnly && (
          <div className="flex flex-wrap gap-1 border-b border-cyan-300/10 pb-2">
            <span className="mr-1 py-1 text-[10px] font-semibold uppercase text-slate-500">Chọn cột:</span>
            {actions.map((action) => {
              const ids = modules.flatMap((module) => module.permissions.filter((permission) => permission.action === action).map((permission) => permission.id))
              if (!ids.length) return null
              const active = ids.every((id) => selectedIds.includes(id))
              return <button key={action} type="button" onClick={() => toggleMany(ids)} className={`rounded border px-2 py-1 text-[10px] ${active ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-200' : 'border-white/10 bg-white/[0.03] text-slate-400'}`}>{action}</button>
            })}
          </div>
        )}
        {modules.map((module) => (
          <div key={module.key} className="rounded-xl border border-cyan-300/10 bg-slate-950/35 p-2">
            <div className="mb-2 flex items-center justify-between"><b className="text-xs text-white">{module.label}</b>{!readOnly && <button type="button" onClick={() => toggleMany(module.permissions.map((permission) => permission.id))} className="text-[10px] font-semibold text-cyan-300 hover:text-cyan-100">Chọn hàng ({module.permissions.length})</button>}</div>
            <div className="grid gap-1 md:grid-cols-2">
              {module.permissions.map((permission) => (
                <label key={permission.id} className={`flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1.5 text-xs text-slate-300 ${readOnly ? '' : 'cursor-pointer hover:border-cyan-300/30'}`}>
                  <input type="checkbox" disabled={readOnly} checked={selectedIds.includes(permission.id)} onChange={(event) => onChange(event.target.checked ? [...selectedIds, permission.id] : selectedIds.filter((id) => id !== permission.id))} />
                  <span><span className="font-mono text-cyan-300">{permission.name}</span><span className="ml-1 text-slate-500">({permission.capability})</span></span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </FormSection>
  )
}

function EffectiveRolePreview({ permissions, roleName, compact = false }: { permissions: string[]; roleName: string; compact?: boolean }) {
  const modules = Array.from(new Set(permissions.map((permission) => permission.split('.')[0]))).sort()
  const reads = permissions.filter((permission) => permission.endsWith('.read')).length
  const writes = permissions.filter((permission) => permission.endsWith('.write')).length
  const admin = permissions.filter((permission) => permission.startsWith('rbac.') || permission.includes('approve')).length
  return (
    <aside className={`rounded-2xl border border-cyan-300/10 bg-slate-950/35 p-3 ${compact ? '' : 'space-y-3'}`}>
      <h3 className="text-sm font-semibold text-white">Effective access preview</h3>
      <div className="grid grid-cols-2 gap-2 text-xs"><Info label="Profile" value={roleName || '—'} /><Info label="Modules" value={fmt(modules.length)} /><Info label="Quyền đọc" value={fmt(reads)} /><Info label="Quyền thao tác" value={fmt(writes)} /><Info label="Quản trị / duyệt" value={fmt(admin)} /><Info label="Tổng quyền" value={fmt(permissions.length)} /></div>
      <div className="mt-3 space-y-1 text-xs">{modules.length ? modules.map((module) => <div key={module} className="flex justify-between border-b border-cyan-300/10 py-1"><span className="capitalize text-slate-300">{module}</span><span className="text-cyan-300">{permissions.some((permission) => permission === `${module}.write`) ? 'Xem / Thao tác' : 'Xem'}</span></div>) : <p className="text-slate-500">Chưa chọn permission.</p>}</div>
    </aside>
  )
}

function RoleCode({ name }: { name: string }) {
  const code = name.split(/\s+/).map((part) => part[0]).join('').slice(0, 4).toUpperCase()
  return <div className="flex items-center gap-2"><span className="rounded border border-purple-500/40 bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-purple-300">{code}</span><span className="font-semibold text-white">{name}</span></div>
}

function StatusBadge({ used }: { used: boolean }) {
  return <span className={`rounded-lg border px-2 py-0.5 text-[11px] ${used ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}>{used ? 'Đang sử dụng' : 'Chưa sử dụng'}</span>
}

const inputClass = 'h-9 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-xs text-slate-100 outline-none focus:border-cyan-400'

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-cyan-300/10 bg-slate-950/25 p-3"><h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{title}</h3><div className="grid gap-3 md:grid-cols-2">{children}</div></section>
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="space-y-1 text-xs text-slate-400"><span className="font-medium text-slate-300">{label}</span>{children}</label>
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return <div className="rounded-lg border border-cyan-300/10 bg-slate-950/35 px-3 py-2"><p className="text-[11px] text-slate-500">{label}</p><p className="mt-1 text-xs text-white font-medium">{value || '—'}</p></div>
}

function ErrorText({ error }: { error: unknown }) {
  if (!error) return <span />
  return <p className="text-xs text-red-300">{error instanceof Error ? error.message : 'Không thực hiện được thao tác.'}</p>
}
