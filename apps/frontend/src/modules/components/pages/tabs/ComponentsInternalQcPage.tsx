import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileText,
  History,
  ListChecks,
  RotateCcw,
  Search,
  ShieldAlert,
  XCircle,
} from 'lucide-react'

import { EnterpriseModulePage } from '@/shared/runtime-tabs/EnterpriseModulePage'
import { CockpitKpiCard, EnterpriseKpiCard } from '../../../../shared/ui/cockpit'
import { ModuleDetailDrawer, ModuleEmptyState, ModuleLoadingState } from '../../../../shared/ui/modules'
import {
  InventoryPagination,
  InventoryPanel,
  inventoryTableHead,
  inventoryTableRow,
} from '../../../inventory/components/InventoryVisuals'
import { formatQuantity } from '@/shared/utils/number-format'
import {
  useQcComponentInstances,
} from '../../../qc/hooks/useQcWorkspace'
import type {
  QcComponentInstance,
  QcInspectionForInstance,
  QcNcrForInstance,
  QcResultRow,
} from '../../../qc/api/qc.api'

type DetailTab = 'overview' | 'inspection' | 'checklist' | 'ncr' | 'disposition' | 'history'

const pageSize = 14

const detailTabs: Array<{ key: DetailTab; label: string }> = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'inspection', label: 'Inspection' },
  { key: 'checklist', label: 'Checklist' },
  { key: 'ncr', label: 'NCR' },
  { key: 'disposition', label: 'Disposition' },
  { key: 'history', label: 'History' },
]

const stateLabels: Record<string, string> = {
  PRODUCED_WAITING_QC: 'Chờ QC',
  QC_PASSED: 'Đạt',
  QC_FAILED: 'Không đạt',
  REWORK: 'Làm lại',
  USE_AS_IS: 'Dùng có điều kiện',
  SCRAPPED: 'Loại bỏ',
}

const stateTones: Record<string, string> = {
  PRODUCED_WAITING_QC: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  QC_PASSED: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  QC_FAILED: 'border-red-400/30 bg-red-400/10 text-red-300',
  REWORK: 'border-purple-400/30 bg-purple-400/10 text-purple-300',
  USE_AS_IS: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300',
  SCRAPPED: 'border-red-400/30 bg-red-400/10 text-red-300',
}

function stateLabel(state?: string) {
  return state ? stateLabels[state] ?? state : '-'
}

function stateTone(state?: string) {
  return state ? stateTones[state] ?? 'border-slate-500/30 bg-slate-500/10 text-slate-300' : 'border-slate-500/30 bg-slate-500/10 text-slate-300'
}

function date(value?: string | null) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleString('vi-VN')
}

function latestFinalInspection(instance: QcComponentInstance) {
  return (instance.qcInspections ?? []).find((inspection) => inspection.checklist?.type === 'FINAL')
}

function latestNcr(instance: QcComponentInstance) {
  return instance.ncrs?.[0] ?? latestFinalInspection(instance)?.ncrs?.[0]
}

function canonicalDisposition(instance: QcComponentInstance, ncr?: QcNcrForInstance) {
  if (instance.state === 'QC_PASSED') return 'PASS'
  if (instance.state === 'QC_FAILED') return 'FAIL'
  if (instance.state === 'USE_AS_IS') return 'USE-AS-IS'
  if (instance.state === 'REWORK') return 'REWORK'
  if (instance.state === 'SCRAPPED') return 'SCRAP'
  return ncr?.disposition?.replace(/_/g, '-') ?? 'Chờ quyết định'
}

function requiredChecklistItems(inspection?: QcInspectionForInstance) {
  return inspection?.checklist?.items?.filter((item) => item.required) ?? []
}

function completedChecklistResults(inspection?: QcInspectionForInstance) {
  const requiredIds = new Set(requiredChecklistItems(inspection).map((item) => item.id))
  return (inspection?.results ?? []).filter((result) => {
    if (result.status === 'PENDING') return false
    return result.checklistItemId ? requiredIds.has(result.checklistItemId) : false
  })
}

