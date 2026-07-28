import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  Layers,
  PackageCheck,
  ShieldCheck,
} from 'lucide-react'

import { useProjectsQuery } from '@/hooks/query/useProjectQueries'
import { EnterpriseModulePage } from '@/shared/runtime-tabs/EnterpriseModulePage'
import {
  ModuleDetailDrawer,
  ModuleEmptyState,
  ModuleLoadingState,
} from '../../../../shared/ui/modules'
import { CockpitKpiCard, EnterpriseKpiCard } from '../../../../shared/ui/cockpit'
import {
  InventoryChartCard,
  InventoryPagination,
  InventoryPanel,
  inventoryTableHead,
  inventoryTableRow,
} from '../../../inventory/components/InventoryVisuals'
import {
  useComponentsWorkspace,
  useFinishedGoodsInstances,
} from '../../hooks/queries/useComponents'
import type { FinishedGoodsInstanceRow } from '../../api/contracts/components.contract'
import { formatQuantity } from '@/shared/utils/number-format'

const PAGE_SIZE = 14

const stateBadgeTone: Record<string, string> = {
  QC_PASSED: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  USE_AS_IS: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300',
}

const stateLabel: Record<string, string> = {
  QC_PASSED: 'Đạt QC',
  USE_AS_IS: 'Chấp nhận sử dụng',
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('vi-VN')
}

function projectLabel(row: FinishedGoodsInstanceRow) {
  if (!row.project) return '-'
  return [row.project.code, row.project.name].filter(Boolean).join(' - ')
}

function componentLabel(row: FinishedGoodsInstanceRow) {
  return `${row.component.code} · ${row.component.name}`
}

function qualityEvidence(row: FinishedGoodsInstanceRow) {
  const inspection = row.qcInspections?.[0]
  if (inspection) {
    return inspection.inspectionNo
  }
  const ncr = row.ncrs?.[0]
  if (ncr) {
    return `${ncr.ncrNo} · Use-As-Is`
  }
  return '-'
}

function locationLabel(row: FinishedGoodsInstanceRow) {
  if (row.installedAt) return 'Đã lắp đặt'
  return 'Chưa gán bãi'
}

