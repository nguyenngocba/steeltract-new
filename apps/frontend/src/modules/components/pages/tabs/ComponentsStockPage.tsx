import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { EnterpriseTabBar } from '../../../../shared/runtime-tabs/EnterpriseTabBar'
import { SectionHeader } from '../../../../shared/ui/enterprise'
import { componentsTabs } from '../../config/components-tabs'
import { ComponentsFilterBar, ComponentsKpiCard, ComponentsPanel } from './ComponentsCockpitShared'

export function ComponentsStockPage() {
  return (
    <EnterpriseModulePage>
      <SectionHeader title="Cấu kiện > Tồn kho cấu kiện" description="Kho cấu kiện lưu thành phẩm/bán thành phẩm nhận từ sản xuất và điều chuyển từ bãi." />
      <EnterpriseTabBar tabs={componentsTabs} />

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-6">
          <ComponentsKpiCard title="Tổng số lượng" value="2.963 tấn" sub="+12,8% tháng trước" />
          <ComponentsKpiCard title="Tổng số kiện" value="5.281 kiện" sub="+8,8%" />
          <ComponentsKpiCard title="Giá trị tồn kho" value="45.619.250.000 đ" sub="+10,3%" />
          <ComponentsKpiCard title="Số loại cấu kiện" value="186 loại" />
          <ComponentsKpiCard title="Cảnh báo quá tải" value="7 vị trí" />
          <ComponentsKpiCard title="Kho cấu kiện" value="A01/B01/C03" />
        </div>

        <ComponentsFilterBar>
          <input placeholder="Tìm theo mã, tên cấu kiện, heat/lot..." className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 xl:col-span-4" />
          {['Kho/Bãi', 'Khu vực', 'Loại cấu kiện', 'Trạng thái'].map((x) => (
            <select key={x} className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-100 xl:col-span-2">
              <option>{x}</option>
            </select>
          ))}
          <button className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-200 xl:col-span-2">Làm mới</button>
          <button className="h-10 rounded-lg border border-slate-700 bg-[#050d18] px-3 text-sm text-slate-200 xl:col-span-2">Bộ lọc</button>
        </ComponentsFilterBar>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-9">
            <ComponentsPanel title="Danh sách tồn kho cấu kiện (2.963 tấn - 5.281 kiện)">
              <div className="overflow-auto">
                <table className="w-full min-w-[1180px] text-sm">
                  <thead className="text-xs uppercase text-slate-400">
                    <tr>
                      {['Mã cấu kiện', 'Tên', 'Loại', 'Kích thước', 'Vật liệu', 'Heat/Lot', 'Kho/Bãi', 'Khu vực', 'Số lượng', 'Khối lượng (tấn)', 'Trạng thái'].map((h) => (
                        <th key={h} className="px-2 py-2 text-left font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['CPL-BEAM-001256', 'BEAM H450x200x10x16', 'Dầm', 'H450x200', 'SS400', 'HT2506-001', 'Bãi số 1', 'A-02', 12, 3.24, 'Sẵn sàng'],
                      ['CPL-COL-000986', 'COLUMN H300x300x10x15', 'Cột', 'H300x300', 'SS400', 'HT2506-002', 'Bãi số 1', 'B-01', 8, 2.16, 'Sẵn sàng'],
                      ['CPL-BASE-000241', 'BASE PLATE 25mm', 'Bản đế', 'PLATE 25', 'SS400', 'HT2506-008', 'Kho cấu kiện', '—', 3, 0.225, 'Thiếu'],
                    ].map((row) => (
                      <tr key={row[0] as string} className="border-t border-slate-800/80 text-slate-200">
                        {row.map((c) => (
                          <td key={`${row[0]}-${String(c)}`} className="px-2 py-2">
                            {typeof c === 'number' ? c.toLocaleString('vi-VN') : c}
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
            <ComponentsPanel title="Phân bố tồn theo kho/bãi">
              {['Bãi số 1 - 1.248 tấn (42,1%)', 'Bãi số 2 - 862 tấn (29,1%)', 'Bãi số 3 - 553 tấn (18,7%)', 'Kho cấu kiện - 300 tấn (10,1%)'].map((x) => (
                <div key={x} className="mb-2 text-sm text-slate-300">
                  {x}
                </div>
              ))}
            </ComponentsPanel>
            <ComponentsPanel title="Top 5 cấu kiện tồn nhiều nhất">
              {['BEAM H450x200x10x16 - 324 tấn', 'COLUMN H300x300x10x15 - 216 tấn', 'PLATE 20mm - 125 tấn'].map((x) => (
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
