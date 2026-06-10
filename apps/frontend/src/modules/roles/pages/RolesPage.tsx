import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { LucideIcon } from 'lucide-react'
import { Check, Edit, MoreHorizontal, Plus, RefreshCw, Search, Shield, ShieldCheck, UserCheck, UserRound, X } from 'lucide-react'

import { OperationalShell } from '@/shared/layouts/OperationalShell'
import {
  inventoryInput,
  inventoryMutedButton,
  inventoryPanel,
  inventoryTableHead,
  inventoryTableRow,
  inventoryTableShell,
} from '@/modules/inventory/components/InventoryVisuals'
import { systemApi, type RoleMatrix, type SystemRole } from '@/modules/system/api/system.api'
import { getRoles } from '../api/roles.api'

const fmt = (value = 0) => new Intl.NumberFormat('vi-VN').format(value)
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
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data = [], refetch } = useQuery<SystemRole[]>({
    queryKey: ['system-roles'],
    queryFn: getRoles,
    refetchInterval: 15000,
  })
  const { data: matrix } = useQuery<RoleMatrix>({
    queryKey: ['system-role-matrix'],
    queryFn: systemApi.roleMatrix,
  })
  const rows = useMemo(() => data.filter((role) => {
    if (status === 'used' && role.userCount <= 0) return false
    if (status === 'unused' && role.userCount > 0) return false
    return `${role.name} ${role.description ?? ''}`.toLowerCase().includes(query.toLowerCase())
  }), [data, query, status])
  const selected = rows.find((role) => role.id === selectedId) ?? rows[0] ?? null
  const inUse = data.filter((role) => role.userCount > 0).length
  const systemRoles = data.filter((role) => {
    const name = role.name.toLowerCase()
    return name.includes('admin') || name.includes('quản trị') || role.permissions.some((permission) => permission.name === '*')
  }).length
  const permissionTotal = new Set(data.flatMap((role) => role.permissions.map((permission) => permission.name))).size || matrix?.permissionCount || 0

  return (
    <OperationalShell>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_30%),linear-gradient(135deg,#06111e_0%,#081827_52%,#0b1220_100%)] p-4 text-slate-100">
        <header className="flex flex-wrap items-end justify-between gap-3 pb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Vai trò & Phân quyền</h1>
            <p className="mt-1 text-sm text-slate-400">Quản lý vai trò và quyền truy cập hệ thống</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500">
            <Plus size={16} /> Thêm vai trò
          </button>
        </header>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <IconKpi icon={Shield} title="Tổng vai trò" value={fmt(data.length)} note="Vai trò" />
          <IconKpi icon={UserCheck} title="Đang sử dụng" value={fmt(inUse)} note="Có người dùng" tone="emerald" />
          <IconKpi icon={UserRound} title="Chưa sử dụng" value={fmt(data.length - inUse)} note="Chưa gán user" tone="amber" />
          <IconKpi icon={ShieldCheck} title="Vai trò hệ thống" value={fmt(systemRoles)} note={`${fmt(permissionTotal)} quyền thật`} tone="purple" />
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_430px]">
          <section className={inventoryTableShell}>
            <div className="flex flex-wrap gap-2 border-b border-white/10 p-3">
              <div className="flex min-w-[280px] flex-1 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/45 px-3">
                <Search size={15} className="text-cyan-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm vai trò..." className="h-9 w-full bg-transparent text-xs outline-none placeholder:text-slate-500" />
              </div>
              <select value={status} onChange={(event) => setStatus(event.target.value)} className={inventoryInput}>
                <option value="all">Trạng thái: Tất cả</option>
                <option value="used">Đang sử dụng</option>
                <option value="unused">Chưa sử dụng</option>
              </select>
              <button onClick={() => refetch()} className={inventoryMutedButton}>
                <RefreshCw size={15} /> Làm mới
              </button>
            </div>
            <table className="w-full text-sm">
              <thead className={inventoryTableHead}>
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Tên vai trò</th>
                  <th className="px-4 py-3 text-left">Mô tả</th>
                  <th className="px-4 py-3 text-left">Số người dùng</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((role, index) => (
                  <tr key={role.id} onClick={() => setSelectedId(role.id)} className={`${inventoryTableRow} cursor-pointer ${selected?.id === role.id ? 'bg-blue-500/10' : ''}`}>
                    <td className="px-4 py-3 text-slate-400">{index + 1}</td>
                    <td className="px-4 py-3">
                      <RoleCode name={role.name} />
                    </td>
                    <td className="px-4 py-3 text-slate-400">{role.description ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-200">{fmt(role.userCount)}</td>
                    <td className="px-4 py-3"><Status used={role.userCount > 0} /></td>
                    <td className="px-4 py-3 text-right">
                      <button className="rounded-lg bg-white/[0.055] p-2 text-slate-300 hover:text-cyan-200"><Edit size={15} /></button>
                      <button className="ml-1 rounded-lg bg-white/[0.055] p-2 text-slate-300 hover:text-cyan-200"><MoreHorizontal size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-white/10 px-4 py-3 text-xs text-slate-400">Hiển thị 1 - {rows.length}/{rows.length} vai trò</div>
          </section>
          <RoleDetail role={selected} matrix={matrix} />
        </div>
      </main>
    </OperationalShell>
  )
}

function RoleDetail({ role, matrix }: { role: SystemRole | null; matrix?: RoleMatrix }) {
  if (!role) return <aside className={`${inventoryPanel} p-4 text-sm text-slate-500`}>Chưa có vai trò.</aside>
  const modules = matrix?.modules ?? []
  const actions = matrix?.actions ?? []
  const permissionSet = new Set(role.permissions.map((permission) => permission.name.toLowerCase()))

  return (
    <aside className={`${inventoryPanel} overflow-hidden`}>
      <section className="border-b border-white/10 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Chi tiết vai trò</h2>
            <div className="mt-3"><RoleCode name={role.name} /></div>
            <p className="mt-3 text-sm leading-5 text-slate-400">{role.description ?? 'Chưa có mô tả cho vai trò này.'}</p>
          </div>
          <button className={inventoryMutedButton}><Edit size={15} /> Chỉnh sửa</button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Info k="Số người dùng" v={fmt(role.userCount)} />
          <Info k="Số quyền" v={fmt(role.permissions.length)} />
        </div>
      </section>

      <section className="p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-white">Phân quyền</h3>
          <span className="text-xs text-slate-500">Dữ liệu từ bảng permissions</span>
        </div>
        <div className="max-h-[540px] overflow-auto rounded-xl border border-white/10">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-950 text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left">Module</th>
                {actions.map((action) => <th key={action} className="px-2 py-2 text-center">{actionLabels[action] ?? action}</th>)}
              </tr>
            </thead>
            <tbody>
              {modules.map((module) => (
                <tr key={module.key} className="border-t border-white/10">
                  <td className="px-3 py-2 text-slate-300">{module.label}</td>
                  {actions.map((action) => {
                    const allowedValue = allowed(role, permissionSet, module.key, action)
                    return (
                      <td key={action} className="px-2 py-2 text-center">
                        <span className={`inline-grid h-5 w-5 place-items-center rounded ${allowedValue ? 'bg-blue-600 text-white' : 'bg-white/[0.06] text-slate-600'}`}>
                          {allowedValue ? <Check size={13} /> : <X size={13} />}
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
    </aside>
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
  const code = name.split(/\s+/).map((part) => part[0]).join('').slice(0, 4).toUpperCase()
  return (
    <div className="flex items-center gap-3">
      <span className="rounded-lg border border-purple-500/40 bg-purple-500/10 px-2 py-1 text-xs font-semibold text-purple-300">{code}</span>
      <span className="font-medium text-white">{name}</span>
    </div>
  )
}

function Status({ used }: { used: boolean }) {
  return (
    <span className={`rounded-lg border px-2 py-1 text-xs ${used ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/40 bg-amber-500/10 text-amber-300'}`}>
      {used ? 'Đang sử dụng' : 'Chưa sử dụng'}
    </span>
  )
}

function IconKpi({ icon: Icon, title, value, note, tone = 'blue' }: { icon: LucideIcon; title: string; value: string; note: string; tone?: 'blue' | 'emerald' | 'amber' | 'purple' }) {
  const color = {
    blue: 'text-blue-300 bg-blue-500/15',
    emerald: 'text-emerald-300 bg-emerald-500/15',
    amber: 'text-amber-300 bg-amber-500/15',
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

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
      <p className="text-xs text-slate-500">{k}</p>
      <p className="mt-1 font-semibold text-white">{v}</p>
    </div>
  )
}
