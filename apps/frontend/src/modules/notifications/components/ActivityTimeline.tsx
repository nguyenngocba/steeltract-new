const activities = [
  {
    title: 'Xuất kho vật tư',
    description: 'Beam H400 → Xưởng',
    time: '08:20',
  },
  {
    title: 'Di chuyển cấu kiện',
    description: 'Zone A2 → Zone D1',
    time: '08:12',
  },
  {
    title: 'QC hoàn thành',
    description: 'CK-220 đạt chuẩn',
    time: '08:05',
  },
  {
    title: 'Robot hàn active',
    description: 'Machine MC-03 online',
    time: '07:58',
  },
]

export function ActivityTimeline() {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">

      <div className="mb-6 flex items-center justify-between">

        <div>

          <h2 className="text-2xl font-bold text-white">
            Activity Timeline
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Operational event stream
          </p>

        </div>

        <div className="flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-2">

          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />

          <span className="text-xs font-medium text-emerald-400">
            LIVE
          </span>

        </div>

      </div>

      <div className="space-y-6">

        {activities.map((activity, index) => (
          <div
            key={index}
            className="flex gap-4"
          >

            {/* DOT */}
            <div className="flex flex-col items-center">

              <div className="h-4 w-4 rounded-full bg-cyan-400" />

              {index !== activities.length - 1 && (
                <div className="mt-2 h-16 w-[2px] bg-zinc-700" />
              )}

            </div>

            {/* CONTENT */}
            <div className="flex-1">

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">

                <div className="flex items-center justify-between">

                  <h3 className="font-semibold text-white">
                    {activity.title}
                  </h3>

                  <span className="text-xs text-zinc-500">
                    {activity.time}
                  </span>

                </div>

                <p className="mt-2 text-sm text-zinc-400">
                  {activity.description}
                </p>

              </div>

            </div>

          </div>
        ))}

      </div>

    </div>
  )
}
