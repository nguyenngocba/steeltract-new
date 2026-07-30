import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileBarChart,
  Layers,
  MapPin,
  PackageOpen,
  Search,
  TrendingUp,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'

import { EnterpriseWorkspace } from '@/shared/ui/enterprise'
import { EnterprisePanel } from '@/shared/ui/enterprise-components'
import { ModuleDetailDrawer, moduleInput, moduleMutedButton, modulePrimaryButton } from '@/shared/ui/modules'
import { inventoryGridGap, inventoryTableHead, inventoryTableRow } from '@/modules/inventory/components/InventoryVisuals'
import {
  CockpitChartCard,
  CockpitEmptyState,
  CockpitKpiCard,
  CockpitRecentList,
  CockpitStatusList,
  CockpitTableShell,
  DataTablePagination,
  EnterpriseKpiCard,
} from '@/shared/ui/cockpit'
import { useProjectsActions } from '../context/ProjectsActionContext'
import { nextLocalCode } from '@/shared/utils/code-format'
import { formatCurrencyVnd, formatDateTime, formatQuantity, parseLocaleNumber } from '@/shared/utils/number-format'
import { invalidateInventoryReadState } from '../../inventory/hooks/invalidateInventoryReadState'
import {
  createProjectMaterialReturn,
  createProjectTemplate,
  createProjectWbsTask,
  bulkUpdateProjectWbs,
  deleteProjectWbsTask,
  deactivateProjectTemplate,
  duplicateProjectTemplate,
  generateProjectWbs,
  createProject,
  deliverProjectComponent,
  getProjectExecution,
  getProjectDetailTab,
  getProjectTemplates,
  getProjectsRuntime,
  installProjectComponent,
  moveProjectWbsTask,
  publishProjectTemplate,
  returnProjectComponent,
  setDefaultProjectTemplate,
  submitProjectSiteUpdate,
  updateProject,
  updateProjectTemplate,
  updateProjectWbsTask,
  type CreateProjectMaterialReturnPayload,
  type BulkProjectWbsPayload,
  type GenerateProjectWbsPayload,
  type InstallProjectComponentPayload,
  type ProjectTemplate,
  type ProjectDetailTab,
  type ProjectExecutionReadModel,
  type ProjectTemplateTaskRule,
  type ProjectComponentRuntime,
  type ProjectComponentStatus,
  type ProjectDocumentRuntime,
  type ProjectFinancialRuntime,
  type ProjectHealthRuntime,
  type ProjectLogRuntime,
  type ProjectMaterialRuntime,
  type ProjectReturnRequestRuntime,
  type ProjectRuntimeRow,
  type ProjectTaskInspectionStatus,
  type ProjectTaskStatus,
  type ProjectTemplateStructure,
  type ProjectWbsTaskPayload,
  type ProjectWbsRuntime,
  type ProjectsRuntime,
  type ProjectSiteUpdatePayload,
  type SaveProjectTemplatePayload,
  type ProjectStatus,
} from '../api/projects.api'

type ProjectTab = 'overview' | 'list' | 'templates' | 'progress' | 'components' | 'materials' | 'costs' | 'documents' | 'logs' | 'reports'
type DetailTab = 'overview' | 'command' | 'site' | 'materials' | 'components' | 'progress' | 'costs' | 'documents' | 'logs'

const input = `${moduleInput} h-9 px-3`
const primaryButton = modulePrimaryButton
const mutedButton = moduleMutedButton
const tableHead = 'bg-transparent text-slate-300 border-b border-cyan-400/10'
const tableRow = 'border-b border-cyan-400/10 text-slate-300 transition hover:bg-cyan-400/[0.055]'
const tabs: Array<{ id: ProjectTab; label: string; path: string }> = [
  { id: 'overview', label: 'Tổng quan', path: '/projects' },
  { id: 'list', label: 'Danh sách công trình', path: '/projects/list' },
  { id: 'templates', label: 'Templates', path: '/projects/templates' },
  { id: 'progress', label: 'Tiến độ', path: '/projects/progress' },
  { id: 'components', label: 'Cấu kiện', path: '/projects/components' },
  { id: 'materials', label: 'Vật tư', path: '/projects/materials' },
  { id: 'costs', label: 'Chi phí', path: '/projects/costs' },
  { id: 'documents', label: 'Tài liệu', path: '/projects/documents' },
  { id: 'logs', label: 'Nhật ký', path: '/projects/logs' },
  { id: 'reports', label: 'Báo cáo', path: '/projects/reports' },
]

const componentStatusOptions: Array<'ALL' | ProjectComponentStatus> = ['ALL', 'STOCK', 'READY', 'SHIPPED', 'DELIVERED', 'INSTALLED']

export function ProjectsPage() {
  const projectActions = useProjectsActions()
  const queryClient = useQueryClient()
  const location = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [customerFilter, setCustomerFilter] = useState('all')
  const [managerFilter, setManagerFilter] = useState('all')
  const [regionFilter, setRegionFilter] = useState('all')
  const [selectedProject, setSelectedProject] = useState<ProjectRuntimeRow | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editProject, setEditProject] = useState<ProjectRuntimeRow | null>(null)
  const [installTarget, setInstallTarget] = useState<ProjectComponentRuntime | null>(null)
  const [returnComponentTarget, setReturnComponentTarget] = useState<ProjectComponentRuntime | null>(null)
  const [returnMaterialTarget, setReturnMaterialTarget] = useState<ProjectMaterialRuntime | null>(null)
  const [pendingReturnTarget, setPendingReturnTarget] = useState<ProjectMaterialRuntime | null>(null)
  const [templateEditor, setTemplateEditor] = useState<ProjectTemplate | null | 'new'>(null)
  const { data, isLoading, isError } = useQuery({
    queryKey: ['projects-runtime'],
    queryFn: getProjectsRuntime,
    refetchInterval: 5000,
    retry: false,
  })
  const { data: templates = [], isError: templatesError } = useQuery({
    queryKey: ['project-templates'],
    queryFn: getProjectTemplates,
    retry: false,
  })
  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: async () => {
      setCreateOpen(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['projects-runtime'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory-projects'] }),
        queryClient.invalidateQueries({ queryKey: ['project-templates'] }),
      ])
    },
  })
  const updateProjectMutation = useMutation({
    mutationFn: updateProject,
    onSuccess: async () => {
      setEditProject(null)
      toast.success('Đã cập nhật công trình')
      await queryClient.invalidateQueries({ queryKey: ['projects-runtime'] })
    },
    onError: () => toast.error('Không thể cập nhật công trình'),
  })
  const templateMutationOptions = {
    onSuccess: async () => {
      setTemplateEditor(null)
      await queryClient.invalidateQueries({ queryKey: ['project-templates'] })
    },
    onError: () => toast.error('Không thể cập nhật template'),
  }
  const createTemplateMutation = useMutation({
    mutationFn: createProjectTemplate,
    ...templateMutationOptions,
  })
  const updateTemplateMutation = useMutation({
    mutationFn: updateProjectTemplate,
    ...templateMutationOptions,
  })
  const duplicateTemplateMutation = useMutation({
    mutationFn: duplicateProjectTemplate,
    onSuccess: async () => {
      toast.success('Đã nhân bản template')
      await queryClient.invalidateQueries({ queryKey: ['project-templates'] })
    },
    onError: () => toast.error('Không thể nhân bản template'),
  })
  const publishTemplateMutation = useMutation({
    mutationFn: publishProjectTemplate,
    onSuccess: async () => {
      toast.success('Đã publish template')
      await queryClient.invalidateQueries({ queryKey: ['project-templates'] })
    },
    onError: () => toast.error('Không thể publish template'),
  })
  const deactivateTemplateMutation = useMutation({
    mutationFn: deactivateProjectTemplate,
    onSuccess: async () => {
      toast.success('Đã ngưng sử dụng template')
      await queryClient.invalidateQueries({ queryKey: ['project-templates'] })
    },
    onError: () => toast.error('Không thể ngưng sử dụng template'),
  })
  const defaultTemplateMutation = useMutation({
    mutationFn: setDefaultProjectTemplate,
    onSuccess: async () => {
      toast.success('Đã đặt template mặc định')
      await queryClient.invalidateQueries({ queryKey: ['project-templates'] })
    },
    onError: () => toast.error('Không thể đặt mặc định'),
  })
  const deliverMutation = useMutation({
    mutationFn: deliverProjectComponent,
    onSuccess: async () => {
      toast.success('Đã xác nhận nhận hàng')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['projects-runtime'] }),
        queryClient.invalidateQueries({ queryKey: ['components'] }),
      ])
    },
    onError: () => toast.error('Không thể xác nhận nhận hàng'),
  })
  const installMutation = useMutation({
    mutationFn: installProjectComponent,
    onSuccess: async () => {
      setInstallTarget(null)
      toast.success('Đã xác nhận lắp đặt')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['projects-runtime'] }),
        queryClient.invalidateQueries({ queryKey: ['components'] }),
      ])
    },
    onError: () => toast.error('Không thể xác nhận lắp đặt'),
  })
  const returnMaterialMutation = useMutation({
    mutationFn: createProjectMaterialReturn,
    onSuccess: async () => {
      setReturnMaterialTarget(null)
      toast.success('Đã tạo phiếu trả vật tư công trình')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['projects-runtime'] }),
        queryClient.invalidateQueries({ queryKey: ['project-runtime'] }),
        queryClient.invalidateQueries({ queryKey: ['project-wbs'] }),
        queryClient.invalidateQueries({ queryKey: ['project-detail'] }),
        invalidateInventoryReadState(queryClient),
      ])
    },
    onError: () => toast.error('Không thể tạo phiếu trả vật tư'),
  })
  const returnComponentMutation = useMutation({
    mutationFn: returnProjectComponent,
    onSuccess: async () => {
      setReturnComponentTarget(null)
      toast.success('Đã trả cấu kiện về bãi')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['projects-runtime'] }),
        queryClient.invalidateQueries({ queryKey: ['components'] }),
        queryClient.invalidateQueries({ queryKey: ['yard-runtime'] }),
      ])
    },
    onError: () => toast.error('Không thể trả cấu kiện'),
  })
  const refreshProjects = () => queryClient.invalidateQueries({ queryKey: ['projects-runtime'] })
  const createWbsMutation = useMutation({
    mutationFn: createProjectWbsTask,
    onSuccess: async () => {
      toast.success('Đã tạo công việc')
      await refreshProjects()
    },
    onError: () => toast.error('Không thể tạo công việc'),
  })
  const updateWbsMutation = useMutation({
    mutationFn: updateProjectWbsTask,
    onSuccess: async () => {
      toast.success('Đã cập nhật công việc')
      await refreshProjects()
    },
    onError: () => toast.error('Không thể cập nhật công việc'),
  })
  const moveWbsMutation = useMutation({
    mutationFn: moveProjectWbsTask,
    onSuccess: refreshProjects,
    onError: () => toast.error('Không thể di chuyển công việc'),
  })
  const deleteWbsMutation = useMutation({
    mutationFn: deleteProjectWbsTask,
    onSuccess: async () => {
      toast.success('Đã xóa công việc')
      await refreshProjects()
    },
    onError: () => toast.error('Không thể xóa công việc'),
  })
  const generateWbsMutation = useMutation({
    mutationFn: generateProjectWbs,
    onSuccess: async (result) => {
      toast.success(`Đã sinh ${result.created} công việc`)
      await refreshProjects()
    },
    onError: () => toast.error('Không thể sinh WBS tự động'),
  })
  const bulkWbsMutation = useMutation({
    mutationFn: bulkUpdateProjectWbs,
    onSuccess: async (result) => {
      toast.success(`Đã cập nhật ${result.updated} công việc`)
      await refreshProjects()
    },
    onError: () => toast.error('Không thể cập nhật hàng loạt'),
  })
  const siteUpdateMutation = useMutation({
    mutationFn: submitProjectSiteUpdate,
    onSuccess: async () => {
      toast.success('Đã gửi cập nhật công trường')
      await refreshProjects()
    },
    onError: () => toast.error('Không thể gửi cập nhật công trường'),
  })

  const runtime = data ?? emptyRuntime()
  const currentTab = tabs.find((item) => item.path === location.pathname)?.id ?? 'overview'
  const customerList = useMemo(() => Array.from(new Set(runtime.projects.map((p) => p.owner))).filter(Boolean), [runtime.projects])
  const managerList = useMemo(() => Array.from(new Set(runtime.projects.map((p) => (p as any).manager || (p as any).pm))).filter(Boolean), [runtime.projects])

  const rows = useMemo(() => runtime.projects.filter((project) => {
    if (status !== 'all' && project.status !== status) return false
    if (type !== 'all' && project.type !== type) return false
    if (customerFilter !== 'all' && project.owner !== customerFilter) return false
    if (managerFilter !== 'all' && (project as any).manager !== managerFilter) return false
    return `${project.code} ${project.name} ${project.owner} ${project.location}`.toLowerCase().includes(query.toLowerCase())
  }), [query, runtime.projects, status, type, customerFilter, managerFilter])

  const projectTypes = Array.from(new Set(runtime.projects.map((project) => project.type))).filter(Boolean)
  const pendingComponentId = deliverMutation.isPending
    ? deliverMutation.variables ?? null
    : installMutation.isPending
      ? installMutation.variables?.id ?? null
      : null

  const filterBarNode = (
    <FilterBar
      query={query}
      status={status}
      type={type}
      projectTypes={projectTypes}
      customerFilter={customerFilter}
      managerFilter={managerFilter}
      regionFilter={regionFilter}
      customerList={customerList}
      managerList={managerList}
      onQuery={setQuery}
      onStatus={setStatus}
      onType={setType}
      onCustomer={setCustomerFilter}
      onManager={setManagerFilter}
      onRegion={setRegionFilter}
      onReset={() => {
        setQuery('')
        setStatus('all')
        setType('all')
        setCustomerFilter('all')
        setManagerFilter('all')
        setRegionFilter('all')
      }}
    />
  )

  return (
    <EnterpriseWorkspace
      eyebrow="Dự án"
      title="Quản lý công trình"
      description="Theo dõi tiến độ, cấu kiện, vật tư, chi phí và hồ sơ công trình."
      breadcrumbs={['Điều hành', 'Dự án']}
      tabs={tabs}
      activeTab={currentTab}
    >
        {isLoading ? <CockpitEmptyState title="Đang tải dữ liệu công trình" description="Dữ liệu sẽ xuất hiện khi API trả kết quả." /> : null}
        {isError ? <CockpitEmptyState title="Không tải được dữ liệu công trình" description="Kiểm tra backend Projects API và trạng thái migration trước khi thao tác tiếp." /> : null}
        {templatesError && currentTab === 'templates' ? <CockpitEmptyState title="Không tải được template" description="Template Library sẽ hiển thị sau khi API /projects/templates hoạt động." /> : null}

        {currentTab === 'overview' && <OverviewTab runtime={runtime} rows={rows} status={status} onStatus={setStatus} onOpen={setSelectedProject} filterBar={filterBarNode} />}
        {currentTab === 'list' && <ProjectListTab runtime={runtime} rows={rows} onOpen={setSelectedProject} filterBar={filterBarNode} />}
        {currentTab === 'templates' && (
          <ProjectTemplatesTab
            templates={templates}
            onCreate={() => setTemplateEditor('new')}
            onEdit={setTemplateEditor}
            onDuplicate={(template) => duplicateTemplateMutation.mutate(template.id)}
            onPublish={(template) => publishTemplateMutation.mutate(template.id)}
            onDeactivate={(template) => deactivateTemplateMutation.mutate(template.id)}
            onDefault={(template) => defaultTemplateMutation.mutate(template.id)}
          />
        )}
        {currentTab === 'progress' && <ProgressTab runtime={runtime} rows={rows} onOpen={setSelectedProject} filterBar={filterBarNode} />}
        {currentTab === 'components' && (
          <ProjectComponentsTab
            rows={filterComponents(runtime.components, rows)}
            projects={runtime.projects}
            pendingId={pendingComponentId}
            onDeliver={(component) => deliverMutation.mutate(component.id)}
            onInstall={setInstallTarget}
            onReturn={setReturnComponentTarget}
            onOpen={(component) => navigate('/components/list', { state: { componentId: component.id } })}
          />
        )}
        {currentTab === 'materials' && (
          <MaterialsTab
            rows={filterMaterials(runtime.materials, rows)}
            projects={runtime.projects}
            returnRequests={runtime.returnRequests}
            onReturn={setReturnMaterialTarget}
            onOpenPendingReturn={setPendingReturnTarget}
          />
        )}
        {currentTab === 'costs' && <ProjectCostsTab runtime={runtime} rows={rows} />}
        {currentTab === 'documents' && <ProjectDocumentsTab documents={runtime.documents} projects={runtime.projects} />}
        {currentTab === 'logs' && <ProjectLogsTab logs={runtime.logs} projects={runtime.projects} />}
        {currentTab === 'reports' && <ReportsTab runtime={runtime} rows={rows} onOpen={setSelectedProject} />}

        <ProjectDetailWorkspace
          project={selectedProject}
          materials={runtime.materials.filter((row) => row.projectId === selectedProject?.id)}
          components={runtime.components.filter((row) => row.projectId === selectedProject?.id)}
          wbsRows={runtime.wbs.filter((row) => row.projectId === selectedProject?.id)}
          financial={runtime.financial.find((row) => row.projectId === selectedProject?.id)}
          health={runtime.health.find((row) => row.projectId === selectedProject?.id)}
          returnRequests={runtime.returnRequests.filter((row) => row.projectId === selectedProject?.id)}
          documents={runtime.documents.filter((row) => row.projectId === selectedProject?.id || row.entityId === selectedProject?.id)}
          logs={runtime.logs.filter((row) => row.projectId === selectedProject?.id || row.entityId === selectedProject?.id)}
          templates={templates}
          savingWbs={createWbsMutation.isPending || updateWbsMutation.isPending || moveWbsMutation.isPending || deleteWbsMutation.isPending}
          savingSite={siteUpdateMutation.isPending}
          onClose={() => setSelectedProject(null)}
          onEditProject={(project) => projectActions.openEditProject(project)}
          onReturnMaterial={setReturnMaterialTarget}
          onOpenPendingReturn={setPendingReturnTarget}
          onReturnComponent={setReturnComponentTarget}
          onCreateWbs={(payload) => selectedProject ? createWbsMutation.mutate({ projectId: selectedProject.id, payload }) : undefined}
          onUpdateWbs={(taskId, payload) => selectedProject ? updateWbsMutation.mutate({ projectId: selectedProject.id, taskId, payload }) : undefined}
          onMoveWbs={(taskId, parentId, sortOrder) => selectedProject ? moveWbsMutation.mutate({ projectId: selectedProject.id, taskId, parentId, sortOrder }) : undefined}
          onDeleteWbs={(taskId) => selectedProject ? deleteWbsMutation.mutate({ projectId: selectedProject.id, taskId }) : undefined}
          onGenerateWbs={(payload) => selectedProject ? generateWbsMutation.mutate({ projectId: selectedProject.id, payload }) : undefined}
          onBulkWbs={(payload) => selectedProject ? bulkWbsMutation.mutate({ projectId: selectedProject.id, payload }) : undefined}
          onSiteUpdate={(payload) => selectedProject ? siteUpdateMutation.mutate({ projectId: selectedProject.id, payload }) : undefined}
        />
        <TemplateEditorDialog
          template={templateEditor}
          saving={createTemplateMutation.isPending || updateTemplateMutation.isPending}
          onClose={() => setTemplateEditor(null)}
          onSubmit={(payload) => {
            if (templateEditor && templateEditor !== 'new') updateTemplateMutation.mutate({ id: templateEditor.id, payload })
            else createTemplateMutation.mutate(payload)
          }}
        />
        <InstallComponentDialog key={installTarget?.id ?? 'install-empty'} component={installTarget} saving={installMutation.isPending} onClose={() => setInstallTarget(null)} onSubmit={(payload) => installTarget ? installMutation.mutate({ id: installTarget.id, payload }) : undefined} />
        <ReturnMaterialDialog
          material={returnMaterialTarget}
          saving={returnMaterialMutation.isPending}
          onClose={() => setReturnMaterialTarget(null)}
          onSubmit={(payload) => returnMaterialMutation.mutate(payload)}
        />
        <PendingReturnDetailDrawer
          material={pendingReturnTarget}
          requests={runtime.returnRequests}
          onClose={() => setPendingReturnTarget(null)}
        />
        <ReturnComponentDialog
          component={returnComponentTarget}
          saving={returnComponentMutation.isPending}
          onClose={() => setReturnComponentTarget(null)}
          onSubmit={(reason) => returnComponentTarget?.projectId ? returnComponentMutation.mutate({ projectId: returnComponentTarget.projectId, componentId: returnComponentTarget.id, reason }) : undefined}
        />
    </EnterpriseWorkspace>
  )
}

