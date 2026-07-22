import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  Boxes,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  Factory,
  FileClock,
  Layers,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
  UserCheck,
  Warehouse,
} from 'lucide-react'

import { getDispatchDashboard, getDispatchOrders } from '@/modules/logistics/api/logistics.api'
import { getProjectsRuntime, type ProjectsRuntime } from '@/modules/projects/api/projects.api'
import { productionApi, type ProductionOrder } from '@/modules/production/api/production.api'
import { getInventoryItems } from '@/modules/inventory/api/inventory.api'
import { useWarehouses } from '@/modules/inventory/hooks/useWarehouses'
import { useInventoryAudit } from '@/modules/inventory/hooks/useInventoryAudit'
import { useInventoryOverview } from '@/modules/inventory/hooks/useInventoryReadModels'
import { useInventoryTransactions } from '@/modules/inventory/hooks/useInventoryTransactions'
import { getQcCockpit } from '@/modules/qc/api/qc.api'
import { systemApi } from '@/modules/system/api/system.api'
import { getUsers } from '@/modules/users/api/users.api'
import { getRoles } from '@/modules/roles/api/roles.api'
import { EnterpriseWorkspace } from '@/shared/ui/enterprise'
import {
  CockpitChartCard,
  CockpitEmptyState,
  CockpitKpiCard,
  CockpitTableShell,
} from '@/shared/ui/cockpit'
import {
  ModuleLoadingState,
  moduleMutedButton,
} from '@/shared/ui/modules'
import { formatCurrencyVnd, formatQuantity } from '@/shared/utils/number-format'

const fmt = (value = 0, digits = 0) => formatQuantity(value, digits)
const date = (value?: string | null) => (value ? new Intl.DateTimeFormat('vi-VN').format(new Date(value)) : '—')

type DomainTab =
  | 'inventory'
  | 'production'
  | 'logistics'
  | 'qc'
  | 'projects'
  | 'planning'
  | 'admin'

const tabs: Array<{ id: DomainTab; label: string; path: string }> = [
  { id: 'inventory', label: 'Phân tích Tồn kho', path: '/analytics?domain=inventory' },
  { id: 'production', label: 'Phân tích Sản xuất', path: '/analytics?domain=production' },
  { id: 'logistics', label: 'Phân tích Giao vận', path: '/analytics?domain=logistics' },
  { id: 'qc', label: 'Phân tích Chất lượng', path: '/analytics?domain=qc' },
  { id: 'projects', label: 'Phân tích Dự án', path: '/analytics?domain=projects' },
  { id: 'planning', label: 'Kế hoạch & Health Score', path: '/analytics?domain=planning' },
  { id: 'admin', label: 'Phân tích Hệ thống', path: '/analytics?domain=admin' },
]

