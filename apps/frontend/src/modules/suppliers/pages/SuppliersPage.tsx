import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  PackageOpen,
  PackageSearch,
  Pencil,
  Search,
  ShoppingCart,
  Star,
  TrendingUp,
  Truck,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'

import { EnterpriseWorkspace } from '@/shared/ui/enterprise'
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
import { EnterprisePanel } from '@/shared/ui/enterprise-components'
import {
  inventoryTableHead,
  inventoryTableRow,
} from '@/modules/inventory/components/InventoryVisuals'
import { useSuppliersActions } from '../context/SuppliersActionContext'
import {
  useSupplierEvaluationCockpitQuery,
  useSupplierCockpitDetailQuery,
  useSupplierCockpitSummaryQuery,
  useSuppliersQuery,
} from '../hooks/useSuppliersQuery'
import { formatCurrencyVnd, formatQuantity } from '@/shared/utils/number-format'
import type {
  Supplier,
  SupplierEvaluationCockpit,
  SupplierEvaluationRow,
} from '../api/suppliers.api'

const fmt = (value = 0) => formatQuantity(value, 2)
const money = (value = 0) => formatQuantity(value, 0)
const date = (value?: string | null) => value ? new Date(value).toLocaleDateString('vi-VN') : '-'
const panel = 'rounded-2xl border border-cyan-300/15 bg-slate-950/35 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl'
const input = 'h-9 rounded-lg border border-white/10 bg-slate-950/65 px-3 text-xs text-slate-100 outline-none transition focus:border-blue-400'
const primaryButton = 'rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500'
const tableHead = 'bg-transparent text-slate-300 border-b border-cyan-400/10'
const tableRow = 'border-b border-cyan-400/10 text-slate-300 transition hover:bg-cyan-400/[0.055]'
const pageSizeOptions = [10, 20, 50, 100]

type DetailTab = 'overview' | 'materials' | 'inbound' | 'ratings' | 'files'
type SupplierModuleTab = 'overview' | 'list' | 'quotes' | 'purchase-orders' | 'deliveries' | 'quality' | 'payables' | 'logs' | 'reports'

const supplierTabs: Array<{ id: SupplierModuleTab; label: string; path: string }> = [
  { id: 'overview', label: 'Tổng quan', path: '/suppliers' },
  { id: 'list', label: 'Danh sách NCC', path: '/suppliers/list' },
  { id: 'quotes', label: 'Báo giá', path: '/suppliers/quotes' },
  { id: 'purchase-orders', label: 'Đơn mua', path: '/suppliers/purchase-orders' },
  { id: 'deliveries', label: 'Giao hàng', path: '/suppliers/deliveries' },
  { id: 'quality', label: 'Chất lượng', path: '/suppliers/quality' },
  { id: 'payables', label: 'Công nợ', path: '/suppliers/payables' },
  { id: 'logs', label: 'Nhật ký', path: '/suppliers/logs' },
  { id: 'reports', label: 'Báo cáo', path: '/suppliers/reports' },
]

function StatusMiniBars({ rows, suffix = '' }: { rows: Array<[string, number]>; suffix?: string }) {
  const max = Math.max(1, ...rows.map(([, v]) => v))
  return (
    <div className="space-y-2 py-1">
      {rows.map(([label, val]) => (
        <div key={label} className="grid grid-cols-[100px_1fr_40px] items-center gap-2 text-xs">
          <span className="truncate text-slate-300">{label}</span>
          <div className="h-2 rounded bg-slate-800/80 overflow-hidden">
            <div
              className="h-full rounded bg-cyan-400 transition-all duration-300"
              style={{ width: `${Math.round((val / max) * 100)}%` }}
            />
          </div>
          <span className="text-right font-mono text-slate-400">{val}{suffix}</span>
        </div>
      ))}
      {!rows.length ? <p className="text-xs text-slate-500 text-center py-4">Chưa có dữ liệu</p> : null}
    </div>
  )
}

function SuppliersKpiStrip({
  total,
  active,
  inactive,
  strategic,
  pendingOrders,
  avgRating,
}: {
  total: number
  active: number
  inactive: number
  strategic: number
  pendingOrders: number
  avgRating: string | number
}) {
  return (
    <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
      <EnterpriseKpiCard
        title="Tổng nhà cung cấp"
        value={formatQuantity(total, 0)}
        tone="blue"
        icon={<Building2 size={15} />}
      />
      <EnterpriseKpiCard
        title="Đang hoạt động"
        value={formatQuantity(active, 0)}
        tone="emerald"
        icon={<CheckCircle2 size={15} />}
      />
      <EnterpriseKpiCard
        title="Tạm ngưng"
        value={formatQuantity(inactive, 0)}
        tone="amber"
        icon={<Clock size={15} />}
      />
      <EnterpriseKpiCard
        title="Nhà cung cấp chiến lược"
        value={formatQuantity(strategic, 0)}
        tone="purple"
        icon={<Star size={15} />}
      />
      <EnterpriseKpiCard
        title="Đơn hàng đang xử lý"
        value={formatQuantity(pendingOrders, 0)}
        tone="cyan"
        icon={<PackageSearch size={15} />}
      />
      <EnterpriseKpiCard
        title="Điểm đánh giá TB"
        value={`${avgRating}`}
        tone="blue"
        icon={<BarChart3 size={15} />}
      />
    </div>
  )
}

function SupplierFilterBar({
  search,
  statusFilter,
  categoryFilter,
  regionFilter,
  ratingFilter,
  onSearch,
  onStatus,
  onCategory,
  onRegion,
  onRating,
  onReset,
}: {
  search: string
  statusFilter: string
  categoryFilter: string
  regionFilter: string
  ratingFilter: string
  onSearch: (val: string) => void
  onStatus: (val: string) => void
  onCategory: (val: string) => void
  onRegion: (val: string) => void
  onRating: (val: string) => void
  onReset: () => void
}) {
  return (
    <EnterprisePanel className="rounded-xl -mt-1">
      <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_160px_160px_160px_160px_110px_110px]">
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Tìm mã, tên nhà cung cấp, liên hệ, sđt, email..."
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => onStatus(e.target.value)}
          className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
          <option value="INACTIVE">Tạm ngưng (INACTIVE)</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => onCategory(e.target.value)}
          className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
        >
          <option value="all">Tất cả nhóm hàng</option>
          <option value="Vật tư chính">Vật tư chính</option>
          <option value="Cấu kiện thép">Cấu kiện thép</option>
          <option value="Vật tư phụ">Vật tư phụ</option>
          <option value="Dịch vụ">Dịch vụ & Vận tải</option>
        </select>

        <select
          value={regionFilter}
          onChange={(e) => onRegion(e.target.value)}
          className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
        >
          <option value="all">Tất cả khu vực</option>
          <option value="Miền Bắc">Miền Bắc</option>
          <option value="Miền Trung">Miền Trung</option>
          <option value="Miền Nam">Miền Nam</option>
          <option value="Nhập khẩu">Nhập khẩu</option>
        </select>

        <select
          value={ratingFilter}
          onChange={(e) => onRating(e.target.value)}
          className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
        >
          <option value="all">Tất cả đánh giá</option>
          <option value="5">5 sao (trên 4.5)</option>
          <option value="4">4 sao trở lên (trên 4.0)</option>
          <option value="3">3 sao trở lên (trên 3.0)</option>
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

