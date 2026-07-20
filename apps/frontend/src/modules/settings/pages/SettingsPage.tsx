import { type ReactNode, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Building2, CheckCircle2, DatabaseBackup, Edit3, FileDigit, Globe2, Link2, Plus, Save, Search, Settings, ShieldCheck, SlidersHorizontal, Trash2, Workflow, XCircle } from 'lucide-react'

import { EnterpriseWorkspace } from '@/shared/ui/enterprise'
import { api } from '@/lib/api'
import { systemApi, type WorkflowCheck } from '@/modules/system/api/system.api'
import { useCategories } from '@/modules/inventory/hooks/useCategories'
import { useInventoryItems } from '@/modules/inventory/hooks/useInventoryItems'
import { useMaterialTypes } from '@/modules/inventory/hooks/useMaterialTypes'
import { useUnits } from '@/modules/inventory/hooks/useUnits'
import { formatDateTime, formatQuantity } from '@/shared/utils/number-format'

type Tab = 'overview' | 'general' | 'organization' | 'permissions' | 'security' | 'monitoring' | 'master' | 'integrations' | 'notifications' | 'backup' | 'reports' | 'logs'

const tabs: Array<[Tab, string]> = [
  ['overview', 'Tổng quan'],
  ['general', 'Cấu hình chung'],
  ['organization', 'Tổ chức'],
  ['permissions', 'Phân quyền'],
  ['security', 'Bảo mật'],
  ['monitoring', 'Giám sát'],
  ['master', 'Danh mục / Đơn vị'],
  ['integrations', 'Tích hợp'],
  ['notifications', 'Thông báo'],
  ['backup', 'Sao lưu & Phục hồi'],
  ['reports', 'Trung tâm báo cáo'],
  ['logs', 'Nhật ký cấu hình'],
]
const panel = 'rounded-lg border border-white/10 bg-slate-950/55 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl'
const input = 'h-9 rounded-lg border border-white/10 bg-slate-950/65 px-3 text-xs text-slate-100 outline-none transition focus:border-blue-400'
const textarea = 'min-h-20 rounded-lg border border-white/10 bg-slate-950/65 px-3 py-2 text-xs text-slate-100 outline-none transition focus:border-blue-400'
const actionButton = 'inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]'
const primaryButton = 'inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500 disabled:opacity-50'
const fmt = (value = 0) => formatQuantity(value, 0)
const date = (value?: string) => value ? formatDateTime(value) : '-'

type CategoryForm = {
  id?: string
  code: string
  name: string
  description: string
}

type MaterialTypeForm = CategoryForm & {
  categoryId: string
}

type UnitForm = {
  id?: string
  code: string
  name: string
  symbol: string
  category: string
  precision: string
}

const emptyCategory: CategoryForm = { code: '', name: '', description: '' }
const emptyMaterialType: MaterialTypeForm = { code: '', name: '', description: '', categoryId: '' }
const emptyUnit: UnitForm = { code: '', name: '', symbol: '', category: 'WEIGHT', precision: '0' }

export function SettingsPage() {
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

  return <EnterpriseWorkspace
    eyebrow="Quản trị"
    title="Cài đặt hệ thống"
    description="Quản lý toàn bộ cấu hình và thiết lập hệ thống"
    breadcrumbs={['Quản trị', 'Cài đặt']}
    actions={<button className={primaryButton}><Save size={16} />Lưu thay đổi</button>}
  >
      <Overview data={data} workflow={workflow} category={category} stats={stats} />
  </EnterpriseWorkspace>
}

type PlatformCapability = {
  name: string
  owner: string
  readSource: string
  nextStep: string
}

const organizationCapabilities: PlatformCapability[] = [
  { name: 'Company', owner: 'Administration', readSource: 'System overview', nextStep: 'Kết nối company profile với form cấu hình chung.' },
  { name: 'Plants / Factories', owner: 'Organization', readSource: 'Chưa có read contract riêng', nextStep: 'Tạo backend contract trước khi nhập dữ liệu nhà máy.' },
  { name: 'Warehouses', owner: 'Inventory', readSource: 'Inventory warehouse/location contracts', nextStep: 'Liên kết warehouse vào organization view.' },
  { name: 'Teams / Shifts / Calendars', owner: 'Organization', readSource: 'Chưa có read contract riêng', nextStep: 'Định nghĩa lịch làm việc trước khi mở UI nhập ca.' },
]

