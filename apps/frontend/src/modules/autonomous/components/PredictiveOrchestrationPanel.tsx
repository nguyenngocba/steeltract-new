const orchestrations = [
  {
    runtime: 'Sản xuất',
    optimization:
      'Đề xuất điều phối tải xưởng khi có dữ liệu kế hoạch',
  },

  {
    runtime: 'Kho vật tư',
    optimization:
      'Theo dõi rủi ro bổ sung vật tư từ tồn kho',
  },

  {
    runtime: 'Điều xe',
    optimization:
      'Sắp xếp thứ tự chất xe khi có lệnh giao hàng',
  },

  {
    runtime: 'QC',
    optimization:
      'Ưu tiên phiếu kiểm khi phát sinh cảnh báo chất lượng',
  },
]

export function PredictiveOrchestrationPanel() {
  return (
    <div
      className="
        rounded-2xl
        border
        border-zinc-800
        bg-zinc-900
        p-6
      "
    >
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-orange-400">
          Đề xuất điều phối
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Gợi ý vận hành dựa trên dữ liệu hiện có của từng module.
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {orchestrations.map((item) => (
          <div
            key={item.runtime}
            className="
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div className="text-sm font-bold text-white">
              {item.runtime}
            </div>

            <div className="mt-2 text-sm text-zinc-500">
              {item.optimization}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