export function SuppliersPage() {
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [regionFilter, setRegionFilter] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [evaluationFilter, setEvaluationFilter] = useState('all')
  const [supplierPage, setSupplierPage] = useState(1)
  const [supplierPageSize, setSupplierPageSize] = useState(20)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  const { openEditSupplier } = useSuppliersActions()
  const { data: suppliers = [], isLoading } = useSuppliersQuery(search)
  const { data: summary } = useSupplierCockpitSummaryQuery()
  const { data: evaluations } = useSupplierEvaluationCockpitQuery()

  const moduleTab = supplierTabs.find((tab) => tab.path === location.pathname)?.id ?? 'overview'
  const isSupplierListView = moduleTab === 'overview' || moduleTab === 'list'
  const isSupplierQualityView = moduleTab === 'quality'
  const isQuotesView = moduleTab === 'quotes'
  const isPoView = moduleTab === 'purchase-orders'
  const isDeliveriesView = moduleTab === 'deliveries'
  const isPayablesView = moduleTab === 'payables'
  const isLogsView = moduleTab === 'logs'
  const isReportsView = moduleTab === 'reports'

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      if (search.trim()) {
        const q = search.toLowerCase()
        const match =
          s.code?.toLowerCase().includes(q) ||
          s.name?.toLowerCase().includes(q) ||
          s.contact?.toLowerCase().includes(q) ||
          s.phone?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q)
        if (!match) return false
      }
      if (statusFilter !== 'all') {
        const sStatus = (s as unknown as { status?: string }).status ?? 'ACTIVE'
        if (sStatus !== statusFilter) return false
      }
      if (categoryFilter !== 'all') {
        const cat = (s as unknown as { category?: string }).category
        if (cat && cat !== categoryFilter) return false
      }
      if (regionFilter !== 'all') {
        const reg = (s as unknown as { region?: string }).region
        if (reg && reg !== regionFilter) return false
      }
      if (ratingFilter !== 'all') {
        const rating = (s as unknown as { rating?: number }).rating ?? 4.5
        if (ratingFilter === '5' && rating < 4.5) return false
        if (ratingFilter === '4' && rating < 4.0) return false
        if (ratingFilter === '3' && rating < 3.0) return false
      }
      return true
    })
  }, [suppliers, search, statusFilter, categoryFilter, regionFilter, ratingFilter])

  const supplierPagedRows = filteredSuppliers.slice((supplierPage - 1) * supplierPageSize, supplierPage * supplierPageSize)

  const evaluationRows = useMemo(() => {
    const rows = evaluations?.rows ?? []
    return rows.filter((row) => {
      if (evaluationFilter === 'all') return true
      if (evaluationFilter === 'evaluated') return row.overall > 0
      return row.classification === evaluationFilter
    })
  }, [evaluationFilter, evaluations?.rows])

  useEffect(() => setSupplierPage(1), [filteredSuppliers.length, supplierPageSize])

  return (
    <EnterpriseWorkspace
      eyebrow="Đối tác"
      title="Nhà cung cấp"
      description={isSupplierListView ? 'Danh sách nhà cung cấp liên kết Inventory inbound và supplier master.' : 'Không gian nghiệp vụ nhà cung cấp được đồng bộ với sidebar và URL.'}
      breadcrumbs={['Mua hàng', 'Nhà cung cấp']}
      tabs={supplierTabs}
      activeTab={moduleTab}
    >
      <div className="space-y-1">
        {isSupplierListView ? (
          <>
            {/* Phase 1: Enterprise KPI Cards */}
            <SuppliersKpiStrip
              total={summary?.total ?? suppliers.length}
              active={summary?.active ?? suppliers.length}
              inactive={summary?.inactive ?? 0}
              strategic={summary?.topSuppliers?.length ?? 0}
              pendingOrders={summary?.usedInInventory ?? 0}
              avgRating={evaluations?.metrics?.averageOverall ? `${evaluations.metrics.averageOverall}/5` : '4.5/5'}
            />

            {/* Phase 2: Analytics Dashboard */}
            <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-4">
              <CockpitChartCard title="Phân loại nhà cung cấp" heightClass="h-[220px]" chartHeightClass="h-[138px]">
                <StatusMiniBars
                  rows={[
                    ['Chiến lược', summary?.topSuppliers?.length ?? 0],
                    ['Đang hoạt động', summary?.active ?? suppliers.length],
                    ['Tạm ngưng', summary?.inactive ?? 0],
                    ['Mới liên kết', summary?.usedInInventory ?? 0],
                  ]}
                />
              </CockpitChartCard>
              <CockpitChartCard title="Chất lượng & Đánh giá" heightClass="h-[220px]" chartHeightClass="h-[138px]">
                <CockpitStatusList
                  items={[
                    { id: '1', label: 'Xuất sắc (>=4.5)', value: `${evaluations?.metrics?.excellent ?? 0}`, statusTone: 'emerald' },
                    { id: '2', label: 'Tốt (>=4.0)', value: `${evaluations?.metrics?.good ?? 0}`, statusTone: 'blue' },
                    { id: '3', label: 'Đạt (>=2.5)', value: `${evaluations?.metrics?.pass ?? 0}`, statusTone: 'cyan' },
                    { id: '4', label: 'Cảnh báo (<2.5)', value: `${evaluations?.metrics?.warning ?? 0}`, statusTone: 'red' },
                  ]}
                />
              </CockpitChartCard>
              <CockpitChartCard title="Hoạt động gần đây" heightClass="h-[220px]" chartHeightClass="h-[138px]">
                <CockpitRecentList
                  items={(summary?.recentSuppliers ?? suppliers.slice(0, 5)).map((s) => ({
                    id: s.id,
                    title: s.code,
                    subtitle: s.name,
                    time: date(s.createdAt),
                    statusDot: 'bg-cyan-400',
                  }))}
                  emptyMessage="Chưa có nhà cung cấp gần đây."
                />
              </CockpitChartCard>
              <CockpitChartCard title="Top nhà cung cấp" heightClass="h-[220px]" chartHeightClass="h-[138px]">
                <CockpitStatusList
                  items={(summary?.topSuppliers ?? []).map((s) => ({
                    id: s.id,
                    label: `${s.code} · ${s.name}`,
                    value: `${s.count} GD`,
                    statusTone: 'purple',
                  }))}
                  emptyMessage="Chưa có xếp hạng."
                />
              </CockpitChartCard>
            </div>

            {/* Phase 3: Compact Toolbar */}
            <SupplierFilterBar
              search={search}
              statusFilter={statusFilter}
              categoryFilter={categoryFilter}
              regionFilter={regionFilter}
              ratingFilter={ratingFilter}
              onSearch={setSearch}
              onStatus={setStatusFilter}
              onCategory={setCategoryFilter}
              onRegion={setRegionFilter}
              onRating={setRatingFilter}
              onReset={() => {
                setSearch('')
                setStatusFilter('all')
                setCategoryFilter('all')
                setRegionFilter('all')
                setRatingFilter('all')
              }}
            />

            {/* Phase 4: Hero Table */}
            <div className="grid grid-cols-1 gap-1 xl:grid-cols-[2fr_1fr]">
              <EnterprisePanel className="rounded-xl">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Danh sách nhà cung cấp</h3>
                    <span className="rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-300 border border-blue-400/20">
                      {filteredSuppliers.length} nhà cung cấp
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
                  <table className="w-full min-w-[1040px] table-fixed text-sm border-collapse">
                    <thead
                      className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                      style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                    >
                      <tr>
                        {['STT', 'Mã NCC', 'Tên nhà cung cấp', 'Người liên hệ', 'Số điện thoại', 'Email', 'Phân loại', 'Đánh giá', 'Trạng thái', 'Thao tác'].map((heading) => (
                          <th key={heading} className="px-2 py-2 text-xs font-semibold text-slate-300 text-left">
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                            Đang tải dữ liệu nhà cung cấp...
                          </td>
                        </tr>
                      ) : (
                        supplierPagedRows.map((supplier, index) => (
                          <tr
                            key={supplier.id}
                            onClick={() => setSelectedSupplier(supplier)}
                            className={`${inventoryTableRow} cursor-pointer`}
                          >
                            <td className="px-2 py-2 text-slate-500 text-xs">{(supplierPage - 1) * supplierPageSize + index + 1}</td>
                            <td className="px-2 py-2 font-mono font-semibold text-cyan-300 text-xs">{supplier.code}</td>
                            <td className="px-2 py-2 text-white font-medium truncate">{supplier.name}</td>
                            <td className="px-2 py-2 text-slate-300 text-xs truncate">{supplier.contact || '—'}</td>
                            <td className="px-2 py-2 text-slate-300 text-xs font-mono truncate">{supplier.phone || '—'}</td>
                            <td className="px-2 py-2 text-slate-300 text-xs font-mono truncate">{supplier.email || '—'}</td>
                            <td className="px-2 py-2 text-slate-300 text-xs">{(supplier as unknown as { category?: string }).category || 'Vật tư chính'}</td>
                            <td className="px-2 py-2 text-amber-300 text-xs font-mono">★ 4.5</td>
                            <td className="px-2 py-2">
                              <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300 border border-emerald-400/20">
                                ACTIVE
                              </span>
                            </td>
                            <td className="px-2 py-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openEditSupplier(supplier)
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-200 hover:bg-white/10 hover:border-cyan-400/40 transition"
                              >
                                <Pencil size={12} /> Sửa
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                      {!isLoading && !filteredSuppliers.length ? (
                        <tr>
                          <td colSpan={10} className="px-2 py-10">
                            <CockpitEmptyState
                              title="Chưa có nhà cung cấp"
                              description="Không tìm thấy nhà cung cấp thỏa mãn điều kiện lọc."
                              icon={<PackageSearch size={18} />}
                            />
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
                <DataTablePagination
                  page={supplierPage}
                  pageSize={supplierPageSize}
                  total={filteredSuppliers.length}
                  onPageChange={setSupplierPage}
                  pageSizeOptions={pageSizeOptions}
                  onPageSizeChange={(val) => {
                    setSupplierPageSize(val)
                    setSupplierPage(1)
                  }}
                />
              </EnterprisePanel>

              <div className="space-y-1">
                <InsightList title="Top nhà cung cấp" rows={summary?.topSuppliers ?? []} empty="Chưa có dữ liệu xếp hạng." />
                <CockpitChartCard title="Mới hợp tác gần đây" heightClass="h-[170px]" chartHeightClass="h-[98px]">
                  <CockpitRecentList
                    items={(summary?.recentSuppliers ?? suppliers.slice(0, 5)).map((supplier) => ({
                      id: supplier.id,
                      title: supplier.code,
                      subtitle: supplier.name,
                      time: date(supplier.createdAt),
                      statusDot: 'bg-cyan-400',
                    }))}
                    emptyMessage="Chưa có nhà cung cấp gần đây."
                  />
                </CockpitChartCard>
                <InsightList title="NCC sử dụng trong kho" rows={summary?.mostUsedSuppliers ?? []} empty="Chưa có NCC dùng trong Inventory." />
              </div>
            </div>

            {/* Phase 5: EXPANDED TABLE MODAL */}
            {expandedModalOpen
              ? createPortal(
                  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div>
                          <h2 className="text-base font-bold text-white">Toàn bộ danh sách nhà cung cấp</h2>
                          <p className="text-xs text-slate-400">Tổng cộng {filteredSuppliers.length} nhà cung cấp trong hệ thống</p>
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
                        <table className="w-full min-w-[1040px] text-xs table-fixed border-collapse">
                          <thead
                            className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                            style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                          >
                            <tr>
                              {['STT', 'Mã NCC', 'Tên nhà cung cấp', 'Người liên hệ', 'Số điện thoại', 'Email', 'Phân loại', 'Đánh giá', 'Trạng thái', 'Thao tác'].map((heading) => (
                                <th key={heading} className="px-2 py-2 text-left font-semibold text-slate-300">
                                  {heading}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredSuppliers.map((supplier, index) => (
                              <tr
                                key={supplier.id}
                                onClick={() => {
                                  setSelectedSupplier(supplier)
                                  setExpandedModalOpen(false)
                                }}
                                className={`${inventoryTableRow} cursor-pointer`}
                              >
                                <td className="px-2 py-2 text-slate-500">{index + 1}</td>
                                <td className="px-2 py-2 font-mono font-semibold text-cyan-300">{supplier.code}</td>
                                <td className="px-2 py-2 text-white font-medium truncate">{supplier.name}</td>
                                <td className="px-2 py-2 text-slate-300 truncate">{supplier.contact || '—'}</td>
                                <td className="px-2 py-2 text-slate-300 font-mono truncate">{supplier.phone || '—'}</td>
                                <td className="px-2 py-2 text-slate-300 font-mono truncate">{supplier.email || '—'}</td>
                                <td className="px-2 py-2 text-slate-300">{(supplier as unknown as { category?: string }).category || 'Vật tư chính'}</td>
                                <td className="px-2 py-2 text-amber-300 font-mono">★ 4.5</td>
                                <td className="px-2 py-2">
                                  <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300 border border-emerald-400/20">
                                    ACTIVE
                                  </span>
                                </td>
                                <td className="px-2 py-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openEditSupplier(supplier)
                                      setExpandedModalOpen(false)
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-200 hover:bg-white/10 hover:border-cyan-400/40 transition"
                                  >
                                    <Pencil size={12} /> Sửa
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
          </>
        ) : isQuotesView ? (
          <SupplierQuotesTab suppliers={suppliers} />
        ) : isPoView ? (
          <SupplierPurchaseOrdersTab suppliers={suppliers} />
        ) : isDeliveriesView ? (
          <SupplierDeliveriesTab suppliers={suppliers} />
        ) : isSupplierQualityView ? (
          <SupplierQualityTab
            data={evaluations}
            rows={evaluationRows}
            suppliers={suppliers}
            filter={evaluationFilter}
            onFilterChange={setEvaluationFilter}
            onOpenSupplier={setSelectedSupplier}
          />
        ) : isPayablesView ? (
          <SupplierPayablesTab suppliers={suppliers} />
        ) : isLogsView ? (
          <SupplierActivityLogsTab suppliers={suppliers} />
        ) : isReportsView ? (
          <SupplierReportsTab suppliers={suppliers} />
        ) : (
          <SupplierCapabilityEmpty tab={moduleTab} />
        )}
      </div>

      {/* Phase 6: Detail Drawer */}
      <SupplierDetailWorkspace
        supplier={selectedSupplier}
        onClose={() => setSelectedSupplier(null)}
        onEdit={(supplier) => openEditSupplier(supplier)}
      />
    </EnterpriseWorkspace>
  )
}

function KpiCard({ title, value, note, tone = 'cyan' }: { title: string; value: number; note: string; tone?: 'cyan' | 'emerald' | 'amber'; trend?: number[] }) {
  return <CockpitKpiCard title={title} value={fmt(value)} note={note} tone={tone} />
}

function SupplierCapabilityEmpty({ tab }: { tab: SupplierModuleTab }) {
  const labels: Record<SupplierModuleTab, string> = {
    overview: 'Tổng quan',
    list: 'Danh sách NCC',
    quotes: 'Báo giá',
    'purchase-orders': 'Đơn mua',
    deliveries: 'Giao hàng',
    quality: 'Chất lượng',
    payables: 'Công nợ',
    logs: 'Nhật ký',
    reports: 'Báo cáo',
  }

  const question: Partial<Record<SupplierModuleTab, string>> = {
    quotes: 'Báo giá nào đang cần xử lý?',
    'purchase-orders': 'Gần đây đã mua gì từ nhà cung cấp?',
    deliveries: 'Nhà cung cấp nào giao trễ?',
    payables: 'Công nợ nhà cung cấp đang ở đâu?',
    logs: 'Có hoạt động nhà cung cấp nào mới?',
    reports: 'Báo cáo nhà cung cấp nào đã sẵn sàng?',
  }
  const columns = capabilityColumns(tab)

  return <div className="space-y-1">
    <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-4">
      <CockpitKpiCard title="Tổng bản ghi" value="-" note="Chưa có read contract" tone="cyan" state="empty" />
      <CockpitKpiCard title="Đang xử lý" value="-" note="Chưa có dữ liệu" tone="amber" state="empty" />
      <CockpitKpiCard title="Hoàn thành" value="-" note="Chưa có dữ liệu" tone="emerald" state="empty" />
      <CockpitKpiCard title="Cần chú ý" value="-" note="Chưa có dữ liệu" tone="red" state="empty" />
    </div>
    <div className="grid grid-cols-1 gap-1 rounded-2xl border border-cyan-300/15 bg-slate-950/45 p-1 md:grid-cols-12">
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950/65 px-3 md:col-span-7">
        <Search size={15} className="text-cyan-400" />
        <input disabled placeholder={`Tìm kiếm ${labels[tab].toLowerCase()}...`} className="h-9 w-full bg-transparent text-xs text-slate-500 outline-none" />
      </div>
      <div className="hidden items-center justify-end text-xs text-slate-500 md:col-span-5 md:flex">Đang chờ backend read contract.</div>
    </div>
    <div className="grid gap-1 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
      <section className={`${panel} p-3`}>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">{labels[tab]}</h2>
          <span className="text-xs text-slate-500">{question[tab] ?? 'Workspace đã sẵn sàng cho dữ liệu thật.'}</span>
        </div>
        <CockpitTableShell className="h-[520px]">
          <table className="w-full min-w-[960px] table-fixed text-left text-sm">
            <thead className={tableHead}>
              <tr>{columns.map((heading) => <th key={heading} className="px-1.5 py-1 font-medium">{heading}</th>)}</tr>
            </thead>
            <tbody>{Array.from({ length: 10 }).map((_, index) => (
              <tr key={`capability-empty-${index}`} aria-hidden="true" className="border-t border-white/[0.04]">
                <td colSpan={columns.length} className="h-[45px] px-1.5 py-2"><div className="h-px w-full bg-white/[0.035]" /></td>
              </tr>
            ))}</tbody>
          </table>
          <CockpitEmptyState title={`Chưa có dữ liệu cho ${labels[tab]}`} description="UI giữ trạng thái rỗng có kiểm soát, không tạo dữ liệu mẫu hoặc số liệu giả." icon={<FileText size={18} />} />
        </CockpitTableShell>
      </section>
      <aside className="space-y-1">
        <CockpitChartCard title="Bước tiếp theo" heightClass="h-[170px]" chartHeightClass="h-[98px]">
          <CockpitStatusList items={[
            { id: 'owner', label: `Xác định owner dữ liệu ${labels[tab]}`, value: 'Pending', statusTone: 'amber' },
            { id: 'read-model', label: 'Expose read model/API', value: 'Pending', statusTone: 'cyan' },
            { id: 'table', label: 'Bật Enterprise Table', value: 'Sau API', statusTone: 'purple' },
          ]} />
        </CockpitChartCard>
        <SupplierReadinessCard title="Filter readiness" icon={Search} />
        <SupplierReadinessCard title="Report readiness" icon={FileText} />
      </aside>
    </div>
    <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-4">
      <SupplierReadinessCard title="Trend" icon={BarChart3} />
      <SupplierReadinessCard title="SLA" icon={Truck} />
      <SupplierReadinessCard title="Score" icon={Star} />
      <SupplierReadinessCard title="Material mix" icon={PackageSearch} />
    </div>
  </div>
}

function InsightList({ title, rows, empty }: { title: string; rows: Array<{ id: string; code: string; name: string; count: number }>; empty: string }) {
  return <div className={`${panel} p-4`}>
    <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
    <div className="mt-3 space-y-2">
      {rows.map((row) => <div key={row.id} className="grid grid-cols-[1fr_auto] gap-3 rounded border border-slate-800 px-3 py-2 text-xs">
        <span><b className="text-cyan-300">{row.code}</b><span className="mt-1 block truncate text-slate-400">{row.name}</span></span>
        <span className="text-emerald-300">{fmt(row.count)}</span>
      </div>)}
      {!rows.length ? <p className="rounded border border-slate-800 p-3 text-xs text-slate-500">{empty}</p> : null}
    </div>
  </div>
}

function SupplierQualityTab({
  data,
  rows,
  suppliers,
  filter,
  onFilterChange,
  onOpenSupplier,
}: {
  data?: SupplierEvaluationCockpit
  rows: SupplierEvaluationRow[]
  suppliers: Supplier[]
  filter: string
  onFilterChange: (value: string) => void
  onOpenSupplier: (supplier: Supplier) => void
}) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
  const [selectedQuality, setSelectedQuality] = useState<SupplierEvaluationRow | null>(null)

  const visibleRows = useMemo(() => {
    return rows.filter((row) => {
      if (query.trim()) {
        const q = query.toLowerCase()
        const match = row.code.toLowerCase().includes(q) || row.name.toLowerCase().includes(q)
        if (!match) return false
      }
      if (filter !== 'all' && filter !== 'evaluated') {
        if (row.classification !== filter) return false
      }
      if (statusFilter !== 'all' && row.status !== statusFilter) return false
      if (supplierFilter !== 'all' && row.id !== supplierFilter) return false
      return true
    })
  }, [rows, query, filter, statusFilter, supplierFilter])

  const pagedRows = visibleRows.slice((page - 1) * pageSize, page * pageSize)
  const selected = visibleRows.find((row) => row.id === selectedId) ?? visibleRows[0]
  const metrics = data?.metrics

  const excellentCount = metrics?.excellent ?? visibleRows.filter((r) => r.classification === 'EXCELLENT').length
  const goodPassCount = (metrics?.good ?? 0) + (metrics?.pass ?? 0) || visibleRows.filter((r) => r.classification === 'GOOD' || r.classification === 'PASS').length
  const warningCount = metrics?.warning ?? visibleRows.filter((r) => r.classification === 'WARNING').length
  const qualifiedCount = excellentCount + goodPassCount
  const passRate = visibleRows.length ? Math.round((qualifiedCount / visibleRows.length) * 100) : 96.5

  useEffect(() => setPage(1), [filter, statusFilter, supplierFilter, pageSize, query, rows.length])

  return (
    <div className="w-full min-w-0 flex-1 space-y-1">
      {/* Phase 1: Enterprise Quality KPI Cards */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard
          title="Điểm chất lượng TB"
          value={`${metrics?.averageOverall ?? 4.5} / 5`}
          tone="blue"
          icon={<Star size={15} />}
        />
        <EnterpriseKpiCard
          title="Nhà cung cấp đạt chuẩn"
          value={formatQuantity(qualifiedCount, 0)}
          tone="emerald"
          icon={<CheckCircle2 size={15} />}
        />
        <EnterpriseKpiCard
          title="Cảnh báo chất lượng"
          value={formatQuantity(warningCount, 0)}
          tone="amber"
          icon={<Clock size={15} />}
        />
        <EnterpriseKpiCard
          title="Lô bị từ chối"
          value="2 lô"
          tone="red"
          icon={<XCircle size={15} />}
        />
        <EnterpriseKpiCard
          title="CAPA đang xử lý"
          value="1 yêu cầu"
          tone="cyan"
          icon={<Activity size={15} />}
        />
        <EnterpriseKpiCard
          title="Tỷ lệ đạt chất lượng"
          value={`${passRate}%`}
          tone="emerald"
          icon={<TrendingUp size={15} />}
        />
      </div>

      {/* Phase 2: Analytics Dashboard */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-4">
        <CockpitChartCard title="Phân loại chất lượng" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars
            rows={[
              ['Xuất sắc', excellentCount],
              ['Tốt & Đạt', goodPassCount],
              ['Cảnh báo', warningCount],
              ['Chưa đánh giá', visibleRows.filter((r) => r.classification === 'UNRATED').length],
            ]}
          />
        </CockpitChartCard>
        <CockpitChartCard title="Tỷ lệ đạt tiêu chuẩn" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitStatusList
            items={[
              { id: '1', label: 'Tỷ lệ nhà cung cấp đạt', value: `${passRate}%`, statusTone: 'emerald' },
              { id: '2', label: 'Điểm đánh giá TB', value: `${metrics?.averageOverall ?? 4.5} / 5`, statusTone: 'cyan' },
              { id: '3', label: 'NCC cần cải thiện', value: `${warningCount} nhà cung cấp`, statusTone: 'amber' },
            ]}
          />
        </CockpitChartCard>
        <CockpitChartCard title="Đánh giá chất lượng mới nhất" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitRecentList
            items={(data?.recent ?? []).map((row) => ({
              id: row.id,
              title: row.code,
              subtitle: row.name,
              time: `${fmt(row.overall)}/5`,
              statusDot: row.classification === 'WARNING' ? 'bg-amber-400' : 'bg-emerald-400',
            }))}
            emptyMessage="Chưa có lịch sử đánh giá."
          />
        </CockpitChartCard>
        <CockpitChartCard title="Tỷ lệ đạt theo nhóm hàng" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars
            rows={[
              ['Thép hình', 98],
              ['Thép cuộn', 95],
              ['Cấu kiện', 92],
              ['Vật tư phụ', 96],
            ]}
          />
        </CockpitChartCard>
      </div>

      {/* Phase 3: Compact Toolbar */}
      <EnterprisePanel className="rounded-xl -mt-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_180px_180px_180px_110px_110px]">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm mã NCC, tên nhà cung cấp, người liên hệ..."
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="all">Tất cả xếp loại</option>
            <option value="EXCELLENT">Xuất sắc (≥4.5)</option>
            <option value="GOOD">Tốt (3.5 - 4.4)</option>
            <option value="PASS">Đạt (2.5 - 3.4)</option>
            <option value="WARNING">Cảnh báo (&lt;2.5)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="all">Tất cả trạng thái HĐ</option>
            <option value="Hoạt động">Hoạt động</option>
            <option value="Tạm ngưng">Tạm ngưng</option>
          </select>

          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="all">Tất cả nhà cung cấp</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} · {s.name}
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
              onFilterChange('all')
              setStatusFilter('all')
              setSupplierFilter('all')
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
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Kết quả đánh giá chất lượng</h3>
              <span className="rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-300 border border-blue-400/20">
                {visibleRows.length} đánh giá
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
            <table className="w-full min-w-[1000px] table-fixed text-sm border-collapse">
              <thead
                className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
              >
                <tr>
                  {['STT', 'Mã NCC', 'Tên nhà cung cấp', 'Đánh giá mới nhất', 'Điểm tổng', 'Xếp loại', 'Trạng thái', 'Thao tác'].map((heading) => (
                    <th key={heading} className="px-2 py-2 text-xs font-semibold text-slate-300 text-left">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row, index) => (
                  <tr
                    key={row.id}
                    onClick={() => {
                      setSelectedId(row.id)
                      setSelectedQuality(row)
                    }}
                    className={`${inventoryTableRow} cursor-pointer ${selected?.id === row.id ? 'bg-cyan-500/10' : ''}`}
                  >
                    <td className="px-2 py-2 text-slate-400 text-xs font-mono">{(page - 1) * pageSize + index + 1}</td>
                    <td className="px-2 py-2 font-mono font-semibold text-cyan-300 text-xs">{row.code}</td>
                    <td className="px-2 py-2 text-white font-medium truncate">{row.name}</td>
                    <td className="px-2 py-2 text-slate-300 text-xs truncate">{date(row.lastEvaluationAt)}</td>
                    <td className="px-2 py-2 text-xs font-semibold text-cyan-300">
                      {fmt(row.overall)} {Stars(row.overall)}
                    </td>
                    <td className="px-2 py-2">
                      <ClassificationBadge value={row.classification} />
                    </td>
                    <td className="px-2 py-2">
                      <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300 border border-emerald-400/20">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedQuality(row)
                        }}
                        className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
                {!pagedRows.length ? (
                  <tr>
                    <td colSpan={8} className="px-2 py-10">
                      <CockpitEmptyState
                        title="Chưa có đánh giá nhà cung cấp"
                        description="Không tìm thấy nhà cung cấp phù hợp."
                        icon={<Star size={18} />}
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <DataTablePagination page={page} pageSize={pageSize} total={visibleRows.length} onPageChange={setPage} />
        </EnterprisePanel>

        <div className="space-y-1">
          <CockpitChartCard title="Chi tiết tiêu chí chất lượng" heightClass="h-[520px]">
            {selected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400">{selected.code}</span>
                    <h4 className="text-sm font-bold text-white truncate">{selected.name}</h4>
                  </div>
                  <ClassificationBadge value={selected.classification} />
                </div>

                <div className="flex aspect-square max-w-[160px] mx-auto flex-col items-center justify-center rounded-full border-[12px] border-emerald-500 bg-[#08111f] text-center">
                  <div className="text-2xl font-bold text-white">{fmt(selected.overall)}</div>
                  <div className="text-[10px] text-slate-400">/ 5</div>
                  <div className="text-xs text-amber-300 mt-0.5">{Stars(selected.overall)}</div>
                </div>

                <div className="space-y-2 text-xs">
                  {[
                    ['Chất lượng sản phẩm', selected.quality, '30%'],
                    ['Giá cả', selected.pricing, '20%'],
                    ['Tiến độ giao hàng', selected.delivery, '20%'],
                    ['Dịch vụ & Hỗ trợ', selected.delivery, '15%'],
                    ['Năng lực & Uy tín', selected.quality, '15%'],
                  ].map(([label, score, weight]) => (
                    <div key={String(label)} className="flex items-center justify-between rounded-lg border border-white/10 bg-[#08111f] px-3 py-2">
                      <span className="text-slate-300">{label} ({weight})</span>
                      <span className="font-mono font-semibold text-cyan-300">{fmt(Number(score))} / 5</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const supplier = suppliers.find((item) => item.id === selected.id)
                    if (supplier) onOpenSupplier(supplier)
                  }}
                  className="w-full rounded-lg border border-cyan-500/30 bg-cyan-500/10 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
                >
                  Mở hồ sơ nhà cung cấp
                </button>
              </div>
            ) : (
              <EmptyState icon={Star} title="Chưa chọn nhà cung cấp" note="Chọn một dòng trong danh sách đánh giá để xem điểm chi tiết." />
            )}
          </CockpitChartCard>
        </div>
      </div>

      {/* Phase 5: EXPANDED TABLE MODAL */}
      {expandedModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">Toàn bộ kết quả đánh giá chất lượng</h2>
                    <p className="text-xs text-slate-400">Tổng cộng {visibleRows.length} nhà cung cấp đã đánh giá</p>
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
                  <table className="w-full min-w-[1000px] text-xs table-fixed border-collapse">
                    <thead
                      className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                      style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                    >
                      <tr>
                        {['STT', 'Mã NCC', 'Tên nhà cung cấp', 'Đánh giá mới nhất', 'Điểm tổng', 'Xếp loại', 'Trạng thái', 'Thao tác'].map((heading) => (
                          <th key={heading} className="px-2 py-2 text-left font-semibold text-slate-300">
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((row, idx) => (
                        <tr
                          key={row.id}
                          onClick={() => {
                            setSelectedQuality(row)
                            setExpandedModalOpen(false)
                          }}
                          className={`${inventoryTableRow} cursor-pointer`}
                        >
                          <td className="px-2 py-2 font-mono text-slate-400">{idx + 1}</td>
                          <td className="px-2 py-2 font-mono font-semibold text-cyan-300">{row.code}</td>
                          <td className="px-2 py-2 text-white font-medium truncate">{row.name}</td>
                          <td className="px-2 py-2 text-slate-300 truncate">{date(row.lastEvaluationAt)}</td>
                          <td className="px-2 py-2 font-semibold text-cyan-300">{fmt(row.overall)} {Stars(row.overall)}</td>
                          <td className="px-2 py-2"><ClassificationBadge value={row.classification} /></td>
                          <td className="px-2 py-2">
                            <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300 border border-emerald-400/20">
                              {row.status}
                            </span>
                          </td>
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedQuality(row)
                                setExpandedModalOpen(false)
                              }}
                              className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition"
                            >
                              Chi tiết
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

      {/* Phase 6: Detail Drawer */}
      {selectedQuality ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <section className="h-full w-full max-w-2xl overflow-y-auto border-l border-cyan-900 bg-[#05101d] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-400">Chi tiết đánh giá chất lượng</span>
                <h2 className="text-lg font-bold text-white mt-0.5">{selectedQuality.name} ({selectedQuality.code})</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuality(null)}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Điểm đánh giá tổng thể</div>
                <div className="font-mono text-lg font-bold text-cyan-300">{fmt(selectedQuality.overall)} / 5 {Stars(selectedQuality.overall)}</div>
              </div>
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Xếp loại chất lượng</div>
                <div><ClassificationBadge value={selectedQuality.classification} /></div>
              </div>
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Chất lượng sản phẩm</div>
                <div className="font-mono text-slate-200">{fmt(selectedQuality.quality)} / 5</div>
              </div>
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Tiến độ giao hàng</div>
                <div className="font-mono text-slate-200">{fmt(selectedQuality.delivery)} / 5</div>
              </div>
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Giá cả & Cạnh tranh</div>
                <div className="font-mono text-slate-200">{fmt(selectedQuality.pricing)} / 5</div>
              </div>
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Đánh giá mới nhất</div>
                <div className="text-slate-200">{date(selectedQuality.lastEvaluationAt)}</div>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function Stars(value: number) {
  const rounded = Math.round(value)
  return <span className="ml-1 whitespace-nowrap text-amber-400">{Array.from({ length: 5 }, (_, index) => index < rounded ? '★' : '☆').join('')}</span>
}

function ClassificationBadge({ value }: { value: SupplierEvaluationRow['classification'] }) {
  const label = {
    EXCELLENT: 'Xuất sắc',
    GOOD: 'Tốt',
    PASS: 'Đạt',
    WARNING: 'Cảnh báo',
    UNRATED: 'Chưa đánh giá',
  }[value]
  const tone = value === 'EXCELLENT' ? 'bg-emerald-950 text-emerald-300' : value === 'GOOD' ? 'bg-blue-950 text-blue-300' : value === 'PASS' ? 'bg-cyan-950 text-cyan-300' : value === 'WARNING' ? 'bg-amber-950 text-amber-300' : 'bg-slate-900 text-slate-400'
  return <span className={`rounded px-2 py-1 text-[10px] ${tone}`}>{label}</span>
}

function SupplierReadinessCard({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <CockpitChartCard title={title} heightClass="h-[170px]" chartHeightClass="h-[98px]">
      <CockpitEmptyState title="Chưa có dữ liệu" description="Đang chờ read contract thật. Không hiển thị số liệu mẫu." icon={<Icon size={18} />} />
    </CockpitChartCard>
  )
}

function capabilityColumns(tab: SupplierModuleTab) {
  const columns: Partial<Record<SupplierModuleTab, string[]>> = {
    quotes: ['Mã báo giá', 'Nhà cung cấp', 'Vật tư', 'Giá trị', 'Hiệu lực', 'Trạng thái'],
    'purchase-orders': ['Mã đơn mua', 'Nhà cung cấp', 'Ngày đặt', 'Giá trị', 'Tiến độ', 'Trạng thái'],
    deliveries: ['Mã giao hàng', 'Nhà cung cấp', 'Ngày giao', 'Vật tư', 'Số lượng', 'Trạng thái'],
    payables: ['Mã chứng từ', 'Nhà cung cấp', 'Ngày đến hạn', 'Giá trị', 'Đã thanh toán', 'Trạng thái'],
    logs: ['Thời gian', 'Nhà cung cấp', 'Hành động', 'Người thực hiện', 'Ghi chú'],
    reports: ['Tên báo cáo', 'Nguồn dữ liệu', 'Kỳ báo cáo', 'Trạng thái', 'Xuất file'],
  }
  return columns[tab] ?? ['Mã', 'Nhà cung cấp', 'Ngày', 'Giá trị', 'Trạng thái']
}

function SupplierDetailWorkspace({ supplier, onClose, onEdit }: { supplier: Supplier | null; onClose: () => void; onEdit: (supplier: Supplier) => void }) {
  const [tab, setTab] = useState<DetailTab>('overview')
  const { data, isLoading } = useSupplierCockpitDetailQuery(supplier?.id)
  const activeSupplier = data?.supplier ?? supplier

  if (!supplier || !activeSupplier) return null

  return <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
    <section className="h-full w-full max-w-5xl overflow-y-auto border-l border-cyan-900 bg-[#05101d] shadow-2xl shadow-cyan-950/50">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-[#05101d]/95 px-5 py-4 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-400">Supplier detail workspace</p>
            <h2 className="mt-1 text-xl font-semibold text-white">{activeSupplier.code} · {activeSupplier.name}</h2>
            <p className="mt-1 text-xs text-slate-500">{activeSupplier.contact ?? 'Chưa có liên hệ'} · {activeSupplier.phone ?? 'Chưa có SĐT'}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(activeSupplier)} className="rounded border border-slate-700 px-3 py-2 text-xs text-slate-200">Sửa</button>
            <button onClick={onClose} className="rounded border border-slate-700 p-2 text-slate-300"><X size={16} /></button>
          </div>
        </div>
        <nav className="mt-4 flex flex-wrap gap-1">
          {[
            ['overview', 'Overview'],
            ['materials', 'Materials'],
            ['inbound', 'Inbound History'],
            ['ratings', 'Ratings'],
            ['files', 'Files'],
          ].map(([id, label]) => <button key={id} onClick={() => setTab(id as DetailTab)} className={`rounded px-3 py-2 text-xs ${tab === id ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}>{label}</button>)}
        </nav>
      </header>

      <div className="p-5">
        {isLoading ? <div className={`${panel} p-8 text-center text-sm text-slate-500`}>Đang tải chi tiết nhà cung cấp...</div> : null}
        {tab === 'overview' && <OverviewTab supplier={activeSupplier} />}
        {tab === 'materials' && <MaterialsTab rows={data?.materials ?? []} />}
        {tab === 'inbound' && <InboundTab rows={data?.inboundHistory ?? []} />}
        {tab === 'ratings' && <RatingsTab rating={data?.rating} />}
        {tab === 'files' && <FilesTab />}
      </div>
    </section>
  </div>
}

function OverviewTab({ supplier }: { supplier: Supplier }) {
  return <div className="grid gap-3 md:grid-cols-2">
    {[
      ['Code', supplier.code],
      ['Name', supplier.name],
      ['Contact', supplier.contact || '-'],
      ['Phone', supplier.phone || '-'],
      ['Email', supplier.email || '-'],
      ['Address', supplier.address || '-'],
      ['Created At', date(supplier.createdAt)],
      ['Updated At', date(supplier.updatedAt)],
    ].map(([label, value]) => <div key={label} className={`${panel} p-4`}>
      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm text-slate-100">{value}</div>
    </div>)}
  </div>
}

function MaterialsTab({ rows }: { rows: Array<{ id: string; code: string; name: string; unit?: string | null; inboundCount: number; totalQuantity: number; lastInboundAt?: string | null }> }) {
  return <div className={`${panel} overflow-hidden`}>
    <div className="border-b border-slate-800 px-4 py-3"><h3 className="text-sm font-semibold text-slate-100">Vật tư NCC đang cung cấp</h3></div>
    <table className="w-full min-w-[760px] text-left text-sm">
      <thead className="bg-slate-900/70 text-[10px] uppercase text-slate-500"><tr>{['Material', 'Name', 'Total Qty', 'Unit', 'Inbound Count', 'Last Inbound'].map((x) => <th key={x} className="px-4 py-3">{x}</th>)}</tr></thead>
      <tbody>{rows.map((row) => <tr key={row.id} className="border-t border-slate-800 text-slate-200"><td className="px-4 py-3 text-cyan-300">{row.code}</td><td className="px-4 py-3">{row.name}</td><td className="px-4 py-3">{fmt(row.totalQuantity)}</td><td className="px-4 py-3">{row.unit ?? '-'}</td><td className="px-4 py-3">{fmt(row.inboundCount)}</td><td className="px-4 py-3">{date(row.lastInboundAt)}</td></tr>)}</tbody>
    </table>
    {!rows.length ? <EmptyState icon={PackageSearch} title="Chưa có vật tư liên kết" note="Phase S1 chỉ đọc từ lịch sử nhập kho. Supplier Material mapping sẽ làm ở S2." /> : null}
  </div>
}

function InboundTab({ rows }: { rows: Array<{ id: string; inboundNo: string; date: string; materialCode: string; materialName: string; quantity: number; unitPrice: number; totalAmount: number; unit?: string | null }> }) {
  return <div className={`${panel} overflow-hidden`}>
    <div className="border-b border-slate-800 px-4 py-3"><h3 className="text-sm font-semibold text-slate-100">Inbound history</h3></div>
    <div className="overflow-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-slate-900/70 text-[10px] uppercase text-slate-500"><tr>{['Inbound No', 'Date', 'Material', 'Quantity', 'Unit Price', 'Total Amount'].map((x) => <th key={x} className="px-4 py-3">{x}</th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id} className="border-t border-slate-800 text-slate-200"><td className="px-4 py-3 text-cyan-300">{row.inboundNo}</td><td className="px-4 py-3">{date(row.date)}</td><td className="px-4 py-3">{row.materialCode} · {row.materialName}</td><td className="px-4 py-3">{fmt(row.quantity)} {row.unit ?? ''}</td><td className="px-4 py-3">{money(row.unitPrice)} đ</td><td className="px-4 py-3">{money(row.totalAmount)} đ</td></tr>)}</tbody>
      </table>
    </div>
    {!rows.length ? <EmptyState icon={Truck} title="Chưa có lịch sử nhập kho" note="Không tìm thấy Inventory inbound theo supplierId này." /> : null}
  </div>
}

function RatingsTab({ rating }: { rating?: { quality: number; delivery: number; pricing: number; overall: number; updatedAt?: string | null } }) {
  const data = rating ?? { quality: 0, delivery: 0, pricing: 0, overall: 0 }
  return <div className="grid gap-3 md:grid-cols-4">
    <KpiCard title="Quality" value={data.quality} note="Supplier score" tone="emerald" />
    <KpiCard title="Delivery" value={data.delivery} note="Supplier score" tone="cyan" />
    <KpiCard title="Pricing" value={data.pricing} note="Supplier score" tone="amber" />
    <KpiCard title="Overall" value={data.overall} note={`Updated ${date(data.updatedAt)}`} tone="cyan" />
  </div>
}

function FilesTab() {
  return <div className={`${panel} p-8`}>
    <EmptyState icon={FileText} title="No documents uploaded." note="Chuẩn bị cho Contract, Quotation, Catalogue, CO/CQ trong phase sau." />
  </div>
}

function EmptyState({ icon: Icon, title, note }: { icon: LucideIcon; title: string; note: string }) {
  return <div className="flex min-h-44 flex-col items-center justify-center p-6 text-center">
    <Icon size={28} className="text-slate-600" />
    <div className="mt-3 text-sm font-semibold text-slate-300">{title}</div>
    <div className="mt-1 max-w-md text-xs text-slate-500">{note}</div>
  </div>
}

/* ==========================================================================
   TARGET 1: SUPPLIERS QUOTATION TAB
   ========================================================================== */

interface SupplierQuoteRow {
  id: string
  code: string
  supplierId: string
  supplierCode: string
  supplierName: string
  category: string
  materialsCount: number
  sentDate: string
  validUntil: string
  totalAmount: number
  status: 'PENDING' | 'RESPONDED' | 'APPROVED' | 'EXPIRED' | 'REJECTED'
}

function SupplierQuotesTab({ suppliers }: { suppliers: Supplier[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<SupplierQuoteRow | null>(null)

  const quotes: SupplierQuoteRow[] = useMemo(() => {
    if (!suppliers.length) {
      return [
        { id: 'q-1', code: 'BG-2026-001', supplierId: 's-1', supplierCode: 'NCC-001', supplierName: 'Thép Hòa Phát', category: 'Vật tư chính', materialsCount: 12, sentDate: '2026-07-20', validUntil: '2026-08-20', totalAmount: 450000000, status: 'APPROVED' },
        { id: 'q-2', code: 'BG-2026-002', supplierId: 's-2', supplierCode: 'NCC-002', supplierName: 'Tập đoàn Hoa Sen', category: 'Vật tư phụ', materialsCount: 8, sentDate: '2026-07-21', validUntil: '2026-08-21', totalAmount: 180000000, status: 'RESPONDED' },
        { id: 'q-3', code: 'BG-2026-003', supplierId: 's-3', supplierCode: 'NCC-003', supplierName: 'Thép Nam Kim', category: 'Cấu kiện thép', materialsCount: 5, sentDate: '2026-07-22', validUntil: '2026-08-01', totalAmount: 320000000, status: 'PENDING' },
        { id: 'q-4', code: 'BG-2026-004', supplierId: 's-4', supplierCode: 'NCC-004', supplierName: 'Sơn Hải Phòng', category: 'Vật tư phụ', materialsCount: 15, sentDate: '2026-07-10', validUntil: '2026-07-20', totalAmount: 95000000, status: 'EXPIRED' },
      ]
    }
    const categories = ['Vật tư chính', 'Cấu kiện thép', 'Vật tư phụ', 'Dịch vụ & Vận tải']
    const statuses: SupplierQuoteRow['status'][] = ['APPROVED', 'RESPONDED', 'PENDING', 'EXPIRED', 'REJECTED']
    return suppliers.map((s, idx) => ({
      id: `quote-${s.id}`,
      code: `BG-2026-${String(idx + 1).padStart(3, '0')}`,
      supplierId: s.id,
      supplierCode: s.code,
      supplierName: s.name,
      category: categories[idx % categories.length],
      materialsCount: 5 + (idx * 3) % 15,
      sentDate: `2026-07-${String(15 + (idx % 10)).padStart(2, '0')}`,
      validUntil: `2026-08-${String(10 + (idx % 15)).padStart(2, '0')}`,
      totalAmount: (idx + 1) * 125000000,
      status: statuses[idx % statuses.length],
    }))
  }, [suppliers])

  const filtered = useMemo(() => {
    return quotes.filter((q) => {
      if (search.trim()) {
        const query = search.toLowerCase()
        const match = q.code.toLowerCase().includes(query) || q.supplierName.toLowerCase().includes(query) || q.supplierCode.toLowerCase().includes(query)
        if (!match) return false
      }
      if (statusFilter !== 'all' && q.status !== statusFilter) return false
      if (categoryFilter !== 'all' && q.category !== categoryFilter) return false
      if (supplierFilter !== 'all' && q.supplierId !== supplierFilter) return false
      return true
    })
  }, [quotes, search, statusFilter, categoryFilter, supplierFilter])

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  useEffect(() => setPage(1), [search, statusFilter, categoryFilter, supplierFilter, pageSize])

  const count = (status: SupplierQuoteRow['status']) => filtered.filter((q) => q.status === status).length
  const totalValue = filtered.reduce((acc, q) => acc + q.totalAmount, 0)

  return (
    <div className="w-full min-w-0 flex-1 space-y-1">
      {/* Phase 1: Enterprise KPI Cards */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard
          title="Tổng báo giá"
          value={formatQuantity(filtered.length, 0)}
          tone="blue"
          icon={<FileText size={15} />}
        />
        <EnterpriseKpiCard
          title="Chờ phản hồi"
          value={formatQuantity(count('PENDING'), 0)}
          tone="amber"
          icon={<Clock size={15} />}
        />
        <EnterpriseKpiCard
          title="Đã phản hồi"
          value={formatQuantity(count('RESPONDED'), 0)}
          tone="cyan"
          icon={<MessageSquare size={15} />}
        />
        <EnterpriseKpiCard
          title="Đã duyệt"
          value={formatQuantity(count('APPROVED'), 0)}
          tone="emerald"
          icon={<CheckCircle2 size={15} />}
        />
        <EnterpriseKpiCard
          title="Quá hạn"
          value={formatQuantity(count('EXPIRED'), 0)}
          tone="red"
          icon={<Clock size={15} />}
        />
        <EnterpriseKpiCard
          title="Tổng giá trị"
          value={formatCurrencyVnd(totalValue)}
          tone="purple"
          icon={<TrendingUp size={15} />}
        />
      </div>

      {/* Phase 2: Analytics Dashboard */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-4">
        <CockpitChartCard title="Trạng thái báo giá" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars
            rows={[
              ['Đã duyệt', count('APPROVED')],
              ['Đã phản hồi', count('RESPONDED')],
              ['Chờ phản hồi', count('PENDING')],
              ['Quá hạn', count('EXPIRED')],
            ]}
          />
        </CockpitChartCard>
        <CockpitChartCard title="Tỷ lệ duyệt" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitStatusList
            items={[
              { id: '1', label: 'Tỷ lệ phê duyệt', value: `${filtered.length ? Math.round((count('APPROVED') / filtered.length) * 100) : 0}%`, statusTone: 'emerald' },
              { id: '2', label: 'Tỷ lệ phản hồi', value: `${filtered.length ? Math.round(((count('APPROVED') + count('RESPONDED')) / filtered.length) * 100) : 0}%`, statusTone: 'cyan' },
              { id: '3', label: 'Báo giá đã hết hạn', value: `${count('EXPIRED')}`, statusTone: 'amber' },
            ]}
          />
        </CockpitChartCard>
        <CockpitChartCard title="Báo giá mới gần đây" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitRecentList
            items={filtered.slice(0, 5).map((q) => ({
              id: q.id,
              title: q.code,
              subtitle: `${q.supplierName} · ${formatCurrencyVnd(q.totalAmount)}`,
              time: date(q.sentDate),
              statusDot: q.status === 'APPROVED' ? 'bg-emerald-400' : 'bg-cyan-400',
            }))}
            emptyMessage="Chưa có báo giá gần đây."
          />
        </CockpitChartCard>
        <CockpitChartCard title="Giá trị theo nhóm hàng" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars
            rows={[
              ['Vật tư chính', filtered.filter(q => q.category === 'Vật tư chính').length],
              ['Cấu kiện thép', filtered.filter(q => q.category === 'Cấu kiện thép').length],
              ['Vật tư phụ', filtered.filter(q => q.category === 'Vật tư phụ').length],
              ['Dịch vụ', filtered.filter(q => q.category === 'Dịch vụ & Vận tải').length],
            ]}
          />
        </CockpitChartCard>
      </div>

      {/* Phase 3: Compact Toolbar */}
      <EnterprisePanel className="rounded-xl -mt-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_180px_180px_180px_110px_110px]">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã báo giá, nhà cung cấp, vật tư..."
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="PENDING">Chờ phản hồi</option>
            <option value="RESPONDED">Đã phản hồi</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="EXPIRED">Quá hạn</option>
            <option value="REJECTED">Từ chối</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="all">Tất cả nhóm hàng</option>
            <option value="Vật tư chính">Vật tư chính</option>
            <option value="Cấu kiện thép">Cấu kiện thép</option>
            <option value="Vật tư phụ">Vật tư phụ</option>
            <option value="Dịch vụ & Vận tải">Dịch vụ & Vận tải</option>
          </select>

          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="all">Tất cả nhà cung cấp</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} · {s.name}
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
              setSearch('')
              setStatusFilter('all')
              setCategoryFilter('all')
              setSupplierFilter('all')
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
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Danh sách báo giá nhà cung cấp</h3>
              <span className="rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-300 border border-blue-400/20">
                {filtered.length} báo giá
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
            <table className="w-full min-w-[1000px] table-fixed text-sm border-collapse">
              <thead
                className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
              >
                <tr>
                  {['Mã báo giá', 'Nhà cung cấp', 'Hạng mục vật tư', 'Ngày gửi', 'Hiệu lực', 'Giá trị báo giá', 'Trạng thái', 'Thao tác'].map((heading) => (
                    <th key={heading} className="px-2 py-2 text-xs font-semibold text-slate-300 text-left">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((row) => (
                  <tr key={row.id} onClick={() => setSelectedQuote(row)} className={`${inventoryTableRow} cursor-pointer`}>
                    <td className="px-2 py-2 font-mono font-semibold text-cyan-300 text-xs">{row.code}</td>
                    <td className="px-2 py-2 text-white font-medium truncate">{row.supplierName}</td>
                    <td className="px-2 py-2 text-slate-300 text-xs truncate">{row.category} ({row.materialsCount} mã)</td>
                    <td className="px-2 py-2 text-slate-300 text-xs truncate">{date(row.sentDate)}</td>
                    <td className="px-2 py-2 text-slate-300 text-xs truncate">{date(row.validUntil)}</td>
                    <td className="px-2 py-2 font-mono text-cyan-300 text-xs text-right tabular-nums">{formatCurrencyVnd(row.totalAmount)}</td>
                    <td className="px-2 py-2">
                      <QuoteStatusBadge status={row.status} />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedQuote(row)
                        }}
                        className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
                {!paged.length ? (
                  <tr>
                    <td colSpan={8} className="px-2 py-10">
                      <CockpitEmptyState
                        title="Chưa có báo giá nhà cung cấp"
                        description="Không tìm thấy báo giá phù hợp với điều kiện tìm kiếm."
                        icon={<FileText size={18} />}
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <DataTablePagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
        </EnterprisePanel>

        <div className="space-y-1">
          <CockpitChartCard title="Báo giá nổi bật" heightClass="h-[220px]" chartHeightClass="h-[138px]">
            <CockpitStatusList
              items={filtered.slice(0, 4).map((q) => ({
                id: q.id,
                label: `${q.code} · ${q.supplierName}`,
                value: formatCurrencyVnd(q.totalAmount),
                statusTone: q.status === 'APPROVED' ? 'emerald' : 'cyan',
              }))}
            />
          </CockpitChartCard>
          <CockpitChartCard title="Báo giá sắp hết hạn" heightClass="h-[220px]" chartHeightClass="h-[138px]">
            <CockpitRecentList
              items={filtered.filter(q => q.status === 'PENDING' || q.status === 'RESPONDED').slice(0, 4).map((q) => ({
                id: q.id,
                title: q.code,
                subtitle: `Hạn: ${date(q.validUntil)}`,
                time: q.supplierCode,
                statusDot: 'bg-amber-400',
              }))}
              emptyMessage="Không có báo giá cần chú ý."
            />
          </CockpitChartCard>
        </div>
      </div>

      {/* Phase 5: EXPANDED TABLE MODAL */}
      {expandedModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">Toàn bộ danh sách báo giá nhà cung cấp</h2>
                    <p className="text-xs text-slate-400">Tổng cộng {filtered.length} báo giá</p>
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
                  <table className="w-full min-w-[1000px] text-xs table-fixed border-collapse">
                    <thead
                      className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                      style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                    >
                      <tr>
                        {['Mã báo giá', 'Nhà cung cấp', 'Hạng mục vật tư', 'Ngày gửi', 'Hiệu lực', 'Giá trị báo giá', 'Trạng thái', 'Thao tác'].map((heading) => (
                          <th key={heading} className="px-2 py-2 text-left font-semibold text-slate-300">
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((row) => (
                        <tr
                          key={row.id}
                          onClick={() => {
                            setSelectedQuote(row)
                            setExpandedModalOpen(false)
                          }}
                          className={`${inventoryTableRow} cursor-pointer`}
                        >
                          <td className="px-2 py-2 font-mono font-semibold text-cyan-300">{row.code}</td>
                          <td className="px-2 py-2 text-white font-medium truncate">{row.supplierName}</td>
                          <td className="px-2 py-2 text-slate-300 truncate">{row.category} ({row.materialsCount} mã)</td>
                          <td className="px-2 py-2 text-slate-300 truncate">{date(row.sentDate)}</td>
                          <td className="px-2 py-2 text-slate-300 truncate">{date(row.validUntil)}</td>
                          <td className="px-2 py-2 font-mono text-cyan-300 text-right tabular-nums">{formatCurrencyVnd(row.totalAmount)}</td>
                          <td className="px-2 py-2"><QuoteStatusBadge status={row.status} /></td>
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedQuote(row)
                                setExpandedModalOpen(false)
                              }}
                              className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition"
                            >
                              Chi tiết
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

      {/* Phase 6: Detail Drawer */}
      {selectedQuote ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <section className="h-full w-full max-w-2xl overflow-y-auto border-l border-cyan-900 bg-[#05101d] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-400">Chi tiết báo giá</span>
                <h2 className="text-lg font-bold text-white mt-0.5">{selectedQuote.code}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuote(null)}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Nhà cung cấp</div>
                <div className="font-semibold text-white">{selectedQuote.supplierName} ({selectedQuote.supplierCode})</div>
              </div>
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Trạng thái</div>
                <div><QuoteStatusBadge status={selectedQuote.status} /></div>
              </div>
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Giá trị báo giá</div>
                <div className="font-mono font-bold text-cyan-300">{formatCurrencyVnd(selectedQuote.totalAmount)}</div>
              </div>
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Hạn hiệu lực</div>
                <div className="text-slate-200">{date(selectedQuote.validUntil)}</div>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function QuoteStatusBadge({ status }: { status: SupplierQuoteRow['status'] }) {
  const map: Record<SupplierQuoteRow['status'], { label: string; tone: string }> = {
    PENDING: { label: 'Chờ phản hồi', tone: 'bg-amber-400/10 text-amber-300 border-amber-400/20' },
    RESPONDED: { label: 'Đã phản hồi', tone: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20' },
    APPROVED: { label: 'Đã duyệt', tone: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20' },
    EXPIRED: { label: 'Quá hạn', tone: 'bg-red-400/10 text-red-300 border-red-400/20' },
    REJECTED: { label: 'Từ chối', tone: 'bg-slate-400/10 text-slate-300 border-slate-400/20' },
  }
  const item = map[status] ?? map.PENDING
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${item.tone}`}>
      {item.label}
    </span>
  )
}

/* ==========================================================================
   TARGET 2: SUPPLIERS PURCHASE ORDERS TAB
   ========================================================================== */

interface SupplierPoRow {
  id: string
  code: string
  supplierId: string
  supplierCode: string
  supplierName: string
  orderDate: string
  expectedDeliveryDate: string
  totalAmount: number
  priority: 'NORMAL' | 'HIGH' | 'URGENT'
  progress: number
  status: 'PENDING' | 'APPROVED' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED'
}

function SupplierPurchaseOrdersTab({ suppliers }: { suppliers: Supplier[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
  const [selectedPo, setSelectedPo] = useState<SupplierPoRow | null>(null)

  const pos: SupplierPoRow[] = useMemo(() => {
    if (!suppliers.length) {
      return [
        { id: 'po-1', code: 'PO-2026-089', supplierId: 's-1', supplierCode: 'NCC-001', supplierName: 'Thép Hòa Phát', orderDate: '2026-07-15', expectedDeliveryDate: '2026-07-28', totalAmount: 850000000, priority: 'HIGH', progress: 75, status: 'SHIPPING' },
        { id: 'po-2', code: 'PO-2026-090', supplierId: 's-2', supplierCode: 'NCC-002', supplierName: 'Tập đoàn Hoa Sen', orderDate: '2026-07-18', expectedDeliveryDate: '2026-08-05', totalAmount: 420000000, priority: 'NORMAL', progress: 30, status: 'APPROVED' },
        { id: 'po-3', code: 'PO-2026-091', supplierId: 's-3', supplierCode: 'NCC-003', supplierName: 'Thép Nam Kim', orderDate: '2026-07-20', expectedDeliveryDate: '2026-08-10', totalAmount: 610000000, priority: 'URGENT', progress: 100, status: 'COMPLETED' },
        { id: 'po-4', code: 'PO-2026-092', supplierId: 's-4', supplierCode: 'NCC-004', supplierName: 'Sơn Hải Phòng', orderDate: '2026-07-24', expectedDeliveryDate: '2026-08-15', totalAmount: 140000000, priority: 'NORMAL', progress: 0, status: 'PENDING' },
      ]
    }
    const statuses: SupplierPoRow['status'][] = ['SHIPPING', 'APPROVED', 'COMPLETED', 'PENDING', 'CANCELLED']
    const priorities: SupplierPoRow['priority'][] = ['NORMAL', 'HIGH', 'URGENT']
    return suppliers.map((s, idx) => ({
      id: `po-${s.id}`,
      code: `PO-2026-${String(idx + 101).padStart(3, '0')}`,
      supplierId: s.id,
      supplierCode: s.code,
      supplierName: s.name,
      orderDate: `2026-07-${String(10 + (idx % 12)).padStart(2, '0')}`,
      expectedDeliveryDate: `2026-08-${String(5 + (idx % 20)).padStart(2, '0')}`,
      totalAmount: (idx + 1) * 230000000,
      priority: priorities[idx % priorities.length],
      progress: idx % 2 === 0 ? 100 : (idx * 25) % 100,
      status: statuses[idx % statuses.length],
    }))
  }, [suppliers])

  const filtered = useMemo(() => {
    return pos.filter((p) => {
      if (search.trim()) {
        const query = search.toLowerCase()
        const match = p.code.toLowerCase().includes(query) || p.supplierName.toLowerCase().includes(query) || p.supplierCode.toLowerCase().includes(query)
        if (!match) return false
      }
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (priorityFilter !== 'all' && p.priority !== priorityFilter) return false
      if (supplierFilter !== 'all' && p.supplierId !== supplierFilter) return false
      return true
    })
  }, [pos, search, statusFilter, priorityFilter, supplierFilter])

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  useEffect(() => setPage(1), [search, statusFilter, priorityFilter, supplierFilter, pageSize])

  const count = (status: SupplierPoRow['status']) => filtered.filter((p) => p.status === status).length
  const totalValue = filtered.reduce((acc, p) => acc + p.totalAmount, 0)

  return (
    <div className="w-full min-w-0 flex-1 space-y-1">
      {/* Phase 1: Enterprise KPI Cards */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard
          title="Tổng PO"
          value={formatQuantity(filtered.length, 0)}
          tone="blue"
          icon={<ShoppingCart size={15} />}
        />
        <EnterpriseKpiCard
          title="Chờ duyệt"
          value={formatQuantity(count('PENDING'), 0)}
          tone="amber"
          icon={<Clock size={15} />}
        />
        <EnterpriseKpiCard
          title="Đã duyệt"
          value={formatQuantity(count('APPROVED'), 0)}
          tone="emerald"
          icon={<CheckCircle2 size={15} />}
        />
        <EnterpriseKpiCard
          title="Đang giao"
          value={formatQuantity(count('SHIPPING'), 0)}
          tone="cyan"
          icon={<Truck size={15} />}
        />
        <EnterpriseKpiCard
          title="Hoàn thành"
          value={formatQuantity(count('COMPLETED'), 0)}
          tone="purple"
          icon={<PackageOpen size={15} />}
        />
        <EnterpriseKpiCard
          title="Giá trị PO"
          value={formatCurrencyVnd(totalValue)}
          tone="emerald"
          icon={<TrendingUp size={15} />}
        />
      </div>

      {/* Phase 2: Analytics Dashboard */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-4">
        <CockpitChartCard title="Trạng thái đơn mua" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars
            rows={[
              ['Hoàn thành', count('COMPLETED')],
              ['Đang giao', count('SHIPPING')],
              ['Đã duyệt', count('APPROVED')],
              ['Chờ duyệt', count('PENDING')],
            ]}
          />
        </CockpitChartCard>
        <CockpitChartCard title="Tiến độ thực hiện PO" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitStatusList
            items={[
              { id: '1', label: 'Tỷ lệ hoàn thành', value: `${filtered.length ? Math.round((count('COMPLETED') / filtered.length) * 100) : 0}%`, statusTone: 'purple' },
              { id: '2', label: 'Tỷ lệ đang vận chuyển', value: `${filtered.length ? Math.round((count('SHIPPING') / filtered.length) * 100) : 0}%`, statusTone: 'cyan' },
              { id: '3', label: 'Đơn mua khẩn cấp', value: `${filtered.filter(p => p.priority === 'URGENT').length}`, statusTone: 'amber' },
            ]}
          />
        </CockpitChartCard>
        <CockpitChartCard title="PO phát hành gần đây" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitRecentList
            items={filtered.slice(0, 5).map((p) => ({
              id: p.id,
              title: p.code,
              subtitle: `${p.supplierName} · ${formatCurrencyVnd(p.totalAmount)}`,
              time: date(p.orderDate),
              statusDot: p.status === 'COMPLETED' ? 'bg-purple-400' : 'bg-emerald-400',
            }))}
            emptyMessage="Chưa có PO gần đây."
          />
        </CockpitChartCard>
        <CockpitChartCard title="Phân bổ giá trị PO" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars
            rows={suppliers.slice(0, 4).map(s => [s.code, filtered.filter(p => p.supplierId === s.id).reduce((sum, item) => sum + item.totalAmount, 0)])}
          />
        </CockpitChartCard>
      </div>

      {/* Phase 3: Compact Toolbar */}
      <EnterprisePanel className="rounded-xl -mt-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_180px_180px_180px_110px_110px]">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã PO, nhà cung cấp, người tạo..."
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="SHIPPING">Đang giao</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="all">Tất cả độ ưu tiên</option>
            <option value="NORMAL">Bình thường</option>
            <option value="HIGH">Gấp</option>
            <option value="URGENT">Khẩn cấp</option>
          </select>

          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="all">Tất cả nhà cung cấp</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} · {s.name}
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
              setSearch('')
              setStatusFilter('all')
              setPriorityFilter('all')
              setSupplierFilter('all')
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
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Danh sách đơn mua hàng (PO)</h3>
              <span className="rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-300 border border-blue-400/20">
                {filtered.length} đơn mua
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
            <table className="w-full min-w-[1000px] table-fixed text-sm border-collapse">
              <thead
                className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
              >
                <tr>
                  {['Mã PO', 'Nhà cung cấp', 'Ngày đặt', 'Giao dự kiến', 'Tổng giá trị', 'Tiến độ', 'Trạng thái', 'Thao tác'].map((heading) => (
                    <th key={heading} className="px-2 py-2 text-xs font-semibold text-slate-300 text-left">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((row) => (
                  <tr key={row.id} onClick={() => setSelectedPo(row)} className={`${inventoryTableRow} cursor-pointer`}>
                    <td className="px-2 py-2 font-mono font-semibold text-cyan-300 text-xs">{row.code}</td>
                    <td className="px-2 py-2 text-white font-medium truncate">{row.supplierName}</td>
                    <td className="px-2 py-2 text-slate-300 text-xs truncate">{date(row.orderDate)}</td>
                    <td className="px-2 py-2 text-slate-300 text-xs truncate">{date(row.expectedDeliveryDate)}</td>
                    <td className="px-2 py-2 font-mono text-cyan-300 text-xs text-right tabular-nums">{formatCurrencyVnd(row.totalAmount)}</td>
                    <td className="px-2 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded bg-slate-800 overflow-hidden">
                          <div className="h-full bg-cyan-400 rounded" style={{ width: `${row.progress}%` }} />
                        </div>
                        <span className="font-mono text-slate-300 text-[11px]">{row.progress}%</span>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <PoStatusBadge status={row.status} />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedPo(row)
                        }}
                        className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
                {!paged.length ? (
                  <tr>
                    <td colSpan={8} className="px-2 py-10">
                      <CockpitEmptyState
                        title="Chưa có đơn mua hàng"
                        description="Không tìm thấy PO phù hợp với điều kiện lọc."
                        icon={<FileText size={18} />}
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <DataTablePagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
        </EnterprisePanel>

        <div className="space-y-1">
          <CockpitChartCard title="PO giá trị cao nhất" heightClass="h-[220px]" chartHeightClass="h-[138px]">
            <CockpitStatusList
              items={filtered.slice(0, 4).map((p) => ({
                id: p.id,
                label: `${p.code} · ${p.supplierName}`,
                value: formatCurrencyVnd(p.totalAmount),
                statusTone: p.status === 'COMPLETED' ? 'purple' : 'emerald',
              }))}
            />
          </CockpitChartCard>
          <CockpitChartCard title="PO đang giao hàng" heightClass="h-[220px]" chartHeightClass="h-[138px]">
            <CockpitRecentList
              items={filtered.filter(p => p.status === 'SHIPPING').slice(0, 4).map((p) => ({
                id: p.id,
                title: p.code,
                subtitle: `Dự kiến: ${date(p.expectedDeliveryDate)}`,
                time: `${p.progress}%`,
                statusDot: 'bg-cyan-400',
              }))}
              emptyMessage="Không có PO đang vận chuyển."
            />
          </CockpitChartCard>
        </div>
      </div>

      {/* Phase 5: EXPANDED TABLE MODAL */}
      {expandedModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">Toàn bộ danh sách đơn mua hàng (PO)</h2>
                    <p className="text-xs text-slate-400">Tổng cộng {filtered.length} đơn mua</p>
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
                  <table className="w-full min-w-[1000px] text-xs table-fixed border-collapse">
                    <thead
                      className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                      style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                    >
                      <tr>
                        {['Mã PO', 'Nhà cung cấp', 'Ngày đặt', 'Giao dự kiến', 'Tổng giá trị', 'Tiến độ', 'Trạng thái', 'Thao tác'].map((heading) => (
                          <th key={heading} className="px-2 py-2 text-left font-semibold text-slate-300">
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((row) => (
                        <tr
                          key={row.id}
                          onClick={() => {
                            setSelectedPo(row)
                            setExpandedModalOpen(false)
                          }}
                          className={`${inventoryTableRow} cursor-pointer`}
                        >
                          <td className="px-2 py-2 font-mono font-semibold text-cyan-300">{row.code}</td>
                          <td className="px-2 py-2 text-white font-medium truncate">{row.supplierName}</td>
                          <td className="px-2 py-2 text-slate-300 truncate">{date(row.orderDate)}</td>
                          <td className="px-2 py-2 text-slate-300 truncate">{date(row.expectedDeliveryDate)}</td>
                          <td className="px-2 py-2 font-mono text-cyan-300 text-right tabular-nums">{formatCurrencyVnd(row.totalAmount)}</td>
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 rounded bg-slate-800 overflow-hidden">
                                <div className="h-full bg-cyan-400 rounded" style={{ width: `${row.progress}%` }} />
                              </div>
                              <span className="font-mono text-slate-300 text-[11px]">{row.progress}%</span>
                            </div>
                          </td>
                          <td className="px-2 py-2"><PoStatusBadge status={row.status} /></td>
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedPo(row)
                                setExpandedModalOpen(false)
                              }}
                              className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition"
                            >
                              Chi tiết
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

      {/* Phase 6: Detail Drawer */}
      {selectedPo ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <section className="h-full w-full max-w-2xl overflow-y-auto border-l border-cyan-900 bg-[#05101d] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-400">Chi tiết đơn mua hàng</span>
                <h2 className="text-lg font-bold text-white mt-0.5">{selectedPo.code}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPo(null)}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Nhà cung cấp</div>
                <div className="font-semibold text-white">{selectedPo.supplierName} ({selectedPo.supplierCode})</div>
              </div>
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Trạng thái</div>
                <div><PoStatusBadge status={selectedPo.status} /></div>
              </div>
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Giá trị PO</div>
                <div className="font-mono font-bold text-cyan-300">{formatCurrencyVnd(selectedPo.totalAmount)}</div>
              </div>
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Tiến độ thực hiện</div>
                <div className="text-slate-200">{selectedPo.progress}% hoàn thành</div>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function PoStatusBadge({ status }: { status: SupplierPoRow['status'] }) {
  const map: Record<SupplierPoRow['status'], { label: string; tone: string }> = {
    PENDING: { label: 'Chờ duyệt', tone: 'bg-amber-400/10 text-amber-300 border-amber-400/20' },
    APPROVED: { label: 'Đã duyệt', tone: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20' },
    SHIPPING: { label: 'Đang giao', tone: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20' },
    COMPLETED: { label: 'Hoàn thành', tone: 'bg-purple-400/10 text-purple-300 border-purple-400/20' },
    CANCELLED: { label: 'Đã hủy', tone: 'bg-slate-400/10 text-slate-300 border-slate-400/20' },
  }
  const item = map[status] ?? map.PENDING
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${item.tone}`}>
      {item.label}
    </span>
  )
}

/* ==========================================================================
   TARGET 3: SUPPLIERS DELIVERIES TAB
   ========================================================================== */

interface SupplierDeliveryRow {
  id: string
  code: string
  poCode: string
  supplierId: string
  supplierCode: string
  supplierName: string
  deliveryDate: string
  vehiclePlate: string
  materialName: string
  quantity: number
  unit: string
  carrier: string
  warehouse: string
  status: 'IN_TRANSIT' | 'DELIVERED' | 'DELAYED' | 'PENDING_RECEIPT'
}

function SupplierDeliveriesTab({ suppliers }: { suppliers: Supplier[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [carrierFilter, setCarrierFilter] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState<SupplierDeliveryRow | null>(null)

  const deliveries: SupplierDeliveryRow[] = useMemo(() => {
    if (!suppliers.length) {
      return [
        { id: 'del-1', code: 'DEL-2026-042', poCode: 'PO-2026-089', supplierId: 's-1', supplierCode: 'NCC-001', supplierName: 'Thép Hòa Phát', deliveryDate: '2026-07-24', vehiclePlate: '29C-884.12', materialName: 'Thép hình H300x300', quantity: 45, unit: 'tấn', carrier: 'Đội xe NCC', warehouse: 'Kho A - Bãi Thạch Thất', status: 'IN_TRANSIT' },
        { id: 'del-2', code: 'DEL-2026-043', poCode: 'PO-2026-090', supplierId: 's-2', supplierCode: 'NCC-002', supplierName: 'Tập đoàn Hoa Sen', deliveryDate: '2026-07-24', vehiclePlate: '15C-452.88', materialName: 'Tôn mạ màu 0.5mm', quantity: 1200, unit: 'm2', carrier: 'Vận tải ngoài', warehouse: 'Kho B - Bãi Hải Phòng', status: 'DELIVERED' },
        { id: 'del-3', code: 'DEL-2026-044', poCode: 'PO-2026-091', supplierId: 's-3', supplierCode: 'NCC-003', supplierName: 'Thép Nam Kim', deliveryDate: '2026-07-23', vehiclePlate: '30F-129.54', materialName: 'Xà gồ Z200x2.0', quantity: 350, unit: 'cây', carrier: 'Đội xe NCC', warehouse: 'Kho A - Bãi Thạch Thất', status: 'DELAYED' },
        { id: 'del-4', code: 'DEL-2026-045', poCode: 'PO-2026-092', supplierId: 's-4', supplierCode: 'NCC-004', supplierName: 'Sơn Hải Phòng', deliveryDate: '2026-07-24', vehiclePlate: '14C-098.33', materialName: 'Sơn chống cháy 2 thành phần', quantity: 80, unit: 'thùng', carrier: 'Tự vận chuyển', warehouse: 'Kho C - Vật tư', status: 'PENDING_RECEIPT' },
      ]
    }
    const statuses: SupplierDeliveryRow['status'][] = ['IN_TRANSIT', 'DELIVERED', 'DELAYED', 'PENDING_RECEIPT']
    const carriers = ['Đội xe NCC', 'Vận tải ngoài', 'Tự vận chuyển']
    const warehouses = ['Kho A - Bãi Thạch Thất', 'Kho B - Bãi Hải Phòng', 'Kho C - Vật tư']

    return suppliers.map((s, idx) => ({
      id: `del-${s.id}`,
      code: `DEL-2026-${String(idx + 40).padStart(3, '0')}`,
      poCode: `PO-2026-${String(idx + 85).padStart(3, '0')}`,
      supplierId: s.id,
      supplierCode: s.code,
      supplierName: s.name,
      deliveryDate: '2026-07-24',
      vehiclePlate: `${29 + (idx % 10)}C-${String(100 + idx * 47).padStart(3, '0')}.${String(10 + idx * 3).padStart(2, '0')}`,
      materialName: idx % 2 === 0 ? 'Thép hình H250x250' : 'Tôn cuộn mạ kẽm',
      quantity: (idx + 1) * 35,
      unit: idx % 2 === 0 ? 'tấn' : 'cuộn',
      carrier: carriers[idx % carriers.length],
      warehouse: warehouses[idx % warehouses.length],
      status: statuses[idx % statuses.length],
    }))
  }, [suppliers])

  const filtered = useMemo(() => {
    return deliveries.filter((d) => {
      if (search.trim()) {
        const query = search.toLowerCase()
        const match = d.code.toLowerCase().includes(query) || d.poCode.toLowerCase().includes(query) || d.supplierName.toLowerCase().includes(query) || d.vehiclePlate.toLowerCase().includes(query)
        if (!match) return false
      }
      if (statusFilter !== 'all' && d.status !== statusFilter) return false
      if (carrierFilter !== 'all' && d.carrier !== carrierFilter) return false
      if (supplierFilter !== 'all' && d.supplierId !== supplierFilter) return false
      return true
    })
  }, [deliveries, search, statusFilter, carrierFilter, supplierFilter])

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  useEffect(() => setPage(1), [search, statusFilter, carrierFilter, supplierFilter, pageSize])

  const count = (status: SupplierDeliveryRow['status']) => filtered.filter((d) => d.status === status).length
  const todayCount = filtered.filter((d) => d.deliveryDate === '2026-07-24').length
  const deliveredCount = count('DELIVERED')
  const delayedCount = count('DELAYED')
  const onTimeRate = filtered.length ? Math.round(((filtered.length - delayedCount) / filtered.length) * 100) : 100

  return (
    <div className="w-full min-w-0 flex-1 space-y-1">
      {/* Phase 1: Enterprise KPI Cards */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard
          title="Lịch giao hôm nay"
          value={formatQuantity(todayCount, 0)}
          tone="blue"
          icon={<Clock size={15} />}
        />
        <EnterpriseKpiCard
          title="Đang vận chuyển"
          value={formatQuantity(count('IN_TRANSIT'), 0)}
          tone="cyan"
          icon={<Truck size={15} />}
        />
        <EnterpriseKpiCard
          title="Đã giao"
          value={formatQuantity(deliveredCount, 0)}
          tone="emerald"
          icon={<CheckCircle2 size={15} />}
        />
        <EnterpriseKpiCard
          title="Trễ"
          value={formatQuantity(delayedCount, 0)}
          tone="red"
          icon={<Clock size={15} />}
        />
        <EnterpriseKpiCard
          title="Chờ nhận"
          value={formatQuantity(count('PENDING_RECEIPT'), 0)}
          tone="amber"
          icon={<PackageOpen size={15} />}
        />
        <EnterpriseKpiCard
          title="Tỷ lệ đúng hạn"
          value={`${onTimeRate}%`}
          tone="emerald"
          icon={<TrendingUp size={15} />}
        />
      </div>

      {/* Phase 2: Analytics Dashboard */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-4">
        <CockpitChartCard title="Trạng thái giao hàng" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars
            rows={[
              ['Đã giao', count('DELIVERED')],
              ['Đang vận chuyển', count('IN_TRANSIT')],
              ['Chờ nhận', count('PENDING_RECEIPT')],
              ['Trễ lịch', count('DELAYED')],
            ]}
          />
        </CockpitChartCard>
        <CockpitChartCard title="Đánh giá SLA giao hàng" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitStatusList
            items={[
              { id: '1', label: 'Tỷ lệ đúng hạn SLA', value: `${onTimeRate}%`, statusTone: 'emerald' },
              { id: '2', label: 'Số đợt bị chậm', value: `${delayedCount} chuyến`, statusTone: 'amber' },
              { id: '3', label: 'Xe đang đến kho', value: `${count('IN_TRANSIT')} xe`, statusTone: 'cyan' },
            ]}
          />
        </CockpitChartCard>
        <CockpitChartCard title="Chuyến hàng mới đến" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitRecentList
            items={filtered.slice(0, 5).map((d) => ({
              id: d.id,
              title: d.code,
              subtitle: `${d.supplierName} · ${d.vehiclePlate}`,
              time: date(d.deliveryDate),
              statusDot: d.status === 'DELIVERED' ? 'bg-emerald-400' : 'bg-cyan-400',
            }))}
            emptyMessage="Chưa có thông tin chuyến hàng."
          />
        </CockpitChartCard>
        <CockpitChartCard title="Vận tải theo đơn vị" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars
            rows={[
              ['Đội xe NCC', filtered.filter(d => d.carrier === 'Đội xe NCC').length],
              ['Vận tải ngoài', filtered.filter(d => d.carrier === 'Vận tải ngoài').length],
              ['Tự vận chuyển', filtered.filter(d => d.carrier === 'Tự vận chuyển').length],
            ]}
          />
        </CockpitChartCard>
      </div>

      {/* Phase 3: Compact Toolbar */}
      <EnterprisePanel className="rounded-xl -mt-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_180px_180px_180px_110px_110px]">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã phiếu giao, biển số xe, PO, nhà cung cấp..."
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="IN_TRANSIT">Đang vận chuyển</option>
            <option value="DELIVERED">Đã giao</option>
            <option value="DELAYED">Trễ</option>
            <option value="PENDING_RECEIPT">Chờ nhận</option>
          </select>

          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="all">Tất cả đơn vị vận chuyển</option>
            <option value="Đội xe NCC">Đội xe NCC</option>
            <option value="Vận tải ngoài">Vận tải ngoài</option>
            <option value="Tự vận chuyển">Tự vận chuyển</option>
          </select>

          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="all">Tất cả nhà cung cấp</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} · {s.name}
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
              setSearch('')
              setStatusFilter('all')
              setCarrierFilter('all')
              setSupplierFilter('all')
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
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Danh sách đợt giao hàng</h3>
              <span className="rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-300 border border-blue-400/20">
                {filtered.length} đợt giao
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
            <table className="w-full min-w-[1000px] table-fixed text-sm border-collapse">
              <thead
                className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
              >
                <tr>
                  {['Mã phiếu giao', 'Nhà cung cấp', 'Số PO', 'Ngày giao', 'Biển số xe', 'Vật tư', 'Số lượng', 'Trạng thái', 'Thao tác'].map((heading) => (
                    <th key={heading} className="px-2 py-2 text-xs font-semibold text-slate-300 text-left">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((row) => (
                  <tr key={row.id} onClick={() => setSelectedDelivery(row)} className={`${inventoryTableRow} cursor-pointer`}>
                    <td className="px-2 py-2 font-mono font-semibold text-cyan-300 text-xs">{row.code}</td>
                    <td className="px-2 py-2 text-white font-medium truncate">{row.supplierName}</td>
                    <td className="px-2 py-2 font-mono text-cyan-400 text-xs truncate">{row.poCode}</td>
                    <td className="px-2 py-2 text-slate-300 text-xs truncate">{date(row.deliveryDate)}</td>
                    <td className="px-2 py-2 font-mono text-slate-200 text-xs truncate">{row.vehiclePlate}</td>
                    <td className="px-2 py-2 text-slate-300 text-xs truncate">{row.materialName}</td>
                    <td className="px-2 py-2 font-mono text-cyan-300 text-xs text-right tabular-nums">{formatQuantity(row.quantity, 0)} {row.unit}</td>
                    <td className="px-2 py-2">
                      <DeliveryStatusBadge status={row.status} />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedDelivery(row)
                        }}
                        className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
                {!paged.length ? (
                  <tr>
                    <td colSpan={9} className="px-2 py-10">
                      <CockpitEmptyState
                        title="Chưa có đợt giao hàng"
                        description="Không tìm thấy thông tin giao hàng phù hợp."
                        icon={<Truck size={18} />}
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <DataTablePagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
        </EnterprisePanel>

        <div className="space-y-1">
          <CockpitChartCard title="Xe đang đến kho" heightClass="h-[220px]" chartHeightClass="h-[138px]">
            <CockpitStatusList
              items={filtered.filter(d => d.status === 'IN_TRANSIT').slice(0, 4).map((d) => ({
                id: d.id,
                label: `${d.vehiclePlate} · ${d.supplierName}`,
                value: `${d.quantity} ${d.unit}`,
                statusTone: 'cyan',
              }))}
            />
          </CockpitChartCard>
          <CockpitChartCard title="Chuyến giao vừa hoàn thành" heightClass="h-[220px]" chartHeightClass="h-[138px]">
            <CockpitRecentList
              items={filtered.filter(d => d.status === 'DELIVERED').slice(0, 4).map((d) => ({
                id: d.id,
                title: d.code,
                subtitle: `${d.warehouse}`,
                time: date(d.deliveryDate),
                statusDot: 'bg-emerald-400',
              }))}
              emptyMessage="Chưa có chuyến hoàn thành gần đây."
            />
          </CockpitChartCard>
        </div>
      </div>

      {/* Phase 5: EXPANDED TABLE MODAL */}
      {expandedModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">Toàn bộ danh sách đợt giao hàng</h2>
                    <p className="text-xs text-slate-400">Tổng cộng {filtered.length} đợt giao hàng</p>
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
                  <table className="w-full min-w-[1000px] text-xs table-fixed border-collapse">
                    <thead
                      className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                      style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                    >
                      <tr>
                        {['Mã phiếu giao', 'Nhà cung cấp', 'Số PO', 'Ngày giao', 'Biển số xe', 'Vật tư', 'Số lượng', 'Trạng thái', 'Thao tác'].map((heading) => (
                          <th key={heading} className="px-2 py-2 text-left font-semibold text-slate-300">
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((row) => (
                        <tr
                          key={row.id}
                          onClick={() => {
                            setSelectedDelivery(row)
                            setExpandedModalOpen(false)
                          }}
                          className={`${inventoryTableRow} cursor-pointer`}
                        >
                          <td className="px-2 py-2 font-mono font-semibold text-cyan-300">{row.code}</td>
                          <td className="px-2 py-2 text-white font-medium truncate">{row.supplierName}</td>
                          <td className="px-2 py-2 font-mono text-cyan-400 truncate">{row.poCode}</td>
                          <td className="px-2 py-2 text-slate-300 truncate">{date(row.deliveryDate)}</td>
                          <td className="px-2 py-2 font-mono text-slate-200 truncate">{row.vehiclePlate}</td>
                          <td className="px-2 py-2 text-slate-300 truncate">{row.materialName}</td>
                          <td className="px-2 py-2 font-mono text-cyan-300 text-right tabular-nums">{formatQuantity(row.quantity, 0)} {row.unit}</td>
                          <td className="px-2 py-2"><DeliveryStatusBadge status={row.status} /></td>
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedDelivery(row)
                                setExpandedModalOpen(false)
                              }}
                              className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition"
                            >
                              Chi tiết
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

      {/* Phase 6: Detail Drawer */}
      {selectedDelivery ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <section className="h-full w-full max-w-2xl overflow-y-auto border-l border-cyan-900 bg-[#05101d] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-400">Chi tiết đợt giao hàng</span>
                <h2 className="text-lg font-bold text-white mt-0.5">{selectedDelivery.code}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDelivery(null)}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Nhà cung cấp</div>
                <div className="font-semibold text-white">{selectedDelivery.supplierName} ({selectedDelivery.supplierCode})</div>
              </div>
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Trạng thái</div>
                <div><DeliveryStatusBadge status={selectedDelivery.status} /></div>
              </div>
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Số PO liên kết</div>
                <div className="font-mono font-semibold text-cyan-400">{selectedDelivery.poCode}</div>
              </div>
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Biển số xe</div>
                <div className="font-mono text-slate-200">{selectedDelivery.vehiclePlate}</div>
              </div>
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Vật tư & Số lượng</div>
                <div className="text-slate-200">{selectedDelivery.materialName}: <span className="font-bold text-cyan-300">{formatQuantity(selectedDelivery.quantity, 0)} {selectedDelivery.unit}</span></div>
              </div>
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Kho nhận hàng</div>
                <div className="text-slate-200">{selectedDelivery.warehouse}</div>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function DeliveryStatusBadge({ status }: { status: SupplierDeliveryRow['status'] }) {
  const map: Record<SupplierDeliveryRow['status'], { label: string; tone: string }> = {
    IN_TRANSIT: { label: 'Đang vận chuyển', tone: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20' },
    DELIVERED: { label: 'Đã giao', tone: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20' },
    DELAYED: { label: 'Trễ', tone: 'bg-red-400/10 text-red-300 border-red-400/20' },
    PENDING_RECEIPT: { label: 'Chờ nhận', tone: 'bg-amber-400/10 text-amber-300 border-amber-400/20' },
  }
  const item = map[status] ?? map.IN_TRANSIT
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${item.tone}`}>
      {item.label}
    </span>
  )
}

/* ==========================================================================
   TARGET 2: SUPPLIERS ACCOUNTS PAYABLE TAB
   ========================================================================== */

interface SupplierPayableRow {
  id: string
  code: string
  supplierId: string
  supplierCode: string
  supplierName: string
  poCode: string
  issueDate: string
  dueDate: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  agingDays: number
  status: 'DUE' | 'OVERDUE' | 'PAID' | 'PENDING'
}

function SupplierPayablesTab({ suppliers }: { suppliers: Supplier[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [agingFilter, setAgingFilter] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
  const [selectedPayable, setSelectedPayable] = useState<SupplierPayableRow | null>(null)

  const payables: SupplierPayableRow[] = useMemo(() => {
    if (!suppliers.length) {
      return [
        { id: 'ap-1', code: 'INV-2026-101', supplierId: 's-1', supplierCode: 'NCC-001', supplierName: 'Thép Hòa Phát', poCode: 'PO-2026-089', issueDate: '2026-06-25', dueDate: '2026-07-25', totalAmount: 450000000, paidAmount: 200000000, remainingAmount: 250000000, agingDays: 29, status: 'DUE' },
        { id: 'ap-2', code: 'INV-2026-102', supplierId: 's-2', supplierCode: 'NCC-002', supplierName: 'Tập đoàn Hoa Sen', poCode: 'PO-2026-090', issueDate: '2026-06-10', dueDate: '2026-07-10', totalAmount: 320000000, paidAmount: 0, remainingAmount: 320000000, agingDays: 44, status: 'OVERDUE' },
        { id: 'ap-3', code: 'INV-2026-103', supplierId: 's-3', supplierCode: 'NCC-003', supplierName: 'Thép Nam Kim', poCode: 'PO-2026-091', issueDate: '2026-07-01', dueDate: '2026-08-01', totalAmount: 610000000, paidAmount: 610000000, remainingAmount: 0, agingDays: 23, status: 'PAID' },
        { id: 'ap-4', code: 'INV-2026-104', supplierId: 's-4', supplierCode: 'NCC-004', supplierName: 'Sơn Hải Phòng', poCode: 'PO-2026-092', issueDate: '2026-07-15', dueDate: '2026-08-15', totalAmount: 140000000, paidAmount: 0, remainingAmount: 140000000, agingDays: 9, status: 'PENDING' },
      ]
    }
    const statuses: SupplierPayableRow['status'][] = ['DUE', 'OVERDUE', 'PAID', 'PENDING']
    return suppliers.map((s, idx) => {
      const total = (idx + 1) * 185000000
      const paid = idx % 2 === 0 ? total : Math.floor(total * 0.4)
      const remaining = total - paid
      return {
        id: `payable-${s.id}`,
        code: `INV-2026-${String(idx + 101).padStart(3, '0')}`,
        supplierId: s.id,
        supplierCode: s.code,
        supplierName: s.name,
        poCode: `PO-2026-${String(idx + 85).padStart(3, '0')}`,
        issueDate: `2026-06-${String(10 + (idx % 18)).padStart(2, '0')}`,
        dueDate: `2026-07-${String(10 + (idx % 20)).padStart(2, '0')}`,
        totalAmount: total,
        paidAmount: paid,
        remainingAmount: remaining,
        agingDays: 15 + (idx * 7) % 45,
        status: remaining === 0 ? 'PAID' : statuses[idx % statuses.length],
      }
    })
  }, [suppliers])

  const filtered = useMemo(() => {
    return payables.filter((p) => {
      if (search.trim()) {
        const query = search.toLowerCase()
        const match = p.code.toLowerCase().includes(query) || p.poCode.toLowerCase().includes(query) || p.supplierName.toLowerCase().includes(query)
        if (!match) return false
      }
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (supplierFilter !== 'all' && p.supplierId !== supplierFilter) return false
      if (agingFilter === '0-30') {
        if (p.agingDays > 30) return false
      } else if (agingFilter === '31-60') {
        if (p.agingDays <= 30 || p.agingDays > 60) return false
      } else if (agingFilter === 'over-60') {
        if (p.agingDays <= 60) return false
      }
      return true
    })
  }, [payables, search, statusFilter, agingFilter, supplierFilter])

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  useEffect(() => setPage(1), [search, statusFilter, agingFilter, supplierFilter, pageSize])

  const totalDebt = filtered.reduce((acc, p) => acc + p.remainingAmount, 0)
  const dueDebt = filtered.filter((p) => p.status === 'DUE').reduce((acc, p) => acc + p.remainingAmount, 0)
  const overdueDebt = filtered.filter((p) => p.status === 'OVERDUE').reduce((acc, p) => acc + p.remainingAmount, 0)
  const paidDebt = filtered.reduce((acc, p) => acc + p.paidAmount, 0)
  const pendingDebt = filtered.filter((p) => p.status === 'PENDING').reduce((acc, p) => acc + p.remainingAmount, 0)
  const avgAging = filtered.length ? Math.round(filtered.reduce((acc, p) => acc + p.agingDays, 0) / filtered.length) : 24

  return (
    <div className="w-full min-w-0 flex-1 space-y-1">
      {/* Phase 1: Enterprise Accounts Payable KPI Cards */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard
          title="Tổng công nợ"
          value={formatCurrencyVnd(totalDebt)}
          tone="blue"
          icon={<TrendingUp size={15} />}
        />
        <EnterpriseKpiCard
          title="Đến hạn"
          value={formatCurrencyVnd(dueDebt)}
          tone="amber"
          icon={<Clock size={15} />}
        />
        <EnterpriseKpiCard
          title="Quá hạn"
          value={formatCurrencyVnd(overdueDebt)}
          tone="red"
          icon={<Clock size={15} />}
        />
        <EnterpriseKpiCard
          title="Đã thanh toán"
          value={formatCurrencyVnd(paidDebt)}
          tone="emerald"
          icon={<CheckCircle2 size={15} />}
        />
        <EnterpriseKpiCard
          title="Chờ thanh toán"
          value={formatCurrencyVnd(pendingDebt)}
          tone="cyan"
          icon={<FileText size={15} />}
        />
        <EnterpriseKpiCard
          title="Tuổi nợ TB"
          value={`${avgAging} ngày`}
          tone="purple"
          icon={<Clock size={15} />}
        />
      </div>

      {/* Phase 2: Analytics Dashboard */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-4">
        <CockpitChartCard title="Cơ cấu công nợ theo tuổi nợ" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars
            rows={[
              ['0 - 30 ngày', filtered.filter((p) => p.agingDays <= 30).length],
              ['31 - 60 ngày', filtered.filter((p) => p.agingDays > 30 && p.agingDays <= 60).length],
              ['Over 60 ngày', filtered.filter((p) => p.agingDays > 60).length],
            ]}
          />
        </CockpitChartCard>
        <CockpitChartCard title="Trạng thái chứng từ công nợ" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitStatusList
            items={[
              { id: '1', label: 'Công nợ quá hạn', value: formatCurrencyVnd(overdueDebt), statusTone: 'amber' },
              { id: '2', label: 'Tỷ lệ đã thanh toán', value: `${paidDebt + totalDebt ? Math.round((paidDebt / (paidDebt + totalDebt)) * 100) : 0}%`, statusTone: 'emerald' },
              { id: '3', label: 'Số chứng từ đến hạn', value: `${filtered.filter((p) => p.status === 'DUE').length} chứng từ`, statusTone: 'cyan' },
            ]}
          />
        </CockpitChartCard>
        <CockpitChartCard title="Thanh toán vừa thực hiện" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitRecentList
            items={filtered.slice(0, 5).map((p) => ({
              id: p.id,
              title: p.code,
              subtitle: `${p.supplierName} · ${formatCurrencyVnd(p.paidAmount)}`,
              time: date(p.dueDate),
              statusDot: p.status === 'PAID' ? 'bg-emerald-400' : 'bg-cyan-400',
            }))}
            emptyMessage="Chưa có lịch sử thanh toán."
          />
        </CockpitChartCard>
        <CockpitChartCard title="Top công nợ NCC" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars
            rows={suppliers.slice(0, 4).map((s) => [s.code, filtered.filter((p) => p.supplierId === s.id).reduce((sum, i) => sum + i.remainingAmount, 0)])}
          />
        </CockpitChartCard>
      </div>

      {/* Phase 3: Compact Toolbar */}
      <EnterprisePanel className="rounded-xl -mt-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_180px_180px_180px_110px_110px]">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã chứng từ, PO, nhà cung cấp..."
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="DUE">Đến hạn</option>
            <option value="OVERDUE">Quá hạn</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="PENDING">Chờ thanh toán</option>
          </select>

          <select
            value={agingFilter}
            onChange={(e) => setAgingFilter(e.target.value)}
            className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="all">Tất cả tuổi nợ</option>
            <option value="0-30">0 - 30 ngày</option>
            <option value="31-60">31 - 60 ngày</option>
            <option value="over-60">Trồng 60 ngày</option>
          </select>

          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="all">Tất cả nhà cung cấp</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} · {s.name}
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
              setSearch('')
              setStatusFilter('all')
              setAgingFilter('all')
              setSupplierFilter('all')
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
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Danh sách công nợ phải trả</h3>
              <span className="rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-300 border border-blue-400/20">
                {filtered.length} chứng từ
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
            <table className="w-full min-w-[1000px] table-fixed text-sm border-collapse">
              <thead
                className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
              >
                <tr>
                  {['Mã chứng từ', 'Nhà cung cấp', 'Số PO', 'Phát hành', 'Hạn TT', 'Tổng tiền', 'Còn nợ', 'Trạng thái', 'Thao tác'].map((heading) => (
                    <th key={heading} className="px-2 py-2 text-xs font-semibold text-slate-300 text-left">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((row) => (
                  <tr key={row.id} onClick={() => setSelectedPayable(row)} className={`${inventoryTableRow} cursor-pointer`}>
                    <td className="px-2 py-2 font-mono font-semibold text-cyan-300 text-xs">{row.code}</td>
                    <td className="px-2 py-2 text-white font-medium truncate">{row.supplierName}</td>
                    <td className="px-2 py-2 font-mono text-cyan-400 text-xs truncate">{row.poCode}</td>
                    <td className="px-2 py-2 text-slate-300 text-xs truncate">{date(row.issueDate)}</td>
                    <td className="px-2 py-2 text-slate-300 text-xs truncate">{date(row.dueDate)}</td>
                    <td className="px-2 py-2 font-mono text-slate-200 text-xs text-right tabular-nums">{formatCurrencyVnd(row.totalAmount)}</td>
                    <td className="px-2 py-2 font-mono text-cyan-300 text-xs text-right tabular-nums">{formatCurrencyVnd(row.remainingAmount)}</td>
                    <td className="px-2 py-2">
                      <PayableStatusBadge status={row.status} />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedPayable(row)
                        }}
                        className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
                {!paged.length ? (
                  <tr>
                    <td colSpan={9} className="px-2 py-10">
                      <CockpitEmptyState
                        title="Chưa có chứng từ công nợ"
                        description="Không tìm thấy dữ liệu công nợ phù hợp."
                        icon={<FileText size={18} />}
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <DataTablePagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
        </EnterprisePanel>

        <div className="space-y-1">
          <CockpitChartCard title="Công nợ lớn nhất" heightClass="h-[220px]" chartHeightClass="h-[138px]">
            <CockpitStatusList
              items={filtered.slice(0, 4).map((p) => ({
                id: p.id,
                label: `${p.code} · ${p.supplierName}`,
                value: formatCurrencyVnd(p.remainingAmount),
                statusTone: p.status === 'OVERDUE' ? 'amber' : 'cyan',
              }))}
            />
          </CockpitChartCard>
          <CockpitChartCard title="Công nợ sắp đến hạn" heightClass="h-[220px]" chartHeightClass="h-[138px]">
            <CockpitRecentList
              items={filtered.filter((p) => p.status === 'DUE' || p.status === 'OVERDUE').slice(0, 4).map((p) => ({
                id: p.id,
                title: p.code,
                subtitle: `Hạn: ${date(p.dueDate)}`,
                time: `${p.agingDays} ngày`,
                statusDot: 'bg-amber-400',
              }))}
              emptyMessage="Không có công nợ cần chú ý."
            />
          </CockpitChartCard>
        </div>
      </div>

      {/* Phase 5: EXPANDED TABLE MODAL */}
      {expandedModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">Toàn bộ danh sách công nợ phải trả</h2>
                    <p className="text-xs text-slate-400">Tổng cộng {filtered.length} chứng từ công nợ</p>
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
                  <table className="w-full min-w-[1000px] text-xs table-fixed border-collapse">
                    <thead
                      className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                      style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                    >
                      <tr>
                        {['Mã chứng từ', 'Nhà cung cấp', 'Số PO', 'Phát hành', 'Hạn TT', 'Tổng tiền', 'Còn nợ', 'Trạng thái', 'Thao tác'].map((heading) => (
                          <th key={heading} className="px-2 py-2 text-left font-semibold text-slate-300">
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((row) => (
                        <tr
                          key={row.id}
                          onClick={() => {
                            setSelectedPayable(row)
                            setExpandedModalOpen(false)
                          }}
                          className={`${inventoryTableRow} cursor-pointer`}
                        >
                          <td className="px-2 py-2 font-mono font-semibold text-cyan-300">{row.code}</td>
                          <td className="px-2 py-2 text-white font-medium truncate">{row.supplierName}</td>
                          <td className="px-2 py-2 font-mono text-cyan-400 truncate">{row.poCode}</td>
                          <td className="px-2 py-2 text-slate-300 truncate">{date(row.issueDate)}</td>
                          <td className="px-2 py-2 text-slate-300 truncate">{date(row.dueDate)}</td>
                          <td className="px-2 py-2 font-mono text-slate-200 text-right tabular-nums">{formatCurrencyVnd(row.totalAmount)}</td>
                          <td className="px-2 py-2 font-mono text-cyan-300 text-right tabular-nums">{formatCurrencyVnd(row.remainingAmount)}</td>
                          <td className="px-2 py-2"><PayableStatusBadge status={row.status} /></td>
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedPayable(row)
                                setExpandedModalOpen(false)
                              }}
                              className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition"
                            >
                              Chi tiết
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

      {/* Phase 6: Detail Drawer */}
      {selectedPayable ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <section className="h-full w-full max-w-2xl overflow-y-auto border-l border-cyan-900 bg-[#05101d] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-400">Chi tiết công nợ</span>
                <h2 className="text-lg font-bold text-white mt-0.5">{selectedPayable.code}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayable(null)}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Nhà cung cấp</div>
                <div className="font-semibold text-white">{selectedPayable.supplierName} ({selectedPayable.supplierCode})</div>
              </div>
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Trạng thái thanh toán</div>
                <div><PayableStatusBadge status={selectedPayable.status} /></div>
              </div>
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Tổng tiền chứng từ</div>
                <div className="font-mono font-bold text-white">{formatCurrencyVnd(selectedPayable.totalAmount)}</div>
              </div>
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Còn phải trả</div>
                <div className="font-mono font-bold text-cyan-300">{formatCurrencyVnd(selectedPayable.remainingAmount)}</div>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function PayableStatusBadge({ status }: { status: SupplierPayableRow['status'] }) {
  const map: Record<SupplierPayableRow['status'], { label: string; tone: string }> = {
    DUE: { label: 'Đến hạn', tone: 'bg-amber-400/10 text-amber-300 border-amber-400/20' },
    OVERDUE: { label: 'Quá hạn', tone: 'bg-red-400/10 text-red-300 border-red-400/20' },
    PAID: { label: 'Đã thanh toán', tone: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20' },
    PENDING: { label: 'Chờ thanh toán', tone: 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20' },
  }
  const item = map[status] ?? map.DUE
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${item.tone}`}>
      {item.label}
    </span>
  )
}

/* ==========================================================================
   TARGET 3: SUPPLIERS ACTIVITY LOG TAB
   ========================================================================== */

interface SupplierActivityLogRow {
  id: string
  code: string
  supplierId: string
  supplierCode: string
  supplierName: string
  action: string
  module: string
  performedBy: string
  timestamp: string
  ipAddress: string
  status: 'SUCCESS' | 'WARNING' | 'ERROR'
}

function SupplierActivityLogsTab({ suppliers }: { suppliers: Supplier[] }) {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<SupplierActivityLogRow | null>(null)

  const logs: SupplierActivityLogRow[] = useMemo(() => {
    if (!suppliers.length) {
      return [
        { id: 'log-1', code: 'LOG-2026-8801', supplierId: 's-1', supplierCode: 'NCC-001', supplierName: 'Thép Hòa Phát', action: 'Tạo mới PO #PO-2026-089', module: 'Đơn mua', performedBy: 'Nguyễn Văn A', timestamp: '2026-07-24 14:20', ipAddress: '192.168.1.45', status: 'SUCCESS' },
        { id: 'log-2', code: 'LOG-2026-8802', supplierId: 's-2', supplierCode: 'NCC-002', supplierName: 'Tập đoàn Hoa Sen', action: 'Cập nhật giá báo giá #BG-2026-002', module: 'Báo giá', performedBy: 'Trần Thị B', timestamp: '2026-07-24 13:45', ipAddress: '192.168.1.12', status: 'SUCCESS' },
        { id: 'log-3', code: 'LOG-2026-8803', supplierId: 's-3', supplierCode: 'NCC-003', supplierName: 'Thép Nam Kim', action: 'Ghi nhận giao hàng chậm #DEL-2026-044', module: 'Giao hàng', performedBy: 'Lê Văn C', timestamp: '2026-07-24 11:10', ipAddress: '192.168.1.88', status: 'WARNING' },
        { id: 'log-4', code: 'LOG-2026-8804', supplierId: 's-4', supplierCode: 'NCC-004', supplierName: 'Sơn Hải Phòng', action: 'Duyệt thanh toán công nợ #INV-2026-104', module: 'Công nợ', performedBy: 'Phạm Văn D', timestamp: '2026-07-24 09:30', ipAddress: '192.168.1.99', status: 'SUCCESS' },
      ]
    }
    const actions = ['Tạo mới PO', 'Cập nhật báo giá', 'Xác nhận giao hàng', 'Duyệt công nợ', 'Đánh giá SLA']
    const modules = ['Đơn mua', 'Báo giá', 'Giao hàng', 'Công nợ', 'Chất lượng']
    const users = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Văn D', 'Hoàng Văn E']

    return suppliers.map((s, idx) => ({
      id: `log-${s.id}`,
      code: `LOG-2026-${String(idx + 8801).padStart(4, '0')}`,
      supplierId: s.id,
      supplierCode: s.code,
      supplierName: s.name,
      action: `${actions[idx % actions.length]} cho ${s.code}`,
      module: modules[idx % modules.length],
      performedBy: users[idx % users.length],
      timestamp: `2026-07-24 ${String(8 + (idx % 10)).padStart(2, '0')}:${String(10 + (idx * 11) % 50).padStart(2, '0')}`,
      ipAddress: `192.168.1.${10 + (idx * 7) % 200}`,
      status: idx % 4 === 0 ? 'WARNING' : 'SUCCESS',
    }))
  }, [suppliers])

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (search.trim()) {
        const query = search.toLowerCase()
        const match = l.code.toLowerCase().includes(query) || l.action.toLowerCase().includes(query) || l.supplierName.toLowerCase().includes(query) || l.performedBy.toLowerCase().includes(query)
        if (!match) return false
      }
      if (actionFilter !== 'all' && l.module !== actionFilter) return false
      if (supplierFilter !== 'all' && l.supplierId !== supplierFilter) return false
      return true
    })
  }, [logs, search, actionFilter, supplierFilter])

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  useEffect(() => setPage(1), [search, actionFilter, supplierFilter, pageSize])

  const todayLogs = filtered.filter((l) => l.timestamp.startsWith('2026-07-24')).length
  const poLogs = filtered.filter((l) => l.module === 'Đơn mua').length
  const deliveryLogs = filtered.filter((l) => l.module === 'Giao hàng').length
  const warningLogs = filtered.filter((l) => l.status === 'WARNING').length

  return (
    <div className="w-full min-w-0 flex-1 space-y-1">
      {/* Phase 1: Enterprise Activity KPI Cards */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard
          title="Tổng hoạt động"
          value={formatQuantity(filtered.length, 0)}
          tone="blue"
          icon={<Activity size={15} />}
        />
        <EnterpriseKpiCard
          title="Hôm nay"
          value={formatQuantity(todayLogs, 0)}
          tone="emerald"
          icon={<Clock size={15} />}
        />
        <EnterpriseKpiCard
          title="Đơn mua mới"
          value={formatQuantity(poLogs, 0)}
          tone="cyan"
          icon={<FileText size={15} />}
        />
        <EnterpriseKpiCard
          title="Giao hàng mới"
          value={formatQuantity(deliveryLogs, 0)}
          tone="purple"
          icon={<Truck size={15} />}
        />
        <EnterpriseKpiCard
          title="Cảnh báo"
          value={formatQuantity(warningLogs, 0)}
          tone="amber"
          icon={<Clock size={15} />}
        />
        <EnterpriseKpiCard
          title="Người dùng hoạt động"
          value="8 người"
          tone="emerald"
          icon={<CheckCircle2 size={15} />}
        />
      </div>

      {/* Phase 2: Analytics Dashboard */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-4">
        <CockpitChartCard title="Hoạt động theo phân loại" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars
            rows={[
              ['Đơn mua', poLogs],
              ['Giao hàng', deliveryLogs],
              ['Báo giá', filtered.filter((l) => l.module === 'Báo giá').length],
              ['Công nợ', filtered.filter((l) => l.module === 'Công nợ').length],
            ]}
          />
        </CockpitChartCard>
        <CockpitChartCard title="Thống kê sự kiện" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitStatusList
            items={[
              { id: '1', label: 'Tỷ lệ thành công', value: `${filtered.length ? Math.round(((filtered.length - warningLogs) / filtered.length) * 100) : 100}%`, statusTone: 'emerald' },
              { id: '2', label: 'Cảnh báo hệ thống', value: `${warningLogs} sự kiện`, statusTone: 'amber' },
              { id: '3', label: 'Người dùng thao tác nhiều nhất', value: 'Nguyễn Văn A', statusTone: 'cyan' },
            ]}
          />
        </CockpitChartCard>
        <CockpitChartCard title="Nhật ký thao tác mới" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitRecentList
            items={filtered.slice(0, 5).map((l) => ({
              id: l.id,
              title: l.code,
              subtitle: `${l.performedBy} · ${l.action}`,
              time: l.timestamp.split(' ')[1],
              statusDot: l.status === 'WARNING' ? 'bg-amber-400' : 'bg-emerald-400',
            }))}
            emptyMessage="Chưa có nhật ký hoạt động."
          />
        </CockpitChartCard>
        <CockpitChartCard title="Top người thực hiện" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars
            rows={[
              ['Nguyễn Văn A', 14],
              ['Trần Thị B', 10],
              ['Lê Văn C', 8],
              ['Phạm Văn D', 6],
            ]}
          />
        </CockpitChartCard>
      </div>

      {/* Phase 3: Compact Toolbar */}
      <EnterprisePanel className="rounded-xl -mt-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_180px_180px_180px_110px_110px]">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã nhật ký, hành động, người thực hiện..."
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="all">Tất cả phân loại</option>
            <option value="Đơn mua">Đơn mua</option>
            <option value="Báo giá">Báo giá</option>
            <option value="Giao hàng">Giao hàng</option>
            <option value="Công nợ">Công nợ</option>
            <option value="Chất lượng">Chất lượng</option>
          </select>

          <select
            value="all"
            onChange={() => {}}
            className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="all">Tất cả khoảng thời gian</option>
            <option value="today">Hôm nay</option>
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
          </select>

          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="all">Tất cả nhà cung cấp</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} · {s.name}
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
              setSearch('')
              setActionFilter('all')
              setSupplierFilter('all')
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
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Nhật ký hoạt động hệ thống</h3>
              <span className="rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-300 border border-blue-400/20">
                {filtered.length} nhật ký
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
            <table className="w-full min-w-[1000px] table-fixed text-sm border-collapse">
              <thead
                className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
              >
                <tr>
                  {['Thời gian', 'Mã nhật ký', 'Nhà cung cấp', 'Hành động', 'Phân loại', 'Người thực hiện', 'Trạng thái', 'Thao tác'].map((heading) => (
                    <th key={heading} className="px-2 py-2 text-xs font-semibold text-slate-300 text-left">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((row) => (
                  <tr key={row.id} onClick={() => setSelectedLog(row)} className={`${inventoryTableRow} cursor-pointer`}>
                    <td className="px-2 py-2 font-mono text-slate-400 text-xs truncate">{row.timestamp}</td>
                    <td className="px-2 py-2 font-mono font-semibold text-cyan-300 text-xs">{row.code}</td>
                    <td className="px-2 py-2 text-white font-medium truncate">{row.supplierName}</td>
                    <td className="px-2 py-2 text-slate-200 text-xs truncate">{row.action}</td>
                    <td className="px-2 py-2 text-slate-300 text-xs truncate">{row.module}</td>
                    <td className="px-2 py-2 text-cyan-400 text-xs truncate">{row.performedBy}</td>
                    <td className="px-2 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${row.status === 'WARNING' ? 'bg-amber-400/10 text-amber-300 border-amber-400/20' : 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20'}`}>
                        {row.status === 'WARNING' ? 'Cảnh báo' : 'Thành công'}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedLog(row)
                        }}
                        className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
                {!paged.length ? (
                  <tr>
                    <td colSpan={8} className="px-2 py-10">
                      <CockpitEmptyState
                        title="Chưa có nhật ký hoạt động"
                        description="Không tìm thấy thông tin nhật ký."
                        icon={<Activity size={18} />}
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <DataTablePagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
        </EnterprisePanel>

        <div className="space-y-1">
          <CockpitChartCard title="Hoạt động quan trọng" heightClass="h-[220px]" chartHeightClass="h-[138px]">
            <CockpitStatusList
              items={filtered.slice(0, 4).map((l) => ({
                id: l.id,
                label: `${l.code} · ${l.performedBy}`,
                value: l.module,
                statusTone: 'cyan',
              }))}
            />
          </CockpitChartCard>
          <CockpitChartCard title="Nhật ký gần đây" heightClass="h-[220px]" chartHeightClass="h-[138px]">
            <CockpitRecentList
              items={filtered.slice(0, 4).map((l) => ({
                id: l.id,
                title: l.code,
                subtitle: l.action,
                time: l.timestamp.split(' ')[1],
                statusDot: 'bg-emerald-400',
              }))}
              emptyMessage="Chưa có nhật ký gần đây."
            />
          </CockpitChartCard>
        </div>
      </div>

      {/* Phase 5: EXPANDED TABLE MODAL */}
      {expandedModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">Toàn bộ nhật ký hoạt động hệ thống</h2>
                    <p className="text-xs text-slate-400">Tổng cộng {filtered.length} nhật ký thao tác</p>
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
                  <table className="w-full min-w-[1000px] text-xs table-fixed border-collapse">
                    <thead
                      className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                      style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                    >
                      <tr>
                        {['Thời gian', 'Mã nhật ký', 'Nhà cung cấp', 'Hành động', 'Phân loại', 'Người thực hiện', 'Trạng thái', 'Thao tác'].map((heading) => (
                          <th key={heading} className="px-2 py-2 text-left font-semibold text-slate-300">
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((row) => (
                        <tr
                          key={row.id}
                          onClick={() => {
                            setSelectedLog(row)
                            setExpandedModalOpen(false)
                          }}
                          className={`${inventoryTableRow} cursor-pointer`}
                        >
                          <td className="px-2 py-2 font-mono text-slate-400">{row.timestamp}</td>
                          <td className="px-2 py-2 font-mono font-semibold text-cyan-300">{row.code}</td>
                          <td className="px-2 py-2 text-white font-medium truncate">{row.supplierName}</td>
                          <td className="px-2 py-2 text-slate-200 truncate">{row.action}</td>
                          <td className="px-2 py-2 text-slate-300 truncate">{row.module}</td>
                          <td className="px-2 py-2 text-cyan-400 truncate">{row.performedBy}</td>
                          <td className="px-2 py-2">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${row.status === 'WARNING' ? 'bg-amber-400/10 text-amber-300 border-amber-400/20' : 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20'}`}>
                              {row.status === 'WARNING' ? 'Cảnh báo' : 'Thành công'}
                            </span>
                          </td>
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedLog(row)
                                setExpandedModalOpen(false)
                              }}
                              className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition"
                            >
                              Chi tiết
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

      {/* Phase 6: Detail Drawer */}
      {selectedLog ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <section className="h-full w-full max-w-2xl overflow-y-auto border-l border-cyan-900 bg-[#05101d] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-400">Chi tiết nhật ký hoạt động</span>
                <h2 className="text-lg font-bold text-white mt-0.5">{selectedLog.code}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Người thực hiện</div>
                <div className="font-semibold text-white">{selectedLog.performedBy}</div>
              </div>
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Thời gian thao tác</div>
                <div className="font-mono text-slate-200">{selectedLog.timestamp}</div>
              </div>
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Hành động thực hiện</div>
                <div className="text-slate-200 font-medium">{selectedLog.action}</div>
              </div>
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Địa chỉ IP</div>
                <div className="font-mono text-cyan-300">{selectedLog.ipAddress}</div>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

/* ==========================================================================
   TARGET 4: SUPPLIERS REPORTS TAB
   ========================================================================== */

interface SupplierReportRow {
  id: string
  code: string
  name: string
  category: string
  period: string
  dataSource: string
  createdAt: string
  format: 'PDF' | 'EXCEL' | 'CSV'
  size: string
}

function SupplierReportsTab({ suppliers }: { suppliers: Supplier[] }) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [formatFilter, setFormatFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<SupplierReportRow | null>(null)

  const reports: SupplierReportRow[] = useMemo(() => {
    return [
      { id: 'rep-1', code: 'RP-2026-001', name: 'Báo cáo tổng hợp mua hàng theo NCC', category: 'Báo cáo mua hàng', period: 'Tháng 07/2026', dataSource: 'Purchase Module API', createdAt: '2026-07-24', format: 'PDF', size: '2.4 MB' },
      { id: 'rep-2', code: 'RP-2026-002', name: 'Báo cáo đánh giá chất lượng SLA', category: 'Báo cáo đánh giá', period: 'Quý II/2026', dataSource: 'Quality Evaluation Engine', createdAt: '2026-07-20', format: 'EXCEL', size: '4.8 MB' },
      { id: 'rep-3', code: 'RP-2026-003', name: 'Báo cáo phân tích công nợ quá hạn', category: 'Báo cáo công nợ', period: 'Tháng 07/2026', dataSource: 'Finance AP Ledger', createdAt: '2026-07-22', format: 'EXCEL', size: '1.9 MB' },
      { id: 'rep-4', code: 'RP-2026-004', name: 'Thống kê tỷ lệ giao hàng đúng hạn', category: 'Báo cáo chất lượng', period: 'Tháng 06/2026', dataSource: 'Logistics Tracker', createdAt: '2026-07-01', format: 'PDF', size: '3.1 MB' },
      { id: 'rep-5', code: 'RP-2026-005', name: 'Báo cáo tiết kiệm chi phí mua hàng', category: 'Báo cáo mua hàng', period: 'Sáu tháng đầu năm 2026', dataSource: 'Procurement Analytics', createdAt: '2026-07-15', format: 'CSV', size: '850 KB' },
    ]
  }, [])

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (search.trim()) {
        const query = search.toLowerCase()
        const match = r.code.toLowerCase().includes(query) || r.name.toLowerCase().includes(query) || r.category.toLowerCase().includes(query)
        if (!match) return false
      }
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false
      if (formatFilter !== 'all' && r.format !== formatFilter) return false
      return true
    })
  }, [reports, search, categoryFilter, formatFilter])

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  useEffect(() => setPage(1), [search, categoryFilter, formatFilter, pageSize])

  return (
    <div className="w-full min-w-0 flex-1 space-y-1">
      {/* Phase 1: Enterprise Reports KPI Cards */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-6">
        <EnterpriseKpiCard
          title="Tổng báo cáo"
          value={formatQuantity(filtered.length, 0)}
          tone="blue"
          icon={<FileText size={15} />}
        />
        <EnterpriseKpiCard
          title="Giá trị mua"
          value="12.5 tỷ đ"
          tone="emerald"
          icon={<TrendingUp size={15} />}
        />
        <EnterpriseKpiCard
          title="Doanh số NCC"
          value="8.2 tỷ đ"
          tone="cyan"
          icon={<BarChart3 size={15} />}
        />
        <EnterpriseKpiCard
          title="Đúng hạn"
          value="95.8%"
          tone="emerald"
          icon={<CheckCircle2 size={15} />}
        />
        <EnterpriseKpiCard
          title="Chất lượng"
          value="98.2%"
          tone="purple"
          icon={<Star size={15} />}
        />
        <EnterpriseKpiCard
          title="Tiết kiệm chi phí"
          value="340 tr đ"
          tone="amber"
          icon={<TrendingUp size={15} />}
        />
      </div>

      {/* Phase 2: Analytics Dashboard */}
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:grid-cols-4">
        <CockpitChartCard title="Báo cáo theo phân nhóm" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars
            rows={[
              ['Mua hàng', filtered.filter((r) => r.category === 'Báo cáo mua hàng').length],
              ['Đánh giá SLA', filtered.filter((r) => r.category === 'Báo cáo đánh giá').length],
              ['Công nợ', filtered.filter((r) => r.category === 'Báo cáo công nợ').length],
              ['Chất lượng', filtered.filter((r) => r.category === 'Báo cáo chất lượng').length],
            ]}
          />
        </CockpitChartCard>
        <CockpitChartCard title="Hiệu năng xuất báo cáo" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitStatusList
            items={[
              { id: '1', label: 'Báo cáo sẵn sàng', value: '100%', statusTone: 'emerald' },
              { id: '2', label: 'Thời gian xuất TB', value: '1.2s', statusTone: 'cyan' },
              { id: '3', label: 'Dung lượng dữ liệu', value: '12.6 MB', statusTone: 'purple' },
            ]}
          />
        </CockpitChartCard>
        <CockpitChartCard title="Báo cáo vừa xuất" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <CockpitRecentList
            items={filtered.slice(0, 5).map((r) => ({
              id: r.id,
              title: r.code,
              subtitle: `${r.name} · ${r.format}`,
              time: date(r.createdAt),
              statusDot: 'bg-emerald-400',
            }))}
            emptyMessage="Chưa có báo cáo vừa xuất."
          />
        </CockpitChartCard>
        <CockpitChartCard title="Định dạng xuất báo cáo" heightClass="h-[220px]" chartHeightClass="h-[138px]">
          <StatusMiniBars
            rows={[
              ['PDF', filtered.filter((r) => r.format === 'PDF').length],
              ['EXCEL', filtered.filter((r) => r.format === 'EXCEL').length],
              ['CSV', filtered.filter((r) => r.format === 'CSV').length],
            ]}
          />
        </CockpitChartCard>
      </div>

      {/* Phase 3: Compact Toolbar */}
      <EnterprisePanel className="rounded-xl -mt-1">
        <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_180px_180px_180px_110px_110px]">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên báo cáo, mã báo cáo, nguồn dữ liệu..."
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="all">Tất cả nhóm báo cáo</option>
            <option value="Báo cáo mua hàng">Báo cáo mua hàng</option>
            <option value="Báo cáo đánh giá">Báo cáo đánh giá</option>
            <option value="Báo cáo công nợ">Báo cáo công nợ</option>
            <option value="Báo cáo chất lượng">Báo cáo chất lượng</option>
          </select>

          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="all">Tất cả định dạng</option>
            <option value="PDF">PDF</option>
            <option value="EXCEL">EXCEL</option>
            <option value="CSV">CSV</option>
          </select>

          <select
            value="all"
            onChange={() => {}}
            className="h-9 w-full truncate rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
          >
            <option value="all">Tất cả kỳ báo cáo</option>
            <option value="month">Tháng này</option>
            <option value="quarter">Quý này</option>
            <option value="year">Năm nay</option>
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
              setSearch('')
              setCategoryFilter('all')
              setFormatFilter('all')
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
              <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Danh sách báo cáo nhà cung cấp</h3>
              <span className="rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-300 border border-blue-400/20">
                {filtered.length} báo cáo
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
            <table className="w-full min-w-[1000px] table-fixed text-sm border-collapse">
              <thead
                className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
              >
                <tr>
                  {['Mã báo cáo', 'Tên báo cáo', 'Nhóm báo cáo', 'Kỳ báo cáo', 'Nguồn dữ liệu', 'Ngày tạo', 'Định dạng', 'Thao tác'].map((heading) => (
                    <th key={heading} className="px-2 py-2 text-xs font-semibold text-slate-300 text-left">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((row) => (
                  <tr key={row.id} onClick={() => setSelectedReport(row)} className={`${inventoryTableRow} cursor-pointer`}>
                    <td className="px-2 py-2 font-mono font-semibold text-cyan-300 text-xs">{row.code}</td>
                    <td className="px-2 py-2 text-white font-medium truncate">{row.name}</td>
                    <td className="px-2 py-2 text-slate-300 text-xs truncate">{row.category}</td>
                    <td className="px-2 py-2 text-slate-300 text-xs truncate">{row.period}</td>
                    <td className="px-2 py-2 font-mono text-cyan-400 text-xs truncate">{row.dataSource}</td>
                    <td className="px-2 py-2 text-slate-300 text-xs truncate">{date(row.createdAt)}</td>
                    <td className="px-2 py-2">
                      <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-400/20">
                        {row.format} ({row.size})
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedReport(row)
                        }}
                        className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
                {!paged.length ? (
                  <tr>
                    <td colSpan={8} className="px-2 py-10">
                      <CockpitEmptyState
                        title="Chưa có báo cáo"
                        description="Không tìm thấy báo cáo phù hợp."
                        icon={<FileText size={18} />}
                      />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <DataTablePagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
        </EnterprisePanel>

        <div className="space-y-1">
          <CockpitChartCard title="Báo cáo dùng nhiều nhất" heightClass="h-[220px]" chartHeightClass="h-[138px]">
            <CockpitStatusList
              items={filtered.slice(0, 4).map((r) => ({
                id: r.id,
                label: r.name,
                value: r.format,
                statusTone: 'emerald',
              }))}
            />
          </CockpitChartCard>
          <CockpitChartCard title="Báo cáo vừa cập nhật" heightClass="h-[220px]" chartHeightClass="h-[138px]">
            <CockpitRecentList
              items={filtered.slice(0, 4).map((r) => ({
                id: r.id,
                title: r.code,
                subtitle: r.period,
                time: date(r.createdAt),
                statusDot: 'bg-cyan-400',
              }))}
              emptyMessage="Chưa có báo cáo vừa cập nhật."
            />
          </CockpitChartCard>
        </div>
      </div>

      {/* Phase 5: EXPANDED TABLE MODAL */}
      {expandedModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">Toàn bộ danh sách báo cáo nhà cung cấp</h2>
                    <p className="text-xs text-slate-400">Tổng cộng {filtered.length} báo cáo</p>
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
                  <table className="w-full min-w-[1000px] text-xs table-fixed border-collapse">
                    <thead
                      className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                      style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                    >
                      <tr>
                        {['Mã báo cáo', 'Tên báo cáo', 'Nhóm báo cáo', 'Kỳ báo cáo', 'Nguồn dữ liệu', 'Ngày tạo', 'Định dạng', 'Thao tác'].map((heading) => (
                          <th key={heading} className="px-2 py-2 text-left font-semibold text-slate-300">
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((row) => (
                        <tr
                          key={row.id}
                          onClick={() => {
                            setSelectedReport(row)
                            setExpandedModalOpen(false)
                          }}
                          className={`${inventoryTableRow} cursor-pointer`}
                        >
                          <td className="px-2 py-2 font-mono font-semibold text-cyan-300">{row.code}</td>
                          <td className="px-2 py-2 text-white font-medium truncate">{row.name}</td>
                          <td className="px-2 py-2 text-slate-300 truncate">{row.category}</td>
                          <td className="px-2 py-2 text-slate-300 truncate">{row.period}</td>
                          <td className="px-2 py-2 font-mono text-cyan-400 truncate">{row.dataSource}</td>
                          <td className="px-2 py-2 text-slate-300 truncate">{date(row.createdAt)}</td>
                          <td className="px-2 py-2">
                            <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-400/20">
                              {row.format} ({row.size})
                            </span>
                          </td>
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedReport(row)
                                setExpandedModalOpen(false)
                              }}
                              className="rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-200 hover:border-cyan-500 transition"
                            >
                              Chi tiết
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

      {/* Phase 6: Detail Drawer */}
      {selectedReport ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <section className="h-full w-full max-w-2xl overflow-y-auto border-l border-cyan-900 bg-[#05101d] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-400">Chi tiết báo cáo</span>
                <h2 className="text-lg font-bold text-white mt-0.5">{selectedReport.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Mã báo cáo</div>
                <div className="font-mono font-semibold text-cyan-300">{selectedReport.code}</div>
              </div>
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Nhóm báo cáo</div>
                <div className="text-white font-medium">{selectedReport.category}</div>
              </div>
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Kỳ báo cáo</div>
                <div className="text-slate-200">{selectedReport.period}</div>
              </div>
              <div className={`${panel} p-3 space-y-1`}>
                <div className="text-[10px] text-slate-500 uppercase">Định dạng & Dung lượng</div>
                <div className="font-mono text-cyan-400">{selectedReport.format} ({selectedReport.size})</div>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
