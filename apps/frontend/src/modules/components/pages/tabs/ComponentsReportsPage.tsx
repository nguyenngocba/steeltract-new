import { useMemo } from 'react'
import { BarChart3, FileText, PackageCheck } from 'lucide-react'

import { EnterpriseModulePage } from '@/shared/runtime-tabs/EnterpriseModulePage'
import { CockpitKpiCard } from '../../../../shared/ui/cockpit'
import { ModuleEmptyState } from '../../../../shared/ui/modules'
import { InventoryChartCard } from '../../../inventory/components/InventoryVisuals'
import { useComponentsDashboard, useComponentsHistory, useComponentsOverview } from '../../hooks/queries/useComponents'
import { formatQuantity } from '@/shared/utils/number-format'
import { ComponentsDonut, ComponentsMiniBars } from './ComponentsCockpitShared'

export function ComponentsReportsPage() {
  const { data: dashboard } = useComponentsDashboard()
  const { data: overview } = useComponentsOverview({ page: 1, limit: 8 })
  const { data: history } = useComponentsHistory({ page: 1, limit: 8 })
  const dashboardData = dashboard?.data
  const rows = overview?.data ?? []
  const historyRows = history?.data ?? []

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
      <div className="w-full min-w-0 flex-1 space-y-1">
        <div className="grid grid-cols-1 gap-1 md:grid-cols-3 xl:grid-cols-6">
          <CockpitKpiCard title="Tổng cấu kiện" value={formatQuantity(total, 0)} note="Lifecycle catalog" state="normal" tone="blue" className="!h-[92px] !p-3" />
          <CockpitKpiCard title="Đang gia công" value={formatQuantity(producing, 0)} note="Cut / Weld / Paint" state="normal" tone="cyan" className="!h-[92px] !p-3" />
          <CockpitKpiCard title="Trong kho" value={formatQuantity(stock, 0)} note="STOCK" state="normal" tone="amber" className="!h-[92px] !p-3" />
          <CockpitKpiCard title="Ready to ship" value={formatQuantity(ready, 0)} note="READY" state="normal" tone="emerald" className="!h-[92px] !p-3" />
          <CockpitKpiCard title="Đã xuất bãi" value={formatQuantity(shipped, 0)} note="SHIPPED" state="normal" tone="purple" className="!h-[92px] !p-3" />
          <CockpitKpiCard title="Thay đổi" value={formatQuantity(historyRows.length, 0)} note="History rows" state="normal" tone="red" className="!h-[92px] !p-3" />
        </div>

        <div className="grid gap-1 xl:grid-cols-12">
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
          <InventoryChartCard title="Cấu kiện gần đây" note="Overview rows" className="min-h-[260px] xl:col-span-4">
            {rows.slice(0, 6).map((row) => (
              <div key={row.id} className="mb-1 flex justify-between gap-2 text-xs text-slate-300">
                <span className="truncate text-cyan-300">{row.code}</span>
                <span className="shrink-0">{row.status}</span>
              </div>
            ))}
            {!rows.length ? <ModuleEmptyState icon={<PackageCheck size={18} />} title="Chưa có cấu kiện" description="Không có dữ liệu report trong read model hiện tại." /> : null}
          </InventoryChartCard>
        </div>

        <InventoryChartCard title="Thống kê nhanh" className="min-h-0">
          <div className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-5 sm:divide-x sm:divide-y-0">
            {quickStats.map((item) => (
              <div key={item.title} className="flex items-center justify-between gap-2 px-3 py-1.5">
                <span className="truncate text-xs text-slate-400">{item.title}</span>
                <div className="min-w-0 text-right">
                  <div className={`truncate text-sm font-bold ${item.tone}`}>{item.value}</div>
                  <div className="truncate text-[10px] text-slate-500">{item.note}</div>
                </div>
              </div>
            ))}
          </div>
        </InventoryChartCard>
      </div>
    </EnterpriseModulePage>
  )
}
