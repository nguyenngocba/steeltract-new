import { type ReactNode, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  Building2,
  CheckCircle2,
  DatabaseBackup,
  Edit3,
  FileDigit,
  Globe2,
  Link2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Workflow,
  X,
  XCircle,
} from 'lucide-react'

import { EnterpriseWorkspace } from '@/shared/ui/enterprise'
import { api } from '@/lib/api'
import { systemApi, type WorkflowCheck } from '@/modules/system/api/system.api'
import { useCategories } from '@/modules/inventory/hooks/useCategories'
import { useInventoryItems } from '@/modules/inventory/hooks/useInventoryItems'
import { useMaterialTypes } from '@/modules/inventory/hooks/useMaterialTypes'
import { useUnits } from '@/modules/inventory/hooks/useUnits'
import {
  CockpitChartCard,
  CockpitEmptyState,
  CockpitKpiCard,
  CockpitStatusList,
  CockpitTableShell,
  DataTablePagination,
} from '@/shared/ui/cockpit'
import {
  ModuleLoadingState,
  moduleInput,
  moduleMutedButton,
  modulePrimaryButton,
} from '@/shared/ui/modules'
import { formatDateTime, formatQuantity } from '@/shared/utils/number-format'

type Tab =
  | 'overview'
  | 'general'
  | 'organization'
  | 'permissions'
  | 'security'
  | 'monitoring'
  | 'master'
  | 'integrations'
  | 'notifications'
  | 'backup'
  | 'reports'
  | 'logs'

const tabs: Array<{ id: Tab; label: string; path: string }> = [
  { id: 'overview', label: 'Tổng quan', path: '/settings' },
  { id: 'general', label: 'Cấu hình chung', path: '/settings?tab=general' },
  { id: 'organization', label: 'Tổ chức', path: '/settings?tab=organization' },
  { id: 'permissions', label: 'Phân quyền', path: '/settings?tab=permissions' },
  { id: 'security', label: 'Bảo mật', path: '/settings?tab=security' },
  { id: 'monitoring', label: 'Giám sát', path: '/settings?tab=monitoring' },
  { id: 'master', label: 'Danh mục / Đơn vị', path: '/settings?tab=master' },
  { id: 'integrations', label: 'Tích hợp', path: '/settings?tab=integrations' },
  { id: 'notifications', label: 'Thông báo', path: '/settings?tab=notifications' },
  { id: 'backup', label: 'Sao lưu & Phục hồi', path: '/settings?tab=backup' },
  { id: 'reports', label: 'Trung tâm báo cáo', path: '/settings?tab=reports' },
  { id: 'logs', label: 'Nhật ký cấu hình', path: '/settings?tab=logs' },
]

