import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Layers, Package, Truck, Wrench } from 'lucide-react'

import { EnterpriseModulePage } from '@/shared/runtime-tabs/EnterpriseModulePage'
import { ModuleDetailDrawer, ModuleEmptyState, ModuleLoadingState } from '../../../../shared/ui/modules'
import { CockpitKpiCard, EnterpriseKpiCard } from '../../../../shared/ui/cockpit'
import {
  InventoryChartCard,
  InventoryPagination,
  InventoryPanel,
  inventoryTableHead,
  inventoryTableRow,
} from '../../../inventory/components/InventoryVisuals'
import { useInventoryAudit } from '../../../inventory/hooks/useInventoryAudit'
import { useProductionBoms, useProductionOrders } from '../../../production/hooks/useProductionCockpit'
import { useYardSlotsRuntime } from '../../../yard/hooks/queries/useYardRuntime'
import { useComponents } from '../../hooks/queries/useComponents'
import { formatCurrencyVnd, formatQuantity } from '@/shared/utils/number-format'
import {
  ComponentsDonut,
  componentsInput,
  componentsPrimaryButton,
} from './ComponentsCockpitShared'

const statusBadgeTone: Record<string, string> = {
  READY: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  SHIPPED: 'border-purple-400/30 bg-purple-400/10 text-purple-300',
  DELIVERED: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300',
  INSTALLED: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
}