function FilterBar({
  query,
  status,
  type,
  projectTypes,
  customerFilter,
  managerFilter,
  regionFilter,
  customerList,
  managerList,
  onQuery,
  onStatus,
  onType,
  onCustomer,
  onManager,
  onRegion,
  onReset,
}: {
  query: string
  status: string
  type: string
  projectTypes: string[]
  customerFilter: string
  managerFilter: string
  regionFilter: string
  customerList: string[]
  managerList: string[]
  onQuery: (value: string) => void
  onStatus: (value: string) => void
  onType: (value: string) => void
  onCustomer: (value: string) => void
  onManager: (value: string) => void
  onRegion: (value: string) => void
  onReset: () => void
}) {
  return (
    <EnterprisePanel className="rounded-xl -mt-1">
      <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_160px_160px_160px_160px_110px_110px]">
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Tìm mã dự án, tên công trình, địa điểm..."
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
          />
        </div>

        <select
          value={status}
          onChange={(e) => onStatus(e.target.value)}
          className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang thi công (ACTIVE)</option>
          <option value="PLANNING">Chưa khởi công (PLANNING)</option>
          <option value="COMPLETED">Hoàn thành (COMPLETED)</option>
          <option value="ON_HOLD">Tạm dừng (ON_HOLD)</option>
        </select>

        <select
          value={customerFilter}
          onChange={(e) => onCustomer(e.target.value)}
          className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
        >
          <option value="all">Tất cả chủ đầu tư</option>
          {customerList.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={managerFilter}
          onChange={(e) => onManager(e.target.value)}
          className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
        >
          <option value="all">Tất cả PM</option>
          {managerList.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select
          value={type}
          onChange={(e) => onType(e.target.value)}
          className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
        >
          <option value="all">Tất cả loại dự án</option>
          {projectTypes.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => {}}
          className="h-9 self-end rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
        >
          Tìm kiếm
        </button>
        <button
          type="button"
          onClick={onReset}
          className="h-9 self-end rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
        >
          Làm mới
        </button>
      </div>
    </EnterprisePanel>
  )
}

function OverviewTab({
  runtime,
  rows,
  status,
  onStatus,
  onOpen,
  filterBar,
}: {
  runtime: ProjectsRuntime
  rows: ProjectRuntimeRow[]
  status: string
  onStatus: (value: string) => void
  onOpen: (row: ProjectRuntimeRow) => void
  filterBar?: ReactNode
}) {
  const completedSoon = [...rows].filter((row) => row.status !== 'COMPLETED' && row.progress >= 80).sort((a, b) => b.progress - a.progress)
  const delayed = rows.filter((row) => isDelayed(row))
  const recent = [...rows]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  return (
    <div className="w-full min-w-0 flex-1 space-y-1">
      {/* Phase 1: Enterprise KPI Cards */}
      <KpiStrip runtime={runtime} delayed={delayed.length} status={status} onStatus={onStatus} />

      {/* Phase 2: Analytics Dashboard */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-4">
        <CockpitChartCard title="Tiến độ theo thời gian" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <ProjectLineChart series={buildProgressSeries(rows)} />
        </CockpitChartCard>
        <CockpitChartCard title="Giá trị theo thời gian" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <ProjectLineChart series={buildValueSeries(rows, runtime.financial)} currency />
        </CockpitChartCard>
        <CockpitChartCard title="Trạng thái công việc" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars rows={taskStatusRows(runtime.wbs, rows)} />
        </CockpitChartCard>
        <CockpitChartCard title="Cảnh báo & Rủi ro" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitStatusList items={riskRows(runtime.health)} emptyMessage="Không có rủi ro nổi bật." />
        </CockpitChartCard>
      </div>

      {/* Phase 3: Compact Toolbar */}
      {filterBar}

      {/* Phase 4: Hero Table */}
      <div className="grid grid-cols-1 gap-1 xl:grid-cols-[2fr_1fr]">
        <ProjectTable rows={rows} onOpen={onOpen} />
        <div className="space-y-1">
          <StatusWidget runtime={runtime} />
          <ProgressWidget rows={rows} />
          <ValueWidget rows={rows} />
        </div>
      </div>

      {/* Secondary Overview Widgets */}
      <div className="grid grid-cols-1 gap-1 xl:grid-cols-3">
        <CockpitChartCard title="Công trình sắp hoàn thành" heightClass="h-[170px]" chartHeightClass="h-[98px]">
          <CockpitStatusList items={completedSoon.slice(0, 4).map((row) => ({ id: row.id, label: row.name, value: `${fmt(row.progress)}%`, statusTone: 'emerald' }))} emptyMessage="Chưa có công trình nào trên 80%." />
        </CockpitChartCard>
        <CockpitChartCard title="Công trình chậm tiến độ" heightClass="h-[170px]" chartHeightClass="h-[98px]">
          <CockpitStatusList items={delayed.slice(0, 4).map((row) => ({ id: row.id, label: row.name, value: `${row.delayedOrders || 'Quá hạn'}`, statusTone: 'red' }))} emptyMessage="Không có công trình quá hạn." />
        </CockpitChartCard>
        <CockpitChartCard title="Hoạt động gần đây" heightClass="h-[170px]" chartHeightClass="h-[98px]">
          <CockpitRecentList items={recent.map((row) => ({ id: row.id, title: row.code, subtitle: row.name, time: shortDate(row.updatedAt), statusDot: row.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-cyan-400' }))} />
        </CockpitChartCard>
      </div>
    </div>
  )
}

function KpiStrip({ runtime, delayed, status, onStatus }: { runtime: ProjectsRuntime; delayed: number; status?: string; onStatus?: (value: string) => void }) {
  const m = runtime.metrics
  const totalProjects = m.totalProjects || runtime.projects.length
  const activeProjects = m.activeProjects || runtime.projects.filter(p => p.status === 'ACTIVE').length
  const completedProjects = m.completedProjects || runtime.projects.filter(p => p.status === 'COMPLETED').length
  const contractVal = m.contractValue || m.actualValue
  const avgCompletion = m.contractValue ? Math.round((m.actualValue / m.contractValue) * 100) : 0

  return (
    <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
      <EnterpriseKpiCard
        title="Tổng số công trình"
        value={formatQuantity(totalProjects, 0)}
        tone="blue"
        icon={<Building2 size={15} />}
      />
      <EnterpriseKpiCard
        title="Đang triển khai"
        value={formatQuantity(activeProjects, 0)}
        tone="emerald"
        icon={<Clock size={15} />}
      />
      <EnterpriseKpiCard
        title="Hoàn thành"
        value={formatQuantity(completedProjects, 0)}
        tone="purple"
        icon={<CheckCircle2 size={15} />}
      />
      <EnterpriseKpiCard
        title="Chậm tiến độ / Rủi ro"
        value={formatQuantity(delayed, 0)}
        tone={delayed ? 'red' : 'emerald'}
        icon={<CalendarClock size={15} />}
      />
      <EnterpriseKpiCard
        title="Giá trị hợp đồng"
        value={formatCurrencyVnd(contractVal)}
        tone="cyan"
        icon={<TrendingUp size={15} />}
      />
      <EnterpriseKpiCard
        title="Tỷ lệ hoàn thành TB"
        value={`${avgCompletion}%`}
        tone="blue"
        icon={<BarChart3 size={15} />}
      />
    </div>
  )
}

function ProjectListTab({
  runtime,
  rows,
  onOpen,
  filterBar,
}: {
  runtime: ProjectsRuntime
  rows: ProjectRuntimeRow[]
  onOpen: (row: ProjectRuntimeRow) => void
  filterBar?: ReactNode
}) {
  const delayed = rows.filter((row) => isDelayed(row))
  return (
    <div className="w-full min-w-0 flex-1 space-y-1">
      {/* Phase 1: Enterprise KPI Cards */}
      <KpiStrip runtime={runtime} delayed={delayed.length} />

      {/* Phase 3: Compact Toolbar */}
      {filterBar}

      {/* Phase 4: Hero Table */}
      <div className="grid grid-cols-1 gap-1 xl:grid-cols-[2fr_1fr]">
        <ProjectTable rows={rows} onOpen={onOpen} />
        <div className="space-y-1">
          <StatusWidget runtime={runtime} />
          <CockpitChartCard title="Công trình sắp hoàn thành" heightClass="h-[170px]" chartHeightClass="h-[98px]">
            <CockpitStatusList items={rows.filter((row) => row.status !== 'COMPLETED' && row.progress >= 80).slice(0, 4).map((row) => ({ id: row.id, label: row.name, value: `${fmt(row.progress)}%`, statusTone: 'emerald' }))} emptyMessage="Chưa có công trình nào trên 80%." />
          </CockpitChartCard>
          <CockpitChartCard title="Công trình cần chú ý" heightClass="h-[170px]" chartHeightClass="h-[98px]">
            <CockpitStatusList items={delayed.slice(0, 4).map((row) => ({ id: row.id, label: row.name, value: row.delayedOrders || 'Quá hạn', statusTone: 'red' }))} emptyMessage="Không có công trình quá hạn." />
          </CockpitChartCard>
        </div>
      </div>

      {/* Phase 2: Analytics & Summary Widgets */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-4">
        <ProgressWidget rows={rows} />
        <ValueWidget rows={rows} />
        <CockpitChartCard title="Tiến độ theo thời gian" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <ProjectLineChart series={buildProgressSeries(rows)} />
        </CockpitChartCard>
        <CockpitChartCard title="Giá trị theo thời gian" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <ProjectLineChart series={buildValueSeries(rows, runtime.financial)} currency />
        </CockpitChartCard>
      </div>
    </div>
  )
}

function ProjectTemplatesTab({
  templates,
  onCreate,
  onEdit,
  onDuplicate,
  onPublish,
  onDeactivate,
  onDefault,
}: {
  templates: ProjectTemplate[]
  onCreate: () => void
  onEdit: (template: ProjectTemplate) => void
  onDuplicate: (template: ProjectTemplate) => void
  onPublish: (template: ProjectTemplate) => void
  onDeactivate: (template: ProjectTemplate) => void
  onDefault: (template: ProjectTemplate) => void
}) {
  const published = templates.filter((template) => template.status === 'PUBLISHED')
  const defaultTemplate = templates.find((template) => template.isDefault)
  return (
    <div className="w-full min-w-0 flex-1 space-y-1">
      <div className="grid grid-cols-1 gap-1 md:grid-cols-4">
        <CockpitKpiCard title="Template" value={fmt(templates.length, 0)} note="Thư viện" tone="cyan" />
        <CockpitKpiCard title="Đang dùng" value={fmt(published.length, 0)} note="Published" tone="emerald" />
        <CockpitKpiCard title="Mặc định" value={defaultTemplate?.code ?? '-'} note={defaultTemplate?.name ?? 'Chưa đặt'} tone="blue" />
        <CockpitKpiCard title="WBS mẫu" value={fmt(templates.reduce((sum, template) => sum + (template.structure?.tasks?.length ?? 0), 0), 0)} note="Tổng task mẫu" tone="purple" />
      </div>
      <div className="grid grid-cols-1 gap-1 xl:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Project Template Library</h2>
            <div className="flex gap-1">
              <button type="button" onClick={onCreate} className={primaryButton}>+ Tạo template</button>
            </div>
          </div>
          <CockpitTableShell className="h-[520px]">
            <table className="w-full min-w-[1120px] table-fixed text-sm">
              <thead className={tableHead}>
                <tr>{['Mã', 'Tên template', 'Trạng thái', 'Default', 'WBS', 'Dependencies', 'Duration', 'Thao tác'].map((heading) => <th key={heading} className="px-1.5 py-1 text-left font-medium">{heading}</th>)}</tr>
              </thead>
              <tbody>
                {templates.map((template) => {
                  const dependencies = template.structure.tasks.reduce((sum, task) => sum + (task.dependsOn?.length ?? 0), 0)
                  const duration = template.structure.tasks.reduce((sum, task) => sum + Number(task.durationDays ?? 0), 0)
                  return (
                    <tr key={template.id} className={tableRow}>
                      <td className="truncate px-1.5 py-2 font-mono text-cyan-300">{template.code}</td>
                      <td className="truncate px-1.5 py-2 text-white">{template.name}</td>
                      <td className="px-1.5 py-2"><span className="rounded-lg border border-white/10 px-2 py-0.5 text-xs">{template.status}</span></td>
                      <td className="px-1.5 py-2">{template.isDefault ? <span className="text-emerald-300">Mặc định</span> : '-'}</td>
                      <td className="px-1.5 py-2 text-right font-mono">{fmt(template.structure.tasks.length, 0)}</td>
                      <td className="px-1.5 py-2 text-right font-mono">{fmt(dependencies, 0)}</td>
                      <td className="px-1.5 py-2 text-right font-mono">{fmt(duration, 0)} ngày</td>
                      <td className="px-1.5 py-2">
                        <div className="flex flex-wrap gap-1">
                          <button type="button" onClick={() => onEdit(template)} className="rounded-lg border border-cyan-500/30 px-2 py-1 text-[11px] text-cyan-200">Sửa</button>
                          <button type="button" onClick={() => onDuplicate(template)} className="rounded-lg border border-purple-500/30 px-2 py-1 text-[11px] text-purple-200">Nhân bản</button>
                          <button type="button" onClick={() => onPublish(template)} className="rounded-lg border border-emerald-500/30 px-2 py-1 text-[11px] text-emerald-200">Publish</button>
                          <button type="button" onClick={() => onDefault(template)} className="rounded-lg border border-blue-500/30 px-2 py-1 text-[11px] text-blue-200">Default</button>
                          <button type="button" onClick={() => onDeactivate(template)} className="rounded-lg border border-red-500/30 px-2 py-1 text-[11px] text-red-200">Ngưng</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!templates.length ? <CockpitEmptyState title="Chưa có template" description="Tạo template để người dùng sinh WBS, timeline và resource plan nhanh hơn." /> : null}
          </CockpitTableShell>
        </section>
        <div className="space-y-1">
          <CockpitChartCard title="Template mặc định" heightClass="h-[170px]" chartHeightClass="h-[98px]">
            {defaultTemplate ? <CockpitStatusList items={defaultTemplate.structure.tasks.slice(0, 5).map((task) => ({ id: task.key, label: task.name, value: `${fmt(task.durationDays ?? 0, 0)} ngày`, statusTone: 'cyan' }))} /> : <CockpitEmptyState title="Chưa đặt mặc định" description="Admin có thể đặt template mặc định cho form tạo công trình." />}
          </CockpitChartCard>
          <CockpitChartCard title="Suggested Resources" heightClass="h-[170px]" chartHeightClass="h-[98px]">
            <CockpitStatusList items={(defaultTemplate?.structure.tasks ?? []).flatMap((task) => task.resources ?? []).slice(0, 5).map((resource, index) => ({ id: `${resource.name}-${index}`, label: resource.name, value: fmt(resource.quantity ?? 0, 0), statusTone: resource.type === 'MACHINE' ? 'amber' : 'emerald' }))} emptyMessage="Template chưa có resource gợi ý." />
          </CockpitChartCard>
          <CockpitChartCard title="Smart Template Output" heightClass="h-[170px]" chartHeightClass="h-[98px]">
            <CockpitRecentList items={[
              { id: 'wbs', title: 'Sinh WBS', subtitle: 'Root / Child / Grandchild', time: '', statusDot: 'bg-cyan-400' },
              { id: 'timeline', title: 'Sinh Timeline', subtitle: 'Duration + ngày khởi công', time: '', statusDot: 'bg-blue-400' },
              { id: 'dep', title: 'Sinh Dependencies', subtitle: 'FS/SS/FF từ template', time: '', statusDot: 'bg-purple-400' },
              { id: 'resource', title: 'Sinh Resource Plan', subtitle: 'Nhân lực / thiết bị', time: '', statusDot: 'bg-emerald-400' },
            ]} />
          </CockpitChartCard>
        </div>
      </div>
    </div>
  )
}

function ProjectTable({ rows, onOpen }: { rows: ProjectRuntimeRow[]; onOpen: (row: ProjectRuntimeRow) => void }) {
  const [page, setPage] = useState(1)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
  const pageSize = 16
  useEffect(() => setPage(1), [rows])
  const paged = rows.slice((page - 1) * pageSize, page * pageSize)

  return (
    <EnterprisePanel className="rounded-xl">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Danh sách công trình & dự án</h3>
          <span className="rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-300 border border-blue-400/20">
            {rows.length} công trình
          </span>
        </div>
        <button
          type="button"
          onClick={() => setExpandedModalOpen(true)}
          className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition"
        >
          Xem tất cả
        </button>
      </div>

      <div className="h-[520px] overflow-auto scrollbar-none rounded-lg border border-white/10">
        <table className="w-full min-w-[1150px] table-fixed text-sm border-collapse">
          <thead
            className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
            style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
          >
            <tr>
              {['Mã dự án', 'Tên công trình', 'Chủ đầu tư / Khách hàng', 'Địa điểm', 'Loại', 'Giá trị (VNĐ)', 'Tiến độ', 'Cấu kiện', 'Trạng thái', 'Kết thúc'].map(
                (heading) => (
                  <th key={heading} className="px-2 py-2 text-xs font-semibold text-slate-300 text-left">
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {paged.map((row) => (
              <tr key={row.id} onClick={() => onOpen(row)} className={`${inventoryTableRow} cursor-pointer`}>
                <td className="px-2 py-2 font-mono font-semibold text-cyan-300 text-xs">{row.code}</td>
                <td className="px-2 py-2 text-white font-medium truncate">{row.name}</td>
                <td className="px-2 py-2 text-slate-300 truncate">{row.owner || '—'}</td>
                <td className="px-2 py-2 text-slate-300 truncate">{row.location || '—'}</td>
                <td className="px-2 py-2 text-slate-300 text-xs">{row.type}</td>
                <td className="px-2 py-2 font-mono text-cyan-300 text-xs tabular-nums">{compactMoney(row.contractValue)}</td>
                <td className="px-2 py-2"><Progress value={row.progress} /></td>
                <td className="px-2 py-2 font-mono text-slate-200 text-xs text-right tabular-nums">{formatQuantity(row.componentCount, 0)}</td>
                <td className="px-2 py-2"><StatusBadge status={row.status} /></td>
                <td className="px-2 py-2 text-slate-400 text-xs truncate">{date(row.plannedEndAt)}</td>
              </tr>
            ))}
            {!paged.length ? (
              <tr>
                <td colSpan={10} className="px-2 py-10">
                  <CockpitEmptyState
                    title="Chưa có dữ liệu công trình"
                    description="Không tìm thấy công trình nào thỏa mãn điều kiện lọc hiện tại."
                    icon={<Building2 size={18} />}
                  />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <DataTablePagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} />

      {/* Phase 5: EXPANDED TABLE MODAL */}
      {expandedModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">Toàn bộ danh sách công trình & dự án</h2>
                    <p className="text-xs text-slate-400">Tổng cộng {rows.length} công trình trong hệ thống</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedModalOpen(false)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                  >
                    Đóng
                  </button>
                </div>

                <div className="h-[640px] overflow-y-auto rounded-xl border border-white/10">
                  <table className="w-full min-w-[1150px] text-xs table-fixed border-collapse">
                    <thead
                      className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                      style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                    >
                      <tr>
                        {['Mã dự án', 'Tên công trình', 'Chủ đầu tư / Khách hàng', 'Địa điểm', 'Loại', 'Giá trị (VNĐ)', 'Tiến độ', 'Cấu kiện', 'Trạng thái', 'Kết thúc'].map(
                          (heading) => (
                            <th key={heading} className="px-2 py-2 text-left font-semibold text-slate-300">
                              {heading}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr
                          key={row.id}
                          onClick={() => {
                            onOpen(row)
                            setExpandedModalOpen(false)
                          }}
                          className={`${inventoryTableRow} cursor-pointer`}
                        >
                          <td className="px-2 py-2 font-mono font-semibold text-cyan-300">{row.code}</td>
                          <td className="px-2 py-2 text-white font-medium truncate">{row.name}</td>
                          <td className="px-2 py-2 text-slate-300 truncate">{row.owner || '—'}</td>
                          <td className="px-2 py-2 text-slate-300 truncate">{row.location || '—'}</td>
                          <td className="px-2 py-2 text-slate-300">{row.type}</td>
                          <td className="px-2 py-2 font-mono text-cyan-300 tabular-nums">{compactMoney(row.contractValue)}</td>
                          <td className="px-2 py-2"><Progress value={row.progress} /></td>
                          <td className="px-2 py-2 font-mono text-slate-200 text-right tabular-nums">{formatQuantity(row.componentCount, 0)}</td>
                          <td className="px-2 py-2"><StatusBadge status={row.status} /></td>
                          <td className="px-2 py-2 text-slate-400 truncate">{date(row.plannedEndAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <DataTablePagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} />
              </div>
            </div>,
            document.body,
          )
        : null}
    </EnterprisePanel>
  )
}

function ProgressTab({
  runtime,
  rows,
  onOpen,
  filterBar,
}: {
  runtime: ProjectsRuntime
  rows: ProjectRuntimeRow[]
  onOpen: (row: ProjectRuntimeRow) => void
  filterBar?: ReactNode
}) {
  const delayed = rows.filter((row) => isDelayed(row))
  return (
    <div className="w-full min-w-0 flex-1 space-y-1">
      {/* Phase 1: Enterprise KPI Cards */}
      <KpiStrip runtime={runtime} delayed={delayed.length} />

      {/* Phase 3: Compact Toolbar */}
      {filterBar}

      {/* Phase 4: Hero Table */}
      <div className="grid grid-cols-1 gap-1 xl:grid-cols-[2fr_1fr]">
        <ProjectTable rows={rows} onOpen={onOpen} />
        <div className="space-y-1">
          <ProgressWidget rows={rows} />
          <CockpitChartCard title="Công trình chậm tiến độ" heightClass="h-[170px]" chartHeightClass="h-[98px]">
            <CockpitStatusList items={delayed.slice(0, 4).map((row) => ({ id: row.id, label: row.name, value: row.delayedOrders || 'Quá hạn', statusTone: 'red' }))} emptyMessage="Không có công trình chậm." />
          </CockpitChartCard>
          <CockpitChartCard title="Theo trạng thái" heightClass="h-[170px]" chartHeightClass="h-[98px]">
            <StatusMiniBars rows={runtime.reports.byStatus.map((row) => [statusLabel(row.status), row.count])} />
          </CockpitChartCard>
        </div>
      </div>

      {/* Phase 2: Progress Analytics */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
        <CockpitChartCard title="Tiến độ theo thời gian" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <ProjectLineChart series={buildProgressSeries(rows)} />
        </CockpitChartCard>
        <CockpitChartCard title="Cảnh báo & Rủi ro" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitStatusList items={riskRows(runtime.health)} emptyMessage="Không có rủi ro nổi bật." />
        </CockpitChartCard>
      </div>
    </div>
  )
}

function MaterialsTab({
  rows,
  projects,
  returnRequests,
  onReturn,
  onOpenPendingReturn,
}: {
  rows: ProjectMaterialRuntime[]
  projects: ProjectRuntimeRow[]
  returnRequests: ProjectsRuntime['returnRequests']
  onReturn: (row: ProjectMaterialRuntime) => void
  onOpenPendingReturn: (row: ProjectMaterialRuntime) => void
}) {
  const [projectId, setProjectId] = useState('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
  const pageSize = 15

  const filtered = rows.filter((row) => {
    if (projectId !== 'all' && row.projectId !== projectId) return false
    if (query.trim()) {
      const q = query.toLowerCase()
      return (
        row.materialCode?.toLowerCase().includes(q) ||
        row.materialName?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const returnableRows = filtered.filter((row) => Number(row.availableReturnQuantity ?? 0) > 0)
  useEffect(() => setPage(1), [projectId, query, rows])

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const allocated = filtered.reduce((sum, row) => sum + Number(row.allocatedQuantity ?? 0), 0)
  const pendingReturn = filtered.reduce((sum, row) => sum + Number(row.pendingReturnQuantity ?? 0), 0)
  const returned = filtered.reduce((sum, row) => sum + Number(row.returnedQuantity ?? 0), 0)
  const availableReturn = filtered.reduce((sum, row) => sum + Number(row.availableReturnQuantity ?? 0), 0)
  const totalValue = filtered.reduce((sum, row) => sum + Math.abs(row.totalAmount), 0)

  return (
    <div className="w-full min-w-0 flex-1 space-y-1">
      {/* Phase 1: Enterprise KPI Cards */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard
          title="Tổng dòng vật tư"
          value={formatQuantity(filtered.length, 0)}
          tone="blue"
          icon={<PackageOpen size={15} />}
        />
        <EnterpriseKpiCard
          title="Đã cấp phát (Allocated)"
          value={formatQuantity(Math.abs(allocated), 0)}
          tone="amber"
          icon={<Layers size={15} />}
        />
        <EnterpriseKpiCard
          title="Chờ nhận trả (Pending)"
          value={formatQuantity(Math.abs(pendingReturn), 0)}
          tone="purple"
          icon={<Clock size={15} />}
        />
        <EnterpriseKpiCard
          title="Đã nhận trả (Returned)"
          value={formatQuantity(Math.abs(returned), 0)}
          tone="emerald"
          icon={<CheckCircle2 size={15} />}
        />
        <EnterpriseKpiCard
          title="Khả dụng trả (Available)"
          value={formatQuantity(Math.abs(availableReturn), 0)}
          tone="cyan"
          icon={<Building2 size={15} />}
        />
        <EnterpriseKpiCard
          title="Tổng giá trị"
          value={formatCurrencyVnd(totalValue)}
          tone="blue"
          icon={<TrendingUp size={15} />}
        />
      </div>

      {/* Phase 3: Compact Toolbar */}
      <EnterprisePanel className="rounded-xl -mt-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_220px_110px_110px]">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm mã vật tư, tên vật tư..."
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
            />
          </div>

          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="all">Tất cả công trình</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} · {project.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {}}
            className="h-9 self-end rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
          >
            Tìm kiếm
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setProjectId('all')
            }}
            className="h-9 self-end rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Làm mới
          </button>
        </div>
      </EnterprisePanel>

      {/* Phase 4: Hero Table */}
      <div className="grid grid-cols-1 gap-1 xl:grid-cols-[2fr_1fr]">
        <EnterprisePanel className="rounded-xl">
          <div className="mb-1 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Vật tư công trình</h3>
              <span className="rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-300 border border-blue-400/20">
                {filtered.length} dòng
              </span>
            </div>
            <button
              type="button"
              onClick={() => setExpandedModalOpen(true)}
              className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition"
            >
              Xem tất cả
            </button>
          </div>

          <div className="h-[520px] overflow-auto scrollbar-none rounded-lg border border-white/10">
            <table className="w-full min-w-[1150px] table-fixed text-sm border-collapse">
              <thead
                className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
              >
                <tr>
                  {['Mã vật tư', 'Tên vật tư', 'Đơn vị', 'Allocated', 'Used', 'Pending Return', 'Returned', 'Available Return', 'Giá trị (VNĐ)', 'Ngày', 'Thao tác'].map(
                    (heading) => (
                      <th key={heading} className="px-2 py-2 text-xs font-semibold text-slate-300 text-left">
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {paged.map((row) => (
                  <tr key={row.id} className={`${inventoryTableRow}`}>
                    <td className="px-2 py-2 font-mono font-semibold text-cyan-300 text-xs">{row.materialCode}</td>
                    <td className="px-2 py-2 text-white font-medium truncate">{row.materialName}</td>
                    <td className="px-2 py-2 text-slate-300 text-xs">{row.unit ?? '-'}</td>
                    <td className="px-2 py-2 font-mono text-slate-200 text-xs text-right tabular-nums">{fmt(row.allocatedQuantity ?? 0)}</td>
                    <td className="px-2 py-2 font-mono text-slate-200 text-xs text-right tabular-nums">{fmt(row.usedQuantity ?? 0)}</td>
                    <td className="px-2 py-2 font-mono text-amber-300 text-xs text-right tabular-nums">
                      {Number(row.pendingReturnQuantity ?? 0) > 0 && row.projectId ? (
                        <button
                          type="button"
                          onClick={() => onOpenPendingReturn(row)}
                          className="underline decoration-amber-300/40 underline-offset-4 hover:text-amber-100"
                          title={`${pendingReturnRequestsFor(row, returnRequests).length} phiếu trả đang liên quan`}
                        >
                          {fmt(row.pendingReturnQuantity ?? 0)}
                        </button>
                      ) : (
                        fmt(row.pendingReturnQuantity ?? 0)
                      )}
                    </td>
                    <td className="px-2 py-2 font-mono text-emerald-300 text-xs text-right tabular-nums">{fmt(row.returnedQuantity ?? 0)}</td>
                    <td className="px-2 py-2 font-mono text-cyan-300 text-xs text-right tabular-nums">{fmt(row.availableReturnQuantity ?? 0)}</td>
                    <td className="px-2 py-2 font-mono text-cyan-300 text-xs text-right tabular-nums">{formatCurrencyVnd(Math.abs(row.totalAmount))}</td>
                    <td className="px-2 py-2 text-slate-400 text-xs truncate">{date(row.date)}</td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        disabled={Number(row.availableReturnQuantity ?? 0) <= 0}
                        onClick={() => onReturn(row)}
                        className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40 transition"
                      >
                        Trả
                      </button>
                    </td>
                  </tr>
                ))}
                {!paged.length ? (
                  <tr>
                    <td colSpan={11} className="px-2 py-10">
                      <CockpitEmptyState
                        title="Chưa có vật tư công trình"
                        description="Các giao dịch Inventory có projectId sẽ hiển thị tại đây."
                        icon={<PackageOpen size={18} />}
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <DataTablePagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />

          {/* Phase 5: EXPANDED TABLE MODAL */}
          {expandedModalOpen
            ? createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                  <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <h2 className="text-base font-bold text-white">Toàn bộ vật tư công trình</h2>
                        <p className="text-xs text-slate-400">Tổng cộng {filtered.length} dòng vật tư</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpandedModalOpen(false)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                      >
                        Đóng
                      </button>
                    </div>

                    <div className="h-[640px] overflow-y-auto rounded-xl border border-white/10">
                      <table className="w-full min-w-[1150px] text-xs table-fixed border-collapse">
                        <thead
                          className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                          style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                        >
                          <tr>
                            {['Mã vật tư', 'Tên vật tư', 'Đơn vị', 'Allocated', 'Used', 'Pending Return', 'Returned', 'Available Return', 'Giá trị (VNĐ)', 'Ngày', 'Thao tác'].map(
                              (heading) => (
                                <th key={heading} className="px-2 py-2 text-left font-semibold text-slate-300">
                                  {heading}
                                </th>
                              ),
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((row) => (
                            <tr key={row.id} className={`${inventoryTableRow}`}>
                              <td className="px-2 py-2 font-mono font-semibold text-cyan-300 text-xs">{row.materialCode}</td>
                              <td className="px-2 py-2 text-white font-medium truncate">{row.materialName}</td>
                              <td className="px-2 py-2 text-slate-300 text-xs">{row.unit ?? '-'}</td>
                              <td className="px-2 py-2 font-mono text-slate-200 text-xs text-right tabular-nums">{fmt(row.allocatedQuantity ?? 0)}</td>
                              <td className="px-2 py-2 font-mono text-slate-200 text-xs text-right tabular-nums">{fmt(row.usedQuantity ?? 0)}</td>
                              <td className="px-2 py-2 font-mono text-amber-300 text-xs text-right tabular-nums">{fmt(row.pendingReturnQuantity ?? 0)}</td>
                              <td className="px-2 py-2 font-mono text-emerald-300 text-xs text-right tabular-nums">{fmt(row.returnedQuantity ?? 0)}</td>
                              <td className="px-2 py-2 font-mono text-cyan-300 text-xs text-right tabular-nums">{fmt(row.availableReturnQuantity ?? 0)}</td>
                              <td className="px-2 py-2 font-mono text-cyan-300 text-xs text-right tabular-nums">{formatCurrencyVnd(Math.abs(row.totalAmount))}</td>
                              <td className="px-2 py-2 text-slate-400 text-xs truncate">{date(row.date)}</td>
                              <td className="px-2 py-2">
                                <button
                                  type="button"
                                  disabled={Number(row.availableReturnQuantity ?? 0) <= 0}
                                  onClick={() => {
                                    onReturn(row)
                                    setExpandedModalOpen(false)
                                  }}
                                  className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40 transition"
                                >
                                  Trả
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>,
                document.body,
              )
            : null}
        </EnterprisePanel>
        <div className="space-y-1">
          <CockpitChartCard title="Top vật tư sử dụng" heightClass="h-[170px]" chartHeightClass="h-[98px]"><StatusMiniBars rows={topMaterials(filtered).map((row) => [row.label, row.value])} /></CockpitChartCard>
          <CockpitChartCard title="Giá trị theo nhóm" heightClass="h-[170px]" chartHeightClass="h-[98px]"><StatusMiniBars rows={topMaterialValue(filtered).map((row) => [row.label, row.value])} /></CockpitChartCard>
        </div>
      </div>
    </div>
  )
}

function ProjectComponentsTab({
  rows,
  projects,
  pendingId,
  onDeliver,
  onInstall,
  onReturn,
  onOpen,
}: {
  rows: ProjectComponentRuntime[]
  projects: ProjectRuntimeRow[]
  pendingId: string | null
  onDeliver: (row: ProjectComponentRuntime) => void
  onInstall: (row: ProjectComponentRuntime) => void
  onReturn: (row: ProjectComponentRuntime) => void
  onOpen: (row: ProjectComponentRuntime) => void
}) {
  const [projectId, setProjectId] = useState('all')
  const [status, setStatus] = useState<'ALL' | ProjectComponentStatus>('ALL')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
  const pageSize = 15

  const filtered = rows.filter((row) => {
    if (projectId !== 'all' && row.projectId !== projectId) return false
    if (status !== 'ALL' && row.status !== status) return false
    if (query.trim()) {
      const q = query.toLowerCase()
      return (
        row.code?.toLowerCase().includes(q) ||
        row.name?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  useEffect(() => setPage(1), [projectId, query, rows, status])
  const count = (val: ProjectComponentStatus) => filtered.filter((row) => row.status === val).length

  return (
    <div className="w-full min-w-0 flex-1 space-y-1">
      {/* Phase 1: Enterprise KPI Cards */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard
          title="Tổng cấu kiện"
          value={formatQuantity(filtered.length, 0)}
          tone="blue"
          icon={<Layers size={15} />}
        />
        <EnterpriseKpiCard
          title="READY (Sẵn sàng)"
          value={formatQuantity(count('READY'), 0)}
          tone="emerald"
          icon={<CheckCircle2 size={15} />}
        />
        <EnterpriseKpiCard
          title="SHIPPED (Đã xuất)"
          value={formatQuantity(count('SHIPPED'), 0)}
          tone="cyan"
          icon={<Clock size={15} />}
        />
        <EnterpriseKpiCard
          title="DELIVERED (Đã giao)"
          value={formatQuantity(count('DELIVERED'), 0)}
          tone="purple"
          icon={<PackageOpen size={15} />}
        />
        <EnterpriseKpiCard
          title="INSTALLED (Đã lắp)"
          value={formatQuantity(count('INSTALLED'), 0)}
          tone="amber"
          icon={<Building2 size={15} />}
        />
        <EnterpriseKpiCard
          title="Tỷ lệ lắp đặt"
          value={`${filtered.length ? Math.round((count('INSTALLED') / filtered.length) * 100) : 0}%`}
          tone="emerald"
          icon={<TrendingUp size={15} />}
        />
      </div>

      {/* Phase 3: Compact Toolbar */}
      <EnterprisePanel className="rounded-xl -mt-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_200px_200px_110px_110px]">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm mã cấu kiện, tên cấu kiện..."
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
            />
          </div>

          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="all">Tất cả công trình</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} · {project.name}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'ALL' | ProjectComponentStatus)}
            className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            {componentStatusOptions.map((option) => (
              <option key={option} value={option}>
                Trạng thái: {option}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {}}
            className="h-9 self-end rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
          >
            Tìm kiếm
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setProjectId('all')
              setStatus('ALL')
            }}
            className="h-9 self-end rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Làm mới
          </button>
        </div>
      </EnterprisePanel>

      {/* Phase 4: Hero Table */}
      <div className="grid grid-cols-1 gap-1 xl:grid-cols-[2fr_1fr]">
        <EnterprisePanel className="rounded-xl">
          <div className="mb-1 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Cấu kiện công trình</h3>
              <span className="rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-300 border border-blue-400/20">
                {filtered.length} cấu kiện
              </span>
            </div>
            <button
              type="button"
              onClick={() => setExpandedModalOpen(true)}
              className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition"
            >
              Xem tất cả
            </button>
          </div>

          <div className="h-[520px] overflow-auto scrollbar-none rounded-lg border border-white/10">
            <table className="w-full min-w-[1300px] table-fixed text-sm border-collapse">
              <thead
                className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
              >
                <tr>
                  {['Mã cấu kiện', 'Tên cấu kiện', 'Trạng thái', 'Khối lượng / Giá trị', 'Ngày cấp', 'Hạng mục', 'Zone', 'Axis', 'Level', 'Position', 'Thao tác'].map(
                    (heading) => (
                      <th key={heading} className="px-2 py-2 text-xs font-semibold text-slate-300 text-left">
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {paged.map((row) => (
                  <tr key={row.id} onClick={() => onOpen(row)} className={`${inventoryTableRow} cursor-pointer`}>
                    <td className="px-2 py-2 font-mono font-semibold text-cyan-300 text-xs">{row.code}</td>
                    <td className="px-2 py-2 text-white font-medium truncate">{row.name}</td>
                    <td className="px-2 py-2"><ComponentStatusBadge status={row.status} /></td>
                    <td className="px-2 py-2 font-mono text-cyan-300 text-xs text-right tabular-nums">{formatCurrencyVnd(row.actualCost || row.estimatedCost)}</td>
                    <td className="px-2 py-2 text-slate-300 text-xs truncate">{date(row.plannedDate)}</td>
                    <td className="px-2 py-2 text-slate-300 text-xs truncate">{row.installZone ?? row.projectCode}</td>
                    <td className="px-2 py-2 text-slate-300 text-xs truncate">{row.installZone ?? '-'}</td>
                    <td className="px-2 py-2 text-slate-300 text-xs truncate">{row.installAxis ?? '-'}</td>
                    <td className="px-2 py-2 text-slate-300 text-xs truncate">{row.installLevel ?? '-'}</td>
                    <td className="px-2 py-2 text-slate-300 text-xs truncate">{row.installPosition ?? '-'}</td>
                    <td className="px-2 py-2">
                      <ComponentProjectAction row={row} pending={pendingId === row.id} onDeliver={onDeliver} onInstall={onInstall} />
                    </td>
                  </tr>
                ))}
                {!paged.length ? (
                  <tr>
                    <td colSpan={11} className="px-2 py-10">
                      <CockpitEmptyState
                        title="Chưa có cấu kiện công trình"
                        description="Cấu kiện có projectId sẽ hiển thị tại đây."
                        icon={<Layers size={18} />}
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <DataTablePagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />

          {/* Phase 5: EXPANDED TABLE MODAL */}
          {expandedModalOpen
            ? createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                  <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <h2 className="text-base font-bold text-white">Toàn bộ danh sách cấu kiện công trình</h2>
                        <p className="text-xs text-slate-400">Tổng cộng {filtered.length} cấu kiện</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpandedModalOpen(false)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
                      >
                        Đóng
                      </button>
                    </div>

                    <div className="h-[640px] overflow-y-auto rounded-xl border border-white/10">
                      <table className="w-full min-w-[1300px] text-xs table-fixed border-collapse">
                        <thead
                          className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                          style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                        >
                          <tr>
                            {['Mã cấu kiện', 'Tên cấu kiện', 'Trạng thái', 'Khối lượng / Giá trị', 'Ngày cấp', 'Hạng mục', 'Zone', 'Axis', 'Level', 'Position', 'Thao tác'].map(
                              (heading) => (
                                <th key={heading} className="px-2 py-2 text-left font-semibold text-slate-300">
                                  {heading}
                                </th>
                              ),
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((row) => (
                            <tr
                              key={row.id}
                              onClick={() => {
                                onOpen(row)
                                setExpandedModalOpen(false)
                              }}
                              className={`${inventoryTableRow} cursor-pointer`}
                            >
                              <td className="px-2 py-2 font-mono font-semibold text-cyan-300 text-xs">{row.code}</td>
                              <td className="px-2 py-2 text-white font-medium truncate">{row.name}</td>
                              <td className="px-2 py-2"><ComponentStatusBadge status={row.status} /></td>
                              <td className="px-2 py-2 font-mono text-cyan-300 text-xs text-right tabular-nums">{formatCurrencyVnd(row.actualCost || row.estimatedCost)}</td>
                              <td className="px-2 py-2 text-slate-300 text-xs truncate">{date(row.plannedDate)}</td>
                              <td className="px-2 py-2 text-slate-300 text-xs truncate">{row.installZone ?? row.projectCode}</td>
                              <td className="px-2 py-2 text-slate-300 text-xs truncate">{row.installZone ?? '-'}</td>
                              <td className="px-2 py-2 text-slate-300 text-xs truncate">{row.installAxis ?? '-'}</td>
                              <td className="px-2 py-2 text-slate-300 text-xs truncate">{row.installLevel ?? '-'}</td>
                              <td className="px-2 py-2 text-slate-300 text-xs truncate">{row.installPosition ?? '-'}</td>
                              <td className="px-2 py-2">
                                <ComponentProjectAction row={row} pending={pendingId === row.id} onDeliver={onDeliver} onInstall={onInstall} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>,
                document.body,
              )
            : null}
        </EnterprisePanel>
        <div className="space-y-1">
          <CockpitChartCard title="Cấu kiện theo trạng thái" heightClass="h-[170px]" chartHeightClass="h-[98px]"><StatusMiniBars rows={componentStatusOptions.filter((item) => item !== 'ALL').map((item) => [item, count(item)])} /></CockpitChartCard>
          <CockpitChartCard title="Cấu kiện theo hạng mục" heightClass="h-[170px]" chartHeightClass="h-[98px]"><StatusMiniBars rows={topComponentZones(filtered)} /></CockpitChartCard>
        </div>
      </div>
    </div>
  )
}

function ReportsTab({ runtime, rows, onOpen }: { runtime: ProjectsRuntime; rows: ProjectRuntimeRow[]; onOpen: (row: ProjectRuntimeRow) => void }) {
  return (
    <div className="w-full min-w-0 flex-1 space-y-1">
      <KpiStrip runtime={runtime} delayed={rows.filter((row) => isDelayed(row)).length} />
      <div className="grid grid-cols-1 gap-1 xl:grid-cols-3">
        <StatusWidget runtime={runtime} />
        <ValueWidget rows={rows} />
        <ProgressWidget rows={rows} />
      </div>
      <ProjectTable rows={rows} onOpen={onOpen} />
    </div>
  )
}

function ProjectCostsTab({ runtime, rows }: { runtime: ProjectsRuntime; rows: ProjectRuntimeRow[] }) {
  const totals = runtime.financial.reduce((acc, item) => ({
    contractValue: acc.contractValue + item.contractValue,
    budget: acc.budget + item.budget,
    actualCost: acc.actualCost + item.actualCost,
    profit: acc.profit + item.profit,
    materialCost: acc.materialCost + item.breakdown.materialCost,
    componentCost: acc.componentCost + item.breakdown.componentCost,
    laborCost: acc.laborCost + item.breakdown.laborCost,
    machineCost: acc.machineCost + item.breakdown.machineCost,
    otherCost: acc.otherCost + item.breakdown.otherCost,
  }), { contractValue: 0, budget: 0, actualCost: 0, profit: 0, materialCost: 0, componentCost: 0, laborCost: 0, machineCost: 0, otherCost: 0 })
  const margin = totals.contractValue > 0 ? (totals.profit / totals.contractValue) * 100 : 0
  const costRows = rows.map((project) => {
    const financial = runtime.financial.find((item) => item.projectId === project.id) ?? fallbackFinancial(project)
    return { project, financial }
  }).sort((a, b) => b.financial.actualCost - a.financial.actualCost)

  return (
    <div className="w-full min-w-0 flex-1 space-y-1">
      <div className="grid grid-cols-1 gap-1 md:grid-cols-5">
        <CockpitKpiCard title="Giá trị hợp đồng" value={formatCurrencyVnd(totals.contractValue)} note="Tổng project" tone="cyan" />
        <CockpitKpiCard title="Ngân sách" value={formatCurrencyVnd(totals.budget)} note="Budget" tone="blue" />
        <CockpitKpiCard title="Chi phí thực tế" value={formatCurrencyVnd(totals.actualCost)} note="Actual" tone="amber" />
        <CockpitKpiCard title="Lợi nhuận" value={formatCurrencyVnd(totals.profit)} note={totals.profit >= 0 ? 'Dương' : 'Âm'} tone={totals.profit >= 0 ? 'emerald' : 'red'} />
        <CockpitKpiCard title="Biên lợi nhuận" value={`${fmt(margin)}%`} note="Profit / contract" tone={margin >= 0 ? 'emerald' : 'red'} />
      </div>
      <div className="grid grid-cols-1 gap-1 xl:grid-cols-3">
        <CockpitChartCard title="Cost Breakdown" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars rows={[
            ['Material', totals.materialCost],
            ['Component', totals.componentCost],
            ['Labor', totals.laborCost],
            ['Machine', totals.machineCost],
            ['Other', totals.otherCost],
          ]} currency />
        </CockpitChartCard>
        <CockpitChartCard title="Budget vs Actual" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <ProjectLineChart series={[
            { name: 'Budget', values: runtime.financial.map((row) => row.budget) },
            { name: 'Actual', values: runtime.financial.map((row) => row.actualCost) },
          ]} currency />
        </CockpitChartCard>
        <CockpitChartCard title="Profitability" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <ProjectLineChart series={[
            { name: 'Revenue', values: runtime.financial.map((row) => row.contractValue) },
            { name: 'Cost', values: runtime.financial.map((row) => row.actualCost) },
            { name: 'Profit', values: runtime.financial.map((row) => row.profit) },
          ]} currency />
        </CockpitChartCard>
      </div>
      <CockpitChartCard title="Chi phí theo công trình" heightClass="h-[520px]">
        <CockpitTableShell className="h-[452px]">
          <table className="w-full min-w-[1080px] table-fixed text-sm">
            <thead className={tableHead}><tr>{['Mã', 'Công trình', 'Hợp đồng', 'Ngân sách', 'Thực tế', 'Lợi nhuận', 'Biên LN'].map((head) => <th key={head} className="px-1.5 py-1 text-left font-medium">{head}</th>)}</tr></thead>
            <tbody>{costRows.map(({ project, financial }) => <tr key={project.id} className={tableRow}><td className="truncate px-1.5 py-2 font-mono text-cyan-300">{project.code}</td><td className="truncate px-1.5 py-2 text-white">{project.name}</td><td className="px-1.5 py-2 text-right font-mono">{formatCurrencyVnd(financial.contractValue)}</td><td className="px-1.5 py-2 text-right font-mono">{formatCurrencyVnd(financial.budget)}</td><td className="px-1.5 py-2 text-right font-mono">{formatCurrencyVnd(financial.actualCost)}</td><td className={`px-1.5 py-2 text-right font-mono ${financial.profit >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{formatCurrencyVnd(financial.profit)}</td><td className="px-1.5 py-2 text-right font-mono">{fmt(financial.marginPercent)}%</td></tr>)}</tbody>
          </table>
          {!costRows.length ? <CockpitEmptyState title="Chưa có dữ liệu chi phí" description="Dữ liệu sẽ xuất hiện khi công trình có WBS/cấu kiện/vật tư/chi phí thật." icon={<FileBarChart size={18} />} /> : null}
        </CockpitTableShell>
      </CockpitChartCard>
    </div>
  )
}

function ProjectDocumentsTab({ documents, projects }: { documents: ProjectDocumentRuntime[]; projects: ProjectRuntimeRow[] }) {
  const images = documents.filter((doc) => doc.mimeType.startsWith('image/'))
  const projectMap = new Map(projects.map((project) => [project.id, project]))
  return (
    <div className="w-full min-w-0 flex-1 space-y-1">
      <div className="grid grid-cols-1 gap-1 md:grid-cols-4">
        <CockpitKpiCard title="Tài liệu" value={fmt(documents.length, 0)} note="Attachment records" tone="cyan" />
        <CockpitKpiCard title="Hình ảnh" value={fmt(images.length, 0)} note="image/*" tone="purple" />
        <CockpitKpiCard title="PDF/Office" value={fmt(documents.length - images.length, 0)} note="Hồ sơ" tone="blue" />
        <CockpitKpiCard title="Công trình có hồ sơ" value={fmt(new Set(documents.map((doc) => doc.projectId).filter(Boolean)).size, 0)} note="Project linked" tone="emerald" />
      </div>
      <ProjectDocumentsGallery documents={documents} projects={projectMap} />
    </div>
  )
}

function ProjectLogsTab({ logs, projects }: { logs: ProjectLogRuntime[]; projects: ProjectRuntimeRow[] }) {
  const projectMap = new Map(projects.map((project) => [project.id, project]))
  const grouped = logs.reduce<Array<[string, number]>>((acc, row) => addTuple(acc, row.action, 1), [])
  return (
    <div className="w-full min-w-0 flex-1 space-y-1">
      <div className="grid grid-cols-1 gap-1 md:grid-cols-4">
        <CockpitKpiCard title="Nhật ký" value={fmt(logs.length, 0)} note="ActivityLog" tone="cyan" />
        <CockpitKpiCard title="Task" value={fmt(logs.filter((row) => row.entity === 'ProjectTask').length, 0)} note="WBS changes" tone="purple" />
        <CockpitKpiCard title="Returns" value={fmt(logs.filter((row) => row.action.toLowerCase().includes('return')).length, 0)} note="Material/component" tone="amber" />
        <CockpitKpiCard title="Hôm nay" value={fmt(logs.filter((row) => new Date(row.createdAt).toDateString() === new Date().toDateString()).length, 0)} note="Today" tone="emerald" />
      </div>
      <div className="grid grid-cols-1 gap-1 xl:grid-cols-[2fr_1fr]">
        <CockpitChartCard title="Timeline hoạt động" heightClass="h-[560px]">
          <CockpitRecentList items={logs.slice(0, 40).map((log) => ({ id: log.id, title: log.title, subtitle: [projectMap.get(log.projectId ?? '')?.code, log.detail, log.entity].filter(Boolean).join(' · '), time: formatDateTime(log.createdAt), statusDot: log.action.toLowerCase().includes('delete') ? 'bg-red-400' : log.action.toLowerCase().includes('return') ? 'bg-amber-400' : 'bg-cyan-400' }))} emptyMessage="Chưa có ActivityLog cho công trình." />
        </CockpitChartCard>
        <div className="space-y-1">
          <CockpitChartCard title="Theo loại hoạt động" heightClass="h-[270px]" chartHeightClass="h-[190px]">
            <StatusMiniBars rows={grouped.slice(0, 8)} />
          </CockpitChartCard>
          <CockpitChartCard title="Nguồn dữ liệu" heightClass="h-[270px]" chartHeightClass="h-[190px]">
            <CockpitStatusList items={[
              { id: 'activity-log', label: 'ActivityLog', value: logs.length, statusTone: logs.length ? 'emerald' : 'amber' },
              { id: 'project-events', label: 'Project events', value: logs.filter((row) => row.module === 'projects').length, statusTone: 'cyan' },
              { id: 'task-events', label: 'Task events', value: logs.filter((row) => row.entity === 'ProjectTask').length, statusTone: 'purple' },
            ]} />
          </CockpitChartCard>
        </div>
      </div>
    </div>
  )
}

function ProjectDetailWorkspace({
  project,
  materials,
  components,
  wbsRows,
  financial,
  health,
  returnRequests,
  documents,
  logs,
  templates,
  savingWbs,
  savingSite,
  onClose,
  onEditProject,
  onReturnMaterial,
  onOpenPendingReturn,
  onReturnComponent,
  onCreateWbs,
  onUpdateWbs,
  onMoveWbs,
  onDeleteWbs,
  onGenerateWbs,
  onBulkWbs,
  onSiteUpdate,
}: {
  project: ProjectRuntimeRow | null
  materials: ProjectMaterialRuntime[]
  components: ProjectComponentRuntime[]
  wbsRows: ProjectWbsRuntime[]
  financial?: ProjectFinancialRuntime
  health?: ProjectHealthRuntime
  returnRequests: ProjectsRuntime['returnRequests']
  documents: ProjectDocumentRuntime[]
  logs: ProjectLogRuntime[]
  templates: ProjectTemplate[]
  savingWbs: boolean
  savingSite: boolean
  onClose: () => void
  onEditProject: (row: ProjectRuntimeRow) => void
  onReturnMaterial: (row: ProjectMaterialRuntime) => void
  onOpenPendingReturn: (row: ProjectMaterialRuntime) => void
  onReturnComponent: (row: ProjectComponentRuntime) => void
  onCreateWbs: (payload: ProjectWbsTaskPayload) => void
  onUpdateWbs: (taskId: string, payload: Partial<ProjectWbsTaskPayload>) => void
  onMoveWbs: (taskId: string, parentId?: string | null, sortOrder?: number) => void
  onDeleteWbs: (taskId: string) => void
  onGenerateWbs: (payload: GenerateProjectWbsPayload) => void
  onBulkWbs: (payload: BulkProjectWbsPayload) => void
  onSiteUpdate: (payload: ProjectSiteUpdatePayload) => void
}) {
  const [tab, setTab] = useState<DetailTab>('overview')
  useEffect(() => setTab('overview'), [project?.id])
  const detailTabQuery = useQuery({
    queryKey: ['project-detail-tab', project?.id, tab],
    queryFn: () => getProjectDetailTab(project!.id, tab as ProjectDetailTab),
    enabled: Boolean(project?.id),
    staleTime: 30_000,
  })
  const executionQuery = useQuery({
    queryKey: ['project-execution', project?.id],
    queryFn: () => getProjectExecution(project!.id),
    enabled: Boolean(project?.id),
    staleTime: 30_000,
  })
  const tabData = detailTabQuery.data as any
  const execution = executionQuery.data
  const tabProject = tabData?.project ?? project
  const tabMaterials = tabData?.materials ?? materials
  const tabComponents = tabData?.components ?? components
  const tabWbsRows = tabData?.wbs ?? wbsRows
  const tabFinancial = tabData?.financial ?? financial
  const tabHealth = tabData?.health ?? health
  const tabReturnRequests = tabData?.returnRequests ?? returnRequests
  const tabDocuments = tabData?.documents ?? documents
  const tabLogs = tabData?.logs ?? logs
  const componentCount = tabComponents.length
  const materialCount = new Set(tabMaterials.map((row: ProjectMaterialRuntime) => row.materialCode)).size

  return (
    <ModuleDetailDrawer
      open={Boolean(project)}
      title={tabProject?.name ?? ''}
      subtitle={tabProject ? `${tabProject.code} · ${tabProject.owner} · ${tabProject.location}` : undefined}
      actions={project ? <button type="button" onClick={() => onEditProject(project)} className={moduleMutedButton}>Sửa công trình</button> : undefined}
      onClose={onClose}
      size="lg"
      placement="right"
    >
      {tabProject ? (
        <div className="space-y-1 p-3">
          <div className="flex flex-wrap gap-1 rounded-2xl border border-cyan-300/15 bg-slate-950/45 p-1">
            {[
              ['overview', 'Tổng quan'],
              ['command', 'Điều hành'],
              ['site', 'Công trường'],
              ['materials', 'Vật tư'],
              ['components', 'Cấu kiện'],
              ['progress', 'Tiến độ'],
              ['costs', 'Chi phí'],
              ['documents', 'Tài liệu'],
              ['logs', 'Nhật ký'],
            ].map(([id, label]) => (
              <button key={id} type="button" onClick={() => setTab(id as DetailTab)} className={`rounded-xl px-3 py-2 text-xs ${tab === id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'}`}>{label}</button>
            ))}
          </div>
          {tab === 'overview' && (
            <div className="space-y-1">
              <div className="grid grid-cols-1 gap-1 md:grid-cols-4">
                <CockpitKpiCard title="Tiến độ" value={`${fmt(tabProject.progress)}%`} note="Hoàn thành" tone="cyan" />
                <CockpitKpiCard title="Giá trị" value={formatCurrencyVnd(tabProject.actualValue)} note="Đã thực hiện" tone="blue" />
                <CockpitKpiCard title="Cấu kiện" value={fmt(execution?.summary.instanceCount ?? componentCount, 0)} note={execution ? 'Physical instances' : 'Theo projectId'} tone="purple" />
                <CockpitKpiCard title="Vật tư đã cấp" value={fmt(materialCount, 0)} note="Mã vật tư" tone="amber" />
              </div>
              <ProjectExecutionSummary execution={execution} loading={executionQuery.isLoading} />
              <ProjectFinancialSummary project={tabProject} financial={tabFinancial} />
              <ProjectHealthPanel health={tabHealth} returnRequests={tabReturnRequests} />
              <ProjectOverviewExecution rows={tabWbsRows} project={tabProject} />
              <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_1fr]">
                <CockpitChartCard title="Thông tin công trình" heightClass="h-[300px]">
                  <div className="grid gap-1 text-xs">
                    <Info k="Mã công trình" v={tabProject.code} />
                    <Info k="Khách hàng" v={tabProject.owner} />
                    <Info k="Địa điểm" v={tabProject.location} />
                    <Info k="Ngày bắt đầu" v={date(tabProject.startedAt)} />
                    <Info k="Ngày kết thúc" v={date(tabProject.plannedEndAt)} />
                    <Info k="Trạng thái" v={statusLabel(tabProject.status)} />
                    <Info k="Tiến độ" v={`${fmt(tabProject.progress)}%`} />
                    <Info k="Giá trị" v={formatCurrencyVnd(tabProject.actualValue)} />
                  </div>
                </CockpitChartCard>
                <CockpitChartCard title="Timeline gần đây" heightClass="h-[300px]">
                  <CockpitRecentList items={[
                    { id: `${tabProject.id}-created`, title: 'Tạo công trình', subtitle: tabProject.code, time: shortDate(tabProject.createdAt), statusDot: 'bg-cyan-400' },
                    { id: `${tabProject.id}-updated`, title: 'Cập nhật gần nhất', subtitle: tabProject.name, time: shortDate(tabProject.updatedAt), statusDot: tabProject.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-amber-400' },
                    ...tabComponents.slice(0, 4).map((component: ProjectComponentRuntime) => ({ id: component.id, title: component.code, subtitle: component.status, time: date(component.plannedDate), statusDot: 'bg-purple-400' })),
                  ]} />
                </CockpitChartCard>
              </div>
            </div>
          )}
          {tab === 'command' && <ProjectCommandCenter project={tabProject} rows={tabWbsRows} financial={tabFinancial ?? fallbackFinancial(tabProject)} health={tabHealth} />}
          {tab === 'site' && <ProjectSiteMode project={tabProject} rows={tabWbsRows} documents={tabDocuments} logs={tabLogs} saving={savingSite} onSubmit={onSiteUpdate} />}
          {tab === 'materials' && <ProjectDetailMaterials rows={tabMaterials} onReturn={onReturnMaterial} onOpenPendingReturn={onOpenPendingReturn} />}
          {tab === 'components' && (
            <div className="space-y-1">
              <ProjectExecutionSummary execution={execution} loading={executionQuery.isLoading} expanded />
              <ProjectDetailComponents rows={tabComponents} onReturn={onReturnComponent} />
            </div>
          )}
          {tab === 'progress' && <ProjectDetailProgress project={tabProject} rows={tabWbsRows} health={tabHealth} templates={templates} saving={savingWbs} onCreate={onCreateWbs} onUpdate={onUpdateWbs} onMove={onMoveWbs} onDelete={onDeleteWbs} onGenerate={onGenerateWbs} onBulk={onBulkWbs} />}
          {tab === 'costs' && <ProjectCostControl financial={tabFinancial ?? fallbackFinancial(tabProject)} rows={tabWbsRows} />}
          {tab === 'documents' && <ProjectDocumentsGallery documents={tabDocuments} compact />}
          {tab === 'logs' && <ProjectTimeline project={tabProject} rows={tabWbsRows} returnRequests={tabReturnRequests} logs={tabLogs} />}
        </div>
      ) : null}
    </ModuleDetailDrawer>
  )
}

function ProjectFinancialSummary({ project, financial }: { project: ProjectRuntimeRow; financial?: ProjectFinancialRuntime }) {
  const data = financial ?? fallbackFinancial(project)
  return (
    <div className="grid grid-cols-1 gap-1 md:grid-cols-5">
      <CockpitKpiCard title="Giá trị hợp đồng" value={formatCurrencyVnd(data.contractValue)} note="Revenue" tone="cyan" />
      <CockpitKpiCard title="Ngân sách" value={formatCurrencyVnd(data.budget)} note="Baseline" tone="blue" />
      <CockpitKpiCard title="Chi phí thực tế" value={formatCurrencyVnd(data.actualCost)} note="Material + component" tone="amber" />
      <CockpitKpiCard title="Lợi nhuận" value={formatCurrencyVnd(data.profit)} note={data.profit >= 0 ? 'Dương' : 'Âm'} tone={data.profit >= 0 ? 'emerald' : 'red'} />
      <CockpitKpiCard title="Biên lợi nhuận" value={`${fmt(data.marginPercent)}%`} note="Profit / contract" tone={data.marginPercent >= 0 ? 'emerald' : 'red'} />
    </div>
  )
}

function ProjectExecutionSummary({
  execution,
  loading,
  expanded = false,
}: {
  execution?: ProjectExecutionReadModel
  loading: boolean
  expanded?: boolean
}) {
  if (loading) {
    return (
      <CockpitChartCard title="Canonical Execution" heightClass={expanded ? 'h-[320px]' : 'h-[180px]'}>
        <CockpitEmptyState title="Đang tải execution read model" description="Nguồn: Requirement → Production Order → Component Instance." />
      </CockpitChartCard>
    )
  }

  if (!execution) {
    return (
      <CockpitChartCard title="Canonical Execution" heightClass={expanded ? 'h-[320px]' : 'h-[180px]'}>
        <CockpitEmptyState title="Chưa có execution read model" description="Dữ liệu canonical sẽ xuất hiện khi API /projects/:id/execution trả kết quả." />
      </CockpitChartCard>
    )
  }

  const rows = execution.requirements.slice(0, expanded ? 12 : 5)

  return (
    <CockpitChartCard title="Canonical Execution" heightClass={expanded ? 'h-[420px]' : 'h-[240px]'}>
      <div className="grid grid-cols-2 gap-1 md:grid-cols-6">
        <CockpitKpiCard title="Yêu cầu" value={fmt(execution.summary.requiredQty, 0)} note={`${fmt(execution.summary.requirementCount, 0)} requirements`} tone="cyan" />
        <CockpitKpiCard title="Đã lập PO" value={fmt(execution.summary.orderedQty, 0)} note="Không tính cancelled" tone="blue" />
        <CockpitKpiCard title="Instances" value={fmt(execution.summary.instanceCount, 0)} note="Physical" tone="purple" />
        <CockpitKpiCard title="Hoàn tất SX" value={fmt(execution.summary.completedQty, 0)} note={`${fmt(execution.summary.productionCompletionPercent)}%`} tone="amber" />
        <CockpitKpiCard title="Finished Goods" value={fmt(execution.summary.finishedGoodsQty, 0)} note={`${fmt(execution.summary.finishedGoodsPercent)}%`} tone="emerald" />
        <CockpitKpiCard title="Đã vào Yard" value={fmt(execution.summary.yardStagedQty, 0)} note="ComponentInstance" tone="cyan" />
      </div>
      <CockpitTableShell className={expanded ? 'mt-1 h-[270px]' : 'mt-1 h-[110px]'}>
        <table className="w-full min-w-[900px] table-fixed text-xs">
          <thead className={tableHead}>
            <tr>
              {['Requirement', 'Cấu kiện', 'Required', 'PO', 'Instances', 'In Prod', 'Completed', 'QC Pass', 'QC Fail', 'FG', 'Yard', 'Status'].map((heading) => (
                <th key={heading} className="px-2 py-2 text-left font-semibold text-slate-300">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className={tableRow}>
                <td className="px-2 py-2 font-mono text-cyan-300">{row.requirementNo}</td>
                <td className="truncate px-2 py-2 text-white">{row.component.code} · {row.component.name}</td>
                <td className="px-2 py-2 text-right tabular-nums">{fmt(row.quantities.requiredQty, 0)}</td>
                <td className="px-2 py-2 text-right tabular-nums">{fmt(row.quantities.orderedQty, 0)}</td>
                <td className="px-2 py-2 text-right tabular-nums">{fmt(row.quantities.instanceCount, 0)}</td>
                <td className="px-2 py-2 text-right tabular-nums">{fmt(row.quantities.inProductionQty, 0)}</td>
                <td className="px-2 py-2 text-right tabular-nums">{fmt(row.quantities.completedQty, 0)}</td>
                <td className="px-2 py-2 text-right tabular-nums text-emerald-300">{fmt(row.quantities.qcPassedQty, 0)}</td>
                <td className="px-2 py-2 text-right tabular-nums text-red-300">{fmt(row.quantities.qcFailedQty, 0)}</td>
                <td className="px-2 py-2 text-right tabular-nums text-cyan-300">{fmt(row.quantities.finishedGoodsQty, 0)}</td>
                <td className="px-2 py-2 text-right tabular-nums text-blue-300">{fmt(row.quantities.yardStagedQty, 0)}</td>
                <td className="px-2 py-2 text-slate-300">{executionStatusLabel(row.executionStatus)}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={12} className="px-2 py-8">
                  <CockpitEmptyState title="Chưa có requirement" description="Tạo ProjectComponentRequirement để bắt đầu execution tracking." />
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </CockpitTableShell>
      <p className="mt-1 text-[10px] text-slate-500">
        Yard canonical: {execution.summary.downstream.yardCanonical ? 'ComponentInstance-level enabled' : 'chưa canonical'}. Dispatch canonical: chưa triển khai.
      </p>
    </CockpitChartCard>
  )
}

function ProjectHealthPanel({ health, returnRequests }: { health?: ProjectHealthRuntime; returnRequests: ProjectsRuntime['returnRequests'] }) {
  const statusText = health?.status === 'DELAYED' ? 'Đang chậm' : health?.status === 'RISK' ? 'Có nguy cơ chậm' : 'Bình thường'
  return (
    <div className="grid grid-cols-1 gap-1 xl:grid-cols-3">
      <CockpitChartCard title="Project Health" heightClass="h-[170px]" chartHeightClass="h-[98px]">
        <CockpitStatusList items={[
          { id: 'score', label: statusText, value: `${fmt(health?.score ?? 100, 0)}/100`, statusTone: health?.status === 'DELAYED' ? 'red' : health?.status === 'RISK' ? 'amber' : 'emerald' },
          { id: 'blocked', label: 'Blocked', value: health?.blockedTasks ?? 0, statusTone: 'red' },
          { id: 'returns', label: 'Phiếu trả mở', value: health?.openReturns ?? 0, statusTone: 'amber' },
        ]} />
      </CockpitChartCard>
      <CockpitChartCard title="Cảnh báo" heightClass="h-[170px]" chartHeightClass="h-[98px]">
        <CockpitRecentList items={(health?.warnings ?? []).slice(0, 4).map((warning, index) => ({ id: `warning-${index}`, title: warning, subtitle: 'Project execution', time: '', statusDot: 'bg-amber-400' }))} emptyMessage="Không có cảnh báo vận hành." />
      </CockpitChartCard>
      <CockpitChartCard title="Khuyến nghị" heightClass="h-[170px]" chartHeightClass="h-[98px]">
        <CockpitRecentList items={(health?.suggestedActions ?? []).slice(0, 4).map((action, index) => ({ id: `action-${index}`, title: action, subtitle: 'Suggested action', time: '', statusDot: 'bg-cyan-400' }))} emptyMessage={returnRequests.length ? 'Hoàn tất các phiếu trả đang mở.' : 'Không có khuyến nghị.'} />
      </CockpitChartCard>
    </div>
  )
}

function ProjectSiteMode({ project, rows, documents, logs, saving, onSubmit }: { project: ProjectRuntimeRow; rows: ProjectWbsRuntime[]; documents: ProjectDocumentRuntime[]; logs: ProjectLogRuntime[]; saving: boolean; onSubmit: (payload: ProjectSiteUpdatePayload) => void }) {
  const activeTasks = rows.filter((row) => row.type !== 'PROJECT' && row.progress < 100)
  const [taskId, setTaskId] = useState(activeTasks[0]?.id ?? '')
  const [installedQuantity, setInstalledQuantity] = useState(0)
  const [usedQuantity, setUsedQuantity] = useState(0)
  const [qcStatus, setQcStatus] = useState<ProjectSiteUpdatePayload['qcStatus']>('NONE')
  const [hasIssue, setHasIssue] = useState(false)
  const [note, setNote] = useState('')
  useEffect(() => {
    setTaskId(activeTasks[0]?.id ?? rows[0]?.id ?? '')
    setInstalledQuantity(0)
    setUsedQuantity(0)
    setQcStatus('NONE')
    setHasIssue(false)
    setNote('')
  }, [project.id])
  const task = rows.find((row) => row.id === taskId)
  const photos = documents.filter((doc) => doc.mimeType.startsWith('image/'))
  const siteLogs = logs.filter((log) => log.action === 'PROJECT_SITE_UPDATE')
  const submit = () => {
    if (!taskId) return
    onSubmit({ taskId, installedQuantity, usedQuantity, qcStatus, hasIssue, note })
  }

  return (
    <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1.3fr_.7fr]">
      <CockpitChartCard title="Công trường" heightClass="h-[560px]">
        <div className="grid gap-3 p-1 text-sm">
          <Field label="Task hôm nay">
            <select value={taskId} onChange={(event) => setTaskId(event.target.value)} className={`${input} w-full`}>
              {rows.filter((row) => row.type !== 'PROJECT').map((row) => <option key={row.id} value={row.id}>{'  '.repeat(row.level)}{row.name}</option>)}
            </select>
          </Field>
          <div className="rounded-2xl border border-cyan-300/15 bg-slate-950/55 p-3">
            <div className="text-xs text-slate-400">ERP tự tính</div>
            <div className="mt-1 text-2xl font-semibold text-white">{task ? `${fmt(task.progress)}%` : '0%'} → {task ? `${fmt(Math.min(100, task.progress + (installedQuantity > 0 ? 12 : 0) + (usedQuantity > 0 ? 8 : 0) + (qcStatus === 'PASSED' ? 10 : 0) - (hasIssue ? 5 : 0)))}%` : '-'}</div>
          </div>
          <SiteStepper label="Đã lắp" value={installedQuantity} onChange={setInstalledQuantity} />
          <SiteStepper label="Đã dùng" value={usedQuantity} onChange={setUsedQuantity} />
          <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
            <Field label="QC"><select value={qcStatus} onChange={(event) => setQcStatus(event.target.value as ProjectSiteUpdatePayload['qcStatus'])} className={`${input} w-full`}><option value="NONE">Chưa cập nhật</option><option value="PASSED">Đạt</option><option value="FAILED">Không đạt</option></select></Field>
            <Field label="Sự cố"><select value={hasIssue ? 'yes' : 'no'} onChange={(event) => setHasIssue(event.target.value === 'yes')} className={`${input} w-full`}><option value="no">Không</option><option value="yes">Có</option></select></Field>
          </div>
          <Field label="Ghi chú"><textarea value={note} onChange={(event) => setNote(event.target.value)} className={`${input} min-h-24 w-full py-2`} /></Field>
          <CockpitEmptyState title="Ảnh hiện trường" description="Upload ảnh sẽ dùng Attachment project/task ở phase kế tiếp. Timeline bên phải hiển thị ảnh thật nếu đã có." />
          <button type="button" disabled={saving || !taskId} onClick={submit} className={primaryButton}>{saving ? 'Đang gửi...' : 'Gửi cập nhật'}</button>
        </div>
      </CockpitChartCard>
      <div className="space-y-1">
        <CockpitChartCard title="Photo Timeline" heightClass="h-[278px]">
          <CockpitRecentList items={photos.slice(0, 8).map((doc) => ({ id: doc.id, title: doc.originalName ?? doc.title, subtitle: doc.source, time: formatDateTime(doc.createdAt), statusDot: 'bg-cyan-400' }))} emptyMessage="Chưa có ảnh hiện trường." />
        </CockpitChartCard>
        <CockpitChartCard title="Site Updates" heightClass="h-[278px]">
          <CockpitRecentList items={siteLogs.slice(0, 8).map((log) => ({ id: log.id, title: log.title, subtitle: log.detail ?? 'Công trường', time: formatDateTime(log.createdAt), statusDot: 'bg-emerald-400' }))} emptyMessage="Chưa có cập nhật công trường." />
        </CockpitChartCard>
      </div>
    </div>
  )
}

function SiteStepper({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-cyan-300/15 bg-slate-950/45 p-3">
      <span className="text-sm text-slate-200">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className={mutedButton}>-</button>
        <span className="w-16 text-center font-mono text-xl text-white">{fmt(value, 0)}</span>
        <button type="button" onClick={() => onChange(value + 1)} className={mutedButton}>+</button>
      </div>
    </div>
  )
}

function ProjectOverviewExecution({ rows, project }: { rows: ProjectWbsRuntime[]; project: ProjectRuntimeRow }) {
  const phases = rows.filter((row) => row.type === 'PHASE' || row.level <= 1).slice(0, 6)
  const upcoming = rows
    .filter((row) => row.progress < 100)
    .sort((a, b) => new Date(a.plannedFinishAt ?? a.plannedStartAt ?? 0).getTime() - new Date(b.plannedFinishAt ?? b.plannedStartAt ?? 0).getTime())
    .slice(0, 6)
  return (
    <div className="grid grid-cols-1 gap-1 xl:grid-cols-2">
      <CockpitChartCard title="Tiến độ theo hạng mục" heightClass="h-[260px]">
        <CockpitTableShell className="h-[200px]">
          <table className="w-full min-w-[760px] table-fixed text-sm">
            <thead className={tableHead}><tr>{['Hạng mục','Khối lượng','Đã hoàn thành','Tiến độ %','Trạng thái'].map((head) => <th key={head} className="px-1.5 py-1 text-left font-medium">{head}</th>)}</tr></thead>
            <tbody>{phases.map((row) => <tr key={row.id} className={tableRow}><td className="truncate px-1.5 py-2 text-white">{row.name}</td><td className="px-1.5 py-2 text-right">{fmt(row.componentCount + row.materialCount, 0)}</td><td className="px-1.5 py-2 text-right">{fmt(row.progress >= 100 ? row.componentCount + row.materialCount : 0, 0)}</td><td className="px-1.5 py-2"><Progress value={row.progress} /></td><td className="px-1.5 py-2">{row.status}</td></tr>)}</tbody>
          </table>
          {!phases.length ? <CockpitEmptyState title="Chưa có hạng mục" description="Hạng mục sẽ xuất hiện khi có WBS hoặc dữ liệu cấu kiện/vật tư." /> : null}
        </CockpitTableShell>
      </CockpitChartCard>
      <CockpitChartCard title="Công việc sắp tới" heightClass="h-[260px]">
        <CockpitTableShell className="h-[200px]">
          <table className="w-full min-w-[720px] table-fixed text-sm">
            <thead className={tableHead}><tr>{['Công việc','Hạng mục','Thời gian','Trạng thái'].map((head) => <th key={head} className="px-1.5 py-1 text-left font-medium">{head}</th>)}</tr></thead>
            <tbody>{upcoming.map((row) => <tr key={row.id} className={tableRow}><td className="truncate px-1.5 py-2 text-white">{row.name}</td><td className="truncate px-1.5 py-2">{rows.find((item) => item.id === row.parentId)?.name ?? project.code}</td><td className="px-1.5 py-2">{date(row.plannedFinishAt)}</td><td className="px-1.5 py-2">{row.status}</td></tr>)}</tbody>
          </table>
          {!upcoming.length ? <CockpitEmptyState title="Chưa có công việc sắp tới" description="Các task chưa hoàn thành sẽ hiển thị tại đây." /> : null}
        </CockpitTableShell>
      </CockpitChartCard>
      <CockpitChartCard title="Hình ảnh công trường" heightClass="h-[220px]" className="xl:col-span-1">
        <CockpitEmptyState title="Chưa có hình ảnh công trường" description="Ảnh sẽ xuất hiện khi Project attachment/photo foundation được nối vào Công trình." />
      </CockpitChartCard>
      <CockpitChartCard title="Timeline dự án" heightClass="h-[220px]" className="xl:col-span-1">
        <ProjectMilestoneTimeline project={project} rows={rows} />
      </CockpitChartCard>
    </div>
  )
}

function ProjectCommandCenter({ project, rows, financial, health }: { project: ProjectRuntimeRow; rows: ProjectWbsRuntime[]; financial: ProjectFinancialRuntime; health?: ProjectHealthRuntime }) {
  const completed = rows.filter((row) => row.status === 'COMPLETED' || row.progress >= 100).length
  const delayed = rows.filter((row) => row.delayDays > 0)
  const cascadeDelayed = rows.filter((row) => (row.cascadeDelayDays ?? 0) > 0)
  const atRisk = rows.filter((row) => row.status === 'BLOCKED' || row.status === 'PAUSED')
  const resourceShortages = resourceShortageRows(rows)
  const inspectionRows = inspectionStatusRows(rows)
  const upcoming = rows
    .filter((row) => row.progress < 100)
    .sort((a, b) => new Date(a.plannedFinishAt ?? a.plannedStartAt ?? 0).getTime() - new Date(b.plannedFinishAt ?? b.plannedStartAt ?? 0).getTime())
    .slice(0, 6)
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-1 gap-1 md:grid-cols-3 xl:grid-cols-6">
        <CockpitKpiCard title="Tổng tiến độ" value={`${fmt(project.progress)}%`} note="Project runtime" tone="cyan" />
        <CockpitKpiCard title="Khối lượng hoàn thành" value={fmt(completed, 0)} note="WBS tasks" tone="emerald" />
        <CockpitKpiCard title="Đúng tiến độ" value={fmt(Math.max(0, rows.length - delayed.length - atRisk.length), 0)} note="Không cảnh báo" tone="blue" />
        <CockpitKpiCard title="Chậm tiến độ" value={fmt(delayed.length, 0)} note="Delay > 0" tone={delayed.length ? 'red' : 'emerald'} />
        <CockpitKpiCard title="Nguy cơ chậm" value={fmt(atRisk.length + cascadeDelayed.length, 0)} note="Blocked/Cascade" tone={atRisk.length || cascadeDelayed.length ? 'amber' : 'emerald'} />
        <CockpitKpiCard title="Giá trị thực hiện" value={formatCurrencyVnd(financial.actualCost)} note="Actual cost" tone="purple" />
      </div>
      <div className="grid grid-cols-1 gap-1 xl:grid-cols-4">
        <CockpitChartCard title="Project Health Score" heightClass="h-[170px]" chartHeightClass="h-[98px]">
          <CockpitStatusList items={[
            { id: 'score', label: health?.status === 'DELAYED' ? 'Đang chậm' : health?.status === 'RISK' ? 'Nguy cơ chậm' : 'Bình thường', value: `${fmt(health?.score ?? 100, 0)}/100`, statusTone: health?.status === 'DELAYED' ? 'red' : health?.status === 'RISK' ? 'amber' : 'emerald' },
            { id: 'forecast', label: 'Forecast Finish', value: date(rows.map((row) => row.forecastFinishAt ?? row.scheduledFinishAt ?? row.plannedFinishAt).filter(Boolean).sort().at(-1) ?? project.plannedEndAt), statusTone: delayed.length ? 'amber' : 'cyan' },
          ]} />
        </CockpitChartCard>
        <CockpitChartCard title="Thiếu vật tư" heightClass="h-[170px]" chartHeightClass="h-[98px]">
          <CockpitStatusList items={resourceShortages.filter((row) => row.id.includes('material')).map((row) => ({ ...row, statusTone: 'amber' }))} emptyMessage="Không thiếu vật tư theo allocation hiện tại." />
        </CockpitChartCard>
        <CockpitChartCard title="Thiếu cấu kiện" heightClass="h-[170px]" chartHeightClass="h-[98px]">
          <CockpitStatusList items={resourceShortages.filter((row) => row.id.includes('component')).map((row) => ({ ...row, statusTone: 'purple' }))} emptyMessage="Không thiếu cấu kiện theo allocation hiện tại." />
        </CockpitChartCard>
        <CockpitChartCard title="Thiếu nhân lực / thiết bị" heightClass="h-[170px]" chartHeightClass="h-[98px]">
          <CockpitStatusList items={resourceShortages.filter((row) => row.id.includes('worker') || row.id.includes('machine'))} emptyMessage="Không thiếu resource theo loading hiện tại." />
        </CockpitChartCard>
      </div>
      <div className="grid grid-cols-1 gap-1 xl:grid-cols-3">
        <CockpitChartCard title="Tiến độ theo thời gian" heightClass="h-[240px]" chartHeightClass="h-[158px]">
          <ProjectLineChart series={[
            { name: 'Kế hoạch', values: buildTaskPlannedProgress(rows) },
            { name: 'Thực tế', values: rows.map((row) => row.progress) },
            { name: 'Dự báo', values: rows.map((row) => Math.min(100, Math.max(row.progress, row.progress - (row.cascadeDelayDays ?? row.delayDays)))) },
          ]} />
        </CockpitChartCard>
        <CockpitChartCard title="Cơ cấu tiến độ" heightClass="h-[240px]" chartHeightClass="h-[158px]">
          <StatusMiniBars rows={[
            ['Thiết kế', rows.filter((row) => row.name.toLowerCase().includes('thiết')).length],
            ['Gia công', rows.filter((row) => row.name.toLowerCase().includes('gia công') || row.name.toLowerCase().includes('cắt') || row.name.toLowerCase().includes('hàn')).length],
            ['Vận chuyển', rows.filter((row) => row.name.toLowerCase().includes('vận chuyển')).length],
            ['Lắp dựng', rows.filter((row) => row.name.toLowerCase().includes('lắp')).length],
            ['Hoàn thiện', rows.filter((row) => row.status === 'COMPLETED').length],
          ]} />
        </CockpitChartCard>
        <CockpitChartCard title="Top hạng mục chậm" heightClass="h-[240px]" chartHeightClass="h-[158px]">
          <CockpitStatusList items={delayed.slice(0, 5).map((row) => ({ id: row.id, label: row.name, value: `${fmt(row.delayDays, 0)} ngày`, statusTone: 'red' }))} emptyMessage="Không có công việc chậm." />
        </CockpitChartCard>
      </div>
      <div className="grid grid-cols-1 gap-1 xl:grid-cols-[2fr_1fr]">
        <CockpitChartCard title="Gantt tiến độ" heightClass="h-[320px]" chartHeightClass="h-[252px]">
          <ProjectGantt rows={rows} />
        </CockpitChartCard>
        <div className="space-y-1">
          <CockpitChartCard title="Công việc sắp tới" heightClass="h-[170px]" chartHeightClass="h-[98px]">
            <CockpitRecentList items={upcoming.map((row) => ({ id: row.id, title: row.name, subtitle: rows.find((item) => item.id === row.parentId)?.name ?? 'Root', time: date(row.plannedFinishAt), statusDot: row.delayDays > 0 ? 'bg-red-400' : 'bg-cyan-400' }))} emptyMessage="Chưa có công việc sắp tới." />
          </CockpitChartCard>
          <CockpitChartCard title="Hình ảnh công trường" heightClass="h-[170px]" chartHeightClass="h-[98px]">
            <CockpitEmptyState title="Chưa có hình ảnh" description="Ảnh công trường sẽ hiển thị khi attachment project được nối." />
          </CockpitChartCard>
          <CockpitChartCard title="Cảnh báo dây chuyền" heightClass="h-[170px]" chartHeightClass="h-[98px]">
            <CockpitStatusList items={[...dependencyWarnings(rows), ...resourceShortages.slice(0, 3), ...inspectionRows.filter((row) => row.value > 0).slice(0, 2)]} emptyMessage={health?.warnings?.[0] ?? 'Không có cảnh báo dây chuyền.'} />
          </CockpitChartCard>
        </div>
      </div>
    </div>
  )
}

function ProjectCostControl({ financial, rows }: { financial: ProjectFinancialRuntime; rows?: ProjectWbsRuntime[] }) {
  const taskCosts = (rows ?? []).filter((row) => (row.cost ?? 0) || (row.revenue ?? 0)).slice(0, 8)
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-1 gap-1 md:grid-cols-5">
        <CockpitKpiCard title="Giá trị hợp đồng" value={formatCurrencyVnd(financial.contractValue)} note="Revenue" tone="cyan" />
        <CockpitKpiCard title="Ngân sách" value={formatCurrencyVnd(financial.budget)} note="Budget" tone="blue" />
        <CockpitKpiCard title="Chi phí thực tế" value={formatCurrencyVnd(financial.actualCost)} note="Actual" tone="amber" />
        <CockpitKpiCard title="Lợi nhuận" value={formatCurrencyVnd(financial.profit)} note="Profit" tone={financial.profit >= 0 ? 'emerald' : 'red'} />
        <CockpitKpiCard title="Biên lợi nhuận" value={`${fmt(financial.marginPercent)}%`} note="Margin" tone={financial.marginPercent >= 0 ? 'emerald' : 'red'} />
      </div>
      <div className="grid grid-cols-1 gap-1 xl:grid-cols-3">
        <CockpitChartCard title="Cost Breakdown" heightClass="h-[260px]" chartHeightClass="h-[180px]">
          <StatusMiniBars rows={[
            ['Material', financial.breakdown.materialCost],
            ['Labor', financial.breakdown.laborCost],
            ['Machine', financial.breakdown.machineCost],
            ['Other', financial.breakdown.otherCost],
          ]} currency />
        </CockpitChartCard>
        <CockpitChartCard title="Cost Burnup" heightClass="h-[260px]" chartHeightClass="h-[180px]">
          <ProjectLineChart series={[
            { name: 'Budget', values: [financial.budget, financial.budget] },
            { name: 'Actual', values: [0, financial.actualCost] },
            { name: 'Forecast', values: [financial.actualCost, Math.max(financial.actualCost, financial.budget)] },
          ]} currency />
        </CockpitChartCard>
        <CockpitChartCard title="Profitability" heightClass="h-[260px]" chartHeightClass="h-[180px]">
          <ProjectLineChart series={[
            { name: 'Revenue', values: [0, financial.contractValue] },
            { name: 'Cost', values: [0, financial.actualCost] },
            { name: 'Profit', values: [0, financial.profit] },
          ]} currency />
        </CockpitChartCard>
      </div>
      <CockpitChartCard title="Cost Traceability: Project → Phase → Task" heightClass="h-[320px]">
        <CockpitTableShell className="h-[252px]">
          <table className="w-full min-w-[980px] table-fixed text-sm">
            <thead className={tableHead}><tr>{['Task','Doanh thu','Chi phí','Lợi nhuận','Biên LN'].map((head) => <th key={head} className="px-1.5 py-1 text-left font-medium">{head}</th>)}</tr></thead>
            <tbody>{taskCosts.map((row) => {
              const revenue = row.revenue ?? 0
              const cost = row.cost ?? 0
              const profit = revenue - cost
              return <tr key={row.id} className={tableRow}><td className="truncate px-1.5 py-2 text-white" style={{ paddingLeft: `${row.level * 14 + 6}px` }}>{row.name}</td><td className="px-1.5 py-2 text-right font-mono text-cyan-300">{formatCurrencyVnd(revenue)}</td><td className="px-1.5 py-2 text-right font-mono">{formatCurrencyVnd(cost)}</td><td className={`px-1.5 py-2 text-right font-mono ${profit >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{formatCurrencyVnd(profit)}</td><td className="px-1.5 py-2 text-right font-mono">{fmt(revenue ? (profit / revenue) * 100 : 0)}%</td></tr>
            })}</tbody>
          </table>
          {!taskCosts.length ? <CockpitEmptyState title="Chưa có chi phí task" description="Nhập revenue/cost ở WBS task để xem traceability." /> : null}
        </CockpitTableShell>
      </CockpitChartCard>
    </div>
  )
}

function ProjectDocumentsGallery({ documents, projects, compact = false }: { documents: ProjectDocumentRuntime[]; projects?: Map<string, ProjectRuntimeRow>; compact?: boolean }) {
  const [category, setCategory] = useState('ALL')
  const categories = ['ALL', 'Hợp đồng', 'Bản vẽ', 'Biện pháp thi công', 'Nghiệm thu', 'Biên bản', 'Hình ảnh', 'Khác']
  const categoryOf = (doc: ProjectDocumentRuntime) => {
    if (doc.mimeType.startsWith('image/')) return 'Hình ảnh'
    const raw = normalizeText(`${doc.category ?? ''} ${doc.source ?? ''} ${doc.originalName ?? doc.title}`)
    if (raw.includes('contract') || raw.includes('hop dong')) return 'Hợp đồng'
    if (raw.includes('drawing') || raw.includes('ban ve')) return 'Bản vẽ'
    if (raw.includes('method') || raw.includes('bien phap')) return 'Biện pháp thi công'
    if (raw.includes('accept') || raw.includes('nghiem thu')) return 'Nghiệm thu'
    if (raw.includes('minute') || raw.includes('bien ban')) return 'Biên bản'
    return 'Khác'
  }
  const filteredDocuments = category === 'ALL' ? documents : documents.filter((doc) => categoryOf(doc) === category)
  const images = filteredDocuments.filter((doc) => doc.mimeType.startsWith('image/'))
  const files = filteredDocuments.filter((doc) => !doc.mimeType.startsWith('image/'))
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-1 rounded-2xl border border-cyan-300/15 bg-slate-950/45 p-1">
        {categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`rounded-xl px-3 py-2 text-xs ${category === item ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/[0.06]'}`}>{item}</button>)}
      </div>
      <div className="grid grid-cols-1 gap-1 xl:grid-cols-2">
      <CockpitChartCard title="Hồ sơ công trình" heightClass={compact ? 'h-[360px]' : 'h-[520px]'}>
        <CockpitTableShell className={compact ? 'h-[292px]' : 'h-[452px]'}>
          <table className="w-full min-w-[820px] table-fixed text-sm">
            <thead className={tableHead}><tr>{['Tên file', 'Loại', 'Nguồn', 'Công trình', 'Ngày tạo', 'Tải'].map((head) => <th key={head} className="px-1.5 py-1 text-left font-medium">{head}</th>)}</tr></thead>
            <tbody>{files.map((doc) => <tr key={doc.id} className={tableRow}><td className="truncate px-1.5 py-2 text-white">{doc.originalName ?? doc.title}</td><td className="px-1.5 py-2">{doc.category ?? '-'}</td><td className="truncate px-1.5 py-2">{doc.source}</td><td className="truncate px-1.5 py-2">{projects?.get(doc.projectId ?? '')?.code ?? doc.projectId ?? '-'}</td><td className="px-1.5 py-2">{date(doc.createdAt)}</td><td className="px-1.5 py-2">{doc.publicUrl ? <a href={doc.publicUrl} target="_blank" rel="noreferrer" className="text-cyan-300 hover:text-cyan-100">Mở</a> : <span className="text-slate-500">-</span>}</td></tr>)}</tbody>
          </table>
          {!files.length ? <CockpitEmptyState title="Chưa có tài liệu" description="Tài liệu sẽ hiển thị khi attachment được gắn với project." icon={<PackageOpen size={18} />} /> : null}
        </CockpitTableShell>
      </CockpitChartCard>
      <CockpitChartCard title="Hình ảnh công trường" heightClass={compact ? 'h-[360px]' : 'h-[520px]'}>
        {images.length ? (
          <div className="grid grid-cols-2 gap-1 overflow-auto p-1 md:grid-cols-3">
            {images.slice(0, compact ? 8 : 12).map((doc) => (
              <a key={doc.id} href={doc.publicUrl ?? '#'} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-cyan-300/15 bg-slate-950/50">
                {doc.publicUrl ? <img src={doc.publicUrl} alt={doc.originalName ?? doc.title} className="h-28 w-full object-cover transition group-hover:scale-105" /> : <div className="grid h-28 place-items-center text-xs text-slate-500">No preview</div>}
                <div className="truncate px-2 py-1 text-[11px] text-slate-300">{doc.originalName ?? doc.title}</div>
              </a>
            ))}
          </div>
        ) : <CockpitEmptyState title="Chưa có hình ảnh" description="Ảnh công trường sẽ hiển thị khi attachment image/* được gắn với project." />}
      </CockpitChartCard>
      </div>
    </div>
  )
}

function ProjectTimeline({ project, rows, returnRequests, logs }: { project: ProjectRuntimeRow; rows: ProjectWbsRuntime[]; returnRequests: ProjectsRuntime['returnRequests']; logs: ProjectLogRuntime[] }) {
  const runtimeItems = logs.map((log) => ({ id: log.id, title: log.title, subtitle: [log.detail, log.entity].filter(Boolean).join(' · '), time: formatDateTime(log.createdAt), statusDot: log.action.toLowerCase().includes('return') ? 'bg-amber-400' : 'bg-cyan-400' }))
  const derivedItems = [
    ...rows.slice(0, 5).map((row) => ({ id: row.id, title: row.name, subtitle: row.status, time: date(row.actualFinishAt ?? row.plannedFinishAt), statusDot: row.delayDays > 0 ? 'bg-red-400' : 'bg-cyan-400' })),
    ...returnRequests.slice(0, 5).map((row) => ({ id: row.id, title: row.returnNo, subtitle: row.status, time: date(row.createdAt), statusDot: 'bg-amber-400' })),
  ]
  return (
    <div className="grid grid-cols-1 gap-1 xl:grid-cols-2">
      <CockpitChartCard title="Timeline dự án" heightClass="h-[260px]">
        <ProjectMilestoneTimeline project={project} rows={rows} />
      </CockpitChartCard>
      <CockpitChartCard title="Nhật ký gần đây" heightClass="h-[260px]">
        <CockpitRecentList items={(runtimeItems.length ? runtimeItems : derivedItems).slice(0, 10)} emptyMessage="Chưa có nhật ký dự án." />
      </CockpitChartCard>
    </div>
  )
}

function ProjectMilestoneTimeline({ project, rows }: { project: ProjectRuntimeRow; rows: ProjectWbsRuntime[] }) {
  const milestones = rows
    .filter((row) => row.type === 'PHASE' || row.level <= 1)
    .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
    .slice(0, 8)
  if (!milestones.length) {
    return <CockpitEmptyState title="Chưa có milestone" description="Milestone sẽ hiển thị khi công trình có WBS/phase thật." />
  }
  return (
    <div className="flex h-full items-center gap-1 overflow-x-auto">
      {milestones.map((milestone) => {
        const delayed = milestone.delayDays > 0 || isDelayed(project)
        const state = milestone.progress >= 100 ? 'Completed' : delayed ? 'Delayed' : milestone.progress > 0 ? 'Current' : 'Upcoming'
        const color = state === 'Completed' ? 'bg-emerald-400' : state === 'Delayed' ? 'bg-red-400' : state === 'Current' ? 'bg-cyan-400' : 'bg-slate-600'
        return (
          <div key={milestone.id} className="min-w-[132px] rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs">
            <span className={`mb-2 block h-2 w-2 rounded-full ${color}`} />
            <div className="truncate font-medium text-white">{milestone.name}</div>
            <div className="mt-1 text-[11px] text-slate-500">{state} · {fmt(milestone.progress)}%</div>
          </div>
        )
      })}
    </div>
  )
}

function ProjectDetailMaterials({
  rows,
  onReturn,
  onOpenPendingReturn,
}: {
  rows: ProjectMaterialRuntime[]
  onReturn: (row: ProjectMaterialRuntime) => void
  onOpenPendingReturn: (row: ProjectMaterialRuntime) => void
}) {
  const grouped = aggregateMaterials(rows)
  const returnableRows = rows.filter((row) => Number(row.availableReturnQuantity ?? 0) > 0)
  return (
    <div className="grid grid-cols-1 gap-1 2xl:grid-cols-[0.95fr_1.15fr_0.9fr]">
      <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3">
        <div className="mb-1 flex items-center justify-between"><h3 className="text-sm font-semibold">Vật tư công trình</h3><button type="button" onClick={() => returnableRows[0] ? onReturn(returnableRows[0]) : toast('Không còn vật tư có thể trả')} className={mutedButton}>Trả vật tư</button></div>
        <CockpitTableShell className="h-[420px]">
          <table className="w-full min-w-[900px] table-fixed text-sm">
            <thead className={tableHead}><tr>{['Mã vật tư', 'Tên vật tư', 'Đơn vị', 'Allocated', 'Used', 'Pending Return', 'Returned', 'Available Return', 'Giá trị', 'Thao tác'].map((heading) => <th key={heading} className="px-1.5 py-1 text-left font-medium">{heading}</th>)}</tr></thead>
            <tbody>{grouped.map((row) => {
              const source = rows.find((item) => item.materialCode === row.code)
              const returnSource = returnableRows.find((item) => item.materialCode === row.code)
              return <tr key={row.code} className={tableRow}><td className="truncate px-1.5 py-2 font-mono text-cyan-300">{row.code}</td><td className="truncate px-1.5 py-2 text-white">{row.name}</td><td className="px-1.5 py-2">{row.unit}</td><td className="px-1.5 py-2 text-right font-mono">{fmt(row.allocated)}</td><td className="px-1.5 py-2 text-right font-mono">{fmt(row.used)}</td><td className="px-1.5 py-2 text-right font-mono text-amber-200">{row.pendingReturn > 0 && source?.projectId ? <button type="button" onClick={() => onOpenPendingReturn(source)} className="underline decoration-amber-300/40 underline-offset-4 hover:text-amber-100">{fmt(row.pendingReturn)}</button> : fmt(row.pendingReturn)}</td><td className="px-1.5 py-2 text-right font-mono text-emerald-200">{fmt(row.returned)}</td><td className="px-1.5 py-2 text-right font-mono text-cyan-200">{fmt(row.availableReturn)}</td><td className="px-1.5 py-2 text-right font-mono text-cyan-300">{formatCurrencyVnd(row.value)}</td><td className="px-1.5 py-2">{returnSource ? <button type="button" disabled={row.availableReturn <= 0} onClick={() => onReturn(returnSource)} className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200 disabled:cursor-not-allowed disabled:opacity-40">Trả</button> : <span className="text-xs text-slate-500">-</span>}</td></tr>
            })}</tbody>
          </table>
          {!grouped.length ? <CockpitEmptyState title="Chưa có vật tư công trình" description="Các giao dịch Inventory có projectId sẽ hiển thị tại đây." /> : null}
        </CockpitTableShell>
      </section>
      <div className="space-y-1">
        <CockpitChartCard title="Top vật tư sử dụng" heightClass="h-[170px]" chartHeightClass="h-[98px]"><StatusMiniBars rows={grouped.slice(0, 5).map((row) => [row.code, row.issued])} /></CockpitChartCard>
        <CockpitChartCard title="Giá trị vật tư" heightClass="h-[170px]" chartHeightClass="h-[98px]"><StatusMiniBars rows={grouped.slice(0, 5).map((row) => [row.code, row.value])} /></CockpitChartCard>
      </div>
    </div>
  )
}

function ProjectDetailComponents({ rows, onReturn }: { rows: ProjectComponentRuntime[]; onReturn: (row: ProjectComponentRuntime) => void }) {
  return (
    <div className="grid grid-cols-1 gap-1 xl:grid-cols-[2fr_1fr]">
      <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3">
        <div className="mb-1 flex items-center justify-between"><h3 className="text-sm font-semibold">Cấu kiện công trình</h3><button type="button" onClick={() => rows[0] ? onReturn(rows[0]) : toast('Chưa có cấu kiện để trả')} className={mutedButton}>Trả cấu kiện</button></div>
        <CockpitTableShell className="h-[420px]">
          <table className="w-full min-w-[950px] table-fixed text-sm">
            <thead className={tableHead}><tr>{['Mã cấu kiện', 'Tên cấu kiện', 'Trạng thái', 'Khối lượng', 'Ngày cấp', 'Hạng mục', 'Thao tác'].map((heading) => <th key={heading} className="px-1.5 py-1 text-left font-medium">{heading}</th>)}</tr></thead>
            <tbody>{rows.map((row) => <tr key={row.id} className={tableRow}><td className="truncate px-1.5 py-2 font-mono text-cyan-300">{row.code}</td><td className="truncate px-1.5 py-2 text-white">{row.name}</td><td className="px-1.5 py-2"><ComponentStatusBadge status={row.status} /></td><td className="px-1.5 py-2 text-right font-mono">{formatCurrencyVnd(row.actualCost || row.estimatedCost)}</td><td className="px-1.5 py-2">{date(row.plannedDate)}</td><td className="px-1.5 py-2">{row.installZone ?? '-'}</td><td className="px-1.5 py-2"><button type="button" onClick={() => onReturn(row)} className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">Trả</button></td></tr>)}</tbody>
          </table>
          {!rows.length ? <CockpitEmptyState title="Chưa có cấu kiện công trình" description="Cấu kiện có projectId sẽ hiển thị tại đây." /> : null}
        </CockpitTableShell>
      </section>
      <div className="space-y-1">
        <CockpitChartCard title="Cấu kiện theo trạng thái" heightClass="h-[170px]" chartHeightClass="h-[98px]"><StatusMiniBars rows={componentStatusOptions.filter((item) => item !== 'ALL').map((status) => [status, rows.filter((row) => row.status === status).length])} /></CockpitChartCard>
        <CockpitChartCard title="Cấu kiện theo hạng mục" heightClass="h-[170px]" chartHeightClass="h-[98px]"><StatusMiniBars rows={topComponentZones(rows)} /></CockpitChartCard>
      </div>
    </div>
  )
}

function ProjectDetailProgress({
  project,
  rows,
  health,
  templates,
  saving,
  onCreate,
  onUpdate,
  onMove,
  onDelete,
  onGenerate,
  onBulk,
}: {
  project: ProjectRuntimeRow
  rows: ProjectWbsRuntime[]
  health?: ProjectHealthRuntime
  templates: ProjectTemplate[]
  saving: boolean
  onCreate: (payload: ProjectWbsTaskPayload) => void
  onUpdate: (taskId: string, payload: Partial<ProjectWbsTaskPayload>) => void
  onMove: (taskId: string, parentId?: string | null, sortOrder?: number) => void
  onDelete: (taskId: string) => void
  onGenerate: (payload: GenerateProjectWbsPayload) => void
  onBulk: (payload: BulkProjectWbsPayload) => void
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(rows.map((row) => row.id)))
  const [editing, setEditing] = useState<ProjectWbsRuntime | null>(null)
  const [detail, setDetail] = useState<ProjectWbsRuntime | null>(null)
  const [draftParentId, setDraftParentId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [generatorOpen, setGeneratorOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  useEffect(() => setExpanded(new Set(rows.map((row) => row.id))), [project.id, rows])
  const visibleRows = flattenWbs(rows, expanded)
  const treeOptions = buildTaskTreeOptions(rows)
  const allExpanded = visibleRows.length === rows.length
  const toggle = (id: string) => setExpanded((current) => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
  return (
    <div className="grid grid-cols-1 gap-1 xl:grid-cols-[2fr_1fr]">
      <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-1">
          <h3 className="text-sm font-semibold">Work Breakdown Structure</h3>
          <div className="flex gap-1">
            <button type="button" onClick={() => { setDraftParentId(null); setEditing({ id: '', projectId: project.id, parentId: null, level: 0, type: 'TASK', name: '', owner: '', progress: 0, status: 'PLANNED', materialCount: 0, componentCount: 0, delayDays: 0, cost: 0 }) }} className={mutedButton}>+ Công việc</button>
            <button type="button" onClick={() => { setDraftParentId(detail?.id ?? visibleRows[0]?.id ?? null); setEditing({ id: '', projectId: project.id, parentId: detail?.id ?? visibleRows[0]?.id ?? null, level: 1, type: 'SUBTASK', name: '', owner: '', progress: 0, status: 'PLANNED', materialCount: 0, componentCount: 0, delayDays: 0, cost: 0 }) }} className={mutedButton}>+ Công việc con</button>
            <button type="button" onClick={() => setGeneratorOpen(true)} className={mutedButton}>Auto WBS</button>
            <button type="button" disabled={!selectedIds.size} onClick={() => setBulkOpen(true)} className={mutedButton}>Bulk ({selectedIds.size})</button>
            <button type="button" onClick={() => setExpanded(allExpanded ? new Set() : new Set(rows.map((row) => row.id)))} className={mutedButton}>{allExpanded ? 'Collapse all' : 'Expand all'}</button>
          </div>
        </div>
        <CockpitTableShell className="h-[520px]">
          <table className="w-full min-w-[1320px] table-fixed text-sm">
            <thead className={tableHead}>
              <tr>{['', 'Công việc', 'Người phụ trách', 'Bắt đầu KH', 'Kết thúc KH', 'Bắt đầu TT', 'Kết thúc TT', 'Tiến độ %', 'Trạng thái', 'Số vật tư', 'Số cấu kiện', 'Delay'].map((heading) => <th key={heading} className="px-1.5 py-1 text-left font-medium">{heading}</th>)}</tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const hasChildren = rows.some((item) => item.parentId === row.id)
                return (
                  <tr key={row.id} onClick={() => setDetail(row)} className={`${tableRow} cursor-pointer ${detail?.id === row.id ? 'bg-cyan-400/[0.08]' : ''}`}>
                    <td className="px-1.5 py-2"><input type="checkbox" checked={selectedIds.has(row.id)} onChange={(event) => { event.stopPropagation(); setSelectedIds((current) => { const next = new Set(current); if (next.has(row.id)) next.delete(row.id); else next.add(row.id); return next }) }} onClick={(event) => event.stopPropagation()} /></td>
                    <td className="px-1.5 py-2">
                      <button type="button" onClick={(event) => { event.stopPropagation(); if (hasChildren) toggle(row.id) }} className="flex max-w-full items-center gap-1 text-left" style={{ paddingLeft: `${row.level * 14}px` }}>
                        <span className="w-4 text-slate-500">{hasChildren ? expanded.has(row.id) ? '−' : '+' : '·'}</span>
                        <span className={row.level <= 1 ? 'truncate font-semibold text-white' : 'truncate text-slate-200'}>{row.name}</span>
                      </button>
                    </td>
                    <td className="px-1.5 py-2">{row.owner || '-'}</td>
                    <td className="px-1.5 py-2">{date(row.plannedStartAt)}</td>
                    <td className="px-1.5 py-2">{date(row.plannedFinishAt)}</td>
                    <td className="px-1.5 py-2">{date(row.actualStartAt)}</td>
                    <td className="px-1.5 py-2">{date(row.actualFinishAt)}</td>
                    <td className="px-1.5 py-2"><Progress value={row.progress} /></td>
                    <td className="px-1.5 py-2"><span className="rounded-lg border border-white/10 px-2 py-0.5 text-xs text-slate-300">{row.status}</span></td>
                    <td className="px-1.5 py-2 text-right font-mono">{fmt(row.materialCount, 0)}</td>
                    <td className="px-1.5 py-2 text-right font-mono">{fmt(row.componentCount, 0)}</td>
                    <td className={`px-1.5 py-2 text-right font-mono ${row.delayDays > 0 ? 'text-red-300' : 'text-slate-500'}`}>{row.delayDays > 0 ? `${fmt(row.delayDays, 0)} ngày` : '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {!rows.length ? <CockpitEmptyState title="Chưa có WBS" description="WBS đang được derive từ cấu kiện, vật tư và task hiện có. Cần ProjectTask API để nhập cây công việc thật." /> : null}
        </CockpitTableShell>
      </section>
      <div className="space-y-1">
        {detail ? <TaskCenterPane task={detail} rows={rows} /> : <CockpitChartCard title="Task Detail" heightClass="h-[520px]"><CockpitEmptyState title="Chọn công việc" description="Click một dòng WBS để xem chi tiết tiến độ." /></CockpitChartCard>}
      </div>
      <div className="space-y-1">
        <TaskQuickUpdatePanel task={detail} saving={saving} onUpdate={onUpdate} />
        <TaskActionPanel task={detail} rows={rows} treeOptions={treeOptions} saving={saving} onEdit={setEditing} onMove={onMove} onDelete={onDelete} />
        <CockpitChartCard title="Resource Linking" heightClass="h-[170px]" chartHeightClass="h-[98px]">
          <CockpitStatusList items={[
            { id: 'components', label: 'Cấu kiện liên kết', value: rows.reduce((sum, row) => sum + row.componentCount, 0), statusTone: 'purple' },
            { id: 'materials', label: 'Vật tư liên kết', value: rows.reduce((sum, row) => sum + row.materialCount, 0), statusTone: 'amber' },
            { id: 'progress', label: 'Tiến độ tổng', value: `${fmt(project.progress)}%`, statusTone: 'cyan' },
          ]} />
        </CockpitChartCard>
        <CockpitChartCard title="Trạng thái công việc" heightClass="h-[170px]" chartHeightClass="h-[98px]"><StatusMiniBars rows={rows.reduce<Array<[string, number]>>((acc, item) => addTuple(acc, item.status, 1), [])} /></CockpitChartCard>
        <CockpitChartCard title="Rủi ro tiến độ" heightClass="h-[170px]" chartHeightClass="h-[98px]">
          <CockpitStatusList items={[
            { id: 'blocked', label: 'Blocked', value: health?.blockedTasks ?? 0, statusTone: 'red' },
            { id: 'overdue', label: 'Quá hạn', value: health?.overdueTasks ?? 0, statusTone: 'amber' },
            { id: 'missing-components', label: 'Thiếu cấu kiện', value: health?.missingComponents ?? 0, statusTone: 'purple' },
          ]} />
        </CockpitChartCard>
      </div>
      <TaskEditorDialog
        task={editing}
        parentId={draftParentId}
        candidates={rows}
        treeOptions={treeOptions}
        templates={templates}
        saving={saving}
        onClose={() => { setEditing(null); setDraftParentId(null) }}
        onSubmit={(payload) => {
          if (!editing) return
          if (editing.id) onUpdate(editing.id, payload)
          else onCreate(payload)
          setEditing(null)
          setDraftParentId(null)
        }}
      />
      <AutoWbsDialog open={generatorOpen} saving={saving} onClose={() => setGeneratorOpen(false)} onSubmit={(payload) => { onGenerate(payload); setGeneratorOpen(false) }} />
      <BulkWbsDialog open={bulkOpen} selectedCount={selectedIds.size} treeOptions={treeOptions} saving={saving} onClose={() => setBulkOpen(false)} onSubmit={(payload) => { onBulk({ ...payload, taskIds: Array.from(selectedIds) }); setBulkOpen(false); setSelectedIds(new Set()) }} />
      <TaskDetailDrawer task={detail} rows={rows} onClose={() => setDetail(null)} />
    </div>
  )
}

function TaskActionPanel({ task, rows, treeOptions, saving, onEdit, onMove, onDelete }: { task: ProjectWbsRuntime | null; rows: ProjectWbsRuntime[]; treeOptions: Array<{ id: string; label: string }>; saving: boolean; onEdit: (task: ProjectWbsRuntime) => void; onMove: (taskId: string, parentId?: string | null, sortOrder?: number) => void; onDelete: (taskId: string) => void }) {
  const blockedIds = task ? new Set([task.id, ...descendantIds(rows, task.id)]) : new Set<string>()
  return (
    <CockpitChartCard title="Task Actions" heightClass="h-[170px]" chartHeightClass="h-[98px]">
      {!task ? <CockpitEmptyState title="Chọn công việc" description="Click một dòng WBS để sửa, xóa hoặc di chuyển." /> : (
        <div className="grid grid-cols-2 gap-1">
          <button type="button" disabled={saving} onClick={() => onEdit(task)} className={mutedButton}>Edit</button>
          <button type="button" disabled={saving} onClick={() => onDelete(task.id)} className={mutedButton}>Delete</button>
          <button type="button" disabled={saving} onClick={() => onMove(task.id, task.parentId, Date.now() - 1_000)} className={mutedButton}>Move Up</button>
          <button type="button" disabled={saving} onClick={() => onMove(task.id, task.parentId, Date.now() + 1_000)} className={mutedButton}>Move Down</button>
          <select disabled={saving} value={task.parentId ?? ''} onChange={(event) => onMove(task.id, event.target.value || null, task.sortOrder)} className={`${input} col-span-2`}>
            <option value="">Không có parent</option>
            {treeOptions.filter((row) => !blockedIds.has(row.id)).map((row) => <option key={row.id} value={row.id}>{row.label}</option>)}
          </select>
        </div>
      )}
    </CockpitChartCard>
  )
}

function AutoWbsDialog({ open, saving, onClose, onSubmit }: { open: boolean; saving: boolean; onClose: () => void; onSubmit: (payload: GenerateProjectWbsPayload) => void }) {
  const [rootName, setRootName] = useState('Lắp dựng')
  const [spans, setSpans] = useState('5')
  const [axes, setAxes] = useState('10')
  const [floors, setFloors] = useState('1')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [taskDurationDays, setTaskDurationDays] = useState('1')
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <section className="w-[min(680px,92vw)] overflow-hidden rounded-2xl border border-cyan-900 bg-[#061321] text-slate-100 shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-800 px-5 py-4"><div><p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400">Auto WBS</p><h2 className="mt-1 text-xl font-semibold">Sinh WBS lắp dựng</h2></div><button type="button" onClick={onClose} className="rounded border border-slate-700 p-2 text-slate-300"><X size={16} /></button></header>
        <div className="grid gap-1 p-5 md:grid-cols-2">
          <Field label="Root"><input value={rootName} onChange={(event) => setRootName(event.target.value)} className={`${input} w-full`} /></Field>
          <Field label="Ngày bắt đầu"><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={`${input} w-full`} /></Field>
          <Field label="Số nhịp"><input value={spans} onChange={(event) => setSpans(event.target.value)} inputMode="numeric" className={`${input} w-full`} /></Field>
          <Field label="Số trục"><input value={axes} onChange={(event) => setAxes(event.target.value)} inputMode="numeric" className={`${input} w-full`} /></Field>
          <Field label="Số tầng"><input value={floors} onChange={(event) => setFloors(event.target.value)} inputMode="numeric" className={`${input} w-full`} /></Field>
          <Field label="Thời lượng/trục"><input value={taskDurationDays} onChange={(event) => setTaskDurationDays(event.target.value)} inputMode="numeric" className={`${input} w-full`} /></Field>
          <p className="rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-3 text-xs text-slate-300 md:col-span-2">Hệ thống sẽ tạo cây Root → Nhịp → Tầng (nếu có) → Trục bằng ProjectTask thật. Không tạo dữ liệu giả.</p>
        </div>
        <footer className="flex justify-end gap-2 border-t border-slate-800 px-5 py-4"><button type="button" onClick={onClose} className={mutedButton}>Hủy</button><button type="button" disabled={saving || !rootName.trim()} onClick={() => onSubmit({ rootName, spans: Math.max(1, Math.round(parseLocaleNumber(spans) || 1)), axes: Math.max(1, Math.round(parseLocaleNumber(axes) || 1)), floors: Math.max(1, Math.round(parseLocaleNumber(floors) || 1)), startDate: startDate || null, taskDurationDays: Math.max(1, Math.round(parseLocaleNumber(taskDurationDays) || 1)) })} className={primaryButton}>{saving ? 'Đang sinh...' : 'Sinh WBS'}</button></footer>
      </section>
    </div>
  )
}

function BulkWbsDialog({ open, selectedCount, treeOptions, saving, onClose, onSubmit }: { open: boolean; selectedCount: number; treeOptions: Array<{ id: string; label: string }>; saving: boolean; onClose: () => void; onSubmit: (payload: Omit<BulkProjectWbsPayload, 'taskIds'>) => void }) {
  const [parentId, setParentId] = useState('')
  const [owner, setOwner] = useState('')
  const [status, setStatus] = useState('')
  const [plannedStartAt, setPlannedStartAt] = useState('')
  const [plannedFinishAt, setPlannedFinishAt] = useState('')
  const [resourceName, setResourceName] = useState('')
  const [resourceType, setResourceType] = useState<'WORKER' | 'MACHINE' | 'OTHER'>('WORKER')
  const [resourceQty, setResourceQty] = useState('1')
  const [checklist, setChecklist] = useState('')
  if (!open) return null
  const resources = resourceName.trim() ? [{ type: resourceType, name: resourceName.trim(), quantity: Math.max(1, parseLocaleNumber(resourceQty) || 1) }] : undefined
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <section className="w-[min(760px,92vw)] overflow-hidden rounded-2xl border border-cyan-900 bg-[#061321] text-slate-100 shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-800 px-5 py-4"><div><p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400">Bulk Operations</p><h2 className="mt-1 text-xl font-semibold">Cập nhật {selectedCount} công việc</h2></div><button type="button" onClick={onClose} className="rounded border border-slate-700 p-2 text-slate-300"><X size={16} /></button></header>
        <div className="grid gap-1 p-5 md:grid-cols-2">
          <Field label="Change Parent"><select value={parentId} onChange={(event) => setParentId(event.target.value)} className={`${input} w-full`}><option value="">Không đổi</option><option value="__root">Không có parent</option>{treeOptions.map((row) => <option key={row.id} value={row.id}>{row.label}</option>)}</select></Field>
          <Field label="Gán kỹ sư / phụ trách"><input value={owner} onChange={(event) => setOwner(event.target.value)} className={`${input} w-full`} /></Field>
          <Field label="Đổi trạng thái"><select value={status} onChange={(event) => setStatus(event.target.value)} className={`${input} w-full`}><option value="">Không đổi</option>{['DRAFT','PLANNED','READY','IN_PROGRESS','BLOCKED','PAUSED','COMPLETED','CANCELLED'].map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>
          <Field label="Checklist"><input value={checklist} onChange={(event) => setChecklist(event.target.value)} placeholder="QC, Nghiệm thu" className={`${input} w-full`} /></Field>
          <Field label="Ngày bắt đầu"><input type="date" value={plannedStartAt} onChange={(event) => setPlannedStartAt(event.target.value)} className={`${input} w-full`} /></Field>
          <Field label="Ngày kết thúc"><input type="date" value={plannedFinishAt} onChange={(event) => setPlannedFinishAt(event.target.value)} className={`${input} w-full`} /></Field>
          <Field label="Resource"><div className="grid grid-cols-[1fr_110px_80px] gap-1"><input value={resourceName} onChange={(event) => setResourceName(event.target.value)} placeholder="Cẩu 25T / Kỹ sư" className={`${input} w-full`} /><select value={resourceType} onChange={(event) => setResourceType(event.target.value as 'WORKER' | 'MACHINE' | 'OTHER')} className={`${input} w-full`}><option value="WORKER">Worker</option><option value="MACHINE">Machine</option><option value="OTHER">Other</option></select><input value={resourceQty} onChange={(event) => setResourceQty(event.target.value)} inputMode="numeric" className={`${input} w-full`} /></div></Field>
        </div>
        <footer className="flex justify-end gap-2 border-t border-slate-800 px-5 py-4"><button type="button" onClick={onClose} className={mutedButton}>Hủy</button><button type="button" disabled={saving || !selectedCount} onClick={() => onSubmit({ parentId: parentId === '__root' ? null : parentId || undefined, owner: owner.trim() || undefined, status: status as ProjectTaskStatus || undefined, plannedStartAt: plannedStartAt || undefined, plannedFinishAt: plannedFinishAt || undefined, resources, checklist: checklist.split(',').map((item) => item.trim()).filter(Boolean) })} className={primaryButton}>{saving ? 'Đang cập nhật...' : 'Áp dụng'}</button></footer>
      </section>
    </div>
  )
}

function TaskQuickUpdatePanel({ task, saving, onUpdate }: { task: ProjectWbsRuntime | null; saving: boolean; onUpdate: (taskId: string, payload: Partial<ProjectWbsTaskPayload>) => void }) {
  const [installed, setInstalled] = useState('')
  const [usedMaterial, setUsedMaterial] = useState('')
  const [qcPassed, setQcPassed] = useState(false)
  const [hasIssue, setHasIssue] = useState(false)
  const [note, setNote] = useState('')

  useEffect(() => {
    setInstalled('')
    setUsedMaterial('')
    setQcPassed(false)
    setHasIssue(false)
    setNote('')
  }, [task?.id])

  if (!task) {
    return (
      <CockpitChartCard title="Quick Update" heightClass="h-[260px]">
        <CockpitEmptyState title="Chọn công việc" description="Người dùng công trường chỉ cần chọn task rồi cập nhật việc hôm nay." />
      </CockpitChartCard>
    )
  }

  const installedQty = parseLocaleNumber(installed)
  const usedQty = parseLocaleNumber(usedMaterial)
  const suggestedComponents = (task.components ?? []).slice(0, 4)
  const suggestedMaterials = (task.materials ?? []).slice(0, 4)
  const returnable = (task.materials ?? []).reduce((sum, item) => sum + Math.max(0, Number(item.issued ?? 0) - Number(item.used ?? 0) - Number(item.returned ?? 0)), 0)
  const suggestedProgress = Math.min(
    100,
    Math.max(
      task.progress,
      task.progress + (installedQty > 0 ? 12 : 0) + (usedQty > 0 ? 8 : 0) + (qcPassed ? 10 : 0) - (hasIssue ? 5 : 0),
    ),
  )

  const submit = () => {
    onUpdate(task.id, {
      progress: suggestedProgress,
      status: hasIssue ? 'BLOCKED' : suggestedProgress >= 100 ? 'COMPLETED' : suggestedProgress > 0 ? 'IN_PROGRESS' : (task.status as ProjectTaskStatus),
      actualStartAt: task.actualStartAt ?? new Date().toISOString(),
      actualFinishAt: suggestedProgress >= 100 ? new Date().toISOString() : task.actualFinishAt,
      inspectionStatus: qcPassed ? 'INSPECTION_PASSED' : task.inspectionStatus ?? null,
      description: [task.description ?? '', note.trim() ? `Cập nhật hiện trường: ${note.trim()}` : ''].filter(Boolean).join('\n'),
      materials: (task.materials ?? []).map((item, index) => index === 0 && usedQty > 0 ? {
        ...item,
        used: Number(item.used ?? 0) + usedQty,
        remaining: Math.max(0, Number(item.remaining ?? item.planned ?? 0) - usedQty),
      } : item),
      components: (task.components ?? []).map((item, index) => index < installedQty ? {
        ...item,
        installed: 1,
        status: 'INSTALLING',
      } : item),
      workers: task.workers,
      machines: task.machines,
      predecessors: task.predecessors,
      successors: task.successors,
      revenue: task.revenue,
      laborCost: task.laborCost,
      machineCost: task.machineCost,
      otherCost: task.otherCost,
    })
  }

  return (
    <CockpitChartCard title="Quick Update" heightClass="h-[360px]">
      <div className="space-y-2 text-xs">
        <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-2">
          <div className="text-slate-400">Hệ thống tự tính</div>
          <div className="mt-1 text-lg font-semibold text-white">{fmt(task.progress)}% → {fmt(suggestedProgress)}%</div>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <Field label="✓ Lắp cấu kiện"><input value={installed} onChange={(event) => setInstalled(event.target.value)} inputMode="decimal" placeholder="5" className={`${input} w-full`} /></Field>
          <Field label="✓ Dùng vật tư"><input value={usedMaterial} onChange={(event) => setUsedMaterial(event.target.value)} inputMode="decimal" placeholder="100" className={`${input} w-full`} /></Field>
        </div>
        <label className="flex items-center gap-2 text-slate-300"><input type="checkbox" checked={qcPassed} onChange={(event) => setQcPassed(event.target.checked)} /> QC đạt</label>
        <label className="flex items-center gap-2 text-slate-300"><input type="checkbox" checked={hasIssue} onChange={(event) => setHasIssue(event.target.checked)} /> Có sự cố</label>
        <Field label="Ghi chú"><textarea value={note} onChange={(event) => setNote(event.target.value)} className={`${input} h-16 w-full py-2`} /></Field>
        <div className="grid grid-cols-2 gap-1">
          <div className="rounded-xl border border-white/10 p-2">
            <div className="mb-1 text-slate-400">Gợi ý cấu kiện</div>
            {suggestedComponents.length ? suggestedComponents.map((item) => <label key={item.id} className="block truncate text-slate-300"><input type="checkbox" className="mr-1" />{item.code ?? item.name ?? item.id}</label>) : <span className="text-slate-500">Chưa có</span>}
          </div>
          <div className="rounded-xl border border-white/10 p-2">
            <div className="mb-1 text-slate-400">Gợi ý vật tư</div>
            {suggestedMaterials.length ? suggestedMaterials.map((item) => <label key={item.id} className="block truncate text-slate-300"><input type="checkbox" className="mr-1" />{item.code ?? item.name ?? item.id}</label>) : <span className="text-slate-500">Chưa có</span>}
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-amber-400/20 bg-amber-400/5 px-3 py-2">
          <span className="text-amber-100">Có thể trả: {fmt(returnable)}</span>
          <button type="button" onClick={() => toast('Smart Return sẽ nối workflow trả vật tư theo task ở sprint workflow tiếp theo.')} className="rounded-lg border border-amber-500/30 px-2 py-1 text-[11px] text-amber-200">Trả toàn bộ</button>
        </div>
        <button type="button" disabled={saving} onClick={submit} className={`${primaryButton} w-full`}>{saving ? 'Đang cập nhật...' : 'Cập nhật'}</button>
      </div>
    </CockpitChartCard>
  )
}

function TaskCenterPane({ task, rows }: { task: ProjectWbsRuntime; rows: ProjectWbsRuntime[] }) {
  const predecessors = task.predecessors?.map((dependency) => rows.find((row) => row.id === dependency.taskId)).filter(Boolean) as ProjectWbsRuntime[] | undefined
  const successors = rows.filter((row) => row.predecessors?.some((dependency) => dependency.taskId === task.id))
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-1 gap-1 md:grid-cols-3">
        <CockpitKpiCard title="Baseline variance" value={`${fmt(task.baselineVarianceDays ?? 0, 0)} ngày`} note={`${date(task.baselineFinishAt)} → ${date(task.scheduledFinishAt ?? task.plannedFinishAt)}`} tone={(task.baselineVarianceDays ?? 0) > 0 ? 'red' : 'emerald'} />
        <CockpitKpiCard title="Cascade delay" value={`${fmt(task.cascadeDelayDays ?? 0, 0)} ngày`} note="Dependency impact" tone={(task.cascadeDelayDays ?? 0) > 0 ? 'amber' : 'emerald'} />
        <CockpitKpiCard title="Inspection" value={inspectionLabel(task.inspectionStatus)} note="Acceptance" tone={task.inspectionStatus === 'INSPECTION_FAILED' ? 'red' : task.inspectionStatus ? 'cyan' : 'amber'} />
      </div>
      <CockpitChartCard title="Task Detail" heightClass="h-[260px]">
        <div className="grid gap-1 text-xs">
          <Info k="Tên" v={task.name} />
          <Info k="Baseline" v={`${date(task.baselineStartAt)} → ${date(task.baselineFinishAt)}`} />
          <Info k="Current Schedule" v={`${date(task.scheduledStartAt ?? task.plannedStartAt)} → ${date(task.scheduledFinishAt ?? task.plannedFinishAt)}`} />
          <Info k="Actual" v={`${date(task.actualStartAt)} → ${date(task.actualFinishAt)}`} />
          <Info k="Progress" v={`${fmt(task.progress)}%`} />
          <Info k="Status" v={task.status} />
        </div>
      </CockpitChartCard>
      <CockpitChartCard title="Dependency" heightClass="h-[170px]" chartHeightClass="h-[98px]">
        <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
          <CockpitStatusList items={(predecessors ?? []).map((row) => ({ id: row.id, label: row.name, value: `${fmt(row.cascadeDelayDays ?? row.delayDays, 0)} ngày`, statusTone: (row.cascadeDelayDays ?? row.delayDays) > 0 ? 'red' : 'cyan' }))} emptyMessage="Không có predecessor." />
          <CockpitStatusList items={successors.map((row) => ({ id: row.id, label: row.name, value: `${fmt(row.cascadeDelayDays ?? row.delayDays, 0)} ngày`, statusTone: (row.cascadeDelayDays ?? row.delayDays) > 0 ? 'red' : 'cyan' }))} emptyMessage="Không có successor." />
        </div>
      </CockpitChartCard>
      <TaskResources task={task} />
    </div>
  )
}

function TaskEditorDialog({ task, parentId, candidates, treeOptions, templates, saving, onClose, onSubmit }: { task: ProjectWbsRuntime | null; parentId: string | null; candidates: ProjectWbsRuntime[]; treeOptions: Array<{ id: string; label: string }>; templates: ProjectTemplate[]; saving: boolean; onClose: () => void; onSubmit: (payload: ProjectWbsTaskPayload) => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [owner, setOwner] = useState('')
  const [status, setStatus] = useState<ProjectTaskStatus>('PLANNED')
  const [progress, setProgress] = useState('0')
  const [plannedStartAt, setPlannedStartAt] = useState('')
  const [plannedFinishAt, setPlannedFinishAt] = useState('')
  const [baselineStartAt, setBaselineStartAt] = useState('')
  const [baselineFinishAt, setBaselineFinishAt] = useState('')
  const [actualStartAt, setActualStartAt] = useState('')
  const [actualFinishAt, setActualFinishAt] = useState('')
  const [selectedParent, setSelectedParent] = useState<string | null>(parentId)
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple')
  const [durationDays, setDurationDays] = useState('1')
  const [revenue, setRevenue] = useState('0')
  const [laborCost, setLaborCost] = useState('0')
  const [machineCost, setMachineCost] = useState('0')
  const [otherCost, setOtherCost] = useState('0')
  const [predecessorId, setPredecessorId] = useState('')
  const [dependencyType, setDependencyType] = useState<'FS' | 'SS' | 'FF'>('FS')
  const [materialsText, setMaterialsText] = useState('')
  const [componentsText, setComponentsText] = useState('')
  const [workersText, setWorkersText] = useState('')
  const [machinesText, setMachinesText] = useState('')
  const [inspectionStatus, setInspectionStatus] = useState<ProjectTaskInspectionStatus | ''>('')

  useEffect(() => {
    setName(task?.name ?? '')
    setDescription(task?.description ?? '')
    setOwner(task?.owner === '-' ? '' : task?.owner ?? '')
    setStatus((task?.status as ProjectTaskStatus) ?? 'PLANNED')
    setProgress(String(task?.progress ?? 0))
    setPlannedStartAt(toDateInput(task?.plannedStartAt))
    setPlannedFinishAt(toDateInput(task?.plannedFinishAt))
    setBaselineStartAt(toDateInput(task?.baselineStartAt ?? task?.plannedStartAt))
    setBaselineFinishAt(toDateInput(task?.baselineFinishAt ?? task?.plannedFinishAt))
    setActualStartAt(toDateInput(task?.actualStartAt))
    setActualFinishAt(toDateInput(task?.actualFinishAt))
    setSelectedParent(task?.parentId ?? parentId)
    setMode(task?.id ? 'advanced' : 'simple')
    setDurationDays(String(taskDurationDays(task) || 1))
    setRevenue(String(task?.revenue ?? 0))
    setLaborCost(String(task?.laborCost ?? 0))
    setMachineCost(String(task?.machineCost ?? 0))
    setOtherCost(String(task?.otherCost ?? 0))
    setPredecessorId(task?.predecessors?.[0]?.taskId ?? '')
    setDependencyType(task?.predecessors?.[0]?.type ?? 'FS')
    setMaterialsText((task?.materials ?? []).map((row) => [row.code ?? row.id, row.name ?? '', row.planned ?? 0, row.issued ?? 0, row.used ?? 0, row.returned ?? 0, row.remaining ?? 0, row.cost ?? 0].join('|')).join('\n'))
    setComponentsText((task?.components ?? []).map((row) => [row.code ?? row.id, row.name ?? '', row.assigned ?? 0, row.installed ?? 0, row.returned ?? 0, row.status ?? '', row.cost ?? 0].join('|')).join('\n'))
    setWorkersText((task?.workers ?? []).map((row) => [row.role, row.required ?? 0, row.allocated ?? 0].join('|')).join('\n'))
    setMachinesText((task?.machines ?? []).map((row) => [row.type, row.required ?? 0, row.allocated ?? 0].join('|')).join('\n'))
    setInspectionStatus(task?.inspectionStatus ?? '')
  }, [parentId, task])

  const templateRules = useMemo(() => buildTemplateRules(templates), [templates])
  const matchedRule = findTemplateRule(name, templateRules)

  if (!task) return null
  const blockedParentIds = new Set([task.id, ...descendantIds(candidates, task.id)])
  const parentOptions = treeOptions.filter((row) => !blockedParentIds.has(row.id))
  const applySmartDates = () => {
    const parent = candidates.find((row) => row.id === selectedParent)
    const start = parent?.plannedFinishAt ? addDays(toDateInput(parent.plannedFinishAt), 1) : plannedStartAt || new Date().toISOString().slice(0, 10)
    const duration = Math.max(1, Math.round(parseLocaleNumber(durationDays) || 1))
    const finish = addDays(start, duration - 1)
    setPlannedStartAt(start)
    setPlannedFinishAt(finish)
    setBaselineStartAt(start)
    setBaselineFinishAt(finish)
  }
  const applyErectionSuggestion = () => {
    const rule = matchedRule ?? templateRules.find((item) => normalizeText(item.taskType).includes('lap dung'))
    if (!rule) {
      toast('Template hiện chưa có rule phù hợp cho task này.')
      return
    }
    setName((current) => current.trim() || rule.taskType)
    setDurationDays(String(rule.defaultDuration ?? 1))
    setMaterialsText(rule.suggestedMaterials.map((name) => `${name}|${name}|0|0|0|0|0|0`).join('\n'))
    setComponentsText(rule.suggestedComponents.map((name) => `${name}|${name}|1|0|0|ASSIGNED|0`).join('\n'))
    setWorkersText(rule.suggestedResources.filter((item) => item.type === 'WORKER').map((item) => `${item.name}|${item.quantity ?? 1}|0`).join('\n'))
    setMachinesText([
      ...rule.suggestedResources.filter((item) => item.type === 'MACHINE').map((item) => `${item.name}|${item.quantity ?? 1}|0`),
      ...rule.suggestedMachines.map((name) => `${name}|1|0`),
    ].join('\n'))
    setInspectionStatus(rule.suggestedChecklist.some((item) => normalizeText(item).includes('qc') || normalizeText(item).includes('nghiem thu')) ? 'PENDING_INSPECTION' : '')
    applySmartDates()
  }
  const submit = () => {
    if (!name.trim()) return
    onSubmit({
      name: name.trim(),
      description,
      owner,
      parentId: selectedParent || null,
      status: mode === 'simple' ? 'PLANNED' : status,
      progress: mode === 'simple' ? 0 : parseLocaleNumber(progress),
      plannedStartAt: plannedStartAt || null,
      plannedFinishAt: plannedFinishAt || null,
      baselineStartAt: baselineStartAt || null,
      baselineFinishAt: baselineFinishAt || null,
      actualStartAt: mode === 'simple' ? null : actualStartAt || null,
      actualFinishAt: mode === 'simple' ? null : actualFinishAt || null,
      sortOrder: task.sortOrder ?? Date.now(),
      materials: parseMaterialLinks(materialsText),
      components: parseComponentLinks(componentsText),
      predecessors: predecessorId ? [{ taskId: predecessorId, type: dependencyType }] : [],
      successors: [],
      revenue: mode === 'simple' ? 0 : parseLocaleNumber(revenue),
      laborCost: mode === 'simple' ? 0 : parseLocaleNumber(laborCost),
      machineCost: mode === 'simple' ? 0 : parseLocaleNumber(machineCost),
      otherCost: mode === 'simple' ? 0 : parseLocaleNumber(otherCost),
      workers: parseWorkerLinks(workersText),
      machines: parseMachineLinks(machinesText),
      inspectionStatus: inspectionStatus || null,
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <section className="w-[min(940px,94vw)] overflow-hidden rounded-xl border border-cyan-900 bg-[#061321] text-slate-100 shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-800 px-5 py-4">
          <div><p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400">WBS Task</p><h2 className="mt-1 text-xl font-semibold">{task.id ? 'Sửa công việc' : 'Thêm công việc'}</h2></div>
          <button type="button" onClick={onClose} className="rounded border border-slate-700 p-2 text-slate-300"><X size={16} /></button>
        </header>
        <div className="grid gap-1 p-5 md:grid-cols-2">
          <div className="flex rounded-xl border border-cyan-300/15 bg-slate-950/55 p-1 md:col-span-2">
            {(['simple', 'advanced'] as const).map((item) => <button key={item} type="button" onClick={() => setMode(item)} className={`flex-1 rounded-lg px-3 py-2 text-xs ${mode === item ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/[0.06]'}`}>{item === 'simple' ? 'Simple Mode' : 'Advanced Mode'}</button>)}
          </div>
          <Field label="Tên"><input value={name} onChange={(event) => setName(event.target.value)} className={`${input} w-full`} /></Field>
          <Field label="Công việc cha"><select value={selectedParent ?? ''} onChange={(event) => setSelectedParent(event.target.value || null)} className={`${input} w-full`}><option value="">Không có (Root)</option>{parentOptions.map((row) => <option key={row.id} value={row.id}>{row.label}</option>)}</select></Field>
          {mode === 'simple' ? (
            <>
              <Field label="Thời lượng (ngày)"><input value={durationDays} onChange={(event) => setDurationDays(event.target.value)} inputMode="numeric" className={`${input} w-full`} /></Field>
              <Field label="Ngày gợi ý"><div className="grid grid-cols-2 gap-1"><input type="date" value={plannedStartAt} onChange={(event) => setPlannedStartAt(event.target.value)} className={`${input} w-full`} /><input type="date" value={plannedFinishAt} onChange={(event) => setPlannedFinishAt(event.target.value)} className={`${input} w-full`} /></div></Field>
              <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-3 text-xs md:col-span-2">
                <div className="font-medium text-white">Smart Suggestions</div>
                <div className="mt-1 text-slate-400">Simple Mode tự lưu status/progress/delay/forecast ở trạng thái ban đầu. Người dùng chỉ cần nhập tên, parent và thời lượng.</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  <button type="button" onClick={applySmartDates} className={mutedButton}>Gợi ý ngày</button>
                  <button type="button" onClick={applyErectionSuggestion} className={mutedButton}>Tự đề xuất</button>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-1 md:grid-cols-4">
                  <div className="rounded-lg border border-white/10 p-2"><b>Vật tư</b><p className="mt-1 text-slate-400">{matchedRule?.suggestedMaterials.join(', ') || 'Theo template'}</p></div>
                  <div className="rounded-lg border border-white/10 p-2"><b>Cấu kiện</b><p className="mt-1 text-slate-400">{matchedRule?.suggestedComponents.join(', ') || 'Theo template'}</p></div>
                  <div className="rounded-lg border border-white/10 p-2"><b>Nhân lực</b><p className="mt-1 text-slate-400">{matchedRule?.suggestedResources.filter((item) => item.type === 'WORKER').map((item) => `${item.quantity ?? 1} ${item.name}`).join(', ') || 'Theo template'}</p></div>
                  <div className="rounded-lg border border-white/10 p-2"><b>Thiết bị</b><p className="mt-1 text-slate-400">{[...(matchedRule?.suggestedResources.filter((item) => item.type === 'MACHINE').map((item) => `${item.quantity ?? 1} ${item.name}`) ?? []), ...(matchedRule?.suggestedMachines ?? [])].join(', ') || 'Theo template'}</p></div>
                </div>
              </div>
            </>
          ) : (
            <>
              <Field label="Người phụ trách"><input value={owner} onChange={(event) => setOwner(event.target.value)} className={`${input} w-full`} /></Field>
              <Field label="Trạng thái"><select value={status} onChange={(event) => setStatus(event.target.value as ProjectTaskStatus)} className={`${input} w-full`}>{['DRAFT','PLANNED','READY','IN_PROGRESS','BLOCKED','PAUSED','COMPLETED','CANCELLED'].map((item) => <option key={item} value={item}>{item}</option>)}</select></Field>
              <Field label="Planned Start"><input type="date" value={plannedStartAt} onChange={(event) => setPlannedStartAt(event.target.value)} className={`${input} w-full`} /></Field>
              <Field label="Planned Finish"><input type="date" value={plannedFinishAt} onChange={(event) => setPlannedFinishAt(event.target.value)} className={`${input} w-full`} /></Field>
              <Field label="Baseline Start"><input type="date" value={baselineStartAt} onChange={(event) => setBaselineStartAt(event.target.value)} className={`${input} w-full`} /></Field>
              <Field label="Baseline Finish"><input type="date" value={baselineFinishAt} onChange={(event) => setBaselineFinishAt(event.target.value)} className={`${input} w-full`} /></Field>
              <Field label="Actual Start"><input type="date" value={actualStartAt} onChange={(event) => setActualStartAt(event.target.value)} className={`${input} w-full`} /></Field>
              <Field label="Actual Finish"><input type="date" value={actualFinishAt} onChange={(event) => setActualFinishAt(event.target.value)} className={`${input} w-full`} /></Field>
              <Field label="Progress %"><input value={progress} onChange={(event) => setProgress(event.target.value)} inputMode="decimal" className={`${input} w-full`} /></Field>
              <Field label="Predecessor"><select value={predecessorId} onChange={(event) => setPredecessorId(event.target.value)} className={`${input} w-full`}><option value="">Không có</option>{treeOptions.filter((row) => row.id !== task.id).map((row) => <option key={row.id} value={row.id}>{row.label}</option>)}</select></Field>
              <Field label="Dependency type"><select value={dependencyType} onChange={(event) => setDependencyType(event.target.value as 'FS' | 'SS' | 'FF')} className={`${input} w-full`}><option value="FS">Finish-To-Start</option><option value="SS">Start-To-Start</option><option value="FF">Finish-To-Finish</option></select></Field>
              <Field label="Inspection / Acceptance"><select value={inspectionStatus} onChange={(event) => setInspectionStatus(event.target.value as ProjectTaskInspectionStatus | '')} className={`${input} w-full`}><option value="">Chưa yêu cầu</option><option value="PENDING_INSPECTION">Pending Inspection</option><option value="INSPECTION_FAILED">Inspection Failed</option><option value="INSPECTION_PASSED">Inspection Passed</option><option value="ACCEPTED">Accepted</option><option value="HANDED_OVER">Handed Over</option></select></Field>
              <Field label="Doanh thu"><input value={revenue} onChange={(event) => setRevenue(event.target.value)} inputMode="decimal" className={`${input} w-full`} /></Field>
              <Field label="Chi phí nhân công"><input value={laborCost} onChange={(event) => setLaborCost(event.target.value)} inputMode="decimal" className={`${input} w-full`} /></Field>
              <Field label="Chi phí máy"><input value={machineCost} onChange={(event) => setMachineCost(event.target.value)} inputMode="decimal" className={`${input} w-full`} /></Field>
              <Field label="Chi phí khác"><input value={otherCost} onChange={(event) => setOtherCost(event.target.value)} inputMode="decimal" className={`${input} w-full`} /></Field>
            </>
          )}
          <label className="text-xs text-slate-400 md:col-span-2">Vật tư liên kết <span className="text-slate-500">code|name|planned|issued|used|returned|remaining|cost</span><textarea value={materialsText} onChange={(event) => setMaterialsText(event.target.value)} className={`${input} mt-1 min-h-20 w-full py-2`} /></label>
          <label className="text-xs text-slate-400 md:col-span-2">Cấu kiện liên kết <span className="text-slate-500">code|name|assigned|installed|returned|status|cost</span><textarea value={componentsText} onChange={(event) => setComponentsText(event.target.value)} className={`${input} mt-1 min-h-20 w-full py-2`} /></label>
          {mode === 'advanced' ? (
            <>
              <label className="text-xs text-slate-400 md:col-span-2">Nhân công <span className="text-slate-500">role|required|allocated</span><textarea value={workersText} onChange={(event) => setWorkersText(event.target.value)} className={`${input} mt-1 min-h-20 w-full py-2`} /></label>
              <label className="text-xs text-slate-400 md:col-span-2">Thiết bị <span className="text-slate-500">type|required|allocated</span><textarea value={machinesText} onChange={(event) => setMachinesText(event.target.value)} className={`${input} mt-1 min-h-20 w-full py-2`} /></label>
            </>
          ) : null}
          <label className="text-xs text-slate-400 md:col-span-2">Mô tả<textarea value={description} onChange={(event) => setDescription(event.target.value)} className={`${input} mt-1 min-h-20 w-full py-2`} /></label>
        </div>
        <footer className="flex justify-end gap-2 border-t border-slate-800 px-5 py-4"><button type="button" onClick={onClose} className={mutedButton}>Hủy</button><button type="button" disabled={saving || !name.trim()} onClick={submit} className={primaryButton}>{saving ? 'Đang lưu...' : 'Lưu công việc'}</button></footer>
      </section>
    </div>
  )
}

function TaskDetailDrawer({ task, rows, onClose }: { task: ProjectWbsRuntime | null; rows: ProjectWbsRuntime[]; onClose: () => void }) {
  const predecessorRows = task?.predecessors?.map((dependency) => rows.find((row) => row.id === dependency.taskId)).filter(Boolean) as ProjectWbsRuntime[] | undefined
  const successorRows = rows.filter((row) => row.predecessors?.some((dependency) => dependency.taskId === task?.id))
  return (
    <ModuleDetailDrawer open={Boolean(task)} title={task?.name ?? ''} subtitle={task ? `${task.status} · Delay ${task.delayDays} ngày` : undefined} onClose={onClose} widthClass="w-[min(860px,94vw)]">
      {task ? (
        <div className="space-y-1 p-3">
          <div className="grid grid-cols-1 gap-1 md:grid-cols-3">
            <CockpitKpiCard title="Progress" value={`${fmt(task.progress)}%`} note={task.status} tone="cyan" />
            <CockpitKpiCard title="Delay" value={`${fmt(task.delayDays, 0)} ngày`} note="Planned vs Actual" tone={task.delayDays > 0 ? 'red' : 'emerald'} />
            <CockpitKpiCard title="Resources" value={fmt((task.materials?.length ?? 0) + (task.components?.length ?? 0), 0)} note="Materials + components" tone="purple" />
          </div>
          <CockpitChartCard title="General" heightClass="h-[220px]">
            <div className="grid gap-1 text-xs">
              <Info k="Tên" v={task.name} />
              <Info k="Mô tả" v={task.description ?? '-'} />
              <Info k="Người phụ trách" v={task.owner || '-'} />
              <Info k="Planned Start" v={date(task.plannedStartAt)} />
              <Info k="Planned Finish" v={date(task.plannedFinishAt)} />
              <Info k="Actual Start" v={date(task.actualStartAt)} />
              <Info k="Actual Finish" v={date(task.actualFinishAt)} />
            </div>
          </CockpitChartCard>
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-3">
            <CockpitKpiCard title="Doanh thu" value={formatCurrencyVnd(task.revenue ?? 0)} note="Task revenue" tone="cyan" />
            <CockpitKpiCard title="Chi phí" value={formatCurrencyVnd(task.cost ?? 0)} note="Material + labor + machine" tone="amber" />
            <CockpitKpiCard title="Lợi nhuận" value={formatCurrencyVnd((task.revenue ?? 0) - (task.cost ?? 0))} note="Revenue - cost" tone={(task.revenue ?? 0) - (task.cost ?? 0) >= 0 ? 'emerald' : 'red'} />
          </div>
          <CockpitChartCard title="Dependency" heightClass="h-[180px]">
            <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
              <CockpitStatusList items={(predecessorRows ?? []).map((row) => ({ id: row.id, label: row.name, value: 'Predecessor', statusTone: row.delayDays > 0 ? 'red' : 'cyan' }))} emptyMessage="Không có predecessor." />
              <CockpitStatusList items={successorRows.map((row) => ({ id: row.id, label: row.name, value: 'Successor', statusTone: row.delayDays > 0 ? 'red' : 'cyan' }))} emptyMessage="Không có successor." />
            </div>
          </CockpitChartCard>
          <TaskResources task={task} />
        </div>
      ) : null}
    </ModuleDetailDrawer>
  )
}

function TaskResources({ task }: { task: ProjectWbsRuntime }) {
  return (
    <div className="grid grid-cols-1 gap-1 xl:grid-cols-2">
      <CockpitChartCard title="Vật tư liên kết" heightClass="h-[260px]">
        <CockpitTableShell className="h-[200px]">
          <table className="w-full min-w-[620px] table-fixed text-sm">
            <thead className={tableHead}><tr>{['Vật tư','Planned','Issued','Used','Returned','Remaining','Cost','Actions'].map((head) => <th key={head} className="px-1.5 py-1 text-left font-medium">{head}</th>)}</tr></thead>
            <tbody>{(task.materials ?? []).map((row) => <tr key={row.id} className={tableRow}><td className="truncate px-1.5 py-2">{row.code ?? row.name ?? row.id}</td><td className="px-1.5 py-2 text-right">{fmt(row.planned ?? 0)}</td><td className="px-1.5 py-2 text-right">{fmt(row.issued ?? 0)}</td><td className="px-1.5 py-2 text-right">{fmt(row.used ?? 0)}</td><td className="px-1.5 py-2 text-right">{fmt(row.returned ?? 0)}</td><td className="px-1.5 py-2 text-right">{fmt(row.remaining ?? 0)}</td><td className="px-1.5 py-2 text-right">{formatCurrencyVnd(row.cost ?? 0)}</td><td className="px-1.5 py-2"><ResourceActions /></td></tr>)}</tbody>
          </table>
          {!task.materials?.length ? <CockpitEmptyState title="Chưa liên kết vật tư" description="Cần thao tác linking chuyên dụng ở phase tiếp theo." /> : null}
        </CockpitTableShell>
      </CockpitChartCard>
      <CockpitChartCard title="Cấu kiện liên kết" heightClass="h-[260px]">
        <CockpitTableShell className="h-[200px]">
          <table className="w-full min-w-[560px] table-fixed text-sm">
            <thead className={tableHead}><tr>{['Cấu kiện','Assigned','Installed','Returned','Status','Actions'].map((head) => <th key={head} className="px-1.5 py-1 text-left font-medium">{head}</th>)}</tr></thead>
            <tbody>{(task.components ?? []).map((row) => <tr key={row.id} className={tableRow}><td className="truncate px-1.5 py-2">{row.code ?? row.name ?? row.id}</td><td className="px-1.5 py-2 text-right">{fmt(row.assigned ?? 0)}</td><td className="px-1.5 py-2 text-right">{fmt(row.installed ?? 0)}</td><td className="px-1.5 py-2 text-right">{fmt(row.returned ?? 0)}</td><td className="px-1.5 py-2">{row.status ?? '-'}</td><td className="px-1.5 py-2"><ResourceActions component /></td></tr>)}</tbody>
          </table>
          {!task.components?.length ? <CockpitEmptyState title="Chưa liên kết cấu kiện" description="Cần thao tác linking chuyên dụng ở phase tiếp theo." /> : null}
        </CockpitTableShell>
      </CockpitChartCard>
      <CockpitChartCard title="Nhân công" heightClass="h-[220px]">
        <ResourceLoadingTable rows={(task.workers ?? []).map((row) => ({ label: row.role, required: row.required ?? 0, allocated: row.allocated ?? 0 }))} emptyTitle="Chưa phân bổ nhân công" />
      </CockpitChartCard>
      <CockpitChartCard title="Thiết bị" heightClass="h-[220px]">
        <ResourceLoadingTable rows={(task.machines ?? []).map((row) => ({ label: row.type, required: row.required ?? 0, allocated: row.allocated ?? 0 }))} emptyTitle="Chưa phân bổ thiết bị" />
      </CockpitChartCard>
    </div>
  )
}

function ResourceLoadingTable({ rows, emptyTitle }: { rows: Array<{ label: string; required: number; allocated: number }>; emptyTitle: string }) {
  if (!rows.length) return <CockpitEmptyState title={emptyTitle} description="Dữ liệu sẽ xuất hiện khi nhập resource loading cho task." />
  return (
    <CockpitTableShell className="h-[160px]">
      <table className="w-full min-w-[420px] table-fixed text-sm">
        <thead className={tableHead}><tr>{['Resource','Required','Allocated','Remaining'].map((head) => <th key={head} className="px-1.5 py-1 text-left font-medium">{head}</th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr key={row.label} className={tableRow}><td className="truncate px-1.5 py-2 text-white">{row.label}</td><td className="px-1.5 py-2 text-right">{fmt(row.required, 0)}</td><td className="px-1.5 py-2 text-right">{fmt(row.allocated, 0)}</td><td className={`px-1.5 py-2 text-right ${row.required - row.allocated > 0 ? 'text-red-300' : 'text-emerald-300'}`}>{fmt(Math.max(0, row.required - row.allocated), 0)}</td></tr>)}</tbody>
      </table>
    </CockpitTableShell>
  )
}

function ResourceActions({ component = false }: { component?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1">
      <button type="button" onClick={() => toast(component ? 'Liên kết cấu kiện sẽ dùng ProjectTaskResource API chính quy ở phase sau.' : 'Liên kết vật tư đang lưu trong WBS metadata bridge.')} className="rounded-lg border border-cyan-500/30 px-2 py-1 text-[11px] text-cyan-200">Liên kết</button>
      <button type="button" onClick={() => toast(component ? 'Xuất cấu kiện theo task cần workflow Yard/Project chính quy.' : 'Xuất vật tư theo task cần workflow Inventory Project Issue chính quy.')} className="rounded-lg border border-emerald-500/30 px-2 py-1 text-[11px] text-emerald-200">Xuất</button>
      <button type="button" onClick={() => toast(component ? 'Trả cấu kiện theo task chưa có API.' : 'Trả vật tư dùng Project Material Return hiện có ở cấp project.')} className="rounded-lg border border-amber-500/30 px-2 py-1 text-[11px] text-amber-200">Trả</button>
    </div>
  )
}

function ComponentProjectAction({ row, pending, onDeliver, onInstall }: { row: ProjectComponentRuntime; pending: boolean; onDeliver: (row: ProjectComponentRuntime) => void; onInstall: (row: ProjectComponentRuntime) => void }) {
  if (row.status === 'SHIPPED') {
    return <button type="button" disabled={pending} onClick={(event) => { event.preventDefault(); event.stopPropagation(); onDeliver(row) }} className="rounded-lg border border-purple-500/40 bg-purple-500/10 px-2 py-1 text-[11px] font-semibold text-purple-200 hover:bg-purple-500/20 disabled:opacity-50">{pending ? 'Đang xác nhận...' : 'Nhận hàng'}</button>
  }

  if (row.status === 'DELIVERED') {
    return <button type="button" disabled={pending} onClick={(event) => { event.preventDefault(); event.stopPropagation(); onInstall(row) }} className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50">{pending ? 'Đang xác nhận...' : 'Lắp đặt'}</button>
  }

  return <span className="text-xs text-slate-500">-</span>
}

function TemplateEditorDialog({ template, saving, onClose, onSubmit }: { template: ProjectTemplate | null | 'new'; saving: boolean; onClose: () => void; onSubmit: (payload: SaveProjectTemplatePayload) => void }) {
  const [code, setCode] = useState('TPL-NX-5N')
  const [name, setName] = useState('Nhà xưởng 5 nhịp')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'INACTIVE'>('DRAFT')
  const [isDefault, setIsDefault] = useState(false)
  const [structureText, setStructureText] = useState('')

  useEffect(() => {
    const source = template && template !== 'new' ? template : null
    setCode(source?.code ?? 'TPL-NX-5N')
    setName(source?.name ?? 'Nhà xưởng 5 nhịp')
    setDescription(source?.description ?? '')
    setStatus(source?.status ?? 'DRAFT')
    setIsDefault(Boolean(source?.isDefault))
    setStructureText(JSON.stringify(source?.structure ?? defaultTemplateStructure(), null, 2))
  }, [template])

  if (!template) return null

  const submit = () => {
    try {
      const structure = JSON.parse(structureText)
      onSubmit({ code, name, description, status, isDefault, structure })
    } catch {
      toast.error('JSON template không hợp lệ')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <section className="w-[min(980px,94vw)] overflow-hidden rounded-xl border border-cyan-900 bg-[#061321] text-slate-100 shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-800 px-5 py-4">
          <div><p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400">Project Template</p><h2 className="mt-1 text-xl font-semibold">{template === 'new' ? 'Tạo template' : 'Sửa template'}</h2></div>
          <button type="button" onClick={onClose} className="rounded border border-slate-700 p-2 text-slate-300"><X size={16} /></button>
        </header>
        <div className="grid gap-1 p-5 md:grid-cols-2">
          <Field label="Mã template"><input value={code} onChange={(event) => setCode(event.target.value)} className={`${input} w-full`} /></Field>
          <Field label="Tên template"><input value={name} onChange={(event) => setName(event.target.value)} className={`${input} w-full`} /></Field>
          <Field label="Trạng thái"><select value={status} onChange={(event) => setStatus(event.target.value as 'DRAFT' | 'PUBLISHED' | 'INACTIVE')} className={`${input} w-full`}><option value="DRAFT">DRAFT</option><option value="PUBLISHED">PUBLISHED</option><option value="INACTIVE">INACTIVE</option></select></Field>
          <label className="mt-7 flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={isDefault} onChange={(event) => setIsDefault(event.target.checked)} /> Đặt mặc định</label>
          <Field label="Mô tả"><input value={description} onChange={(event) => setDescription(event.target.value)} className={`${input} w-full md:col-span-2`} /></Field>
          <label className="text-xs text-slate-400 md:col-span-2">Template JSON<textarea value={structureText} onChange={(event) => setStructureText(event.target.value)} className={`${input} mt-1 h-[360px] w-full font-mono text-[11px] leading-relaxed`} /></label>
        </div>
        <footer className="flex justify-end gap-2 border-t border-slate-800 px-5 py-4">
          <button type="button" onClick={onClose} className={mutedButton}>Hủy</button>
          <button type="button" disabled={saving || !code.trim() || !name.trim()} onClick={submit} className={primaryButton}>{saving ? 'Đang lưu...' : 'Lưu template'}</button>
        </footer>
      </section>
    </div>
  )
}

function ReturnComponentDialog({ component, saving, onClose, onSubmit }: { component: ProjectComponentRuntime | null; saving: boolean; onClose: () => void; onSubmit: (reason: string) => void }) {
  const [reason, setReason] = useState('Trả cấu kiện từ công trình về bãi')
  useEffect(() => setReason('Trả cấu kiện từ công trình về bãi'), [component?.id])
  if (!component) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <section className="w-[min(640px,90vw)] overflow-hidden rounded-2xl border border-cyan-900 bg-[#061321] text-slate-100 shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-800 px-5 py-4">
          <div><p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400">Trả cấu kiện</p><h2 className="mt-1 text-xl font-semibold">{component.code}</h2><p className="mt-1 text-xs text-slate-500">{component.projectCode} · {component.name}</p></div>
          <button type="button" onClick={onClose} className="rounded border border-slate-700 p-2 text-slate-300"><X size={16} /></button>
        </header>
        <div className="space-y-2 p-5">
          <div className="grid grid-cols-1 gap-1 md:grid-cols-3">
            <Info k="Trạng thái" v={component.status} />
            <Info k="Vị trí" v={[component.installZone, component.installAxis, component.installLevel, component.installPosition].filter(Boolean).join(' / ') || '-'} />
            <Info k="Chi phí" v={formatCurrencyVnd(component.actualCost || component.estimatedCost)} />
          </div>
          <Field label="Lý do"><textarea value={reason} onChange={(event) => setReason(event.target.value)} className={`${input} min-h-24 w-full py-2`} /></Field>
          <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">Sau khi xác nhận, cấu kiện sẽ rời công trình, quay về trạng thái READY để bãi tập kết tiếp nhận/điều phối.</p>
        </div>
        <footer className="flex justify-end gap-2 border-t border-slate-800 px-5 py-4"><button type="button" onClick={onClose} className={mutedButton}>Hủy</button><button type="button" disabled={saving || !reason.trim()} onClick={() => onSubmit(reason)} className={primaryButton}>{saving ? 'Đang trả...' : 'Xác nhận trả'}</button></footer>
      </section>
    </div>
  )
}

function InstallComponentDialog({ component, saving, onClose, onSubmit }: { component: ProjectComponentRuntime | null; saving: boolean; onClose: () => void; onSubmit: (payload: InstallProjectComponentPayload) => void }) {
  const [form, setForm] = useState<InstallProjectComponentPayload>({ installZone: '', installAxis: '', installLevel: '', installPosition: '' })
  if (!component) return null
  const canSubmit = Object.values(form).every((value) => value.trim())
  const update = (key: keyof InstallProjectComponentPayload, value: string) => setForm((current) => ({ ...current, [key]: value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <section className="w-[min(720px,94vw)] overflow-hidden rounded-xl border border-cyan-900 bg-[#061321] text-slate-100 shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-800 px-5 py-4">
          <div><p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400">Lắp đặt cấu kiện</p><h2 className="mt-1 text-xl font-semibold">{component.code}</h2><p className="mt-1 text-xs text-slate-500">{component.name}</p></div>
          <button type="button" onClick={onClose} className="rounded border border-slate-700 p-2 text-slate-300"><X size={16} /></button>
        </header>
        <div className="grid gap-1 p-5 md:grid-cols-2">
          <Field label="Khu vực"><input value={form.installZone} onChange={(event) => update('installZone', event.target.value)} className={`${input} w-full`} /></Field>
          <Field label="Trục"><input value={form.installAxis} onChange={(event) => update('installAxis', event.target.value)} className={`${input} w-full`} /></Field>
          <Field label="Tầng"><input value={form.installLevel} onChange={(event) => update('installLevel', event.target.value)} className={`${input} w-full`} /></Field>
          <Field label="Vị trí"><input value={form.installPosition} onChange={(event) => update('installPosition', event.target.value)} className={`${input} w-full`} /></Field>
        </div>
        <footer className="flex justify-end gap-2 border-t border-slate-800 px-5 py-4"><button type="button" onClick={onClose} className={mutedButton}>Hủy</button><button type="button" disabled={!canSubmit || saving} onClick={() => onSubmit(form)} className={primaryButton}>{saving ? 'Đang xác nhận...' : 'Xác nhận lắp đặt'}</button></footer>
      </section>
    </div>
  )
}

function PendingReturnDetailDrawer({
  material,
  requests,
  onClose,
}: {
  material: ProjectMaterialRuntime | null
  requests: ProjectsRuntime['returnRequests']
  onClose: () => void
}) {
  const related = useMemo(() => {
    if (!material) return []
    return pendingReturnRequestsFor(material, requests)
  }, [material, requests])
  const [selectedId, setSelectedId] = useState('')
  useEffect(() => {
    setSelectedId(related[0]?.id ?? '')
  }, [material?.id, related[0]?.id])
  if (!material) return null
  const selected = related.find((request) => request.id === selectedId) ?? related[0] ?? null

  return (
    <ModuleDetailDrawer
      open={Boolean(material)}
      title="Pending Return"
      subtitle={`${material.projectCode} · ${material.materialCode} · ${material.materialName}`}
      onClose={onClose}
      size="sm"
      placement="right"
    >
      <div className="space-y-3 text-sm">
        <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3">
          <h3 className="mb-2 text-sm font-semibold text-white">Phiếu trả đang chờ</h3>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <Info k="Công trình" v={`${material.projectCode} · ${material.projectName}`} />
            <Info k="Vật tư" v={`${material.materialCode} · ${material.materialName}`} />
            <Info k="Pending" v={`${fmt(material.pendingReturnQuantity ?? 0)} ${material.unit ?? ''}`.trim()} />
          </div>
        </section>

        <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3">
          <div className="overflow-auto">
            <table className="w-full min-w-[680px] table-fixed text-sm">
              <thead className={tableHead}>
                <tr>{['Return No', 'Status', 'Quantity', 'Created At', 'Requested By'].map((heading) => <th key={heading} className="px-2 py-2 text-left font-medium">{heading}</th>)}</tr>
              </thead>
              <tbody>
                {related.map((request) => {
                  const quantity = returnRequestMaterialQuantity(request, material.inventoryItemId)
                  return (
                    <tr key={request.id} className={`${tableRow} cursor-pointer ${selected?.id === request.id ? 'bg-cyan-400/[0.08]' : ''}`} onClick={() => setSelectedId(request.id)}>
                      <td className="px-2 py-2 font-mono text-cyan-300">{request.returnNo}</td>
                      <td className="px-2 py-2"><ReturnRequestStatusPill status={request.status} /></td>
                      <td className="px-2 py-2 text-right font-mono tabular-nums">{fmt(quantity)}</td>
                      <td className="px-2 py-2 text-slate-400">{formatDateTime(request.createdAt)}</td>
                      <td className="truncate px-2 py-2 text-slate-300">{request.requestedBy ?? '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!related.length ? (
              <CockpitEmptyState title="Không có phiếu pending" description="Các phiếu trả đang chờ xử lý sẽ xuất hiện tại đây." />
            ) : null}
          </div>
        </section>

        {selected ? (
          <section className="rounded-2xl border border-cyan-300/15 bg-slate-950/35 p-3">
            <h3 className="mb-2 text-sm font-semibold text-white">Chi tiết phiếu</h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <Info k="Phiếu" v={selected.returnNo} />
              <Info k="Trạng thái" v={returnRequestStatusLabel(selected.status)} />
              <Info k="Số lượng" v={`${fmt(returnRequestMaterialQuantity(selected, material.inventoryItemId))} ${material.unit ?? ''}`.trim()} />
              <Info k="Ngày tạo" v={formatDateTime(selected.createdAt)} />
              <Info k="Người trả" v={selected.requestedBy ?? '-'} />
              <Info k="Lý do" v={selected.remarks ?? '-'} />
            </div>
          </section>
        ) : null}
      </div>
    </ModuleDetailDrawer>
  )
}

function pendingReturnRequestsFor(material: ProjectMaterialRuntime, requests: ProjectsRuntime['returnRequests']) {
  return requests.filter((request) => {
    if (material.projectId && request.projectId !== material.projectId) return false
    if (!['REQUESTED', 'APPROVED'].includes(String(request.status))) return false
    return request.items.some((item) => item.inventoryItemId === material.inventoryItemId)
  })
}

function returnRequestMaterialQuantity(request: ProjectReturnRequestRuntime, inventoryItemId: string) {
  return request.items
    .filter((item) => item.inventoryItemId === inventoryItemId)
    .reduce((sum, item) => sum + Number(item.requestedQuantity ?? 0), 0)
}

function returnRequestStatusLabel(status: string) {
  if (status === 'REQUESTED') return 'Requested'
  if (status === 'APPROVED') return 'Requested'
  if (status === 'RECEIVED') return 'Received'
  if (status === 'DISPOSED') return 'Accepted'
  if (status === 'CANCELLED') return 'Rejected'
  return status
}

function ReturnRequestStatusPill({ status }: { status: string }) {
  const tone =
    status === 'CANCELLED'
      ? 'border-red-400/30 bg-red-500/10 text-red-200'
      : status === 'DISPOSED'
        ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
        : status === 'RECEIVED' || status === 'INSPECTED'
          ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200'
          : 'border-amber-400/30 bg-amber-500/10 text-amber-200'
  return <span className={`rounded-lg border px-2 py-0.5 text-xs font-semibold ${tone}`}>{returnRequestStatusLabel(status)}</span>
}

function ReturnMaterialDialog({ material, saving, onClose, onSubmit }: { material: ProjectMaterialRuntime | null; saving: boolean; onClose: () => void; onSubmit: (payload: CreateProjectMaterialReturnPayload) => void }) {
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('Hoàn trả vật tư dư tại công trình')

  useEffect(() => {
    setQuantity(material ? formatQuantity(Math.abs(material.quantity)) : '')
    setReason('Hoàn trả vật tư dư tại công trình')
  }, [material?.id])

  if (!material) return null

  const parsedQuantity = parseLocaleNumber(quantity)
  const maxQuantity = Number(material.availableReturnQuantity ?? Math.abs(material.quantity))
  const canSubmit = Boolean(material.projectId && material.inventoryItemId && parsedQuantity > 0 && parsedQuantity <= maxQuantity)
  const submit = () => {
    if (!canSubmit || !material.projectId) return
    onSubmit({
      projectId: material.projectId,
      inventoryItemId: material.inventoryItemId,
      unitId: material.unitId,
      zoneId: material.zoneId,
      quantity: parsedQuantity,
      reason,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <section className="w-[min(720px,94vw)] overflow-hidden rounded-xl border border-cyan-900 bg-[#061321] text-slate-100 shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400">Trả vật tư công trình</p>
            <h2 className="mt-1 text-xl font-semibold">{material.materialCode}</h2>
            <p className="mt-1 text-xs text-slate-500">{material.projectCode} · {material.materialName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded border border-slate-700 p-2 text-slate-300"><X size={16} /></button>
        </header>
        <div className="grid gap-1 p-5">
          <div className="grid grid-cols-1 gap-1 md:grid-cols-3">
            <Info k="Có thể trả" v={`${fmt(maxQuantity)} ${material.unit ?? ''}`} />
            <Info k="Đang chờ trả" v={`${fmt(material.pendingReturnQuantity ?? 0)} ${material.unit ?? ''}`} />
            <Info k="Giá trị" v={formatCurrencyVnd(Math.abs(material.totalAmount))} />
          </div>
          <Field label="Số lượng trả">
            <input value={quantity} onFocus={() => setQuantity(String(parsedQuantity || ''))} onBlur={() => setQuantity(parsedQuantity > 0 ? formatQuantity(parsedQuantity) : '')} onChange={(event) => setQuantity(event.target.value)} inputMode="decimal" className={`${input} w-full`} />
          </Field>
          <Field label="Lý do">
            <select value={reason} onChange={(event) => setReason(event.target.value)} className={`${input} w-full`}>
              {['Hoàn trả vật tư dư tại công trình', 'Sai lệch cấp phát', 'Không sử dụng', 'Hư hỏng cần kiểm tra', 'Khác'].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </Field>
          {parsedQuantity > maxQuantity ? (
            <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-100">Vượt số lượng có thể trả</p>
          ) : !canSubmit ? (
            <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">Số lượng trả phải lớn hơn 0 và vật tư phải có liên kết project/material hợp lệ.</p>
          ) : null}
        </div>
        <footer className="flex justify-end gap-2 border-t border-slate-800 px-5 py-4">
          <button type="button" onClick={onClose} className={mutedButton}>Hủy</button>
          <button type="button" disabled={!canSubmit || saving} onClick={submit} className={primaryButton}>{saving ? 'Đang tạo...' : 'Tạo phiếu trả'}</button>
        </footer>
      </section>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="text-xs text-slate-400">{label}<div className="mt-1">{children}</div></label>
}

function StatusWidget({ runtime }: { runtime: ProjectsRuntime }) {
  return (
    <CockpitChartCard title="Trạng thái công trình" heightClass="h-[170px]" chartHeightClass="h-[98px]">
      <StatusMiniBars rows={runtime.reports.byStatus.map((row) => [statusLabel(row.status), row.count])} />
    </CockpitChartCard>
  )
}

type ProjectChartSeries = {
  name: string
  values: number[]
}

function ProjectLineChart({ series, currency = false }: { series: ProjectChartSeries[]; currency?: boolean }) {
  const activeSeries = series.filter((item) => item.values.length > 0)
  if (!activeSeries.length) {
    return <CockpitEmptyState title="Chưa có dữ liệu" description="Dữ liệu sẽ xuất hiện khi phát sinh nghiệp vụ." />
  }
  const width = 360
  const height = 110
  const padding = 12
  const values = activeSeries.flatMap((item) => item.values)
  const min = Math.min(0, ...values)
  const max = Math.max(1, ...values)
  const span = Math.max(1, max - min)
  const colors = ['#22d3ee', '#34d399', '#f59e0b', '#a78bfa']
  const points = (line: number[]) => line.map((value, index) => {
    const x = padding + (index / Math.max(1, line.length - 1)) * (width - padding * 2)
    const y = height - padding - ((value - min) / span) * (height - padding * 2)
    return `${x},${y}`
  }).join(' ')
  return (
    <div className="h-full min-h-0">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[calc(100%-28px)] w-full overflow-visible">
        {[0, 1, 2].map((line) => <line key={line} x1={padding} x2={width - padding} y1={padding + line * 38} y2={padding + line * 38} stroke="rgba(148,163,184,0.14)" strokeWidth="1" />)}
        {activeSeries.map((item, index) => (
          <polyline key={item.name} points={points(item.values)} fill="none" stroke={colors[index % colors.length]} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </svg>
      <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
        {activeSeries.map((item, index) => {
          const last = item.values[item.values.length - 1] ?? 0
          return (
            <span key={item.name} className="inline-flex items-center gap-1">
              <i className="h-2 w-2 rounded-full" style={{ background: colors[index % colors.length] }} />
              {item.name}: <b className="font-mono text-slate-200">{currency ? compactMoney(last) : fmt(last)}</b>
            </span>
          )
        })}
      </div>
    </div>
  )
}

function buildProgressSeries(rows: ProjectRuntimeRow[]): ProjectChartSeries[] {
  if (!rows.length) return []
  const now = Date.now()
  const planned = rows.map((row) => {
    const start = new Date(row.startedAt).getTime()
    const end = new Date(row.plannedEndAt).getTime()
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return row.progress
    return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100))
  })
  const actual = rows.map((row) => row.progress)
  const forecast = rows.map((row, index) => {
    const delta = actual[index] - planned[index]
    return Math.min(100, Math.max(0, actual[index] + delta))
  })
  return [
    { name: 'Kế hoạch', values: planned },
    { name: 'Thực tế', values: actual },
    { name: 'Dự báo', values: forecast },
  ]
}

function buildValueSeries(rows: ProjectRuntimeRow[], financial: ProjectFinancialRuntime[]): ProjectChartSeries[] {
  if (!rows.length) return []
  const actualByProject = new Map(financial.map((item) => [item.projectId, item.actualCost]))
  return [
    { name: 'Giá trị hợp đồng', values: rows.map((row) => row.contractValue) },
    { name: 'Giá trị nghiệm thu', values: rows.map((row) => row.deliveredComponents > 0 ? row.actualValue : 0) },
    { name: 'Giá trị thực hiện', values: rows.map((row) => actualByProject.get(row.id) ?? row.actualValue) },
  ]
}

function taskStatusRows(wbs: ProjectWbsRuntime[], projects: ProjectRuntimeRow[]): Array<[string, number]> {
  if (wbs.length) {
    return [
      ['Hoàn thành', wbs.filter((row) => row.status === 'COMPLETED').length],
      ['Đang thực hiện', wbs.filter((row) => ['READY', 'IN_PROGRESS'].includes(row.status)).length],
      ['Chậm tiến độ', wbs.filter((row) => row.delayDays > 0).length],
      ['Chưa bắt đầu', wbs.filter((row) => ['DRAFT', 'PLANNED'].includes(row.status)).length],
      ['Tạm dừng', wbs.filter((row) => ['BLOCKED', 'PAUSED'].includes(row.status)).length],
    ]
  }
  return [
    ['Hoàn thành', projects.filter((row) => row.status === 'COMPLETED').length],
    ['Đang thực hiện', projects.filter((row) => row.status === 'ACTIVE').length],
    ['Chậm tiến độ', projects.filter(isDelayed).length],
    ['Chưa bắt đầu', projects.filter((row) => row.status === 'PLANNING').length],
    ['Tạm dừng', projects.filter((row) => row.status === 'ON_HOLD').length],
  ]
}

function riskRows(health: ProjectHealthRuntime[]) {
  const totals = health.reduce((acc, item) => ({
    blocked: acc.blocked + item.blockedTasks,
    overdue: acc.overdue + item.overdueTasks,
    missingMaterials: acc.missingMaterials + item.missingMaterials,
    missingComponents: acc.missingComponents + item.missingComponents,
    overBudget: acc.overBudget + (item.overBudget ? 1 : 0),
  }), { blocked: 0, overdue: 0, missingMaterials: 0, missingComponents: 0, overBudget: 0 })
  return [
    { id: 'overdue', label: 'Công việc chậm', value: totals.overdue, statusTone: 'red' as const },
    { id: 'missing-materials', label: 'Thiếu vật tư', value: totals.missingMaterials, statusTone: 'amber' as const },
    { id: 'missing-components', label: 'Thiếu cấu kiện', value: totals.missingComponents, statusTone: 'purple' as const },
    { id: 'over-budget', label: 'Vượt ngân sách', value: totals.overBudget, statusTone: 'red' as const },
    { id: 'blocked', label: 'Công việc bị chặn', value: totals.blocked, statusTone: 'amber' as const },
  ].filter((item) => Number(item.value) > 0)
}

function ProgressWidget({ rows }: { rows: ProjectRuntimeRow[] }) {
  return (
    <CockpitChartCard title="Tiến độ theo công trình" heightClass="h-[170px]" chartHeightClass="h-[98px]">
      <StatusMiniBars rows={[...rows].sort((a, b) => b.progress - a.progress).slice(0, 5).map((row) => [row.code, row.progress])} suffix="%" />
    </CockpitChartCard>
  )
}

function ValueWidget({ rows }: { rows: ProjectRuntimeRow[] }) {
  return (
    <CockpitChartCard title="Giá trị theo công trình" heightClass="h-[170px]" chartHeightClass="h-[98px]">
      <StatusMiniBars rows={[...rows].sort((a, b) => b.actualValue - a.actualValue).slice(0, 5).map((row) => [row.code, row.actualValue])} currency />
    </CockpitChartCard>
  )
}

function StatusMiniBars({ rows, suffix = '', currency = false }: { rows: Array<[string, number]>; suffix?: string; currency?: boolean }) {
  const max = Math.max(1, ...rows.map(([, value]) => Math.abs(value)))
  if (!rows.length) return <CockpitEmptyState title="Chưa có dữ liệu" description="Dữ liệu sẽ xuất hiện khi phát sinh nghiệp vụ." />
  return (
    <div className="space-y-1">
      {rows.slice(0, 5).map(([label, value]) => (
        <div key={label} className="grid grid-cols-[92px_1fr_80px] items-center gap-2 text-[11px]">
          <span className="truncate text-slate-400">{label}</span>
          <span className="h-2 overflow-hidden rounded bg-slate-800"><i className="block h-full rounded bg-cyan-400" style={{ width: `${Math.max(4, Math.abs(value) / max * 100)}%` }} /></span>
          <span className="truncate text-right font-mono text-cyan-300">{currency ? compactMoney(value) : `${fmt(value)}${suffix}`}</span>
        </div>
      ))}
    </div>
  )
}

function defaultTemplateStructure(): ProjectTemplateStructure {
  return {
    version: 1,
    tasks: [
      { key: 'prepare', name: 'Chuẩn bị', durationDays: 3 },
      { key: 'foundation', name: 'Móng', durationDays: 7, dependsOn: [{ key: 'prepare', type: 'FS' }] },
      {
        key: 'fabrication',
        name: 'Gia công',
        durationDays: 20,
        dependsOn: [{ key: 'foundation', type: 'FS' }],
        suggestedComponents: ['Cột', 'Dầm', 'Giằng'],
      },
      { key: 'painting', name: 'Sơn', durationDays: 5, dependsOn: [{ key: 'fabrication', type: 'FS' }] },
      { key: 'transport', name: 'Vận chuyển', durationDays: 3, dependsOn: [{ key: 'painting', type: 'FS' }] },
      {
        key: 'installation',
        name: 'Lắp dựng',
        durationDays: 15,
        dependsOn: [{ key: 'transport', type: 'FS' }],
        suggestedMaterials: ['Bulong M20', 'Bản mã', 'Long đền'],
        suggestedComponents: ['Cột', 'Dầm', 'Giằng'],
        resources: [
          { type: 'WORKER', name: 'Công nhân lắp dựng', quantity: 6 },
          { type: 'WORKER', name: 'Kỹ sư', quantity: 1 },
          { type: 'MACHINE', name: 'Cẩu', quantity: 1 },
        ],
      },
      { key: 'finishing', name: 'Hoàn thiện', durationDays: 5, dependsOn: [{ key: 'installation', type: 'FS' }] },
      { key: 'qc', name: 'QC', durationDays: 2, dependsOn: [{ key: 'finishing', type: 'FS' }] },
      { key: 'handover', name: 'Bàn giao', durationDays: 1, dependsOn: [{ key: 'qc', type: 'FS' }] },
    ],
  }
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  const config = {
    ACTIVE: 'border-blue-500/30 bg-blue-500/10 text-blue-200',
    COMPLETED: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    PLANNING: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    ON_HOLD: 'border-slate-500/30 bg-slate-500/10 text-slate-200',
  }[status]
  return <span className={`rounded-lg border px-2 py-0.5 text-xs ${config}`}>{statusLabel(status)}</span>
}

function ComponentStatusBadge({ status }: { status: ProjectComponentStatus }) {
  const tone = status === 'SHIPPED' ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200' : status === 'DELIVERED' ? 'border-purple-500/30 bg-purple-500/10 text-purple-200' : status === 'INSTALLED' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : status === 'READY' ? 'border-blue-500/30 bg-blue-500/10 text-blue-200' : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
  return <span className={`rounded-lg border px-2 py-0.5 text-xs ${tone}`}>{status}</span>
}

function Progress({ value }: { value: number }) {
  return <div className="grid grid-cols-[42px_1fr] items-center gap-2"><span className="font-mono text-xs text-cyan-300">{fmt(value)}%</span><span className="h-2 rounded bg-slate-800"><i className={`block h-full rounded ${value >= 70 ? 'bg-emerald-500' : value >= 35 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></span></div>
}

function Info({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-1 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"><span className="text-slate-500">{k}</span><span className="text-right text-slate-200">{v}</span></div>
}

function ProjectGantt({ rows }: { rows: ProjectWbsRuntime[] }) {
  const visible = rows.filter((row) => row.plannedStartAt || row.plannedFinishAt).slice(0, 8)
  if (!visible.length) return <CockpitEmptyState title="Chưa có dữ liệu Gantt" description="Nhập ngày kế hoạch cho WBS task để hiển thị timeline." />
  const dates = visible.flatMap((row) => [new Date(row.plannedStartAt ?? row.plannedFinishAt ?? ''), new Date(row.plannedFinishAt ?? row.plannedStartAt ?? '')]).filter((dateValue) => Number.isFinite(dateValue.getTime()))
  const min = Math.min(...dates.map((dateValue) => dateValue.getTime()))
  const max = Math.max(...dates.map((dateValue) => dateValue.getTime()), min + 86_400_000)
  const span = Math.max(86_400_000, max - min)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => new Date(min + span * ratio))
  return (
    <div className="h-full space-y-2 overflow-auto pr-1">
      <div className="grid grid-cols-[150px_1fr] gap-2 text-[11px] text-slate-500">
        <span />
        <div className="grid grid-cols-5">
          {ticks.map((tick) => <span key={tick.toISOString()}>{tick.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>)}
        </div>
      </div>
      {visible.map((row) => {
        const start = new Date(row.plannedStartAt ?? row.plannedFinishAt ?? '').getTime()
        const finish = new Date(row.plannedFinishAt ?? row.plannedStartAt ?? '').getTime()
        const actualFinish = row.actualFinishAt ? new Date(row.actualFinishAt).getTime() : finish
        const left = Math.max(0, ((start - min) / span) * 100)
        const width = Math.max(4, ((finish - start || 86_400_000) / span) * 100)
        const delayWidth = actualFinish > finish ? Math.max(3, ((actualFinish - finish) / span) * 100) : 0
        return (
          <div key={row.id} className="grid grid-cols-[150px_1fr] items-center gap-2 text-xs">
            <span className="truncate text-slate-300" style={{ paddingLeft: `${row.level * 10}px` }}>{row.name}</span>
            <span className="relative h-5 rounded bg-slate-900/80">
              <i className="absolute top-1 h-3 rounded bg-cyan-400/80" style={{ left: `${left}%`, width: `${width}%` }} />
              {delayWidth ? <i className="absolute top-1 h-3 rounded bg-red-400/80" style={{ left: `${left + width}%`, width: `${delayWidth}%` }} /> : null}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function flattenWbs(rows: ProjectWbsRuntime[], expanded: Set<string>) {
  const byParent = new Map<string, ProjectWbsRuntime[]>()
  rows.forEach((row) => {
    const key = row.parentId ?? 'root'
    byParent.set(key, [...(byParent.get(key) ?? []), row])
  })
  const result: ProjectWbsRuntime[] = []
  const walk = (parentId: string, level: number) => {
    for (const row of byParent.get(parentId) ?? []) {
      const nextRow = { ...row, level }
      result.push(nextRow)
      if (expanded.has(row.id)) walk(row.id, level + 1)
    }
  }
  walk('root', 0)
  return result
}

function buildTaskTreeOptions(rows: ProjectWbsRuntime[]) {
  return flattenWbs(rows, new Set(rows.map((row) => row.id))).map((row) => ({
    id: row.id,
    label: `${'— '.repeat(row.level)}${taskPath(rows, row.id)}`,
  }))
}

function taskPath(rows: ProjectWbsRuntime[], id: string): string {
  const row = rows.find((item) => item.id === id)
  if (!row) return id
  const parents: string[] = [row.name]
  let parentId = row.parentId
  const visited = new Set<string>([row.id])
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId)
    const parent = rows.find((item) => item.id === parentId)
    if (!parent) break
    parents.unshift(parent.name)
    parentId = parent.parentId
  }
  return parents.join(' / ')
}

function descendantIds(rows: ProjectWbsRuntime[], id: string) {
  const result: string[] = []
  const walk = (parentId: string) => {
    rows.filter((row) => row.parentId === parentId).forEach((child) => {
      result.push(child.id)
      walk(child.id)
    })
  }
  walk(id)
  return result
}

function parseMaterialLinks(value: string) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const [code, name, planned, issued, used, returned, remaining, cost] = line.split('|').map((part) => part.trim())
    return {
      id: code,
      code,
      name,
      planned: parseLocaleNumber(planned),
      issued: parseLocaleNumber(issued),
      used: parseLocaleNumber(used),
      returned: parseLocaleNumber(returned),
      remaining: parseLocaleNumber(remaining),
      cost: parseLocaleNumber(cost),
    }
  })
}

function parseComponentLinks(value: string) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const [code, name, assigned, installed, returned, status, cost] = line.split('|').map((part) => part.trim())
    return {
      id: code,
      code,
      name,
      assigned: parseLocaleNumber(assigned),
      installed: parseLocaleNumber(installed),
      returned: parseLocaleNumber(returned),
      status,
      cost: parseLocaleNumber(cost),
    }
  })
}

function parseWorkerLinks(value: string) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const [role, required, allocated] = line.split('|').map((part) => part.trim())
    return {
      role,
      required: parseLocaleNumber(required),
      allocated: parseLocaleNumber(allocated),
    }
  })
}

function parseMachineLinks(value: string) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const [type, required, allocated] = line.split('|').map((part) => part.trim())
    return {
      type,
      required: parseLocaleNumber(required),
      allocated: parseLocaleNumber(allocated),
    }
  })
}

function buildTaskPlannedProgress(rows: ProjectWbsRuntime[]) {
  const now = Date.now()
  return rows.map((row) => {
    const start = new Date(row.plannedStartAt ?? 0).getTime()
    const finish = new Date(row.plannedFinishAt ?? 0).getTime()
    if (!Number.isFinite(start) || !Number.isFinite(finish) || finish <= start) return row.progress
    return Math.min(100, Math.max(0, ((now - start) / (finish - start)) * 100))
  })
}

function resourceShortageRows(rows: ProjectWbsRuntime[]) {
  const materialMissing = rows.reduce((sum, row) => sum + (row.materials ?? []).reduce((lineSum, item) => lineSum + Math.max(0, (item.planned ?? 0) - (item.issued ?? 0)), 0), 0)
  const componentMissing = rows.reduce((sum, row) => sum + (row.components ?? []).reduce((lineSum, item) => lineSum + Math.max(0, (item.assigned ?? 0) - (item.installed ?? 0)), 0), 0)
  const workerMissing = rows.reduce((sum, row) => sum + (row.workers ?? []).reduce((lineSum, item) => lineSum + Math.max(0, (item.required ?? 0) - (item.allocated ?? 0)), 0), 0)
  const machineMissing = rows.reduce((sum, row) => sum + (row.machines ?? []).reduce((lineSum, item) => lineSum + Math.max(0, (item.required ?? 0) - (item.allocated ?? 0)), 0), 0)
  return [
    materialMissing ? { id: 'missing-materials', label: `Thiếu ${fmt(materialMissing, 0)} vật tư/cấp phát`, value: 'Procurement', statusTone: 'amber' as const } : null,
    componentMissing ? { id: 'missing-components', label: `Thiếu ${fmt(componentMissing, 0)} cấu kiện/lắp đặt`, value: 'Execution', statusTone: 'purple' as const } : null,
    workerMissing ? { id: 'missing-workers', label: `Thiếu ${fmt(workerMissing, 0)} nhân lực`, value: 'Resource', statusTone: 'red' as const } : null,
    machineMissing ? { id: 'missing-machines', label: `Thiếu ${fmt(machineMissing, 0)} thiết bị`, value: 'Resource', statusTone: 'red' as const } : null,
  ].filter(Boolean) as Array<{ id: string; label: string; value: string; statusTone: 'amber' | 'purple' | 'red' }>
}

function inspectionStatusRows(rows: ProjectWbsRuntime[]) {
  const pending = rows.filter((row) => row.inspectionStatus === 'PENDING_INSPECTION').length
  const failed = rows.filter((row) => row.inspectionStatus === 'INSPECTION_FAILED').length
  const accepted = rows.filter((row) => row.inspectionStatus === 'ACCEPTED').length
  const handedOver = rows.filter((row) => row.inspectionStatus === 'HANDED_OVER').length
  return [
    { id: 'pending-inspection', label: 'Hạng mục chờ nghiệm thu', value: pending, statusTone: 'amber' as const },
    { id: 'inspection-failed', label: 'Hạng mục bị từ chối', value: failed, statusTone: 'red' as const },
    { id: 'accepted', label: 'Hạng mục đã nghiệm thu', value: accepted, statusTone: 'cyan' as const },
    { id: 'handed-over', label: 'Hạng mục đã bàn giao', value: handedOver, statusTone: 'emerald' as const },
  ]
}

function inspectionLabel(value?: string | null) {
  if (value === 'PENDING_INSPECTION') return 'Chờ nghiệm thu'
  if (value === 'INSPECTION_FAILED') return 'Không đạt'
  if (value === 'INSPECTION_PASSED') return 'Đạt kiểm tra'
  if (value === 'ACCEPTED') return 'Đã nghiệm thu'
  if (value === 'HANDED_OVER') return 'Đã bàn giao'
  return 'Chưa yêu cầu'
}

function dependencyWarnings(rows: ProjectWbsRuntime[]) {
  const delayed = rows.filter((row) => row.delayDays > 0)
  const affectedIds = new Set<string>()
  delayed.forEach((row) => {
    rows.filter((candidate) => candidate.predecessors?.some((dependency) => dependency.taskId === row.id)).forEach((candidate) => affectedIds.add(candidate.id))
  })
  return [
    ...delayed.slice(0, 3).map((row) => ({ id: `delay-${row.id}`, label: `${row.name} chậm ${fmt(row.delayDays, 0)} ngày`, value: 'Critical', statusTone: 'red' as const })),
    affectedIds.size ? { id: 'affected-chain', label: `Có ${fmt(affectedIds.size, 0)} task bị ảnh hưởng dây chuyền`, value: 'Warning', statusTone: 'amber' as const } : null,
  ].filter(Boolean) as Array<{ id: string; label: string; value: string; statusTone: 'red' | 'amber' }>
}

function fallbackFinancial(project: ProjectRuntimeRow): ProjectFinancialRuntime {
  const actualCost = project.actualValue
  const contractValue = project.contractValue
  const profit = contractValue - actualCost
  return {
    projectId: project.id,
    contractValue,
    budget: contractValue,
    actualCost,
    profit,
    marginPercent: contractValue > 0 ? (profit / contractValue) * 100 : 0,
    breakdown: {
      materialCost: actualCost,
      componentCost: 0,
      laborCost: 0,
      machineCost: 0,
      otherCost: 0,
    },
    byTime: [],
    profitByProgress: [],
  }
}

function aggregateMaterials(rows: ProjectMaterialRuntime[]) {
  const map = new Map<string, {
    code: string
    name: string
    unit: string
    issued: number
    allocated: number
    used: number
    pendingReturn: number
    returned: number
    availableReturn: number
    onSite: number
    value: number
  }>()
  rows.forEach((row) => {
    const current = map.get(row.materialCode) ?? {
      code: row.materialCode,
      name: row.materialName,
      unit: row.unit ?? '-',
      issued: 0,
      allocated: 0,
      used: 0,
      pendingReturn: 0,
      returned: 0,
      availableReturn: 0,
      onSite: 0,
      value: 0,
    }
    const qty = Math.abs(row.quantity)
    if (row.type === 'EXPORT') {
      current.issued += qty
      current.onSite += qty
    } else if (row.type === 'RETURN') {
      current.onSite -= qty
    }
    current.allocated = Math.max(current.allocated, Number(row.allocatedQuantity ?? 0))
    current.used = Math.max(current.used, Number(row.usedQuantity ?? 0))
    current.pendingReturn = Math.max(current.pendingReturn, Number(row.pendingReturnQuantity ?? 0))
    current.returned = Math.max(current.returned, Number(row.returnedQuantity ?? 0))
    current.availableReturn = Math.max(current.availableReturn, Number(row.availableReturnQuantity ?? 0))
    current.value += Math.abs(row.totalAmount)
    map.set(row.materialCode, current)
  })
  return Array.from(map.values()).sort((a, b) => b.value - a.value)
}

function topMaterials(rows: ProjectMaterialRuntime[]) {
  return aggregateMaterials(rows).slice(0, 5).map((row) => ({ label: row.code, value: row.issued }))
}

function topMaterialValue(rows: ProjectMaterialRuntime[]) {
  return aggregateMaterials(rows).slice(0, 5).map((row) => ({ label: row.code, value: row.value }))
}

function topComponentZones(rows: ProjectComponentRuntime[]): Array<[string, number]> {
  const map = new Map<string, number>()
  rows.forEach((row) => {
    const key = row.installZone ?? row.projectCode ?? 'Chưa phân hạng mục'
    map.set(key, (map.get(key) ?? 0) + 1)
  })
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
}

function addTuple(rows: Array<[string, number]>, label: string, value: number) {
  const found = rows.find((row) => row[0] === label)
  if (found) found[1] += value
  else rows.push([label, value])
  return rows
}

function filterMaterials(materials: ProjectMaterialRuntime[], projects: ProjectRuntimeRow[]) {
  const ids = new Set(projects.map((project) => project.id))
  return materials.filter((row) => row.projectId && ids.has(row.projectId))
}

function filterComponents(components: ProjectComponentRuntime[], projects: ProjectRuntimeRow[]) {
  const ids = new Set(projects.map((project) => project.id))
  return components.filter((row) => row.projectId && ids.has(row.projectId))
}

function isDelayed(row: ProjectRuntimeRow) {
  const end = new Date(row.plannedEndAt).getTime()
  return (row.delayedOrders > 0 || (Number.isFinite(end) && end < Date.now())) && row.status !== 'COMPLETED'
}

function statusLabel(status: ProjectStatus | string) {
  if (status === 'ACTIVE') return 'Đang triển khai'
  if (status === 'COMPLETED') return 'Hoàn thành'
  if (status === 'PLANNING') return 'Kế hoạch'
  if (status === 'ON_HOLD') return 'Tạm dừng'
  return status
}

function executionStatusLabel(status: string) {
  if (status === 'NO_REQUIREMENTS') return 'Chưa có yêu cầu'
  if (status === 'NO_PRODUCTION') return 'Chưa lập sản xuất'
  if (status === 'PLANNED') return 'Đã lập kế hoạch'
  if (status === 'IN_PRODUCTION') return 'Đang sản xuất'
  if (status === 'WAITING_QC') return 'Chờ QC'
  if (status === 'QC_BLOCKED') return 'QC chặn'
  if (status === 'FINISHED_PARTIAL') return 'FG một phần'
  if (status === 'FINISHED') return 'Finished Goods'
  if (status === 'OVER_PRODUCED') return 'Vượt yêu cầu'
  return status
}

function fmt(value = 0, digits = 1) {
  return formatQuantity(value, digits)
}

function date(value?: string | null) {
  return value ? formatDateTime(value).slice(0, 10) : '-'
}

function toDateInput(value?: string | null) {
  if (!value) return ''
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : ''
}

function addDays(value: string, days: number) {
  const date = value ? new Date(`${value}T00:00:00`) : new Date()
  if (!Number.isFinite(date.getTime())) return new Date().toISOString().slice(0, 10)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function normalizeText(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function buildTemplateRules(templates: ProjectTemplate[]): ProjectTemplateTaskRule[] {
  return templates
    .filter((template) => template.status === 'PUBLISHED')
    .flatMap((template) => {
      const explicit = template.structure.rules ?? []
      const derived = (template.structure.tasks ?? []).map((task) => ({
        taskType: task.name,
        defaultDuration: task.durationDays,
        suggestedMaterials: task.suggestedMaterials ?? [],
        suggestedComponents: task.suggestedComponents ?? [],
        suggestedResources: task.resources ?? [],
        suggestedMachines: task.suggestedMachines ?? [],
        suggestedChecklist: task.suggestedChecklist ?? (normalizeText(task.name).includes('qc') || normalizeText(task.name).includes('nghiem thu') ? ['QC', 'Nghiệm thu'] : []),
      }))
      return [...explicit, ...derived]
    })
}

function findTemplateRule(taskName: string, rules: ProjectTemplateTaskRule[]) {
  const name = normalizeText(taskName)
  if (!name) return undefined
  return rules.find((rule) => name.includes(normalizeText(rule.taskType)) || normalizeText(rule.taskType).includes(name))
}

function taskDurationDays(task?: ProjectWbsRuntime | null) {
  const start = toDateInput(task?.plannedStartAt)
  const finish = toDateInput(task?.plannedFinishAt)
  if (!start || !finish) return 1
  const startDate = new Date(`${start}T00:00:00`)
  const finishDate = new Date(`${finish}T00:00:00`)
  if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(finishDate.getTime())) return 1
  return Math.max(1, Math.round((finishDate.getTime() - startDate.getTime()) / 86_400_000) + 1)
}

function shortDate(value?: string | null) {
  return date(value)
}

function compactMoney(value = 0) {
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `${formatQuantity(value / 1_000_000_000, 1)} tỷ`
  if (abs >= 1_000_000) return `${formatQuantity(value / 1_000_000, 1)} triệu`
  return formatCurrencyVnd(value)
}

function projectTrend(value: number) {
  const safe = Math.max(0, Number(value) || 0)
  return [safe * 0.7, safe * 0.78, safe * 0.84, safe * 0.9, safe * 0.96, safe]
}

function emptyRuntime(): ProjectsRuntime {
  return {
    metrics: { totalProjects: 0, activeProjects: 0, planningProjects: 0, completedProjects: 0, contractValue: 0, actualValue: 0, averageProgress: 0, readyComponents: 0, shippedComponents: 0, deliveredComponents: 0, installedComponents: 0 },
    projects: [],
    progress: [],
    materials: [],
    components: [],
    wbs: [],
    financial: [],
    health: [],
    returnRequests: [],
    documents: [],
    logs: [],
    reports: { byStatus: [], byType: [], topByContract: [] },
  }
}
