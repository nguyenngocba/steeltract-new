import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { ComponentsFilterBar, ComponentsKpiCard, ComponentsPanel } from './ComponentsCockpitShared'

export function ComponentsInternalQcPage() {
  return (
    <EnterpriseModulePage>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-6">
          <ComponentsKpiCard title="Tổng phiếu QC" value="1.248" sub="+15,6% so với tháng trước" />
          <ComponentsKpiCard title="Đạt" value="1.086" sub="87,0%" />
          <ComponentsKpiCard title="Không đạt" value="98" sub="7,9%" />
          <ComponentsKpiCard title="Chờ xử lý" value="64" sub="5,1%" />
          <ComponentsKpiCard title="Đang xử lý" value="32" sub="2,6%" />
          <ComponentsKpiCard title="Khu vực QC" value="QC kích thước / QC hàn" />
        </div>

        <ComponentsFilterBar>
          <input placeholder="Tìm theo mã phiếu, cấu kiện, lot, người tạo..." className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 xl:col-span-4" />
          {['Trạng thái', 'Khu vực QC', 'Loại cấu kiện', 'Loại QC'].map((x) => (
            <select key={x} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 xl:col-span-2">
              <option>{x}</option>
            </select>
          ))}
          <input type="date" className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 xl:col-span-2" />
        </ComponentsFilterBar>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-9">
            <ComponentsPanel title="Danh sách phiếu QC nội bộ (1.248)">
              <div className="overflow-auto">
                <table className="w-full min-w-[1050px] text-sm">
                  <thead className="text-xs uppercase text-slate-400">
                    <tr>
                      {['Mã phiếu QC', 'Cấu kiện', 'Lot / Heat', 'Loại QC', 'Khu vực QC', 'Ngày tạo', 'Trạng thái', 'Kết quả', 'Người QC'].map((h) => (
                        <th key={h} className="px-2 py-2 text-left font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['QC-2506-1248', 'BEAM H450x200x10x16', 'LOT-0625-001', 'Kích thước', 'QC Kích thước', '29/06/2025', 'Hoàn thành', 'Đạt', 'Trần Minh B'],
                      ['QC-2506-1247', 'PLATE 20mm', 'LOT-0625-002', 'Bề mặt', 'QC Bề mặt', '29/06/2025', 'Hoàn thành', 'Đạt', 'Nguyễn Văn A'],
                      ['QC-2506-1246', 'COLUMN H300x300x10x15', 'LOT-0625-003', 'Kích thước', 'QC Kích thước', '29/06/2025', 'Đang xử lý', '—', 'Phạm Văn C'],
                    ].map((row) => (
                      <tr key={row[0] as string} className="border-t border-slate-800/80 text-slate-200">
                        {row.map((c) => (
                          <td key={`${row[0]}-${String(c)}`} className="px-2 py-2">
                            {c}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ComponentsPanel>
          </div>
          <div className="space-y-4 xl:col-span-3">
            <ComponentsPanel title="Chi tiết phiếu QC">
              <div className="space-y-2 text-sm text-slate-300">
                <div className="text-xl font-semibold text-white">QC-2506-1248</div>
                <div>Tiêu chuẩn: TCVN 7571-1:2006</div>
                <div>Kết quả: Đạt</div>
                <div>Người QC: Trần Minh B</div>
              </div>
            </ComponentsPanel>
            <ComponentsPanel title="Top nguyên nhân không đạt">
              {['Sai kích thước - 42 (42,9%)', 'Khuyết tật hàn - 24 (24,5%)', 'Bề mặt không đạt - 16 (16,3%)'].map((x) => (
                <div key={x} className="mb-2 text-sm text-slate-300">
                  {x}
                </div>
              ))}
            </ComponentsPanel>
          </div>
        </div>
      </div>
    </EnterpriseModulePage>
  )
}
