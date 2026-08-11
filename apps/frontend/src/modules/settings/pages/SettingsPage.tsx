import { type ReactNode, useEffect, useMemo, useState } from 'react'
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
  Package,
  Power,
  RefreshCw,
  Ruler,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Workflow,
  Warehouse,
  X,
  XCircle,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

import { EnterpriseWorkspace } from '@/shared/ui/enterprise'
import { apiErrorMessage } from '@/shared/api/api-error-message'
import { systemApi, type SystemSettingsCatalog, type WorkflowCheck } from '@/modules/system/api/system.api'
import { createUnitOfMeasure, deactivateUnitOfMeasure, getUnitsOfMeasure, updateUnitOfMeasure } from '@/modules/master-data/uom/api/uom.api'
import type { MasterUnit } from '@/modules/master-data/uom/types/uom.types'
import { createMasterDataRecord, deactivateMasterDataRecord, getMasterDataRecords, updateMasterDataRecord } from '@/modules/master-data/api/master-data.api'
import type { MasterDataDomainId, MasterDataRecord } from '@/modules/master-data/types/master-data.types'
import { createInventoryItem, deleteInventoryItem, updateInventoryItem, type SaveInventoryItemPayload } from '@/modules/inventory/api/inventory.api'
import { useInventoryItems } from '@/modules/inventory/hooks/useInventoryItems'
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
  moduleMutedButton,
  modulePrimaryButton,
} from '@/shared/ui/modules'
import { formatDateTime, formatQuantity } from '@/shared/utils/number-format'
import { WarehouseMasterWorkspace } from '../components/WarehouseMasterWorkspace'
import {
  MasterDataDependencyTree,
  UnifiedMasterDataDrawer,
  UnifiedMasterDataToolbar,
  UnifiedMasterDataWorkspace,
  exportMasterDataCsv,
  type MasterDataDensity,
  type MasterDataDrawerTab,
  type MasterDataView,
} from '@/modules/master-data/components/UnifiedMasterDataWorkspace'

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
  { id: 'reports', label: 'Trung tâm báo cáo', path: '/settings?tab=reports' },
  { id: 'logs', label: 'Nhật ký cấu hình', path: '/settings?tab=logs' },
]

const fmt = (value = 0) => formatQuantity(value, 0)
const date = (value?: string) => (value ? formatDateTime(value) : '—')

