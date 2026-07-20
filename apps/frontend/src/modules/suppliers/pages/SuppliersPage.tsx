import { useMemo, useState } from 'react'
import { BarChart3, FileText, PackageSearch, Pencil, Search, Star, Truck, X, type LucideIcon } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { EnterpriseWorkspace } from '@/shared/ui/enterprise'
import { CockpitKpiCard } from '@/shared/ui/cockpit'
import { SupplierFormModal } from '../components/SupplierFormModal'
import {
  useCreateSupplierMutation,
  useSupplierEvaluationCockpitQuery,
  useSupplierCockpitDetailQuery,
  useSupplierCockpitSummaryQuery,
  useSuppliersQuery,
  useUpdateSupplierMutation,
} from '../hooks/useSuppliersQuery'
import { formatQuantity } from '@/shared/utils/number-format'
import type {
  Supplier,
  SupplierEvaluationCockpit,
  SupplierEvaluationRow,
  SupplierPayload,
} from '../api/suppliers.api'

const fmt = (value = 0) => formatQuantity(value, 2)
const money = (value = 0) => formatQuantity(value, 0)
const date = (value?: string | null) => value ? new Date(value).toLocaleDateString('vi-VN') : '-'
const panel = 'rounded-lg border border-white/10 bg-slate-950/55 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl'
const input = 'h-9 rounded-lg border border-white/10 bg-slate-950/65 px-3 text-xs text-slate-100 outline-none transition focus:border-blue-400'
const primaryButton = 'rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500'
const mutedButton = 'rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-200 hover:bg-white/[0.08]'
const tableHead = 'bg-white/[0.04] text-[10px] uppercase tracking-[0.12em] text-slate-400'
const tableRow = 'border-t border-white/10 text-slate-200 transition hover:bg-cyan-400/10'

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

