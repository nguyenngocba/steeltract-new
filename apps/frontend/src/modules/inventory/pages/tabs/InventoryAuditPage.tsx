import { useMemo, useState } from 'react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { InventoryTabWorkspace } from '../../components/InventoryTabWorkspace'
import {
  HorizontalBars,
  InventoryKpi,
  InventoryPanel,
  inventoryGridGap,
  inventoryInput,
  inventoryPageStack,
  inventoryTableHead,
  inventoryTableRow,
  inventoryTableShell,
  MiniBars,
} from '../../components/InventoryVisuals'
import { useInventoryAudit } from '../../hooks/useInventoryAudit'

function num(value: unknown) {
  const n = Number(value ?? 0)
  return Number.isFinite(n) ? n : 0
}

function money(value: unknown) {
  return `${Math.round(num(value)).toLocaleString('vi-VN')} đ`
}

export function InventoryAuditPage() {
  const { data = [], isLoading } = useInventoryAudit()
  const [query, setQuery] = useState('')
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data as any[]).filter((row) => !q || `${row.materialCode} ${row.materialName}`.toLowerCase().includes(q))
  }, [data, query])
  const summary = useMemo(() => {
    const stock = rows.reduce((sum, row) => sum + num(row.currentStock), 0)
    const value = rows.reduce((sum, row) => sum + num(row.inventoryValue), 0)
    const avg = rows.length ? value / rows.length : 0
    const stale = rows.filter((row) => !row.lastMovementDate).length
    return { stock, value, avg, stale }
  }, [rows])
  const valueLeaders = useMemo<Array<[string, number]>>(() => rows.map((row) => [row.materialCode, num(row.inventoryValue)] as [string, number]).sort((a, b) => b[1] - a[1]).slice(0, 6), [rows])
  const stockBars = useMemo(() => rows.slice(0, 12).map((row) => Math.max(1, num(row.currentStock))), [rows])

  return (
    <EnterpriseModulePage>
      <InventoryTabWorkspace />

      <div className={inventoryPageStack}>
        <div className={`grid md:grid-cols-4 ${inventoryGridGap}`}>
          <InventoryKpi title="Tổng tồn" value={summary.stock.toLocaleString('vi-VN')} note="Theo audit transaction" tone="blue" />
          <InventoryKpi title="Giá trị tồn" value={money(summary.value)} note="Theo giá bình quân" tone="emerald" />
          <InventoryKpi title="Giá trị TB / mã" value={money(summary.avg)} note="Bình quân danh mục" tone="cyan" />
          <InventoryKpi title="Chưa có phát sinh" value={summary.stale.toLocaleString('vi-VN')} note="Cần rà soát" tone="amber" />
        </div>

        <div className={`grid xl:grid-cols-[1fr_380px] ${inventoryGridGap}`}>
          <InventoryPanel title="Bảng audit tồn kho">
            <div className="mb-4">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm mã hoặc tên vật tư..." className={`${inventoryInput} w-full md:w-96`} />
            </div>
            <div className={`${inventoryTableShell} overflow-auto`}>
              <table className="w-full min-w-[980px] text-sm">
                <thead className={inventoryTableHead}>
                <tr>
                  <th className="px-4 py-3 text-left">Mã vật tư</th>
                  <th className="px-4 py-3 text-left">Tên vật tư</th>
                  <th className="px-4 py-3 text-left">Tồn hiện tại</th>
                  <th className="px-4 py-3 text-left">Giá bình quân</th>
                  <th className="px-4 py-3 text-left">Giá trị tồn</th>
                  <th className="px-4 py-3 text-left">Phát sinh cuối</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Đang tải dữ liệu audit...</td></tr>}
                {!isLoading && rows.map((row: any) => (
                  <tr key={row.materialId} className={inventoryTableRow}>
                    <td className="px-4 py-3 font-medium text-cyan-300">{row.materialCode}</td>
                    <td className="px-4 py-3 text-white">{row.materialName}</td>
                    <td className="px-4 py-3">{num(row.currentStock).toLocaleString('vi-VN')}</td>
                    <td className="px-4 py-3">{money(row.averageCost)}</td>
                    <td className="px-4 py-3 font-medium text-cyan-300">{money(row.inventoryValue)}</td>
                    <td className="px-4 py-3 text-slate-500">{row.lastMovementDate ? new Date(row.lastMovementDate).toLocaleString('vi-VN') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </InventoryPanel>

          <div className="space-y-5">
            <InventoryPanel title="Top giá trị tồn">
              <HorizontalBars rows={valueLeaders} valueFormatter={money} />
            </InventoryPanel>
            <InventoryPanel title="Phân bổ tồn nhanh">
              <MiniBars values={stockBars.length ? stockBars : [1, 1, 1]} />
            </InventoryPanel>
          </div>
        </div>
      </div>
    </EnterpriseModulePage>
  )
}
