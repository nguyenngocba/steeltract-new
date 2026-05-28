import { useState } from 'react'

const tabs = [
  'Tổng quan',
  'Gia công',
  'Lắp ráp',
  'Sơn',
  'QC',
  'Đóng gói',
  'Tiêu hao',
  'Vị trí',
  'Lịch sử',
]

const machines = [
  {
    id: 'MC-01',
    name: 'Máy cắt CNC',
    status: 'running',
    progress: 82,
  },
  {
    id: 'MC-02',
    name: 'Máy hàn Beam',
    status: 'warning',
    progress: 56,
  },
  {
    id: 'MC-03',
    name: 'Robot hàn',
    status: 'running',
    progress: 91,
  },
  {
    id: 'MC-04',
    name: 'Sơn tự động',
    status: 'offline',
    progress: 0,
  },
]

export function ComponentsWorkspace() {
  const [activeTab, setActiveTab] = useState('Gia công')

  return (
    <div className="flex h-screen bg-zinc-950 text-white">

      {/* MAIN */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* HEADER */}
        <div className="border-b border-zinc-800 bg-zinc-900 px-6 py-4">

          <div className="flex items-center justify-between">

            <div>

              <h1 className="text-3xl font-bold">
                Cấu kiện & Gia công
              </h1>

              <p className="mt-1 text-sm text-zinc-400">
                Fabrication Operational Command Center
              </p>

            </div>

            <div className="flex gap-3">

              <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium">
                Tạo lệnh SX
              </button>

              <button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium">
                QC
              </button>

              <button className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-medium">
                Điều độ
              </button>

            </div>

          </div>

        </div>

        {/* KPI */}
        <div className="grid grid-cols-5 gap-4 border-b border-zinc-800 bg-zinc-950 p-4">

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">

            <p className="text-xs uppercase text-zinc-500">
              Tổng cấu kiện
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              12,480
            </h2>

          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">

            <p className="text-xs uppercase text-zinc-500">
              Đang sản xuất
            </p>

            <h2 className="mt-3 text-3xl font-bold text-cyan-400">
              1,280
            </h2>

          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">

            <p className="text-xs uppercase text-zinc-500">
              Chờ QC
            </p>

            <h2 className="mt-3 text-3xl font-bold text-orange-400">
              182
            </h2>

          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">

            <p className="text-xs uppercase text-zinc-500">
              Máy hoạt động
            </p>

            <h2 className="mt-3 text-3xl font-bold text-emerald-400">
              24
            </h2>

          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">

            <p className="text-xs uppercase text-zinc-500">
              Lỗi hôm nay
            </p>

            <h2 className="mt-3 text-3xl font-bold text-red-400">
              7
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

        {/* BODY */}
        <div className="flex flex-1 overflow-hidden">

          {/* CENTER */}
          <div className="flex flex-1 flex-col overflow-hidden p-4">

            {/* MACHINE STATUS */}
            <div className="grid grid-cols-4 gap-4">

              {machines.map((machine) => (
                <div
                  key={machine.id}
                  className={`rounded-2xl border p-4 ${
                    machine.status === 'running'
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : machine.status === 'warning'
                      ? 'border-orange-500/40 bg-orange-500/10'
                      : 'border-red-500/40 bg-red-500/10'
                  }`}
                >

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-xs text-zinc-400">
                        {machine.id}
                      </p>

                      <h3 className="mt-1 text-lg font-semibold">
                        {machine.name}
                      </h3>

                    </div>

                    <div
                      className={`h-3 w-3 rounded-full ${
                        machine.status === 'running'
                          ? 'bg-emerald-400'
                          : machine.status === 'warning'
                          ? 'bg-orange-400'
                          : 'bg-red-400'
                      }`}
                    />

                  </div>

                  <div className="mt-6">

                    <div className="mb-2 flex items-center justify-between text-xs text-zinc-400">

                      <span>Hiệu suất</span>

                      <span>{machine.progress}%</span>

                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-zinc-800">

                      <div
                        className={`h-full ${
                          machine.status === 'running'
                            ? 'bg-emerald-400'
                            : machine.status === 'warning'
                            ? 'bg-orange-400'
                            : 'bg-red-400'
                        }`}
                        style={{
                          width: `${machine.progress}%`,
                        }}
                      />

                    </div>

                  </div>

                </div>
              ))}

            </div>

            {/* TABLE */}
            <div className="mt-4 flex-1 overflow-hidden rounded-2xl border border-zinc-800">

              <table className="w-full text-sm">

                <thead className="bg-zinc-900">

                  <tr className="border-b border-zinc-800">

                    <th className="px-4 py-3 text-left">
                      Mã CK
                    </th>

                    <th className="px-4 py-3 text-left">
                      Cấu kiện
                    </th>

                    <th className="px-4 py-3 text-left">
                      Công đoạn
                    </th>

                    <th className="px-4 py-3 text-left">
                      Tiến độ
                    </th>

                    <th className="px-4 py-3 text-left">
                      Máy
                    </th>

                    <th className="px-4 py-3 text-left">
                      Trạng thái
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {[1,2,3,4,5,6,7].map((row) => (
                    <tr
                      key={row}
                      className="border-b border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
                    >

                      <td className="px-4 py-3">
                        CK-{row}
                      </td>

                      <td className="px-4 py-3 font-medium">
                        Beam H700
                      </td>

                      <td className="px-4 py-3">
                        Hàn
                      </td>

                      <td className="px-4 py-3">

                        <div className="w-40">

                          <div className="mb-1 flex items-center justify-between text-xs">

                            <span>78%</span>

                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">

                            <div
                              className="h-full bg-cyan-400"
                              style={{
                                width: '78%',
                              }}
                            />

                          </div>

                        </div>

                      </td>

                      <td className="px-4 py-3">
                        MC-02
                      </td>

                      <td className="px-4 py-3">

                        <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
                          Đang chạy
                        </span>

                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          </div>

          {/* RIGHT */}
          <div className="w-[360px] border-l border-zinc-800 bg-zinc-900 p-4 overflow-auto">

            <h3 className="mb-4 text-lg font-semibold">
              Telemetry máy
            </h3>

            <div className="space-y-4">

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">

                <p className="text-xs text-zinc-500">
                  Máy đang chọn
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  MC-02
                </h2>

              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">

                <p className="text-xs text-zinc-500">
                  Nhiệt độ
                </p>

                <h2 className="mt-2 text-2xl font-bold text-orange-400">
                  72°C
                </h2>

              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">

                <p className="text-xs text-zinc-500">
                  Công suất
                </p>

                <h2 className="mt-2 text-2xl font-bold text-cyan-400">
                  84%
                </h2>

              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">

                <h4 className="mb-4 font-semibold">
                  Vật tư tiêu hao
                </h4>

                <div className="space-y-3">

                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">

                    <div className="flex items-center justify-between">

                      <div>

                        <h5 className="font-medium">
                          Dây hàn
                        </h5>

                        <p className="text-xs text-zinc-500">
                          128kg hôm nay
                        </p>

                      </div>

                      <span className="rounded-full bg-orange-500/20 px-2 py-1 text-xs text-orange-400">
                        Cao
                      </span>

                    </div>

                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">

                    <div className="flex items-center justify-between">

                      <div>

                        <h5 className="font-medium">
                          Gas CO2
                        </h5>

                        <p className="text-xs text-zinc-500">
                          82 bình
                        </p>

                      </div>

                      <span className="rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-400">
                        Bình thường
                      </span>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}