export function SettingsPage() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  useEffect(() => {
    const requested = searchParams.get('tab')
    setActiveTab(
      requested && tabs.some((tab) => tab.id === requested)
        ? (requested as Tab)
        : 'overview',
    )
  }, [searchParams])

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
  const { data: settingsCatalog } = useQuery({
    queryKey: ['system-settings-catalog'],
    queryFn: systemApi.settingsCatalog,
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
    queryClient.invalidateQueries({ queryKey: ['system-settings-catalog'] })
    queryClient.invalidateQueries({ queryKey: ['master-data-uom'] })
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
        </div>
      }
    >
      {/* 1. KPI Cards Row */}
      <section className="grid gap-1 md:grid-cols-2 xl:grid-cols-5">
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
        <SettingsCatalogs
          settingsCatalog={settingsCatalog}
          initialWorkspace={searchParams.get('workspace')}
        />
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
        <Overview data={data} workflow={workflow} category={category} stats={stats} loading={isLoading} settingsCatalog={settingsCatalog} />
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
  settingsCatalog,
}: {
  data: any
  workflow?: WorkflowCheck
  category: ReadonlyArray<readonly [string, any]>
  stats: Record<string, number>
  loading: boolean
  settingsCatalog?: SystemSettingsCatalog
}) {
  const [query, setQuery] = useState('')
  const [selectedConfig, setSelectedConfig] = useState<SystemSettingsCatalog['categories'][number] | null>(null)
  const [masterWorkspace, setMasterWorkspace] = useState<MasterWorkspace | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const capabilityRows = useMemo(
    () => {
      const iconByKey = new Map(category.map(([name, Icon]) => [name.toLowerCase(), Icon]))
      if (settingsCatalog?.categories?.length) {
        return settingsCatalog.categories.filter((item) => item.key !== 'backup').map((item) => ({
          id: item.key,
          name: item.label,
          owner: ownerForCatalog(item.key),
          source: item.source,
          status: item.status,
          count: item.count,
          editable: item.editable,
          raw: item,
          Icon: iconForCatalog(item.key, iconByKey),
        }))
      }
      return category.map(([name, Icon], index) => ({
        id: name,
        name,
        owner: ['Administration', 'System', 'Inventory', 'Security', 'Operations'][index % 5],
        source: index < 2 ? 'System overview' : index < 6 ? 'Module contract' : 'Configuration contract',
        status: 'NOT_IMPLEMENTED',
        count: 0,
        editable: false,
        raw: null,
        Icon,
      }))
    },
    [category, settingsCatalog],
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
                    <th className="px-3 py-2 text-right font-medium">Records</th>
                    <th className="px-3 py-2 text-right font-medium">Trạng thái</th>
                    <th className="px-3 py-2 text-right font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map(({ id, name, owner, source, status, Icon }) => (
                    <tr
                      key={id}
                      onClick={() => {
                        const workspace = workspaceForCatalogKey(id)
                        if (workspace) {
                          setMasterWorkspace(workspace)
                          return
                        }
                        setSelectedConfig(capabilityRows.find((row) => row.id === id)?.raw ?? null)
                      }}
                      className="cursor-pointer border-b border-cyan-300/10 text-slate-300 hover:bg-cyan-300/[0.055]"
                    >
                      <td className="px-3 py-2 font-semibold text-white flex items-center gap-2">
                        <Icon size={14} className="text-cyan-300 shrink-0" />
                        {name}
                      </td>
                      <td className="px-3 py-2 text-slate-300">{owner}</td>
                      <td className="px-3 py-2 text-slate-400 font-mono text-xs">{source}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs text-cyan-300">{fmt(capabilityRows.find((row) => row.id === id)?.count ?? 0)}</td>
                      <td className="px-3 py-2 text-right">
                        <span
                          className={`rounded-lg border px-2 py-0.5 text-[11px] ${
                            status === 'REAL_EDITABLE'
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                              : status === 'REAL_READ_ONLY' || status === 'ENV_READ_ONLY'
                                ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                              : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                          }`}
                        >
                          {catalogStatusText(status)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-[11px] font-semibold text-cyan-300">
                        {workspaceForCatalogKey(id) ? 'Mở quản trị' : 'Xem chi tiết'}
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

      <ConfigDetailModal item={selectedConfig} runtime={settingsCatalog?.safeRuntime} overview={data} onClose={() => setSelectedConfig(null)} />
      {masterWorkspace ? <MasterDataCrudHost workspace={masterWorkspace} onClose={() => setMasterWorkspace(null)} /> : null}
    </div>
  )
}

function ownerForCatalog(key: string) {
  if (['users', 'roles', 'permissions'].includes(key)) return 'RBAC'
  if (['uom', 'material-categories', 'material-types', 'material-usage-types', 'warehouses'].includes(key)) return 'Master Data'
  if (key === 'backup') return 'SYSTEM.7'
  if (key === 'activity-log') return 'ActivityLog'
  return 'System'
}

function iconForCatalog(key: string, iconByName: Map<string, any>) {
  if (key === 'uom') return SlidersHorizontal
  if (key === 'users') return Building2
  if (key === 'roles' || key === 'permissions') return ShieldCheck
  if (key === 'activity-log') return Workflow
  if (key === 'backup') return DatabaseBackup
  if (key === 'warehouses') return Warehouse
  return iconByName.get(key.toLowerCase()) ?? Settings
}

function catalogStatusText(status: string) {
  if (status === 'REAL_EDITABLE') return 'Thật / sửa được'
  if (status === 'REAL_READ_ONLY') return 'Thật / chỉ đọc'
  if (status === 'ENV_READ_ONLY') return 'ENV / chỉ đọc'
  return 'Chưa triển khai'
}

function ConfigDetailModal({ item, runtime, overview, onClose }: { item: SystemSettingsCatalog['categories'][number] | null; runtime?: SystemSettingsCatalog['safeRuntime']; overview?: any; onClose: () => void }) {
  if (!item) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[82vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-300/25 bg-[#07111f] shadow-2xl shadow-cyan-950/40">
        <header className="flex items-start justify-between border-b border-cyan-300/15 p-4">
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">Danh mục cấu hình</p><h2 className="mt-1 text-lg font-semibold text-white">{item.label}</h2></div>
          <button type="button" onClick={onClose} aria-label="Đóng modal" className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10"><X size={16} /></button>
        </header>
        <div className="space-y-3 overflow-y-auto p-4 text-sm text-slate-300">
          <div className="grid gap-2 md:grid-cols-2"><Info k="Trạng thái" v={catalogStatusText(item.status)} /><Info k="Nguồn dữ liệu" v={item.source} /><Info k="Số bản ghi" v={fmt(item.count)} /><Info k="Editable" v={item.editable ? 'Có' : 'Không'} /></div>
          {item.key === 'system-information' && (
            <section className="rounded-2xl border border-cyan-300/10 bg-slate-950/35 p-3">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Thông tin runtime an toàn</h3>
              <Info k="Application" v={runtime?.application ?? 'Chưa có dữ liệu'} />
              <Info k="Environment" v={runtime?.environment ?? 'Chưa có dữ liệu'} />
              <Info k="Timezone" v={runtime?.timezone ?? overview?.system?.timezone ?? 'Chưa có dữ liệu'} />
              <Info k="Server time" v={runtime?.serverTime ? date(runtime.serverTime) : 'Chưa có dữ liệu'} />
            </section>
          )}
          {item.key === 'backup' && <CockpitEmptyState title="Chức năng sao lưu backend chưa được triển khai" description="Backup/Restore thuộc SYSTEM.7. Không có bản ghi backup giả trong SYSTEM.ADMIN.V1." />}
          {item.key !== 'system-information' && item.key !== 'backup' && <p className="rounded-xl border border-cyan-300/10 bg-slate-950/35 p-3 text-xs text-slate-400">Dữ liệu chi tiết dùng endpoint thật: <span className="font-mono text-cyan-300">{item.source}</span>. Các trang Users, Roles/Profile, UOM và Activity Log đang đọc trực tiếp nguồn này.</p>}
        </div>
      </div>
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

type MasterWorkspace = 'categories' | 'usage' | 'materials' | 'technical' | 'uom' | 'warehouses'

function workspaceForCatalogKey(key: string): MasterWorkspace | null {
  if (key === 'material-categories') return 'categories'
  if (key === 'material-usage-types') return 'usage'
  if (key === 'materials') return 'materials'
  if (key === 'material-types') return 'technical'
  if (key === 'uom') return 'uom'
  if (key === 'warehouses') return 'warehouses'
  return null
}

const emptyDictionaryForm = {
  code: '',
  name: '',
  description: '',
  categoryId: '',
  active: true,
}

const emptyMaterialForm = {
  code: '',
  name: '',
  description: '',
  categoryId: '',
  materialTypeId: '',
  materialUsageTypeId: '',
  unitId: '',
  materialUsageType: 'PRIMARY' as SaveInventoryItemPayload['materialUsageType'],
  minimumStock: 0,
}

const emptyUomForm = {
  code: '',
  name: '',
  symbol: '',
  category: '',
  precision: 0,
  baseUnitId: '',
  conversionFactor: '',
  active: true,
}

function SettingsCatalogs({ settingsCatalog, initialWorkspace }: { settingsCatalog?: SystemSettingsCatalog; initialWorkspace?: string | null }) {
  const queryClient = useQueryClient()
  const [workspace, setWorkspace] = useState<MasterWorkspace | null>(null)
  useEffect(() => {
    if (initialWorkspace === 'warehouses') setWorkspace('warehouses')
  }, [initialWorkspace])
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<MasterDataRecord[]>({
    queryKey: ['master-data-records', 'material-categories'],
    queryFn: () => getMasterDataRecords('material-categories'),
  })
  const { data: materialTypes = [], isLoading: materialTypesLoading } = useQuery<MasterDataRecord[]>({
    queryKey: ['master-data-records', 'material-types'],
    queryFn: () => getMasterDataRecords('material-types'),
  })
  const { data: materialUsageTypes = [], isLoading: materialUsageTypesLoading } = useQuery<MasterDataRecord[]>({
    queryKey: ['master-data-records', 'material-usage-types'],
    queryFn: () => getMasterDataRecords('material-usage-types'),
  })
  const { data: unitsResponse, isLoading: unitsLoading } = useQuery({
    queryKey: ['master-data-uom'],
    queryFn: () => getUnitsOfMeasure(),
  })
  const { data: materials = [], isLoading: materialsLoading } = useInventoryItems()
  const units = Array.isArray(unitsResponse)
    ? unitsResponse
    : ((unitsResponse as { data?: MasterUnit[] } | undefined)?.data ?? [])
  const materialRows = materials as any[]
  const activeUom = units.filter((unit) => unit.active).length
  const materialsWithStock = materialRows.filter((row) => Number(row.currentStock ?? row.quantity ?? 0) > 0).length
  const bomUsedMaterials = materialRows.filter((row) => Number(row.bomUsageCount ?? 0) > 0).length
  const technicalGate =
    'Specification/Profile chi tiết chưa có model riêng. V1 dùng MaterialType làm nhóm kỹ thuật canonical hiện hữu; không lưu thêm JSON/free-text.'

  const cards = [
    {
      id: 'categories' as const,
      title: 'Danh mục vật tư',
      description: 'Phân loại cấp cao của Material Master.',
      count: categories.length,
      badge: 'REAL_EDITABLE',
      icon: Package,
    },
    {
      id: 'usage' as const,
      title: 'Loại vật tư',
      description: 'Taxonomy phân loại vật tư chính, phụ, tiêu hao và các loại mở rộng.',
      count: materialUsageTypes.length,
      badge: 'REAL_EDITABLE',
      icon: Package,
    },
    {
      id: 'materials' as const,
      title: 'Material Master',
      description: 'Vật tư chính, phụ và tiêu hao dùng chung Inventory, BOM và Production.',
      count: materialRows.length,
      badge: 'REAL_EDITABLE',
      icon: FileDigit,
    },
    {
      id: 'technical' as const,
      title: 'Quy cách / Nhóm kỹ thuật',
      description: 'Nhóm kỹ thuật hiện hữu đang map tới MaterialType.',
      count: materialTypes.length,
      badge: 'YELLOW',
      icon: Ruler,
    },
    {
      id: 'warehouses' as const,
      title: 'Kho',
      description: 'Warehouse Master và capability vận hành dùng chung toàn hệ thống.',
      count: settingsCatalog?.categories.find((item) => item.key === 'warehouses')?.count ?? 0,
      badge: 'REAL_EDITABLE',
      icon: Warehouse,
    },
    {
      id: 'uom' as const,
      title: 'Đơn vị & Quy đổi',
      description: 'MasterUnit và conversion factor hiện hữu.',
      count: units.length,
      badge: 'REAL_EDITABLE',
      icon: SlidersHorizontal,
    },
  ]

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['master-data-records'] })
    queryClient.invalidateQueries({ queryKey: ['master-data-uom'] })
    queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
    queryClient.invalidateQueries({ queryKey: ['system-settings-catalog'] })
  }

  return (
    <div className="space-y-1">
      <section className="grid gap-1 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setWorkspace(card.id)}
              className="group rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3 text-left transition hover:border-cyan-300/40 hover:bg-cyan-300/[0.055]"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
                  <Icon size={18} />
                </span>
                <span className={`rounded-lg border px-2 py-0.5 text-[11px] ${card.badge === 'YELLOW' ? 'border-amber-500/30 bg-amber-500/10 text-amber-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'}`}>
                  {card.badge === 'YELLOW' ? 'Schema gate' : 'Thật / sửa được'}
                </span>
              </div>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">{card.title}</h3>
                  <p className="mt-1 min-h-8 text-xs leading-4 text-slate-500">{card.description}</p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-2xl font-semibold text-cyan-200">{fmt(card.count)}</div>
                  <div className="text-[11px] text-slate-500">records</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end text-xs font-semibold text-cyan-300">
                Mở quản trị <ChevronGlyph />
              </div>
            </button>
          )
        })}
      </section>

      <div className="grid gap-1 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Danh mục cấu hình hệ thống</h2>
              <p className="text-xs text-slate-500">Bốn danh mục vật tư dùng chung cùng source-of-truth với Inventory/BOM/Production.</p>
            </div>
            <button type="button" onClick={refresh} className={moduleMutedButton}>
              <RefreshCw size={14} /> Làm mới
            </button>
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <Info k="Tổng vật tư" v={fmt(materialRows.length)} />
            <Info k="Có tồn kho" v={fmt(materialsWithStock)} />
            <Info k="Được dùng trong BOM" v={fmt(bomUsedMaterials)} />
            <Info k="UOM hoạt động" v={fmt(settingsCatalog?.categories.find((item) => item.key === 'uom')?.metadata?.active as number | undefined ?? activeUom)} />
          </div>
        </section>

        <aside className="space-y-1">
          <CockpitChartCard title="Source-of-truth">
            <Info k="Danh mục vật tư" v="InventoryCategory" />
            <Info k="Vật tư chính" v="InventoryItem" />
            <Info k="Nhóm kỹ thuật" v="MaterialType" />
            <Info k="Đơn vị" v="MasterUnit" />
          </CockpitChartCard>
          <CockpitChartCard title="Schema gate">
            <p className="text-xs leading-5 text-slate-400">{technicalGate}</p>
          </CockpitChartCard>
        </aside>
      </div>

      {workspace === 'warehouses' ? (
        <WarehouseMasterWorkspace onClose={() => setWorkspace(null)} onChanged={refresh} />
      ) : (
        <MasterDataManagementModal
          workspace={workspace}
          categories={categories}
          materialUsageTypes={materialUsageTypes}
          materialTypes={materialTypes}
          materials={materialRows}
          units={units}
          loading={categoriesLoading || materialTypesLoading || materialUsageTypesLoading || unitsLoading || materialsLoading}
          onClose={() => setWorkspace(null)}
          onChanged={refresh}
        />
      )}
    </div>
  )
}