const securityCapabilities: PlatformCapability[] = [
  { name: 'Audit Logs', owner: 'Security', readSource: '/system/activity-logs', nextStep: 'Dùng System Logs cho audit hiện tại.' },
  { name: 'User Sessions', owner: 'Security', readSource: 'Chưa có session read contract', nextStep: 'Expose session read model trước khi quản trị phiên.' },
  { name: 'Password Policy', owner: 'Security', readSource: 'Chưa có policy read contract', nextStep: 'Khóa rule policy trong backend trước khi cấu hình.' },
  { name: 'MFA / Devices / IP Whitelist', owner: 'Security', readSource: 'Chưa có backend contract', nextStep: 'Giữ empty state; không dựng trạng thái giả.' },
  { name: 'API Tokens', owner: 'Security', readSource: 'Chưa có token registry', nextStep: 'Thiết kế token ownership và audit trước khi mở UI.' },
]

const monitoringCapabilities: PlatformCapability[] = [
  { name: 'Health', owner: 'Operations Center', readSource: '/operations-center', nextStep: 'Dùng Operations Center làm runtime health workspace.' },
  { name: 'Jobs / Queues', owner: 'Background Engine', readSource: 'Operations overview', nextStep: 'Điều hướng operator sang Operations Center Jobs.' },
  { name: 'Notifications', owner: 'System', readSource: '/system/notifications', nextStep: 'Dùng Notification Center hiện có.' },
  { name: 'Scheduler / Webhooks / Email Queue', owner: 'Monitoring', readSource: 'Chưa có read contract riêng', nextStep: 'Tạo read model trước khi hiển thị trạng thái.' },
]

const reportCapabilities: PlatformCapability[] = [
  { name: 'Operational Reports', owner: 'Operations', readSource: 'Module dashboards', nextStep: 'Tập hợp report links từ module đã có.' },
  { name: 'Inventory Reports', owner: 'Inventory', readSource: 'Inventory read models', nextStep: 'Ưu tiên báo cáo tồn kho/giao dịch.' },
  { name: 'Production Reports', owner: 'Production', readSource: 'Production cockpit/read models', nextStep: 'Liên kết báo cáo sản xuất khi dashboard certified.' },
  { name: 'QC Reports', owner: 'QC', readSource: 'QC dashboard/workspace', nextStep: 'Chỉ hiển thị dữ liệu QC thật, không dựng số lỗi giả.' },
  { name: 'Project / Supplier Reports', owner: 'Projects/Suppliers', readSource: 'Module workspaces', nextStep: 'Mở catalog sau khi contracts ổn định.' },
]