function isFinalChecklistCompleted(inspection?: QcInspectionForInstance) {
  const required = requiredChecklistItems(inspection)
  if (!inspection || !required.length) return false
  return completedChecklistResults(inspection).length >= required.length
}

function resultForItem(itemId: string, results?: QcResultRow[]) {
  return results?.find((result) => result.checklistItemId === itemId)
}

export function ComponentsInternalQcPage() {
  return (
    <EnterpriseModulePage>
      <CanonicalPhysicalQcWorkspace />
    </EnterpriseModulePage>
  )
}

export function CanonicalPhysicalQcWorkspace() {
  const [query, setQuery] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [selectedRow, setSelectedRow] = useState<QcComponentInstance | null>(null)
  const [activeTab, setActiveTab] = useState<DetailTab>('overview')
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)

  const params = useMemo(() => ({
    qcScope: true,
    page,
    limit: pageSize,
    search: query || undefined,
    state: status || undefined,
  }), [page, query, status])
  const { data, isLoading, isError } = useQcComponentInstances(params)
  const rows = data?.data ?? []
  const summary = data?.summary ?? {
    waitingQc: 0,
    passed: 0,
    failed: 0,
    rework: 0,
    useAsIs: 0,
    scrap: 0,
  }
  const total = data?.meta.total ?? 0
  const pageCount = Math.max(1, data?.meta.totalPages ?? 1)

  function applySearch() {
    setQuery(searchDraft.trim())
    setPage(1)
  }

  function resetFilters() {
    setSearchDraft('')
    setQuery('')
    setStatus('')
    setPage(1)
  }

  function openDetail(row: QcComponentInstance) {
    setSelectedRow(row)
    setActiveTab('overview')
    setExpandedModalOpen(false)
  }

  const table = (
    <div className="h-[430px] overflow-auto scrollbar-none rounded-lg border border-white/10">
      <table className="w-full min-w-[1120px] table-fixed text-sm">
        <thead
          className={`${inventoryTableHead} sticky top-0 z-10 border-b border-cyan-400/10 text-slate-300`}
          style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
        >
          <tr>
            {['Instance', 'Component', 'Project', 'Production Order', 'Inspection', 'Result', 'Disposition', 'Status', 'Action'].map((heading) => (
              <th key={heading} className="px-3 py-2 text-left text-xs font-semibold text-slate-300">{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={9} className="px-3 py-8 text-center"><ModuleLoadingState label="Đang tải QC physical instances..." /></td></tr>
          ) : rows.length ? rows.map((row) => {
            const inspection = latestFinalInspection(row)
            const ncr = latestNcr(row)
            return (
              <tr key={row.id} onClick={() => openDetail(row)} className={`cursor-pointer ${inventoryTableRow}`}>
                <td className="truncate px-3 py-1.5 font-mono text-xs font-semibold text-cyan-300">{row.instanceNo}</td>
                <td className="truncate px-3 py-1.5 text-white font-medium">{row.component ? `${row.component.code} · ${row.component.name}` : '-'}</td>
                <td className="truncate px-3 py-1.5 text-slate-300">{row.project ? `${row.project.code} - ${row.project.name}` : '-'}</td>
                <td className="truncate px-3 py-1.5 font-mono text-xs text-cyan-300">{row.productionOrder?.orderNo ?? '-'}</td>
                <td className="truncate px-3 py-1.5 font-mono text-xs text-slate-300">{inspection?.inspectionNo ?? 'Chưa tạo'}</td>
                <td className="px-3 py-1.5 text-xs text-slate-300">{inspection?.status ? stateLabel(row.state) : 'Chờ inspection'}</td>
                <td className="truncate px-3 py-1.5 text-xs font-semibold text-slate-200">{canonicalDisposition(row, ncr)}</td>
                <td className="px-3 py-1.5">
                  <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-medium ${stateTone(row.state)}`}>
                    {stateLabel(row.state)}
                  </span>
                </td>
                <td className="px-3 py-1.5">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      openDetail(row)
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.055] px-2 py-1 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-200"
                  >
                    <Eye size={13} />
                    Chi tiết
                  </button>
                </td>
              </tr>
            )
          }) : (
            <tr>
              <td colSpan={9} className="px-3 py-10">
                <ModuleEmptyState icon={<ClipboardCheck size={18} />} title="Chưa có physical instance trong QC" description="QC chỉ hiển thị ComponentInstance thuộc luồng final inspection." />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )

  return (
    <>
      <div className="w-full min-w-0 flex-1 space-y-1 -mt-2">
        <div className="grid grid-cols-1 gap-1 md:grid-cols-3 xl:grid-cols-6">
          <EnterpriseKpiCard title="Waiting QC" value={formatQuantity(summary.waitingQc, 0)} tone="amber" icon={<ClipboardCheck size={15} />} isLoading={isLoading} />
          <EnterpriseKpiCard title="Passed" value={formatQuantity(summary.passed, 0)} tone="emerald" icon={<CheckCircle2 size={15} />} isLoading={isLoading} />
          <EnterpriseKpiCard title="Failed" value={formatQuantity(summary.failed, 0)} tone="red" icon={<XCircle size={15} />} isLoading={isLoading} />
          <EnterpriseKpiCard title="Rework" value={formatQuantity(summary.rework, 0)} tone="purple" icon={<RotateCcw size={15} />} isLoading={isLoading} />
          <EnterpriseKpiCard title="Use-As-Is" value={formatQuantity(summary.useAsIs, 0)} tone="cyan" icon={<CheckCircle2 size={15} />} isLoading={isLoading} />
          <EnterpriseKpiCard title="Scrap" value={formatQuantity(summary.scrap, 0)} tone="red" icon={<ShieldAlert size={15} />} isLoading={isLoading} />
        </div>

        <InventoryPanel className="rounded-xl -mt-1">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_220px_130px_120px]">
            <div className="relative flex items-center">
              <Search size={14} className="pointer-events-none absolute left-3 text-slate-400" />
              <input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') applySearch()
                }}
                placeholder="Tìm instance, cấu kiện, dự án, production order..."
                className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
              />
            </div>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value)
                setPage(1)
              }}
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
            >
              <option value="">Trạng thái: Tất cả</option>
              <option value="PRODUCED_WAITING_QC">Chờ QC</option>
              <option value="QC_PASSED">Đạt</option>
              <option value="QC_FAILED">Không đạt</option>
              <option value="REWORK">Làm lại</option>
              <option value="USE_AS_IS">Use-As-Is</option>
              <option value="SCRAPPED">Scrap</option>
            </select>
            <button type="button" onClick={applySearch} className="h-9 self-end rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500">
              Tìm kiếm
            </button>
            <button type="button" onClick={resetFilters} className="h-9 self-end rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10">
              Làm mới
            </button>
          </div>
        </InventoryPanel>

        {isError ? (
          <ModuleEmptyState icon={<ShieldAlert size={18} />} title="Không thể tải QC physical instances" description="Kiểm tra kết nối hoặc quyền truy cập Components/QC." />
        ) : (
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-12 items-start">
            <div className="xl:col-span-9">
              <InventoryPanel className="rounded-xl">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Canonical Physical QC Queue</h3>
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
                      {total} instances
                    </span>
                  </div>
                  <button type="button" onClick={() => setExpandedModalOpen(true)} className="text-xs font-semibold text-cyan-300 transition hover:text-cyan-200">
                    Xem tất cả
                  </button>
                </div>
                {table}
                <InventoryPagination page={page} pageSize={pageSize} pageCount={pageCount} total={total} onPageChange={setPage} containerClassName="border-t-0" />
              </InventoryPanel>
            </div>

            <div className="space-y-1 xl:col-span-3">
              <InventoryPanel className="h-[170px] rounded-xl">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-white">Final checklist</h3>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between gap-2"><span>Chờ inspection</span><span className="font-mono text-amber-300">{formatQuantity(rows.filter((row) => !latestFinalInspection(row)).length, 0)}</span></div>
                  <div className="flex justify-between gap-2"><span>Checklist hoàn tất</span><span className="font-mono text-emerald-300">{formatQuantity(rows.filter((row) => isFinalChecklistCompleted(latestFinalInspection(row))).length, 0)}</span></div>
                  <div className="flex justify-between gap-2"><span>Còn thiếu kết quả</span><span className="font-mono text-red-300">{formatQuantity(rows.filter((row) => latestFinalInspection(row) && !isFinalChecklistCompleted(latestFinalInspection(row))).length, 0)}</span></div>
                </div>
              </InventoryPanel>
              <InventoryPanel className="h-[170px] rounded-xl">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-white">NCR gần đây</h3>
                <div className="space-y-1">
                  {rows.flatMap((row) => row.ncrs ?? []).slice(0, 5).map((ncr) => (
                    <div key={ncr.id} className="flex justify-between gap-2 text-xs text-slate-300">
                      <span className="truncate font-mono text-red-300">{ncr.ncrNo}</span>
                      <span className="shrink-0">{ncr.status}</span>
                    </div>
                  ))}
                  {!rows.flatMap((row) => row.ncrs ?? []).length ? <ModuleEmptyState icon={<ShieldAlert size={18} />} title="Chưa có NCR" description="Không có NCR gắn với physical instance trong trang hiện tại." /> : null}
                </div>
              </InventoryPanel>
              <InventoryPanel className="h-[170px] rounded-xl">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-white">Lineage gần đây</h3>
                <div className="space-y-1">
                  {rows.slice(0, 5).map((row) => (
                    <div key={row.id} className="flex justify-between gap-2 text-xs text-slate-300">
                      <span className="truncate font-mono text-cyan-300">{row.instanceNo}</span>
                      <span className="shrink-0">{row.productionOrder?.orderNo ?? '-'}</span>
                    </div>
                  ))}
                  {!rows.length ? <ModuleEmptyState icon={<History size={18} />} title="Chưa có lineage" description="Không có instance trong bộ lọc hiện tại." /> : null}
                </div>
              </InventoryPanel>
            </div>
          </div>
        )}
      </div>

      {expandedModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Toàn bộ physical QC queue</h2>
                <p className="text-xs text-slate-400">Endpoint canonical: /components/foundation/instances?qcScope=true</p>
              </div>
              <button type="button" onClick={() => setExpandedModalOpen(false)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">
                Đóng
              </button>
            </div>
            {table}
            <InventoryPagination page={page} pageSize={pageSize} pageCount={pageCount} total={total} onPageChange={setPage} containerClassName="border-t-0" />
          </div>
        </div>
      ) : null}

      <ModuleDetailDrawer
        open={Boolean(selectedRow)}
        title={selectedRow ? `QC Physical Instance · ${selectedRow.instanceNo}` : 'Chi tiết QC'}
        subtitle={selectedRow ? `${selectedRow.component?.code ?? '-'} · ${selectedRow.project?.code ?? '-'}` : undefined}
        onClose={() => setSelectedRow(null)}
        widthClass="w-screen md:w-[64vw] md:min-w-[980px] md:max-w-[1320px]"
        tabs={detailTabs.map((tab) => ({ id: tab.key, label: tab.label }))}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as DetailTab)}
      >
        {selectedRow ? (
          <PhysicalQcDetail row={selectedRow} activeTab={activeTab} />
        ) : null}
      </ModuleDetailDrawer>
    </>
  )
}

function PhysicalQcDetail({
  row,
  activeTab,
}: {
  row: QcComponentInstance
  activeTab: DetailTab
}) {
  const inspection = latestFinalInspection(row)
  const ncr = latestNcr(row)
  const checklistCompleted = isFinalChecklistCompleted(inspection)
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <CockpitKpiCard title="Instance" value={row.instanceNo} state="normal" tone="cyan" />
        <CockpitKpiCard title="Result" value={inspection?.status ?? stateLabel(row.state)} state="normal" tone={row.state === 'QC_PASSED' ? 'emerald' : row.state === 'QC_FAILED' || row.state === 'SCRAPPED' ? 'red' : 'amber'} />
        <CockpitKpiCard title="Disposition" value={canonicalDisposition(row, ncr)} state="normal" tone="purple" />
        <CockpitKpiCard title="Checklist" value={checklistCompleted ? 'Hoàn tất' : 'Chưa đủ'} state={checklistCompleted ? 'normal' : 'alert'} tone={checklistCompleted ? 'emerald' : 'amber'} />
      </div>
      {activeTab === 'overview' ? <OverviewTab row={row} inspection={inspection} ncr={ncr} /> : null}
      {activeTab === 'inspection' ? <InspectionTab inspection={inspection} /> : null}
      {activeTab === 'checklist' ? <ChecklistTab inspection={inspection} /> : null}
      {activeTab === 'ncr' ? <NcrDetailTab ncr={ncr} /> : null}
      {activeTab === 'disposition' ? <DispositionTab row={row} inspection={inspection} ncr={ncr} /> : null}
      {activeTab === 'history' ? <HistoryTab row={row} /> : null}
    </div>
  )
}

function OverviewTab({ row, inspection, ncr }: { row: QcComponentInstance; inspection?: QcInspectionForInstance; ncr?: QcNcrForInstance }) {
  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <InfoPanel title="Physical lineage" rows={[
        ['Instance', row.instanceNo],
        ['Component', row.component ? `${row.component.code} · ${row.component.name}` : '-'],
        ['Project', row.project ? `${row.project.code} - ${row.project.name}` : '-'],
        ['Production Order', row.productionOrder ? `${row.productionOrder.orderNo} · ${row.productionOrder.title}` : '-'],
        ['Requirement', row.requirement ? `${row.requirement.requirementNo} · SL ${formatQuantity(row.requirement.requiredQuantity, 0)}` : '-'],
        ['Produced At', date(row.producedAt)],
      ]} />
      <InfoPanel title="QC state" rows={[
        ['Physical status', stateLabel(row.state)],
        ['Final inspection', inspection?.inspectionNo ?? 'Chưa tạo'],
        ['Inspection status', inspection?.status ?? '-'],
        ['Disposition', canonicalDisposition(row, ncr)],
        ['NCR', ncr ? `${ncr.ncrNo} · ${ncr.status}` : 'Không có'],
        ['Updated', date(row.updatedAt)],
      ]} />
    </div>
  )
}

function InspectionTab({ inspection }: { inspection?: QcInspectionForInstance }) {
  if (!inspection) {
    return <ModuleEmptyState icon={<ClipboardCheck size={18} />} title="Chưa có FINAL inspection" description="Physical instance này chưa có phiếu kiểm tra FINAL authoritative." />
  }
  return <InfoPanel title="Final inspection" rows={[
    ['Inspection No', inspection.inspectionNo],
    ['Checklist', inspection.checklist ? `${inspection.checklist.code} · ${inspection.checklist.name}` : '-'],
    ['Checklist Type', inspection.checklist?.type ?? '-'],
    ['Status', inspection.status],
    ['Started At', date(inspection.startedAt)],
    ['Completed At', date(inspection.completedAt)],
    ['Approved At', date(inspection.approvedAt)],
    ['Rejected At', date(inspection.rejectedAt)],
    ['Rejection Reason', inspection.rejectionReason ?? '-'],
  ]} />
}

function ChecklistTab({ inspection }: { inspection?: QcInspectionForInstance }) {
  const items = requiredChecklistItems(inspection)
  if (!inspection?.checklist) {
    return <ModuleEmptyState icon={<ListChecks size={18} />} title="Chưa có checklist FINAL" description="Không có checklist FINAL gắn với inspection của instance này." />
  }
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035]">
      <div className="border-b border-white/10 px-4 py-3">
        <div className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-300">{inspection.checklist.code} · {inspection.checklist.name}</div>
        <div className="mt-1 text-xs text-slate-500">Revision {inspection.checklist.revision} · {completedChecklistResults(inspection).length}/{items.length} tiêu chí bắt buộc hoàn tất</div>
      </div>
      <div className="max-h-[360px] overflow-auto">
        <table className="w-full min-w-[780px] text-xs">
          <thead className="bg-white/[0.04] text-slate-400">
            <tr>{['#', 'Tiêu chí', 'Kỳ vọng', 'Kết quả', 'Ghi chú'].map((head) => <th key={head} className="px-3 py-2 text-left font-semibold">{head}</th>)}</tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const result = resultForItem(item.id, inspection.results)
              return (
                <tr key={item.id} className="border-t border-white/10">
                  <td className="px-3 py-2 font-mono text-slate-400">{item.sequence}</td>
                  <td className="px-3 py-2 text-white">{item.title}</td>
                  <td className="px-3 py-2 text-slate-300">{item.expectedValue ?? '-'}</td>
                  <td className="px-3 py-2"><span className={`rounded-lg border px-2 py-0.5 ${result?.status === 'PASS' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : result?.status === 'FAIL' ? 'border-red-400/30 bg-red-400/10 text-red-300' : 'border-amber-400/30 bg-amber-400/10 text-amber-300'}`}>{result?.status ?? 'PENDING'}</span></td>
                  <td className="px-3 py-2 text-slate-400">{result?.notes ?? '-'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function NcrDetailTab({ ncr }: { ncr?: QcNcrForInstance }) {
  if (!ncr) {
    return <ModuleEmptyState icon={<ShieldAlert size={18} />} title="Không có NCR" description="Instance này chưa có NCR canonical." />
  }
  return <InfoPanel title="NCR" rows={[
    ['NCR', ncr.ncrNo],
    ['Disposition', ncr.disposition ?? '-'],
    ['Root Cause', ncr.rootCause ?? '-'],
    ['Corrective Action', ncr.correctiveAction ?? '-'],
    ['Status', ncr.status],
    ['Severity', ncr.severity],
    ['Title', ncr.title],
    ['Updated', date(ncr.updatedAt)],
  ]} />
}

function DispositionTab({ row, inspection, ncr }: { row: QcComponentInstance; inspection?: QcInspectionForInstance; ncr?: QcNcrForInstance }) {
  const checklistCompleted = isFinalChecklistCompleted(inspection)
  return (
    <div className="space-y-3">
      <InfoPanel title="Canonical disposition" rows={[
        ['Allowed dispositions', 'PASS / FAIL / USE-AS-IS / REWORK / SCRAP'],
        ['Current disposition', canonicalDisposition(row, ncr)],
        ['Checklist FINAL completed', checklistCompleted ? 'Có' : 'Không'],
        ['Decision source', inspection ? `Inspection ${inspection.inspectionNo}` : 'Chưa có inspection'],
      ]} />
      <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
        <div className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-cyan-300">Decision controls</div>
        <div className="flex flex-wrap gap-2">
          {['PASS', 'FAIL', 'USE-AS-IS', 'REWORK', 'SCRAP'].map((label) => (
            <button
              key={label}
              type="button"
              disabled
              title={checklistCompleted ? 'Command wiring is handled by QC canonical command workspace.' : 'Checklist FINAL chưa hoàn tất.'}
              className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-semibold text-slate-500 disabled:cursor-not-allowed"
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Components/QC không tự quyết định từ Component hoặc ProductionOrder. Quyết định chỉ được phép khi FINAL checklist có đủ kết quả và đi qua QC command contract.
        </p>
      </div>
    </div>
  )
}

function HistoryTab({ row }: { row: QcComponentInstance }) {
  const events = row.timeline ?? []
  if (!events.length) {
    return <ModuleEmptyState icon={<History size={18} />} title="Chưa có history" description="ComponentInstance chưa có timeline canonical." />
  }
  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div key={event.id} className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-xs">
          <div className="flex justify-between gap-3">
            <span className="font-semibold text-white">{event.eventType}</span>
            <span className="font-mono text-slate-400">{date(event.occurredAt)}</span>
          </div>
          <div className="mt-1 text-slate-500">{event.sourceModule}{event.sourceId ? ` · ${event.sourceId}` : ''}</div>
        </div>
      ))}
    </div>
  )
}

function InfoPanel({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4 text-xs">
      <div className="mb-3 font-semibold uppercase tracking-wider text-cyan-300">{title}</div>
      <div className="space-y-2">
        {rows.map(([key, value]) => (
          <div key={key} className="flex justify-between gap-4 border-b border-white/5 pb-1.5 text-slate-300 last:border-0">
            <span>{key}</span>
            <span className="min-w-0 max-w-[65%] truncate text-right font-medium text-white">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
