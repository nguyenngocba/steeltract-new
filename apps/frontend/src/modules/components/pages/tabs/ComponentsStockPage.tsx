import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { EnterpriseTabBar } from '../../../../shared/runtime-tabs/EnterpriseTabBar'
import { SectionHeader } from '../../../../shared/ui/enterprise'
import { useInventoryAudit } from '../../../inventory/hooks/useInventoryAudit'
import { useProductionBoms, useProductionOrders } from '../../../production/hooks/useProductionCockpit'
import { useYardSlotsRuntime } from '../../../yard/hooks/queries/useYardRuntime'
import { componentsTabs } from '../../config/components-tabs'
import { useComponents } from '../../hooks/queries/useComponents'
import { ComponentsFilterBar, ComponentsKpiCard, ComponentsPanel } from './ComponentsCockpitShared'

export function ComponentsStockPage() {
  const navigate = useNavigate()
  const { data: components = [], isLoading } = useComponents()
  const { data: slots = [] } = useYardSlotsRuntime()
  const { data: orders = [] } = useProductionOrders()
  const { data: boms = [] } = useProductionBoms()
  const { data: auditRows = [] } = useInventoryAudit()
  const [query, setQuery] = useState('')
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
    if (!query.trim()) return true
    return `${row.code} ${row.name} ${row.zone} ${row.slot}`.toLowerCase().includes(query.toLowerCase())
  })
  const inYard = rows.filter((row) => yardByComponentId.has(row.id)).length
  const ready = components.filter((row) => row.status === 'READY' && !yardByComponentId.has(row.id)).length
  const totalWeight = rows.reduce((sum, row) => sum + Number(row.weight ?? 0), 0)

  return (
    <EnterpriseModulePage>
      <SectionHeader title="Cấu kiện > Tồn kho cấu kiện" description="Tồn kho cấu kiện đồng bộ với vị trí thực tế trong bãi tập kết." />
      <EnterpriseTabBar tabs={componentsTabs} />

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
          <ComponentsKpiCard title="Tổng cấu kiện" value={rows.length.toLocaleString('vi-VN')} />
          <ComponentsKpiCard title="Đang ở bãi" value={inYard.toLocaleString('vi-VN')} />
          <ComponentsKpiCard title="READY chờ nhập bãi" value={ready.toLocaleString('vi-VN')} />
          <ComponentsKpiCard title="Tổng trọng lượng bãi" value={`${totalWeight.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tấn`} />
          <ComponentsKpiCard title="Nguồn dữ liệu" value="LIVE" sub="Components + Yard placements" />
        </div>

        <ComponentsFilterBar>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã, tên cấu kiện, zone, slot..." className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 xl:col-span-6" />
        </ComponentsFilterBar>

        <ComponentsPanel title={`Danh sách tồn kho cấu kiện (${filtered.length})`}>
          <div className="overflow-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  {['Mã cấu kiện', 'Tên', 'Dự án', 'Zone/kho', 'Vị trí', 'Trọng lượng', 'Trạng thái', 'Ngày tạo'].map((heading) => (
                    <th key={heading} className="px-2 py-2 text-left font-medium">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} className="px-2 py-6 text-center text-slate-400">Đang tải tồn kho cấu kiện...</td></tr>
                ) : filtered.map((row) => (
                  <tr key={row.id} onClick={() => setSelectedRow(row)} className="cursor-pointer border-t border-slate-800/80 text-slate-200 hover:bg-slate-900/40">
                    <td className="px-2 py-2 text-cyan-300">{row.code}</td>
                    <td className="px-2 py-2">{row.name}</td>
                    <td className="px-2 py-2">{row.project}</td>
                    <td className="px-2 py-2">{row.zone}</td>
                    <td className="px-2 py-2">{row.slot}</td>
                    <td className="px-2 py-2">{Number(row.weight ?? 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}</td>
                    <td className="px-2 py-2">{row.status}</td>
                    <td className="px-2 py-2">{row.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ComponentsPanel>
      </div>

      {selectedRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-4xl rounded-xl border border-slate-700 bg-[#071323] p-5">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-cyan-400">Chi tiết cấu kiện trong bãi</div>
                <h3 className="mt-1 text-xl font-semibold text-white">{selectedRow.code} · {selectedRow.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{selectedRow.zone} / {selectedRow.slot}</p>
              </div>
              <button onClick={() => setSelectedRow(null)} className="rounded border border-slate-700 px-3 py-1 text-sm text-slate-300">Đóng</button>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <ComponentsKpiCard title="Ngày tạo" value={selectedRow.createdAt} />
              <ComponentsKpiCard title="Vị trí" value={selectedRow.slot} />
              <ComponentsKpiCard title="Đơn giá" value={`${Math.round(selectedRow.unitPrice).toLocaleString('vi-VN')} đ`} />
              <ComponentsKpiCard title="Tổng tiền" value={`${Math.round(selectedRow.totalAmount).toLocaleString('vi-VN')} đ`} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => {
                window.sessionStorage.setItem('yard-focus-component-id', selectedRow.id)
                navigate('/yard#map-2d')
              }} className="rounded bg-cyan-600 px-4 py-2 text-sm font-medium text-white">Xem vị trí trong bãi</button>
            </div>
          </div>
        </div>
      ) : null}
    </EnterpriseModulePage>
  )
}