function PlatformFoundation({ title, description, rows }: { title: string; description: string; rows: PlatformCapability[] }) {
  const [query, setQuery] = useState('')
  const filtered = rows.filter((row) => `${row.name} ${row.owner} ${row.readSource}`.toLowerCase().includes(query.toLowerCase()))
  const emptyRows = Array.from({ length: Math.max(0, 10 - filtered.length) })

  return (
    <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-3">
          <MiniKpi label="Dữ liệu nghiệp vụ" value="Chưa có" />
          <MiniKpi label="Backend mới" value="Không tạo" />
          <MiniKpi label="Trạng thái" value="Sẵn sàng cấu hình" />
        </div>
        <div className={`${panel} p-3`}>
          <div className="flex flex-wrap items-center gap-2">
            <input value={query} onChange={(event) => setQuery(event.target.value)} className={`${input} min-w-[280px] flex-1`} placeholder="Tìm capability, owner hoặc nguồn dữ liệu..." />
            <button className={actionButton}>Làm mới</button>
            <button className={primaryButton}>Tạo cấu hình</button>
          </div>
        </div>
        <section className={`${panel} min-h-[620px] overflow-hidden`}>
          <div className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          </div>
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead className="bg-cyan-300/[0.055] text-xs uppercase tracking-[0.08em] text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left">Capability</th>
                  <th className="px-4 py-3 text-left">Owner</th>
                  <th className="px-4 py-3 text-left">Nguồn dữ liệu</th>
                  <th className="px-4 py-3 text-left">Bước tiếp theo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.name} className="border-t border-cyan-300/10 text-slate-200">
                    <td className="px-4 py-3 font-semibold text-cyan-300">{row.name}</td>
                    <td className="px-4 py-3">{row.owner}</td>
                    <td className="px-4 py-3 text-slate-400">{row.readSource}</td>
                    <td className="px-4 py-3 text-slate-400">{row.nextStep}</td>
                  </tr>
                ))}
                {emptyRows.map((_, index) => (
                  <tr key={`platform-empty-${index}`} aria-hidden="true" className="border-t border-white/[0.04]">
                    <td colSpan={4} className="h-[45px] px-4 py-3">
                      <div className="h-px w-full bg-white/[0.035]" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filtered.length ? <UsefulEmpty title="Không có capability phù hợp" description="Điều chỉnh bộ lọc hoặc quay lại tổng quan cài đặt để chọn nhóm cấu hình khác." /> : null}
        </section>
      </div>
      <aside className={`${panel} p-4 xl:sticky xl:top-3 xl:self-start`}>
        <h3 className="text-sm font-semibold text-white">Hướng dẫn cấu hình</h3>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Khu vực này chỉ trình bày capability nền tảng đã được xác định. Khi
          chưa có backend contract, UI giữ trạng thái rỗng có kiểm soát và
          không tạo dữ liệu giả.
        </p>
        <div className="mt-4 space-y-2">
          <Info k="Business mới" v="Không" />
          <Info k="API mới" v="Không" />
          <Info k="Dữ liệu giả" v="Không" />
          <Info k="Điều hướng" v="Dùng sidebar hiện có" />
        </div>
      </aside>
    </section>
  )
}

function UsefulEmpty({ title, description }: { title: string; description: string }) {
  return <div className="border-t border-slate-800 p-8 text-center"><div className="text-sm font-semibold text-slate-200">{title}</div><p className="mt-2 text-xs text-slate-500">{description}</p></div>
}

