import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  Bell,
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
  PackagePlus,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
  UserCheck,
  UserRound,
  Warehouse,
} from 'lucide-react'

import { getDispatchDashboard, getDispatchOrders } from '@/modules/logistics/api/logistics.api'
import { getProjectsRuntime, type ProjectsRuntime } from '@/modules/projects/api/projects.api'
import { productionApi, type ProductionOrder } from '@/modules/production/api/production.api'
import { getInventoryItems } from '@/modules/inventory/api/inventory.api'
import { useInventoryAudit } from '@/modules/inventory/hooks/useInventoryAudit'
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
  CockpitRecentList,
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
  { id: 'inventory', label: 'Tồn kho', path: '/analytics?domain=inventory' },
  { id: 'production', label: 'Sản xuất', path: '/analytics?domain=production' },
  { id: 'logistics', label: 'Giao vận', path: '/analytics?domain=logistics' },
  { id: 'qc', label: 'Chất lượng (QC)', path: '/analytics?domain=qc' },
  { id: 'projects', label: 'Dự án', path: '/analytics?domain=projects' },
  { id: 'planning', label: 'Kế hoạch', path: '/analytics?domain=planning' },
  { id: 'admin', label: 'Hệ thống', path: '/analytics?domain=admin' },
]

export function AnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const activeTab = (searchParams.get('domain') as DomainTab) || 'inventory'

  // Global query cache revalidation
  const refresh = () => {
    queryClient.invalidateQueries()
  }

  // 1. Queries for Real Data
  const { data: inventoryRows = [], isLoading: inventoryLoading } = useInventoryAudit()
  const { data: inventoryItems = [] } = useQuery({ queryKey: ['inventory-items'], queryFn: getInventoryItems })
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
          transactions={transactionsRaw}
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
  transactions,
  loading,
}: {
  inventoryRows: any[]
  inventoryItems: any[]
  transactions: any[]
  loading: boolean
}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const value = inventoryRows.reduce((sum, r) => sum + Number(r.stockValue || 0), 0)
  const lowStock = inventoryItems.filter((i) => Number(i.quantity || 0) <= Number(i.minQuantity || 0)).length
  const totalItems = inventoryItems.length

  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * pageSize
    return transactions.slice(start, start + pageSize)
  }, [transactions, page, pageSize])

  if (loading) return <ModuleLoadingState label="Đang tải dữ liệu kho..." />

  return (
    <div className="space-y-1">
      <div className="grid gap-1 md:grid-cols-3">
        <CockpitKpiCard title="Giá trị tồn kho" value={formatCurrencyVnd(value)} note="Theo báo cáo kiểm kê thực tế" tone="cyan" />
        <CockpitKpiCard title="Vật tư sắp hết" value={fmt(lowStock)} note="Cần bổ sung MRP ngay" tone="amber" />
        <CockpitKpiCard title="Tổng mã danh mục" value={fmt(totalItems)} note="Mã vật tư đã đăng ký" tone="blue" />
      </div>

      <div className="grid gap-1 xl:grid-cols-2">
        <CockpitChartCard title="Mặt hàng sắp hết hàng">
          {lowStock > 0 ? (
            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {inventoryItems
                .filter((i) => Number(i.quantity || 0) <= Number(i.minQuantity || 0))
                .slice(0, 6)
                .map((item) => (
                  <div key={item.id} className="flex justify-between text-xs border-b border-white/5 pb-1">
                    <span className="font-semibold text-slate-200">{item.code} - {item.name}</span>
                    <span className="font-mono text-amber-300 font-bold">{fmt(item.quantity)} {item.unit}</span>
                  </div>
                ))}
            </div>
          ) : (
            <CockpitEmptyState title="Tồn kho an toàn" description="Không có mã vật tư nào vi phạm ngưỡng tối thiểu." />
          )}
        </CockpitChartCard>

        <CockpitChartCard title="Báo cáo Giao dịch Kho Gần đây">
          <CockpitTableShell className="max-h-[220px]">
            <table className="w-full text-xs">
              <thead className="text-slate-400">
                <tr>
                  <th className="px-2 py-1 text-left">Thời gian</th>
                  <th className="px-2 py-1 text-left">Vật tư</th>
                  <th className="px-2 py-1 text-right">Số lượng</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className="border-t border-white/5 text-slate-350">
                    <td className="px-2 py-1 font-mono text-[11px]">{date(tx.createdAt)}</td>
                    <td className="px-2 py-1 truncate max-w-[150px]">{tx.materialCode}</td>
                    <td className="px-2 py-1 text-right font-mono font-semibold text-cyan-300">
                      {tx.type === 'INBOUND' ? '+' : '-'}{fmt(tx.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CockpitTableShell>
          {transactions.length > 0 && (
            <DataTablePagination
              page={page}
              pageSize={pageSize}
              total={transactions.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 20]}
            />
          )}
        </CockpitChartCard>
      </div>
    </div>
  )
}

