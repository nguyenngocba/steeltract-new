import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  FileSearch,
  Layers,
  PackageCheck,
  ShieldCheck,
} from 'lucide-react'

import { useProjectsQuery } from '@/hooks/query/useProjectQueries'
import { EnterpriseModulePage } from '@/shared/runtime-tabs/EnterpriseModulePage'
import {
  ModuleDataGrid,
  ModuleDetailDrawer,
  ModuleEmptyState,
  ModuleLoadingState,
  ModuleTabs,
  moduleTableHead,
  moduleTableRow,
} from '../../../../shared/ui/modules'
import { EnterpriseKpiCard } from '../../../../shared/ui/cockpit'
import {
  InventoryPanel,
  InventoryPagination,
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
  if (!row.project) return 'Chưa gán công trình'
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
  return 'Kho thành phẩm'
}

type DetailTabKey = 'overview' | 'production' | 'qc' | 'yard' | 'traceability'

const detailTabs: Array<{ key: DetailTabKey; label: string }> = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'production', label: 'Sản xuất' },
  { key: 'qc', label: 'QC' },
  { key: 'yard', label: 'Bãi / Yard' },
  { key: 'traceability', label: 'Truy vết' },
]

export function ComponentsStockPage() {
  const [instanceCode, setInstanceCode] = useState('')
  const [instanceCodeDraft, setInstanceCodeDraft] = useState('')
  const [projectId, setProjectId] = useState('')
  const [componentId, setComponentId] = useState('')
  const [page, setPage] = useState(1)
  const [selectedRow, setSelectedRow] =
    useState<FinishedGoodsInstanceRow | null>(null)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTabKey>('overview')

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

  return (
    <EnterpriseModulePage>
      <div className="w-full min-w-0 flex-1 space-y-2 -mt-2">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
          <EnterpriseKpiCard
            title="Tổng thành phẩm"
            value={formatQuantity(summary.total, 0)}
            tone="blue"
            icon={<PackageCheck size={16} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Đạt QC"
            value={formatQuantity(summary.qcPassed, 0)}
            tone="emerald"
            icon={<CheckCircle2 size={16} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Chấp nhận sử dụng"
            value={formatQuantity(summary.useAsIs, 0)}
            tone="cyan"
            icon={<ShieldCheck size={16} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Công trình liên kết"
            value={formatQuantity(summary.projectCount, 0)}
            tone="purple"
            icon={<Building2 size={16} />}
            isLoading={isLoading}
          />
        </div>

        {/* Filter Toolbar */}
        <InventoryPanel className="rounded-xl p-2.5">
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-[1fr_240px_260px_110px_110px]">
            <input
              value={instanceCodeDraft}
              onChange={(event) => setInstanceCodeDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') applySearch()
              }}
              placeholder="Tìm mã cấu kiện vật lý (Serial / Instance ID)..."
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-xs font-medium text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
            />
            <select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-xs font-medium text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
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
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-xs font-medium text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
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
              className="h-9 rounded-lg bg-cyan-600 px-3 text-xs font-semibold text-white shadow-lg shadow-cyan-600/20 transition hover:bg-cyan-500"
            >
              Tìm kiếm
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="h-9 rounded-lg border border-white/10 bg-white/[0.055] px-3 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Làm mới
            </button>
          </div>
        </InventoryPanel>

        {/* Level 1 Table Container */}
        <InventoryPanel className="rounded-xl p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Danh sách cấu kiện thành phẩm
              </h3>
              <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-mono font-medium text-cyan-300 border border-cyan-400/20">
                {formatQuantity(meta.total, 0)} items
              </span>
            </div>
            <button
              type="button"
              onClick={() => setExpandedModalOpen(true)}
              className="rounded-lg border border-cyan-400/30 bg-cyan-600/20 px-3 py-1 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-600/30"
            >
              Xem tất cả
            </button>
          </div>

          <Level1FinishedGoodsTable
            rows={rows}
            isLoading={isLoading}
            isError={isError}
            onSelect={setSelectedRow}
          />

          {!isLoading && !isError && !rows.length ? (
            <div className="p-4">
              <ModuleEmptyState
                icon={<PackageCheck size={20} />}
                title="Chưa có cấu kiện thành phẩm"
                description="Danh sách chỉ hiển thị các ComponentInstance đã hoàn tất sản xuất và đạt điều kiện nghiệm thu thành phẩm."
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

      {/* LEVEL 2: "XEM TẤT CẢ" EXPANSIVE WORKSPACE */}
      {expandedModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex w-[96vw] max-w-[1720px] h-[88vh] flex-col rounded-2xl border border-white/15 bg-[#08111f] p-5 text-xs shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Cấu kiện thành phẩm (Physical Finished Goods Workspace)
                </h2>
                <p className="text-xs text-slate-400">
                  Hiển thị trang {page} / {Math.max(1, meta.totalPages)} · tổng {formatQuantity(meta.total, 0)} cấu kiện vật lý đủ điều kiện nghiệm thu thành phẩm.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExpandedModalOpen(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                Đóng Workspace
              </button>
            </div>

            <div className="min-h-0 flex-1 py-3 overflow-hidden">
              <Level2FinishedGoodsWorkspaceTable
                rows={rows}
                isLoading={isLoading}
                isError={isError}
                onSelect={(row) => {
                  setSelectedRow(row)
                }}
              />
            </div>

            <div className="shrink-0 border-t border-white/10 pt-2">
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
        </div>
      ) : null}

      {/* LEVEL 3: INSTANCE DETAIL SLIDING WORKSPACE */}
      <ModuleDetailDrawer
        open={Boolean(selectedRow)}
        placement="right"
        title={selectedRow ? `${selectedRow.instanceNo}` : ''}
        subtitle={
          selectedRow
            ? `THÀNH PHẨM VẬT LÝ · ${selectedRow.component.code} · ${selectedRow.component.name}`
            : undefined
        }
        onClose={() => setSelectedRow(null)}
        widthClass="w-screen md:w-[64vw] md:max-w-[1280px] md:min-w-[820px]"
      >
        {selectedRow ? (
          <div className="space-y-4 text-xs">
            {/* Instance KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Hoàn thành SX</div>
                <div className="mt-1 font-mono text-sm font-bold text-white">{formatDate(selectedRow.producedAt)}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Trạng thái QC</div>
                <div className="mt-1 font-mono text-sm font-bold text-emerald-300">
                  {stateLabel[selectedRow.state] ?? selectedRow.state}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Lệnh Sản xuất</div>
                <div className="mt-1 font-mono text-sm font-bold text-cyan-300 truncate" title={selectedRow.productionOrder?.orderNo ?? '-'}>
                  {selectedRow.productionOrder?.orderNo ?? '-'}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Mã Yêu cầu</div>
                <div className="mt-1 font-mono text-sm font-bold text-slate-200 truncate" title={selectedRow.requirement?.requirementNo ?? '-'}>
                  {selectedRow.requirement?.requirementNo ?? '-'}
                </div>
              </div>
            </div>

            {/* Tab Strip */}
            <ModuleTabs
              tabs={detailTabs}
              active={activeDetailTab}
              onChange={(key) => setActiveDetailTab(key)}
            />

            {/* TAB CONTENTS */}
            {activeDetailTab === 'overview' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* LEFT - Physical Identity */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Thông tin Vật lý (Physical Identity)</span>
                      <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium border ${stateBadgeTone[selectedRow.state] ?? 'border-slate-400/20 bg-slate-400/10 text-slate-300'}`}>
                        {stateLabel[selectedRow.state] ?? selectedRow.state}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <DetailLine title="Mã Instance / Serial" value={selectedRow.instanceNo} isMono />
                      <DetailLine title="Mã cấu kiện" value={selectedRow.component.code} isMono />
                      <DetailLine title="Tên cấu kiện" value={selectedRow.component.name} />
                      <DetailLine title="Loại / Quy cách" value={[selectedRow.component.componentType, selectedRow.component.profile].filter(Boolean).join(' / ') || '-'} />
                      <DetailLine title="Phiên bản (Revision)" value={selectedRow.componentRevision?.revisionNo ? `Rev ${selectedRow.componentRevision.revisionNo}` : '-'} />
                      <DetailLine title="Vị trí lưu kho" value={locationLabel(selectedRow)} />
                    </div>
                  </div>

                  {/* RIGHT - Lineage & Project */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Công trình & Nguồn gốc</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <DetailLine title="Công trình" value={projectLabel(selectedRow)} />
                      <DetailLine title="Lệnh sản xuất" value={selectedRow.productionOrder?.orderNo ?? '-'} isMono />
                      <DetailLine title="Nhu cầu đăng ký" value={selectedRow.requirement?.requirementNo ?? '-'} isMono />
                      <DetailLine title="Ngày sản xuất" value={formatDate(selectedRow.producedAt)} isMono />
                      <DetailLine title="Ngày nghiệm thu QC" value={formatDate(selectedRow.qcPassedAt)} isMono />
                      <DetailLine title="Cập nhật lần cuối" value={formatDate(selectedRow.updatedAt)} isMono />
                    </div>
                  </div>
                </div>
              </div>
            ) : activeDetailTab === 'production' ? (
              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-white">Lineage Sản xuất (Production Lineage)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <DetailLine title="Mã Lệnh SX" value={selectedRow.productionOrder?.orderNo ?? '-'} isMono />
                    <DetailLine title="Trạng thái Lệnh" value={selectedRow.productionOrder?.status ?? '-'} />
                    <DetailLine title="Mã Yêu cầu" value={selectedRow.requirement?.requirementNo ?? '-'} isMono />
                    <DetailLine title="SL Yêu cầu" value={formatQuantity(selectedRow.requirement?.requiredQuantity ?? 0, 0)} isMono />
                  </div>
                </div>
              </div>
            ) : activeDetailTab === 'qc' ? (
              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-white">Hồ sơ QC & Nghiệm thu</span>
                    <span className="text-xs font-mono text-emerald-300">{qualityEvidence(selectedRow)}</span>
                  </div>
                  {selectedRow.qcInspections?.length ? (
                    <div className="space-y-2">
                      {selectedRow.qcInspections.map((ins) => (
                        <div key={ins.id} className="rounded-lg border border-white/10 bg-slate-950/45 p-3 flex items-center justify-between">
                          <div>
                            <div className="font-mono font-semibold text-cyan-300">{ins.inspectionNo}</div>
                            <div className="text-[11px] text-slate-400">{ins.checklist?.name ?? 'Quy trình kiểm tra'} · {formatDate(ins.completedAt)}</div>
                          </div>
                          <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-300 font-medium">
                            {ins.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : selectedRow.ncrs?.length ? (
                    <div className="space-y-2">
                      {selectedRow.ncrs.map((ncr) => (
                        <div key={ncr.id} className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex items-center justify-between">
                          <div>
                            <div className="font-mono font-semibold text-amber-300">{ncr.ncrNo} (NCR)</div>
                            <div className="text-[11px] text-slate-400">Disposition: {ncr.disposition ?? 'Use-As-Is'}</div>
                          </div>
                          <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-300 font-medium">
                            {ncr.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-400 italic">Không có chi tiết biên bản QC mở rộng.</div>
                  )}
                </div>
              </div>
            ) : activeDetailTab === 'yard' ? (
              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-white">Vị trí Quản lý Bãi (Yard Placement)</span>
                  </div>
                  <div className="text-slate-300 text-xs">
                    {selectedRow.installedAt ? (
                      <div className="text-emerald-300 font-semibold">Cấu kiện đã được bàn giao và lắp đặt hoàn tất tại công trình.</div>
                    ) : (
                      <div className="text-slate-400">Cấu kiện đang được lưu trữ bảo quản tại <b>Kho thành phẩm</b> xưởng chế tạo.</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <ModuleEmptyState
                  icon={<Clock size={20} />}
                  title="Chưa có nguồn truy vết nâng cao"
                  description="Nhật ký truy vết di chuyển và sự kiện chi tiết của cấu kiện vật lý đang được tích hợp."
                />
              </div>
            )}
          </div>
        ) : null}
      </ModuleDetailDrawer>
    </EnterpriseModulePage>
  )
}

/* LEVEL 1: DEFAULT COMPACT 8-COLUMN TABLE */
function Level1FinishedGoodsTable({
  rows,
  isLoading,
  isError,
  onSelect,
}: {
  rows: FinishedGoodsInstanceRow[]
  isLoading: boolean
  isError: boolean
  onSelect: (row: FinishedGoodsInstanceRow) => void
}) {
  return (
    <div className="h-[440px] overflow-auto scrollbar-none rounded-lg border border-white/10">
      <table className="w-full min-w-[1000px] table-fixed text-xs border-collapse">
        <thead className={`${moduleTableHead} sticky top-0 z-10 bg-slate-900 border-b border-white/10`}>
          <tr>
            <th className="w-[180px] px-3 py-2 text-left font-semibold text-slate-300">Cấu kiện (Instance)</th>
            <th className="w-[200px] px-3 py-2 text-left font-semibold text-slate-300">Công trình</th>
            <th className="w-[160px] px-3 py-2 text-left font-semibold text-slate-300">Loại / Quy cách</th>
            <th className="w-[110px] px-3 py-2 text-center font-semibold text-slate-300">Trạng thái</th>
            <th className="w-[120px] px-3 py-2 text-center font-semibold text-slate-300">QC Inspection</th>
            <th className="w-[120px] px-3 py-2 text-left font-semibold text-slate-300">Vị trí</th>
            <th className="w-[110px] px-3 py-2 text-right font-semibold text-slate-300">Cập nhật</th>
            <th className="w-[80px] px-3 py-2 text-center font-semibold text-slate-300">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {isLoading ? (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center">
                <ModuleLoadingState label="Đang tải danh sách thành phẩm..." />
              </td>
            </tr>
          ) : isError ? (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center">
                <ModuleEmptyState
                  icon={<PackageCheck size={20} />}
                  title="Lỗi tải dữ liệu"
                  description="Không kết nối được với server canonical API."
                />
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onSelect(row)}
                className={`cursor-pointer ${moduleTableRow}`}
              >
                {/* 1. Stacked Identity */}
                <td className="px-3 py-1.5 min-w-0">
                  <div className="font-mono font-semibold text-cyan-300 truncate" title={row.instanceNo}>{row.instanceNo}</div>
                  <div className="text-[11px] font-medium text-slate-300 truncate" title={componentLabel(row)}>{componentLabel(row)}</div>
                </td>
                {/* 2. Project */}
                <td className="px-3 py-1.5 text-slate-200 font-medium truncate" title={projectLabel(row)}>
                  {projectLabel(row)}
                </td>
                {/* 3. Type / Spec */}
                <td className="px-3 py-1.5 text-slate-300 font-medium truncate" title={[row.component.componentType, row.component.profile].filter(Boolean).join(' · ')}>
                  {[row.component.componentType, row.component.profile].filter(Boolean).join(' · ') || '-'}
                </td>
                {/* 4. State */}
                <td className="px-3 py-1.5 text-center">
                  <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium border ${stateBadgeTone[row.state] ?? 'border-slate-400/20 bg-slate-400/10 text-slate-300'}`}>
                    {stateLabel[row.state] ?? row.state}
                  </span>
                </td>
                {/* 5. QC */}
                <td className="px-3 py-1.5 text-center font-mono text-emerald-300 truncate" title={qualityEvidence(row)}>
                  {qualityEvidence(row)}
                </td>
                {/* 6. Location */}
                <td className="px-3 py-1.5 text-slate-300 font-medium truncate" title={locationLabel(row)}>
                  {locationLabel(row)}
                </td>
                {/* 7. Timestamp */}
                <td className="px-3 py-1.5 text-right font-mono text-slate-400">
                  {formatDate(row.updatedAt || row.qcPassedAt || row.producedAt)}
                </td>
                {/* 8. Action */}
                <td className="px-3 py-1.5 text-center" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onSelect(row)}
                    className="inline-flex items-center gap-1 rounded-md border border-cyan-400/30 bg-cyan-600/20 px-2 py-1 text-[11px] font-semibold text-cyan-200 hover:bg-cyan-600/30 transition"
                  >
                    <Eye size={12} />
                    Chi tiết
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

/* LEVEL 2: EXPANSIVE 12-COLUMN WORKSPACE TABLE */
function Level2FinishedGoodsWorkspaceTable({
  rows,
  isLoading,
  isError,
  onSelect,
}: {
  rows: FinishedGoodsInstanceRow[]
  isLoading: boolean
  isError: boolean
  onSelect: (row: FinishedGoodsInstanceRow) => void
}) {
  return (
    <div className="h-full overflow-auto scrollbar-none rounded-xl border border-white/10">
      <table className="w-full min-w-[1400px] table-fixed text-xs border-collapse">
        <thead className={`${moduleTableHead} sticky top-0 z-10 bg-slate-900 border-b border-white/10`}>
          <tr>
            <th className="w-[140px] px-3 py-2.5 text-left font-semibold text-slate-300">Serial Instance</th>
            <th className="w-[110px] px-3 py-2.5 text-left font-semibold text-slate-300">Mã cấu kiện</th>
            <th className="w-[180px] px-3 py-2.5 text-left font-semibold text-slate-300">Tên cấu kiện</th>
            <th className="w-[180px] px-3 py-2.5 text-left font-semibold text-slate-300">Công trình</th>
            <th className="w-[120px] px-3 py-2.5 text-left font-semibold text-slate-300">Mã Yêu cầu</th>
            <th className="w-[120px] px-3 py-2.5 text-left font-semibold text-slate-300">Lệnh SX (PO)</th>
            <th className="w-[110px] px-3 py-2.5 text-left font-semibold text-slate-300">Loại</th>
            <th className="w-[120px] px-3 py-2.5 text-left font-semibold text-slate-300">Quy cách</th>
            <th className="w-[70px] px-3 py-2.5 text-center font-semibold text-slate-300">Rev</th>
            <th className="w-[110px] px-3 py-2.5 text-center font-semibold text-slate-300">Trạng thái</th>
            <th className="w-[120px] px-3 py-2.5 text-center font-semibold text-slate-300">QC Evidence</th>
            <th className="w-[80px] px-3 py-2.5 text-center font-semibold text-slate-300">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {isLoading ? (
            <tr>
              <td colSpan={12} className="px-4 py-12 text-center">
                <ModuleLoadingState label="Đang tải dữ liệu workspace..." />
              </td>
            </tr>
          ) : isError ? (
            <tr>
              <td colSpan={12} className="px-4 py-12 text-center">
                <ModuleEmptyState
                  icon={<PackageCheck size={20} />}
                  title="Lỗi kết nối API"
                  description="Không thể kết nối với server."
                />
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onSelect(row)}
                className={`cursor-pointer ${moduleTableRow}`}
              >
                <td className="px-3 py-2 font-mono font-semibold text-cyan-300 truncate" title={row.instanceNo}>{row.instanceNo}</td>
                <td className="px-3 py-2 font-mono font-semibold text-white truncate" title={row.component.code}>{row.component.code}</td>
                <td className="px-3 py-2 font-medium text-slate-200 truncate" title={row.component.name}>{row.component.name}</td>
                <td className="px-3 py-2 font-medium text-slate-300 truncate" title={projectLabel(row)}>{projectLabel(row)}</td>
                <td className="px-3 py-2 font-mono text-slate-400 truncate" title={row.requirement?.requirementNo ?? '-'}>{row.requirement?.requirementNo ?? '-'}</td>
                <td className="px-3 py-2 font-mono text-cyan-400 truncate" title={row.productionOrder?.orderNo ?? '-'}>{row.productionOrder?.orderNo ?? '-'}</td>
                <td className="px-3 py-2 font-medium text-slate-300 truncate" title={row.component.componentType ?? '-'}>{row.component.componentType ?? '-'}</td>
                <td className="px-3 py-2 font-medium text-slate-300 truncate" title={row.component.profile ?? '-'}>{row.component.profile ?? '-'}</td>
                <td className="px-3 py-2 text-center font-mono text-slate-400">{row.componentRevision?.revisionNo ?? '0'}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium border ${stateBadgeTone[row.state] ?? 'border-slate-400/20 bg-slate-400/10 text-slate-300'}`}>
                    {stateLabel[row.state] ?? row.state}
                  </span>
                </td>
                <td className="px-3 py-2 text-center font-mono text-emerald-300 truncate" title={qualityEvidence(row)}>{qualityEvidence(row)}</td>
                <td className="px-3 py-2 text-center" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onSelect(row)}
                    className="inline-flex items-center gap-1 rounded-md border border-cyan-400/30 bg-cyan-600/20 px-2 py-1 text-[11px] font-semibold text-cyan-200 hover:bg-cyan-600/30 transition"
                  >
                    <Eye size={12} />
                    Chi tiết
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function DetailLine({ title, value, isMono = false }: { title: string; value: string; isMono?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase font-semibold text-slate-400">{title}</span>
      <span className={`mt-0.5 text-xs font-medium text-slate-100 ${isMono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}
