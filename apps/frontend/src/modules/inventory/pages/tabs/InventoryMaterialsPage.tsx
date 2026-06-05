import { useMemo, useState } from 'react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { SectionHeader } from '../../../../shared/ui/enterprise'
import { InventoryMaterialDetailModal } from '../../components/InventoryMaterialDetailModal'
import { MaterialDrawer } from '../../components/material-table/MaterialDrawer'
import { InventoryTabWorkspace } from '../../components/InventoryTabWorkspace'
import {
  DonutSummary,
  InventoryKpi,
  InventoryPagination,
  InventoryPanel,
  inventoryGridGap,
  inventoryInput,
  inventoryPageStack,
  inventoryTableHead,
  inventoryTableRow,
  inventoryTableShell,
} from '../../components/InventoryVisuals'
import { useDeleteMaterial } from '../../hooks/useDeleteMaterial'
import { useInventoryAudit } from '../../hooks/useInventoryAudit'
import { useInventoryTransactions } from '../../hooks/useInventoryTransactions'
import { useMaterialDetail } from '../../hooks/useMaterialDetail'
import { useZones } from '../../hooks/useZones'

const PAGE_SIZE = 10

function num(value: any) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function money(value: number) {
  return value.toLocaleString('vi-VN') + ' đ'
}

function materialUsageLabel(value: string | undefined) {
  const map: Record<string, string> = {
    PRIMARY: 'Vật tư chính',
    SECONDARY: 'Vật tư phụ',
    CONSUMABLE: 'Vật tư tiêu hao',
  }
  return map[String(value ?? 'PRIMARY')] ?? 'Vật tư chính'
}

function transactionRows(data: any) {
  return Array.isArray(data) ? data : data?.data ?? []
}

function transactionDateKey(tx: any, length: number) {
  return String(tx.transactionDate ?? tx.createdAt ?? '').slice(0, length)
}

function transactionQuantity(tx: any) {
  const items = Array.isArray(tx.items) ? tx.items : []
  if (items.length) {
    return items.reduce((sum: number, line: any) => sum + Math.abs(num(line.quantity)), 0)
  }
  return Math.abs(num(tx.totalQuantity ?? tx.quantity))
}

function transactionAmount(tx: any) {
  const items = Array.isArray(tx.items) ? tx.items : []
  if (items.length) {
    return items.reduce((sum: number, line: any) => sum + Math.abs(num(line.totalAmount ?? num(line.quantity) * num(line.unitPrice))), 0)
  }
  return Math.abs(num(tx.totalAmount))
}

