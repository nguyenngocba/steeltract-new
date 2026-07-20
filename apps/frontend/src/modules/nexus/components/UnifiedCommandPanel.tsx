const commands = [
  'Tối ưu điều phối logistics',
  'Cân bằng tải sản xuất',
  'Theo dõi rủi ro mua hàng',
  'Phân tích cảnh báo hệ thống',
  'Mô phỏng quy trình điều xe',
]

export function UnifiedCommandPanel() {
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
        <div className="text-xs uppercase tracking-[0.2em] text-pink-400">
          Bảng lệnh điều hành
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Các thao tác phân tích nhanh cho đội vận hành.
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {commands.map((command) => (
          <button
            key={command}
            className="
              flex
              w-full
              items-center
              justify-between
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
              text-left
              transition-all
              hover:border-pink-500
            "
          >
            <div className="text-sm text-white">
              {command}
            </div>

            <div className="text-pink-400">
              →
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
