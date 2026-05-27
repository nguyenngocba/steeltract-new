import { useState } from 'react'
import { RealtimeTransactions } from './panels/RealtimeTransactions'
import { LineChart } from '../../../shared/chart-runtime/line/LineChart'

const tabs = [
  'Tổng quan',
  'Tồn kho',
  'Nhập kho',
  'Xuất kho',
  'Điều chuyển',
  'Kiểm kê',
  'Lịch sử',
  'Cảnh báo',
  'Sơ đồ kho',
]

export function InventoryWorkspace() {
  const [activeTab, setActiveTab] = useState('Tổng quan')

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      {/* LEFT */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* HEADER */}
        <div className="border-b border-zinc-800 bg-zinc-900 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                Kho vật tư
              </h1>

              <p className="mt-1 text-sm text-zinc-400">
                Warehouse Operational Command Center
              </p>
            </div>

            <div className="flex gap-3">
              <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium">
                Nhập kho
              </button>

              <button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium">
                Xuất kho
              </button>

              <button className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-medium">
                Điều chuyển
              </button>
            </div>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-4 border-b border-zinc-800 bg-zinc-950 p-4">

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Tổng vật tư
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              14,290
            </h2>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Giá trị tồn kho
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              28.4B
            </h2>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Sắp hết hàng
            </p>

            <h2 className="mt-3 text-3xl font-bold text-orange-400">
              38
            </h2>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Giao dịch hôm nay
            </p>

            <h2 className="mt-3 text-3xl font-bold text-cyan-400">
              219
            </h2>
          </div>

        </div>

        {/* TABS */}
        <div className="flex gap-2 overflow-x-auto border-b border-zinc-800 bg-zinc-900 px-4 py-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="flex flex-1 overflow-hidden">

          {/* MAIN */}
          <div className="flex-1 overflow-auto p-4">

            {/* FILTER */}
            <div className="mb-4 flex gap-3">

              <input
                placeholder="Tìm vật tư..."
                className="h-11 w-80 rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm outline-none"
              />

              <select className="h-11 rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm">
                <option>Tất cả kho</option>
              </select>

              <select className="h-11 rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm">
                <option>Tất cả danh mục</option>
              </select>

            </div>

            {/* TABLE */}
            <div className="overflow-hidden rounded-2xl border border-zinc-800">

              <table className="w-full text-sm">

                <thead className="bg-zinc-900">
                  <tr className="border-b border-zinc-800">

                    <th className="px-4 py-3 text-left">
                      Mã
                    </th>

                    <th className="px-4 py-3 text-left">
                      Vật tư
                    </th>

                    <th className="px-4 py-3 text-left">
                      Tồn kho
                    </th>

                    <th className="px-4 py-3 text-left">
                      Đơn vị
                    </th>

                    <th className="px-4 py-3 text-left">
                      Vị trí
                    </th>

                    <th className="px-4 py-3 text-left">
                      Trạng thái
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {[1,2,3,4,5,6,7,8].map((row) => (
                    <tr
                      key={row}
                      className="border-b border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
                    >

                      <td className="px-4 py-3">
                        VT-{row}
                      </td>

                      <td className="px-4 py-3 font-medium">
                        Thép hình H400
                      </td>

                      <td className="px-4 py-3">
                        248
                      </td>

                      <td className="px-4 py-3">
                        Cây
                      </td>

                      <td className="px-4 py-3">
                        A1-R02-L03
                      </td>

                      <td className="px-4 py-3">
                        <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
                          Bình thường
                        </span>
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            
            <div className="mt-4 grid grid-cols-2 gap-4">

              <LineChart />

              <RealtimeTransactions />

            </div>

          </div>


          {/* RIGHT PANEL */}
          <div className="w-[360px] border-l border-zinc-800 bg-zinc-900 p-4">

            <h3 className="mb-4 text-lg font-semibold">
              Chi tiết vật tư
            </h3>

            <div className="space-y-4">

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-500">
                  Tồn khả dụng
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  248 cây
                </h2>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-500">
                  Vị trí hiện tại
                </p>

                <h2 className="mt-2 text-xl font-bold">
                  Kho A → Rack 02
                </h2>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-500">
                  Lần nhập gần nhất
                </p>

                <h2 className="mt-2 text-xl font-bold">
                  26/05/2026
                </h2>
              </div>

            
            <div className="mt-4 grid grid-cols-2 gap-4">

              <LineChart />

              <RealtimeTransactions />

            </div>

          </div>


        </div>

      </div>
    </div>
  )
}
