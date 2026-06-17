import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { ModuleDetailDrawer, ModuleEmptyState, ModuleLoadingState, ModulePageHeader } from '../../../../shared/ui/modules'
import { useInventoryAudit } from '../../../inventory/hooks/useInventoryAudit'
import { useProductionBoms, useProductionOrders } from '../../../production/hooks/useProductionCockpit'
import { useYardSlotsRuntime } from '../../../yard/hooks/queries/useYardRuntime'
import { useComponents } from '../../hooks/queries/useComponents'
import { formatCurrencyVnd, formatQuantity } from '@/shared/utils/number-format'
import {
  ComponentsDonut,
  ComponentsFilterBar,
  ComponentsKpiCard,
  ComponentsPanel,
  componentsInput,
  componentsMutedButton,
  componentsPrimaryButton,
  componentsTableHead,
  componentsTableRow,
  componentsTableShell,
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
  const [selectedRow, setSelectedRow] = useState<any | null>(null)

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
  const lifecycleCounts = useMemo(() => ({
    total: components.length,
    ready: components.filter((row) => row.status === 'READY').length,
    shipped: components.filter((row) => row.status === 'SHIPPED').length,
    delivered: components.filter((row) => row.status === 'DELIVERED').length,
    installed: components.filter((row) => row.status === 'INSTALLED').length,
  }), [components])

  return (
    <EnterpriseModulePage>
      <div className="space-y-4">
        <ModulePageHeader
          eyebrow="Component stock control"
          title="Tồn kho cấu kiện"
          description="Chuẩn Inventory cockpit cho cấu kiện đang ở bãi và trạng thái lifecycle."
        />

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
          <ComponentsKpiCard title="Tổng cấu kiện" value={formatQuantity(lifecycleCounts.total, 0)} tone="blue" active={!statusFilter} onClick={() => setStatusFilter('')} />
          <ComponentsKpiCard title="READY" value={formatQuantity(lifecycleCounts.ready, 0)} tone="emerald" active={statusFilter === 'READY'} onClick={() => setStatusFilter('READY')} />
          <ComponentsKpiCard title="SHIPPED" value={formatQuantity(lifecycleCounts.shipped, 0)} tone="cyan" active={statusFilter === 'SHIPPED'} onClick={() => setStatusFilter('SHIPPED')} />
          <ComponentsKpiCard title="DELIVERED" value={formatQuantity(lifecycleCounts.delivered, 0)} tone="purple" active={statusFilter === 'DELIVERED'} onClick={() => setStatusFilter('DELIVERED')} />
          <ComponentsKpiCard title="INSTALLED" value={formatQuantity(lifecycleCounts.installed, 0)} tone="amber" active={statusFilter === 'INSTALLED'} onClick={() => setStatusFilter('INSTALLED')} />
        </div>

        <ComponentsFilterBar>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã, tên cấu kiện, zone, slot..." className={`${componentsInput} xl:col-span-6`} />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={`${componentsInput} xl:col-span-2`}>
            <option value="">Trạng thái: Tất cả</option>
            <option value="READY">READY</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="INSTALLED">INSTALLED</option>
          </select>
        </ComponentsFilterBar>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
          <ComponentsPanel title={`Danh sách tồn kho cấu kiện (${filtered.length})`}>
            <div className={componentsTableShell}>
              <div className="overflow-auto">
                <table className="w-full min-w-[980px] text-sm">
                  <thead className={componentsTableHead}>
                    <tr>
                      {['Mã cấu kiện', 'Tên', 'Dự án', 'Zone/kho', 'Vị trí', 'Trọng lượng', 'Trạng thái', 'Ngày tạo'].map((heading) => (
                        <th key={heading} className="px-2 py-2 text-left font-medium">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={8} className="px-2 py-6"><ModuleLoadingState label="Đang tải tồn kho cấu kiện..." /></td></tr>
                    ) : filtered.map((row) => (
                      <tr key={row.id} onClick={() => setSelectedRow(row)} className={`cursor-pointer ${componentsTableRow}`}>
                        <td className="px-2 py-2 text-cyan-300">{row.code}</td>
                        <td className="px-2 py-2">{row.name}</td>
                        <td className="px-2 py-2">{row.project}</td>
                        <td className="px-2 py-2">{row.zone}</td>
                        <td className="px-2 py-2">{row.slot}</td>
                        <td className="px-2 py-2">{formatQuantity(row.weight ?? 0, 2)}</td>
                        <td className="px-2 py-2">{row.status}</td>
                        <td className="px-2 py-2">{row.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!isLoading && !filtered.length ? <div className="p-3"><ModuleEmptyState title="Không tìm thấy cấu kiện" description="Thử đổi từ khóa hoặc trạng thái lọc." /></div> : null}
            </div>
          </ComponentsPanel>
          <div className="space-y-4">
            <ComponentsPanel title="Phân bổ tồn kho">
              <ComponentsDonut
                centerValue={formatQuantity(rows.length, 0)}
                centerLabel="cấu kiện"
                segments={[
                  { label: 'Đang ở bãi', value: inYard, color: '#14c987' },
                  { label: 'Chờ nhập bãi', value: ready, color: '#f59e0b' },
                  { label: 'Khác', value: Math.max(0, components.length - inYard - ready), color: '#1d7cff' },
                ]}
              />
            </ComponentsPanel>
            <ComponentsPanel title="Trạng thái bãi">
              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex justify-between"><span>Cấu kiện có vị trí bãi</span><b className="text-emerald-300">{inYard}</b></div>
                <div className="flex justify-between"><span>READY chưa vào bãi</span><b className="text-amber-300">{ready}</b></div>
                <div className="flex justify-between"><span>Trọng lượng đang lưu</span><b className="text-cyan-300">{formatQuantity(totalWeight, 1)} tấn</b></div>
              </div>
            </ComponentsPanel>
          </div>
        </div>
      </div>

      <ModuleDetailDrawer
        open={Boolean(selectedRow)}
        title={selectedRow ? `${selectedRow.code} · ${selectedRow.name}` : ''}
        subtitle={selectedRow ? `${selectedRow.zone} / ${selectedRow.slot}` : undefined}
        onClose={() => setSelectedRow(null)}
        widthClass="max-w-4xl"
      >
        {selectedRow ? (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <ComponentsKpiCard title="Ngày tạo" value={selectedRow.createdAt} />
              <ComponentsKpiCard title="Vị trí" value={selectedRow.slot} />
              <ComponentsKpiCard title="Đơn giá" value={formatCurrencyVnd(selectedRow.unitPrice)} />
              <ComponentsKpiCard title="Tổng tiền" value={formatCurrencyVnd(selectedRow.totalAmount)} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => {
                window.sessionStorage.setItem('yard-focus-component-id', selectedRow.id)
                navigate('/yard#map-2d')
              }} className={componentsPrimaryButton}>Xem vị trí trong bãi</button>
            </div>
          </>
        ) : null}
      </ModuleDetailDrawer>
    </EnterpriseModulePage>
  )
}
