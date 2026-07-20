const metrics = [
  {
    label: 'Tín hiệu vận hành',
    value: 'Theo dõi',
  },

  {
    label: 'Workspace liên kết',
    value: 'Đang kết nối',
  },

  {
    label: 'Phân tích trợ lý',
    value: 'Sẵn sàng',
  },

  {
    label: 'Điều phối trung tâm',
    value: 'Sẵn sàng',
  },
]

export function GlobalCognitionGrid() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="
            rounded-2xl
            border
            border-zinc-800
            bg-zinc-900
            p-5
          "
        >
          <div className="text-sm text-zinc-500">
            {metric.label}
          </div>

          <div className="mt-4 text-3xl font-black text-white">
            {metric.value}
          </div>
        </div>
      ))}
    </div>
  )
}