function MasterDataCrudHost({ workspace, onClose }: { workspace: MasterWorkspace | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<MasterDataRecord[]>({
    queryKey: ['master-data-records', 'material-categories'],
    queryFn: () => getMasterDataRecords('material-categories'),
    enabled: Boolean(workspace),
  })
  const { data: materialTypes = [], isLoading: materialTypesLoading } = useQuery<MasterDataRecord[]>({
    queryKey: ['master-data-records', 'material-types'],
    queryFn: () => getMasterDataRecords('material-types'),
    enabled: Boolean(workspace),
  })
  const { data: materialUsageTypes = [], isLoading: materialUsageTypesLoading } = useQuery<MasterDataRecord[]>({
    queryKey: ['master-data-records', 'material-usage-types'],
    queryFn: () => getMasterDataRecords('material-usage-types'),
    enabled: Boolean(workspace),
  })
  const { data: unitsResponse, isLoading: unitsLoading } = useQuery({
    queryKey: ['master-data-uom'],
    queryFn: () => getUnitsOfMeasure(),
    enabled: Boolean(workspace),
  })
  const { data: materials = [], isLoading: materialsLoading } = useInventoryItems()
  const units = Array.isArray(unitsResponse)
    ? unitsResponse
    : ((unitsResponse as { data?: MasterUnit[] } | undefined)?.data ?? [])

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['master-data-records'] })
    queryClient.invalidateQueries({ queryKey: ['master-data-uom'] })
    queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
    queryClient.invalidateQueries({ queryKey: ['inventory-materials'] })
    queryClient.invalidateQueries({ queryKey: ['system-settings-catalog'] })
  }

  if (workspace === 'warehouses') {
    return <WarehouseMasterWorkspace onClose={onClose} onChanged={refresh} />
  }

  return (
    <MasterDataManagementModal
      workspace={workspace}
      categories={categories}
      materialUsageTypes={materialUsageTypes}
      materialTypes={materialTypes}
      materials={materials as any[]}
      units={units}
      loading={categoriesLoading || materialTypesLoading || materialUsageTypesLoading || unitsLoading || materialsLoading}
      onClose={onClose}
      onChanged={refresh}
    />
  )
}

function ChevronGlyph() {
  return <span className="ml-1 text-base leading-none transition group-hover:translate-x-0.5">›</span>
}

