import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Package } from 'lucide-react'

import { ComponentsWorkspace } from '../../components/ComponentsWorkspace'
import { ModuleDetailDrawer, ModuleEmptyState, ModuleFilterBar, ModuleLoadingState } from '../../../../shared/ui/modules'
import { CockpitChartCard, CockpitKpiCard, CockpitTableShell, COCKPIT_HEIGHTS, DataTablePagination } from '../../../../shared/ui/cockpit'
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

export function ComponentsStockPage() {
  const navigate = useNavigate()
  const { data: components = [], isLoading } = useComponents()
  const { data: slots = [] } = useYardSlotsRuntime()
  const { data: orders = [] } = useProductionOrders()
  const { data: boms = [] } = useProductionBoms()
  const { data: auditRows = [] } = useInventoryAudit()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedRow, setSelectedRow] = useState<any | null>(null)

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
    if (!query.trim()) return true
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
    <ComponentsWorkspace>
      <div className="w-full min-w-0 flex-1 space-y-1">
        <div className="grid grid-cols-1 gap-1 md:grid-cols-5">
          <CockpitKpiCard title="Tổng cấu kiện" value={formatQuantity(lifecycleCounts.total, 0)} note="Tất cả lifecycle" tone="blue" state="normal" onClick={() => setStatusFilter('')} trendData={[1, 2, 3, 5, lifecycleCounts.total]} />
          <CockpitKpiCard title="READY" value={formatQuantity(lifecycleCounts.ready, 0)} note="Sẵn sàng" tone="emerald" state="normal" onClick={() => setStatusFilter('READY')} trendData={[1, 2, 3, 4, lifecycleCounts.ready]} />
          <CockpitKpiCard title="SHIPPED" value={formatQuantity(lifecycleCounts.shipped, 0)} note="Đã xuất bãi" tone="cyan" state="normal" onClick={() => setStatusFilter('SHIPPED')} trendData={[0, 1, 2, 3, lifecycleCounts.shipped]} />
          <CockpitKpiCard title="DELIVERED" value={formatQuantity(lifecycleCounts.delivered, 0)} note="Đã nhận" tone="purple" state="normal" onClick={() => setStatusFilter('DELIVERED')} trendData={[0, 1, 1, 2, lifecycleCounts.delivered]} />
          <CockpitKpiCard title="INSTALLED" value={formatQuantity(lifecycleCounts.installed, 0)} note="Đã lắp đặt" tone="amber" state="normal" onClick={() => setStatusFilter('INSTALLED')} trendData={[0, 0, 1, 1, lifecycleCounts.installed]} />
        </div>

        <ModuleFilterBar>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã, tên cấu kiện, zone, slot..." className={`${componentsInput} xl:col-span-6`} />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={`${componentsInput} xl:col-span-2`}>
            <option value="">Trạng thái: Tất cả</option>
            <option value="READY">READY</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="INSTALLED">INSTALLED</option>
          </select>
        </ModuleFilterBar>

        <div className="grid grid-cols-12 gap-1">
          <div className="col-span-12 xl:col-span-9">
            <CockpitChartCard title={`Danh sách tồn kho cấu kiện (${filtered.length})`} className={COCKPIT_HEIGHTS.TABLE_MD}>
              <CockpitTableShell className="h-full">
                <table className="w-full min-w-[980px] table-fixed text-[13px]">
                  <thead className="border-b border-cyan-400/10 bg-transparent text-slate-355">
                    <tr>
                      {['Mã cấu kiện', 'Tên', 'Dự án', 'Zone/kho', 'Vị trí', 'Trọng lượng', 'Trạng thái', 'Ngày tạo'].map((heading) => (
                        <th key={heading} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-300 border-b border-cyan-400/10">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={8} className="px-4 py-6"><ModuleLoadingState label="Đang tải tồn kho cấu kiện..." /></td></tr>
                    ) : paginatedRows.map((row) => (
                      <tr key={row.id} onClick={() => setSelectedRow(row)} className="cursor-pointer border-b border-white/[0.04] text-slate-200 transition hover:bg-cyan-400/[0.04]">
                        <td className="truncate px-4 py-2.5 text-cyan-300 font-mono">{row.code}</td>
                        <td className="truncate px-4 py-2.5 text-white">{row.name}</td>
                        <td className="truncate px-4 py-2.5 text-slate-300">{row.project}</td>
                        <td className="truncate px-4 py-2.5 text-slate-300">{row.zone}</td>
                        <td className="truncate px-4 py-2.5 text-slate-300">{row.slot}</td>
                        <td className="px-4 py-2.5 font-mono tabular-nums text-cyan-300">{formatQuantity(row.weight ?? 0, 2)}</td>
                        <td className="px-4 py-2.5 text-slate-300">{row.status}</td>
                        <td className="px-4 py-2.5 text-slate-300">{row.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CockpitTableShell>
              {!isLoading && !filtered.length ? <div className="p-3"><ModuleEmptyState icon={<Package size={18} />} title="Chưa có dữ liệu cấu kiện" description="Thử đổi từ khóa hoặc trạng thái lọc." /></div> : null}
            </CockpitChartCard>
            <DataTablePagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
          </div>
          <div className="col-span-12 space-y-1 xl:col-span-3">
            <CockpitChartCard title="Giá trị tồn" className={COCKPIT_HEIGHTS.CHART_SM}>
              <div className="space-y-1 text-xs text-slate-300">
                <div className="flex justify-between"><span>Cấu kiện có vị trí bãi</span><b className="text-emerald-300">{inYard}</b></div>
                <div className="flex justify-between"><span>Trọng lượng đang lưu</span><b className="text-cyan-300">{formatQuantity(totalWeight, 1)} tấn</b></div>
                <div className="flex justify-between"><span>Tổng cấu kiện</span><b className="text-white">{formatQuantity(components.length, 0)}</b></div>
              </div>
            </CockpitChartCard>
            <CockpitChartCard title="Theo trạng thái" className={COCKPIT_HEIGHTS.CHART_SM}>
              <ComponentsDonut
                centerValue={formatQuantity(rows.length, 0)}
                centerLabel="cấu kiện"
                segments={[
                  { label: 'Đang ở bãi', value: inYard, color: '#14c987' },
                  { label: 'Chờ nhập bãi', value: ready, color: '#f59e0b' },
                  { label: 'Khác', value: Math.max(0, components.length - inYard - ready), color: '#1d7cff' },
                ]}
              />
            </CockpitChartCard>
            <CockpitChartCard title="Cảnh báo" className={COCKPIT_HEIGHTS.CHART_SM}>
              <div className="space-y-1 text-xs text-slate-300">
                <div className="flex justify-between"><span>READY chưa vào bãi</span><b className="text-amber-300">{ready}</b></div>
                <div className="flex justify-between"><span>Chưa có vị trí bãi</span><b className="text-red-300">{Math.max(0, components.length - inYard)}</b></div>
                {!components.length ? <ModuleEmptyState icon={<AlertTriangle size={18} />} title="Chưa có cảnh báo" description="Cảnh báo tồn kho cấu kiện sẽ hiển thị tại đây." /> : null}
              </div>
            </CockpitChartCard>
          </div>
        </div>
      </div>

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
            <div className="mt-1 flex justify-end gap-1">
              <button onClick={() => {
                window.sessionStorage.setItem('yard-focus-component-id', selectedRow.id)
                navigate('/yard#map-2d')
              }} className={componentsPrimaryButton}>Xem vị trí trong bãi</button>
            </div>
          </>
        ) : null}
      </ModuleDetailDrawer>
    </ComponentsWorkspace>
  )
}