export function ComponentsStockPage() {
  const navigate = useNavigate()
  const { data: components = [], isLoading } = useComponents()
  const { data: slots = [] } = useYardSlotsRuntime()
  const { data: orders = [] } = useProductionOrders()
  const { data: boms = [] } = useProductionBoms()
  const { data: auditRows = [] } = useInventoryAudit()
  const [query, setQuery] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedRow, setSelectedRow] = useState<any | null>(null)
  const [expandedModalOpen, setExpandedModalOpen] = useState(false)

  function applySearch() {
    setQuery(searchDraft)
    setPage(1)
  }

  function resetFilters() {
    setSearchDraft('')
    setQuery('')
    setStatusFilter('')
    setPage(1)
  }

  useEffect(() => {
    setPage(1)
  }, [query, statusFilter])

  const yardByComponentId = useMemo(() => {
    const map = new Map<string, { zone: string; slot: string; level: number; weight?: number }>()
    slots.forEach((slot) => {
      slot.placements.forEach((placement) => {
        if (!placement.itemId) return
        map.set(placement.itemId, {
          zone: `${slot.zone.code} - ${slot.zone.name}`,
          slot: slot.code,
          level: placement.stackLevel,
          weight: placement.weight,
        })
      })
    })
    return map
  }, [slots])

  const costByComponentCode = useMemo(() => {
    const costByMaterial = new Map((auditRows as any[]).map((row) => [String(row.materialCode), Number(row.averageCost ?? 0)]))
    const map = new Map<string, number>()
    boms.forEach((bom) => {
      const materialCost = bom.items.reduce((sum, item) => {
        const unitCost = costByMaterial.get(item.material.code) ?? 0
        return sum + item.quantity * (1 + item.wastePercent / 100) * unitCost
      }, 0)
      map.set(bom.productCode, materialCost + Number(bom.estimatedWeight ?? 0) * 0)
    })
    return map
  }, [auditRows, boms])

  const completedComponentIds = useMemo(() => new Set(
    orders.filter((order) => order.status === 'COMPLETED').map((order) => {
      const runtimeOrder = order as typeof order & { componentId?: string }
      return order.component?.id ?? runtimeOrder.componentId
    }).filter(Boolean),
  ), [orders])

  const rows = useMemo(() => {
    return components.flatMap((component) => {
      const yard = yardByComponentId.get(component.id)
      if (!yard || !completedComponentIds.has(component.id)) return []
      const unitPrice = costByComponentCode.get(component.code) ?? 0
      return {
        id: component.id,
        code: component.code,
        name: component.name,
        status: component.status,
        project: component.project?.code ?? component.project?.name ?? '-',
        zone: yard?.zone ?? component.zone ?? 'Kho cấu kiện',
        slot: yard ? `${yard.slot} / L${yard.level}` : component.position ?? '-',
        weight: yard?.weight ?? 0,
        unitPrice,
        totalAmount: unitPrice,
        createdAt: component.createdAt ? new Date(component.createdAt).toLocaleDateString('vi-VN') : '-',
      }
    })
  }, [components, costByComponentCode, completedComponentIds, yardByComponentId])

  const filtered = rows.filter((row) => {
    if (statusFilter && row.status !== statusFilter) return false
    return `${row.code} ${row.name} ${row.zone} ${row.slot}`.toLowerCase().includes(query.toLowerCase())
  })
  const inYard = rows.filter((row) => yardByComponentId.has(row.id)).length
  const ready = components.filter((row) => row.status === 'READY' && !yardByComponentId.has(row.id)).length
  const totalWeight = rows.reduce((sum, row) => sum + Number(row.weight ?? 0), 0)
  const pageSize = 14
  const paginatedRows = filtered.slice((page - 1) * pageSize, page * pageSize)
  const lifecycleCounts = useMemo(() => ({
    total: components.length,
    ready: components.filter((row) => row.status === 'READY').length,
    shipped: components.filter((row) => row.status === 'SHIPPED').length,
    delivered: components.filter((row) => row.status === 'DELIVERED').length,
    installed: components.filter((row) => row.status === 'INSTALLED').length,
  }), [components])

  return (
    <EnterpriseModulePage>
      <div className="w-full min-w-0 flex-1 space-y-1 -mt-2">
        <div className="grid grid-cols-1 gap-1 md:grid-cols-5">
          <EnterpriseKpiCard
            title="Tổng cấu kiện"
            value={formatQuantity(lifecycleCounts.total, 0)}
            tone="blue"
            icon={<Layers size={15} />}
            isLoading={isLoading}
            onClick={() => setStatusFilter('')}
          />
          <EnterpriseKpiCard
            title="READY"
            value={formatQuantity(lifecycleCounts.ready, 0)}
            tone="emerald"
            icon={<CheckCircle2 size={15} />}
            isLoading={isLoading}
            onClick={() => setStatusFilter('READY')}
          />
          <EnterpriseKpiCard
            title="SHIPPED"
            value={formatQuantity(lifecycleCounts.shipped, 0)}
            tone="purple"
            icon={<Truck size={15} />}
            isLoading={isLoading}
            onClick={() => setStatusFilter('SHIPPED')}
          />
          <EnterpriseKpiCard
            title="DELIVERED"
            value={formatQuantity(lifecycleCounts.delivered, 0)}
            tone="cyan"
            icon={<Package size={15} />}
            isLoading={isLoading}
            onClick={() => setStatusFilter('DELIVERED')}
          />
          <EnterpriseKpiCard
            title="INSTALLED"
            value={formatQuantity(lifecycleCounts.installed, 0)}
            tone="amber"
            icon={<Wrench size={15} />}
            isLoading={isLoading}
            onClick={() => setStatusFilter('INSTALLED')}
          />
        </div>

        <InventoryPanel className="rounded-xl -mt-1">
          <div className="grid grid-cols-1 gap-1 xl:grid-cols-[1fr_220px_130px_120px]">
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearch()
              }}
              placeholder="Tìm mã, tên cấu kiện, zone, slot..."
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-[#08111f]"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="h-9 w-full rounded-lg border border-white/10 bg-[#08111f]/90 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:bg-[#08111f]"
            >
              <option value="">Trạng thái: Tất cả</option>
              <option value="READY">READY</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="INSTALLED">INSTALLED</option>
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
                  <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">Danh sách tồn kho cấu kiện</h3>
                  <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-400/20">
                    {filtered.length} cấu kiện
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

              <div className="h-[430px] overflow-auto scrollbar-none rounded-lg border border-white/10">
                <table className="w-full min-w-[980px] table-fixed text-sm">
                  <thead
                    className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                    style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                  >
                    <tr>
                      {['Mã cấu kiện', 'Tên', 'Dự án', 'Zone/kho', 'Vị trí', 'Trọng lượng', 'Trạng thái', 'Ngày tạo'].map((heading) => (
                        <th key={heading} className="px-3 py-2 text-left text-xs font-semibold text-slate-300">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={8} className="px-4 py-6 text-center"><ModuleLoadingState label="Đang tải tồn kho cấu kiện..." /></td></tr>
                    ) : paginatedRows.map((row) => (
                      <tr key={row.id} onClick={() => setSelectedRow(row)} className={`cursor-pointer ${inventoryTableRow}`}>
                        <td className="truncate px-3 py-1.5 text-cyan-300 font-mono font-medium">{row.code}</td>
                        <td className="truncate px-3 py-1.5 text-white font-medium">{row.name}</td>
                        <td className="truncate px-3 py-1.5 text-slate-300">{row.project}</td>
                        <td className="truncate px-3 py-1.5 text-slate-300">{row.zone}</td>
                        <td className="truncate px-3 py-1.5 text-slate-300">{row.slot}</td>
                        <td className="px-3 py-1.5 font-mono tabular-nums text-cyan-300">{formatQuantity(row.weight ?? 0, 2)}</td>
                        <td className="px-3 py-1.5">
                          <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs ${statusBadgeTone[row.status] ?? 'border-slate-400/20 bg-slate-400/10 text-slate-300'}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-slate-300">{row.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!isLoading && !filtered.length ? <div className="p-3"><ModuleEmptyState icon={<Package size={18} />} title="Chưa có dữ liệu cấu kiện" description="Thử đổi từ khóa hoặc trạng thái lọc." /></div> : null}
              <InventoryPagination page={page} pageSize={pageSize} pageCount={Math.max(1, Math.ceil(filtered.length / pageSize))} total={filtered.length} onPageChange={setPage} containerClassName="border-t-0" />
            </InventoryPanel>
          </div>

          <div className="col-span-12 space-y-1 xl:col-span-3">
            <InventoryChartCard title="Thông số tồn kho" className="h-[170px]">
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center justify-between"><span>Cấu kiện có vị trí bãi</span><b className="font-mono text-emerald-300">{inYard}</b></div>
                <div className="flex items-center justify-between"><span>Trọng lượng đang lưu</span><b className="font-mono text-cyan-300">{formatQuantity(totalWeight, 1)} tấn</b></div>
                <div className="flex items-center justify-between"><span>Tổng cấu kiện</span><b className="font-mono text-white">{formatQuantity(components.length, 0)}</b></div>
              </div>
            </InventoryChartCard>
            <InventoryChartCard title="Phân bố vị trí" className="h-[170px]">
              <ComponentsDonut
                centerValue={formatQuantity(rows.length, 0)}
                centerLabel="cấu kiện"
                segments={[
                  { label: 'Đang ở bãi', value: inYard, color: '#14c987' },
                  { label: 'Chờ nhập bãi', value: ready, color: '#f59e0b' },
                  { label: 'Khác', value: Math.max(0, components.length - inYard - ready), color: '#1d7cff' },
                ]}
              />
            </InventoryChartCard>
            <InventoryChartCard title="Cảnh báo bãi" className="h-[170px]">
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center justify-between"><span>READY chưa vào bãi</span><b className="font-mono text-amber-300">{ready}</b></div>
                <div className="flex items-center justify-between"><span>Chưa có vị trí bãi</span><b className="font-mono text-red-300">{Math.max(0, components.length - inYard)}</b></div>
                {!components.length ? <ModuleEmptyState icon={<AlertTriangle size={18} />} title="Chưa có cảnh báo" description="Cảnh báo tồn kho cấu kiện sẽ hiển thị tại đây." /> : null}
              </div>
            </InventoryChartCard>
          </div>
        </div>
      </div>

      {expandedModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-7xl rounded-2xl border border-white/15 bg-[#08111f] p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Toàn bộ tồn kho cấu kiện thành phẩm</h2>
                <p className="text-xs text-slate-400">Tổng cộng {filtered.length} cấu kiện thành phẩm trong bãi/kho</p>
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
              <table className="w-full min-w-[1200px] text-xs table-fixed border-collapse">
                <thead
                  className={`${inventoryTableHead} text-slate-300 border-b border-cyan-400/10 sticky top-0 z-10`}
                  style={{ backgroundColor: 'rgba(30, 41, 59, 1)' }}
                >
                  <tr>
                    {['Mã cấu kiện', 'Tên', 'Dự án', 'Zone/kho', 'Vị trí', 'Trọng lượng', 'Trạng thái', 'Ngày tạo'].map((heading) => (
                      <th key={heading} className="px-3 py-2 text-left font-semibold text-slate-300">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => {
                        setSelectedRow(row)
                        setExpandedModalOpen(false)
                      }}
                      className={`${inventoryTableRow} cursor-pointer`}
                    >
                      <td className="truncate px-3 py-2 text-cyan-300 font-mono font-medium">{row.code}</td>
                      <td className="truncate px-3 py-2 text-white font-medium">{row.name}</td>
                      <td className="truncate px-3 py-2 text-slate-300">{row.project}</td>
                      <td className="truncate px-3 py-2 text-slate-300">{row.zone}</td>
                      <td className="truncate px-3 py-2 text-slate-300">{row.slot}</td>
                      <td className="px-3 py-2 font-mono tabular-nums text-cyan-300">{formatQuantity(row.weight ?? 0, 2)}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs ${statusBadgeTone[row.status] ?? 'border-slate-400/20 bg-slate-400/10 text-slate-300'}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-300">{row.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <InventoryPagination
              page={page}
              pageSize={pageSize}
              pageCount={Math.max(1, Math.ceil(filtered.length / pageSize))}
              total={filtered.length}
              onPageChange={setPage}
              containerClassName="border-t-0"
            />
          </div>
        </div>
      ) : null}

      <ModuleDetailDrawer
        open={Boolean(selectedRow)}
        title={selectedRow ? `${selectedRow.code} · ${selectedRow.name}` : ''}
        subtitle={selectedRow ? `${selectedRow.zone} / ${selectedRow.slot}` : undefined}
        onClose={() => setSelectedRow(null)}
      >
        {selectedRow ? (
          <>
            <div className="grid grid-cols-2 gap-1 md:grid-cols-4">
              <CockpitKpiCard title="Ngày tạo" value={selectedRow.createdAt} state="normal" tone="blue" />
              <CockpitKpiCard title="Vị trí" value={selectedRow.slot} state="normal" tone="cyan" />
              <CockpitKpiCard title="Đơn giá" value={formatCurrencyVnd(selectedRow.unitPrice)} state="normal" tone="emerald" />
              <CockpitKpiCard title="Tổng tiền" value={formatCurrencyVnd(selectedRow.totalAmount)} state="normal" tone="amber" />
            </div>
            <div className="mt-2 flex justify-end gap-1 border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={() => {
                  window.sessionStorage.setItem('yard-focus-component-id', selectedRow.id)
                  navigate('/yard#map-2d')
                }}
                className={componentsPrimaryButton}
              >
                Xem vị trí trong bãi
              </button>
            </div>
          </>
        ) : null}
      </ModuleDetailDrawer>
    </EnterpriseModulePage>
  )
}