const fmt = (value = 0) => formatQuantity(value, 0)
const date = (value?: string) => (value ? formatDateTime(value) : '—')

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
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const { data, isLoading } = useQuery({
    queryKey: ['system-overview'],
    queryFn: systemApi.overview,
    refetchInterval: 15000,
  })
  const { data: workflow } = useQuery({
    queryKey: ['operational-workflow'],
    queryFn: systemApi.workflow,
    refetchInterval: 15000,
  })

  const stats = data?.stats ?? {}
  const category = useMemo(
    () =>
      [
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
      ] as const,
    [],
  )

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['system-overview'] })
    queryClient.invalidateQueries({ queryKey: ['operational-workflow'] })
  }

  const okSteps = workflow?.steps.filter((step) => step.status === 'OK').length ?? 0
  const warnSteps = workflow?.steps.filter((step) => step.status === 'WARN').length ?? 0
  const blockedSteps = workflow?.steps.filter((step) => step.status === 'BLOCKED').length ?? 0

  return (
    <EnterpriseWorkspace
      eyebrow="Quản trị"
      title="Cài đặt hệ thống"
      description="Quản lý toàn bộ cấu hình, danh mục và thiết lập hệ thống."
      breadcrumbs={['Quản trị', 'Cài đặt']}
      tabs={tabs}
      activeTab={activeTab}
      actions={
        <div className="flex items-center gap-2">
          <button className={moduleMutedButton} onClick={refresh} type="button">
            <RefreshCw size={14} /> Làm mới
          </button>
          <button className={modulePrimaryButton} type="button">
            <Save size={14} /> Lưu thay đổi
          </button>
        </div>
      }
    >
      {/* 1. KPI Cards Row */}
      <section className="grid gap-1 md:grid-cols-2 xl:grid-cols-4">
        <CockpitKpiCard
          title="Tổng mục cấu hình"
          value={fmt(category.length)}
          note="Nhóm thiết lập hệ thống"
          icon={<Settings size={18} />}
          tone="cyan"
          state={isLoading ? 'loading' : 'normal'}
        />
        <CockpitKpiCard
          title="Tài khoản người dùng"
          value={fmt(stats.totalUsers)}
          note="User đã khởi tạo"
          icon={<Building2 size={18} />}
          tone="blue"
          state={isLoading ? 'loading' : 'normal'}
        />
        <CockpitKpiCard
          title="Workflow đạt chuẩn (OK)"
          value={fmt(okSteps)}
          note="Quy trình hoạt động tốt"
          icon={<CheckCircle2 size={18} />}
          tone="emerald"
          state={isLoading ? 'loading' : 'normal'}
        />
        <CockpitKpiCard
          title="Cần kiểm tra / Blocked"
          value={fmt(warnSteps + blockedSteps)}
          note="Quy trình cần lưu ý"
          icon={<XCircle size={18} />}
          tone="amber"
          state={isLoading ? 'loading' : 'normal'}
        />
      </section>

      {/* Workspace content based on Tab */}
      {activeTab === 'master' ? (
        <SettingsCatalogs />
      ) : activeTab === 'organization' ? (
        <PlatformFoundation
          title="Cấu hình Tổ chức & Quy mô"
          description="Quản lý thông tin công ty, nhà máy, kho bãi và ca làm việc."
          rows={organizationCapabilities}
        />
      ) : activeTab === 'security' ? (
        <PlatformFoundation
          title="Cấu hình Bảo mật & Quyền truy cập"
          description="Chính sách mật khẩu, phiên làm việc, MFA và API Token."
          rows={securityCapabilities}
        />
      ) : activeTab === 'monitoring' ? (
        <PlatformFoundation
          title="Giám sát & Hạ tầng"
          description="Trạng thái dịch vụ, background jobs, webhooks và bộ phát thông báo."
          rows={monitoringCapabilities}
        />
      ) : activeTab === 'reports' ? (
        <PlatformFoundation
          title="Trung tâm Báo cáo & Xuất dữ liệu"
          description="Tập hợp liên kết và định dạng xuất báo cáo theo từng phân hệ."
          rows={reportCapabilities}
        />
      ) : (
        <Overview data={data} workflow={workflow} category={category} stats={stats} loading={isLoading} />
      )}
    </EnterpriseWorkspace>
  )
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
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = useMemo(
    () => rows.filter((row) => `${row.name} ${row.owner} ${row.readSource}`.toLowerCase().includes(query.toLowerCase())),
    [rows, query],
  )

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  return (
    <div className="grid gap-1 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3 flex flex-col justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-white">{title}</h2>
              <p className="text-xs text-slate-500">{description}</p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950/45 px-2">
              <Search size={14} className="text-cyan-300 shrink-0" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm capability, owner..."
                className="h-8 w-48 bg-transparent text-xs text-slate-100 outline-none placeholder:text-slate-500"
              />
            </div>
          </div>

          <CockpitTableShell className="min-h-[480px]">
            {filtered.length > 0 ? (
              <table className="w-full text-xs min-w-[700px]">
                <thead className="border-b border-cyan-400/10 bg-transparent text-slate-300">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Capability</th>
                    <th className="px-3 py-2 text-left font-medium">Owner</th>
                    <th className="px-3 py-2 text-left font-medium">Nguồn dữ liệu</th>
                    <th className="px-3 py-2 text-left font-medium">Bước tiếp theo</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((row) => (
                    <tr key={row.name} className="border-b border-cyan-300/10 text-slate-300 hover:bg-cyan-300/[0.055]">
                      <td className="px-3 py-2 font-semibold text-cyan-300">{row.name}</td>
                      <td className="px-3 py-2">{row.owner}</td>
                      <td className="px-3 py-2 text-slate-400">{row.readSource}</td>
                      <td className="px-3 py-2 text-slate-400">{row.nextStep}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <CockpitEmptyState
                title="Không tìm thấy capability phù hợp"
                description="Điều chỉnh bộ lọc hoặc chọn nhóm cấu hình khác."
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

      <aside className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3 space-y-3">
        <h3 className="text-sm font-semibold text-white">Hướng dẫn cấu hình</h3>
        <p className="text-xs leading-5 text-slate-400">
          Khu vực này trình bày các capability nền tảng đã được xác định. Khi chưa có backend contract, UI giữ trạng thái rỗng có kiểm soát và không tạo dữ liệu giả.
        </p>
        <div className="space-y-2 text-xs">
          <Info k="Business mới" v="Không" />
          <Info k="API mới" v="Không" />
          <Info k="Dữ liệu giả" v="Không" />
          <Info k="Điều hướng" v="Dùng sidebar hiện có" />
        </div>
      </aside>
    </div>
  )
}

function Overview({
  data,
  workflow,
  category,
  stats,
  loading,
}: {
  data: any
  workflow?: WorkflowCheck
  category: ReadonlyArray<readonly [string, any]>
  stats: Record<string, number>
  loading: boolean
}) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const capabilityRows = useMemo(
    () =>
      category.map(([name, Icon], index) => ({
        id: name,
        name,
        owner: ['Administration', 'System', 'Inventory', 'Security', 'Operations'][index % 5],
        source: index < 2 ? 'System overview' : index < 6 ? 'Module contract' : 'Configuration contract',
        status: index < 4 ? 'READY' : 'NEEDS_CONTRACT',
        Icon,
      })),
    [category],
  )

  const filteredRows = useMemo(
    () =>
      capabilityRows.filter((row) =>
        `${row.name} ${row.owner} ${row.source} ${row.status}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [capabilityRows, query],
  )

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page, pageSize])

  if (loading) return <ModuleLoadingState label="Đang đọc thông tin cấu hình hệ thống" />

  return (
    <div className="grid gap-1 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3 flex flex-col justify-between">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Danh mục Cấu hình Hệ thống</h2>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950/45 px-2">
              <Search size={14} className="text-cyan-300 shrink-0" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm cấu hình..."
                className="h-8 w-48 bg-transparent text-xs text-slate-100 outline-none placeholder:text-slate-500"
              />
            </div>
          </div>

          <CockpitTableShell className="min-h-[480px]">
            {filteredRows.length > 0 ? (
              <table className="w-full min-w-[700px] table-fixed text-[13px]">
                <thead className="border-b border-cyan-400/10 bg-transparent text-slate-300">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Capability</th>
                    <th className="px-3 py-2 text-left font-medium">Owner</th>
                    <th className="px-3 py-2 text-left font-medium">Nguồn dữ liệu</th>
                    <th className="px-3 py-2 text-right font-medium">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map(({ id, name, owner, source, status, Icon }) => (
                    <tr key={id} className="border-b border-cyan-300/10 text-slate-300 hover:bg-cyan-300/[0.055]">
                      <td className="px-3 py-2 font-semibold text-white flex items-center gap-2">
                        <Icon size={14} className="text-cyan-300 shrink-0" />
                        {name}
                      </td>
                      <td className="px-3 py-2 text-slate-300">{owner}</td>
                      <td className="px-3 py-2 text-slate-400 font-mono text-xs">{source}</td>
                      <td className="px-3 py-2 text-right">
                        <span
                          className={`rounded-lg border px-2 py-0.5 text-[11px] ${
                            status === 'READY'
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                              : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <CockpitEmptyState
                title="Chưa có dữ liệu cấu hình"
                description="Không tìm thấy mục cấu hình phù hợp với điều kiện tìm kiếm."
              />
            )}
          </CockpitTableShell>
        </div>

        {filteredRows.length > 0 && (
          <DataTablePagination
            page={page}
            pageSize={pageSize}
            total={filteredRows.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 20, 50]}
          />
        )}
      </section>

      <aside className="space-y-1">
        <CockpitChartCard title="Thông tin công ty">
          <Info k="Tên công ty" v={data?.company?.name || 'STEELTRACK'} />
          <Info k="Mã số thuế" v={data?.company?.taxCode || '—'} />
          <Info k="Địa chỉ" v={data?.company?.address || '—'} />
          <Info k="Email" v={data?.company?.email || '—'} />
        </CockpitChartCard>

        <CockpitChartCard title="Kiểm tra Workflow">
          <WorkflowPanel workflow={workflow} />
        </CockpitChartCard>

        <CockpitStatusList
          items={[
            { id: '1', label: 'Tổng vai trò', value: fmt(stats.roles), statusTone: 'cyan' },
            { id: '2', label: 'Tổng quyền', value: fmt(stats.permissions), statusTone: 'emerald' },
            { id: '3', label: 'Tổng nhật ký', value: fmt(stats.activityTotal), statusTone: 'blue' },
          ]}
          emptyMessage="Chưa có thống kê."
        />
      </aside>
    </div>
  )
}

function WorkflowPanel({ workflow }: { workflow?: WorkflowCheck }) {
  if (!workflow) return <p className="text-xs text-slate-500">Đang đọc dữ liệu workflow...</p>
  return (
    <div className="space-y-2 max-h-[220px] overflow-y-auto">
      {workflow.steps.map((step) => (
        <div key={step.code} className="flex items-start gap-2 rounded-lg border border-cyan-300/10 bg-slate-950/35 p-2 text-xs">
          <span className={step.status === 'OK' ? 'text-emerald-400' : step.status === 'WARN' ? 'text-amber-400' : 'text-red-400'}>
            {step.status === 'OK' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          </span>
          <div>
            <b className="block text-slate-200">{step.name}</b>
            <span className="text-slate-500">{step.detail}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function SettingsCatalogs() {
  const queryClient = useQueryClient()
  const { data: categories = [] } = useCategories()
  const { data: materialTypes = [] } = useMaterialTypes()
  const { data: units = [] } = useUnits()
  const { data: materials = [] } = useInventoryItems()
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategory)

  function countBy(key: string, value: string) {
    return (materials as any[]).filter((row) => String(row?.[key] ?? '') === String(value)).length
  }

  return (
    <div className="grid gap-1 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3 space-y-3">
        <h2 className="text-sm font-semibold text-white">Quản lý Danh mục & Quy cách Vật tư</h2>
        <CockpitTableShell className="min-h-[440px]">
          <table className="w-full text-xs">
            <thead className="border-b border-cyan-400/10 bg-transparent text-slate-300">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Mã danh mục</th>
                <th className="px-3 py-2 text-left font-medium">Tên danh mục</th>
                <th className="px-3 py-2 text-right font-medium">Số vật tư</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((row: any) => (
                <tr key={row.id} className="border-b border-cyan-300/10 text-slate-300">
                  <td className="px-3 py-2 font-mono text-cyan-300 font-semibold">{row.code}</td>
                  <td className="px-3 py-2 text-white">{row.name}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmt(countBy('categoryId', row.id))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CockpitTableShell>
      </section>

      <aside className="space-y-1">
        <CockpitChartCard title="Thống kê Danh mục">
          <Info k="Danh mục vật tư" v={fmt(categories.length)} />
          <Info k="Mã quy cách" v={fmt(materialTypes.length)} />
          <Info k="Đơn vị tính" v={fmt(units.length)} />
        </CockpitChartCard>
      </aside>
    </div>
  )
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-cyan-300/10 py-1.5 text-xs">
      <span className="text-slate-500">{k}</span>
      <span className="font-medium text-slate-200">{v}</span>
    </div>
  )
}
