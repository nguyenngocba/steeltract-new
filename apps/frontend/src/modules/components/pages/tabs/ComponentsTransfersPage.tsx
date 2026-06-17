import { useState } from 'react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { useYardMovementsRuntime } from '../../../yard/hooks/queries/useYardRuntime'
import { ComponentsFilterBar, ComponentsKpiCard, ComponentsPanel } from './ComponentsCockpitShared'
import { formatDateTime, formatQuantity } from '@/shared/utils/number-format'

export function ComponentsTransfersPage() {
  const { data: movements = [], isLoading } = useYardMovementsRuntime()
  const [query, setQuery] = useState('')
  const rows = movements
    .filter((movement) => movement.type === 'MOVE')
    .filter((movement) => {
      if (!query.trim()) return true
      return `${movement.itemCode} ${movement.fromSlot?.code ?? ''} ${movement.toSlot?.code ?? ''}`.toLowerCase().includes(query.toLowerCase())
    })

  return (
    <EnterpriseModulePage>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
          <ComponentsKpiCard title="Tổng lệnh chuyển" value={formatQuantity(rows.length, 0)} />
          <ComponentsKpiCard title="Hoàn thành" value={formatQuantity(rows.length, 0)} />
          <ComponentsKpiCard title="Nguồn dữ liệu" value="YARD MOVE" />
          <ComponentsKpiCard title="Cập nhật" value="LIVE" sub="5 giây/lần" />
        </div>

        <ComponentsFilterBar>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã cấu kiện, nơi đi, nơi đến..." className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 xl:col-span-6" />
        </ComponentsFilterBar>

        <ComponentsPanel title={`Danh sách lệnh chuyển cấu kiện (${rows.length})`}>
          <div className="overflow-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  {['Thời gian', 'Cấu kiện', 'Nơi đi', 'Nơi đến', 'Trạng thái', 'Ghi chú'].map((heading) => (
                    <th key={heading} className="px-2 py-2 text-left font-medium">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="px-2 py-6 text-center text-slate-400">Đang tải lệnh chuyển...</td></tr>
                ) : rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-800/80 text-slate-200 hover:bg-slate-900/40">
                    <td className="px-2 py-2">{formatDateTime(row.createdAt)}</td>
                    <td className="px-2 py-2 text-cyan-300">{row.itemCode}</td>
                    <td className="px-2 py-2">{row.fromSlot?.zone?.code ?? '-'} / {row.fromSlot?.code ?? '-'}</td>
                    <td className="px-2 py-2">{row.toSlot?.zone?.code ?? '-'} / {row.toSlot?.code ?? '-'}</td>
                    <td className="px-2 py-2 text-emerald-300">Hoàn thành</td>
                    <td className="px-2 py-2">{row.reason ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ComponentsPanel>
      </div>
    </EnterpriseModulePage>
  )
}
