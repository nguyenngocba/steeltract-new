const events = [
  {
    runtime: 'Kho vật tư',
    fix: 'Đồng bộ dữ liệu đã ổn định',
  },

  {
    runtime: 'Kênh cập nhật trực tiếp',
    fix: 'Kết nối đã được khôi phục',
  },

  {
    runtime: 'Quy trình vận hành',
    fix: 'Tắc nghẽn thực thi đã được xử lý',
  },

  {
    runtime: 'Phân tích vận hành',
    fix: 'Dòng dữ liệu theo dõi đã phục hồi',
  },
]

export function SelfHealingPanel() {
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
          Phục hồi vận hành tự động
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Theo dõi các tình huống đã được hệ thống khôi phục an toàn.
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {events.map((event) => (
          <div
            key={event.runtime}
            className="
              rounded-xl
              border
              border-zinc-800
              bg-zinc-950
              p-4
            "
          >
            <div className="text-sm font-bold text-white">
              {event.runtime}
            </div>

            <div className="mt-2 text-sm text-zinc-500">
              {event.fix}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