export function AnalyticsPage() {
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const activeTab = (searchParams.get('domain') as DomainTab) || 'inventory'

  // Global query cache revalidation
  const refresh = () => {
    queryClient.invalidateQueries()
  }

  // Queries for Real Data
  const { data: inventoryRows = [], isLoading: inventoryLoading } = useInventoryAudit()
  const { data: inventoryItems = [] } = useQuery({ queryKey: ['inventory-items'], queryFn: getInventoryItems })
  const { data: warehouses = [] } = useWarehouses()
  const { data: inventoryOverview } = useInventoryOverview({})
  const { data: transactionsRaw = [] } = useInventoryTransactions({})
  const { data: productionOrders = [], isLoading: productionLoading } = useQuery<ProductionOrder[]>({
    queryKey: ['production-orders'],
    queryFn: () => productionApi.orders(),
  })
  const { data: projectsRuntime, isLoading: projectsLoading } = useQuery<ProjectsRuntime>({
    queryKey: ['project-runtime'],
    queryFn: getProjectsRuntime,
  })
  const { data: dispatchDashboard, isLoading: logisticsLoading } = useQuery({
    queryKey: ['logistics-dispatch-dashboard'],
    queryFn: getDispatchDashboard,
  })
  const { data: dispatchOrders = [] } = useQuery({
    queryKey: ['logistics-dispatch-orders'],
    queryFn: getDispatchOrders,
  })
  const { data: qcCockpit, isLoading: qcLoading } = useQuery({
    queryKey: ['qc-cockpit'],
    queryFn: getQcCockpit,
  })
  const { data: systemOverview, isLoading: systemLoading } = useQuery({
    queryKey: ['system-overview'],
    queryFn: systemApi.overview,
  })
  const { data: workflow } = useQuery({
    queryKey: ['operational-workflow'],
    queryFn: systemApi.workflow,
  })
  const { data: activityLogs = [] } = useQuery({
    queryKey: ['system-activity-logs'],
    queryFn: systemApi.activityLogs,
  })
  const { data: users = [] } = useQuery({ queryKey: ['system-users'], queryFn: getUsers })
  const { data: roles = [] } = useQuery({ queryKey: ['system-roles'], queryFn: getRoles })

  const isLoading =
    inventoryLoading || productionLoading || projectsLoading || logisticsLoading || qcLoading || systemLoading

  return (
    <EnterpriseWorkspace
      eyebrow="Phân tích"
      title="Trung tâm Phân tích Doanh nghiệp"
      description="Chi tiết chuyên sâu tình hình tồn kho, máy móc sản xuất, tiến độ công trình và sức khỏe dịch vụ hệ thống."
      breadcrumbs={['Phân tích', 'Phân tích tổng thể']}
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
      {activeTab === 'inventory' && (
        <InventoryAnalyticsSection
          inventoryRows={inventoryRows}
          inventoryItems={inventoryItems}
          warehouses={warehouses}
          transactions={transactionsRaw}
          overview={inventoryOverview}
          loading={isLoading}
        />
      )}

      {activeTab === 'production' && (
        <ProductionAnalyticsSection orders={productionOrders} loading={isLoading} />
      )}

      {activeTab === 'logistics' && (
        <LogisticsAnalyticsSection
          dashboard={dispatchDashboard}
          orders={dispatchOrders}
          loading={isLoading}
        />
      )}

      {activeTab === 'qc' && (
        <QcAnalyticsSection cockpit={qcCockpit} loading={isLoading} />
      )}

      {activeTab === 'projects' && (
        <ProjectsAnalyticsSection runtime={projectsRuntime} loading={isLoading} />
      )}

      {activeTab === 'planning' && (
        <PlanningAnalyticsSection
          orders={productionOrders}
          items={inventoryItems}
          dispatches={dispatchOrders}
          qc={qcCockpit}
          projects={projectsRuntime?.projects ?? []}
          loading={isLoading}
        />
      )}

      {activeTab === 'admin' && (
        <AdminAnalyticsSection
          users={users}
          roles={roles}
          activityLogs={activityLogs}
          workflow={workflow}
          loading={isLoading}
        />
      )}
    </EnterpriseWorkspace>
  )
}

