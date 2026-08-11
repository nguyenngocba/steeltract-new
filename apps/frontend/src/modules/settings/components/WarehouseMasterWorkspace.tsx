import { type ReactNode, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit3, Power, PowerOff, Warehouse } from 'lucide-react'

import { apiErrorMessage } from '@/shared/api/api-error-message'
import { usePermission } from '@/lib/auth/usePermission'
import {
  createMasterDataRecord,
  deactivateMasterDataRecord,
  getMasterDataDependencies,
  getMasterDataRecords,
  updateMasterDataRecord,
  type WarehouseDependencies,
} from '@/modules/master-data/api/master-data.api'
import type {
  MasterDataPayload,
  MasterDataRecord,
} from '@/modules/master-data/types/master-data.types'
import {
  CockpitEmptyState,
  CockpitKpiCard,
  CockpitTableShell,
  DataTablePagination,
} from '@/shared/ui/cockpit'
import { ModuleLoadingState } from '@/shared/ui/modules'
import { formatQuantity } from '@/shared/utils/number-format'
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

type WarehouseForm = {
  code: string
  name: string
  warehouseTypeId: string
  description: string
  displayOrder: string
  active: boolean
  allowReceipt: boolean
  allowIssue: boolean
  allowProduction: boolean
  allowQc: boolean
  allowDispatch: boolean
  allowInstallation: boolean
  allowSupplierReturn: boolean
  allowScrap: boolean
  allowReverse: boolean
  dashboardVisible: boolean
  planningVisible: boolean
  reportingVisible: boolean
}

const emptyForm: WarehouseForm = {
  code: '',
  name: '',
  warehouseTypeId: '',
  description: '',
  displayOrder: '0',
  active: true,
  allowReceipt: false,
  allowIssue: false,
  allowProduction: false,
  allowQc: false,
  allowDispatch: false,
  allowInstallation: false,
  allowSupplierReturn: false,
  allowScrap: false,
  allowReverse: false,
  dashboardVisible: true,
  planningVisible: true,
  reportingVisible: true,
}

const capabilityFields: Array<{
  key: keyof Pick<
    WarehouseForm,
    | 'allowReceipt'
    | 'allowIssue'
    | 'allowProduction'
    | 'allowQc'
    | 'allowDispatch'
    | 'allowInstallation'
    | 'allowSupplierReturn'
    | 'allowScrap'
    | 'allowReverse'
  >
  label: string
}> = [
  { key: 'allowReceipt', label: 'Cho phép nhập kho' },
  { key: 'allowIssue', label: 'Cho phép xuất kho' },
  { key: 'allowProduction', label: 'Cho phép sản xuất' },
  { key: 'allowQc', label: 'Cho phép QC' },
  { key: 'allowDispatch', label: 'Cho phép điều phối' },
  { key: 'allowInstallation', label: 'Cho phép lắp đặt' },
  { key: 'allowSupplierReturn', label: 'Cho phép trả NCC' },
  { key: 'allowScrap', label: 'Cho phép phế liệu' },
  { key: 'allowReverse', label: 'Cho phép luồng hoàn trả' },
]

const visibilityFields: Array<{
  key: keyof Pick<
    WarehouseForm,
    'dashboardVisible' | 'planningVisible' | 'reportingVisible'
  >
  label: string
}> = [
  { key: 'dashboardVisible', label: 'Hiển thị Dashboard' },
  { key: 'planningVisible', label: 'Hiển thị Kế hoạch' },
  { key: 'reportingVisible', label: 'Hiển thị Báo cáo' },
]

const dependencyLabels: Record<
  keyof WarehouseDependencies['dependencies'],
  string
> = {
  inventory: 'Tồn kho theo vị trí',
  locations: 'Vị trí lưu kho',
  reservations: 'Giữ chỗ sản xuất',
  production: 'Nghiệp vụ sản xuất',
  receipts: 'Phiếu nhập',
  issues: 'Phiếu xuất',
  transfers: 'Phiếu điều chuyển',
  dashboardDependencies: 'Snapshot Dashboard',
}

