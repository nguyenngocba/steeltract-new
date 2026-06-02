import { useMemo, useState } from 'react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { EnterpriseTabBar } from '../../../../shared/runtime-tabs/EnterpriseTabBar'
import { SectionHeader } from '../../../../shared/ui/enterprise'
import { useInventoryAudit } from '../../../inventory/hooks/useInventoryAudit'
import { useInventoryItems } from '../../../inventory/hooks/useInventoryItems'
import { componentsTabs } from '../../config/components-tabs'
import { ComponentsFilterBar, ComponentsKpiCard, ComponentsPanel } from './ComponentsCockpitShared'

type MaterialStockRow = {
  id: string
  code: string
  name: string
  unit: string
  warehouse: string
  zone: string
  currentStock: number
  reserved: number
  available: number
  averageCost: number
  inventoryValue: number
  status: 'Sẵn sàng' | 'Cảnh báo' | 'Thiếu'
}

const money = (value: number) => `${Math.round(value).toLocaleString('vi-VN')} đ`

export function ComponentsMaterialStockPage() {
  const { data: inventoryItems = [], isLoading } = useInventoryItems()
  const { data: auditRows = [] } = useInventoryAudit()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')

  const rows = useMemo<MaterialStockRow[]>(() => {
    const auditById = new Map(
      (auditRows as any[]).map((row) => [String(row.materialId ?? row.inventoryItemId), row]),
    )

    return (inventoryItems as any[]).map((item) => {
      const audit = auditById.get(String(item.id))
      const currentStock = Number(audit?.currentStock ?? item.quantity ?? 0)
      const minimumStock = Number(item.minimumStock ?? 0)
      const averageCost = Number(audit?.averageCost ?? item.unitPrice ?? 0)
      const reserved = 0
      const available = Math.max(currentStock - reserved, 0)

      return {
        id: item.id,
        code: item.code,
        name: item.name,
        unit: item.unitMaster?.symbol ?? item.unit ?? '-',
        warehouse: item.zone?.warehouse?.name ?? item.warehouse ?? 'Kho vật tư SX',
        zone: item.zone?.name ?? item.zoneName ?? 'Khu SX mặc định',
        currentStock,
        reserved,
        available,
        averageCost,
        inventoryValue: Number(audit?.inventoryValue ?? currentStock * averageCost),
        status:
          available <= 0
            ? 'Thiếu'
            : minimumStock > 0 && available <= minimumStock
              ? 'Cảnh báo'
              : 'Sẵn sàng',
      }
    })
  }, [auditRows, inventoryItems])

  const filtered = rows.filter((row) => {
    if (status && row.status !== status) return false
    if (query && !`${row.code} ${row.name}`.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })
  const totalValue = rows.reduce((sum, row) => sum + row.inventoryValue, 0)
  const totalAvailable = rows.reduce((sum, row) => sum + row.available, 0)
  const totalReserved = rows.reduce((sum, row) => sum + row.reserved, 0)
  const warningCount = rows.filter((row) => row.status !== 'Sẵn sàng').length
  const topMaterials = [...rows].sort((a, b) => b.available - a.available).slice(0, 5)

  return (
    <EnterpriseModulePage>
      <SectionHeader
        title="Cấu kiện > Kho vật tư SX"
        description="Kho trung gian nhận vật tư từ kho chính trước khi cấp BOM để sản xuất cấu kiện."
      />
      <EnterpriseTabBar tabs={componentsTabs} />

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-6">
          <ComponentsKpiCard title="Tổng mã vật tư SX" value={rows.length.toLocaleString('vi-VN')} />
          <ComponentsKpiCard title="Giá trị tồn kho SX" value={money(totalValue)} sub="đồng bộ từ giao dịch kho" />
          <ComponentsKpiCard title="Đã reserve BOM" value={totalReserved.toLocaleString('vi-VN')} sub="chờ allocation backend" />
          <ComponentsKpiCard title="Khả dụng sản xuất" value={totalAvailable.toLocaleString('vi-VN')} />
          <ComponentsKpiCard title="Cảnh báo thiếu BOM" value={warningCount.toLocaleString('vi-VN')} sub="cần cấp phát" />
          <ComponentsKpiCard title="Trạng thái dữ liệu" value="LIVE" sub="làm mới mỗi 5 giây" />
        </div>

        <ComponentsFilterBar>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm vật tư theo mã, tên..."
            className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 xl:col-span-4"
          />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 xl:col-span-2">
            <option value="">Tất cả trạng thái</option>
            <option>Sẵn sàng</option>
            <option>Cảnh báo</option>
            <option>Thiếu</option>
          </select>
          <button onClick={() => { setQuery(''); setStatus('') }} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-200 xl:col-span-2">
            Làm mới
          </button>
        </ComponentsFilterBar>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-9">
            <ComponentsPanel title={`Danh sách vật tư cấp sản xuất (${filtered.length})`}>
              <div className="overflow-auto">
                <table className="w-full min-w-[1100px] text-sm">
                  <thead className="text-xs uppercase text-slate-400">
                    <tr>
                      {['Mã vật tư', 'Tên vật tư', 'ĐVT', 'Kho nguồn', 'Khu vực', 'Tồn hiện tại', 'Đã reserve BOM', 'Khả dụng', 'Giá TB', 'Tổng giá trị', 'Trạng thái'].map((heading) => (
                        <th key={heading} className="px-2 py-2 text-left font-medium">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={11} className="px-2 py-6 text-center text-slate-400">Đang tải tồn kho vật tư...</td></tr>
                    ) : filtered.map((row) => (
                      <tr key={row.id} className="border-t border-slate-800/80 text-slate-200 hover:bg-slate-900/40">
                        <td className="px-2 py-2 text-cyan-300">{row.code}</td>
                        <td className="px-2 py-2">{row.name}</td>
                        <td className="px-2 py-2">{row.unit}</td>
                        <td className="px-2 py-2">{row.warehouse}</td>
                        <td className="px-2 py-2">{row.zone}</td>
                        <td className="px-2 py-2">{row.currentStock.toLocaleString('vi-VN')}</td>
                        <td className="px-2 py-2">{row.reserved.toLocaleString('vi-VN')}</td>
                        <td className="px-2 py-2">{row.available.toLocaleString('vi-VN')}</td>
                        <td className="px-2 py-2">{money(row.averageCost)}</td>
                        <td className="px-2 py-2 text-cyan-300">{money(row.inventoryValue)}</td>
                        <td className="px-2 py-2">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-xs text-slate-400">Hiển thị 1 - {filtered.length} của {filtered.length} kết quả</div>
            </ComponentsPanel>
          </div>

          <div className="space-y-4 xl:col-span-3">
            <ComponentsPanel title="Luồng cấp phát">
              <div className="space-y-2 text-sm text-slate-300">
                <div>Kho chính → Kho vật tư SX</div>
                <div>Kho vật tư SX → BOM lệnh sản xuất</div>
                <div>Hoàn thành → Bãi tập kết / zone / slot / tầng</div>
              </div>
            </ComponentsPanel>
            <ComponentsPanel title="Top vật tư khả dụng">
              {topMaterials.map((row) => (
                <div key={row.id} className="mb-2 flex justify-between gap-2 text-sm text-slate-300">
                  <span>{row.code}</span>
                  <span className="text-cyan-300">{row.available.toLocaleString('vi-VN')} {row.unit}</span>
                </div>
              ))}
            </ComponentsPanel>
          </div>
        </div>
      </div>
    </EnterpriseModulePage>
  )
}
