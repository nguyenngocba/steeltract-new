import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Check,
  ChevronRight,
  Filter,
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
import { systemApi, type RoleMatrix, type SystemRole } from '@/modules/system/api/system.api'
import { getRoles } from '../api/roles.api'
import { formatQuantity } from '@/shared/utils/number-format'

const fmt = (value = 0) => formatQuantity(value, 0)
const actionLabels: Record<string, string> = {
  view: 'Xem',
  create: 'Thêm',
  update: 'Sửa',
  delete: 'Xóa',
  export: 'Xuất',
}

export function RolesPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selectedRole, setSelectedRole] = useState<SystemRole | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data = [], isLoading, refetch } = useQuery<SystemRole[]>({
    queryKey: ['system-roles'],
    queryFn: getRoles,
    refetchInterval: 15000,
  })
  const { data: matrix } = useQuery<RoleMatrix>({
    queryKey: ['system-role-matrix'],
    queryFn: systemApi.roleMatrix,
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
  const systemRoles = data.filter((role) => {
    const name = role.name.toLowerCase()
    return name.includes('admin') || name.includes('quản trị') || role.permissions.some((permission) => permission.name === '*')
  }).length
  const permissionTotal =
    new Set(data.flatMap((role) => role.permissions.map((permission) => permission.name))).size || matrix?.permissionCount || 0

  const isFiltered = Boolean(query || status !== 'all')

  return (
    <EnterpriseWorkspace
      eyebrow="Quản trị"
      title="Vai trò & Phân quyền"
      description="Quản lý vai trò và quyền truy cập hệ thống."
      breadcrumbs={['Quản trị', 'Vai trò & Phân quyền']}
      actions={
        <div className="flex items-center gap-2">
          <button className={moduleMutedButton} onClick={() => refetch()} type="button">
            <RefreshCw size={14} /> Làm mới
          </button>
          <button className={modulePrimaryButton} type="button">
            <Plus size={14} /> Thêm vai trò
          </button>
        </div>
      }
    >
      {/* 1. Operational KPIs */}
      <section className="grid gap-1 md:grid-cols-2 xl:grid-cols-4">
        <CockpitKpiCard
          title="Tổng vai trò"
          value={fmt(data.length)}
          note="Vai trò được khai báo"
          icon={<Shield size={18} />}
          tone="cyan"
          state={isLoading ? 'loading' : 'normal'}
        />
        <CockpitKpiCard
          title="Đang sử dụng"
          value={fmt(inUse)}
          note="Đã gán cho người dùng"
          icon={<UserCheck size={18} />}
          tone="emerald"
          state={isLoading ? 'loading' : 'normal'}
        />
        <CockpitKpiCard
          title="Chưa sử dụng"
          value={fmt(data.length - inUse)}
          note="Chưa có user"
          icon={<UserRound size={18} />}
          tone="amber"
          state={isLoading ? 'loading' : 'normal'}
        />
        <CockpitKpiCard
          title="Vai trò hệ thống"
          value={fmt(systemRoles)}
          note={`${fmt(permissionTotal)} quyền thực tế`}
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
            placeholder="Tìm theo tên vai trò, mô tả..."
            className="h-8 w-full bg-transparent text-xs text-slate-100 outline-none placeholder:text-slate-500"
          />
        </div>

        {/* Quick Status Chips */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'used', label: 'Đang sử dụng' },
            { id: 'unused', label: 'Chưa sử dụng' },
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

        {isFiltered && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setStatus('all')
            }}
            className="h-8 rounded-lg border border-red-500/30 bg-red-500/10 px-2 text-xs font-medium text-red-300 hover:bg-red-500/20 transition flex items-center gap-1 shrink-0"
            title="Xóa bộ lọc"
          >
            <X size={12} /> Xóa lọc
          </button>
        )}
      </section>

      {/* 3. Hero Table & Supporting Analytics */}
      <div className="grid gap-1 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3 flex flex-col justify-between">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Danh sách vai trò hệ thống</h2>
              <span className="text-xs text-slate-500">{fmt(filtered.length)} vai trò</span>
            </div>

            <CockpitTableShell className="min-h-[480px]">
              {filtered.length > 0 ? (
                <table className="w-full min-w-[700px] table-fixed text-[13px]">
                  <thead className="border-b border-cyan-400/10 bg-transparent text-slate-300">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium w-12">#</th>
                      <th className="px-3 py-2 text-left font-medium">Tên vai trò</th>
                      <th className="px-3 py-2 text-left font-medium">Mô tả</th>
                      <th className="px-3 py-2 text-center font-medium">Số user</th>
                      <th className="px-3 py-2 text-left font-medium">Trạng thái</th>
                      <th className="px-3 py-2 text-right font-medium">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((role, index) => (
                      <tr
                        key={role.id}
                        onClick={() => setSelectedRole(role)}
                        className="cursor-pointer border-b border-cyan-300/10 text-slate-300 hover:bg-cyan-300/[0.055] transition"
                      >
                        <td className="px-3 py-2 text-slate-500 font-mono">{(page - 1) * pageSize + index + 1}</td>
                        <td className="px-3 py-2 font-medium text-white">
                          <RoleCode name={role.name} />
                        </td>
                        <td className="px-3 py-2 text-slate-400 truncate">{role.description ?? '—'}</td>
                        <td className="px-3 py-2 text-center font-mono text-cyan-300 font-semibold">{fmt(role.userCount)}</td>
                        <td className="px-3 py-2">
                          <StatusBadge used={role.userCount > 0} />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedRole(role)
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
                  title="Chưa có dữ liệu vai trò"
                  description="Không tìm thấy vai trò thỏa mãn điều kiện lọc."
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
          <RoleDetailPanel role={selectedRole ?? data[0] ?? null} matrix={matrix} />
        </aside>
      </div>
    </EnterpriseWorkspace>
  )
}

function RoleDetailPanel({ role, matrix }: { role: SystemRole | null; matrix?: RoleMatrix }) {
  if (!role) return <aside className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-4 text-xs text-slate-500">Chưa chọn vai trò.</aside>

  const modules = matrix?.modules ?? []
  const actions = matrix?.actions ?? []
  const permissionSet = new Set(role.permissions.map((permission) => permission.name.toLowerCase()))

  return (
    <div className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3 space-y-3">
      <div className="flex items-start justify-between gap-2 border-b border-cyan-300/10 pb-2">
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chi tiết Vai trò</h3>
          <div className="mt-1 font-bold text-white text-base">{role.name}</div>
          <p className="mt-1 text-xs text-slate-400">{role.description ?? 'Chưa có mô tả cho vai trò này.'}</p>
        </div>
        <StatusBadge used={role.userCount > 0} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Info label="Số người dùng" value={fmt(role.userCount)} />
        <Info label="Số quyền trực tiếp" value={fmt(role.permissions.length)} />
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-white">Ma trận Phân quyền</h4>
          <span className="text-[10px] text-slate-500">Bảng permissions</span>
        </div>

        <div className="max-h-[360px] overflow-y-auto rounded-xl border border-cyan-300/10 bg-slate-950/45">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-900 text-slate-400">
              <tr>
                <th className="px-2 py-1.5 text-left">Module</th>
                {actions.map((action) => (
                  <th key={action} className="px-1 py-1.5 text-center font-mono text-[10px]">
                    {actionLabels[action] ?? action}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((module) => (
                <tr key={module.key} className="border-t border-cyan-300/10 hover:bg-white/5">
                  <td className="px-2 py-1.5 text-slate-300 font-medium truncate max-w-[120px]">{module.label}</td>
                  {actions.map((action) => {
                    const allowedValue = allowed(role, permissionSet, module.key, action)
                    return (
                      <td key={action} className="px-1 py-1.5 text-center">
                        <span
                          className={`inline-grid h-4 w-4 place-items-center rounded ${
                            allowedValue ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'bg-white/5 text-slate-600'
                          }`}
                        >
                          {allowedValue ? <Check size={11} /> : <X size={11} />}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function allowed(role: SystemRole, permissionSet: Set<string>, moduleKey: string, action: string) {
  const roleName = role.name.toLowerCase()
  const compact = moduleKey.replaceAll('-', '.')
  return (
    permissionSet.has('*') ||
    permissionSet.has(`${moduleKey}.${action}`) ||
    permissionSet.has(`${compact}.${action}`) ||
    permissionSet.has(`${action}.${moduleKey}`) ||
    permissionSet.has(`${action}.${compact}`) ||
    roleName.includes('admin') ||
    roleName.includes('quản trị')
  )
}

function RoleCode({ name }: { name: string }) {
  const code = name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 4)
    .toUpperCase()
  return (
    <div className="flex items-center gap-2">
      <span className="rounded border border-purple-500/40 bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-purple-300">
        {code}
      </span>
      <span className="font-semibold text-white">{name}</span>
    </div>
  )
}

function StatusBadge({ used }: { used: boolean }) {
  return (
    <span
      className={`rounded-lg border px-2 py-0.5 text-[11px] ${
        used ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
      }`}
    >
      {used ? 'Đang sử dụng' : 'Chưa sử dụng'}
    </span>
  )
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg border border-cyan-300/10 bg-slate-950/35 px-3 py-2">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 text-xs text-white font-medium">{value || '—'}</p>
    </div>
  )
}
