const runtimes = [
  'Nền tảng lõi',
  'Tự động hóa',
  'Mô phỏng vận hành',
  'Quy trình',
  'Trợ lý điều hành',
  'Kết nối hệ thống',
]

export function NeuralTopologyPanel() {
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
          Bản đồ kết nối vận hành
        </div>

        <div className="mt-1 text-sm text-zinc-500">
          Một góc nhìn thống nhất cho các năng lực điều hành doanh nghiệp.
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        {runtimes.map((runtime, index) => (
          <div
            key={runtime}
            className="flex items-center gap-4"
          >
            <div
              className="
                rounded-2xl
                border
                border-zinc-800
                bg-zinc-950
                px-5
                py-4
                text-sm
                font-bold
                text-white
              "
            >
              {runtime}
            </div>

            {index !== runtimes.length - 1 && (
              <div className="text-pink-400">
                ⇄
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
