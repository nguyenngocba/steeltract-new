import { useMemo, useState } from 'react'
import { BarChart3, CheckCircle2, Clock, Download, Eye, FileText, Layers, PackageCheck } from 'lucide-react'

import { EnterpriseModulePage } from '@/shared/runtime-tabs/EnterpriseModulePage'
import { CockpitKpiCard, EnterpriseKpiCard } from '../../../../shared/ui/cockpit'
import { ModuleDetailDrawer, ModuleEmptyState } from '../../../../shared/ui/modules'
import { InventoryChartCard, InventoryPanel, inventoryTableHead, inventoryTableRow } from '../../../inventory/components/InventoryVisuals'
import { useComponentsDashboard, useComponentsHistory, useComponentsOverview } from '../../hooks/queries/useComponents'
import { formatQuantity } from '@/shared/utils/number-format'
import { ComponentsDonut, ComponentsMiniBars } from './ComponentsCockpitShared'

export function ComponentsReportsPage() {
  const { data: dashboard, isLoading } = useComponentsDashboard()
  const { data: overview } = useComponentsOverview({ page: 1, limit: 14 })
  const { data: history } = useComponentsHistory({ page: 1, limit: 14 })
  const dashboardData = dashboard?.data
  const rows = overview?.data ?? []
  const historyRows = history?.data ?? []

  const [query, setQuery] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [selectedRow, setSelectedRow] = useState<any | null>(null)

  function applySearch() {
    setQuery(searchDraft)
  }

  function resetFilters() {
    setSearchDraft('')
    setQuery('')
  }

  const filteredRows = useMemo(() => {
    if (!query.trim()) return rows
    return rows.filter((row) => `${row.code} ${row.name} ${row.status}`.toLowerCase().includes(query.toLowerCase()))
  }, [rows, query])

  const statusSegments = useMemo(() => {
    const colors = ['#1d7cff', '#06b6d4', '#14c987', '#f59e0b', '#ef4444', '#7c3aed']
    return (dashboardData?.payload?.statusCounts ?? []).map((item, index) => ({
      label: item.status,
      value: item.count,
      color: colors[index % colors.length],
    }))
  }, [dashboardData])

  const total = dashboardData?.totalComponents ?? overview?.meta.total ?? rows.length
  const producing = dashboardData?.producingCount ?? rows.filter((row) => ['CUTTING', 'WELDING', 'PAINTING'].includes(row.status)).length
  const stock = dashboardData?.stockCount ?? rows.filter((row) => row.status === 'STOCK').length
  const ready = dashboardData?.readyCount ?? rows.filter((row) => row.status === 'READY').length
  const shipped = dashboardData?.shippedCount ?? rows.filter((row) => row.status === 'SHIPPED').length
  const activityValues = dashboardData?.payload?.timelineActions?.map((item) => item.count) ?? []
  const waitingQc = rows.filter((row) => /QC|CUTTING|WELDING|PAINTING/i.test(row.status)).length
  const quickStats = [
    { title: 'Dòng lifecycle', value: `${formatQuantity(rows.length, 0)} dòng`, note: `${formatQuantity(overview?.meta.total ?? rows.length, 0)} tổng`, tone: 'text-cyan-300' },
    { title: 'Thay đổi gần đây', value: `${formatQuantity(historyRows.length, 0)} dòng`, note: 'Timeline gần nhất', tone: 'text-emerald-300' },
    { title: 'Nhóm trạng thái', value: `${formatQuantity(statusSegments.length, 0)} nhóm`, note: 'Status distribution', tone: 'text-purple-300' },
    { title: 'Ready to ship', value: `${formatQuantity(ready, 0)} cấu kiện`, note: 'READY', tone: 'text-emerald-300' },
    { title: 'Chờ QC', value: `${formatQuantity(waitingQc, 0)} cấu kiện`, note: 'Stage hiện có', tone: 'text-amber-300' },
  ]

  return (
    <EnterpriseModulePage>
      <div className="w-full min-w-0 flex-1 space-y-1 -mt-2">
        {/* Phase 1: KPI Cards */}
        <div className="grid grid-cols-1 gap-1 md:grid-cols-3 xl:grid-cols-6">
          <EnterpriseKpiCard
            title="Tổng cấu kiện"
            value={formatQuantity(total, 0)}
            tone="blue"
            icon={<Layers size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Đang gia công"
            value={formatQuantity(producing, 0)}
            tone="cyan"
            icon={<Clock size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Trong kho"
            value={formatQuantity(stock, 0)}
            tone="amber"
            icon={<PackageCheck size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Ready to ship"
            value={formatQuantity(ready, 0)}
            tone="emerald"
            icon={<CheckCircle2 size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Đã xuất bãi"
            value={formatQuantity(shipped, 0)}
            tone="purple"
            icon={<CheckCircle2 size={15} />}
            isLoading={isLoading}
          />
          <EnterpriseKpiCard
            title="Thay đổi"
            value={formatQuantity(historyRows.length, 0)}
            tone="cyan"
            icon={<FileText size={15} />}
            isLoading={isLoading}
          />
        </div>

        {/* Phase 3 & 5: Toolbar & Export Actions */}
        <InventoryPanel className="rounded-xl -mt-1">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_160px_130px_120px]">
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearch()
              }}
              placeholder="Tìm theo mã cấu kiện, tên..."
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
            />
            <button
              type="button"
              onClick={() => {
                alert('Đang tạo báo cáo tổng hợp...')
              }}
              className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
            >
              <Download size={14} />
              <span>Xuất Báo Cáo</span>
            </button>
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

        {/* Phase 2: Analytics Dashboard */}
        <div className="grid gap-1 xl:grid-cols-12 items-start">
          <InventoryChartCard title="Phân bổ lifecycle" note="Dashboard payload" className="min-h-[260px] xl:col-span-4">
            {statusSegments.length ? (
              <ComponentsDonut centerValue={formatQuantity(total, 0)} centerLabel="components" segments={statusSegments} />
            ) : (
              <ModuleEmptyState icon={<BarChart3 size={18} />} title="Chưa có phân bổ trạng thái" description="Báo cáo sẽ hiển thị khi snapshot/read model có statusCounts." />
            )}
          </InventoryChartCard>
          <InventoryChartCard title="Biến động lifecycle" note="Timeline actions" className="min-h-[260px] xl:col-span-4">
            {activityValues.length ? <ComponentsMiniBars values={activityValues} /> : (
              <ModuleEmptyState icon={<FileText size={18} />} title="Chưa có lịch sử" description="Hoạt động cấu kiện sẽ hiển thị khi phát sinh sự kiện." />
            )}
          </InventoryChartCard>

          {/* Phase 4: Report Hero Table */}
          <InventoryChartCard title="Cấu kiện báo cáo" note="Overview rows" className="min-h-[260px] xl:col-span-4">
            <div className="max-h-[220px] overflow-y-auto scrollbar-none">
              {filteredRows.slice(0, 7).map((row) => (
                <div
                  key={row.id}
                  onClick={() => setSelectedRow(row)}
                  className="mb-1 flex cursor-pointer justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-2 text-xs text-slate-300 hover:bg-white/5 transition"
                >
                  <span className="truncate font-mono font-medium text-cyan-300">{row.code}</span>
                  <span className="shrink-0 font-mono text-slate-400">{row.status}</span>
                </div>
              ))}
              {!filteredRows.length ? <ModuleEmptyState icon={<PackageCheck size={18} />} title="Chưa có cấu kiện" description="Không có dữ liệu report trong read model hiện tại." /> : null}
            </div>
          </InventoryChartCard>
        </div>

        {/* Quick Stats Grid */}
        <InventoryChartCard title="Thống kê nhanh" className="min-h-0">
          <div className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-5 sm:divide-x sm:divide-y-0">
            {quickStats.map((item) => (
              <div key={item.title} className="flex items-center justify-between gap-2 px-3 py-1.5">
                <span className="truncate text-xs text-slate-400">{item.title}</span>
                <div className="min-w-0 text-right">
                  <div className={`truncate text-sm font-bold font-mono ${item.tone}`}>{item.value}</div>
                  <div className="truncate text-[10px] text-slate-500 font-mono">{item.note}</div>
                </div>
              </div>
            ))}
          </div>
        </InventoryChartCard>
      </div>

      {/* Phase 6: Report Detail Drawer */}
      <ModuleDetailDrawer
        open={Boolean(selectedRow)}
        title={selectedRow ? `Báo cáo cấu kiện · ${selectedRow.code}` : 'Chi tiết cấu kiện'}
        subtitle={selectedRow ? `${selectedRow.name}` : undefined}
        onClose={() => setSelectedRow(null)}
      >
        {selectedRow ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <CockpitKpiCard title="Mã cấu kiện" value={selectedRow.code} state="normal" tone="cyan" />
              <CockpitKpiCard title="Trạng thái" value={selectedRow.status} state="normal" tone="emerald" />
              <CockpitKpiCard title="Dự án" value={selectedRow.project?.name ?? '-'} state="normal" tone="blue" />
              <CockpitKpiCard title="Loại" value={selectedRow.type ?? '-'} state="normal" tone="purple" />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4 text-xs space-y-2">
              <div className="font-semibold uppercase tracking-wider text-cyan-300">Thông tin tổng hợp báo cáo</div>
              <div className="flex justify-between text-slate-300 border-b border-white/5 pb-1.5">
                <span>Tên cấu kiện</span>
                <span className="text-white">{selectedRow.name}</span>
              </div>
              <div className="flex justify-between text-slate-300 border-b border-white/5 pb-1.5">
                <span>Khối lượng</span>
                <span className="font-mono text-cyan-300">{selectedRow.weight ?? 0} kg</span>
              </div>
              <div className="flex justify-between text-slate-300 border-b border-white/5 pb-1.5">
                <span>Vị trí bãi / kho</span>
                <span className="font-mono text-white">{[selectedRow.zone, selectedRow.position].filter(Boolean).join(' / ') || '-'}</span>
              </div>
            </div>
          </div>
        ) : null}
      </ModuleDetailDrawer>
    </EnterpriseModulePage>
  )
}