export function ComponentsStockPage() {
  const [instanceCode, setInstanceCode] = useState('')
  const [instanceCodeDraft, setInstanceCodeDraft] = useState('')
  const [projectId, setProjectId] = useState('')
  const [componentId, setComponentId] = useState('')
  const [page, setPage] = useState(1)
  const [selectedRow, setSelectedRow] =
    useState<FinishedGoodsInstanceRow | null>(null)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)

  const { data: projects = [] } = useProjectsQuery()
  const { data: componentOptions } = useComponentsWorkspace({
    page: 1,
    limit: 200,
    sortBy: 'code',
    sortOrder: 'asc',
  })

  const queryParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      instanceCode: instanceCode || undefined,
      projectId: projectId || undefined,
      componentId: componentId || undefined,
    }),
    [componentId, instanceCode, page, projectId],
  )

  const {
    data: finishedGoods,
    isLoading,
    isError,
  } = useFinishedGoodsInstances(queryParams)

  const rows = finishedGoods?.data ?? []
  const meta = finishedGoods?.meta ?? {
    page,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  }
  const summary = finishedGoods?.summary ?? {
    total: 0,
    qcPassed: 0,
    useAsIs: 0,
    projectCount: 0,
  }

  useEffect(() => {
    setPage(1)
  }, [componentId, instanceCode, projectId])

  function applySearch() {
    setInstanceCode(instanceCodeDraft.trim())
  }

  function resetFilters() {
    setInstanceCode('')
    setInstanceCodeDraft('')
    setProjectId('')
    setComponentId('')
    setPage(1)
  }

  const tableRows = rows

  return (
    <EnterpriseModulePage>
      <div className="w-full min-w-0 flex-1 space-y-1 -mt-2">
        <div className="grid grid-cols-1 gap-1 md:grid-cols-4">
          <EnterpriseKpiCard
            title="Cấu kiện thành phẩm"
            value={formatQuantity(summary.total, 0)}
            tone="blue"
            icon={<PackageCheck size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Đạt QC"
            value={formatQuantity(summary.qcPassed, 0)}
            tone="emerald"
            icon={<CheckCircle2 size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Chấp nhận sử dụng"
            value={formatQuantity(summary.useAsIs, 0)}
            tone="cyan"
            icon={<ShieldCheck size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Theo công trình"
            value={formatQuantity(summary.projectCount, 0)}
            tone="purple"
            icon={<Layers size={15} />}
            isLoading={isLoading}
          />
        </div>

        <InventoryPanel className="rounded-xl -mt-1">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_220px_240px_130px_120px]">
            <input
              value={instanceCodeDraft}
              onChange={(event) => setInstanceCodeDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') applySearch()
              }}
              placeholder="Tìm mã cấu kiện vật lý..."
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
            />
            <select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
            >
              <option value="">Công trình: Tất cả</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} - {project.name}
                </option>
              ))}
            </select>
            <select
              value={componentId}
              onChange={(event) => setComponentId(event.target.value)}
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
            >
              <option value="">Hồ sơ cấu kiện: Tất cả</option>
              {(componentOptions?.data ?? []).map((component) => (
                <option key={component.id} value={component.id}>
                  {component.code} - {component.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={applySearch}
              className="h-9 self-end rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
            >
              Tìm kiếm
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="h-9 self-end rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Làm mới
            </button>
          </div>
        </InventoryPanel>

        <div className="grid grid-cols-12 gap-1 items-start">
          <div className="col-span-12 xl:col-span-9">
            <InventoryPanel className="rounded-xl">
              <div className="mb-1 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">
                    Danh sách cấu kiện thành phẩm
                  </h3>
                  <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-400/20">
                    {meta.total} cấu kiện vật lý
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedModalOpen(true)}
                  className="text-xs font-semibold text-cyan-300 transition hover:text-cyan-200"
                >
                  Xem tất cả
                </button>
              </div>

              <FinishedGoodsTable
                rows={tableRows}
                isLoading={isLoading}
                isError={isError}
                onSelect={setSelectedRow}
              />

              {!isLoading && !isError && !tableRows.length ? (
                <div className="p-3">
                  <ModuleEmptyState
                    icon={<PackageCheck size={18} />}
                    title="Chưa có cấu kiện thành phẩm"
                    description="Chưa có cấu kiện hoàn tất sản xuất và được QC chấp nhận."
                  />
                </div>
              ) : null}

              <InventoryPagination
                page={page}
                pageSize={PAGE_SIZE}
                pageCount={Math.max(1, meta.totalPages)}
                total={meta.total}
                onPageChange={setPage}
                containerClassName="border-t-0"
              />
            </InventoryPanel>
          </div>

          <div className="col-span-12 space-y-1 xl:col-span-3">
            <InventoryChartCard title="Nguồn dữ liệu" className="h-[170px]">
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center justify-between gap-3">
                  <span>API canonical</span>
                  <b className="text-right font-mono text-cyan-300">
                    /components/instances/finished-goods
                  </b>
                </div>
                <div className="flex items-center justify-between">
                  <span>Điều kiện</span>
                  <b className="font-mono text-emerald-300">QC final</b>
                </div>
                <div className="flex items-center justify-between">
                  <span>Không tính hồ sơ Draft</span>
                  <b className="font-mono text-white">Đúng</b>
                </div>
              </div>
            </InventoryChartCard>
            <InventoryChartCard title="Chất lượng thành phẩm" className="h-[170px]">
              <div className="space-y-2 text-xs">
                <MetricBar
                  label="Đạt QC"
                  value={summary.qcPassed}
                  total={summary.total}
                  tone="emerald"
                />
                <MetricBar
                  label="Chấp nhận sử dụng"
                  value={summary.useAsIs}
                  total={summary.total}
                  tone="cyan"
                />
              </div>
            </InventoryChartCard>
            <InventoryChartCard title="Traceability" className="h-[170px]">
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <FileSearch size={14} className="text-cyan-300" />
                  <span>ComponentInstance → Hồ sơ cấu kiện</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileSearch size={14} className="text-cyan-300" />
                  <span>Production Order → QC final</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileSearch size={14} className="text-cyan-300" />
                  <span>NCR Use-As-Is nếu có</span>
                </div>
              </div>
            </InventoryChartCard>
          </div>
        </div>
      </div>

      {expandedModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-7xl space-y-4 rounded-2xl border border-white/15 bg-[#08111f] p-5 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">
                  Cấu kiện thành phẩm
                </h2>
                <p className="text-xs text-slate-400">
                  Đang hiển thị trang {page} / {Math.max(1, meta.totalPages)} · tổng {meta.total} cấu kiện vật lý đủ điều kiện.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExpandedModalOpen(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                Đóng
              </button>
            </div>

            <FinishedGoodsTable
              rows={tableRows}
              isLoading={isLoading}
              isError={isError}
              onSelect={(row) => {
                setSelectedRow(row)
                setExpandedModalOpen(false)
              }}
              heightClassName="h-[640px]"
              dense
            />

            <InventoryPagination
              page={page}
              pageSize={PAGE_SIZE}
              pageCount={Math.max(1, meta.totalPages)}
              total={meta.total}
              onPageChange={setPage}
              containerClassName="border-t-0"
            />
          </div>
        </div>
      ) : null}

      <ModuleDetailDrawer
        open={Boolean(selectedRow)}
        title={selectedRow ? selectedRow.instanceNo : ''}
        subtitle={selectedRow ? componentLabel(selectedRow) : undefined}
        onClose={() => setSelectedRow(null)}
      >
        {selectedRow ? (
          <>
            <div className="grid grid-cols-2 gap-1 md:grid-cols-4">
              <CockpitKpiCard
                title="Hoàn thành SX"
                value={formatDate(selectedRow.producedAt)}
                state="normal"
                tone="blue"
              />
              <CockpitKpiCard
                title="QC"
                value={stateLabel[selectedRow.state] ?? selectedRow.state}
                state="normal"
                tone={selectedRow.state === 'USE_AS_IS' ? 'cyan' : 'emerald'}
              />
              <CockpitKpiCard
                title="Production Order"
                value={selectedRow.productionOrder?.orderNo ?? '-'}
                state="normal"
                tone="purple"
              />
              <CockpitKpiCard
                title="Requirement"
                value={selectedRow.requirement?.requirementNo ?? '-'}
                state="normal"
                tone="amber"
              />
            </div>

            <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-white/[0.035] p-3 text-xs text-slate-300">
              <Line label="Hồ sơ cấu kiện" value={componentLabel(selectedRow)} />
              <Line label="Loại / profile" value={[selectedRow.component.componentType, selectedRow.component.profile].filter(Boolean).join(' / ') || '-'} />
              <Line label="Công trình" value={projectLabel(selectedRow)} />
              <Line label="Revision" value={selectedRow.componentRevision?.revisionNo ?? '-'} />
              <Line label="Ngày đạt QC" value={formatDate(selectedRow.qcPassedAt)} />
              <Line label="Bằng chứng QC" value={qualityEvidence(selectedRow)} />
              <Line label="Vị trí" value={locationLabel(selectedRow)} />
            </div>
          </>
        ) : null}
      </ModuleDetailDrawer>
    </EnterpriseModulePage>
  )
}

function FinishedGoodsTable({
  rows,
  isLoading,
  isError,
  onSelect,
  heightClassName = 'h-[430px]',
  dense = false,
}: {
  rows: FinishedGoodsInstanceRow[]
  isLoading: boolean
  isError: boolean
  onSelect: (row: FinishedGoodsInstanceRow) => void
  heightClassName?: string
  dense?: boolean
}) {
  const cellPadding = dense ? 'px-3 py-2' : 'px-3 py-1.5'

  return (
    <div className={`${heightClassName} overflow-auto scrollbar-none rounded-lg border border-white/10`}>
      <table className="w-full min-w-[1120px] table-fixed text-sm">
        <thead
          className={`${inventoryTableHead} sticky top-0 z-10 border-b border-cyan-400/10 text-slate-300`}
          style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
        >
          <tr>
            {[
              'Mã cấu kiện vật lý',
              'Hồ sơ cấu kiện',
              'Công trình',
              'Production Order',
              'Hoàn thành SX',
              'QC',
              'Trạng thái vật lý',
              'Vị trí',
            ].map((heading) => (
              <th
                key={heading}
                className="px-3 py-2 text-left text-xs font-semibold text-slate-300"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center">
                <ModuleLoadingState label="Đang tải cấu kiện thành phẩm..." />
              </td>
            </tr>
          ) : isError ? (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center">
                <ModuleEmptyState
                  icon={<ClipboardCheck size={18} />}
                  title="Không tải được dữ liệu thành phẩm"
                  description="Vui lòng thử lại sau khi kết nối API ổn định."
                />
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onSelect(row)}
                className={`cursor-pointer ${inventoryTableRow}`}
              >
                <td className={`${cellPadding} truncate font-mono font-medium text-cyan-300`}>
                  {row.instanceNo}
                </td>
                <td className={`${cellPadding} truncate font-medium text-white`}>
                  {componentLabel(row)}
                </td>
                <td className={`${cellPadding} truncate text-slate-300`}>
                  {projectLabel(row)}
                </td>
                <td className={`${cellPadding} truncate font-mono text-slate-300`}>
                  {row.productionOrder?.orderNo ?? '-'}
                </td>
                <td className={`${cellPadding} text-slate-300`}>
                  {formatDate(row.producedAt)}
                </td>
                <td className={cellPadding}>
                  <span className="inline-flex rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-300">
                    {qualityEvidence(row)}
                  </span>
                </td>
                <td className={cellPadding}>
                  <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs ${stateBadgeTone[row.state] ?? 'border-slate-400/20 bg-slate-400/10 text-slate-300'}`}>
                    {stateLabel[row.state] ?? row.state}
                  </span>
                </td>
                <td className={`${cellPadding} truncate text-slate-300`}>
                  {locationLabel(row)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function MetricBar({
  label,
  value,
  total,
  tone,
}: {
  label: string
  value: number
  total: number
  tone: 'emerald' | 'cyan'
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0
  const color = tone === 'emerald' ? 'bg-emerald-400' : 'bg-cyan-400'

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-slate-300">
        <span>{label}</span>
        <b className="font-mono text-white">{formatQuantity(value, 0)}</b>
      </div>
      <div className="h-2 rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      <div className="mt-1 text-right font-mono text-[10px] text-slate-500">
        {percent}%
      </div>
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <b className="text-right font-medium text-slate-100">{value}</b>
    </div>
  )
}