const fieldClass =
  'h-9 w-full rounded-lg border border-cyan-300/15 bg-slate-950/55 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/50'

export function WarehouseMasterWorkspace({
  onClose,
  onChanged,
}: {
  onClose: () => void
  onChanged?: () => void
}) {
  const queryClient = useQueryClient()
  const canEdit = usePermission('settings.edit')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [density, setDensity] = useState<MasterDataDensity>('compact')
  const [view, setView] = useState<MasterDataView>('essential')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState<MasterDataDrawerTab>('overview')
  const [pendingDeactivate, setPendingDeactivate] = useState(false)
  const [editing, setEditing] = useState<MasterDataRecord | null>(null)
  const [form, setForm] = useState<WarehouseForm>(emptyForm)
  const [dependencyReview, setDependencyReview] =
    useState<WarehouseDependencies | null>(null)

  const warehousesQuery = useQuery({
    queryKey: ['master-data-records', 'warehouses'],
    queryFn: () => getMasterDataRecords('warehouses'),
  })
  const typesQuery = useQuery({
    queryKey: ['master-data-records', 'warehouse-types'],
    queryFn: () => getMasterDataRecords('warehouse-types', { active: true }),
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['master-data-records'] })
    queryClient.invalidateQueries({ queryKey: ['inventory-warehouses'] })
    queryClient.invalidateQueries({ queryKey: ['inventory-zones'] })
    queryClient.invalidateQueries({ queryKey: ['system-settings-catalog'] })
    onChanged?.()
  }

  const saveMutation = useMutation({
    mutationFn: (payload: MasterDataPayload) =>
      editing
        ? updateMasterDataRecord({
            domain: 'warehouses',
            id: editing.id,
            payload,
          })
        : createMasterDataRecord({ domain: 'warehouses', payload }),
    onSuccess: () => {
      refresh()
      setEditing(null)
      setForm(emptyForm)
      setDrawerOpen(false)
    },
  })
  const statusMutation = useMutation({
    mutationFn: async ({ row, active }: { row: MasterDataRecord; active: boolean }) => {
      if (!active) return deactivateMasterDataRecord({ domain: 'warehouses', id: row.id })
      return updateMasterDataRecord({
        domain: 'warehouses',
        id: row.id,
        payload: warehousePayload(row, true),
      })
    },
    onSuccess: () => {
      setDependencyReview(null)
      refresh()
    },
  })
  const dependencyMutation = useMutation({
    mutationFn: (id: string) => getMasterDataDependencies('warehouses', id),
    onSuccess: setDependencyReview,
  })

  const rows = useMemo(() => {
    const search = query.trim().toLowerCase()
    return (warehousesQuery.data ?? []).filter((row) => {
      if (status === 'active' && !row.active) return false
      if (status === 'inactive' && row.active) return false
      if (!search) return true
      return `${row.code} ${row.name} ${row.description ?? ''} ${row.warehouseType?.name ?? ''}`
        .toLowerCase()
        .includes(search)
    })
  }, [query, status, warehousesQuery.data])
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize)
  const activeCount = (warehousesQuery.data ?? []).filter((row) => row.active).length
  const usedCount = (warehousesQuery.data ?? []).filter((row) => Number(row.usageCount ?? 0) > 0).length
  const inactiveCount = (warehousesQuery.data ?? []).length - activeCount
  const error =
    saveMutation.error ??
    statusMutation.error ??
    dependencyMutation.error ??
    warehousesQuery.error ??
    typesQuery.error

  const beginEdit = (row: MasterDataRecord) => {
    setEditing(row)
    setForm({
      code: row.code,
      name: row.name,
      warehouseTypeId: row.warehouseTypeId ?? '',
      description: row.description ?? '',
      displayOrder: String(row.displayOrder ?? 0),
      active: row.active,
      allowReceipt: row.allowReceipt ?? false,
      allowIssue: row.allowIssue ?? false,
      allowProduction: row.allowProduction ?? false,
      allowQc: row.allowQc ?? false,
      allowDispatch: row.allowDispatch ?? false,
      allowInstallation: row.allowInstallation ?? false,
      allowSupplierReturn: row.allowSupplierReturn ?? false,
      allowScrap: row.allowScrap ?? false,
      allowReverse: row.allowReverse ?? false,
      dashboardVisible: row.dashboardVisible ?? false,
      planningVisible: row.planningVisible ?? false,
      reportingVisible: row.reportingVisible ?? false,
    })
    setDrawerOpen(true)
    setPendingDeactivate(false)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setEditing(null)
    setForm(emptyForm)
    setDependencyReview(null)
    setPendingDeactivate(false)
    setDrawerTab('overview')
  }

  const selectWarehouse = (row: MasterDataRecord, tab: MasterDataDrawerTab = 'overview') => {
    beginEdit(row)
    setDrawerTab(tab)
    dependencyMutation.mutate(row.id)
  }

  const beginCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setDependencyReview(null)
    setPendingDeactivate(false)
    setDrawerTab('settings')
    setDrawerOpen(true)
  }

  const submit = () => {
    if (!form.code.trim() || !form.name.trim() || !form.warehouseTypeId) return
    saveMutation.mutate({
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      warehouseTypeId: form.warehouseTypeId,
      description: form.description.trim() || undefined,
      displayOrder: Number(form.displayOrder) || 0,
      active: form.active,
      ...Object.fromEntries(
        [...capabilityFields, ...visibilityFields].map(({ key }) => [key, form[key]]),
      ),
    })
  }

  const rowPadding = density === 'compact' ? 'py-1.5' : 'py-2.5'
  const dependencyNodes = dependencyReview
    ? Object.entries(dependencyReview.dependencies).map(([key, count]) => ({
        label: dependencyLabels[key as keyof WarehouseDependencies['dependencies']],
        count,
      }))
    : []

  return (
    <UnifiedMasterDataWorkspace
      title="Warehouse"
      subtitle="Quản lý kho doanh nghiệp"
      onClose={onClose}
      error={error ? apiErrorMessage(error) : undefined}
      kpis={
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <CockpitKpiCard title="Tổng kho" value={formatQuantity(warehousesQuery.data?.length ?? 0, 0)} note="Warehouse Master" icon={<Warehouse size={16} />} tone="blue" className="h-[92px]" />
          <CockpitKpiCard title="Đang hoạt động" value={formatQuantity(activeCount, 0)} note="Có thể sử dụng" icon={<Power size={16} />} tone="emerald" className="h-[92px]" />
          <CockpitKpiCard title="Đang sử dụng" value={formatQuantity(usedCount, 0)} note="Có dữ liệu phụ thuộc" icon={<Warehouse size={16} />} tone="cyan" className="h-[92px]" />
          <CockpitKpiCard title="Ngừng sử dụng" value={formatQuantity(inactiveCount, 0)} note="Không còn hoạt động" icon={<PowerOff size={16} />} tone="amber" className="h-[92px]" />
        </div>
      }
      toolbar={
        <UnifiedMasterDataToolbar
          query={query}
          searchPlaceholder="Tìm mã, tên, loại kho..."
          density={density}
          view={view}
          createLabel="Thêm kho"
          canCreate={canEdit}
          refreshing={warehousesQuery.isFetching || typesQuery.isFetching}
          onQueryChange={(value) => { setQuery(value); setPage(1) }}
          onDensityChange={setDensity}
          onViewChange={setView}
          onRefresh={refresh}
          onCreate={beginCreate}
          onExport={() => exportMasterDataCsv(
            `warehouses-${new Date().toISOString().slice(0, 10)}.csv`,
            ['Mã kho', 'Tên kho', 'Loại kho', 'Capability', 'Sử dụng', 'Trạng thái'],
            rows.map((row) => [row.code, row.name, row.warehouseType?.name, capabilitySummary(row), row.usageCount, row.active ? 'Hoạt động' : 'Ngưng dùng']),
          )}
          filters={
            <select value={status} onChange={(event) => { setStatus(event.target.value as typeof status); setPage(1) }} className={fieldClass}>
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Ngưng sử dụng</option>
            </select>
          }
        />
      }
    >
      <div className="flex h-full min-h-0 flex-col pt-4">
        <CockpitTableShell className="min-h-0 flex-1 overflow-auto rounded-none">
          {warehousesQuery.isLoading ? (
            <ModuleLoadingState label="Đang tải Warehouse Master" />
          ) : rows.length ? (
            <table className={`w-full table-fixed text-xs ${view === 'essential' ? 'min-w-[860px]' : 'min-w-[1080px]'}`}>
              <thead className="sticky top-0 z-10 border-b border-cyan-300/10 bg-[#0b1b2d] text-slate-400">
                <tr>
                  <th className="w-[120px] px-3 py-2 text-left font-medium">Mã kho</th>
                  <th className="px-3 py-2 text-left font-medium">Tên kho</th>
                  <th className="w-[160px] px-3 py-2 text-left font-medium">Loại kho</th>
                  {view === 'complete' ? <th className="w-[260px] px-3 py-2 text-left font-medium">Capability</th> : null}
                  <th className="w-[110px] px-3 py-2 text-right font-medium">Sử dụng</th>
                  <th className="w-[120px] px-3 py-2 text-center font-medium">Trạng thái</th>
                  <th className="w-[90px] px-3 py-2 text-center font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.id} onClick={() => selectWarehouse(row)} className="cursor-pointer border-b border-cyan-300/10 font-medium text-slate-300 hover:bg-cyan-300/[0.055]">
                    <td className={`truncate px-3 ${rowPadding} font-mono font-semibold text-cyan-300`} title={row.code}>{row.code}</td>
                    <td className={`truncate px-3 ${rowPadding} text-white`} title={row.name}>{row.name}</td>
                    <td className={`truncate px-3 ${rowPadding}`} title={row.warehouseType?.name}>{row.warehouseType?.name ?? 'Chưa phân loại'}</td>
                    {view === 'complete' ? <td className={`truncate px-3 ${rowPadding} text-[11px] text-slate-400`} title={capabilitySummary(row)}>{capabilitySummary(row)}</td> : null}
                    <td className={`px-3 ${rowPadding} text-right font-mono text-cyan-200`}>{formatQuantity(row.usageCount ?? 0, 0)}</td>
                    <td className={`px-3 ${rowPadding} text-center`}><Status active={row.active} /></td>
                    <td className={`px-3 ${rowPadding}`}>
                      {canEdit ? <div className="flex justify-center gap-1">
                        <button type="button" title="Sửa kho" onClick={(event) => { event.stopPropagation(); selectWarehouse(row, 'settings') }} className="border border-cyan-300/15 p-1.5 text-cyan-300 hover:bg-cyan-300/10"><Edit3 size={13} /></button>
                        <button type="button" title={row.active ? 'Kiểm tra phụ thuộc' : 'Kích hoạt'} onClick={(event) => { event.stopPropagation(); if (row.active) { selectWarehouse(row, 'dependencies'); setPendingDeactivate(true) } else statusMutation.mutate({ row, active: true }) }} className="border border-cyan-300/15 p-1.5 text-slate-300 hover:bg-cyan-300/10">{row.active ? <PowerOff size={13} /> : <Power size={13} />}</button>
                      </div> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <CockpitEmptyState title="Chưa có Kho nào" description="Tạo Warehouse Master trước khi cấu hình vị trí lưu kho." />
          )}
        </CockpitTableShell>
        {rows.length ? <DataTablePagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={(value) => { setPageSize(value); setPage(1) }} pageSizeOptions={[10, 20, 50]} /> : null}
      </div>

      <UnifiedMasterDataDrawer
        open={drawerOpen}
        title={editing ? `${editing.code} · ${editing.name}` : 'Thêm kho'}
        subtitle="MasterWarehouse · MasterWarehouseType"
        activeTab={drawerTab}
        onTabChange={setDrawerTab}
        onClose={closeDrawer}
      >
        {drawerTab === 'overview' && editing ? (
          <div className="grid gap-3 md:grid-cols-2">
            <Summary label="Loại kho" value={0} textValue={editing.warehouseType?.name ?? 'Chưa phân loại'} />
            <Summary label="Số tham chiếu" value={Number(editing.usageCount ?? 0)} />
            <section className="md:col-span-2"><FormSection title="Capability"><p className="text-xs font-medium text-slate-300">{capabilitySummary(editing)}</p></FormSection></section>
          </div>
        ) : drawerTab === 'dependencies' && editing ? (
          <div className="space-y-4">
            {dependencyMutation.isPending ? <ModuleLoadingState label="Đang kiểm tra phụ thuộc" /> : <MasterDataDependencyTree nodes={dependencyNodes} />}
            <section className="border border-amber-400/20 bg-amber-400/[0.055] p-4">
              <p className="text-xs font-medium text-slate-300">{dependencyReview?.canDeactivate ? 'Kho không còn phụ thuộc và có thể ngưng sử dụng.' : 'Không thể ngưng sử dụng khi kho còn dữ liệu phụ thuộc.'}</p>
              {pendingDeactivate && dependencyReview?.canDeactivate ? <div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => setPendingDeactivate(false)} className="border border-white/10 px-3 py-2 text-xs text-slate-300">Hủy</button><button type="button" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ row: editing, active: false })} className="bg-amber-600 px-3 py-2 text-xs font-semibold text-white">Ngưng sử dụng</button></div> : null}
            </section>
          </div>
        ) : drawerTab === 'history' ? (
          <section className="border border-cyan-300/15 bg-slate-950/35 p-4 text-xs text-slate-400">API Warehouse Master hiện không cung cấp audit timeline riêng. Workspace không tạo lịch sử giả.</section>
        ) : drawerTab === 'settings' ? (
          <WarehouseFormPanel form={form} setForm={setForm} editing={editing} types={typesQuery.data ?? []} canEdit={canEdit} saving={saveMutation.isPending} onSubmit={submit} onCancel={closeDrawer} />
        ) : (
          <CockpitEmptyState title="Chọn một kho" description="Chọn dòng dữ liệu để xem chi tiết." />
        )}
      </UnifiedMasterDataDrawer>
    </UnifiedMasterDataWorkspace>
  )
}

