import {
  useNotifications,
} from './notification.store'

export function NotificationCenter() {

  const {
    notifications,
  } = useNotifications()

  return (
    <div className="fixed right-5 top-5 z-[9999] space-y-4">

      {notifications.map((item: any) => (

        <div
          key={item.id}
          className={`w-[360px] rounded-3xl border p-5 shadow-2xl backdrop-blur ${
            item.type === 'error'

              ? 'border-red-500/30 bg-red-500/10'

              : item.type === 'warning'

              ? 'border-orange-500/30 bg-orange-500/10'

              : 'border-cyan-500/30 bg-zinc-950/95'
          }`}
        >

          <div className="flex items-center justify-between">

            <div className="text-sm font-bold text-white">

              {item.title}

            </div>

            <div className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-wide ${
              item.type === 'error'

                ? 'bg-red-500/20 text-red-400'

                : item.type === 'warning'

                ? 'bg-orange-500/20 text-orange-400'

                : 'bg-cyan-500/20 text-cyan-400'
            }`}>

              {item.type || 'info'}

            </div>

          </div>

          <div className="mt-3 text-xs text-zinc-400">

            {item.description}

          </div>

        </div>

      ))}

    </div>
  )
}