function MasterDataManagementModal({
  workspace,
  categories,
  materialUsageTypes,
  materialTypes,
  materials,
  units,
  loading,
  onClose,
  onChanged,
}: {
  workspace: MasterWorkspace | null
  categories: MasterDataRecord[]
  materialUsageTypes: MasterDataRecord[]
  materialTypes: MasterDataRecord[]
  materials: any[]
  units: MasterUnit[]
  loading?: boolean
  onClose: () => void
  onChanged: () => void
}) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [materialTypeFilter, setMaterialTypeFilter] = useState('all')
  const [usageTypeFilter, setUsageTypeFilter] = useState('all')
  const [unitFilter, setUnitFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [density, setDensity] = useState<MasterDataDensity>('compact')
  const [view, setView] = useState<MasterDataView>('essential')
  const [drawerTab, setDrawerTab] = useState<MasterDataDrawerTab>('overview')
  const [pendingDeactivate, setPendingDeactivate] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [dictionaryForm, setDictionaryForm] = useState(emptyDictionaryForm)
  const [materialForm, setMaterialForm] = useState(emptyMaterialForm)
  const [uomForm, setUomForm] = useState(emptyUomForm)
  const queryClient = useQueryClient()

  const closeForm = () => {
    setEditing(null)
    setPendingDeactivate(false)
    setDrawerTab('overview')
    setDictionaryForm(emptyDictionaryForm)
    setMaterialForm(emptyMaterialForm)
    setUomForm(emptyUomForm)
  }

  const changed = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['master-data-records'] }),
      queryClient.invalidateQueries({ queryKey: ['master-data-uom'] }),
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] }),
      queryClient.invalidateQueries({ queryKey: ['inventory-materials'] }),
      queryClient.invalidateQueries({ queryKey: ['system-settings-catalog'] }),
    ])
    onChanged()
    closeForm()
  }

  const dictionaryMutation = useMutation({
    mutationFn: ({ domain, id, payload }: { domain: MasterDataDomainId; id?: string; payload: typeof emptyDictionaryForm }) =>
      id
        ? updateMasterDataRecord({ domain, id, payload })
        : createMasterDataRecord({ domain, payload }),
    onSuccess: changed,
  })
  const dictionaryDeactivate = useMutation({
    mutationFn: ({ domain, id }: { domain: MasterDataDomainId; id: string }) =>
      deactivateMasterDataRecord({ domain, id }),
    onSuccess: changed,
  })
  const materialMutation = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: SaveInventoryItemPayload }) =>
      id ? updateInventoryItem({ id, payload }) : createInventoryItem(payload),
    onSuccess: changed,
  })
  const materialDelete = useMutation({
    mutationFn: deleteInventoryItem,
    onSuccess: changed,
  })
  const uomMutation = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: any }) =>
      id ? updateUnitOfMeasure({ id, payload }) : createUnitOfMeasure(payload),
    onSuccess: changed,
  })
  const uomDeactivate = useMutation({
    mutationFn: deactivateUnitOfMeasure,
    onSuccess: changed,
  })

  useEffect(() => {
    setPage(1)
  }, [workspace, query, status, categoryFilter, materialTypeFilter, usageTypeFilter, unitFilter, pageSize])

  if (!workspace) return null

  const title =
    workspace === 'categories'
      ? 'Danh mục vật tư'
      : workspace === 'usage'
        ? 'Loại vật tư'
      : workspace === 'materials'
        ? 'Material Master'
        : workspace === 'technical'
          ? 'Quy cách / Nhóm kỹ thuật'
          : 'Đơn vị & Quy đổi'
  const description =
    workspace === 'categories'
      ? 'Phân loại cấp cao được Material Master tham chiếu.'
      : workspace === 'usage'
        ? 'Taxonomy phân loại Material Master theo mục đích sử dụng.'
      : workspace === 'materials'
        ? 'Quản lý toàn bộ vật tư chính, phụ và tiêu hao. Đây là hồ sơ vật tư, không tạo tồn kho.'
        : workspace === 'technical'
          ? 'V1 dùng MaterialType làm nhóm kỹ thuật canonical hiện hữu.'
          : 'Quản lý đơn vị tính, đơn vị cơ sở, hệ số quy đổi và độ chính xác từ MasterUnit.'
  const rows = workspace === 'categories'
    ? categories
    : workspace === 'usage'
      ? materialUsageTypes
      : workspace === 'technical'
      ? materialTypes
      : workspace === 'uom'
        ? units
        : materials
  const filtered = rows.filter((row: any) => {
    const active = workspace === 'materials' ? !row.deletedAt : row.active !== false
    if (status === 'active' && !active) return false
    if (status === 'inactive' && active) return false
    if (workspace === 'materials') {
      if (categoryFilter !== 'all' && row.categoryId !== categoryFilter) return false
      if (materialTypeFilter !== 'all' && row.materialTypeId !== materialTypeFilter) return false
      if (usageTypeFilter !== 'all') {
        const usageType = materialUsageTypes.find((item) => item.id === usageTypeFilter)
        if (row.materialUsageTypeId !== usageTypeFilter && row.materialUsageType !== usageType?.code && row.materialUsageTypeCode !== usageType?.code) return false
      }
      if (unitFilter !== 'all') {
        const unit = units.find((item) => item.id === unitFilter)
        if (row.unit !== unit?.code && row.unitId !== unitFilter) return false
      }
    }
    return `${row.code ?? row.materialCode ?? ''} ${row.name ?? row.materialName ?? ''} ${row.description ?? ''}`
      .toLowerCase()
      .includes(query.toLowerCase())
  })
  const paginatedRows = filtered.slice((page - 1) * pageSize, page * pageSize)
  const activeRows = rows.filter((row: any) => workspace === 'materials' ? !row.deletedAt : row.active !== false).length
  const linkedRows = rows.filter((row: any) => {
    if (workspace === 'materials') return Number(row.currentStock ?? row.quantity ?? 0) > 0 || Number(row.bomUsageCount ?? 0) > 0
    if (workspace === 'usage') return Number(row._count?.inventoryItems ?? 0) > 0
    if (workspace === 'uom') return materials.some((material) => material.unit === row.code || material.unitId === row.id)
    if (workspace === 'categories') return Number(row._count?.items ?? 0) > 0
    return Number(row._count?.inventoryItems ?? 0) > 0
  }).length

  const startCreate = () => {
    setEditing({ mode: 'create' })
    setPendingDeactivate(false)
    setDrawerTab('settings')
    setDictionaryForm(emptyDictionaryForm)
    setMaterialForm({
      ...emptyMaterialForm,
      categoryId: categories.find((item) => item.active)?.id ?? '',
      materialTypeId: materialTypes.find((item) => item.active)?.id ?? '',
      materialUsageTypeId: materialUsageTypes.find((item) => item.active)?.id ?? '',
      unitId: units.find((item) => item.active)?.id ?? '',
    })
    setUomForm({
      ...emptyUomForm,
      category: units[0]?.category ?? 'quantity',
    })
  }

  const startEdit = (row: any) => {
    setEditing(row)
    setPendingDeactivate(false)
    if (workspace === 'materials') {
      setMaterialForm({
        code: row.materialCode ?? row.code ?? '',
        name: row.materialName ?? row.name ?? '',
        description: row.description ?? '',
        categoryId: row.categoryId ?? '',
        materialTypeId: row.materialTypeId ?? '',
        materialUsageTypeId: row.materialUsageTypeId ?? materialUsageTypes.find((item) => item.code === row.materialUsageType)?.id ?? '',
        unitId: units.find((unit) => unit.code === row.unit)?.id ?? row.unitId ?? '',
        materialUsageType: row.materialUsageType ?? 'PRIMARY',
        minimumStock: Number(row.minimumStock ?? 0),
      })
      return
    }
    if (workspace === 'uom') {
      setUomForm({
        code: row.code ?? '',
        name: row.name ?? '',
        symbol: row.symbol ?? '',
        category: row.category ?? '',
        precision: Number(row.precision ?? 0),
        baseUnitId: row.baseUnitId ?? '',
        conversionFactor: row.conversionFactor == null ? '' : String(row.conversionFactor),
        active: row.active !== false,
      })
      return
    }
    setDictionaryForm({
      code: row.code ?? '',
      name: row.name ?? '',
      description: row.description ?? '',
      categoryId: row.categoryId ?? '',
      active: row.active !== false,
    })
  }

  const save = () => {
    if (workspace === 'materials') {
      const unit = units.find((item) => item.id === materialForm.unitId)
      materialMutation.mutate({
        id: editing?.mode === 'create' ? undefined : editing?.materialId ?? editing?.id,
        payload: {
          code: materialForm.code,
          name: materialForm.name,
          description: materialForm.description || undefined,
          categoryId: materialForm.categoryId,
          materialTypeId: materialForm.materialTypeId || undefined,
          materialUsageTypeId: materialForm.materialUsageTypeId || undefined,
          unitId: materialForm.unitId || undefined,
          unit: unit?.code ?? undefined,
          materialUsageType: materialForm.materialUsageType,
          minimumStock: Number(materialForm.minimumStock ?? 0),
        },
      })
      return
    }
    if (workspace === 'uom') {
      uomMutation.mutate({
        id: editing?.mode === 'create' ? undefined : editing?.id,
        payload: {
          code: uomForm.code,
          name: uomForm.name,
          symbol: uomForm.symbol,
          category: uomForm.category,
          precision: Number(uomForm.precision ?? 0),
          active: uomForm.active,
          baseUnitId: uomForm.baseUnitId || undefined,
          conversionFactor: uomForm.conversionFactor === '' ? undefined : Number(uomForm.conversionFactor),
        },
      })
      return
    }
    const domain: MasterDataDomainId =
      workspace === 'categories'
        ? 'material-categories'
        : workspace === 'usage'
          ? 'material-usage-types'
          : 'material-types'
    dictionaryMutation.mutate({
      domain,
      id: editing?.mode === 'create' ? undefined : editing?.id,
      payload: dictionaryForm,
    })
  }

  const saving = dictionaryMutation.isPending || materialMutation.isPending || uomMutation.isPending || materialDelete.isPending
  const error = dictionaryMutation.error || materialMutation.error || uomMutation.error || dictionaryDeactivate.error || uomDeactivate.error || materialDelete.error
  const deactivating = dictionaryDeactivate.isPending || uomDeactivate.isPending || materialDelete.isPending

  const canDeactivateRow = (row: any) => {
    if (workspace !== 'materials') return true
    return Number(row.currentStock ?? row.quantity ?? 0) <= 0 && Number(row.bomUsageCount ?? 0) <= 0
  }

  const deactivateRow = (row: any) => {
    if (!canDeactivateRow(row)) return
    if (workspace === 'materials') materialDelete.mutate(row.materialId ?? row.id)
    if (workspace === 'categories') dictionaryDeactivate.mutate({ domain: 'material-categories', id: row.id })
    if (workspace === 'usage') dictionaryDeactivate.mutate({ domain: 'material-usage-types', id: row.id })
    if (workspace === 'technical') dictionaryDeactivate.mutate({ domain: 'material-types', id: row.id })
    if (workspace === 'uom') uomDeactivate.mutate(row.id)
  }

  const selectRow = (row: any, tab: MasterDataDrawerTab = 'overview') => {
    startEdit(row)
    setDrawerTab(tab)
  }

  const dependencyNodes = editing && editing.mode !== 'create'
    ? workspace === 'materials'
      ? [
          { label: 'Tồn kho', count: Number(editing.currentStock ?? editing.quantity ?? 0), detail: 'Số lượng tồn hiện tại' },
          { label: 'BOM', count: Number(editing.bomUsageCount ?? 0), detail: 'BOM đang tham chiếu vật tư' },
        ]
      : workspace === 'uom'
        ? [{ label: 'Material Master', count: materials.filter((material) => material.unit === editing.code || material.unitId === editing.id).length }]
        : workspace === 'categories'
          ? [{ label: 'Material Master', count: Number(editing._count?.items ?? 0) }]
          : [{ label: 'Material Master', count: Number(editing._count?.inventoryItems ?? 0) }]
    : []

  const rowPadding = density === 'compact' ? 'py-1.5' : 'py-2.5'

  return (
    <UnifiedMasterDataWorkspace
      title={title}
      subtitle={description}
      onClose={onClose}
      error={error ? apiErrorMessage(error) : undefined}
      kpis={
        <MasterDataKpiStrip
          workspace={workspace}
          rows={rows}
          activeRows={activeRows}
          linkedRows={linkedRows}
          materials={materials}
          units={units}
        />
      }
      toolbar={
        <UnifiedMasterDataToolbar
          query={query}
          searchPlaceholder="Tìm mã, tên, mô tả..."
          density={density}
          view={view}
          createLabel={createLabelForWorkspace(workspace)}
          refreshing={loading}
          onQueryChange={setQuery}
          onDensityChange={setDensity}
          onViewChange={setView}
          onRefresh={onChanged}
          onCreate={startCreate}
          onExport={() => exportMasterDataCsv(
            `${workspace}-${new Date().toISOString().slice(0, 10)}.csv`,
            ['Mã', 'Tên', 'Trạng thái', 'Số tham chiếu', 'Cập nhật'],
            filtered.map((row: any) => [
              row.materialCode ?? row.code,
              row.materialName ?? row.name,
              workspace === 'materials' ? (!row.deletedAt ? 'Hoạt động' : 'Ngưng') : (row.active !== false ? 'Hoạt động' : 'Ngưng'),
              workspace === 'materials'
                ? Number(row.bomUsageCount ?? 0)
                : workspace === 'categories'
                  ? Number(row._count?.items ?? 0)
                  : Number(row._count?.inventoryItems ?? 0),
              row.updatedAt,
            ]),
          )}
          filters={
            <>
              <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-9 border border-white/10 bg-slate-950/55 px-2 text-xs font-medium text-slate-200 outline-none focus:border-cyan-400">
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Ngưng sử dụng</option>
              </select>
              {workspace === 'materials' ? (
                <>
                  <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-9 max-w-48 border border-white/10 bg-slate-950/55 px-2 text-xs font-medium text-slate-200 outline-none focus:border-cyan-400">
                    <option value="all">Tất cả danh mục</option>
                    {categories.map((item) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}
                  </select>
                  <select value={materialTypeFilter} onChange={(event) => setMaterialTypeFilter(event.target.value)} className="h-9 max-w-48 border border-white/10 bg-slate-950/55 px-2 text-xs font-medium text-slate-200 outline-none focus:border-cyan-400">
                    <option value="all">Tất cả nhóm kỹ thuật</option>
                    {materialTypes.map((item) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}
                  </select>
                  <select value={usageTypeFilter} onChange={(event) => setUsageTypeFilter(event.target.value)} className="h-9 max-w-44 border border-white/10 bg-slate-950/55 px-2 text-xs font-medium text-slate-200 outline-none focus:border-cyan-400">
                    <option value="all">Tất cả loại vật tư</option>
                    {materialUsageTypes.map((item) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}
                  </select>
                  <select value={unitFilter} onChange={(event) => setUnitFilter(event.target.value)} className="h-9 max-w-40 border border-white/10 bg-slate-950/55 px-2 text-xs font-medium text-slate-200 outline-none focus:border-cyan-400">
                    <option value="all">Tất cả đơn vị</option>
                    {units.map((item) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}
                  </select>
                </>
              ) : null}
            </>
          }
        />
      }
    >
      <div className="flex h-full min-h-0 flex-col pt-4">
        <CockpitTableShell className="min-h-0 flex-1 overflow-auto rounded-none">
          {loading ? (
            <ModuleLoadingState label={`Đang tải ${title.toLowerCase()}`} />
          ) : filtered.length > 0 ? (
            <table className={`w-full table-fixed text-xs ${view === 'essential' ? 'min-w-[880px]' : 'min-w-[1180px]'}`}>
              <thead className="sticky top-0 z-10 border-b border-cyan-400/10 bg-[#0b1b2d] text-slate-300">
                {workspace === 'materials' ? <MaterialHeader view={view} /> : workspace === 'uom' ? <UomHeader view={view} /> : <DictionaryHeader workspace={workspace} view={view} />}
              </thead>
              <tbody>
                {paginatedRows.map((row: any) => (
                  <tr key={row.id ?? row.materialId} onClick={() => selectRow(row)} className="cursor-pointer border-b border-cyan-300/10 font-medium text-slate-300 hover:bg-cyan-300/[0.055]">
                    {workspace === 'materials' ? (
                      <MaterialRow row={row} materialUsageTypes={materialUsageTypes} view={view} rowPadding={rowPadding} />
                    ) : workspace === 'uom' ? (
                      <UomRow row={row} materials={materials} view={view} rowPadding={rowPadding} />
                    ) : (
                      <DictionaryRow row={row} workspace={workspace} view={view} rowPadding={rowPadding} />
                    )}
                    <td className={`px-2 ${rowPadding} text-right`}>
                      <button type="button" onClick={(event) => { event.stopPropagation(); selectRow(row, 'settings') }} aria-label="Sửa bản ghi" title="Sửa" className="mr-1 inline-flex h-7 w-7 items-center justify-center border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20">
                        <Edit3 size={13} />
                      </button>
                      <button type="button" onClick={(event) => { event.stopPropagation(); selectRow(row, 'dependencies'); setPendingDeactivate(true) }} disabled={deactivating} aria-label="Kiểm tra phụ thuộc" title="Kiểm tra phụ thuộc trước khi ngưng sử dụng" className="inline-flex h-7 w-7 items-center justify-center border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40">
                        <Power size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <CockpitEmptyState title="Chưa có dữ liệu" description="Không tìm thấy bản ghi phù hợp. Dữ liệu chỉ lấy từ backend thật." />
          )}
        </CockpitTableShell>
        {!loading && filtered.length > pageSize ? (
          <DataTablePagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        ) : null}
      </div>

      <UnifiedMasterDataDrawer
        open={Boolean(editing)}
        title={editing?.mode === 'create' ? createLabelForWorkspace(workspace) : `${editing?.materialCode ?? editing?.code ?? ''} · ${editing?.materialName ?? editing?.name ?? title}`}
        subtitle={sourceForWorkspace(workspace)}
        activeTab={drawerTab}
        onTabChange={setDrawerTab}
        onClose={closeForm}
      >
        {drawerTab === 'overview' ? (
          <WorkspaceSummary workspace={workspace} materials={materials} categories={categories} materialUsageTypes={materialUsageTypes} materialTypes={materialTypes} units={units} />
        ) : drawerTab === 'dependencies' ? (
          <div className="space-y-4">
            <MasterDataDependencyTree nodes={dependencyNodes} />
            {editing?.mode !== 'create' ? (
              <section className="border border-amber-400/20 bg-amber-400/[0.05] p-4">
                <h3 className="text-sm font-semibold text-white">Kiểm tra trước khi ngưng sử dụng</h3>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Thao tác dùng đúng contract deactivate/soft-delete hiện có. Vật tư còn tồn hoặc đang được BOM tham chiếu sẽ bị chặn.
                </p>
                {pendingDeactivate ? (
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-amber-400/15 pt-3">
                    <span className="text-xs font-medium text-amber-200">Xác nhận ngưng sử dụng bản ghi này?</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setPendingDeactivate(false)} className={moduleMutedButton}>Hủy</button>
                      <button type="button" onClick={() => deactivateRow(editing)} disabled={!canDeactivateRow(editing) || deactivating} className="h-8 bg-amber-600 px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Ngưng sử dụng</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setPendingDeactivate(true)} disabled={!canDeactivateRow(editing)} className="mt-3 h-8 border border-amber-400/25 bg-amber-400/10 px-3 text-xs font-semibold text-amber-200 disabled:cursor-not-allowed disabled:opacity-40">Kiểm tra và ngưng sử dụng</button>
                )}
              </section>
            ) : null}
          </div>
        ) : drawerTab === 'history' ? (
          <section className="border border-cyan-300/15 bg-slate-950/35 p-4">
            <h3 className="text-xs font-semibold uppercase text-cyan-300">Lịch sử khả dụng</h3>
            <div className="mt-3 border-l border-cyan-300/25 pl-4 text-xs">
              <p className="font-medium text-slate-200">Cập nhật gần nhất</p>
              <p className="mt-1 font-mono text-slate-500">{date(editing?.updatedAt)}</p>
              <p className="mt-3 text-slate-500">API hiện không cung cấp audit timeline riêng cho bản ghi này; không tạo lịch sử giả ở frontend.</p>
            </div>
          </section>
        ) : (
          <MasterDataForm
            workspace={workspace}
            editing={editing}
            dictionaryForm={dictionaryForm}
            setDictionaryForm={setDictionaryForm}
            materialForm={materialForm}
            setMaterialForm={setMaterialForm}
            uomForm={uomForm}
            setUomForm={setUomForm}
            categories={categories}
            materialUsageTypes={materialUsageTypes}
            materialTypes={materialTypes}
            units={units}
            saving={saving}
            error={error}
            onSave={save}
            onCancel={closeForm}
            onDeactivate={() => { setDrawerTab('dependencies'); setPendingDeactivate(true) }}
          />
        )}
      </UnifiedMasterDataDrawer>
    </UnifiedMasterDataWorkspace>
  )
}

function DictionaryHeader({ workspace, view }: { workspace: MasterWorkspace; view: MasterDataView }) {
  return (
    <tr>
      <th className="w-[120px] px-2 py-2 text-left font-medium">Mã</th>
      <th className="w-[180px] px-2 py-2 text-left font-medium">Tên</th>
      {workspace === 'technical' && <th className="w-[180px] px-2 py-2 text-left font-medium">Danh mục</th>}
      {view === 'complete' ? <th className="px-2 py-2 text-left font-medium">Mô tả</th> : null}
      <th className="w-[90px] px-2 py-2 text-right font-medium">Số vật tư</th>
      <th className="w-[110px] px-2 py-2 text-right font-medium">Trạng thái</th>
      {view === 'complete' ? <th className="w-[120px] px-2 py-2 text-right font-medium">Cập nhật</th> : null}
      <th className="w-[76px] px-2 py-2 text-right font-medium">Thao tác</th>
    </tr>
  )
}

function DictionaryRow({ row, workspace, view, rowPadding }: { row: MasterDataRecord; workspace: MasterWorkspace; view: MasterDataView; rowPadding: string }) {
  const used = workspace === 'categories'
    ? Number(row._count?.items ?? 0)
    : Number(row._count?.inventoryItems ?? 0)
  return (
    <>
      <td className={`truncate px-2 ${rowPadding} font-mono font-semibold text-cyan-300`} title={row.code}>{row.code}</td>
      <td className={`truncate px-2 ${rowPadding} font-semibold text-white`} title={row.name}>{row.name}</td>
      {workspace === 'technical' && <td className={`truncate px-2 ${rowPadding} text-slate-400`} title={row.category?.name ?? ''}>{row.category?.name ?? '—'}</td>}
      {view === 'complete' ? <td className={`truncate px-2 ${rowPadding} text-slate-400`} title={row.description ?? ''}>{row.description ?? '—'}</td> : null}
      <td className={`px-2 ${rowPadding} text-right font-mono text-slate-300`}>{fmt(used)}</td>
      <td className={`px-2 ${rowPadding} text-right`}><ActiveBadge active={row.active} /></td>
      {view === 'complete' ? <td className={`px-2 ${rowPadding} text-right font-mono text-[11px] text-slate-500`}>{date(row.updatedAt)}</td> : null}
    </>
  )
}

function MaterialHeader({ view }: { view: MasterDataView }) {
  return (
    <tr>
      <th className="w-[120px] px-2 py-2 text-left font-medium">Mã vật tư</th>
      <th className="w-[190px] px-2 py-2 text-left font-medium">Tên vật tư</th>
      <th className="w-[150px] px-2 py-2 text-left font-medium">Danh mục</th>
      <th className="w-[150px] px-2 py-2 text-left font-medium">Nhóm kỹ thuật</th>
      <th className="w-[100px] px-2 py-2 text-left font-medium">Loại dùng</th>
      <th className="w-[80px] px-2 py-2 text-left font-medium">Đơn vị</th>
      {view === 'complete' ? <th className="w-[100px] px-2 py-2 text-right font-medium">Tồn hiện tại</th> : null}
      {view === 'complete' ? <th className="w-[70px] px-2 py-2 text-right font-medium">BOM</th> : null}
      <th className="w-[110px] px-2 py-2 text-right font-medium">Trạng thái</th>
      {view === 'complete' ? <th className="w-[120px] px-2 py-2 text-right font-medium">Cập nhật</th> : null}
      <th className="w-[76px] px-2 py-2 text-right font-medium">Thao tác</th>
    </tr>
  )
}

function MaterialRow({ row, materialUsageTypes, view, rowPadding }: { row: any; materialUsageTypes: MasterDataRecord[]; view: MasterDataView; rowPadding: string }) {
  const usageType = materialUsageTypes.find((item) => item.id === row.materialUsageTypeId || item.code === row.materialUsageTypeCode || item.code === row.materialUsageType)
  return (
    <>
      <td className={`truncate px-2 ${rowPadding} font-mono font-semibold text-cyan-300`} title={row.materialCode ?? row.code}>{row.materialCode ?? row.code}</td>
      <td className={`truncate px-2 ${rowPadding} font-semibold text-white`} title={row.materialName ?? row.name}>{row.materialName ?? row.name}</td>
      <td className={`truncate px-2 ${rowPadding} text-slate-400`} title={row.category ?? ''}>{row.category ?? '—'}</td>
      <td className={`truncate px-2 ${rowPadding} text-slate-400`} title={row.materialType ?? ''}>{row.materialType ?? '—'}</td>
      <td className={`px-2 ${rowPadding}`}><UsageTypeBadge value={usageType?.name ?? row.materialUsageTypeName ?? row.materialUsageType} /></td>
      <td className={`truncate px-2 ${rowPadding} text-slate-400`} title={row.unit ?? ''}>{row.unit ?? '—'}</td>
      {view === 'complete' ? <td className={`px-2 ${rowPadding} text-right font-mono`}>{fmt(Number(row.currentStock ?? row.quantity ?? 0))}</td> : null}
      {view === 'complete' ? <td className={`px-2 ${rowPadding} text-right font-mono`}>{fmt(Number(row.bomUsageCount ?? 0))}</td> : null}
      <td className={`px-2 ${rowPadding} text-right`}><ActiveBadge active={!row.deletedAt} /></td>
      {view === 'complete' ? <td className={`px-2 ${rowPadding} text-right font-mono text-[11px] text-slate-500`}>{date(row.updatedAt)}</td> : null}
    </>
  )
}

function UomHeader({ view }: { view: MasterDataView }) {
  return (
    <tr>
      <th className="w-[90px] px-2 py-2 text-left font-medium">Mã</th>
      <th className="w-[150px] px-2 py-2 text-left font-medium">Tên đơn vị</th>
      <th className="w-[90px] px-2 py-2 text-left font-medium">Ký hiệu</th>
      {view === 'complete' ? <th className="w-[100px] px-2 py-2 text-left font-medium">Loại</th> : null}
      {view === 'complete' ? <th className="w-[130px] px-2 py-2 text-left font-medium">Đơn vị cơ sở</th> : null}
      {view === 'complete' ? <th className="w-[90px] px-2 py-2 text-right font-medium">Hệ số</th> : null}
      <th className="w-[80px] px-2 py-2 text-right font-medium">Sử dụng</th>
      <th className="w-[110px] px-2 py-2 text-right font-medium">Trạng thái</th>
      {view === 'complete' ? <th className="w-[120px] px-2 py-2 text-right font-medium">Cập nhật</th> : null}
      <th className="w-[76px] px-2 py-2 text-right font-medium">Thao tác</th>
    </tr>
  )
}

function UomRow({ row, materials, view, rowPadding }: { row: MasterUnit; materials: any[]; view: MasterDataView; rowPadding: string }) {
  const used = materials.filter((material) => material.unit === row.code || material.unitId === row.id).length
  return (
    <>
      <td className={`truncate px-2 ${rowPadding} font-mono font-semibold text-cyan-300`} title={row.code}>{row.code}</td>
      <td className={`truncate px-2 ${rowPadding} font-semibold text-white`} title={row.name}>{row.name}</td>
      <td className={`truncate px-2 ${rowPadding} text-slate-400`} title={row.symbol}>{row.symbol}</td>
      {view === 'complete' ? <td className={`px-2 ${rowPadding} text-slate-400`}>{uomCategoryLabel(row.category)}</td> : null}
      {view === 'complete' ? <td className={`truncate px-2 ${rowPadding} text-slate-400`} title={row.baseUnit?.code ?? ''}>{row.baseUnit?.code ?? 'Đơn vị cơ sở'}</td> : null}
      {view === 'complete' ? <td className={`px-2 ${rowPadding} text-right font-mono`}>{row.conversionFactor ?? '—'}</td> : null}
      <td className={`px-2 ${rowPadding} text-right font-mono`}>{fmt(used)}</td>
      <td className={`px-2 ${rowPadding} text-right`}><ActiveBadge active={row.active} /></td>
      {view === 'complete' ? <td className={`px-2 ${rowPadding} text-right font-mono text-[11px] text-slate-500`}>{date(row.updatedAt)}</td> : null}
    </>
  )
}

function ActiveBadge({ active }: { active: boolean }) {
  return <span className={`rounded-lg border px-2 py-0.5 text-[11px] ${active ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-slate-500/30 bg-slate-500/10 text-slate-300'}`}>{active ? 'Hoạt động' : 'Ngưng'}</span>
}

function UsageTypeBadge({ value }: { value?: string }) {
  const label =
    value === 'SECONDARY'
      ? 'Phụ'
      : value === 'CONSUMABLE'
        ? 'Tiêu hao'
        : value === 'PRIMARY'
          ? 'Chính'
          : value || '—'
  return <span className="rounded-lg border border-blue-400/20 bg-blue-400/10 px-2 py-0.5 text-[11px] font-semibold text-blue-200">{label}</span>
}

function MasterDataKpiStrip({
  workspace,
  rows,
  activeRows,
  linkedRows,
  materials,
  units,
}: {
  workspace: MasterWorkspace
  rows: any[]
  activeRows: number
  linkedRows: number
  materials: any[]
  units: MasterUnit[]
}) {
  const materialStockRows = materials.filter((row) => Number(row.currentStock ?? row.quantity ?? 0) > 0).length
  const materialBomRows = materials.filter((row) => Number(row.bomUsageCount ?? 0) > 0).length
  const baseUnits = units.filter((unit) => !unit.baseUnitId).length
  const kpis =
    workspace === 'materials'
      ? [
          ['Tổng vật tư', rows.length, 'Hồ sơ Material Master', FileDigit, 'blue'],
          ['Đang hoạt động', activeRows, 'Chưa bị ẩn', CheckCircle2, 'emerald'],
          ['Có tồn kho', materialStockRows, 'Có stock thực tế', Package, 'cyan'],
          ['Đang dùng BOM', materialBomRows, 'Có tham chiếu BOM', Link2, 'amber'],
        ]
      : workspace === 'uom'
        ? [
            ['Tổng đơn vị', rows.length, 'MasterUnit', SlidersHorizontal, 'blue'],
            ['Đang hoạt động', activeRows, 'Có thể chọn', CheckCircle2, 'emerald'],
            ['Đơn vị cơ sở', baseUnits, 'Không có baseUnitId', Ruler, 'cyan'],
            ['Được tham chiếu', linkedRows, 'Material Master dùng', Link2, 'amber'],
          ]
        : workspace === 'usage'
          ? [
              ['Tổng loại', rows.length, 'Taxonomy vật tư', Package, 'blue'],
              ['Đang hoạt động', activeRows, 'Có thể chọn', CheckCircle2, 'emerald'],
              ['Đang sử dụng', linkedRows, 'Có vật tư tham chiếu', Link2, 'cyan'],
              ['Tổng vật tư phân loại', materials.length, 'Material Master', FileDigit, 'amber'],
            ]
          : workspace === 'technical'
            ? [
                ['Tổng nhóm', rows.length, 'MaterialType', Ruler, 'blue'],
                ['Đang hoạt động', activeRows, 'Có thể chọn', CheckCircle2, 'emerald'],
                ['Đang sử dụng', linkedRows, 'Có vật tư tham chiếu', Link2, 'cyan'],
                ['Material references', rows.reduce((sum, row) => sum + Number(row._count?.inventoryItems ?? 0), 0), 'Từ backend count', FileDigit, 'amber'],
              ]
            : [
                ['Tổng danh mục', rows.length, 'InventoryCategory', Package, 'blue'],
                ['Đang hoạt động', activeRows, 'Có thể chọn', CheckCircle2, 'emerald'],
                ['Có vật tư sử dụng', linkedRows, 'Có item tham chiếu', Link2, 'cyan'],
                ['Material references', rows.reduce((sum, row) => sum + Number(row._count?.items ?? 0), 0), 'Từ backend count', FileDigit, 'amber'],
              ]

  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
      {kpis.map(([label, value, note, Icon, tone]) => (
        <CockpitKpiCard
          key={String(label)}
          title={String(label)}
          value={fmt(Number(value))}
          note={String(note)}
          icon={<Icon size={16} />}
          tone={tone as any}
          trend={[0, Number(value), Number(value)]}
          className="h-[92px]"
        />
      ))}
    </div>
  )
}

function createLabelForWorkspace(workspace: MasterWorkspace) {
  if (workspace === 'categories') return 'Thêm danh mục'
  if (workspace === 'usage') return 'Thêm loại vật tư'
  if (workspace === 'materials') return 'Thêm vật tư'
  if (workspace === 'technical') return 'Thêm nhóm kỹ thuật'
  return 'Thêm đơn vị'
}

function entityLabelForWorkspace(workspace: MasterWorkspace) {
  if (workspace === 'categories') return 'danh mục vật tư'
  if (workspace === 'usage') return 'loại vật tư'
  if (workspace === 'materials') return 'vật tư'
  if (workspace === 'technical') return 'nhóm kỹ thuật'
  return 'đơn vị'
}

function sourceForWorkspace(workspace: MasterWorkspace) {
  if (workspace === 'materials') return '/inventory/items'
  if (workspace === 'uom') return '/master-data/uom'
  if (workspace === 'categories') return '/master-data/material-categories'
  if (workspace === 'usage') return '/master-data/material-usage-types'
  return '/master-data/material-types'
}

function uomCategoryLabel(value?: string) {
  if (value === 'weight') return 'Khối lượng'
  if (value === 'length') return 'Chiều dài'
  if (value === 'quantity') return 'Số lượng'
  if (value === 'area') return 'Diện tích'
  if (value === 'volume') return 'Thể tích'
  return value ?? '—'
}

function WorkspaceSummary({ workspace, materials, categories, materialUsageTypes, materialTypes, units }: { workspace: MasterWorkspace; materials: any[]; categories: MasterDataRecord[]; materialUsageTypes: MasterDataRecord[]; materialTypes: MasterDataRecord[]; units: MasterUnit[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white">Quan hệ dữ liệu</h3>
      <p className="text-xs leading-5 text-slate-400">
        Chọn một dòng để chỉnh sửa. Khu vực này chỉ hiển thị quan hệ và nguồn dữ liệu,
        không lặp lại KPI phía trên.
      </p>
      <Info k="Workspace" v={entityLabelForWorkspace(workspace)} />
      <Info k="Source" v={sourceForWorkspace(workspace)} />
      <Info k="Tạo tồn kho" v="Không" />
      {workspace === 'technical' && <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-5 text-amber-200">Profile/specification chi tiết chưa có model riêng. Không tạo schema trong sprint này nếu chưa qua schema gate.</p>}
      {workspace === 'usage' && <p className="rounded-xl border border-cyan-300/10 bg-cyan-300/[0.05] p-3 text-xs leading-5 text-cyan-100">Loại vật tư là taxonomy riêng của Material Master. Không dùng MaterialType cho mục đích này.</p>}
      <div className="rounded-xl border border-cyan-300/10 bg-slate-950/35 p-3 text-xs leading-5 text-slate-400">
        Category ({fmt(categories.length)}) → Loại vật tư ({fmt(materialUsageTypes.length)}) → MaterialType ({fmt(materialTypes.length)}) → Material Master ({fmt(materials.length)}) → UOM ({fmt(units.length)}).
      </div>
    </div>
  )
}

function MasterDataForm({
  workspace,
  editing,
  dictionaryForm,
  setDictionaryForm,
  materialForm,
  setMaterialForm,
  uomForm,
  setUomForm,
  categories,
  materialUsageTypes,
  materialTypes,
  units,
  saving,
  error,
  onSave,
  onCancel,
  onDeactivate,
}: {
  workspace: MasterWorkspace
  editing: any
  dictionaryForm: typeof emptyDictionaryForm
  setDictionaryForm: (value: typeof emptyDictionaryForm) => void
  materialForm: typeof emptyMaterialForm
  setMaterialForm: (value: typeof emptyMaterialForm) => void
  uomForm: typeof emptyUomForm
  setUomForm: (value: typeof emptyUomForm) => void
  categories: MasterDataRecord[]
  materialUsageTypes: MasterDataRecord[]
  materialTypes: MasterDataRecord[]
  units: MasterUnit[]
  saving: boolean
  error: unknown
  onSave: () => void
  onCancel: () => void
  onDeactivate: () => void
}) {
  const isCreate = editing?.mode === 'create'
  const materialStock = Number(editing?.currentStock ?? editing?.quantity ?? 0)
  const materialBomUsage = Number(editing?.bomUsageCount ?? 0)
  const selectedBaseUnit = units.find((unit) => unit.id === uomForm.baseUnitId)
  const materialDeleteBlocked =
    workspace === 'materials' && !isCreate && (materialStock > 0 || materialBomUsage > 0)
  const validation = validateMasterDataForm(workspace, dictionaryForm, materialForm, uomForm)
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-cyan-300/10 p-3">
        <h3 className="text-sm font-semibold text-white">
          {isCreate ? createLabelForWorkspace(workspace) : `Sửa: ${editing.materialCode ?? editing.code ?? editing.name ?? entityLabelForWorkspace(workspace)}`}
        </h3>
        <p className="mt-1 text-xs text-slate-500">Lưu qua API backend thật, không dùng local-only state.</p>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {workspace === 'materials' ? (
          <>
          <FormBlock title="Thông tin cơ bản">
            <TextInput label="Mã vật tư *" value={materialForm.code} onChange={(value) => setMaterialForm({ ...materialForm, code: value })} />
            <TextInput label="Tên vật tư *" value={materialForm.name} onChange={(value) => setMaterialForm({ ...materialForm, name: value })} />
            <TextArea label="Ghi chú" value={materialForm.description} onChange={(value) => setMaterialForm({ ...materialForm, description: value })} />
          </FormBlock>
          <FormBlock title="Phân loại">
            <SelectInput label="Danh mục *" value={materialForm.categoryId} onChange={(value) => setMaterialForm({ ...materialForm, categoryId: value })} options={categories.filter((item) => item.active).map((item) => ({ value: item.id, label: `${item.code} - ${item.name}` }))} />
            <SelectInput label="Nhóm kỹ thuật" value={materialForm.materialTypeId} onChange={(value) => setMaterialForm({ ...materialForm, materialTypeId: value })} options={materialTypes.filter((item) => item.active).map((item) => ({ value: item.id, label: `${item.code} - ${item.name}` }))} />
            <SelectInput label="Loại vật tư *" value={materialForm.materialUsageTypeId} onChange={(value) => setMaterialForm({ ...materialForm, materialUsageTypeId: value })} options={materialUsageTypes.filter((item) => item.active).map((item) => ({ value: item.id, label: `${item.code} - ${item.name}` }))} />
          </FormBlock>
          <FormBlock title="Đơn vị">
            <SelectInput label="Đơn vị tính" value={materialForm.unitId} onChange={(value) => setMaterialForm({ ...materialForm, unitId: value })} options={units.filter((item) => item.active).map((item) => ({ value: item.id, label: `${item.code} - ${item.name}` }))} />
            <NumberInput label="Tồn tối thiểu" value={materialForm.minimumStock} onChange={(value) => setMaterialForm({ ...materialForm, minimumStock: value })} />
          </FormBlock>
          </>
        ) : workspace === 'uom' ? (
          <>
          <FormBlock title="Thông tin cơ bản">
            <TextInput label="Mã đơn vị *" value={uomForm.code} onChange={(value) => setUomForm({ ...uomForm, code: value })} />
            <TextInput label="Tên đơn vị *" value={uomForm.name} onChange={(value) => setUomForm({ ...uomForm, name: value })} />
            <TextInput label="Ký hiệu *" value={uomForm.symbol} onChange={(value) => setUomForm({ ...uomForm, symbol: value })} />
          </FormBlock>
          <FormBlock title="Quy đổi">
            <SelectInput label="Loại đơn vị *" value={uomForm.category} onChange={(value) => setUomForm({ ...uomForm, category: value, baseUnitId: '', conversionFactor: '' })} options={Array.from(new Set([...units.map((unit) => unit.category), 'weight', 'length', 'quantity', 'area', 'volume'])).map((item) => ({ value: item, label: uomCategoryLabel(item) }))} />
            <SelectInput label="Đơn vị cơ sở" value={uomForm.baseUnitId} onChange={(value) => setUomForm({ ...uomForm, baseUnitId: value, conversionFactor: value ? uomForm.conversionFactor : '' })} options={[{ value: '', label: 'Đây là đơn vị cơ sở' }, ...units.filter((unit) => unit.active && unit.id !== editing?.id && unit.category === uomForm.category).map((unit) => ({ value: unit.id, label: `${unit.code} - ${unit.name}` }))]} />
            <TextInput label="Hệ số quy đổi" value={uomForm.conversionFactor} onChange={(value) => setUomForm({ ...uomForm, conversionFactor: value })} disabled={!uomForm.baseUnitId} placeholder={uomForm.baseUnitId ? 'Ví dụ: 1000' : 'Không áp dụng cho đơn vị cơ sở'} />
            <NumberInput label="Precision" value={uomForm.precision} onChange={(value) => setUomForm({ ...uomForm, precision: value })} />
            <div className="rounded-xl border border-cyan-300/10 bg-cyan-300/[0.04] p-3 text-xs leading-5 text-slate-300">
              <div className="font-semibold text-cyan-200">Quan hệ quy đổi</div>
              {uomForm.baseUnitId ? (
                <p className="mt-1">
                  1 {uomForm.symbol || uomForm.code || 'đơn vị'} = {uomForm.conversionFactor || '...'} {selectedBaseUnit?.symbol || selectedBaseUnit?.code || 'đơn vị cơ sở'}
                </p>
              ) : (
                <p className="mt-1">Đây là đơn vị cơ sở trong nhóm {uomCategoryLabel(uomForm.category)}. Backend không yêu cầu hệ số quy đổi khi không chọn đơn vị cơ sở.</p>
              )}
            </div>
          </FormBlock>
          </>
        ) : (
          <>
          <FormBlock title="Thông tin cơ bản">
            <TextInput label="Mã *" value={dictionaryForm.code} onChange={(value) => setDictionaryForm({ ...dictionaryForm, code: value })} />
            <TextInput label="Tên *" value={dictionaryForm.name} onChange={(value) => setDictionaryForm({ ...dictionaryForm, name: value })} />
            <TextArea label="Mô tả" value={dictionaryForm.description} onChange={(value) => setDictionaryForm({ ...dictionaryForm, description: value })} />
          </FormBlock>
          {workspace === 'technical' && (
            <FormBlock title="Phân loại">
              <SelectInput label="Danh mục *" value={dictionaryForm.categoryId} onChange={(value) => setDictionaryForm({ ...dictionaryForm, categoryId: value })} options={categories.filter((item) => item.active).map((item) => ({ value: item.id, label: `${item.code} - ${item.name}` }))} />
            </FormBlock>
          )}
          </>
        )}
        {workspace !== 'materials' && (
          <label className="flex items-center gap-2 rounded-xl border border-cyan-300/10 bg-slate-950/35 p-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={workspace === 'uom' ? uomForm.active : dictionaryForm.active}
              onChange={(event) => workspace === 'uom' ? setUomForm({ ...uomForm, active: event.target.checked }) : setDictionaryForm({ ...dictionaryForm, active: event.target.checked })}
            />
            Đang hoạt động
          </label>
        )}
        <FormBlock title="Tổng hợp">
          <Info k="Thao tác" v={isCreate ? 'Tạo mới' : 'Cập nhật'} />
          <Info k="Source" v={sourceForWorkspace(workspace)} />
          <Info k="Tạo tồn kho" v="Không" />
          {workspace === 'materials' && !isCreate && (
            <>
              <Info k="Tồn hiện tại" v={fmt(materialStock)} />
              <Info k="BOM usage" v={fmt(materialBomUsage)} />
            </>
          )}
        </FormBlock>
        {validation && <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-xs text-amber-200">{validation}</p>}
        {materialDeleteBlocked && <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-xs text-amber-200">Không thể ẩn vật tư vì đang còn tồn kho hoặc đang được dùng trong BOM.</p>}
        {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-300">{apiErrorMessage(error)}</p>}
      </div>
      <footer className="flex items-center justify-between gap-2 border-t border-cyan-300/10 bg-[#07111f]/95 p-3 backdrop-blur">
        <div>
          {!isCreate && (
            <button type="button" onClick={onDeactivate} disabled={saving || materialDeleteBlocked} className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50">
              <Power size={13} /> {workspace === 'materials' ? 'Ẩn vật tư' : 'Ngưng sử dụng'}
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className={moduleMutedButton}>Hủy</button>
          <button type="button" onClick={onSave} disabled={saving || Boolean(validation)} className={modulePrimaryButton}>{saving ? 'Đang lưu...' : isCreate ? 'Tạo' : 'Lưu'}</button>
        </div>
      </footer>
    </div>
  )
}

function validateMasterDataForm(
  workspace: MasterWorkspace,
  dictionaryForm: typeof emptyDictionaryForm,
  materialForm: typeof emptyMaterialForm,
  uomForm: typeof emptyUomForm,
) {
  if (workspace === 'materials') {
    if (!materialForm.code.trim()) return 'Vui lòng nhập mã vật tư.'
    if (!materialForm.name.trim()) return 'Vui lòng nhập tên vật tư.'
    if (!materialForm.categoryId) return 'Vui lòng chọn danh mục vật tư.'
    if (!materialForm.materialUsageTypeId) return 'Vui lòng chọn loại vật tư.'
    if (!materialForm.unitId) return 'Vui lòng chọn đơn vị tính.'
    return ''
  }

  if (workspace === 'uom') {
    if (!uomForm.code.trim()) return 'Vui lòng nhập mã đơn vị.'
    if (uomForm.code.trim().length > 32) return 'Mã đơn vị không được vượt quá 32 ký tự.'
    if (!uomForm.name.trim()) return 'Vui lòng nhập tên đơn vị.'
    if (!uomForm.symbol.trim()) return 'Vui lòng nhập ký hiệu đơn vị.'
    if (!uomForm.category) return 'Vui lòng chọn loại đơn vị.'
    if (uomForm.baseUnitId && uomForm.conversionFactor === '') return 'Đơn vị quy đổi cần có hệ số quy đổi.'
    return ''
  }

  if (!dictionaryForm.code.trim()) return 'Vui lòng nhập mã.'
  if (!dictionaryForm.name.trim()) return 'Vui lòng nhập tên.'
  if (workspace === 'technical' && !dictionaryForm.categoryId) return 'Vui lòng chọn danh mục vật tư.'
  return ''
}

function FormBlock({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-cyan-300/10 bg-slate-950/25 p-3"><h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">{title}</h4><div className="space-y-2">{children}</div></section>
}

function TextInput({
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}) {
  return (
    <label className="block text-xs text-slate-400">
      <span className="mb-1 block font-medium text-slate-300">{label}</span>
      <input
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-xs text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  )
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="block text-xs text-slate-400"><span className="mb-1 block font-medium text-slate-300">{label}</span><input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} className="h-9 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-xs text-slate-100 outline-none focus:border-cyan-400" /></label>
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-xs text-slate-400"><span className="mb-1 block font-medium text-slate-300">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="w-full resize-none rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-400" /></label>
}

function SelectInput({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <label className="block text-xs text-slate-400"><span className="mb-1 block font-medium text-slate-300">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 text-xs text-slate-100 outline-none focus:border-cyan-400">{options.map((option) => <option key={option.value || 'empty'} value={option.value}>{option.label}</option>)}</select></label>
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-cyan-300/10 py-1.5 text-xs">
      <span className="text-slate-500">{k}</span>
      <span className="font-medium text-slate-200">{v}</span>
    </div>
  )
}