function WarehouseFormPanel({ form, setForm, editing, types, canEdit, saving, onSubmit, onCancel }: { form: WarehouseForm; setForm: (value: WarehouseForm) => void; editing: MasterDataRecord | null; types: MasterDataRecord[]; canEdit: boolean; saving: boolean; onSubmit: () => void; onCancel: () => void }) {
  const valid = Boolean(form.code.trim() && form.name.trim() && form.warehouseTypeId)
  return <aside className="min-h-0 overflow-y-auto p-3">
    <div className="mb-3 flex items-center gap-2"><Warehouse size={17} className="text-cyan-300" /><div><h3 className="text-sm font-semibold text-white">{editing ? `Sửa kho: ${editing.code}` : 'Thêm Kho mới'}</h3><p className="text-xs text-slate-500">Capability điều khiển hành vi; code chỉ là định danh.</p></div></div>
    <FormSection title="Thông tin cơ bản">
      <LabeledInput label="Mã kho *"><input aria-label="Mã kho *" value={form.code} disabled={Boolean(editing)} onChange={(event) => setForm({ ...form, code: event.target.value })} className={fieldClass} /></LabeledInput>
      <LabeledInput label="Tên kho *"><input aria-label="Tên kho *" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={fieldClass} /></LabeledInput>
      <LabeledInput label="Loại kho *"><select aria-label="Loại kho *" value={form.warehouseTypeId} onChange={(event) => setForm({ ...form, warehouseTypeId: event.target.value })} className={fieldClass}><option value="">Chọn loại kho</option>{types.map((type) => <option key={type.id} value={type.id}>{type.code} - {type.name}</option>)}</select></LabeledInput>
      <LabeledInput label="Thứ tự hiển thị"><input aria-label="Thứ tự hiển thị" type="number" min={0} value={form.displayOrder} onChange={(event) => setForm({ ...form, displayOrder: event.target.value })} className={fieldClass} /></LabeledInput>
      <LabeledInput label="Mô tả"><textarea aria-label="Mô tả kho" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={`${fieldClass} h-20 py-2`} /></LabeledInput>
    </FormSection>
    <FormSection title="Capability vận hành"><div className="grid grid-cols-2 gap-2">{capabilityFields.map(({ key, label }) => <Toggle key={key} label={label} checked={form[key]} onChange={(checked) => setForm({ ...form, [key]: checked })} />)}</div></FormSection>
    <FormSection title="Hiển thị"><div className="grid gap-2">{visibilityFields.map(({ key, label }) => <Toggle key={key} label={label} checked={form[key]} onChange={(checked) => setForm({ ...form, [key]: checked })} />)}</div></FormSection>
    {canEdit ? <div className="sticky bottom-0 flex justify-end gap-2 border-t border-cyan-300/10 bg-[#071321] py-3"><button type="button" onClick={onCancel} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300">Hủy</button><button type="button" disabled={!valid || saving} onClick={onSubmit} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40">{saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Tạo Kho'}</button></div> : null}
  </aside>
}

function warehousePayload(row: MasterDataRecord, active: boolean): MasterDataPayload {
  return {
    code: row.code,
    name: row.name,
    description: row.description ?? undefined,
    active,
    warehouseTypeId: row.warehouseTypeId ?? undefined,
    displayOrder: row.displayOrder ?? 0,
    ...Object.fromEntries([...capabilityFields, ...visibilityFields].map(({ key }) => [key, row[key] === true])),
  }
}

function capabilitySummary(row: MasterDataRecord) {
  const labels = capabilityFields.filter(({ key }) => row[key]).map(({ label }) => label.replace('Cho phép ', ''))
  return labels.length ? labels.slice(0, 3).join(' · ') + (labels.length > 3 ? ` +${labels.length - 3}` : '') : 'Chưa cấu hình'
}

function Summary({ label, value, textValue }: { label: string; value: number; textValue?: string }) { return <div className="border border-cyan-300/10 bg-slate-950/30 px-3 py-2 text-xs"><span className="text-slate-500">{label}</span><strong className="float-right font-medium text-cyan-200">{textValue ?? formatQuantity(value, 0)}</strong></div> }
function Status({ active }: { active: boolean }) { return <span className={`rounded-md border px-2 py-0.5 text-[10px] ${active ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-slate-500/20 bg-slate-500/10 text-slate-400'}`}>{active ? 'Hoạt động' : 'Ngưng dùng'}</span> }
function FormSection({ title, children }: { title: string; children: ReactNode }) { return <section className="mb-3 rounded-lg border border-cyan-300/10 bg-slate-950/25 p-3"><h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-300">{title}</h4><div className="space-y-2">{children}</div></section> }
function LabeledInput({ label, children }: { label: string; children: ReactNode }) { return <label className="block text-xs text-slate-400"><span className="mb-1 block font-medium text-slate-300">{label}</span>{children}</label> }
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) { return <label className="flex min-h-9 items-center gap-2 rounded-lg border border-cyan-300/10 bg-slate-950/35 px-2 text-xs text-slate-300"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="accent-cyan-500" />{label}</label> }
