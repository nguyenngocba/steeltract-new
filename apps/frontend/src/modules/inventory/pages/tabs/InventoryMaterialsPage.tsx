import { useMemo, useState } from 'react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { EnterpriseTabBar } from '../../../../shared/runtime-tabs/EnterpriseTabBar'
import { SectionHeader } from '../../../../shared/ui/enterprise'
import { inventoryTabs } from '../../config/inventory-tabs'
import { MaterialDrawer } from '../../components/material-table/MaterialDrawer'
import { DonutSummary, HorizontalBars, InventoryKpi, InventoryPanel, inventoryInput, MiniBars } from '../../components/InventoryVisuals'
import { useDeleteMaterial } from '../../hooks/useDeleteMaterial'
import { useInventoryAudit } from '../../hooks/useInventoryAudit'
import { useZones } from '../../hooks/useZones'

const PAGE_SIZE = 10

function money(value: number) {
  return value.toLocaleString('vi-VN') + ' đ'
}

export function InventoryMaterialsPage() {
  const { data: rows = [] } = useInventoryAudit()
  const { data: zones = [] } = useZones()
  const deleteMaterialMutation = useDeleteMaterial()

  const [open, setOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null)
  const [detailMaterial, setDetailMaterial] = useState<any | null>(null)
  const [search, setSearch] = useState('')
  const [zoneFilter, setZoneFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [showAll, setShowAll] = useState(false)

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((item: any) => {
      if (q) {
        const match =
          String(item.materialCode ?? '').toLowerCase().includes(q) ||
          String(item.materialName ?? '').toLowerCase().includes(q)
        if (!match) return false
      }

      if (zoneFilter) {
        const zone = String(item.zone ?? item.position ?? '')
        if (!zone.toLowerCase().includes(zoneFilter.toLowerCase())) return false
      }

      if (statusFilter) {
        const status = Number(item.currentStock ?? 0) <= 0
          ? 'OUT'
          : Number(item.currentStock ?? 0) <= 5
            ? 'LOW'
            : 'NORMAL'
        if (status !== statusFilter) return false
      }
      return true
    })
  }, [rows, search, zoneFilter, statusFilter])

  const kpis = useMemo(() => {
    const totalValue = filteredRows.reduce((acc: number, row: any) => acc + Number(row.inventoryValue ?? 0), 0)
    const totalQty = filteredRows.reduce((acc: number, row: any) => acc + Number(row.currentStock ?? 0), 0)
    const low = filteredRows.filter((row: any) => Number(row.currentStock ?? 0) > 0 && Number(row.currentStock ?? 0) <= 5).length
    const out = filteredRows.filter((row: any) => Number(row.currentStock ?? 0) <= 0).length
    return {
      totalValue,
      totalQty,
      totalCodes: filteredRows.length,
      low,
      out,
    }
  }, [filteredRows])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const activePage = Math.min(page, totalPages)
  const pagedRows = filteredRows.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE)

  async function handleDelete(id: string) {
    if (!window.confirm('Xóa vật tư này?')) return
    await deleteMaterialMutation.mutateAsync(id)
  }

  function openMaterial(item: any) {
    setDetailMaterial(item)
  }

  function editMaterial(item: any) {
    setSelectedMaterial({
      id: item.materialId ?? item.inventoryItemId ?? item.id,
      code: item.materialCode ?? item.code,
      name: item.materialName ?? item.name,
      unit: item.unit ?? item.unitCode ?? 'PCS',
      minimumStock: item.minimumStock ?? 0,
      categoryId: item.categoryId ?? '',
      description: item.description ?? '',
    })
    setOpen(true)
  }

  const zoneDistribution = useMemo<Array<[string, number]>>(() => {
    const map = new Map<string, number>()
    filteredRows.forEach((row: any) => {
      const key = String(row.zone ?? row.position ?? 'KHU MẶC ĐỊNH')
      map.set(key, (map.get(key) ?? 0) + Number(row.currentStock ?? 0))
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [filteredRows])

  const valueLeaders = useMemo<Array<[string, number]>>(() => {
    return filteredRows
      .map((row: any) => [String(row.materialCode ?? row.code ?? '-'), Number(row.inventoryValue ?? 0)] as [string, number])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
  }, [filteredRows])

  const healthBars = useMemo(() => {
    const normal = filteredRows.filter((row: any) => Number(row.currentStock ?? 0) > 5).length
    return [normal, kpis.low, kpis.out, Math.max(1, filteredRows.length)]
  }, [filteredRows, kpis.low, kpis.out])

  const healthSegments = useMemo(() => {
    const normal = filteredRows.filter((row: any) => Number(row.currentStock ?? 0) > 5).length
    return [
      { label: 'Bình thường', value: normal, color: '#10b981' },
      { label: 'Sắp hết', value: kpis.low, color: '#f59e0b' },
      { label: 'Hết hàng', value: kpis.out, color: '#ef4444' },
    ]
  }, [filteredRows, kpis.low, kpis.out])

  return (
    <EnterpriseModulePage>
      <MaterialDrawer
        open={open}
        material={selectedMaterial}
        onClose={() => {
          setOpen(false)
          setSelectedMaterial(null)
        }}
      />

      <SectionHeader title="Kho vật tư" description="Quản lý tồn kho vật tư, thép tấm, thép hình, phụ kiện và vật tư tiêu hao" />
      <EnterpriseTabBar tabs={inventoryTabs} />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <InventoryKpi title="Tổng giá trị tồn kho" value={money(kpis.totalValue)} note="Theo giá bình quân" tone="blue" />
        <InventoryKpi title="Tổng khối lượng" value={kpis.totalQty.toLocaleString('vi-VN')} note="Tồn hiện hành" tone="emerald" />
        <InventoryKpi title="Mã vật tư" value={kpis.totalCodes.toLocaleString('vi-VN')} note="Đang theo dõi" tone="cyan" />
        <InventoryKpi title="Vật tư sắp hết" value={kpis.low.toLocaleString('vi-VN')} note="Cần bổ sung" tone="amber" />
        <InventoryKpi title="Vật tư hết hàng" value={kpis.out.toLocaleString('vi-VN')} note="Rủi ro cao" tone="red" />
      </div>

      <InventoryPanel title="Bộ lọc tồn kho">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Tìm mã, tên vật tư..."
            className={inventoryInput}
          />
          <select
            value={zoneFilter}
            onChange={(e) => {
              setZoneFilter(e.target.value)
              setPage(1)
            }}
            className={inventoryInput}
          >
            <option value="">Tất cả kho</option>
            {zones.map((zone: any) => (
              <option key={zone.id} value={zone.code}>
                {zone.code} - {zone.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className={inventoryInput}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="NORMAL">Bình thường</option>
            <option value="LOW">Sắp hết</option>
            <option value="OUT">Hết hàng</option>
          </select>
          <button
            onClick={() => {
              setSelectedMaterial(null)
              setOpen(true)
            }}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20"
          >
            + Thêm vật tư mới
          </button>
        </div>
      </InventoryPanel>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <InventoryPanel title="Danh sách tồn kho" className="xl:col-span-2">
          <div className="mb-2 flex justify-end">
            <button onClick={() => setShowAll(true)} className="text-xs font-medium text-cyan-300 hover:text-cyan-200">Xem tất cả</button>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full">
              <thead className="bg-white/[0.06]">
                <tr>
                  <th className="px-3 py-2 text-left text-xs text-slate-500">Mã vật tư</th>
                  <th className="px-3 py-2 text-left text-xs text-slate-500">Tên vật tư</th>
                  <th className="px-3 py-2 text-left text-xs text-slate-500">Tồn kho</th>
                  <th className="px-3 py-2 text-left text-xs text-slate-500">Đơn giá gốc</th>
                  <th className="px-3 py-2 text-left text-xs text-slate-500">Tổng giá trị</th>
                  <th className="px-3 py-2 text-left text-xs text-slate-500">Vị trí</th>
                  <th className="px-3 py-2 text-left text-xs text-slate-500">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((item: any) => (
                  <tr key={item.id} onClick={() => openMaterial(item)} className="cursor-pointer border-t border-white/10 text-slate-200 hover:bg-white/[0.06]">
                    <td className="px-3 py-2 font-medium text-cyan-300">{item.materialCode}</td>
                    <td className="px-3 py-2 text-white">{item.materialName}</td>
                    <td className="px-3 py-2">{Number(item.currentStock ?? 0).toLocaleString('vi-VN')}</td>
                    <td className="px-3 py-2">{money(Number(item.averageCost ?? 0))}</td>
                    <td className="px-3 py-2 font-medium text-cyan-300">{money(Number(item.inventoryValue ?? 0))}</td>
                    <td className="px-3 py-2">{item.position ?? item.zone ?? '-'}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button onClick={(event) => { event.stopPropagation(); editMaterial(item) }} className="rounded border border-amber-400/40 bg-amber-500/10 px-2 py-1 text-xs text-amber-300">Sửa</button>
                        <button onClick={(event) => { event.stopPropagation(); handleDelete(item.materialId ?? item.inventoryItemId ?? item.id) }} className="rounded border border-red-400/40 bg-red-500/10 px-2 py-1 text-xs text-red-300">Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>
              Hiển thị {(activePage - 1) * PAGE_SIZE + 1}-{Math.min(activePage * PAGE_SIZE, filteredRows.length)}/{filteredRows.length.toLocaleString('vi-VN')}
            </span>
            <div className="flex gap-2">
              <button disabled={activePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border border-white/10 bg-white/5 px-2 py-1 text-slate-300 disabled:opacity-40">Trước</button>
              <button disabled={activePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded border border-white/10 bg-white/5 px-2 py-1 text-slate-300 disabled:opacity-40">Sau</button>
            </div>
          </div>
        </InventoryPanel>

        <div className="space-y-4">
          <InventoryPanel title="Phân bố tồn kho theo vị trí">
            <HorizontalBars rows={zoneDistribution} />
          </InventoryPanel>

          <InventoryPanel title="Top giá trị tồn kho">
            <HorizontalBars rows={valueLeaders} valueFormatter={money} />
          </InventoryPanel>

          <InventoryPanel title="Cơ cấu sức khỏe tồn kho">
            <DonutSummary segments={healthSegments} centerValue={filteredRows.length.toLocaleString('vi-VN')} centerLabel="mã vật tư" />
          </InventoryPanel>

          <InventoryPanel title="Nhịp tồn kho">
            <MiniBars values={healthBars} tone="emerald" />
          </InventoryPanel>

          <InventoryPanel title="Cảnh báo tồn kho">
            <div className="space-y-2 text-sm">
              {filteredRows
                .filter((row: any) => Number(row.currentStock ?? 0) <= 5)
                .slice(0, 6)
                .map((row: any) => (
                  <div key={row.id} className="flex items-center justify-between rounded border border-amber-400/30 bg-amber-500/10 px-3 py-2">
                    <span className="text-slate-200">{row.materialCode}</span>
                    <span className="text-amber-300">{Number(row.currentStock ?? 0).toLocaleString('vi-VN')}</span>
                  </div>
                ))}
            </div>
          </InventoryPanel>
        </div>
      </div>

      {showAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-auto rounded-xl border border-white/10 bg-[#0b1424]/95 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Toàn bộ danh sách tồn kho</h3>
              <button onClick={() => setShowAll(false)} className="rounded border border-white/10 bg-white/5 px-3 py-1 text-slate-300 hover:text-white">Đóng</button>
            </div>
            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full">
                <thead className="bg-white/[0.06]">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs text-slate-400">Mã</th>
                    <th className="px-3 py-2 text-left text-xs text-slate-400">Tên</th>
                    <th className="px-3 py-2 text-left text-xs text-slate-400">Tồn</th>
                    <th className="px-3 py-2 text-left text-xs text-slate-400">Giá trị</th>
                    <th className="px-3 py-2 text-left text-xs text-slate-400">Vị trí</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((item: any) => (
                    <tr key={item.id} onClick={() => openMaterial(item)} className="cursor-pointer border-t border-white/10 hover:bg-white/[0.06]">
                      <td className="px-3 py-2 text-cyan-300">{item.materialCode}</td>
                      <td className="px-3 py-2 text-white">{item.materialName}</td>
                      <td className="px-3 py-2 text-slate-200">{Number(item.currentStock ?? 0).toLocaleString('vi-VN')}</td>
                      <td className="px-3 py-2 text-cyan-300">{money(Number(item.inventoryValue ?? 0))}</td>
                      <td className="px-3 py-2 text-slate-300">{item.position ?? item.zone ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {detailMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-3xl rounded-xl border border-white/10 bg-[#0b1424]/95 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Chi tiết vật tư</div>
                <h3 className="mt-1 text-xl font-semibold text-white">{detailMaterial.materialCode} · {detailMaterial.materialName}</h3>
                <p className="mt-1 text-sm text-slate-400">{detailMaterial.position ?? detailMaterial.zone ?? 'Chưa có vị trí'}</p>
              </div>
              <button onClick={() => setDetailMaterial(null)} className="rounded border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300 hover:text-white">Đóng</button>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <InventoryKpi title="Tồn hiện tại" value={Number(detailMaterial.currentStock ?? 0).toLocaleString('vi-VN')} tone="blue" />
              <InventoryKpi title="Giá trung bình" value={money(Number(detailMaterial.averageCost ?? 0))} tone="cyan" />
              <InventoryKpi title="Giá trị tồn" value={money(Number(detailMaterial.inventoryValue ?? 0))} tone="emerald" />
              <InventoryKpi title="Trạng thái" value={Number(detailMaterial.currentStock ?? 0) <= 5 ? 'Cảnh báo' : 'Bình thường'} tone={Number(detailMaterial.currentStock ?? 0) <= 5 ? 'amber' : 'emerald'} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { editMaterial(detailMaterial); setDetailMaterial(null) }} className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-300">Sửa vật tư</button>
            </div>
          </div>
        </div>
      )}
    </EnterpriseModulePage>
  )
}