function Overview({ data, workflow, category, stats }: { data: any; workflow?: WorkflowCheck; category: ReadonlyArray<readonly [string, any]>; stats: Record<string, number> }) {
  const [query, setQuery] = useState('')
  const capabilityRows = category.map(([name, Icon], index) => ({
    id: name,
    name,
    owner: ['Administration', 'System', 'Inventory', 'Security', 'Operations'][index % 5],
    source: index < 2 ? 'System overview' : index < 6 ? 'Module contract' : 'Configuration contract',
    status: index < 4 ? 'READY' : 'NEEDS_CONTRACT',
    Icon,
  }))
  const filteredRows = capabilityRows.filter((row) =>
    `${row.name} ${row.owner} ${row.source} ${row.status}`.toLowerCase().includes(query.toLowerCase()),
  )
  const emptyRows = Array.from({ length: Math.max(0, 12 - filteredRows.length) })
  const okSteps = workflow?.steps.filter((step) => step.status === 'OK').length ?? 0
  const warnSteps = workflow?.steps.filter((step) => step.status === 'WARN').length ?? 0
  const blockedSteps = workflow?.steps.filter((step) => step.status === 'BLOCKED').length ?? 0

  return <div className="w-full min-w-0 flex-1 space-y-1">
    <div className="grid grid-cols-1 gap-1 md:grid-cols-4">
      <MiniKpi label="Tổng cấu hình" value={fmt(capabilityRows.length)} />
      <MiniKpi label="Người dùng" value={fmt(stats.totalUsers)} />
      <MiniKpi label="Workflow OK" value={fmt(okSteps)} />
      <MiniKpi label="Cần kiểm tra" value={fmt(warnSteps + blockedSteps)} />
    </div>

    <div className={`${panel} p-3`}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-72 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/45 px-3">
          <Search size={15} className="text-cyan-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={`${input} w-full border-0 bg-transparent px-0 focus:border-0`}
            placeholder="Tìm cấu hình, owner hoặc nguồn dữ liệu..."
          />
        </div>
        <button className={actionButton}>Bộ lọc: Tất cả</button>
        <button className={actionButton}>Làm mới</button>
        <button className={primaryButton}>Tạo cấu hình</button>
      </div>
    </div>

    <section className="grid grid-cols-1 gap-1 xl:grid-cols-12">
      <div className="xl:col-span-9">
        <div className={`${panel} min-h-[620px] overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-white">Danh mục cấu hình</h2>
              <p className="mt-1 text-xs text-slate-500">System settings, master data, workflow và security contracts</p>
            </div>
            <span className="text-[11px] text-cyan-300">0-{filteredRows.length} / {capabilityRows.length}</span>
          </div>
          <div className="max-h-[540px] overflow-auto">
            <table className="w-full min-w-[920px] table-fixed text-sm">
              <thead className="sticky top-0 z-10 bg-cyan-300/[0.055] text-xs uppercase tracking-[0.08em] text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left">Capability</th>
                  <th className="px-4 py-3 text-left">Owner</th>
                  <th className="px-4 py-3 text-left">Nguồn dữ liệu</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(({ id, name, owner, source, status, Icon }) => (
                  <tr key={id} className="border-t border-cyan-300/10 text-slate-200">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Icon size={16} className="text-cyan-300" />
                        <span className="font-semibold text-white">{name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{owner}</td>
                    <td className="px-4 py-3 text-slate-400">{source}</td>
                    <td className="px-4 py-3">
                      <span className={status === 'READY' ? 'text-emerald-300' : 'text-amber-300'}>{status}</span>
                    </td>
                  </tr>
                ))}
                {emptyRows.map((_, index) => (
                  <tr key={`settings-empty-${index}`} aria-hidden="true" className="border-t border-white/[0.04]">
                    <td colSpan={4} className="h-[45px] px-4 py-3">
                      <div className="h-px w-full bg-white/[0.035]" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <aside className="space-y-1 xl:col-span-3">
        <Card title="Thông tin công ty" icon={Building2}>
          <Info k="Tên công ty" v={data?.company?.name || 'STEELTRACK'} />
          <Info k="Mã số thuế" v={data?.company?.taxCode || '-'} />
          <Info k="Địa chỉ" v={data?.company?.address || '-'} />
          <Info k="Email" v={data?.company?.email || '-'} />
        </Card>
        <Card title="Kiểm tra workflow" icon={Workflow}>
          <WorkflowPanel workflow={workflow} />
        </Card>
        <Card title="Thống kê hệ thống" icon={DatabaseBackup}>
          <Info k="Tổng vai trò" v={fmt(stats.roles)} />
          <Info k="Tổng quyền" v={fmt(stats.permissions)} />
          <Info k="Tổng nhật ký" v={fmt(stats.activityTotal)} />
          <Info k="Business mới" v="Không" />
        </Card>
      </aside>
    </section>
  </div>
}

function WorkflowPanel({ workflow }: { workflow?: WorkflowCheck }) {
  if (!workflow) return <p className="text-sm text-slate-500">Đang kiểm tra workflow...</p>
  return <div className="space-y-2">{workflow.steps.map((step) => <div key={step.code} className="grid grid-cols-[22px_1fr] gap-2 rounded border border-slate-800 bg-slate-950/40 p-2 text-xs"><span className={step.status === 'OK' ? 'text-emerald-400' : step.status === 'WARN' ? 'text-amber-400' : 'text-red-400'}>{step.status === 'OK' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}</span><span><b className="block text-slate-200">{step.name}</b><span className="text-slate-500">{step.detail}</span></span></div>)}</div>
}

function SettingsCatalogs() {
  const queryClient = useQueryClient()
  const { data: categories = [] } = useCategories()
  const { data: materialTypes = [] } = useMaterialTypes()
  const { data: units = [] } = useUnits()
  const { data: materials = [] } = useInventoryItems()
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategory)
  const [materialTypeForm, setMaterialTypeForm] = useState<MaterialTypeForm>(emptyMaterialType)
  const [unitForm, setUnitForm] = useState<UnitForm>(emptyUnit)

  const categoryMutation = useMutation({
    mutationFn: async (payload: CategoryForm) => {
      const body = {
        code: payload.code.trim().toUpperCase(),
        name: payload.name.trim(),
        description: payload.description.trim() || undefined,
      }
      if (payload.id) return api.put(`/inventory/categories/${payload.id}`, body).then((res) => res.data)
      return api.post('/inventory/categories', body).then((res) => res.data)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inventory-categories'] })
      setCategoryForm(emptyCategory)
    },
  })

  const materialTypeMutation = useMutation({
    mutationFn: async (payload: MaterialTypeForm) => {
      const body = {
        code: payload.code.trim().toUpperCase(),
        name: payload.name.trim(),
        description: payload.description.trim() || undefined,
        categoryId: payload.categoryId,
      }
      if (payload.id) return api.put(`/inventory/material-types/${payload.id}`, body).then((res) => res.data)
      return api.post('/inventory/material-types', body).then((res) => res.data)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inventory-material-types'] })
      setMaterialTypeForm(emptyMaterialType)
    },
  })

  const unitMutation = useMutation({
    mutationFn: async (payload: UnitForm) => {
      const body = {
        code: payload.code.trim().toUpperCase(),
        name: payload.name.trim(),
        symbol: payload.symbol.trim() || payload.code.trim(),
        category: payload.category.trim().toUpperCase(),
        precision: Number(payload.precision || 0),
      }
      if (payload.id) return api.put(`/inventory/units/${payload.id}`, body).then((res) => res.data)
      return api.post('/inventory/units', body).then((res) => res.data)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inventory-units'] })
      setUnitForm(emptyUnit)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: 'category' | 'materialType' | 'unit'; id: string }) => {
      const path = type === 'category'
        ? `/inventory/categories/${id}`
        : type === 'materialType'
          ? `/inventory/material-types/${id}`
          : `/inventory/units/${id}`
      return api.delete(path).then((res) => res.data)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['inventory-categories'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory-material-types'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory-units'] }),
      ])
    },
  })

  const usageRows = [
    ['PRIMARY', 'Vật tư chính', 'Dùng cho kết cấu chính, BOM và định mức sản xuất.'],
    ['SECONDARY', 'Vật tư phụ', 'Dùng cho liên kết, phụ kiện và chi tiết phụ trợ.'],
    ['CONSUMABLE', 'Vật tư tiêu hao', 'Dùng cho hàn, sơn, đá mài, mũi khoan và vật tư xưởng.'],
  ] as const

  function countBy(key: string, value: string) {
    return (materials as any[]).filter((row) => String(row?.[key] ?? '') === String(value)).length
  }

  function saveCategory() {
    if (!categoryForm.code.trim() || !categoryForm.name.trim()) return
    categoryMutation.mutate(categoryForm)
  }

  function saveMaterialType() {
    if (!materialTypeForm.code.trim() || !materialTypeForm.name.trim() || !materialTypeForm.categoryId) return
    materialTypeMutation.mutate(materialTypeForm)
  }

  function saveUnit() {
    if (!unitForm.code.trim() || !unitForm.name.trim()) return
    unitMutation.mutate(unitForm)
  }

  return (
    <section className="space-y-3">
      <div className="grid gap-3 md:grid-cols-4">
        <MiniKpi label="Danh mục vật tư" value={fmt(categories.length)} />
        <MiniKpi label="Nhóm sử dụng" value="3" />
        <MiniKpi label="Quy cách / loại" value={fmt(materialTypes.length)} />
        <MiniKpi label="Đơn vị" value={fmt(units.length)} />
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <section className={`${panel} p-4`}>
          <HeaderLine title="Danh mục vật tư" editing={Boolean(categoryForm.id)} onReset={() => setCategoryForm(emptyCategory)} onSave={saveCategory} loading={categoryMutation.isPending} />
          <div className="grid gap-2 md:grid-cols-2">
            <input value={categoryForm.code} onChange={(event) => setCategoryForm((prev) => ({ ...prev, code: event.target.value }))} className={input} placeholder="Mã danh mục, VD: STEEL_PROFILE" />
            <input value={categoryForm.name} onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))} className={input} placeholder="Tên danh mục" />
            <textarea value={categoryForm.description} onChange={(event) => setCategoryForm((prev) => ({ ...prev, description: event.target.value }))} className={`${textarea} md:col-span-2`} placeholder="Mô tả" />
          </div>
          <RecordList
            rows={categories}
            meta={(row) => `${countBy('categoryId', row.id)} vật tư đang dùng`}
            onEdit={(row) => setCategoryForm({ id: row.id, code: row.code ?? '', name: row.name ?? '', description: row.description ?? '' })}
            onDelete={(row) => deleteMutation.mutate({ type: 'category', id: row.id })}
          />
        </section>

        <section className={`${panel} p-4`}>
          <h2 className="mb-3 text-sm font-semibold">Nhóm sử dụng vật tư</h2>
          <div className="grid gap-2">
            {usageRows.map(([code, name, note]) => (
              <div key={code} className="rounded border border-slate-800 bg-slate-950/50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-100">{name}</div>
                    <div className="mt-1 text-xs text-cyan-300">{code}</div>
                    <div className="mt-1 text-xs text-slate-500">{note}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-white">{fmt(countBy('materialUsageType', code))}</div>
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">vật tư</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 rounded border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-100">
            Ba nhóm này là chuẩn hệ thống đang liên kết BOM và sản xuất. Nếu cần tạo thêm nhóm ngoài chính/phụ/tiêu hao thì cần Phase DB mở rộng enum thành bảng danh mục động.
          </p>
        </section>

        <section className={`${panel} p-4`}>
          <HeaderLine title="Quy cách / loại vật tư" editing={Boolean(materialTypeForm.id)} onReset={() => setMaterialTypeForm(emptyMaterialType)} onSave={saveMaterialType} loading={materialTypeMutation.isPending} />
          <div className="grid gap-2 md:grid-cols-2">
            <input value={materialTypeForm.code} onChange={(event) => setMaterialTypeForm((prev) => ({ ...prev, code: event.target.value }))} className={input} placeholder="Mã quy cách, VD: H_BEAM" />
            <input value={materialTypeForm.name} onChange={(event) => setMaterialTypeForm((prev) => ({ ...prev, name: event.target.value }))} className={input} placeholder="Tên quy cách" />
            <select value={materialTypeForm.categoryId} onChange={(event) => setMaterialTypeForm((prev) => ({ ...prev, categoryId: event.target.value }))} className={input}>
              <option value="">Chọn danh mục vật tư</option>
              {(categories as any[]).map((category) => <option key={category.id} value={category.id}>{category.code} - {category.name}</option>)}
            </select>
            <textarea value={materialTypeForm.description} onChange={(event) => setMaterialTypeForm((prev) => ({ ...prev, description: event.target.value }))} className={textarea} placeholder="Mô tả" />
          </div>
          <RecordList
            rows={materialTypes}
            meta={(row) => `${row.category?.name ?? 'Chưa gán danh mục'} · ${countBy('materialTypeId', row.id)} vật tư`}
            onEdit={(row) => setMaterialTypeForm({ id: row.id, code: row.code ?? '', name: row.name ?? '', description: row.description ?? '', categoryId: row.categoryId ?? row.category?.id ?? '' })}
            onDelete={(row) => deleteMutation.mutate({ type: 'materialType', id: row.id })}
          />
        </section>

        <section className={`${panel} p-4`}>
          <HeaderLine title="Đơn vị tính" editing={Boolean(unitForm.id)} onReset={() => setUnitForm(emptyUnit)} onSave={saveUnit} loading={unitMutation.isPending} />
          <div className="grid gap-2 md:grid-cols-2">
            <input value={unitForm.code} onChange={(event) => setUnitForm((prev) => ({ ...prev, code: event.target.value }))} className={input} placeholder="Mã đơn vị, VD: KG" />
            <input value={unitForm.name} onChange={(event) => setUnitForm((prev) => ({ ...prev, name: event.target.value }))} className={input} placeholder="Tên đơn vị" />
            <input value={unitForm.symbol} onChange={(event) => setUnitForm((prev) => ({ ...prev, symbol: event.target.value }))} className={input} placeholder="Ký hiệu" />
            <input value={unitForm.precision} onChange={(event) => setUnitForm((prev) => ({ ...prev, precision: event.target.value }))} className={input} type="number" min="0" max="6" placeholder="Số lẻ" />
            <select value={unitForm.category} onChange={(event) => setUnitForm((prev) => ({ ...prev, category: event.target.value }))} className={`${input} md:col-span-2`}>
              <option value="WEIGHT">Khối lượng</option>
              <option value="LENGTH">Chiều dài</option>
              <option value="AREA">Diện tích</option>
              <option value="VOLUME">Thể tích</option>
              <option value="COUNT">Số lượng</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>
          <RecordList
            rows={units}
            meta={(row) => `${row.symbol ?? row.code} · ${row.category} · ${countBy('unitId', row.id)} vật tư`}
            onEdit={(row) => setUnitForm({ id: row.id, code: row.code ?? '', name: row.name ?? '', symbol: row.symbol ?? '', category: String(row.category ?? 'OTHER').toUpperCase(), precision: String(row.precision ?? 0) })}
            onDelete={(row) => deleteMutation.mutate({ type: 'unit', id: row.id })}
          />
        </section>
      </div>
    </section>
  )
}

function MiniKpi({ label, value }: { label: string; value: string }) {
  return <div className={`${panel} relative h-[108px] overflow-hidden p-3`}>
    <div className="relative z-10">
      <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-[10px] font-semibold text-emerald-400">Configuration ready</div>
    </div>
    <svg viewBox="0 0 100 34" preserveAspectRatio="none" className="absolute inset-x-3 bottom-1 h-9 w-[calc(100%-24px)] opacity-90">
      <polyline points="0,34 0,28 20,22 40,24 60,16 80,12 100,8 100,34" fill="rgba(6,182,212,0.2)" stroke="none" />
      <polyline points="0,28 20,22 40,24 60,16 80,12 100,8" fill="none" stroke="#06b6d4" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
    </svg>
  </div>
}

function HeaderLine({ title, editing, loading, onReset, onSave }: { title: string; editing: boolean; loading: boolean; onReset: () => void; onSave: () => void }) {
  return <div className="mb-3 flex items-center justify-between gap-2">
    <h2 className="text-sm font-semibold">{title}</h2>
    <div className="flex gap-2">
      {editing ? <button onClick={onReset} className={actionButton}>Hủy</button> : null}
      <button disabled={loading} onClick={onSave} className={primaryButton}>{editing ? <Save size={14} /> : <Plus size={14} />}{editing ? 'Lưu' : 'Tạo'}</button>
    </div>
  </div>
}

function RecordList({ rows, meta, onEdit, onDelete }: { rows: any[]; meta: (row: any) => string; onEdit: (row: any) => void; onDelete: (row: any) => void }) {
  return <div className="mt-3 max-h-[360px] space-y-2 overflow-auto pr-1">
    {rows.map((row) => <div key={row.id} className="rounded border border-slate-800 bg-slate-950/50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-100">{row.name}</div>
          <div className="mt-1 text-xs text-cyan-300">{row.code}</div>
          <div className="mt-1 text-xs text-slate-500">{meta(row)}</div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button onClick={() => onEdit(row)} className="rounded border border-slate-700 p-2 text-slate-300 hover:bg-slate-800" aria-label="Sửa"><Edit3 size={14} /></button>
          <button onClick={() => onDelete(row)} className="rounded border border-red-700/50 p-2 text-red-300 hover:bg-red-900/20" aria-label="Xóa"><Trash2 size={14} /></button>
        </div>
      </div>
    </div>)}
  </div>
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