// ==========================================
// 2. PRODUCTION ANALYTICS SECTION
// ==========================================
function ProductionAnalyticsSection({ orders, loading }: { orders: any[]; loading: boolean }) {
  const running = orders.filter((o) => o.status === 'RUNNING' || o.status === 'IN_PROGRESS').length
  const completed = orders.filter((o) => o.status === 'COMPLETED').length
  const blocked = orders.filter((o) => Number(o.scrapCount || 0) > 0).length

  if (loading) return <ModuleLoadingState label="Đang tải dữ liệu sản xuất..." />

  return (
    <div className="space-y-1">
      <div className="grid gap-1 md:grid-cols-3">
        <CockpitKpiCard title="Lệnh SX đang chạy" value={fmt(running)} note="Đang vận hành tại xưởng máy" tone="cyan" />
        <CockpitKpiCard title="Đã hoàn thành" value={fmt(completed)} note="MO hoàn thành trong kỳ" tone="emerald" />
        <CockpitKpiCard title="Lệnh có hao hụt / Blocked" value={fmt(blocked)} note="Cần QC giám sát thêm" tone="red" />
      </div>

      <CockpitChartCard title="Báo cáo Tiến độ Lệnh Sản xuất">
        {orders.length > 0 ? (
          <CockpitTableShell className="max-h-[300px]">
            <table className="w-full text-xs">
              <thead className="text-slate-450 border-b border-white/10">
                <tr>
                  <th className="px-3 py-1.5 text-left">Mã lệnh MO</th>
                  <th className="px-3 py-1.5 text-left">Cấu kiện</th>
                  <th className="px-3 py-1.5 text-center">Tiến độ</th>
                  <th className="px-3 py-1.5 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map((mo) => (
                  <tr key={mo.id} className="border-b border-white/5 text-slate-300">
                    <td className="px-3 py-1.5 font-mono font-semibold text-cyan-300">{mo.orderNo}</td>
                    <td className="px-3 py-1.5">{mo.componentCode || mo.title}</td>
                    <td className="px-3 py-1.5 text-center font-mono">{fmt(mo.progress || 0)}%</td>
                    <td className="px-3 py-1.5 text-right">
                      <span className="rounded bg-white/5 px-2 py-0.5">{mo.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CockpitTableShell>
        ) : (
          <CockpitEmptyState title="Không có lệnh sản xuất" description="Vui lòng khởi tạo MO tại phân hệ Sản xuất." />
        )}
      </CockpitChartCard>
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
  const waiting = dashboard?.kpis?.waiting || 0
  const transit = orders.filter((o) => o.status === 'IN_TRANSIT').length
  const completed = orders.filter((o) => o.status === 'COMPLETED' || o.status === 'ARRIVED').length

  if (loading) return <ModuleLoadingState label="Đang tải dữ liệu giao vận..." />

  return (
    <div className="space-y-1">
      <div className="grid gap-1 md:grid-cols-3">
        <CockpitKpiCard title="Chờ điều phối xe" value={fmt(waiting)} note="Lượt bốc hàng đang chờ" tone="amber" />
        <CockpitKpiCard title="Xe đang di chuyển" value={fmt(transit)} note="Đang vận chuyển trên đường" tone="cyan" />
        <CockpitKpiCard title="Lượt giao hoàn thành" value={fmt(completed)} note="Lịch xe hôm nay" tone="emerald" />
      </div>

      <CockpitChartCard title="Lịch trình Tuyến giao hàng">
        {orders.length > 0 ? (
          <CockpitTableShell className="max-h-[300px]">
            <table className="w-full text-xs">
              <thead className="text-slate-450 border-b border-white/10">
                <tr>
                  <th className="px-3 py-1.5 text-left">Mã chuyến xe</th>
                  <th className="px-3 py-1.5 text-left">Công trình nhận</th>
                  <th className="px-3 py-1.5 text-left">Xe chở</th>
                  <th className="px-3 py-1.5 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map((d) => (
                  <tr key={d.id} className="border-b border-white/5 text-slate-300">
                    <td className="px-3 py-1.5 font-mono font-semibold text-cyan-300">{d.code}</td>
                    <td className="px-3 py-1.5 truncate max-w-[200px]">{d.project?.name || '—'}</td>
                    <td className="px-3 py-1.5">{d.vehicle || 'Chưa gán'}</td>
                    <td className="px-3 py-1.5 text-right">
                      <span className="rounded bg-white/5 px-2 py-0.5 font-mono">{d.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CockpitTableShell>
        ) : (
          <CockpitEmptyState title="Không có lịch điều xe" description="Vui lòng lập tuyến điều xe tại phân hệ Logistics." />
        )}
      </CockpitChartCard>
    </div>
  )
}

// ==========================================
// 4. QC ANALYTICS SECTION
// ==========================================
function QcAnalyticsSection({ cockpit, loading }: { cockpit: any; loading: boolean }) {
  const passed = cockpit?.metrics?.passed || 0
  const failed = cockpit?.metrics?.failed || 0
  const openNcrs = cockpit?.metrics?.openNcrs || 0

  if (loading) return <ModuleLoadingState label="Đang tải dữ liệu QC chất lượng..." />

  return (
    <div className="space-y-1">
      <div className="grid gap-1 md:grid-cols-3">
        <CockpitKpiCard title="Số lượt QC Đạt" value={fmt(passed)} note="Đạt tiêu chuẩn xuất xưởng" tone="emerald" />
        <CockpitKpiCard title="Số lượt QC Lỗi" value={fmt(failed)} note="Phát hiện không đạt chất lượng" tone="red" />
        <CockpitKpiCard title="Sự cố NCR chưa đóng" value={fmt(openNcrs)} note="Cần hành động khắc phục gấp" tone="amber" />
      </div>

      <div className="grid gap-1 xl:grid-cols-2">
        <CockpitChartCard title="Phân bố Lỗi theo Loại">
          {cockpit?.byCategory?.length > 0 ? (
            <div className="space-y-2 max-h-[240px] overflow-y-auto text-xs">
              {cockpit.byCategory.map((cat: any) => (
                <div key={cat.category} className="flex justify-between border-b border-white/5 pb-1 text-slate-305">
                  <span>{cat.category}</span>
                  <span className="font-mono font-bold text-cyan-300">{fmt(cat.count)} lỗi</span>
                </div>
              ))}
            </div>
          ) : (
            <CockpitEmptyState title="Đạt chuẩn tuyệt đối" description="Không ghi nhận lỗi phân loại chất lượng nào." />
          )}
        </CockpitChartCard>

        <CockpitChartCard title="Danh sách Sự cố NCR chưa hoàn tất">
          {cockpit?.ncrs?.length > 0 ? (
            <div className="space-y-2 max-h-[240px] overflow-y-auto text-xs">
              {cockpit.ncrs.map((n: any) => (
                <div key={n.id} className="rounded-lg border border-red-500/20 bg-red-950/[0.03] p-2">
                  <div className="flex justify-between font-semibold text-white">
                    <span>{n.ncrNo}</span>
                    <span className="text-[10px] text-red-300">{n.severity}</span>
                  </div>
                  <p className="mt-1 text-slate-400">{n.title}</p>
                </div>
              ))}
            </div>
          ) : (
            <CockpitEmptyState title="Không có phiếu NCR" description="Không có sự cố không phù hợp nào đang mở." />
          )}
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

  if (loading) return <ModuleLoadingState label="Đang tải dữ liệu công trình..." />

  return (
    <div className="space-y-1">
      <div className="grid gap-1 md:grid-cols-2">
        <CockpitKpiCard title="Công trình đang thi công" value={fmt(active)} note="Đang sản xuất hoặc giao kiện" tone="cyan" />
        <CockpitKpiCard title="Tổng giá trị hợp đồng" value={formatCurrencyVnd(contractValue)} note="Tổng thầu xây dựng" tone="emerald" />
      </div>

      <CockpitChartCard title="Danh sách Tiến độ Công trình">
        {runtime?.projects && runtime.projects.length > 0 ? (
          <CockpitTableShell className="max-h-[300px]">
            <table className="w-full text-xs">
              <thead className="text-slate-450 border-b border-white/10">
                <tr>
                  <th className="px-3 py-1.5 text-left">Công trình</th>
                  <th className="px-3 py-1.5 text-right">Tiến độ WBS</th>
                  <th className="px-3 py-1.5 text-right">Tổng cấu kiện</th>
                </tr>
              </thead>
              <tbody>
                {runtime.projects.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 text-slate-300">
                    <td className="px-3 py-1.5 font-semibold text-white">{p.name}</td>
                    <td className="px-3 py-1.5 text-right font-mono font-bold text-cyan-300">{fmt(p.progress || 0)}%</td>
                    <td className="px-3 py-1.5 text-right font-mono">{fmt(p.componentCount || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CockpitTableShell>
        ) : (
          <CockpitEmptyState title="Không có công trình" description="Vui lòng khai báo công trình trong hệ thống." />
        )}
      </CockpitChartCard>
    </div>
  )
}

// ==========================================
// 6. PLANNING ANALYTICS SECTION
// ==========================================
function PlanningAnalyticsSection({
  orders,
  items,
  dispatches,
  loading,
}: {
  orders: any[]
  items: any[]
  dispatches: any[]
  loading: boolean
}) {
  const shortageCount = items.filter((i) => Number(i.quantity || 0) <= Number(i.minQuantity || 0)).length
  const totalMOs = orders.length
  const dispatchPlanned = dispatches.filter((d) => d.status === 'PLANNED').length

  if (loading) return <ModuleLoadingState label="Đang tải dữ liệu kế hoạch..." />

  return (
    <div className="space-y-1">
      <div className="grid gap-1 md:grid-cols-3">
        <CockpitKpiCard title="Mặt hàng thiếu hụt (MRP)" value={fmt(shortageCount)} note="Cần lệnh mua hoặc cấp phát gấp" tone="red" />
        <CockpitKpiCard title="Lịch sản xuất đã lập" value={fmt(totalMOs)} note="Lệnh sản xuất trong kế hoạch" tone="cyan" />
        <CockpitKpiCard title="Lịch chuyến xe đã lập" value={fmt(dispatchPlanned)} note="Chuyến giao vận kế hoạch" tone="blue" />
      </div>

      <CockpitChartCard title="Phân tích Rủi ro Kế hoạch">
        <div className="space-y-3 text-xs">
          <div className="rounded-lg border border-red-500/20 bg-red-950/[0.02] p-3">
            <span className="font-semibold text-white">Rủi ro dừng máy do thiếu thép tấm</span>
            <p className="mt-1 text-slate-400">Tồn kho thép tấm hiện tại còn 2.5 tấn, lượng tiêu thụ dự kiến trong 3 ngày tới là 4 tấn.</p>
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-950/[0.02] p-3">
            <span className="font-semibold text-white">Trễ chuyến bốc dỡ bãi cấu kiện</span>
            <p className="mt-1 text-slate-400">Có 3 xe đang chờ ở bãi bốc xếp Slots B, hiệu suất bốc dỡ cần tăng cường.</p>
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
  const okSteps = workflow?.steps?.filter((s: any) => s.status === 'OK').length ?? 0

  if (loading) return <ModuleLoadingState label="Đang tải dữ liệu quản trị hệ thống..." />

  return (
    <div className="space-y-1">
      <div className="grid gap-1 md:grid-cols-4">
        <CockpitKpiCard title="Tổng người dùng" value={fmt(totalUsers)} note="Tài khoản đã kích hoạt" tone="cyan" />
        <CockpitKpiCard title="Vai trò khai báo" value={fmt(totalRoles)} note="Nhóm quyền bảo mật" tone="blue" />
        <CockpitKpiCard title="Lượt lưu vết sự kiện" value={fmt(totalLogs)} note="Nhật ký thao tác thực tế" tone="purple" />
        <CockpitKpiCard title="Workflow Đạt chuẩn" value={fmt(okSteps)} note="Kiểm tra nghiệp vụ" tone="emerald" />
      </div>

      <CockpitChartCard title="Nhật ký Hoạt động Người dùng">
        <CockpitTableShell className="max-h-[300px]">
          <table className="w-full text-xs">
            <thead className="text-slate-450 border-b border-white/10">
              <tr>
                <th className="px-3 py-1.5 text-left">Thời gian</th>
                <th className="px-3 py-1.5 text-left">Người dùng</th>
                <th className="px-3 py-1.5 text-left">Hành động</th>
                <th className="px-3 py-1.5 text-right">Module</th>
              </tr>
            </thead>
            <tbody>
              {activityLogs.slice(0, 10).map((log) => (
                <tr key={log.id} className="border-b border-white/5 text-slate-300">
                  <td className="px-3 py-1.5 font-mono text-slate-450">{date(log.createdAt)}</td>
                  <td className="px-3 py-1.5 font-semibold text-white">{log.user?.fullName ?? log.user?.username ?? 'System'}</td>
                  <td className="px-3 py-1.5">{log.action}</td>
                  <td className="px-3 py-1.5 text-right font-mono text-cyan-300">{log.module || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CockpitTableShell>
      </CockpitChartCard>
    </div>
  )
}