export function SuppliersPage() {
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [evaluationFilter, setEvaluationFilter] = useState('all')
  const [openModal, setOpenModal] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  const { data: suppliers = [], isLoading } = useSuppliersQuery(search)
  const { data: summary } = useSupplierCockpitSummaryQuery()
  const { data: evaluations } = useSupplierEvaluationCockpitQuery()
  const createMutation = useCreateSupplierMutation()
  const updateMutation = useUpdateSupplierMutation()
  const moduleTab = supplierTabs.find((tab) => tab.path === location.pathname)?.id ?? 'overview'
  const isSupplierListView = moduleTab === 'overview' || moduleTab === 'list'
  const isSupplierQualityView = moduleTab === 'quality'

  const rows = useMemo(() => suppliers.filter((supplier) => {
    if (status === 'inactive') return false
    return true
  }), [status, suppliers])
  const supplierTableEmptyRows = Array.from({ length: Math.max(0, 12 - rows.length) })
  const evaluationRows = useMemo(() => {
    const rows = evaluations?.rows ?? []
    return rows.filter((row) => {
      if (evaluationFilter === 'all') return true
      if (evaluationFilter === 'evaluated') return row.overall > 0
      return row.classification === evaluationFilter
    })
  }, [evaluationFilter, evaluations?.rows])

  function openCreateModal() {
    setEditing(null)
    setOpenModal(true)
  }

  function openEditModal(supplier: Supplier) {
    setEditing(supplier)
    setOpenModal(true)
  }

  async function handleSubmit(payload: SupplierPayload) {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
    setOpenModal(false)
    setEditing(null)
  }

  return (
    <EnterpriseWorkspace
      eyebrow="Đối tác"
      title="Nhà cung cấp"
      description={isSupplierListView ? 'Danh sách nhà cung cấp liên kết Inventory inbound và supplier master.' : 'Không gian nghiệp vụ nhà cung cấp được đồng bộ với sidebar và URL.'}
      breadcrumbs={['Mua hàng', 'Nhà cung cấp']}
      tabs={supplierTabs}
      activeTab={moduleTab}
      actions={<button type="button" className={primaryButton} onClick={openCreateModal}>+ Thêm nhà cung cấp</button>}
    >
      <div className="space-y-4">

        {isSupplierListView ? <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="Total Suppliers" value={summary?.total ?? suppliers.length} note="Master records" trend={[0, (summary?.total ?? suppliers.length) * 0.7, summary?.total ?? suppliers.length]} />
          <KpiCard title="Active Suppliers" value={summary?.active ?? suppliers.length} note="Schema hiện chưa có status" tone="emerald" trend={[0, (summary?.active ?? suppliers.length) * 0.7, summary?.active ?? suppliers.length]} />
          <KpiCard title="Inactive Suppliers" value={summary?.inactive ?? 0} note="Reserved for S2" tone="amber" trend={[0, summary?.inactive ?? 0, summary?.inactive ?? 0]} />
          <KpiCard title="Suppliers Used In Inventory" value={summary?.usedInInventory ?? 0} note="Inbound/transactions" tone="cyan" trend={[0, (summary?.usedInInventory ?? 0) * 0.65, summary?.usedInInventory ?? 0]} />
          </div>

          <div className={`${panel} flex flex-wrap items-end gap-2 p-3`}>
          <div className="flex min-w-[320px] flex-1 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/65 px-3">
            <Search size={15} className="text-cyan-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm mã, tên, liên hệ, điện thoại, email..."
              className="h-9 w-full bg-transparent text-xs text-slate-100 outline-none"
            />
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className={input}>
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className={`${panel} min-h-[640px] overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-100">Supplier list ({rows.length})</h2>
              <span className="text-xs text-slate-500">Master cockpit</span>
            </div>
            <div className="max-h-[590px] overflow-auto">
              <table className="w-full min-w-[1040px] text-left text-sm">
                <thead className={tableHead}>
                  <tr>
                    {['STT', 'Supplier Code', 'Supplier Name', 'Contact', 'Phone', 'Email', 'Status', 'Created Date', 'Actions'].map((heading) => (
                      <th key={heading} className="px-4 py-3 font-medium">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-500">Đang tải nhà cung cấp...</td></tr>
                  ) : rows.map((supplier, index) => (
                    <tr key={supplier.id} onClick={() => setSelectedSupplier(supplier)} className={`cursor-pointer ${tableRow}`}>
                      <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3 font-semibold text-cyan-300">{supplier.code}</td>
                      <td className="px-4 py-3">{supplier.name}</td>
                      <td className="px-4 py-3">{supplier.contact || '-'}</td>
                      <td className="px-4 py-3">{supplier.phone || '-'}</td>
                      <td className="px-4 py-3">{supplier.email || '-'}</td>
                      <td className="px-4 py-3"><span className="rounded bg-emerald-950 px-2 py-1 text-[10px] text-emerald-300">ACTIVE</span></td>
                      <td className="px-4 py-3">{date(supplier.createdAt)}</td>
                      <td className="px-4 py-3">
                        <button onClick={(event) => { event.stopPropagation(); openEditModal(supplier) }} className="inline-flex items-center gap-1 rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-500">
                          <Pencil size={13} /> Sửa
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && supplierTableEmptyRows.map((_, index) => (
                    <tr key={`supplier-empty-${index}`} aria-hidden="true" className="border-t border-white/[0.04]">
                      <td colSpan={9} className="h-[45px] px-4 py-3">
                        <div className="h-px w-full bg-white/[0.035]" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-3 xl:sticky xl:top-3 xl:self-start">
            <InsightList title="Top Suppliers" rows={summary?.topSuppliers ?? []} empty="Chưa có dữ liệu xếp hạng." />
            <div className={`${panel} p-4`}>
              <h3 className="text-sm font-semibold text-slate-100">Recent Suppliers</h3>
              <div className="mt-3 space-y-2">
                {(summary?.recentSuppliers ?? suppliers.slice(0, 5)).map((supplier) => (
                  <button key={supplier.id} onClick={() => setSelectedSupplier(supplier)} className="flex w-full justify-between rounded border border-slate-800 px-3 py-2 text-left text-xs hover:border-cyan-600">
                    <span className="text-cyan-300">{supplier.code}</span>
                    <span className="truncate pl-3 text-slate-300">{supplier.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <InsightList title="Most Used Suppliers" rows={summary?.mostUsedSuppliers ?? []} empty="Chưa có NCC dùng trong Inventory." />
            <div className={`${panel} p-4`}>
              <h3 className="text-sm font-semibold text-slate-100">Supplier analytics readiness</h3>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <SupplierInsightEmptyCard icon={BarChart3} label="Spend trend" />
                <SupplierInsightEmptyCard icon={Truck} label="Delivery SLA" />
                <SupplierInsightEmptyCard icon={Star} label="Quality score" />
                <SupplierInsightEmptyCard icon={PackageSearch} label="Material mix" />
              </div>
            </div>
          </aside>
          </div>
        </> : isSupplierQualityView ? <SupplierEvaluationTab
          data={evaluations}
          rows={evaluationRows}
          suppliers={suppliers}
          filter={evaluationFilter}
          onFilterChange={setEvaluationFilter}
          onOpenSupplier={setSelectedSupplier}
          onCreateScore={() => undefined}
        /> : <SupplierCapabilityEmpty tab={moduleTab} />}
      </div>

      <SupplierDetailWorkspace
        supplier={selectedSupplier}
        onClose={() => setSelectedSupplier(null)}
        onEdit={(supplier) => openEditModal(supplier)}
      />

      <SupplierFormModal
        open={openModal}
        editing={editing}
        loading={createMutation.isPending || updateMutation.isPending}
        onClose={() => setOpenModal(false)}
        onSubmit={handleSubmit}
      />
    </EnterpriseWorkspace>
  )
}

function KpiCard({ title, value, note, tone = 'cyan', trend }: { title: string; value: number; note: string; tone?: 'cyan' | 'emerald' | 'amber'; trend?: number[] }) {
  return <CockpitKpiCard title={title} value={fmt(value)} note={note} tone={tone} trend={trend} />
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

  return <div className="grid gap-3 xl:grid-cols-[1fr_360px]">
    <section className={`${panel} overflow-hidden`}>
      <div className="border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-100">{labels[tab]}</h2>
        <p className="mt-1 text-xs text-slate-500">Workspace đã sẵn sàng cho dữ liệu nghiệp vụ thật của nhà cung cấp.</p>
      </div>
      <div className="p-6 text-center">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
          <FileText size={18} />
        </div>
        <div className="mt-3 text-sm font-semibold text-slate-100">Chưa có dữ liệu cho {labels[tab]}</div>
        <p className="mx-auto mt-1 max-w-xl text-xs text-slate-500">
          Chưa có read contract riêng cho tab này. UI giữ trạng thái rỗng có kiểm soát, không tạo dữ liệu mẫu hoặc số liệu giả.
        </p>
      </div>
    </section>
    <aside className={`${panel} p-4`}>
      <h3 className="text-sm font-semibold text-white">Bước tiếp theo</h3>
      <div className="mt-3 space-y-2 text-xs text-slate-400">
        <p className="rounded border border-slate-800 bg-slate-950/50 p-3">Xác định owner dữ liệu cho {labels[tab]}.</p>
        <p className="rounded border border-slate-800 bg-slate-950/50 p-3">Expose read model/API trước khi bật bảng dữ liệu.</p>
        <p className="rounded border border-slate-800 bg-slate-950/50 p-3">Sau khi có API, dùng Enterprise Table và drawer hiện có.</p>
      </div>
    </aside>
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

function SupplierEvaluationTab({
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
  onCreateScore: () => void
}) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string>()
  const visibleRows = rows.filter((row) => `${row.code} ${row.name} ${row.contact ?? ''}`.toLowerCase().includes(query.toLowerCase()))
  const selected = visibleRows.find((row) => row.id === selectedId) ?? visibleRows[0]
  const metrics = data?.metrics
  const evaluationEmptyRows = Array.from({ length: Math.max(0, 12 - visibleRows.length) })
  const distribution = [
    ['Xuất sắc', metrics?.excellent ?? 0, 'bg-emerald-500'],
    ['Tốt', metrics?.good ?? 0, 'bg-blue-500'],
    ['Đạt', metrics?.pass ?? 0, 'bg-amber-400'],
    ['Cảnh báo', metrics?.warning ?? 0, 'bg-red-500'],
  ] as const
  const totalClassified = Math.max(1, distribution.reduce((sum, [, value]) => sum + value, 0))

  return <div className="space-y-4">
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
      <KpiCard title="Tổng nhà cung cấp" value={metrics?.total ?? 0} note="Supplier master" trend={[0, (metrics?.total ?? 0) * 0.75, metrics?.total ?? 0]} />
      <KpiCard title="Đã đánh giá" value={metrics?.evaluated ?? 0} note={`${fmt(metrics?.total ? (metrics.evaluated / metrics.total) * 100 : 0)}%`} tone="emerald" trend={[0, (metrics?.evaluated ?? 0) * 0.65, metrics?.evaluated ?? 0]} />
      <KpiCard title="Điểm đánh giá TB" value={metrics?.averageOverall ?? 0} note="/ 5" tone="amber" trend={[0, (metrics?.averageOverall ?? 0) * 0.7, metrics?.averageOverall ?? 0]} />
      <KpiCard title="Nhà cung cấp xuất sắc" value={metrics?.excellent ?? 0} note=">= 4.5" tone="cyan" trend={[0, (metrics?.excellent ?? 0) * 0.7, metrics?.excellent ?? 0]} />
      <KpiCard title="Nhà cung cấp đạt" value={(metrics?.good ?? 0) + (metrics?.pass ?? 0)} note=">= 2.5" tone="emerald" trend={[0, ((metrics?.good ?? 0) + (metrics?.pass ?? 0)) * 0.7, (metrics?.good ?? 0) + (metrics?.pass ?? 0)]} />
      <KpiCard title="Nhà cung cấp cảnh báo" value={metrics?.warning ?? 0} note="< 2.5" tone="amber" trend={[0, metrics?.warning ?? 0, (metrics?.warning ?? 0) * 0.75]} />
      <KpiCard title="Nhà cung cấp ngưng HĐ" value={metrics?.inactive ?? 0} note="Reserved S2" tone="amber" trend={[0, metrics?.inactive ?? 0, metrics?.inactive ?? 0]} />
    </div>

    <div className={`${panel} flex flex-wrap items-end gap-2 p-3`}>
      <div className="flex min-w-[320px] flex-1 items-center gap-2 rounded-lg border border-white/10 bg-slate-950/65 px-3">
        <Search size={15} className="text-cyan-400" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm kiếm theo tên, mã NCC, người liên hệ..." className="h-9 w-full bg-transparent text-xs text-slate-100 outline-none" />
      </div>
      <select value={filter} onChange={(event) => onFilterChange(event.target.value)} className={input}>
        <option value="all">Kết quả đánh giá: Tất cả</option>
        <option value="evaluated">Đã đánh giá</option>
        <option value="EXCELLENT">Xuất sắc</option>
        <option value="GOOD">Tốt</option>
        <option value="PASS">Đạt</option>
        <option value="WARNING">Cảnh báo</option>
        <option value="UNRATED">Chưa đánh giá</option>
      </select>
      <button className={mutedButton}>Bộ lọc</button>
      <button className={mutedButton}>Làm mới</button>
    </div>

    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className={`${panel} min-h-[640px] overflow-hidden`}>
        <div className="flex justify-between border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-100">Danh sách đánh giá</h2>
          <span className="text-xs text-slate-500">{visibleRows.length} kết quả</span>
        </div>
        <div className="max-h-[580px] overflow-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className={tableHead}><tr>{['STT', 'Mã nhà cung cấp', 'Tên nhà cung cấp', 'Lần đánh giá mới nhất', 'Điểm tổng', 'Xếp loại', 'Trạng thái'].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead>
            <tbody>{visibleRows.map((row, index) => <tr key={row.id} onClick={() => setSelectedId(row.id)} className={`cursor-pointer ${tableRow} ${selected?.id === row.id ? 'bg-cyan-500/10' : ''}`}>
              <td className="px-4 py-3 text-slate-500">{index + 1}</td>
              <td className="px-4 py-3 text-cyan-300">{row.code}</td>
              <td className="px-4 py-3">{row.name}</td>
              <td className="px-4 py-3">{date(row.lastEvaluationAt)}</td>
              <td className="px-4 py-3">{fmt(row.overall)} {Stars(row.overall)}</td>
              <td className="px-4 py-3"><ClassificationBadge value={row.classification} /></td>
              <td className="px-4 py-3"><span className="rounded bg-emerald-950 px-2 py-1 text-[10px] text-emerald-300">{row.status}</span></td>
            </tr>)}{evaluationEmptyRows.map((_, index) => (
              <tr key={`evaluation-empty-${index}`} aria-hidden="true" className="border-t border-white/[0.04]">
                <td colSpan={7} className="h-[45px] px-4 py-3">
                  <div className="h-px w-full bg-white/[0.035]" />
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      <div className={`${panel} p-4 xl:sticky xl:top-3 xl:self-start`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Kết quả đánh giá chi tiết</h2>
            <p className="mt-1 text-xs text-slate-500">{selected ? `${selected.code} · ${selected.name}` : 'Chọn nhà cung cấp để xem điểm'}</p>
          </div>
          {selected ? <button onClick={() => {
            const supplier = suppliers.find((item) => item.id === selected.id)
            if (supplier) onOpenSupplier(supplier)
          }} className="rounded border border-cyan-700 px-3 py-2 text-xs text-cyan-200">Mở hồ sơ</button> : null}
        </div>
        {selected ? <div className="mt-4 grid gap-4 lg:grid-cols-[180px_1fr]">
          <div className="flex aspect-square flex-col items-center justify-center rounded-full border-[18px] border-emerald-500 bg-slate-950 text-center">
            <div className="text-3xl font-semibold text-white">{fmt(selected.overall)}</div>
            <div className="mt-1 text-xs text-slate-400">/ 5</div>
            <div className="mt-2 text-amber-300">{Stars(selected.overall)}</div>
            <ClassificationBadge value={selected.classification} />
          </div>
          <div className="space-y-3 text-sm">
            {[
              ['Chất lượng sản phẩm', selected.quality, '30%'],
              ['Giá cả', selected.pricing, '20%'],
              ['Tiến độ giao hàng', selected.delivery, '20%'],
              ['Dịch vụ & Hỗ trợ', selected.delivery, '15%'],
              ['Năng lực & Uy tín', selected.quality, '15%'],
            ].map(([label, score, weight]) => <div key={String(label)} className="grid grid-cols-[1fr_70px_70px] items-center gap-3 rounded border border-slate-800 px-3 py-2 text-xs">
              <span className="text-slate-300">{label}</span>
              <span className="text-slate-400">{weight}</span>
              <b className="text-right text-cyan-300">{fmt(Number(score))}</b>
            </div>)}
          </div>
        </div> : <EmptyState icon={Star} title="Chưa chọn nhà cung cấp" note="Chọn một dòng trong danh sách đánh giá để xem điểm chi tiết." />}
      </div>
    </div>

    <div className="grid gap-4 xl:grid-cols-3">
      <div className={`${panel} p-4`}>
        <h3 className="text-sm font-semibold text-slate-100">Xu hướng điểm đánh giá</h3>
        <div className="mt-4 flex h-48 items-end gap-3 border-b border-l border-slate-800 px-3 pb-3">
          {(data?.trend ?? []).map((point) => <div key={point.month} className="flex flex-1 flex-col items-center justify-end gap-2">
            <div className="w-full rounded-t bg-blue-500" style={{ height: `${Math.max(8, point.average / 5 * 100)}%` }} />
            <span className="text-[10px] text-slate-500">{point.month}</span>
          </div>)}
        </div>
      </div>
      <div className={`${panel} p-4`}>
        <h3 className="text-sm font-semibold text-slate-100">Phân loại nhà cung cấp</h3>
        <div className="mt-4 space-y-3">
          {distribution.map(([label, value, color]) => <div key={label} className="grid grid-cols-[92px_1fr_48px] items-center gap-3 text-xs">
            <span className="text-slate-300">{label}</span>
            <div className="h-2 rounded bg-slate-800"><div className={`h-full rounded ${color}`} style={{ width: `${value / totalClassified * 100}%` }} /></div>
            <span className="text-right text-slate-400">{value}</span>
          </div>)}
        </div>
      </div>
      <div className={`${panel} p-4`}>
        <h3 className="text-sm font-semibold text-slate-100">Lịch sử đánh giá gần nhất</h3>
        <div className="mt-3 space-y-2">
          {(data?.recent ?? []).map((row) => <div key={row.id} className="grid grid-cols-[1fr_70px] gap-3 rounded border border-slate-800 px-3 py-2 text-xs">
            <span><b className="text-cyan-300">{row.code}</b><span className="mt-1 block truncate text-slate-400">{row.name}</span></span>
            <span className="text-right text-emerald-300">{fmt(row.overall)}</span>
          </div>)}
          {!data?.recent?.length ? <p className="rounded border border-slate-800 p-3 text-xs text-slate-500">Chưa có lịch sử đánh giá.</p> : null}
        </div>
      </div>
    </div>
  </div>
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

function SupplierInsightEmptyCard({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return <div className="rounded border border-slate-800 bg-slate-950/60 p-3">
    <Icon size={16} className="text-cyan-300" />
    <div className="mt-2 text-slate-300">{label}</div>
    <div className="mt-1 text-[10px] text-slate-600">Chưa có dữ liệu thật</div>
  </div>
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