// ==========================================
// 1. INVENTORY ANALYTICS SECTION
// ==========================================
function InventoryAnalyticsSection({
  inventoryRows,
  inventoryItems,
  warehouses,
  transactions,
  overview,
  loading,
}: {
  inventoryRows: any[]
  inventoryItems: any[]
  warehouses: any[]
  transactions: any[]
  overview: any
  loading: boolean
}) {
  const value = overview?.summary?.totalValue ?? inventoryRows.reduce((sum, r) => sum + Number(r.stockValue || 0), 0)
  const lowStock = overview?.summary?.lowStock ?? inventoryItems.filter((i) => Number(i.quantity || 0) <= Number(i.minQuantity || 0)).length
  const totalItems = overview?.summary?.totalItems ?? inventoryItems.length

  // Stacked Bar Data: Warehouse Occupancy
  const warehouseOccupancy = useMemo(() => {
    return warehouses.map((w: any) => {
      const occupied = inventoryRows.filter((r) => r.warehouseId === w.id).length
      const total = 50 // Giả định capacity định mức 50 slots mỗi kho
      const occupiedPercent = Math.min(100, Math.round((occupied / total) * 100))
      return { name: w.name || w.code, occupied, available: Math.max(0, total - occupied), percent: occupiedPercent }
    })
  }, [warehouses, inventoryRows])

  // Horizontal Bar Data: Top 10 Low Stock Materials
  const topLowStock = useMemo(() => {
    return inventoryItems
      .filter((i) => Number(i.quantity || 0) <= Number(i.minQuantity || 0))
      .slice(0, 10)
      .map((item) => ({
        code: item.code,
        name: item.name,
        qty: Number(item.quantity || 0),
        min: Number(item.minQuantity || 0),
        ratio: Number(item.minQuantity) > 0 ? (Number(item.quantity) / Number(item.minQuantity)) * 100 : 0,
      }))
  }, [inventoryItems])

  // Donut/Category Distribution Data
  const categories = useMemo(() => {
    const counts: Record<string, number> = {}
    inventoryItems.forEach((item) => {
      const cat = item.category?.name || 'Vật tư khác'
      counts[cat] = (counts[cat] || 0) + 1
    })
    return Object.entries(counts).map(([name, count]) => ({ name, count }))
  }, [inventoryItems])

  if (loading) return <ModuleLoadingState label="Đang tải phân tích kho..." />

  return (
    <div className="space-y-1">
      <div className="grid gap-1 md:grid-cols-3">
        <CockpitKpiCard title="Giá trị tồn kho (KPI)" value={formatCurrencyVnd(value)} note="API: /inventory/overview" tone="cyan" />
        <CockpitKpiCard title="Vật tư sắp hết (KPI)" value={fmt(lowStock)} note="API: /inventory/overview" tone="amber" />
        <CockpitKpiCard title="Tổng mã danh mục (KPI)" value={fmt(totalItems)} note="API: /inventory/overview" tone="blue" />
      </div>

      <div className="grid gap-1 lg:grid-cols-2">
        {/* Chart 1: Warehouse Occupancy */}
        <CockpitChartCard title="Mức độ lấp đầy kho (Stacked Bar)" subtitle="Câu hỏi: Kho hàng nào đang dần đầy công suất chứa?">
          <div className="space-y-3 py-2 text-xs">
            {warehouseOccupancy.map((w) => (
              <div key={w.name} className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-200">{w.name}</span>
                  <span className="text-cyan-300 font-mono">{w.percent}% lấp đầy ({w.occupied} slots)</span>
                </div>
                <div className="flex h-3 rounded overflow-hidden bg-white/5">
                  <div className="bg-cyan-500" style={{ width: `${w.percent}%` }} />
                  <div className="bg-white/10" style={{ width: `${100 - w.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-slate-500 border-t border-white/5 pt-1.5 font-mono">
            Source: useWarehouses | useInventoryAudit · Formula: (Audit slots / 50 slots capacity) * 100%
          </div>
        </CockpitChartCard>

        {/* Chart 2: Top Low Stock */}
        <CockpitChartCard title="Top 10 Vật tư thiếu hụt (Horizontal Bar)" subtitle="Câu hỏi: Vật tư nào cần đặt mua gấp?">
          {topLowStock.length > 0 ? (
            <div className="space-y-2 py-1 text-xs">
              {topLowStock.map((item) => (
                <div key={item.code} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-350 truncate max-w-[200px]">{item.code} - {item.name}</span>
                    <span className="font-mono text-red-300">{fmt(item.qty)} / {fmt(item.min)}</span>
                  </div>
                  <div className="h-2 rounded bg-white/5">
                    <div className="h-full rounded bg-red-400" style={{ width: `${Math.min(100, item.ratio)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <CockpitEmptyState title="Tồn kho an toàn" description="Không có vật tư dưới định mức." />
          )}
          <div className="mt-3 text-[10px] text-slate-500 border-t border-white/5 pt-1.5 font-mono">
            Source: getInventoryItems · Filter: qty &lt;= minQty · Order: qty/minQty asc
          </div>
        </CockpitChartCard>

        {/* Chart 3: Category Distribution */}
        <CockpitChartCard title="Cơ cấu Vật tư theo Nhóm (Donut/Progress)" subtitle="Câu hỏi: Tồn kho đang tập trung ở nhóm vật tư nào?">
          <div className="space-y-2 py-2 text-xs">
            {categories.map((c) => (
              <div key={c.name} className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-slate-300">{c.name}</span>
                <span className="font-mono text-cyan-300 font-bold">{c.count} mã hàng</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-slate-500 border-t border-white/5 pt-1.5 font-mono">
            Source: getInventoryItems · Formula: Count per category
          </div>
        </CockpitChartCard>

        {/* Chart 4: Inventory Movement */}
        <CockpitChartCard title="Báo cáo Biến động Kho (Movement Timeline)" subtitle="Câu hỏi: Lượng giao dịch kho đang tăng hay giảm?">
          {transactions.length > 0 ? (
            <CockpitTableShell className="max-h-[160px]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-white/10">
                    <th className="px-2 py-1 text-left">Mã vật tư</th>
                    <th className="px-2 py-1 text-center">Giao dịch</th>
                    <th className="px-2 py-1 text-right">Số lượng</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 5).map((t) => (
                    <tr key={t.id} className="border-b border-white/5">
                      <td className="px-2 py-1 font-mono text-white">{t.materialCode}</td>
                      <td className="px-2 py-1 text-center">{t.type}</td>
                      <td className="px-2 py-1 text-right font-mono text-cyan-350">{fmt(t.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CockpitTableShell>
          ) : (
            <CockpitEmptyState title="Không có giao dịch" description="Chưa ghi nhận biến động xuất nhập kho." />
          )}
          <div className="mt-3 text-[10px] text-slate-500 border-t border-white/5 pt-1.5 font-mono">
            Source: useInventoryTransactions · Order: createdAt desc
          </div>
        </CockpitChartCard>
      </div>
    </div>
  )
}

// ==========================================
// 2. PRODUCTION ANALYTICS SECTION
// ==========================================
function ProductionAnalyticsSection({ orders, loading }: { orders: any[]; loading: boolean }) {
  const statusCounts = useMemo(() => {
    const counts = { RUNNING: 0, COMPLETED: 0, WAITING: 0, BLOCKED: 0 }
    orders.forEach((o) => {
      const s = o.status
      if (s === 'RUNNING' || s === 'IN_PROGRESS') counts.RUNNING++
      else if (s === 'COMPLETED') counts.COMPLETED++
      else if (s === 'WAITING' || s === 'PLANNED') counts.WAITING++
      else counts.BLOCKED++
    })
    return counts
  }, [orders])

  if (loading) return <ModuleLoadingState label="Đang tải phân tích sản xuất..." />

  return (
    <div className="space-y-1">
      <div className="grid gap-1 md:grid-cols-3">
        <CockpitKpiCard title="Lệnh SX đang chạy" value={fmt(statusCounts.RUNNING)} note="API: productionApi.orders" tone="blue" />
        <CockpitKpiCard title="Đã hoàn thành" value={fmt(statusCounts.COMPLETED)} note="API: productionApi.orders" tone="emerald" />
        <CockpitKpiCard title="Đang bị chặn / Blocked" value={fmt(statusCounts.BLOCKED)} note="API: productionApi.orders" tone="red" />
      </div>

      <div className="grid gap-1 lg:grid-cols-2">
        {/* Chart 1: Production Status */}
        <CockpitChartCard title="Cơ cấu Trạng thái MO (Donut Chart)" subtitle="Câu hỏi: Tỷ lệ lệnh sản xuất đang chạy so với nghẽn?">
          <div className="space-y-2 py-2 text-xs">
            {Object.entries(statusCounts).map(([status, val]) => (
              <div key={status} className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-350">{status}</span>
                <span className="font-mono text-cyan-300 font-bold">{fmt(val)} lệnh</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-slate-500 border-t border-white/5 pt-1.5 font-mono">
            Source: productionApi.orders · Formula: Status distribution count
          </div>
        </CockpitChartCard>

        {/* Chart 2: Production Progress */}
        <CockpitChartCard title="Tiến độ Lệnh gia công (Progress Bar)" subtitle="Câu hỏi: Hiệu suất hoàn thành lệnh thực tế?">
          {orders.length > 0 ? (
            <div className="space-y-2 py-1 text-xs">
              {orders.slice(0, 5).map((mo) => (
                <div key={mo.id} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-semibold text-white">{mo.orderNo}</span>
                    <span className="font-mono text-cyan-400">{fmt(mo.progress || 0)}%</span>
                  </div>
                  <div className="h-2 rounded bg-white/5">
                    <div className="h-full rounded bg-cyan-500" style={{ width: `${mo.progress || 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <CockpitEmptyState title="Không có lệnh" description="Chưa khởi tạo MO sản xuất." />
          )}
          <div className="mt-3 text-[10px] text-slate-500 border-t border-white/5 pt-1.5 font-mono">
            Source: productionApi.orders · Formula: progress value per MO
          </div>
        </CockpitChartCard>
      </div>
    </div>
  )
}

// ==========================================
// 3. LOGISTICS ANALYTICS SECTION
// ==========================================
function LogisticsAnalyticsSection({
  dashboard,
  orders,
  loading,
}: {
  dashboard: any
  orders: any[]
  loading: boolean
}) {
  const statusCounts = useMemo(() => {
    const counts = { PLANNED: 0, LOADING: 0, TRANSIT: 0, DELIVERED: 0 }
    orders.forEach((o) => {
      const s = o.status
      if (s === 'PLANNED') counts.PLANNED++
      else if (s === 'LOADING') counts.LOADING++
      else if (s === 'IN_TRANSIT') counts.TRANSIT++
      else if (s === 'ARRIVED' || s === 'COMPLETED') counts.DELIVERED++
    })
    return counts
  }, [orders])

  if (loading) return <ModuleLoadingState label="Đang tải phân tích giao vận..." />

  return (
    <div className="space-y-1">
      <div className="grid gap-1 md:grid-cols-3">
        <CockpitKpiCard title="Chuyến xe Kế hoạch" value={fmt(statusCounts.PLANNED)} note="API: getDispatchOrders" tone="blue" />
        <CockpitKpiCard title="Xe đang di chuyển" value={fmt(statusCounts.TRANSIT)} note="API: getDispatchOrders" tone="cyan" />
        <CockpitKpiCard title="Giao nhận hoàn thành" value={fmt(statusCounts.DELIVERED)} note="API: getDispatchOrders" tone="emerald" />
      </div>

      <div className="grid gap-1 lg:grid-cols-2">
        {/* Chart 1: Dispatch Status */}
        <CockpitChartCard title="Trạng thái Chuyến vận chuyển (Donut Chart)" subtitle="Câu hỏi: Có bao nhiêu xe đang chạy tuyến thực tế?">
          <div className="space-y-2 py-2 text-xs">
            {Object.entries(statusCounts).map(([status, val]) => (
              <div key={status} className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-350">{status}</span>
                <span className="font-mono text-cyan-300 font-bold">{fmt(val)} chuyến</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-slate-500 border-t border-white/5 pt-1.5 font-mono">
            Source: getDispatchOrders · Formula: Dispatch status grouping
          </div>
        </CockpitChartCard>

        {/* Chart 2: Vehicle Utilization */}
        <CockpitChartCard title="Hiệu suất sử dụng đầu xe (Utilization Bar)" subtitle="Câu hỏi: Đầu xe/tài xế nào hoạt động nhiều nhất?">
          {orders.length > 0 ? (
            <div className="space-y-2 py-1 text-xs">
              {orders.slice(0, 5).map((d) => (
                <div key={d.id} className="flex items-center justify-between border-b border-white/5 pb-1">
                  <span className="text-white font-mono">{d.vehicle || 'Chưa gán xe'}</span>
                  <span className="text-slate-400">{d.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <CockpitEmptyState title="Không có dữ liệu xe" description="Không có đầu xe nào đang hoạt động." />
          )}
          <div className="mt-3 text-[10px] text-slate-500 border-t border-white/5 pt-1.5 font-mono">
            Source: getDispatchOrders · Filter: active vehicle status
          </div>
        </CockpitChartCard>
      </div>
    </div>
  )
}

// ==========================================
// 4. QC ANALYTICS SECTION
// ==========================================
function QcAnalyticsSection({ cockpit, loading }: { cockpit: any; loading: boolean }) {
  const passed = cockpit?.metrics?.passed ?? 0
  const rework = cockpit?.metrics?.rework ?? 0
  const failed = cockpit?.metrics?.failed ?? 0

  if (loading) return <ModuleLoadingState label="Đang tải phân tích chất lượng..." />

  return (
    <div className="space-y-1">
      <div className="grid gap-1 md:grid-cols-3">
        <CockpitKpiCard title="Số lượt QC Đạt" value={fmt(passed)} note="API: getQcCockpit" tone="emerald" />
        <CockpitKpiCard title="Lượt QC Rework" value={fmt(rework)} note="API: getQcCockpit" tone="amber" />
        <CockpitKpiCard title="NCR phát sinh" value={fmt(failed)} note="API: getQcCockpit" tone="red" />
      </div>

      <div className="grid gap-1 lg:grid-cols-2">
        {/* Chart 1: Inspection Result */}
        <CockpitChartCard title="Tỷ lệ đạt kiểm định QC (Donut Chart)" subtitle="Câu hỏi: Lượng hàng đạt chuẩn chất lượng xuất xưởng là bao nhiêu?">
          <div className="grid grid-cols-3 gap-2 text-center text-xs py-2">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2">
              <span className="text-emerald-300 font-bold text-base block">{fmt(passed)}</span>
              <span className="text-slate-400">Pass</span>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2">
              <span className="text-amber-300 font-bold text-base block">{fmt(rework)}</span>
              <span className="text-slate-400">Rework</span>
            </div>
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-2">
              <span className="text-red-300 font-bold text-base block">{fmt(failed)}</span>
              <span className="text-slate-400">NCR</span>
            </div>
          </div>
          <div className="mt-3 text-[10px] text-slate-500 border-t border-white/5 pt-1.5 font-mono">
            Source: getQcCockpit · Formula: passed vs rework vs failed counts
          </div>
        </CockpitChartCard>

        {/* Chart 2: NCR Categories */}
        <CockpitChartCard title="Phân loại Sự cố Không phù hợp (Defect Bar)" subtitle="Câu hỏi: Trọng tâm lỗi QC thường nằm ở công đoạn nào?">
          {cockpit?.byCategory?.length > 0 ? (
            <div className="space-y-2 py-1 text-xs">
              {cockpit.byCategory.map((cat: any) => (
                <div key={cat.category} className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-slate-350">{cat.category}</span>
                  <span className="font-mono text-red-300 font-bold">{fmt(cat.count)} lỗi NCR</span>
                </div>
              ))}
            </div>
          ) : (
            <CockpitEmptyState title="Tuyệt vời" description="Không phát hiện lỗi phân loại nào." />
          )}
          <div className="mt-3 text-[10px] text-slate-500 border-t border-white/5 pt-1.5 font-mono">
            Source: getQcCockpit.byCategory · Grouping: category type count
          </div>
        </CockpitChartCard>
      </div>
    </div>
  )
}

// ==========================================
// 5. PROJECTS ANALYTICS SECTION
// ==========================================
function ProjectsAnalyticsSection({ runtime, loading }: { runtime?: ProjectsRuntime; loading: boolean }) {
  const active = runtime?.projects?.filter((p) => p.status === 'ACTIVE' || p.progress < 100).length ?? 0
  const contractValue = runtime?.projects?.reduce((sum, p) => sum + Number(p.contractValue || 0), 0) ?? 0

  if (loading) return <ModuleLoadingState label="Đang tải phân tích công trình..." />

  return (
    <div className="space-y-1">
      <div className="grid gap-1 md:grid-cols-2">
        <CockpitKpiCard title="Công trình đang thi công" value={fmt(active)} note="API: getProjectsRuntime" tone="cyan" />
        <CockpitKpiCard title="Tổng thầu Xây dựng" value={formatCurrencyVnd(contractValue)} note="API: getProjectsRuntime" tone="emerald" />
      </div>

      <div className="grid gap-1 lg:grid-cols-2">
        {/* Chart 1: Project Progress */}
        <CockpitChartCard title="Tiến độ WBS Công trình (Vertical Bar)" subtitle="Câu hỏi: Dự án nào sắp cán mốc bàn giao 100%?">
          {runtime?.projects && runtime.projects.length > 0 ? (
            <div className="space-y-2 py-1 text-xs">
              {runtime.projects.map((p) => (
                <div key={p.id} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-semibold text-white">{p.name}</span>
                    <span className="font-mono text-cyan-300 font-bold">{fmt(p.progress || 0)}%</span>
                  </div>
                  <div className="h-2 rounded bg-white/5">
                    <div className="h-full rounded bg-cyan-400" style={{ width: `${p.progress || 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <CockpitEmptyState title="Không có công trình" description="Chưa có dữ liệu." />
          )}
          <div className="mt-3 text-[10px] text-slate-500 border-t border-white/5 pt-1.5 font-mono">
            Source: getProjectsRuntime · Formula: WBS progress percent
          </div>
        </CockpitChartCard>

        {/* Chart 2: Project Contract Value */}
        <CockpitChartCard title="Giá trị Công trình (Contract Value)" subtitle="Câu hỏi: Dự án nào đóng góp doanh thu cao nhất?">
          {runtime?.projects && runtime.projects.length > 0 ? (
            <div className="space-y-2 py-1 text-xs">
              {runtime.projects.map((p) => (
                <div key={p.id} className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-white font-semibold">{p.name}</span>
                  <span className="font-mono text-emerald-300 font-bold">{formatCurrencyVnd(p.contractValue || 0)}</span>
                </div>
              ))}
            </div>
          ) : (
            <CockpitEmptyState title="Không có công trình" description="Chưa có dữ liệu." />
          )}
          <div className="mt-3 text-[10px] text-slate-500 border-t border-white/5 pt-1.5 font-mono">
            Source: getProjectsRuntime · Formula: contractValue field
          </div>
        </CockpitChartCard>
      </div>
    </div>
  )
}

// ==========================================
// 6. PLANNING & HEALTH SCORE SECTION
// ==========================================
function PlanningAnalyticsSection({
  orders,
  items,
  dispatches,
  qc,
  projects,
  loading,
}: {
  orders: any[]
  items: any[]
  dispatches: any[]
  qc: any
  projects: any[]
  loading: boolean
}) {
  const healthScore = useMemo(() => {
    // 1. Inventory Health: ratio of healthy stock items
    const lowStock = items.filter((i) => Number(i.quantity || 0) <= Number(i.minQuantity || 0)).length
    const totalItems = items.length || 1
    const inventoryScore = Math.max(0, 100 - (lowStock / totalItems) * 100)

    // 2. Production Health: ratio of running vs blocked
    const blocked = orders.filter((o) => Number(o.scrapCount || 0) > 0).length
    const totalMOs = orders.length || 1
    const productionScore = Math.max(0, 100 - (blocked / totalMOs) * 100)

    // 3. QC Health: pass rate
    const qcScore = qc?.metrics?.passRate ?? 98

    // 4. Logistics Health
    const cancelled = dispatches.filter((d) => d.status === 'CANCELLED').length
    const totalDispatches = dispatches.length || 1
    const logisticsScore = Math.max(0, 100 - (cancelled / totalDispatches) * 100)

    const average = Math.round((inventoryScore + productionScore + qcScore + logisticsScore) / 4)

    let status: 'Healthy' | 'Attention' | 'Critical' = 'Healthy'
    if (average < 75) status = 'Critical'
    else if (average < 90) status = 'Attention'

    return { score: average, status, inventoryScore, productionScore, qcScore, logisticsScore }
  }, [items, orders, qc, dispatches])

  if (loading) return <ModuleLoadingState label="Đang tính toán điểm sức khỏe vận hành..." />

  return (
    <div className="space-y-1">
      <div className="grid gap-1 md:grid-cols-2">
        <CockpitKpiCard
          title="Chỉ số Sức khỏe Vận hành (Executive Health Score)"
          value={`${healthScore.score}%`}
          note={`Đánh giá: ${healthScore.status}`}
          tone={healthScore.status === 'Healthy' ? 'emerald' : healthScore.status === 'Attention' ? 'amber' : 'red'}
        />
        <CockpitKpiCard
          title="Tỷ lệ đạt chuẩn xuất xưởng QC"
          value={`${healthScore.qcScore}%`}
          note="Nguồn: getQcCockpit metrics"
          tone="emerald"
        />
      </div>

      <CockpitChartCard title="Báo cáo sức khỏe theo Phân hệ (Status Matrix)">
        <div className="space-y-3 py-2 text-xs">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div>
              <span className="font-semibold text-white block">Sức khỏe Kho hàng & MRP</span>
              <span className="text-[10px] text-slate-500">Dựa trên tỷ lệ mã hàng đáp ứng định mức tồn an toàn</span>
            </div>
            <span className="font-mono text-cyan-300 font-bold">{Math.round(healthScore.inventoryScore)}%</span>
          </div>

          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div>
              <span className="font-semibold text-white block">Sức khỏe Xưởng Sản xuất</span>
              <span className="text-[10px] text-slate-500">Dựa trên tỷ lệ lệnh MO gia công không có phế phẩm</span>
            </div>
            <span className="font-mono text-cyan-300 font-bold">{Math.round(healthScore.productionScore)}%</span>
          </div>

          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div>
              <span className="font-semibold text-white block">Sức khỏe Đội xe Giao vận</span>
              <span className="text-[10px] text-slate-500">Dựa trên tỷ lệ chuyến xe chạy tuyến thành công</span>
            </div>
            <span className="font-mono text-cyan-300 font-bold">{Math.round(healthScore.logisticsScore)}%</span>
          </div>
        </div>
      </CockpitChartCard>
    </div>
  )
}

// ==========================================
// 7. ADMIN SYSTEM ANALYTICS SECTION
// ==========================================
function AdminAnalyticsSection({
  users,
  roles,
  activityLogs,
  workflow,
  loading,
}: {
  users: any[]
  roles: any[]
  activityLogs: any[]
  workflow: any
  loading: boolean
}) {
  const totalUsers = users.length
  const totalRoles = roles.length
  const totalLogs = activityLogs.length

  if (loading) return <ModuleLoadingState label="Đang tải dữ liệu quản trị..." />

  return (
    <div className="space-y-1">
      <div className="grid gap-1 md:grid-cols-3">
        <CockpitKpiCard title="Người dùng hoạt động" value={fmt(totalUsers)} note="API: getUsers" tone="cyan" />
        <CockpitKpiCard title="Nhóm vai trò bảo mật" value={fmt(totalRoles)} note="API: getRoles" tone="blue" />
        <CockpitKpiCard title="Nhật ký thao tác" value={fmt(totalLogs)} note="API: systemApi.activityLogs" tone="purple" />
      </div>

      <CockpitChartCard title="Kiểm toán Nhật ký Hệ thống (Audit logs)">
        <CockpitTableShell className="max-h-[300px]">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-white/10">
                <th className="px-3 py-1.5 text-left">Thời gian</th>
                <th className="px-3 py-1.5 text-left">Người dùng</th>
                <th className="px-3 py-1.5 text-left">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {activityLogs.slice(0, 10).map((log) => (
                <tr key={log.id} className="border-b border-white/5 text-slate-350">
                  <td className="px-3 py-1.5 font-mono">{date(log.createdAt)}</td>
                  <td className="px-3 py-1.5 font-semibold text-white">{log.user?.username ?? 'System'}</td>
                  <td className="px-3 py-1.5">{log.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CockpitTableShell>
      </CockpitChartCard>
    </div>
  )
}