export function InventoryMaterialsPage() {
  const { data: rows = [] } = useInventoryAudit()
  const { data: zones = [] } = useZones()
  const { data: transactions = [] } = useInventoryTransactions({})
  const deleteMaterialMutation = useDeleteMaterial()

  const [open, setOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null)
  const [detailMaterial, setDetailMaterial] = useState<any | null>(null)
  const { data: detailMaterialData } = useMaterialDetail(
    detailMaterial ? String(detailMaterial.materialId ?? detailMaterial.inventoryItemId ?? detailMaterial.id) : undefined,
  )
  const [search, setSearch] = useState('')
  const [zoneFilter, setZoneFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [showAll, setShowAll] = useState(false)
  const [deleteError, setDeleteError] = useState('')

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
    setDeleteError('')
    if (!window.confirm('Xóa vật tư này khỏi Material Master? Lịch sử giao dịch cũ vẫn được giữ lại.')) return
    try {
      await deleteMaterialMutation.mutateAsync(id)
    } catch (error: any) {
      console.error(error)
      setDeleteError(error?.response?.data?.message ?? 'Không thể xoá vật tư. Vui lòng thử lại hoặc kiểm tra dữ liệu liên kết.')
    }
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
      materialTypeId: item.materialTypeId ?? '',
      materialUsageType: item.materialUsageType ?? 'PRIMARY',
      zoneId: item.zoneId ?? '',
      description: item.description ?? '',
    })
    setOpen(true)
  }

  const zoneDistribution = useMemo<Array<[string, number]>>(() => {
    const map = new Map<string, number>()
    filteredRows.forEach((row: any) => {
      const key = String(row.zone ?? row.position ?? 'KHU MẶC ĐỊNH')
      map.set(key, (map.get(key) ?? 0) + num(row.currentStock))
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [filteredRows])

  const zoneSegments = useMemo(() => {
    const colors = ['#1d7cff', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4']
    return zoneDistribution.map(([label, value], index) => ({
      label,
      value,
      color: colors[index % colors.length],
    }))
  }, [zoneDistribution])

  const alerts = useMemo(() => {
    return filteredRows
      .map((row: any) => {
        const stock = num(row.currentStock)
        const min = num(row.minimumStock || 5)
        const level = stock <= 0 ? 'Hết hàng' : stock <= min || stock <= 5 ? 'Sắp hết' : ''
        return { ...row, stock, level }
      })
      .filter((row: any) => row.level)
      .sort((a: any, b: any) => a.stock - b.stock)
  }, [filteredRows])

  const monthlyTrend = useMemo(() => {
    const txRows = transactionRows(transactions)
    const now = new Date()
    const months = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      return { date, key }
    })
    const movements = months.map(({ key }) => {
      return txRows
        .filter((tx: any) => transactionDateKey(tx, 7) === key)
        .reduce((sum: number, tx: any) => {
          const type = String(tx.type ?? '').toUpperCase()
          const amount = transactionAmount(tx)
          if (type === 'OUTBOUND') return sum - amount
          if (type === 'INBOUND' || type === 'ADJUSTMENT' || type === 'RETURN') return sum + amount
          return sum
        }, 0)
    })
    let runningValue = Math.max(0, kpis.totalValue - movements.reduce((sum, value) => sum + value, 0))
    return months.map(({ date }, index) => {
      runningValue = Math.max(0, runningValue + movements[index])
      return {
        label: `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(2)}`,
        value: runningValue,
      }
    })
  }, [transactions, kpis.totalValue])

  const quickStats = useMemo(() => {
    const txRows = transactionRows(transactions)
    const today = new Date().toISOString().slice(0, 10)
    const month = new Date().toISOString().slice(0, 7)
    const byTypeToday = (type: string) => txRows.filter((tx: any) => String(tx.type ?? '').toUpperCase() === type && transactionDateKey(tx, 10) === today)
    const byTypeMonth = (type: string) => txRows.filter((tx: any) => String(tx.type ?? '').toUpperCase() === type && transactionDateKey(tx, 7) === month)
    const sumQty = (list: any[]) => list.reduce((sum, tx) => sum + transactionQuantity(tx), 0)
    return [
      { title: 'Nhập kho hôm nay', value: `${sumQty(byTypeToday('INBOUND')).toLocaleString('vi-VN')} tấn`, note: `${byTypeToday('INBOUND').length} phiếu`, tone: 'text-cyan-300' },
      { title: 'Xuất kho hôm nay', value: `${sumQty(byTypeToday('OUTBOUND')).toLocaleString('vi-VN')} tấn`, note: `${byTypeToday('OUTBOUND').length} phiếu`, tone: 'text-red-300' },
      { title: 'Điều chuyển hôm nay', value: `${sumQty(byTypeToday('TRANSFER')).toLocaleString('vi-VN')} tấn`, note: `${byTypeToday('TRANSFER').length} phiếu`, tone: 'text-blue-300' },
      { title: 'Kiểm kê tháng này', value: `${sumQty(byTypeMonth('ADJUSTMENT')).toLocaleString('vi-VN')} tấn`, note: 'Hoàn thành', tone: 'text-emerald-300' },
      { title: 'Chênh lệch tồn kho', value: `${kpis.totalCodes ? (((kpis.low + kpis.out) / kpis.totalCodes) * -100).toFixed(2) : '0.00'}%`, note: 'Theo cảnh báo tồn', tone: 'text-amber-300' },
    ]
  }, [transactions, kpis.low, kpis.out, kpis.totalCodes])

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
      <InventoryTabWorkspace />

      <div className={inventoryPageStack}>
        <div className={`grid grid-cols-1 md:grid-cols-5 ${inventoryGridGap}`}>
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
              className={`${inventoryInput} md:col-span-3`}
            />
            <select
              value={zoneFilter}
              onChange={(e) => {
                setZoneFilter(e.target.value)
                setPage(1)
              }}
              className={`${inventoryInput} md:col-span-2`}
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
          </div>
        </InventoryPanel>

        <div className={`grid grid-cols-1 xl:grid-cols-12 ${inventoryGridGap}`}>
          <InventoryPanel title="Danh sách tồn kho" className="xl:col-span-8">
          <div className="mb-3 flex justify-end border-b border-white/10 pb-3">
            <button onClick={() => setShowAll(true)} className="text-xs font-medium text-cyan-300 hover:text-cyan-200">Xem tất cả</button>
          </div>
          {deleteError && <div className="mb-3 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{deleteError}</div>}
          <div className={inventoryTableShell}>
            <table className="w-full">
              <thead className={inventoryTableHead}>
                <tr>
                  <th className="px-3 py-3 text-left font-medium">Mã vật tư</th>
                  <th className="px-3 py-3 text-left font-medium">Tên vật tư</th>
                  <th className="px-3 py-3 text-left font-medium">Loại vật tư</th>
                  <th className="px-3 py-3 text-left font-medium">Tồn kho</th>
                  <th className="px-3 py-3 text-left font-medium">Đơn giá gốc</th>
                  <th className="px-3 py-3 text-left font-medium">Tổng giá trị</th>
                  <th className="px-3 py-3 text-left font-medium">Vị trí</th>
                  <th className="px-3 py-3 text-left font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((item: any) => (
                  <tr key={item.id} onClick={() => openMaterial(item)} className={`cursor-pointer ${inventoryTableRow}`}>
                    <td className="px-3 py-2 font-medium text-cyan-300">{item.materialCode}</td>
                    <td className="px-3 py-2 text-white">{item.materialName}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 text-xs text-cyan-200">
                        {materialUsageLabel(item.materialUsageType)}
                      </span>
                    </td>
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
          <InventoryPagination page={activePage} pageCount={totalPages} total={filteredRows.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </InventoryPanel>

          <div className="space-y-5 xl:col-span-4">
          <InventoryPanel title="Phân bố tồn kho theo kho">
            <DonutSummary
              segments={zoneSegments}
              centerValue={kpis.totalQty.toLocaleString('vi-VN')}
              centerLabel="tấn"
            />
          </InventoryPanel>

          <InventoryPanel title="Biến động tồn kho theo tháng">
            <StockTrendChart rows={monthlyTrend} />
          </InventoryPanel>

          <InventoryPanel title="Cảnh báo tồn kho">
            <div className="space-y-2 text-sm">
              {alerts.slice(0, 6).map((row: any) => (
                  <div key={row.id} className={`flex items-center justify-between rounded border px-3 py-2 ${row.level === 'Hết hàng' ? 'border-red-400/30 bg-red-500/10' : 'border-amber-400/30 bg-amber-500/10'}`}>
                    <span className={row.level === 'Hết hàng' ? 'text-red-300' : 'text-amber-300'}>{row.materialCode}</span>
                    <span className="text-slate-400">Tồn còn: {row.stock.toLocaleString('vi-VN')}</span>
                    <span className={row.level === 'Hết hàng' ? 'text-red-300' : 'text-amber-300'}>{row.level}</span>
                  </div>
              ))}
              {alerts.length === 0 && <div className="rounded border border-white/10 bg-white/[0.04] px-3 py-4 text-center text-slate-500">Không có cảnh báo tồn kho.</div>}
            </div>
          </InventoryPanel>
        </div>
      </div>

        <InventoryPanel title="Thống kê nhanh">
          <div className="grid grid-cols-1 divide-y divide-white/10 md:grid-cols-5 md:divide-x md:divide-y-0">
            {quickStats.map((item) => (
              <div key={item.title} className="px-4 py-2 first:pl-0 last:pr-0">
                <div className="text-xs text-slate-400">{item.title}</div>
                <div className={`mt-1 text-lg font-semibold ${item.tone}`}>{item.value}</div>
                <div className="text-xs text-slate-500">{item.note}</div>
              </div>
            ))}
          </div>
        </InventoryPanel>
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
                    <th className="px-3 py-2 text-left text-xs text-slate-400">Loại vật tư</th>
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
                      <td className="px-3 py-2 text-slate-300">{materialUsageLabel(item.materialUsageType)}</td>
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

      <InventoryMaterialDetailModal
        open={Boolean(detailMaterial)}
        detail={detailMaterialData}
        fallback={detailMaterial}
        onClose={() => setDetailMaterial(null)}
        onEdit={() => {
          editMaterial(detailMaterial)
          setDetailMaterial(null)
        }}
      />
    </EnterpriseModulePage>
  )
}

function StockTrendChart({ rows }: { rows: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...rows.map((row) => row.value))
  const points = rows.map((row, index) => {
    const x = rows.length <= 1 ? 0 : (index / (rows.length - 1)) * 100
    const y = 100 - (row.value / max) * 78 - 10
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="h-48">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-36 w-full overflow-visible">
        <defs>
          <linearGradient id="stockTrendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1d7cff" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#1d7cff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={`0,100 ${points} 100,100`} fill="url(#stockTrendFill)" stroke="none" />
        <polyline points={points} fill="none" stroke="#1d7cff" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        {rows.map((row, index) => {
          const x = rows.length <= 1 ? 0 : (index / (rows.length - 1)) * 100
          const y = 100 - (row.value / max) * 78 - 10
          return <circle key={row.label} cx={x} cy={y} r="1.6" fill="#38bdf8" />
        })}
      </svg>
      <div className="grid grid-cols-6 gap-2 text-[11px] text-slate-500">
        {rows.map((row) => <span key={row.label}>{row.label}</span>)}
      </div>
    </div>
  )
}
