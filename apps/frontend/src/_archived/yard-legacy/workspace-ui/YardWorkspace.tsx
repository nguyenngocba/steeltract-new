import { useState } from 'react'
import { Yard2DMap } from '../ui/maps/Yard2DMap'
import { Yard3DMap } from '../ui/maps/Yard3DMap'

const tabs = [
  'Tổng quan',
  'Bản đồ 2D',
  'Bản đồ 3D',
  'Nhập bãi',
  'Xuất bãi',
  'Di chuyển',
  'Theo dõi',
  'Heatmap',
  'Lịch sử',
]

const slots = [
  { id: 'A1', status: 'full', level: 3 },
  { id: 'A2', status: 'medium', level: 2 },
  { id: 'A3', status: 'empty', level: 0 },
  { id: 'A4', status: 'full', level: 4 },
  { id: 'A5', status: 'warning', level: 5 },
  { id: 'A6', status: 'medium', level: 2 },
  { id: 'A7', status: 'empty', level: 0 },
  { id: 'A8', status: 'full', level: 3 },
]

export function YardWorkspace() {
  const [activeTab, setActiveTab] = useState('Bản đồ 2D')

  return (
    <div className="flex h-screen bg-zinc-950 text-white">

      {/* MAIN */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* HEADER */}
        <div className="border-b border-zinc-800 bg-zinc-900 px-6 py-4">

          <div className="flex items-center justify-between">

            <div>
              <h1 className="text-3xl font-bold">
                Bãi tập kết
              </h1>

              <p className="mt-1 text-sm text-zinc-400">
                Yard Digital Twin Command Center
              </p>
            </div>

            <div className="flex gap-3">

              <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium">
                Nhập bãi
              </button>

              <button className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium">
                Xuất bãi
              </button>

              <button className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-medium">
                Di chuyển
              </button>

            </div>

          </div>

        </div>

        {/* KPI */}
        <div className="grid grid-cols-5 gap-4 border-b border-zinc-800 bg-zinc-950 p-4">

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs uppercase text-zinc-500">
              Tổng zone
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              42
            </h2>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs uppercase text-zinc-500">
              Đang sử dụng
            </p>

            <h2 className="mt-3 text-3xl font-bold text-cyan-400">
              68%
            </h2>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs uppercase text-zinc-500">
              Slot đầy
            </p>

            <h2 className="mt-3 text-3xl font-bold text-orange-400">
              118
            </h2>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs uppercase text-zinc-500">
              Xe nâng hoạt động
            </p>

            <h2 className="mt-3 text-3xl font-bold text-emerald-400">
              12
            </h2>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs uppercase text-zinc-500">
              Cảnh báo
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

          {/* MAP */}
          <div className="flex flex-1 flex-col overflow-hidden p-4">

            {/* TOOLBAR */}
            <div className="mb-4 flex items-center gap-3">

              <button className="rounded-xl bg-zinc-800 px-4 py-2 text-sm">
                2D
              </button>

              <button className="rounded-xl bg-zinc-800 px-4 py-2 text-sm">
                3D
              </button>

              <button className="rounded-xl bg-zinc-800 px-4 py-2 text-sm">
                Heatmap
              </button>

              <button className="rounded-xl bg-zinc-800 px-4 py-2 text-sm">
                Fullscreen
              </button>

            </div>


            {activeTab === 'Bản đồ 2D' && (
              <Yard2DMap />
            )}

            {activeTab === 'Bản đồ 3D' && (
              <Yard3DMap />
            )}



                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`relative h-36 rounded-2xl border p-4 transition hover:scale-[1.02] ${
                      slot.status === 'full'
                        ? 'border-orange-500 bg-orange-500/10'
                        : slot.status === 'medium'
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : slot.status === 'warning'
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-zinc-700 bg-zinc-950'
                    }`}
                  >

                    {/* SLOT */}
                    <div className="flex items-center justify-between">

                      <h3 className="text-lg font-bold">
                        {slot.id}
                      </h3>

                      <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs">
                        T{slot.level}
                      </span>

                    </div>

                    {/* CONTENT */}
                    <div className="mt-5 space-y-2">

                      <div className="h-3 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full ${
                            slot.status === 'full'
                              ? 'bg-orange-500'
                              : slot.status === 'medium'
                              ? 'bg-cyan-500'
                              : slot.status === 'warning'
                              ? 'bg-red-500'
                              : 'bg-zinc-700'
                          }`}
                          style={{
                            width:
                              slot.status === 'full'
                                ? '90%'
                                : slot.status === 'medium'
                                ? '60%'
                                : slot.status === 'warning'
                                ? '100%'
                                : '10%',
                          }}
                        />
                      </div>

                      <p className="text-xs text-zinc-400">
                        H400 / Plate / Beam
                      </p>

                      <p className="text-xs text-zinc-500">
                        128 cấu kiện
                      </p>

                    </div>

                    {/* LEVELS */}
                    <div className="absolute bottom-3 right-3 flex gap-1">

                      {[1,2,3,4,5].map((lv) => (
                        <div
                          key={lv}
                          className={`h-2 w-6 rounded-full ${
                            lv <= slot.level
                              ? 'bg-blue-500'
                              : 'bg-zinc-700'
                          }`}
                        />
                      ))}

                    </div>

                  </div>
                ))}

              </div>

            </div>

          </div>

          {/* RIGHT */}
          <div className="w-[360px] border-l border-zinc-800 bg-zinc-900 p-4 overflow-auto">

            <h3 className="mb-4 text-lg font-semibold">
              Thông tin vị trí
            </h3>

            <div className="space-y-4">

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">

                <p className="text-xs text-zinc-500">
                  Zone đang chọn
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  A1
                </h2>

              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">

                <p className="text-xs text-zinc-500">
                  Tầng xếp hiện tại
                </p>

                <h2 className="mt-2 text-2xl font-bold text-cyan-400">
                  3 tầng
                </h2>

              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">

                <p className="text-xs text-zinc-500">
                  Tỷ lệ sử dụng
                </p>

                <h2 className="mt-2 text-2xl font-bold text-orange-400">
                  92%
                </h2>

              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">

                <h4 className="mb-4 font-semibold">
                  Vật liệu hiện tại
                </h4>

                <div className="space-y-3">

                  {[1,2,3].map((i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-zinc-800 bg-zinc-900 p-3"
                    >

                      <div className="flex items-center justify-between">

                        <div>
                          <h5 className="font-medium">
                            H400 Beam
                          </h5>

                          <p className="text-xs text-zinc-500">
                            28 cây
                          </p>
                        </div>

                        <span className="rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-400">
                          Tầng {i}
                        </span>

                      </div>

                    </div>
                  ))}

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}
