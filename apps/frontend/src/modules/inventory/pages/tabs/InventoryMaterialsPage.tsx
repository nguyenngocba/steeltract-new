import { useMemo, useState } from 'react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { EnterpriseTabBar } from '../../../../shared/runtime-tabs/EnterpriseTabBar'
import { KpiCard, RuntimePanel, SectionHeader } from '../../../../shared/ui/enterprise'
import { inventoryTabs } from '../../config/inventory-tabs'
import { MaterialDrawer } from '../../components/material-table/MaterialDrawer'
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

  const zoneDistribution = useMemo(() => {
    const map = new Map<string, number>()
    filteredRows.forEach((row: any) => {
      const key = String(row.zone ?? row.position ?? 'KHU MẶC ĐỊNH')
      map.set(key, (map.get(key) ?? 0) + Number(row.currentStock ?? 0))
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [filteredRows])

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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <KpiCard title="Tổng giá trị tồn kho" value={money(kpis.totalValue)} />
        <KpiCard title="Tổng khối lượng" value={kpis.totalQty.toLocaleString('vi-VN')} />
        <KpiCard title="Mã vật tư" value={kpis.totalCodes.toLocaleString('vi-VN')} />
        <KpiCard title="Vật tư sắp hết" value={kpis.low.toLocaleString('vi-VN')} />
        <KpiCard title="Vật tư hết hàng" value={kpis.out.toLocaleString('vi-VN')} />
      </div>

      <RuntimePanel title="Bộ lọc tồn kho">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Tìm mã, tên vật tư..."
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          />
          <select
            value={zoneFilter}
            onChange={(e) => {
              setZoneFilter(e.target.value)
              setPage(1)
            }}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
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
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
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
            className="rounded-lg border border-cyan-600 bg-cyan-900/30 px-3 py-2 text-cyan-300"
          >
            + Thêm vật tư mới
          </button>
        </div>
      </RuntimePanel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <RuntimePanel title="Danh sách tồn kho" className="xl:col-span-2">
          <div className="mb-2 flex justify-end">
            <button onClick={() => setShowAll(true)} className="text-xs text-cyan-300 hover:text-cyan-200">Xem tất cả</button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-zinc-800">
            <table className="w-full">
              <thead className="bg-zinc-950">
                <tr>
                  <th className="px-3 py-2 text-left text-xs text-zinc-500">Mã vật tư</th>
                  <th className="px-3 py-2 text-left text-xs text-zinc-500">Tên vật tư</th>
                  <th className="px-3 py-2 text-left text-xs text-zinc-500">Tồn kho</th>
                  <th className="px-3 py-2 text-left text-xs text-zinc-500">Đơn giá gốc</th>
                  <th className="px-3 py-2 text-left text-xs text-zinc-500">Tổng giá trị</th>
                  <th className="px-3 py-2 text-left text-xs text-zinc-500">Vị trí</th>
                  <th className="px-3 py-2 text-left text-xs text-zinc-500">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((item: any) => (
                  <tr key={item.id} onClick={() => openMaterial(item)} className="cursor-pointer border-t border-zinc-800 hover:bg-zinc-900/50">
                    <td className="px-3 py-2 text-cyan-300">{item.materialCode}</td>
                    <td className="px-3 py-2 text-zinc-100">{item.materialName}</td>
                    <td className="px-3 py-2 text-zinc-200">{Number(item.currentStock ?? 0).toLocaleString('vi-VN')}</td>
                    <td className="px-3 py-2 text-zinc-200">{money(Number(item.averageCost ?? 0))}</td>
                    <td className="px-3 py-2 text-cyan-300">{money(Number(item.inventoryValue ?? 0))}</td>
                    <td className="px-3 py-2 text-zinc-300">{item.position ?? item.zone ?? '-'}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button onClick={(event) => { event.stopPropagation(); editMaterial(item) }} className="rounded border border-amber-700/40 px-2 py-1 text-xs text-amber-300">Sửa</button>
                        <button onClick={(event) => { event.stopPropagation(); handleDelete(item.materialId ?? item.inventoryItemId ?? item.id) }} className="rounded border border-red-700/40 px-2 py-1 text-xs text-red-300">Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
            <span>
              Hiển thị {(activePage - 1) * PAGE_SIZE + 1}-{Math.min(activePage * PAGE_SIZE, filteredRows.length)}/{filteredRows.length.toLocaleString('vi-VN')}
            </span>
            <div className="flex gap-2">
              <button disabled={activePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border border-zinc-700 px-2 py-1 disabled:opacity-40">Trước</button>
              <button disabled={activePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded border border-zinc-700 px-2 py-1 disabled:opacity-40">Sau</button>
            </div>
          </div>
        </RuntimePanel>

        <div className="space-y-6">
          <RuntimePanel title="Phân bố tồn kho theo vị trí">
            <div className="space-y-2 text-sm">
              {zoneDistribution.map(([zone, qty]) => (
                <div key={zone} className="rounded border border-zinc-800 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-200">{zone}</span>
                    <span className="text-cyan-300">{qty.toLocaleString('vi-VN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </RuntimePanel>

          <RuntimePanel title="Biến động tồn kho theo tháng">
            <div className="grid grid-cols-12 items-end gap-1">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div key={idx} className="rounded bg-cyan-500/60" style={{ height: `${22 + ((idx + 3) * 7) % 70}px` }} />
              ))}
            </div>
          </RuntimePanel>

          <RuntimePanel title="Cảnh báo tồn kho">
            <div className="space-y-2 text-sm">
              {filteredRows
                .filter((row: any) => Number(row.currentStock ?? 0) <= 5)
                .slice(0, 6)
                .map((row: any) => (
                  <div key={row.id} className="flex items-center justify-between rounded border border-zinc-800 px-3 py-2">
                    <span className="text-zinc-200">{row.materialCode}</span>
                    <span className="text-amber-300">{Number(row.currentStock ?? 0).toLocaleString('vi-VN')}</span>
                  </div>
                ))}
            </div>
          </RuntimePanel>
        </div>
      </div>

      {showAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Toàn bộ danh sách tồn kho</h3>
              <button onClick={() => setShowAll(false)} className="rounded border border-zinc-700 px-3 py-1 text-zinc-300">Đóng</button>
            </div>
            <div className="overflow-hidden rounded-xl border border-zinc-800">
              <table className="w-full">
                <thead className="bg-zinc-900">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs text-zinc-500">Mã</th>
                    <th className="px-3 py-2 text-left text-xs text-zinc-500">Tên</th>
                    <th className="px-3 py-2 text-left text-xs text-zinc-500">Tồn</th>
                    <th className="px-3 py-2 text-left text-xs text-zinc-500">Giá trị</th>
                    <th className="px-3 py-2 text-left text-xs text-zinc-500">Vị trí</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((item: any) => (
                    <tr key={item.id} onClick={() => openMaterial(item)} className="cursor-pointer border-t border-zinc-800 hover:bg-zinc-900/50">
                      <td className="px-3 py-2 text-cyan-300">{item.materialCode}</td>
                      <td className="px-3 py-2 text-zinc-100">{item.materialName}</td>
                      <td className="px-3 py-2 text-zinc-200">{Number(item.currentStock ?? 0).toLocaleString('vi-VN')}</td>
                      <td className="px-3 py-2 text-cyan-300">{money(Number(item.inventoryValue ?? 0))}</td>
                      <td className="px-3 py-2 text-zinc-300">{item.position ?? item.zone ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {detailMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-cyan-400">Chi tiết vật tư</div>
                <h3 className="mt-1 text-xl font-semibold text-white">{detailMaterial.materialCode} · {detailMaterial.materialName}</h3>
                <p className="mt-1 text-sm text-zinc-400">{detailMaterial.position ?? detailMaterial.zone ?? 'Chưa có vị trí'}</p>
              </div>
              <button onClick={() => setDetailMaterial(null)} className="rounded border border-zinc-700 px-3 py-1 text-sm text-zinc-300">Đóng</button>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <KpiCard title="Tồn hiện tại" value={Number(detailMaterial.currentStock ?? 0).toLocaleString('vi-VN')} />
              <KpiCard title="Giá trung bình" value={money(Number(detailMaterial.averageCost ?? 0))} />
              <KpiCard title="Giá trị tồn" value={money(Number(detailMaterial.inventoryValue ?? 0))} />
              <KpiCard title="Trạng thái" value={Number(detailMaterial.currentStock ?? 0) <= 5 ? 'Cảnh báo' : 'Bình thường'} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { editMaterial(detailMaterial); setDetailMaterial(null) }} className="rounded border border-amber-700 px-4 py-2 text-sm text-amber-300">Sửa vật tư</button>
            </div>
          </div>
        </div>
      )}
    </EnterpriseModulePage>
  )
}
